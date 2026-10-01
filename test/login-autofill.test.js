import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// LoginEquipo.jsx es JSX (Node no lo importa): se revisa el CSS como texto.
const fuente = readFileSync(new URL("../src/equipo/LoginEquipo.jsx", import.meta.url), "utf8");
const css = fuente.slice(fuente.indexOf("export const CSS_EQUIPO"), fuente.indexOf("`;", fuente.indexOf("export const CSS_EQUIPO")));
const reglas = (sel) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, s]) => s.includes(sel)).map(([, s, cuerpo]) => ({ s, cuerpo }));

test("autocompletado: el fondo del navegador se tapa con sombra inset opaca (no con una transición)", () => {
  const r = reglas(":-webkit-autofill");
  assert.ok(r.length, "falta la regla :-webkit-autofill");
  const { s, cuerpo } = r[0];
  for (const estado of [":hover", ":focus", ":active"]) assert.ok(s.includes(`:-webkit-autofill${estado}`), `falta ${estado}`);
  assert.match(cuerpo, /box-shadow:0 0 0 1000px [^;]+ inset/);
  assert.match(cuerpo, /-webkit-text-fill-color:var\(--eq-hueso\)/);
  assert.match(cuerpo, /caret-color:var\(--eq-hueso\)/);
});

test("autocompletado: también la pseudo-clase estándar :autofill", () => {
  assert.ok(reglas(".eq-input:autofill").length);
});

test("CSS del login sin hex ni blur (colores solo vía --eq-* de PALETAS)", () => {
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(css, /blur\(|backdrop-filter/);
});
