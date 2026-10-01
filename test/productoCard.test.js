import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estadoProducto, vistaTarjeta, fotoDeProducto,
  guardarPosicion, leerPosicion, borrarPosicion, scrollRestaurable,
  CLAVE_POSICION, VENCE_POSICION_MS,
} from "../src/lib/productoCard.js";

// sessionStorage de mentira, y otro que tira (modo privado / bloqueado).
function memoria() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
const roto = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
  removeItem() { throw new Error("SecurityError"); },
};

test("estado: placeholder nuevo → próximamente aunque tenga precio", () => {
  assert.equal(estadoProducto({ nuevo: true, precio: 0, disponible: false }), "proximamente");
  assert.equal(estadoProducto({ nuevo: true, precio: 3, disponible: true }), "proximamente");
});

test("estado: sin precio válido → próximamente (nunca $0.00)", () => {
  for (const precio of [0, -1, NaN, undefined, "abc"]) {
    assert.equal(estadoProducto({ precio, disponible: true }), "proximamente", String(precio));
  }
  assert.equal(estadoProducto(null), "proximamente");
});

test("estado: disponible:false con precio → agotado (gana sobre personalizable)", () => {
  assert.equal(estadoProducto({ precio: 5, disponible: false, finca: true }), "agotado");
});

test("estado: finca → personalizable; si no, disponible", () => {
  assert.equal(estadoProducto({ precio: 4.5, disponible: true, finca: true }), "personalizable");
  assert.equal(estadoProducto({ precio: 2.5, finca: false }), "disponible");
  assert.equal(estadoProducto({ precio: "4.20", disponible: true }), "disponible");
});

test("vista: una sola etiqueta 'por confirmar' y sin '+' en próximamente", () => {
  const v = vistaTarjeta("proximamente");
  assert.equal(v.porConfirmar, true);
  assert.equal(v.precio, false);
  assert.equal(v.agregar, false);
  assert.equal(v.pillFoto, "Próximamente");
});

test("vista: agotado desatura, muestra precio, sin '+'", () => {
  const v = vistaTarjeta("agotado");
  assert.deepEqual([v.desaturar, v.precio, v.agregar, v.porConfirmar, v.pillFoto], [true, true, false, false, "Agotado hoy"]);
});

test("vista: personalizable abre el selector; disponible agrega directo", () => {
  assert.equal(vistaTarjeta("personalizable").abreSelector, true);
  assert.equal(vistaTarjeta("personalizable").agregar, true);
  assert.equal(vistaTarjeta("disponible").abreSelector, false);
  assert.equal(vistaTarjeta("disponible").pillFoto, null);
});

test("foto: usa el mapa solo si el asset existe en el manifiesto", () => {
  const mapa = { m4: "producto-espresso", m9: "producto-fantasma" };
  const manifiesto = { "producto-espresso": {} };
  assert.equal(fotoDeProducto("m4", mapa, manifiesto), "producto-espresso");
  assert.equal(fotoDeProducto("m9", mapa, manifiesto), null);
  assert.equal(fotoDeProducto("m1", mapa, manifiesto), null);
  assert.equal(fotoDeProducto("m4", undefined, manifiesto), null);
});

test("posición: guardar y leer devuelve lo mismo", () => {
  const s = memoria();
  assert.equal(guardarPosicion(s, { cat: "Postres", scrollTop: 812, id: "m46" }, 1000), true);
  assert.deepEqual(leerPosicion(s, 2000), { cat: "Postres", scrollTop: 812, id: "m46", t: 1000 });
});

test("posición: vence a los 30 min", () => {
  const s = memoria();
  guardarPosicion(s, { cat: "Frío", scrollTop: 10 }, 0);
  assert.ok(leerPosicion(s, VENCE_POSICION_MS));
  assert.equal(leerPosicion(s, VENCE_POSICION_MS + 1), null);
});

test("posición: datos corruptos o incompletos → null", () => {
  const s = memoria();
  s.setItem(CLAVE_POSICION, "{no es json");
  assert.equal(leerPosicion(s, 0), null);
  s.setItem(CLAVE_POSICION, JSON.stringify({ t: 0, cat: "Frío" }));
  assert.equal(leerPosicion(s, 0), null);
});

test("posición: almacenamiento bloqueado nunca tira", () => {
  assert.equal(guardarPosicion(roto, { cat: "Frío", scrollTop: 1 }), false);
  assert.equal(leerPosicion(roto), null);
  assert.doesNotThrow(() => borrarPosicion(roto));
  assert.equal(leerPosicion(undefined), null);
});

test("posición: borrar la quita", () => {
  const s = memoria();
  guardarPosicion(s, { cat: "Frío", scrollTop: 1 }, 0);
  borrarPosicion(s);
  assert.equal(leerPosicion(s, 0), null);
});

test("restaurar: se acota al final real si la lista se achicó", () => {
  assert.equal(scrollRestaurable({ scrollTop: 900 }, 2000, 600), 900);
  assert.equal(scrollRestaurable({ scrollTop: 900 }, 1200, 600), 600);
  assert.equal(scrollRestaurable({ scrollTop: -5 }, 1200, 600), 0);
  assert.equal(scrollRestaurable(null, 300, 600), 0);
});
