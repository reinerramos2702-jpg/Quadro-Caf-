/* Comparación de medidas visuales (audit:visual, 06/oct/2026).
 *
 * `medidas` tiene la forma { [ancho]: { [pantalla]: { [elemento]: caja | null } } },
 * donde `caja` = { w, h, fontSize, lineHeight, letterSpacing, fontFamily, fontWeight }
 * tal como los devuelve getComputedStyle (px como texto) y getBoundingClientRect.
 *
 * Lógica pura (sin navegador) para poder testearla con `npm test`. */

// Cajas: se compara el tamaño y la tipografía. Textos: solo la tipografía,
// porque su ancho y su alto dependen del texto que muestran (en el detalle,
// el h1 de main es el nombre y el de la rama es la categoría).
export const PROPS_CAJA = ["w", "h", "fontSize", "lineHeight", "letterSpacing", "fontFamily", "fontWeight"];
export const PROPS_TEXTO = ["fontSize", "lineHeight", "letterSpacing", "fontFamily", "fontWeight"];
export const ELEMENTOS_TEXTO = new Set(["nombre", "precio", "etiqueta", "h1", "descripcion"]);

const numero = (v) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string" || !/^-?\d+(\.\d+)?(px)?$/.test(v.trim())) return null;
  return parseFloat(v);
};

// "a:b:c" contra un patrón con comodines "*" por segmento.
export function coincide(patron, clave) {
  const p = patron.split(":"), c = clave.split(":");
  if (p.length !== c.length) return false;
  return p.every((seg, i) => {
    if (seg === "*") return true;
    if (!seg.includes("*")) return seg === c[i];
    const re = new RegExp(`^${seg.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
    return re.test(c[i]);
  });
}

export function iguales(a, b, tolerancia = 0.5) {
  if (a === b) return true;
  const na = numero(a), nb = numero(b);
  if (na != null && nb != null) return Math.abs(na - nb) <= tolerancia;
  // Familias: se compara la lista sin comillas ni espacios.
  if (typeof a === "string" && typeof b === "string") {
    const norm = (s) => s.replace(/["']/g, "").replace(/\s*,\s*/g, ",").trim().toLowerCase();
    return norm(a) === norm(b);
  }
  return false;
}

/* Devuelve una fila por propiedad distinta:
 * { ancho, pantalla, elemento, prop, main, rama, intencional }. */
export function compararMedidas(base, actual, { tolerancia = 0.5, intencionales = [] } = {}) {
  const diffs = [];
  const esIntencional = (pantalla, elemento, prop) => intencionales.some((p) => coincide(p, `${pantalla}:${elemento}:${prop}`));
  for (const ancho of Object.keys(base)) {
    for (const pantalla of Object.keys(base[ancho] || {})) {
      const b = base[ancho][pantalla] || {};
      const a = actual?.[ancho]?.[pantalla] || {};
      const elementos = new Set([...Object.keys(b), ...Object.keys(a)]);
      for (const elemento of elementos) {
        const cb = b[elemento] ?? null, ca = a[elemento] ?? null;
        if (!cb && !ca) continue;
        if (!cb || !ca) {
          diffs.push({ ancho, pantalla, elemento, prop: "presente", main: !!cb, rama: !!ca, intencional: esIntencional(pantalla, elemento, "presente") });
          continue;
        }
        const props = ELEMENTOS_TEXTO.has(elemento) ? PROPS_TEXTO : PROPS_CAJA;
        for (const prop of props) {
          if (iguales(cb[prop], ca[prop], tolerancia)) continue;
          diffs.push({ ancho, pantalla, elemento, prop, main: cb[prop], rama: ca[prop], intencional: esIntencional(pantalla, elemento, prop) });
        }
      }
    }
  }
  return diffs;
}

const fmt = (v) => (typeof v === "number" ? String(Math.round(v * 100) / 100) : String(v));

export function formatearDiff(diffs) {
  if (!diffs.length) return "Sin diferencias con main.";
  return diffs
    .map((d) => `${d.intencional ? "  (intencional) " : "✗ "}${d.pantalla} · ${d.ancho} px · ${d.elemento} · ${d.prop}: ${fmt(d.main)} → ${fmt(d.rama)}`)
    .join("\n");
}

/* Rectángulos táctiles de un grupo de vecinos que se pisan (más de 0,5 px
 * en los dos ejes). Cada rect: { x, y, w, h, id }. */
export function solapes(rects, margen = 0.5) {
  const out = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (dx > margen && dy > margen) out.push([a.id, b.id, Math.round(Math.min(dx, dy) * 10) / 10]);
    }
  }
  return out;
}
