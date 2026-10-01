import { test } from "node:test";
import assert from "node:assert/strict";
import { resolverRol, vistaInicial } from "../src/equipo/rol.js";

// Respuesta real de Supabase (01/oct/2026, GET /rest/v1/staff sin la tabla).
const PGRST205_STAFF = { code: "PGRST205", details: null, hint: null, message: "Could not find the table 'public.staff' in the schema cache" };

// El fallback TODO(0008) se retiró con 0008 en producción: una tabla staff
// ausente ya no da admin, es un error de lectura más (deniega + reintentar).
test("tabla staff ausente (PGRST205 o 42P01) → acceso denegado, sin fallback", () => {
  for (const error of [PGRST205_STAFF, { code: "42P01", message: 'relation "public.staff" does not exist' }]) {
    assert.deepEqual(resolverRol({ error }), { rol: null, error: true, motivo: "error al leer el rol" });
  }
});

test("error de red → acceso denegado", () => {
  for (const error of [
    { message: "TypeError: Failed to fetch", details: "", code: "" },
    { name: "AbortError", message: "The operation was aborted" },
    { code: "PGRST000", message: "Could not connect to the database" },
  ]) {
    const r = resolverRol({ error });
    assert.equal(r.rol, null, JSON.stringify(error));
    assert.equal(r.error, true, "error de lectura → la UI ofrece reintentar");
  }
});

test("permisos u otro código que nombre staff → acceso denegado", () => {
  assert.equal(resolverRol({ error: { code: "42501", message: "permission denied for table staff" } }).rol, null);
  assert.equal(resolverRol({ error: { code: "PGRST301", message: "JWT expired", details: "staff" } }).rol, null);
});

test("con la tabla: rol según la fila; sin fila o rol raro → denegado", () => {
  assert.deepEqual(resolverRol({ data: { rol: "admin" } }), { rol: "admin", error: false, motivo: "staff" });
  assert.equal(resolverRol({ data: null }).error, false, "sin fila = sin acceso real, no error");
  assert.equal(resolverRol({ data: { rol: "barista" } }).rol, "barista");
  assert.equal(resolverRol({ data: null }).rol, null);
  assert.equal(resolverRol({ data: { rol: "dueño" } }).rol, null);
  assert.equal(resolverRol().rol, null);
});

test("vista inicial: barista siempre a barra; admin respeta #barra/#admin o va al selector", () => {
  assert.equal(vistaInicial("barista", "admin"), "barra");
  assert.equal(vistaInicial("admin", "admin"), "admin");
  assert.equal(vistaInicial("admin", "barra"), "barra");
  assert.equal(vistaInicial("admin", null), "selector");
  assert.equal(vistaInicial(null, "admin"), null);
});
