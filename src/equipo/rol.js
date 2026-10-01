/* Rol del equipo a partir de la respuesta de
   `supabase.from("staff").select("rol").eq("user_id", uid).maybeSingle()`.

   OJO: esto es UX (a qué pantalla mandar a cada quien), NO seguridad. La
   seguridad real es la RLS del servidor (0008/0009): aunque alguien fuerce
   este gate en su navegador, Postgres le niega editar productos, mover
   órdenes o ver comprobantes si no está en `staff`. */

export const ROLES = ["admin", "barista"];

/* ¿El error dice que la tabla `staff` no existe? Solo dos códigos significan
   eso — PGRST205 (PostgREST: "Could not find the table 'public.staff' in the
   schema cache", lo que devuelve Supabase hoy por la API) y 42P01 (Postgres:
   relation "public.staff" does not exist) — y además el mensaje/detalle
   tiene que nombrar ESA tabla. Cualquier otra cosa (red, permisos, timeout,
   otra tabla ausente) no es "tabla ausente". */
const NOMBRA_STAFF = /(^|[\s'"`(])(public\.)?staff(?=['"`)\s]|$)/i;

export function esTablaStaffAusente(error) {
  if (!error || (error.code !== "PGRST205" && error.code !== "42P01")) return false;
  const texto = `${error.message || ""} ${error.details || ""}`;
  return NOMBRA_STAFF.test(texto);
}

/* → { rol: "admin" | "barista" | null, legacy: boolean, error: boolean, motivo }
   `error: true` = no se pudo LEER el rol (red, timeout, 5xx, permisos): el
   acceso se niega igual, pero la UI ofrece reintentar en vez de decir "tu
   cuenta no tiene acceso" (hallazgo del code review: con Wi-Fi inestable,
   un fallo transitorio dejaba al barista en un "Sin acceso" definitivo). */
export function resolverRol({ data, error } = {}) {
  if (error) {
    // TODO(0008): retirar este fallback en cuanto 0008_staff_roles.sql esté
    // aplicada en producción (ver docs/PROGRESO-LOOP.md, iteración 5). Existe
    // solo para que el merge no deje a Reiner sin Barra/Admin si llega antes
    // que la migración: sin la tabla, la RLS vigente sigue siendo la de
    // siempre ("cualquier authenticated"), así que esto no abre nada nuevo.
    if (esTablaStaffAusente(error)) return { rol: "admin", legacy: true, error: false, motivo: "tabla staff ausente (0008 sin aplicar)" };
    return { rol: null, legacy: false, error: true, motivo: "error al leer el rol" };
  }
  if (data && ROLES.includes(data.rol)) return { rol: data.rol, legacy: false, error: false, motivo: "staff" };
  return { rol: null, legacy: false, error: false, motivo: "sin fila en staff" };
}

/* A qué vista va cada rol. `pedido` sale de la URL (#barra / #admin). */
export function vistaInicial(rol, pedido) {
  if (rol === "barista") return "barra";
  if (rol === "admin") return pedido === "barra" || pedido === "admin" ? pedido : "selector";
  return null;
}
