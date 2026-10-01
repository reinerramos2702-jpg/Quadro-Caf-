/* Lógica pura de la tarjeta de producto de la Carta (Carta premium · PR-1).
   Sin React ni DOM, para testearla con `node --test`. App.jsx la usa en
   ProductCard, DetalleProducto y Menu. */

/* Estado único de un producto, en orden de prioridad:
   - "proximamente": placeholder `nuevo:true` o sin precio válido (> 0). Es
     también el estado "precio por confirmar": nunca se muestra $0.00.
   - "agotado": `disponible === false` (lo apaga el Panel Admin).
   - "personalizable": se pide eligiendo finca y taza (`finca: true`, V60…).
   - "disponible": todo lo demás. */
export function estadoProducto(m) {
  if (!m) return "proximamente";
  const precio = Number(m.precio);
  if (m.nuevo === true || !Number.isFinite(precio) || precio <= 0) return "proximamente";
  if (m.disponible === false) return "agotado";
  if (m.finca) return "personalizable";
  return "disponible";
}

/* Qué muestra la tarjeta según el estado. Una sola fuente de verdad para
   ProductCard: así nunca aparecen dos etiquetas "por confirmar" a la vez. */
export function vistaTarjeta(estado) {
  return {
    pillFoto: estado === "proximamente" ? "Próximamente" : estado === "agotado" ? "Agotado hoy" : null,
    precio: estado !== "proximamente",
    porConfirmar: estado === "proximamente",
    agregar: estado === "disponible" || estado === "personalizable",
    abreSelector: estado === "personalizable",
    desaturar: estado === "agotado",
  };
}

/* id de asset de la foto del producto, o null si no hay (o si el mapa
   apunta a un asset que no está en el manifiesto): la tarjeta pinta el
   monograma de marca en vez de un hueco. */
export function fotoDeProducto(id, mapa, manifiesto) {
  const asset = mapa?.[id];
  return asset && manifiesto?.[asset] ? asset : null;
}

/* Posición de la lista para volver del detalle al mismo lugar. Se guarda en
   sessionStorage (además del ref en memoria) con vencimiento, y todo acceso
   va en try/catch: en modo privado o con el almacenamiento bloqueado,
   simplemente no se restaura. */
export const CLAVE_POSICION = "qc-carta-pos";
export const VENCE_POSICION_MS = 30 * 60 * 1000;

export function guardarPosicion(storage, pos, ahora = Date.now()) {
  try {
    storage?.setItem(CLAVE_POSICION, JSON.stringify({ ...pos, t: ahora }));
    return true;
  } catch {
    return false;
  }
}

export function leerPosicion(storage, ahora = Date.now(), vence = VENCE_POSICION_MS) {
  try {
    const crudo = storage?.getItem(CLAVE_POSICION);
    if (!crudo) return null;
    const pos = JSON.parse(crudo);
    if (!pos || typeof pos !== "object" || !Number.isFinite(pos.t) || ahora - pos.t > vence) return null;
    if (!Number.isFinite(pos.scrollTop) || typeof pos.cat !== "string") return null;
    return pos;
  } catch {
    return null;
  }
}

export function borrarPosicion(storage) {
  try { storage?.removeItem(CLAVE_POSICION); } catch { /* sin almacenamiento */ }
}

/* scrollTop a restaurar si el contenido cambió mientras se veía el detalle:
   nunca más allá del final real de la lista (lo más cercano, sin romper). */
export function scrollRestaurable(pos, alturaTotal, alturaVisible) {
  const max = Math.max(0, alturaTotal - alturaVisible);
  return Math.min(Math.max(0, pos?.scrollTop || 0), max);
}
