import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapearProducto, fusionarCarta } from "../src/lib/carta.js";

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

const APP = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("useCarta pasa por fusionarCarta → mapearProducto (no un mapeo inline que pueda perder campos)", () => {
  assert.match(APP, /setItems\(fusionarCarta\(data, MENU\)\)/);
});

const MENU_FIX = [
  { id: "m1", cat: "Filtrado", nombre: "V60 de origen", precio: 4.5 },
  { id: "m13", cat: "Espresso", nombre: "Americano", precio: 0, disponible: false, nuevo: true },
  { id: "m14", cat: "Espresso", nombre: "Capuchino", precio: 0, disponible: false, nuevo: true },
];

test("fusión: reales de Supabase + placeholders nuevo:true que no están en la base", () => {
  const carta = fusionarCarta(FILAS, MENU_FIX);
  assert.deepEqual(carta.map((p) => p.id), ["m1", "m9", "m13", "m14"]);
  // un producto real del MENU local (sin nuevo) nunca se duplica
  assert.equal(carta.filter((p) => p.id === "m1").length, 1);
  assert.ok(carta.every((p) => Number.isFinite(p.precio)));
});

test("fusión: un placeholder se retira cuando la base trae su id o su nombre", () => {
  const conId = [...FILAS, { ...FILAS[0], id: "m13", nombre: "Americano real", precio: "2.00" }];
  assert.ok(!fusionarCarta(conId, MENU_FIX).some((p) => p.id === "m13" && p.nuevo));
  // el Admin crea ids slug: coincide por nombre normalizado (mayúsculas/tildes)
  const conNombre = [...FILAS, { ...FILAS[0], id: "capuchino", nombre: "CAPUCHINO", precio: "3.50" }];
  const carta = fusionarCarta(conNombre, MENU_FIX);
  assert.ok(!carta.some((p) => p.id === "m14"));
  assert.equal(carta.find((p) => p.id === "capuchino").precio, 3.5);
});

test("con las 12 filas reales de hoy la Carta queda en 12 + 45 placeholders", () => {
  const placeholders = (APP.match(/nuevo: true \}/g) || []).length;
  assert.equal(placeholders, 45);
  const reales12 = Array.from({ length: 12 }, (_, i) => ({ ...FILAS[0], id: `m${i + 1}`, nombre: `Real ${i + 1}` }));
  const menu = [...reales12.map((r) => ({ id: r.id, nombre: r.nombre })),
    ...Array.from({ length: placeholders }, (_, i) => ({ id: `m${i + 13}`, nombre: `Nuevo ${i}`, nuevo: true }))];
  assert.equal(fusionarCarta(reales12, menu).length, 57);
});
