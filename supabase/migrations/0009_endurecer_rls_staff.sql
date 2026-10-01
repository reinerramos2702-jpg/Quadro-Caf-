-- Quadro Café — Login del equipo: la RLS pasa de "cualquier authenticated" a
-- roles reales (0008). ENDURECIMIENTO: nada queda más abierto que antes.
--
-- ⚠ ORDEN OBLIGATORIO: aplicar SOLO después de 0008 y de verificar por
-- lectura que Reiner quedó sembrado como admin:
--   select s.rol, u.email from staff s join auth.users u on u.id = s.user_id;
-- Sin esa fila, esta migración dejaría a Reiner sin Panel Admin ni Barra. Por
-- eso empieza con un CANDADO: si no hay ningún admin en `staff`, aborta antes
-- de tocar nada (es la primera sentencia, así que no queda nada a medias).
--
-- Qué cambia:
--   productos  · escritura (insert/update/delete): authenticated → es_admin()
--   ordenes    · update: authenticated → es_staff()  (barista y admin)
--              · además, a nivel de columna, `authenticated` solo puede
--                modificar estado y comprobante_*: ni el staff puede reescribir
--                total, items, nombre ni método de un pedido ya hecho. La edge
--                function usa service role y no se ve afectada.
--   comprobantes          · lectura: authenticated → es_staff()
--   storage (comprobantes)· lectura/signed URL: authenticated → es_staff()
--
-- Qué NO cambia (a propósito, pedido de Reiner):
--   ordenes_lectura_publica, ordenes_insercion_publica (pedidos de clientes)
--   y comprobantes_subida_cliente (subida del comprobante por el cliente).
--
-- Verificación después de aplicarla:
--   1. Entrar a /equipo con la cuenta de Reiner → Panel Admin: cambiar y
--      restaurar el precio de un producto; Barra: avanzar una orden de prueba.
--   2. select tablename, policyname, roles, qual from pg_policies
--       where schemaname in ('public','storage') order by 1, 2;
--   3. Advisors de seguridad (ya no deberían aparecer las funciones de 0008).
--
-- Reversión (vuelve exactamente al estado de 0001/0002/0005):
--   drop policy if exists "productos_escritura_admin" on productos;
--   create policy "productos_escritura_autenticada" on productos for all to authenticated using (true) with check (true);
--   drop policy if exists "ordenes_actualizacion_staff" on ordenes;
--   create policy "ordenes_actualizacion_autenticada" on ordenes for update to authenticated using (true) with check (true);
--   grant update on table ordenes to authenticated;
--   drop policy if exists "comprobantes_lectura_staff" on comprobantes;
--   create policy "comprobantes_lectura_staff" on comprobantes for select to authenticated using (true);
--   drop policy if exists "comprobantes_lectura_staff" on storage.objects;
--   create policy "comprobantes_lectura_staff" on storage.objects for select to authenticated using (bucket_id = 'comprobantes');

-- ── Candado ─────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.staff') is null then
    raise exception '0009 abortada: falta 0008 (tabla staff). No se cambió nada.';
  end if;
  if not exists (select 1 from staff where rol = 'admin') then
    raise exception '0009 abortada: no hay ningún admin en staff. Verifica la siembra de 0008. No se cambió nada.';
  end if;
end $$;

-- ── productos: escribir solo admin ──────────────────────────────────────────
drop policy if exists "productos_escritura_autenticada" on productos;
drop policy if exists "productos_escritura_admin" on productos;
create policy "productos_escritura_admin"
  on productos for all
  to authenticated
  using (es_admin())
  with check (es_admin());

-- ── ordenes: mover estado solo staff, y solo esas columnas ──────────────────
drop policy if exists "ordenes_actualizacion_autenticada" on ordenes;
drop policy if exists "ordenes_actualizacion_staff" on ordenes;
create policy "ordenes_actualizacion_staff"
  on ordenes for update
  to authenticated
  using (es_staff())
  with check (es_staff());

revoke update on table ordenes from authenticated;
grant update (estado, comprobante_estado, comprobante_monto, comprobante_ref) on table ordenes to authenticated;

-- ── comprobantes (detalle del OCR): leer solo staff ─────────────────────────
drop policy if exists "comprobantes_lectura_staff" on comprobantes;
create policy "comprobantes_lectura_staff"
  on comprobantes for select
  to authenticated
  using (es_staff());

-- ── storage: ver la imagen del comprobante solo staff ───────────────────────
drop policy if exists "comprobantes_lectura_staff" on storage.objects;
create policy "comprobantes_lectura_staff"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'comprobantes' and es_staff());
