-- Quadro Café — Bloque 8: tabla de órdenes reales para el dashboard de barra.
--
-- Cómo aplicar esta migración:
--   1. Abre el SQL Editor de tu proyecto en https://supabase.com/dashboard
--   2. Pega el contenido de este archivo completo y ejecútalo.
--   (No hay una CLI de Supabase disponible en este entorno para correrla por ti.)
--
-- Después de correrla, confirma en Database → Replication que la tabla
-- `ordenes` quedó dentro de la publicación `supabase_realtime` (el bloque de
-- abajo la agrega solo, pero conviene verificarlo una vez).

-- ── Contador diario, para numeración secuencial no aleatoria ────────────────
-- Una fila por día; el número de orden reinicia en 1 cada vez que cambia la
-- fecha porque simplemente empieza una fila nueva. `security definer` en la
-- función de abajo es lo que le permite a un cliente anónimo disparar este
-- incremento sin tener permiso directo de escritura sobre esta tabla — la
-- tabla en sí no tiene ninguna policy, así que queda inaccesible por la API
-- REST incluso para un usuario autenticado.
create table if not exists ordenes_contador (
  dia date primary key,
  contador integer not null default 0
);

alter table ordenes_contador enable row level security;
-- Sin policies: nadie accede vía la API de PostgREST directamente, solo el
-- trigger de abajo (que corre con los privilegios de su dueño).

-- ── Tabla de órdenes ─────────────────────────────────────────────────────────
create table if not exists ordenes (
  id uuid primary key default gen_random_uuid(),
  numero_orden integer not null,
  dia date not null default current_date,
  nombre_cliente text not null,
  destino text not null check (destino in ('aca', 'llevar')),
  items jsonb not null,
  total numeric(10, 2) not null,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'movil', 'zelle', 'transferencia')),
  estado text not null default 'recibido'
    check (estado in ('recibido', 'moliendo', 'extrayendo', 'listo', 'completada', 'cancelada')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table ordenes is 'Órdenes reales enviadas desde el carrito del cliente. La barra las trabaja desde /#barra.';
comment on column ordenes.numero_orden is 'Secuencial, asignado por el trigger asignar_numero_orden(). Reinicia en 1 cada día — no es aleatorio.';
comment on column ordenes.destino is 'Para acá / Para llevar, elegido por el cliente antes de enviar a barra.';
comment on column ordenes.items is 'Array de líneas del pedido: [{id, nombre, precio, cantidad, finca?, taza?}, ...]. Espejo de "filas" en el carrito.';
comment on column ordenes.estado is 'recibido→moliendo→extrayendo→listo→completada, avanzado a mano por el barista. cancelada = orden fantasma descartada.';

create index if not exists ordenes_cola_activa_idx on ordenes (estado, creado_en);

-- Mantiene actualizado_en al día (misma función que ya usa productos).
drop trigger if exists ordenes_actualizado_en on ordenes;
create trigger ordenes_actualizado_en
  before update on ordenes
  for each row
  execute function set_actualizado_en();

-- Asigna el número de orden secuencial diario de forma atómica (a prueba de
-- dos clientes pidiendo al mismo tiempo) antes de insertar la fila.
create or replace function asignar_numero_orden()
returns trigger as $$
declare
  n integer;
begin
  insert into ordenes_contador (dia, contador) values (current_date, 1)
  on conflict (dia) do update set contador = ordenes_contador.contador + 1
  returning contador into n;
  new.numero_orden := n;
  new.dia := current_date;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists ordenes_numero_orden on ordenes;
create trigger ordenes_numero_orden
  before insert on ordenes
  for each row
  execute function asignar_numero_orden();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table ordenes enable row level security;

-- Lectura pública: la necesita tanto el ticket del cliente (anon, escucha el
-- estado de SU orden por Realtime) como el dashboard de barra. Mismo patrón
-- que ya usa `productos` — la publishable key es segura de exponer, RLS es
-- el límite real. Si más adelante se quiere ocultar nombre/items de otros
-- clientes, esto se puede acotar a "solo tu propia fila" con una función que
-- lea un token guardado en localStorage; no se implementó porque no fue parte
-- del pedido y hoy no hay ningún dato sensible (no hay pagos ni contraseñas).
drop policy if exists "ordenes_lectura_publica" on ordenes;
create policy "ordenes_lectura_publica"
  on ordenes for select
  to anon, authenticated
  using (true);

-- Inserción pública: el carrito del cliente no requiere login.
drop policy if exists "ordenes_insercion_publica" on ordenes;
create policy "ordenes_insercion_publica"
  on ordenes for insert
  to anon, authenticated
  with check (true);

-- Actualización (avanzar estado, cancelar) solo para el staff autenticado.
drop policy if exists "ordenes_actualizacion_autenticada" on ordenes;
create policy "ordenes_actualizacion_autenticada"
  on ordenes for update
  to authenticated
  using (true)
  with check (true);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Agrega la tabla a la publicación de Supabase Realtime (si no está ya).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ordenes'
  ) then
    alter publication supabase_realtime add table ordenes;
  end if;
end $$;
