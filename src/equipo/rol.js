/* Rol del equipo a partir de la respuesta de
   `supabase.from("staff").select("rol").eq("user_id", uid).maybeSingle()`.

   OJO: esto es UX (a qué pantalla mandar a cada quien), NO seguridad. La
   seguridad real es la RLS del servidor (0008/0009): aunque alguien fuerce
   este gate en su navegador, Postgres le niega editar productos, mover
   órdenes o ver comprobantes si no está en `staff`. */

export const ROLES = ["admin", "barista"];

/* → { rol: "admin" | "barista" | null, error: boolean, motivo }
   `error: true` = no se pudo LEER el rol (red, timeout, 5xx, permisos): el
   acceso se niega igual, pero la UI ofrece reintentar en vez de decir "tu
   cuenta no tiene acceso" (hallazgo del code review: con Wi-Fi inestable,
   un fallo transitorio dejaba al barista en un "Sin acceso" definitivo).
   Todo error deniega, sin excepciones: el fallback provisional para "tabla
   staff ausente" se retiró el 01/oct/2026, con 0008 ya en producción. */
export function resolverRol({ data, error } = {}) {
  if (error) return { rol: null, error: true, motivo: "error al leer el rol" };
  if (data && ROLES.includes(data.rol)) return { rol: data.rol, error: false, motivo: "staff" };
  return { rol: null, error: false, motivo: "sin fila en staff" };
}

/* A qué vista va cada rol. `pedido` sale de la URL (#barra / #admin). */
export function vistaInicial(rol, pedido) {
  if (rol === "barista") return "barra";
  if (rol === "admin") return pedido === "barra" || pedido === "admin" ? pedido : "selector";
  return null;
}
