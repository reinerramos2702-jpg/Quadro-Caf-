import { test } from "node:test";
import assert from "node:assert/strict";
import { compararMedidas, coincide, iguales, formatearDiff, solapes } from "../scripts/lib/medidas.js";

const caja = (o = {}) => ({ w: 30, h: 30, fontSize: "11px", lineHeight: "normal", letterSpacing: "0.88px", fontFamily: "Nexa, sans-serif", fontWeight: "700", ...o });

test("coincide: comodines por segmento", () => {
  assert.ok(coincide("carta-*:miniatura:*", "carta-lista:miniatura:w"));
  assert.ok(coincide("*:nav:*", "inicio:nav:h"));
  assert.ok(!coincide("carta-*:miniatura:*", "inicio:miniatura:w"));
  assert.ok(!coincide("a:b", "a:b:c"));
});

test("iguales: tolerancia numérica y familias sin comillas", () => {
  assert.ok(iguales("15px", "15.4px"));
  assert.ok(!iguales("15px", "16px"));
  assert.ok(iguales(30, 30.3));
  assert.ok(iguales(`"Nexa", sans-serif`, "Nexa,sans-serif"));
  assert.ok(!iguales("normal", "18px"));
});

test("compararMedidas: sin cambios no hay filas", () => {
  const m = { 360: { carta: { mas: caja() } } };
  assert.deepEqual(compararMedidas(m, structuredClone(m)), []);
});

test("compararMedidas: detecta tamaño y marca lo intencional", () => {
  const base = { 360: { "carta-lista": { mas: caja(), miniatura: caja({ w: 64, h: 64 }) } } };
  const rama = { 360: { "carta-lista": { mas: caja({ w: 44, h: 44 }), miniatura: caja({ w: 96, h: 96 }) } } };
  const d = compararMedidas(base, rama, { intencionales: ["carta-*:miniatura:*"] });
  assert.equal(d.filter((x) => !x.intencional).length, 2);
  assert.equal(d.filter((x) => x.intencional).length, 2);
  assert.match(formatearDiff(d), /✗ carta-lista · 360 px · mas · w: 30 → 44/);
});

test("compararMedidas: en textos solo compara tipografía", () => {
  const base = { 390: { "carta-detalle": { h1: caja({ w: 200, h: 60, fontSize: "30px" }) } } };
  const rama = { 390: { "carta-detalle": { h1: caja({ w: 120, h: 30, fontSize: "30px" }) } } };
  assert.deepEqual(compararMedidas(base, rama), []);
});

test("compararMedidas: elemento que falta en un lado", () => {
  const d = compararMedidas({ 412: { inicio: { flecha: caja() } } }, { 412: { inicio: {} } });
  assert.equal(d.length, 1);
  assert.equal(d[0].prop, "presente");
});

test("solapes: vecinos que se tocan no cuentan, los que se pisan sí", () => {
  const r = (id, x) => ({ id, x, y: 0, w: 44, h: 44 });
  assert.deepEqual(solapes([r("a", 0), r("b", 44)]), []);
  assert.equal(solapes([r("a", 0), r("b", 40)]).length, 1);
});
