import { test } from "node:test";
import assert from "node:assert/strict";
import { parsearAgenteDid, SCRIPT_AGENTE_DID } from "../src/lib/did.js";

const URL_AGUA_FRIA = "https://studio.d-id.com/agents/share?id=v2_agt_UyhXfVTo&key=Y2tfRWlCRVlEcTE3RlFlSThtSWc1dngw";

test("link de share de D-ID → agentId + clientKey (key en base64)", () => {
  const a = parsearAgenteDid(URL_AGUA_FRIA);
  assert.equal(a.agentId, "v2_agt_UyhXfVTo");
  assert.match(a.clientKey, /^ck_/);
  assert.equal(a.clientKey, Buffer.from("Y2tfRWlCRVlEcTE3RlFlSThtSWc1dngw", "base64").toString());
});

test("link inválido, sin id/key o de otro dominio → null (la UI cae al fallback)", () => {
  for (const url of [
    undefined, "", "no-es-url",
    "https://studio.d-id.com/agents/share?id=v2_agt_UyhXfVTo",
    "https://studio.d-id.com/agents/share?key=Y2tfRWlCRVlEcTE3RlFlSThtSWc1dngw",
    "https://evil.example.com/agents/share?id=v2_agt_UyhXfVTo&key=Y2tfRWlCRVlEcTE3RlFlSThtSWc1dngw",
    "https://studio.d-id.com/agents/share?id=v2_agt_UyhXfVTo&key=%%%",
  ]) assert.equal(parsearAgenteDid(url), null, String(url));
});

test("client key del snippet de Embed (Studio) reemplaza la del link de share", () => {
  const a = parsearAgenteDid(URL_AGUA_FRIA, "ck_embedDeStudio");
  assert.deepEqual(a, { agentId: "v2_agt_UyhXfVTo", clientKey: "ck_embedDeStudio" });
  assert.equal(parsearAgenteDid(URL_AGUA_FRIA, "").clientKey.startsWith("ck_E"), true, "vacío → la del link");
});

test("el SDK se carga del CDN oficial de D-ID, nunca de la página de share (frame-ancestors 'self')", () => {
  assert.equal(new URL(SCRIPT_AGENTE_DID).host, "agent.d-id.com");
});
