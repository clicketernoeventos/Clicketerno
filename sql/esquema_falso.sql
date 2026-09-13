-- Copia aproximada del esquema real, solo para probar
create extension if not exists pgcrypto;
create schema if not exists storage;
drop table if exists ce_items, ce_eventos, ce_claves, ce_ajustes cascade;
drop table if exists storage.objects cascade;
create table ce_eventos(
  codigo text primary key, nombre text, fecha text, tipo text, tono text,
  moderar boolean default false, cerrado boolean default false,
  portada text, consignas text[], vence text, lanza text, creado bigint);
create table ce_items(
  id text primary key, codigo text, kind text, url text,
  autor text, texto text, estado text, ts bigint);
create table storage.objects(id uuid default gen_random_uuid() primary key,
  bucket_id text, name text);
-- los depósitos (los crea Supabase; rollo.sql inserta el suyo acá)
create table if not exists storage.buckets(id text primary key, name text, public boolean default false);
-- en Supabase esta tabla ya viene con la seguridad prendida, y el proyecto
-- real ya tiene sus políticas de leer/subir (las que se ven en el panel)
alter table storage.objects enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='falsa leer') then
    create policy "falsa leer" on storage.objects for select using (bucket_id='ce-medios');
    create policy "falsa subir" on storage.objects for insert with check (bucket_id='ce-medios');
  end if;
end $$;
-- roles anon y authenticated como en Supabase
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, storage to anon, authenticated;
grant select, insert, update, delete on ce_eventos, ce_items, storage.objects to anon, authenticated;
