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
