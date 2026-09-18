-- Quadro Café — Reunión 05/sept, punto 13: comprobante de pago + OCR.
--
-- Flujo (nunca bloquea el pedido):
--   1. El carrito inserta la orden igual que siempre (0002).
--   2. Si el cliente adjuntó comprobante, lo sube a Storage como
--      comprobantes/{orden_id}.jpg (bucket PRIVADO).
--   3. El trigger de abajo marca la orden con comprobante_estado='pendiente'
--      en cuanto el archivo existe — así la barra sabe que hay comprobante
--      aunque el OCR falle o la edge function no responda.
--   4. La edge function `verificar-comprobante` (Gemini) lee la imagen con
--      service role y deja el resultado final: verificado / revisar / sin_lectura.
--
-- Privacidad: `ordenes` tiene lectura pública (la necesita el ticket del
-- cliente por Realtime), así que ahí solo va lo mínimo: estado, monto leído y
-- los ÚLTIMOS 4 dígitos de la referencia. La lectura completa del OCR va en
-- `comprobantes` (solo staff autenticado) y la imagen queda en un bucket
-- privado (solo staff autenticado, vía signed URL).
--
-- El OCR es una AYUDA para el barista, no una prueba de pago: una captura se
-- puede falsificar. La confirmación final sigue siendo humana.
--
-- Es aditiva (columnas nuevas nullable, tabla/bucket nuevos): se puede correr
-- antes del merge sin afectar la app que está en producción.

-- ── Columnas mínimas en ordenes ─────────────────────────────────────────────
alter table ordenes
  add column if not exists comprobante_estado text
    check (comprobante_estado in ('pendiente', 'verificado', 'revisar', 'sin_lectura')),
  add column if not exists comprobante_monto numeric(10, 2),
  add column if not exists comprobante_ref text;

comment on column ordenes.comprobante_estado is
  'null = sin comprobante. pendiente = subido, OCR en curso o caído. verificado = monto leído coincide con el total. revisar = no coincide / otra moneda / dudoso. sin_lectura = no se pudo leer.';
comment on column ordenes.comprobante_ref is 'Solo los últimos 4 caracteres de la referencia leída (la tabla ordenes es de lectura pública).';

-- ── Detalle completo del OCR (solo staff) ───────────────────────────────────
create table if not exists comprobantes (
  orden_id uuid primary key references ordenes (id) on delete cascade,
  path text not null,
  detalle jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table comprobantes enable row level security;

drop policy if exists "comprobantes_lectura_staff" on comprobantes;
create policy "comprobantes_lectura_staff"
  on comprobantes for select
  to authenticated
  using (true);
-- Sin policies de escritura: solo el trigger (security definer) y la edge
-- function (service role) escriben acá.

-- ── Bucket privado ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Subida anónima SOLO a "{uuid de una orden existente}.jpg", de una orden
-- creada hace menos de 30 minutos y que todavía no tenga comprobante. Sin
-- update/delete para anon: un comprobante subido no se puede pisar.
drop policy if exists "comprobantes_subida_cliente" on storage.objects;
create policy "comprobantes_subida_cliente"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'comprobantes'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
    and exists (
      select 1 from public.ordenes o
      where o.id::text = split_part(name, '.', 1)
        and o.creado_en > now() - interval '30 minutes'
        and o.comprobante_estado is null
    )
  );

-- Lectura (signed URL desde /#barra) solo para el staff autenticado.
drop policy if exists "comprobantes_lectura_staff" on storage.objects;
create policy "comprobantes_lectura_staff"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'comprobantes');

-- ── Trigger: archivo subido → orden marcada 'pendiente' ─────────────────────
create or replace function marcar_comprobante_subido()
returns trigger as $$
declare
  oid uuid;
begin
  if new.bucket_id <> 'comprobantes' then
    return new;
  end if;
  begin
    oid := split_part(new.name, '.', 1)::uuid;
  exception when others then
    return new;
  end;
  update public.ordenes
     set comprobante_estado = 'pendiente'
   where id = oid and comprobante_estado is null;
  insert into public.comprobantes (orden_id, path)
  values (oid, new.name)
  on conflict (orden_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists comprobante_subido on storage.objects;
create trigger comprobante_subido
  after insert on storage.objects
  for each row
  execute function marcar_comprobante_subido();
