// Quadro Café — Reunión 05/sept, punto 13: OCR del comprobante de pago.
//
// La llama el carrito (fire-and-forget) después de subir
// comprobantes/{orden_id}.jpg. Lee la imagen con service role, se la pasa a
// Gemini pidiendo JSON estructurado y deja el resultado en la orden:
//   verificado  → el monto leído (USD) coincide con ordenes.total
//   revisar     → no coincide, otra moneda (p. ej. Bs de Pago móvil) o dudoso
//   sin_lectura → no es un comprobante, no se pudo leer, o el OCR falló
// Pase lo que pase, el pedido ya está en barra: esto nunca lo bloquea.
//
// verify_jwt = false a propósito: el proyecto usa publishable keys nuevas
// (sb_publishable_…), que no son JWT. La autorización es propia y acotada:
// la orden tiene que existir, ser de los últimos 30 min y estar en
// comprobante_estado = 'pendiente' (o sea: tiene archivo subido y todavía no
// se procesó). Cada orden se procesa una sola vez.
//
// Secretos (los carga el dueño, nunca van en el código):
//   GEMINI_API_KEY   — obligatorio (Google AI Studio)
//   GEMINI_MODEL     — opcional, default "gemini-2.5-flash"
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo.

import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const VENTANA_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 20_000;

const PROMPT = `Eres un asistente que lee comprobantes de pago (capturas de apps bancarias,
Pago Móvil, Zelle, transferencias o Binance Pay) para una cafetería en Venezuela.
Extrae SOLO lo que se lee en la imagen, sin inventar. Si la imagen no es un
comprobante de pago, marca es_comprobante=false. "moneda" debe ser "USD", "VES",
"USDT" u otro código ISO; si no se ve, null. "monto" es el monto transferido como
número (punto decimal, sin separadores de miles). "referencia" es el número de
referencia/confirmación tal cual aparece. "confianza" va de 0 a 1.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    es_comprobante: { type: "BOOLEAN" },
    monto: { type: "NUMBER", nullable: true },
    moneda: { type: "STRING", nullable: true },
    referencia: { type: "STRING", nullable: true },
    fecha: { type: "STRING", nullable: true },
    metodo: { type: "STRING", nullable: true },
    banco: { type: "STRING", nullable: true },
    confianza: { type: "NUMBER" },
  },
  required: ["es_comprobante", "confianza"],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);

  let ordenId = "";
  try { ordenId = String((await req.json())?.orden_id || ""); } catch { /* body inválido */ }
  if (!UUID.test(ordenId)) return json({ error: "orden_id inválido" }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: orden } = await sb.from("ordenes")
    .select("id, total, creado_en, comprobante_estado").eq("id", ordenId).maybeSingle();
  if (!orden) return json({ error: "orden no encontrada" }, 404);
  if (orden.comprobante_estado !== "pendiente") return json({ error: "sin comprobante pendiente" }, 409);
  if (Date.now() - new Date(orden.creado_en).getTime() > VENTANA_MS) return json({ error: "orden vencida" }, 410);

  // Deja el resultado final en ordenes (mínimo, lectura pública) y el
  // detalle completo en comprobantes (solo staff).
  const cerrar = async (estado: string, detalle: Record<string, unknown>, monto: number | null = null, ref: string | null = null) => {
    await sb.from("ordenes").update({
      comprobante_estado: estado,
      comprobante_monto: monto,
      comprobante_ref: ref ? ref.replace(/\s+/g, "").slice(-4) : null,
    }).eq("id", ordenId).eq("comprobante_estado", "pendiente");
    await sb.from("comprobantes").update({ detalle, actualizado_en: new Date().toISOString() }).eq("orden_id", ordenId);
    return json({ estado });
  };

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return cerrar("sin_lectura", { motivo: "GEMINI_API_KEY no configurada" });

  const { data: archivo, error: errDescarga } = await sb.storage.from("comprobantes").download(`${ordenId}.jpg`);
  if (errDescarga || !archivo) return cerrar("sin_lectura", { motivo: "no se pudo descargar la imagen" });
  const b64 = encodeBase64(new Uint8Array(await archivo.arrayBuffer()));

  const modelo = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let lectura: Record<string, unknown>;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: b64 } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
      }),
    });
    if (!r.ok) return cerrar("sin_lectura", { motivo: `Gemini respondió ${r.status}`, modelo });
    const cuerpo = await r.json();
    lectura = JSON.parse(cuerpo?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  } catch (e) {
    return cerrar("sin_lectura", { motivo: ctrl.signal.aborted ? "timeout" : `error OCR: ${e}`, modelo });
  } finally {
    clearTimeout(corte);
  }

  const detalle = { ...lectura, modelo, total_orden: Number(orden.total) };
  const monto = typeof lectura.monto === "number" ? lectura.monto : null;
  const ref = typeof lectura.referencia === "string" ? lectura.referencia : null;
  if (!lectura.es_comprobante || monto == null) return cerrar("sin_lectura", detalle, null, ref);

  // Solo se compara contra el total cuando la moneda es dólar (USD o USDT de
  // Binance). En bolívares el monto depende de la tasa del día — eso lo decide
  // la barra, no el OCR.
  const moneda = String(lectura.moneda || "").toUpperCase();
  const enDolares = moneda === "USD" || moneda === "USDT";
  const coincide = enDolares && Math.abs(monto - Number(orden.total)) < 0.01;
  const confiable = Number(lectura.confianza ?? 0) >= 0.6;
  return cerrar(coincide && confiable ? "verificado" : "revisar", detalle, enDolares ? monto : null, ref);
});
