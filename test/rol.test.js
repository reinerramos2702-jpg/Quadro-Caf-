import { test } from "node:test";
import assert from "node:assert/strict";
import { resolverRol, esTablaStaffAusente, vistaInicial } from "../src/equipo/rol.js";

// Respuesta real de Supabase (01/oct/2026, GET /rest/v1/staff sin la tabla).
const PGRST205_STAFF = { code: "PGRST205", details: null, hint: null, message: "Could not find the table 'public.staff' in the schema cache" };

test("tabla staff ausente con PGRST205 → fallback admin (legacy)", () => {
  assert.ok(esTablaStaffAusente(PGRST205_STAFF));
  assert.deepEqual(resolverRol({ error: PGRST205_STAFF }), { rol: "admin", legacy: true, motivo: "tabla staff ausente (0008 sin aplicar)" });
});

test("tabla staff ausente con 42P01 → fallback admin (legacy)", () => {
  for (const message of ['relation "public.staff" does not exist', 'relation "staff" does not exist']) {
    const r = resolverRol({ error: { code: "42P01", message } });
    assert.equal(r.rol, "admin");
    assert.equal(r.legacy, true);
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
    assert.equal(r.legacy, false);
  }
});

test("PGRST205 o 42P01 de OTRA tabla → acceso denegado", () => {
  for (const error of [
    { code: "PGRST205", message: "Could not find the table 'public.ordenes' in the schema cache" },
    { code: "PGRST205", message: "Could not find the table 'public.staff_viejo' in the schema cache" },
    { code: "PGRST205", message: "Could not find the table 'public.mi_staff' in the schema cache" },
    { code: "42P01", message: 'relation "public.staffing" does not exist' },
  ]) {
    assert.equal(esTablaStaffAusente(error), false, error.message);
    assert.equal(resolverRol({ error }).rol, null, error.message);
  }
});

test("permisos u otro código que nombre staff → acceso denegado", () => {
  assert.equal(resolverRol({ error: { code: "42501", message: "permission denied for table staff" } }).rol, null);
  assert.equal(resolverRol({ error: { code: "PGRST301", message: "JWT expired", details: "staff" } }).rol, null);
});

test("con la tabla: rol según la fila; sin fila o rol raro → denegado", () => {
  assert.deepEqual(resolverRol({ data: { rol: "admin" } }), { rol: "admin", legacy: false, motivo: "staff" });
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
