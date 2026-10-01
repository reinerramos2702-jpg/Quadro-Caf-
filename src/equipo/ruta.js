/* ¿Esta URL es del equipo (login + Barra/Admin) o del cliente? Puro, para
   testearlo sin navegador. Lo usa main.jsx una sola vez al cargar.

   Del equipo:
     /equipo (path real: Cloudflare y Vite hacen fallback SPA a index.html)
     #equipo · #barra · #admin       (accesos de siempre, siguen andando)
     ?equipo=1 · ?barra=1 · ?admin=1  (vuelta del enlace de recuperación de
                                       clave; los dos últimos son enlaces
                                       viejos que pueden seguir en correos)
     …#…type=recovery                 (Supabase pisa el hash con el token)
   El cliente (todo lo demás) nunca ve un login. */
export function rutaEquipo({ pathname = "/", hash = "", search = "" } = {}) {
  const q = new URLSearchParams(search);
  const h = hash.replace(/^#/, "");
  const recuperacion = /(^|&)type=recovery(&|$)/.test(h);
  const pedido = h === "barra" || q.get("barra") === "1" ? "barra"
    : h === "admin" || q.get("admin") === "1" ? "admin"
    : null;
  const esEquipo = pathname === "/equipo" || pathname.startsWith("/equipo/")
    || h === "equipo" || pedido !== null || q.get("equipo") === "1" || recuperacion;
  return { esEquipo, pedido, recuperacion };
}
