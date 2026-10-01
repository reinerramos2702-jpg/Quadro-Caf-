import { test } from "node:test";
import assert from "node:assert/strict";
import { origenesPermitidos, origenPermitido, origenRechazado, cabecerasCors, ORIGENES_POR_DEFECTO } from "../supabase/functions/verificar-comprobante/origen.js";

const P = origenesPermitidos("");

test("sin ALLOWED_ORIGINS usa la lista por defecto", () => {
  assert.deepEqual(P, ORIGENES_POR_DEFECTO);
});

test("producción, vistas previas y localhost permitidos", () => {
  for (const o of ["https://quadro-cafe.reinerramos2702.workers.dev", "https://3f2a9c1d-quadro-cafe.reinerramos2702.workers.dev", "http://localhost:5173", "http://localhost:4173"]) {
    assert.ok(origenPermitido(o, P), o);
    assert.equal(cabecerasCors(o, P)["Access-Control-Allow-Origin"], o);
  }
});

test("otros orígenes: sin Allow-Origin y rechazados", () => {
  for (const o of [
    "https://evil.example", "https://quadro-cafe.reinerramos2702.workers.dev.evil.example",
    "https://x.y-quadro-cafe.reinerramos2702.workers.dev", "http://quadro-cafe.reinerramos2702.workers.dev",
    "https://evilquadro-cafe.reinerramos2702.workers.dev.attacker.io", "null",
  ]) {
    assert.equal(origenPermitido(o, P), false, o);
    assert.equal(origenRechazado(o, P), true, o);
    assert.equal(cabecerasCors(o, P)["Access-Control-Allow-Origin"], undefined, o);
  }
});

test("sin Origin (no es navegador) no se rechaza por CORS", () => {
  assert.equal(origenRechazado("", P), false);
  assert.equal(origenRechazado(null, P), false);
});

test("ALLOWED_ORIGINS reemplaza la lista y tolera espacios y barra final", () => {
  const p = origenesPermitidos(" https://app.quadrocafe.com/ , https://*.quadrocafe.com ");
  assert.ok(origenPermitido("https://app.quadrocafe.com", p));
  assert.ok(origenPermitido("https://staging.quadrocafe.com", p));
  assert.equal(origenPermitido("https://a.b.quadrocafe.com", p), false);
  assert.equal(origenPermitido("https://quadro-cafe.reinerramos2702.workers.dev", p), false);
});

test("siempre declara Vary: Origin", () => {
  assert.equal(cabecerasCors("https://evil.example", P).Vary, "Origin");
});
