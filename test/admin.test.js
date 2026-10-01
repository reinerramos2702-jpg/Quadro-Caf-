import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizar, filtrarProductos, contarProductos, textoContador, categoriasDe, parsearPrecio } from "../src/equipo/adminLogica.js";

const P = [
  { id: "m1", cat: "Filtrado", nombre: "V60 de origen", disponible: false },
  { id: "m3", cat: "Filtrado", nombre: "Sifón a la mesa", disponible: true },
  { id: "m5", cat: "Espresso", nombre: "Cortado", disponible: true },
  { id: "m9", cat: "Panadería", nombre: "Croissant de mantequilla", disponible: true },
  { id: "m11", cat: "Postres", nombre: "Tarta de café y nuez", disponible: false },
  { id: "x1", cat: "Rara", nombre: "Algo", disponible: true },
];
const CATS = ["Filtrado", "Espresso", "Frío", "Infusiones", "Bollería", "Postres"];

test("normalizar: minúsculas, sin acentos ni espacios de sobra", () => {
  assert.equal(normalizar("  SIFÓN  a la Mésa "), "sifon a la mesa");
  assert.equal(normalizar(undefined), "");
});

test("búsqueda por nombre, insensible a acentos y mayúsculas", () => {
  assert.deepEqual(filtrarProductos(P, { texto: "sifon" }).map((p) => p.id), ["m3"]);
  assert.deepEqual(filtrarProductos(P, { texto: "CAFE" }).map((p) => p.id), ["m11"]);
  assert.equal(filtrarProductos(P, { texto: "   " }).length, P.length, "solo espacios = sin filtro");
  assert.equal(filtrarProductos(P, { texto: "no existe" }).length, 0);
});

test("filtro por categoría y combinado con búsqueda", () => {
  assert.deepEqual(filtrarProductos(P, { cat: "Filtrado" }).map((p) => p.id), ["m1", "m3"]);
  assert.deepEqual(filtrarProductos(P, { cat: "Filtrado", texto: "v60" }).map((p) => p.id), ["m1"]);
  assert.equal(filtrarProductos(P, { cat: null }).length, P.length);
  assert.equal(filtrarProductos(P).length, P.length);
});

test("contador: N productos · M disponibles, con singular", () => {
  assert.deepEqual(contarProductos(P), { total: 6, disponibles: 4 });
  assert.equal(textoContador(contarProductos(P)), "6 productos · 4 disponibles");
  assert.equal(textoContador({ total: 1, disponibles: 1 }), "1 producto · 1 disponible");
  assert.equal(textoContador(contarProductos([])), "0 productos · 0 disponibles");
});

test("categorías presentes: orden de la Carta primero, luego las desconocidas (p. ej. Panadería antes de 0003)", () => {
  assert.deepEqual(categoriasDe(P, CATS), ["Filtrado", "Espresso", "Postres", "Panadería", "Rara"]);
  assert.deepEqual(categoriasDe([], CATS), []);
});

test("'Panadería' no aparece en ningún lado: el Admin la muestra como 'Bollería', en su lugar de la Carta", async () => {
  const { normalizarCategoria } = await import("../src/lib/carta.js");
  const { filasParaAdmin } = await import("../src/equipo/adminLogica.js");
  assert.equal(normalizarCategoria("Panadería"), "Bollería");
  assert.equal(normalizarCategoria("Postres"), "Postres");
  const filas = filasParaAdmin(P);
  assert.equal(filas.find((p) => p.id === "m9").cat, "Bollería");
  assert.equal(P.find((p) => p.id === "m9").cat, "Panadería", "no muta las filas originales");
  assert.deepEqual(categoriasDe(filas, CATS), ["Filtrado", "Espresso", "Bollería", "Postres", "Rara"]);
  assert.ok(!categoriasDe(filas, CATS).includes("Panadería"));
});

test("precio: acepta coma, $ y espacios; rechaza vacío, negativo y no numérico", () => {
  assert.equal(parsearPrecio("4,5"), 4.5);
  assert.equal(parsearPrecio(" $ 4.50 "), 4.5);
  assert.equal(parsearPrecio("3.333"), 3.33);
  assert.equal(parsearPrecio("0"), 0);
  for (const malo of ["", "  ", "abc", "-1", "4.5.1", "1e3x", null, undefined, "100000"]) assert.equal(parsearPrecio(malo), null, String(malo));
});
