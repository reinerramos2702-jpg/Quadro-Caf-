// CORS de verificar-comprobante: solo responde con Access-Control-Allow-Origin
// a los orígenes de la app. JS puro (sin Deno ni npm) para poder testearlo con
// `node --test` en CI; index.ts lo importa tal cual.
//
// Ojo: CORS solo frena a un NAVEGADOR en otro sitio; un `curl` puede mandar el
// Origin que quiera. El freno real al gasto de Gemini es el tope por hora de
// index.ts (OCR_MAX_POR_HORA) más las validaciones de orden de siempre.

export const ORIGENES_POR_DEFECTO = [
  "https://quadro-cafe.reinerramos2702.workers.dev",
  // versiones de vista previa de Cloudflare Workers (<id>-quadro-cafe.…)
  "https://*-quadro-cafe.reinerramos2702.workers.dev",
  "http://localhost:5173",
  "http://localhost:4173",
];

// ALLOWED_ORIGINS (secret opcional, lista separada por comas) reemplaza la
// lista por defecto. Un "*" dentro de una entrada vale por un subdominio
// [a-z0-9-]+ (nunca por puntos ni barras).
export function origenesPermitidos(valor) {
  const lista = String(valor || "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  return lista.length ? lista : ORIGENES_POR_DEFECTO;
}

const aRegex = (patron) => new RegExp("^" + patron.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[a-z0-9-]+") + "$", "i");

export function origenPermitido(origen, permitidos) {
  if (!origen) return false;
  return permitidos.some((p) => (p.includes("*") ? aRegex(p).test(origen) : p.toLowerCase() === origen.toLowerCase()));
}

// Un pedido CON Origin que no está en la lista se rechaza (403). Sin Origin
// (no es un navegador) se deja pasar: CORS no aplica y lo frena el tope.
export function origenRechazado(origen, permitidos) {
  return !!origen && !origenPermitido(origen, permitidos);
}

export function cabecerasCors(origen, permitidos) {
  const base = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  return origenPermitido(origen, permitidos) ? { ...base, "Access-Control-Allow-Origin": origen } : base;
}
