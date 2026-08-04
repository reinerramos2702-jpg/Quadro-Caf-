-- Quadro Café — Bloque 5: esquema inicial para el Panel Admin.
--
-- Cómo aplicar esta migración:
--   1. Abre el SQL Editor de tu proyecto en https://supabase.com/dashboard
--   2. Pega el contenido de este archivo completo y ejecútalo.
--   (No hay una CLI de Supabase disponible en este entorno para correrla por ti.)
--
-- Después de correr esta migración, crea al menos un usuario en
-- Authentication → Users (email + password) para poder entrar al Panel Admin
-- de la app. Cualquier usuario autenticado puede editar productos; no hay
-- roles adicionales todavía (dueño único de la cafetería).

create table if not exists productos (
  id text primary key,
  cat text not null,
  nombre text not null,
  precio numeric(10, 2) not null,
  descripcion text not null default '',
  tag text,
  geo text,
  finca boolean not null default false,
  disponible boolean not null default true,
  orden integer not null default 0,
  actualizado_en timestamptz not null default now()
);

comment on table productos is 'Carta de Quadro Café. Espejo de la constante MENU en src/App.jsx.';
comment on column productos.disponible is 'Toggle de disponibilidad diaria — lo que el dueño más usa.';

-- Mantiene actualizado_en al día sin que el cliente tenga que mandarlo.
create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists productos_actualizado_en on productos;
create trigger productos_actualizado_en
  before update on productos
  for each row
  execute function set_actualizado_en();

alter table productos enable row level security;

-- Lectura pública (la publishable key vive en el cliente; RLS es el límite real).
drop policy if exists "productos_lectura_publica" on productos;
create policy "productos_lectura_publica"
  on productos for select
  to anon, authenticated
  using (true);

-- Escritura solo para el dueño autenticado (Panel Admin).
drop policy if exists "productos_escritura_autenticada" on productos;
create policy "productos_escritura_autenticada"
  on productos for all
  to authenticated
  using (true)
  with check (true);

-- Semilla: los 12 items reales que ya están hardcodeados en MENU (App.jsx).
-- Sirve para poder probar el Panel Admin de inmediato; si la tabla queda vacía
-- o falla la carga, la app sigue funcionando con la constante MENU local.
insert into productos (id, cat, nombre, precio, descripcion, tag, geo, finca, disponible, orden) values
  ('m1',  'Filtrado',   'V60 de origen',              4.5, '60° C de servicio, 15 g, 250 ml. Elige finca.',            'Firma', 'espiral',   true,  true, 1),
  ('m2',  'Filtrado',   'AeroPress campeonato',       5.0, 'Receta del Campeonato AeroPress Venezuela 2023.',          '86.5',  'centro',    true,  true, 2),
  ('m3',  'Filtrado',   'Sifón a la mesa',            7.0, 'Extracción por vacío, servida frente al cliente.',         'Show',  'inmersion', true,  true, 3),
  ('m4',  'Espresso',   'Espresso doble',             2.5, '18 g dentro, 36 g fuera, 28 segundos.',                    null,    null,        false, true, 4),
  ('m5',  'Espresso',   'Cortado',                    3.0, 'Espresso doble con 60 ml de leche texturizada.',           null,    null,        false, true, 5),
  ('m6',  'Espresso',   'Latte de cascarilla',        4.2, 'Con Coffee Husk Syrup orgánico de la casa.',               'Casa',  null,        false, true, 6),
  ('m7',  'Frío',       'Cold brew 18 h',             4.0, 'Inmersión larga en frío. Servido sobre hielo prensado.',   null,    null,        true,  true, 7),
  ('m8',  'Frío',       'Tónica de cascarilla',       4.8, 'Cascarilla, tónica y cítrico. Sin alcohol.',               null,    null,        false, true, 8),
  ('m9',  'Panadería',  'Croissant de mantequilla',   2.8, 'Laminado de 3 días. Horneado a las 7:00.',                 null,    null,        false, true, 9),
  ('m10', 'Panadería',  'Pan de masa madre',          5.5, 'Pieza de 800 g. Fermentación de 24 horas.',                null,    null,        false, true, 10),
  ('m11', 'Postres',    'Tarta de café y nuez',       4.6, 'Con espresso del lote Santa Cruz de Mora.',                null,    null,        false, true, 11),
  ('m12', 'Postres',    'Cheesecake de cascarilla',   4.9, 'Base de galleta, sirope de cascarilla.',                   'Nuevo', null,        false, true, 12)
on conflict (id) do nothing;
