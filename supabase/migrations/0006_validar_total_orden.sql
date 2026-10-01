-- Quadro Café — Deuda de seguridad #1: el total del pedido lo decide el servidor.
--
-- Problema: `ordenes` admite INSERT público (0002, `with check (true)`) y el
-- carrito manda `items` y `total` calculados en el teléfono. Cualquiera con la
-- publishable key podía crear un pedido de $0.01 por un sifón.
--
-- Qué hace (solo en INSERT; no toca filas existentes):
--   · rechaza el pedido si `items` no es un arreglo de 1 a 50 líneas;
--   · cada línea tiene que nombrar un `id` que exista en `productos`, que esté
--     `disponible`, y traer una `cantidad` entera entre 1 y 50;
--   · reescribe `precio` y `nombre` de cada línea con los de `productos` y
--     PISA `total` con Σ precio × cantidad. Así un carrito con un precio viejo
--     (el dueño lo cambió con la app abierta) se cobra bien en vez de fallar;
--   · recorta `nombre_cliente` a 60 caracteres y rechaza uno vacío.
--   Los campos extra de la línea (`finca`, `taza`) se conservan, recortados.
--
-- Riesgo conocido y aceptado: si el dueño marca "agotado" un producto mientras
-- alguien lo tiene en el carrito, ese pedido falla con el mensaje genérico
-- del carrito ("No se pudo enviar el pedido") y el cliente lo quita.
--
-- Es aditiva (función + trigger nuevos). No cambia ninguna policy.
-- SECURITY INVOKER a propósito: `productos` ya es de lectura pública, no hace
-- falta saltarse RLS (y no suma un SECURITY DEFINER más a los advisors).
--
-- Verificación después de aplicarla (no deja datos: el bloque termina con
-- una excepción que deshace todo):
--   do $$ declare r ordenes; begin
--     insert into ordenes (nombre_cliente, destino, items, total, metodo_pago)
--     values ('prueba', 'aca', '[{"id":"m5","nombre":"x","precio":0.01,"cantidad":2}]', 0.01, 'efectivo')
--     returning * into r;
--     raise exception 'OK rollback · total=% · precio=%', r.total, r.items->0->>'precio';
--   end $$;
--   → "OK rollback · total=6.00 · precio=3.00" (con el precio actual de m5).
--
-- Reversión:
--   drop trigger if exists ordenes_validar_total on ordenes;
--   drop function if exists validar_total_orden();

create or replace function validar_total_orden()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  linea jsonb;
  prod record;
  cant integer;
  suma numeric(10, 2) := 0;
  limpias jsonb := '[]'::jsonb;
begin
  if new.items is null or jsonb_typeof(new.items) <> 'array'
     or jsonb_array_length(new.items) = 0 or jsonb_array_length(new.items) > 50 then
    raise exception 'pedido inválido: items vacío o fuera de rango' using errcode = '22023';
  end if;

  new.nombre_cliente := left(btrim(coalesce(new.nombre_cliente, '')), 60);
  if new.nombre_cliente = '' then
    raise exception 'pedido inválido: falta el nombre' using errcode = '22023';
  end if;

  for linea in select value from jsonb_array_elements(new.items) loop
    if jsonb_typeof(linea) <> 'object'
       or jsonb_typeof(linea -> 'cantidad') <> 'number'
       or (linea ->> 'cantidad') !~ '^[0-9]{1,2}$' then
      raise exception 'pedido inválido: cantidad' using errcode = '22023';
    end if;
    cant := (linea ->> 'cantidad')::integer;
    if cant < 1 or cant > 50 then
      raise exception 'pedido inválido: cantidad fuera de rango' using errcode = '22023';
    end if;

    select p.id, p.nombre, p.precio, p.disponible into prod
      from productos p where p.id = linea ->> 'id';
    if not found then
      raise exception 'pedido inválido: producto desconocido' using errcode = '22023';
    end if;
    if not prod.disponible then
      raise exception 'pedido inválido: producto no disponible' using errcode = '22023';
    end if;

    suma := suma + prod.precio * cant;
    limpias := limpias || jsonb_build_array(
      jsonb_strip_nulls(jsonb_build_object(
        'id', prod.id,
        'nombre', prod.nombre,
        'precio', prod.precio,
        'cantidad', cant,
        'finca', left(linea ->> 'finca', 60),
        'taza', left(linea ->> 'taza', 60)
      ))
    );
  end loop;

  new.items := limpias;
  new.total := suma;
  return new;
end;
$$;

comment on function validar_total_orden() is
  'BEFORE INSERT en ordenes: valida items contra productos y recalcula total en el servidor (0006).';

drop trigger if exists ordenes_validar_total on ordenes;
create trigger ordenes_validar_total
  before insert on ordenes
  for each row
  execute function validar_total_orden();
