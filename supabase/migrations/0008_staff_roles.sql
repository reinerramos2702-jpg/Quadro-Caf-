-- Quadro Café — Login del equipo: roles reales (barista / admin).
--
-- Hoy todo lo "de staff" (editar productos, mover órdenes, leer comprobantes)
-- está abierto a cualquier usuario `authenticated`. Si alguien consiguiera
-- una cuenta en Auth (signup abierto, invitación por error), tendría el Panel
-- Admin completo. Esta migración crea los roles; 0009 los aplica a la RLS.
--
-- Es ADITIVA: tabla nueva + 2 funciones nuevas + siembra. No cambia ninguna
-- policy existente, así que la app funciona igual antes y después.
--
-- Qué hace:
--   1. Tabla `staff` (user_id → auth.users, rol 'barista' | 'admin').
--      RLS: cada usuario puede leer SOLO su propia fila (la usa el cliente
--      para saber a qué pantalla mandarlo). Nadie escribe por la API: las
--      altas/bajas las hace Reiner desde el SQL Editor (plantilla abajo).
--   2. `es_staff()` / `es_admin()`: SECURITY DEFINER, `stable`, search_path
--      fijo. Solo `authenticated` puede ejecutarlas.
--   3. SIEMBRA: Reiner (reinerramos2702@gmail.com, la única cuenta de Auth al
--      01/oct/2026, confirmado por SELECT) como admin. Si el email no existe
--      no inserta nada — y 0009 se niega a correr (candado).
--   4. Endurecimiento que pedían los advisors de Supabase:
--      · search_path fijo en set_actualizado_en() y limpiar_comprobante_en_insert();
--      · EXECUTE revocado a public/anon/authenticated en las dos funciones
--        SECURITY DEFINER de trigger (asignar_numero_orden,
--        marcar_comprobante_subido), que hoy se podían llamar por
--        /rest/v1/rpc/. Los triggers siguen disparando igual: el privilegio
--        de EXECUTE no se revisa al disparar un trigger.
--
-- Verificación después de aplicarla (ANTES de 0009):
--   select s.rol, u.email from staff s join auth.users u on u.id = s.user_id;
--   → 1 fila: admin · reinerramos2702@gmail.com
--
-- Plantilla para dar de alta un barista (después de crear su usuario en
-- Authentication → Users):
--   insert into staff (user_id, rol)
--   select id, 'barista' from auth.users where lower(email) = lower('<email>')
--   on conflict (user_id) do update set rol = excluded.rol;
-- Baja: delete from staff where user_id = (select id from auth.users where lower(email) = lower('<email>'));
--
-- Reversión (solo si 0009 NO está aplicada, o después de revertir 0009):
--   drop function if exists es_admin(); drop function if exists es_staff();
--   drop table if exists staff;
--   alter function set_actualizado_en() reset search_path;
--   alter function limpiar_comprobante_en_insert() reset search_path;
--   grant execute on function asignar_numero_orden() to public, anon, authenticated;
--   grant execute on function marcar_comprobante_subido() to public, anon, authenticated;

-- ── 1. Tabla staff ──────────────────────────────────────────────────────────
create table if not exists staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null check (rol in ('barista', 'admin')),
  creado_en timestamptz not null default now()
);

comment on table staff is 'Equipo con acceso a /equipo (Barra y Panel Admin). Altas/bajas desde el SQL Editor (0008).';

alter table staff enable row level security;

drop policy if exists "staff_lectura_propia" on staff;
create policy "staff_lectura_propia"
  on staff for select
  to authenticated
  using (user_id = auth.uid());
-- Sin policies de escritura: la API nunca puede crear, cambiar ni borrar roles.

revoke all on table staff from anon;
revoke insert, update, delete on table staff from authenticated;

-- ── 2. Funciones de rol ─────────────────────────────────────────────────────
create or replace function es_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

create or replace function es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where user_id = auth.uid() and rol = 'admin');
$$;

revoke all on function es_staff() from public, anon;
revoke all on function es_admin() from public, anon;
grant execute on function es_staff() to authenticated;
grant execute on function es_admin() to authenticated;

-- ── 3. Siembra: Reiner como admin ───────────────────────────────────────────
insert into staff (user_id, rol)
select id, 'admin' from auth.users where lower(email) = 'reinerramos2702@gmail.com'
on conflict (user_id) do update set rol = 'admin';

do $$
begin
  if not exists (select 1 from staff where rol = 'admin') then
    raise warning 'staff: no se sembró ningún admin (¿cambió el email?). NO apliques 0009 hasta corregirlo.';
  end if;
end $$;

-- ── 4. Endurecimiento de funciones existentes (advisors) ────────────────────
alter function set_actualizado_en() set search_path = public;
alter function limpiar_comprobante_en_insert() set search_path = public;

revoke execute on function asignar_numero_orden() from public, anon, authenticated;
revoke execute on function marcar_comprobante_subido() from public, anon, authenticated;
