/* Lógica pura del Panel Admin (búsqueda, filtro, contador, precio).
   Sin React ni Supabase: se prueba con `npm test` (test/admin.test.js). */
import { normalizarCategoria } from "../lib/carta.js";

/* Filas de `productos` tal como las muestra el Admin: "Panadería" → "Bollería"
   (solo visual; el Admin nunca escribe `cat` al editar precio/disponible). */
export const filasParaAdmin = (filas) => filas.map((p) => ({ ...p, cat: normalizarCategoria(p.cat) }));

export const normalizar = (s) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/* Búsqueda por nombre (sin acentos ni mayúsculas) + categoría exacta. */
export function filtrarProductos(productos, { texto = "", cat = null } = {}) {
  const q = normalizar(texto);
  return productos.filter((p) => (!cat || p.cat === cat) && (!q || normalizar(p.nombre).includes(q)));
}

export function contarProductos(productos) {
  return { total: productos.length, disponibles: productos.filter((p) => p.disponible).length };
}

export function textoContador({ total, disponibles }) {
  return `${total} ${total === 1 ? "producto" : "productos"} · ${disponibles} ${disponibles === 1 ? "disponible" : "disponibles"}`;
}

/* Categorías que existen en la base, en el orden de la Carta; las que no
   están en `orden` van al final. */
export function categoriasDe(productos, orden = []) {
  const presentes = [...new Set(productos.map((p) => p.cat).filter(Boolean))];
  const conocidas = orden.filter((c) => presentes.includes(c));
  return [...conocidas, ...presentes.filter((c) => !orden.includes(c)).sort((a, b) => a.localeCompare(b, "es"))];
}

/* "4,5" / "$ 4.50" → 4.5 (2 decimales). null si está vacío, no es un número,
   es negativo o es absurdo (≥ 10000) para una carta de café. */
export function parsearPrecio(texto) {
  const limpio = String(texto ?? "").replace(/[$\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  const n = Math.round(Number(limpio) * 100) / 100;
  return Number.isFinite(n) && n >= 0 && n < 10000 ? n : null;
}
