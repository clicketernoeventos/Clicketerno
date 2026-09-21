-- Copia aproximada del esquema real, solo para probar
create extension if not exists pgcrypto;
create schema if not exists storage;
/* También las del rollo, y ANTES que ce_eventos: si solo se tiraba
   ce_eventos "cascade", se llevaba puestas las claves foráneas de
   ce_rollos y ce_disparos, y como esas dos tablas seguían en pie el
   "create table if not exists" de rollo.sql no las volvía a poner. La
   copia de prueba quedaba sin el borrado en cascada, y la prueba que
   justamente cuida eso pasaba de casualidad en la segunda corrida. */
drop table if exists ce_disparos, ce_rollos cascade;
drop table if exists ce_items, ce_eventos, ce_claves, ce_ajustes cascade;
drop table if exists storage.objects cascade;
/* También buckets: como se creaba con "if not exists", una copia vieja sin
   las columnas de límites se quedaba ahí para siempre y blindaje.sql fallaba
   solo en esta máquina. */
drop table if exists storage.buckets cascade;
create table ce_eventos(
  codigo text primary key, nombre text, fecha text, tipo text, tono text,
  moderar boolean default false, cerrado boolean default false,
  portada text, consignas text[], vence text, lanza text, creado bigint,
  acepto bigint);
create table ce_items(
  id text primary key, codigo text, kind text, url text,
  autor text, texto text, estado text, ts bigint);
create table storage.objects(id uuid default gen_random_uuid() primary key,
  bucket_id text, name text);
-- los depósitos (los crea Supabase; rollo.sql inserta el suyo acá)
-- Las dos últimas columnas son las que usa Supabase para el tope de tamaño
-- y los tipos de archivo permitidos. Sin ellas acá, blindaje.sql no se podía
-- probar y el error se descubría recién en producción.
create table if not exists storage.buckets(id text primary key, name text,
  public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
-- en Supabase esta tabla ya viene con la seguridad prendida, y el proyecto
-- real ya tiene sus políticas de leer/subir (las que se ven en el panel)
alter table storage.objects enable row level security;
-- Con los NOMBRES de verdad, no con nombres de fantasía: blindaje.sql
-- reemplaza "ce medios subir" por una más estrecha, y si acá se llamara
-- distinto quedarían las dos. Postgres suma las reglas permisivas, así que
-- la vieja —abierta— seguiría dejando pasar todo y la prueba nueva pasaría
-- por el motivo equivocado.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='ce medios ver') then
    create policy "ce medios ver" on storage.objects for select using (bucket_id='ce-medios');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='ce medios subir') then
    create policy "ce medios subir" on storage.objects for insert with check (bucket_id='ce-medios');
  end if;
end $$;
-- ce-medios: en producción ya existe y es público. Acá hace falta para
-- poder probar los límites de tamaño y tipo que pone blindaje.sql.
insert into storage.buckets(id,name,public) values ('ce-medios','ce-medios',true)
  on conflict (id) do nothing;
-- roles anon y authenticated como en Supabase
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, storage to anon, authenticated;
grant select, insert, update, delete on ce_eventos, ce_items, storage.objects to anon, authenticated;
