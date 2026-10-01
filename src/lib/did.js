/* Agente conversacional de D-ID (avatar de José Tomás en Fincas).

   Por qué no hay iframe: desde ~sept/2026 la página de share de D-ID responde
   `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: frame-ancestors
   'self'`, así que Chrome bloquea el iframe desde cualquier dominio
   ("studio.d-id.com ha rechazado la conexión", net::ERR_BLOCKED_BY_RESPONSE).
   El camino soportado es el SDK de embed oficial: se carga el script del CDN
   de D-ID y se inicia con `window.DID_AGENT_INIT(...)`, que el script expone
   cuando la página no tiene un `<script data-name="did-agent">` (nuestro caso:
   se carga recién al abrir el overlay).

   La client key del SDK es pública (viaja en el link de share) y D-ID la
   restringe por dominio: la API responde 401 a orígenes no autorizados en
   D-ID Studio → Agent → Embed → Allowed domains. Verificado 01/oct/2026 con
   tokens nuevos: la key del link de share solo pasa desde studio.d-id.com
   (OJO al probar: el authorizer de D-ID cachea por token el primer 200, así
   que un 401 → 200 en la misma prueba no prueba nada; usar un token nuevo). */

export const SCRIPT_AGENTE_DID = "https://agent.d-id.com/v2/index.js";

/* Link de share (`studio.d-id.com/agents/share?id=…&key=<base64>`) →
   { agentId, clientKey }, o null si no es un link de D-ID válido.
   `clientKeyEmbed` (opcional): la `data-client-key` del snippet de Embed de
   D-ID Studio. La key del link de share solo está autorizada para
   studio.d-id.com (verificado 01/oct: 401 desde workers.dev y localhost). */
export function parsearAgenteDid(url, clientKeyEmbed) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== "https:" || !/(^|\.)d-id\.com$/.test(u.hostname)) return null;
  const agentId = u.searchParams.get("id");
  const key = u.searchParams.get("key");
  if (!agentId || !key) return null;
  let clientKey;
  try { clientKey = atob(key); } catch { return null; }
  if (!/^[\x21-\x7e]+$/.test(clientKey)) return null;
  return { agentId, clientKey: clientKeyEmbed || clientKey };
}

let cargando = null;
/* Carga el script del SDK una sola vez y resuelve con `DID_AGENT_INIT`. */
export function cargarSdkDid() {
  if (window.DID_AGENT_INIT) return Promise.resolve(window.DID_AGENT_INIT);
  if (!cargando) {
    cargando = new Promise((ok, falla) => {
      const s = document.createElement("script");
      s.type = "module";
      s.src = SCRIPT_AGENTE_DID;
      s.onload = () => (window.DID_AGENT_INIT ? ok(window.DID_AGENT_INIT) : falla(new Error("SDK de D-ID sin DID_AGENT_INIT")));
      s.onerror = () => falla(new Error("No se pudo cargar el SDK de D-ID"));
      document.head.appendChild(s);
    }).catch((e) => { cargando = null; throw e; });
  }
  return cargando;
}
