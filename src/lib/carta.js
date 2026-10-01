/* Lógica pura de la Carta (sin React ni Supabase), para poder testearla con
   `node --test` sin levantar la app. App.jsx la usa en useCarta(). */

/* Fila de la tabla `productos` → forma que usan los componentes de la Carta.
   `precio` llega como string desde Postgres (numeric) y tiene que salir
   número: si no, money() pinta "$NaN" y el total del carrito sale NaN. */
export function mapearProducto(p) {
  return {
    id: p.id,
    // Compat: hasta correr 0003 la base todavía dice "Panadería".
    cat: p.cat === "Panadería" ? "Bollería" : p.cat,
    nombre: p.nombre,
    precio: Number(p.precio),
    desc: p.descripcion,
    tag: p.tag || undefined,
    geo: p.geo || undefined,
    finca: p.finca,
    disponible: p.disponible,
  };
}

const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/* Carta final = filas reales de Supabase + los placeholders "Próximamente"
   (`nuevo: true`) del MENU local que todavía no existen en la base.
   Supabase manda: un placeholder se retira solo en cuanto aparece en la base
   con el mismo id o con el mismo nombre (el Panel Admin crea ids tipo slug,
   así que el nombre es lo que normalmente va a coincidir). */
export function fusionarCarta(filasDB, menuLocal) {
  const reales = filasDB.map(mapearProducto);
  const ids = new Set(reales.map((p) => p.id));
  const nombres = new Set(reales.map((p) => normalizar(p.nombre)));
  const pendientes = menuLocal.filter((m) => m.nuevo && !ids.has(m.id) && !nombres.has(normalizar(m.nombre)));
  return [...reales, ...pendientes];
}
