import { test } from "node:test";
import assert from "node:assert/strict";
import { rutaEquipo } from "../src/equipo/ruta.js";

const r = (url) => {
  const u = new URL(url, "https://quadro.test");
  return rutaEquipo({ pathname: u.pathname, hash: u.hash, search: u.search });
};

test("cliente: la app normal nunca entra al equipo", () => {
  for (const url of ["/", "/?utm=ig", "/#inicio", "/equipos", "/?readmin=1", "/?admin=0"]) {
    assert.equal(r(url).esEquipo, false, url);
  }
});

test("/equipo y sus pedidos de vista", () => {
  assert.deepEqual(r("/equipo"), { esEquipo: true, pedido: null, recuperacion: false });
  assert.equal(r("/equipo#barra").pedido, "barra");
  assert.equal(r("/equipo#admin").pedido, "admin");
  assert.equal(r("/#equipo").esEquipo, true);
});

test("accesos de siempre (#barra, #admin) siguen llegando al equipo", () => {
  assert.deepEqual(r("/#barra"), { esEquipo: true, pedido: "barra", recuperacion: false });
  assert.deepEqual(r("/#admin"), { esEquipo: true, pedido: "admin", recuperacion: false });
});

test("vuelta del enlace de recuperación (nuevo y viejos)", () => {
  const nuevo = r("/?equipo=1#access_token=abc&expires_in=3600&type=recovery");
  assert.equal(nuevo.esEquipo, true);
  assert.equal(nuevo.recuperacion, true);
  assert.equal(r("/?admin=1#access_token=x&type=recovery").pedido, "admin");
  assert.equal(r("/?barra=1#access_token=x&type=recovery").pedido, "barra");
  assert.equal(r("/#access_token=x&type=recovery").esEquipo, true);
  assert.equal(r("/#access_token=x&type=signup").esEquipo, false);
});
