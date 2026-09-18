-- Quadro Café — Reunión 05/sept, punto 12: Binance Pay como método de pago.
--
-- ordenes.metodo_pago tiene un CHECK con la lista cerrada de métodos (0002).
-- Sin esta migración, un pedido con metodo_pago = 'binance' lo rechaza
-- Postgres y el carrito muestra "No se pudo enviar el pedido".
--
-- Es aditiva: los 4 métodos existentes siguen valiendo igual, así que se
-- puede correr antes del merge sin afectar la app que está en producción.
-- Cómo aplicarla: SQL Editor del dashboard de Supabase → pegar y ejecutar.

alter table ordenes drop constraint if exists ordenes_metodo_pago_check;
alter table ordenes add constraint ordenes_metodo_pago_check
  check (metodo_pago in ('efectivo', 'movil', 'zelle', 'transferencia', 'binance'));
