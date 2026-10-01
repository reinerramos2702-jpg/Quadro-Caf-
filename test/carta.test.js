import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapearProducto } from "../src/lib/carta.js";

// Filas con la misma forma que devuelve PostgREST para `productos`
// (numeric llega como string). Copia de dos filas reales de 0001.
const FILAS = [
  { id: "m1", cat: "Filtrado", nombre: "V60 de origen", precio: "4.50", descripcion: "60° C de servicio, 15 g, 250 ml. Elige finca.", tag: "Firma", geo: "espiral", finca: true, disponible: true, orden: 1 },
  { id: "m9", cat: "Panadería", nombre: "Croissant de mantequilla", precio: "2.80", descripcion: "Laminado de 3 días. Horneado a las 7:00.", tag: null, geo: null, finca: false, disponible: true, orden: 9 },
];

test("cada producto mapeado tiene precio numérico finito", () => {
  for (const fila of FILAS) {
    const p = mapearProducto(fila);
    assert.equal(typeof p.precio, "number", `${fila.id} sin precio numérico`);
    assert.ok(Number.isFinite(p.precio), `${fila.id} con precio no finito`);
  }
  assert.equal(mapearProducto(FILAS[0]).precio, 4.5);
});

test("el total de un carrito con productos de Supabase es un número", () => {
  const carrito = FILAS.map(mapearProducto);
  const total = carrito.reduce((s, i) => s + i.precio, 0);
  assert.ok(Number.isFinite(total));
  assert.equal(Math.round(total * 100) / 100, 7.3);
});

test("compat: 'Panadería' de la base se muestra como 'Bollería'", () => {
  assert.equal(mapearProducto(FILAS[1]).cat, "Bollería");
  assert.equal(mapearProducto(FILAS[0]).cat, "Filtrado");
});

test("campos opcionales nulos quedan undefined y descripcion pasa a desc", () => {
  const p = mapearProducto(FILAS[1]);
  assert.equal(p.tag, undefined);
  assert.equal(p.geo, undefined);
  assert.equal(p.desc, FILAS[1].descripcion);
});

test("useCarta usa mapearProducto (no un mapeo inline que pueda perder campos)", () => {
  const src = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(src, /data\.map\(mapearProducto\)/);
});
