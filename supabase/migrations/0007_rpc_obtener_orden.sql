-- Quadro Café — Deuda de seguridad #2 (preparación): leer UNA orden por id.
--
-- Hoy `ordenes` tiene lectura pública (0002, `using (true)`): con la
-- publishable key se puede listar el nombre y el total de todos los pedidos.
-- Se dejó así porque el Ticket del cliente sigue su orden por Realtime y el
-- carrito hace `insert(...).select()`, y ambos necesitan SELECT.
--
-- Esta migración SOLO PREPARA el cierre: agrega una RPC que devuelve una orden
-- si conoces su id (un UUID v4, no adivinable), con columnas mínimas: sin
-- `nombre_cliente` ni `items`. **No toca ninguna policy ni el cliente**: la app
-- sigue funcionando exactamente igual después de aplicarla.
--
-- Plan de cierre (bloque futuro, con prueba de pedido real):
--   1. RPC `crear_orden(...)` SECURITY DEFINER que haga el INSERT y devuelva
--      id + número (el carrito deja de necesitar SELECT tras el INSERT).
--   2. El Ticket lee con `obtener_orden(id)` + sondeo cada pocos segundos (o
--      Realtime Broadcast) en vez de `postgres_changes` sobre la tabla.
--   3. Recién entonces: `drop policy ordenes_lectura_publica` y una policy
--      de SELECT solo para staff (`es_staff()`, 0008).
--
-- El advisor "anon can execute SECURITY DEFINER function" va a listar esta
-- función: es intencional (es el punto de acceso público acotado a un id).
--
-- Verificación después de aplicarla:
--   select * from obtener_orden('00000000-0000-4000-8000-000000000000'); → 0 filas
--   select numero_orden, estado from obtener_orden((select id from ordenes order by creado_en desc limit 1)); → 1 fila
--
-- Reversión:
--   drop function if exists obtener_orden(uuid);

create or replace function obtener_orden(p_id uuid)
returns table (
  id uuid,
  numero_orden integer,
  dia date,
  estado text,
  destino text,
  total numeric(10, 2),
  metodo_pago text,
  comprobante_estado text,
  comprobante_monto numeric(10, 2),
  comprobante_ref text,
  creado_en timestamptz,
  actualizado_en timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.numero_orden, o.dia, o.estado, o.destino, o.total, o.metodo_pago,
         o.comprobante_estado, o.comprobante_monto, o.comprobante_ref,
         o.creado_en, o.actualizado_en
    from ordenes o
   where o.id = p_id;
$$;

comment on function obtener_orden(uuid) is
  'Lectura pública de UNA orden por id, sin nombre ni items (0007). Prepara el cierre de ordenes_lectura_publica.';

revoke all on function obtener_orden(uuid) from public;
grant execute on function obtener_orden(uuid) to anon, authenticated;
