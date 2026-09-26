-- ═══════════════════════════════════════════════════════════════
--  CLICK ETERNO · clave por evento
--  Se corre UNA vez. Es seguro correrlo de nuevo: no duplica nada.
-- ═══════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── 1. dónde viven las claves (nadie puede leerlas desde la web) ──
create table if not exists ce_claves(
  codigo text primary key,
  hash   text not null,
  creado timestamptz default now()
);
alter table ce_claves enable row level security;   -- sin políticas = nadie entra

create table if not exists ce_ajustes(
  nombre text primary key,
  valor  text not null
);
alter table ce_ajustes enable row level security;  -- sin políticas = nadie entra

-- Clave maestra (la que abre todos los eventos).
-- PONÉ LA TUYA ACÁ ABAJO antes de correr esto por primera vez. Que sea larga
-- y no un número corto: una de seis cifras se adivina probando todas.
-- Si ya está instalada, esta línea no la pisa. Para cambiarla después:
--     select ce_cambiar_maestra('la de ahora', 'la nueva');
insert into ce_ajustes(nombre, valor)
values ('maestra', crypt('PONE-TU-CLAVE-MAESTRA-ACA', gen_salt('bf')))
on conflict (nombre) do nothing;

-- ── 2. la clave que mandó el navegador en esta llamada ──
create or replace function ce_clave_dada() returns text
language plpgsql stable as $$
declare cab text;
begin
  cab := current_setting('request.headers', true);
  if cab is null or cab = '' then return null; end if;
  return nullif(cab::json ->> 'x-clave', '');
exception when others then return null;
end $$;

-- ── 3. ¿esta llamada puede tocar este evento? ──
create or replace function ce_permitido(p_codigo text) returns boolean
language plpgsql stable security definer set search_path = public, extensions as $$
declare clave text; h text; maestra text;
begin
  clave := ce_clave_dada();
  if clave is null then return false; end if;
  select valor into maestra from ce_ajustes where nombre = 'maestra';
  if maestra is not null and crypt(clave, maestra) = maestra then return true; end if;
  select hash into h from ce_claves where codigo = p_codigo;
  if h is null then return false; end if;
  return crypt(clave, h) = h;
end $$;

create or replace function ce_es_maestra() returns boolean
language plpgsql stable security definer set search_path = public, extensions as $$
declare clave text; maestra text;
begin
  clave := ce_clave_dada();
  if clave is null then return false; end if;
  select valor into maestra from ce_ajustes where nombre = 'maestra';
  return maestra is not null and crypt(clave, maestra) = maestra;
end $$;

-- ── 4. al crear un evento se guarda su clave ──
create or replace function ce_guardar_clave() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare clave text;
begin
  clave := ce_clave_dada();
  if clave is null or length(clave) < 4 then
    raise exception 'Falta la clave del evento' using errcode = '28000';
  end if;
  insert into ce_claves(codigo, hash) values (new.codigo, crypt(clave, gen_salt('bf')))
  on conflict (codigo) do nothing;
  return new;
end $$;

drop trigger if exists ce_eventos_clave on ce_eventos;
create trigger ce_eventos_clave before insert on ce_eventos
  for each row execute function ce_guardar_clave();

-- ── 5. el estado lo decide la base, no el celular del invitado ──
create or replace function ce_forzar_estado() returns trigger
language plpgsql security definer set search_path = public as $$
declare modera boolean;
begin
  if ce_permitido(new.codigo) then return new; end if;   -- el organizador manda
  select moderar into modera from ce_eventos where codigo = new.codigo;
  new.estado := case when coalesce(modera,false) then 'pendiente' else 'aprobado' end;
  return new;
end $$;

drop trigger if exists ce_items_estado on ce_items;
create trigger ce_items_estado before insert on ce_items
  for each row execute function ce_forzar_estado();

-- ── 6. permisos ──
alter table ce_eventos enable row level security;
alter table ce_items   enable row level security;

drop policy if exists "ce eventos leer"   on ce_eventos;
drop policy if exists "ce eventos crear"  on ce_eventos;
drop policy if exists "ce eventos editar" on ce_eventos;
drop policy if exists "ce eventos borrar" on ce_eventos;
create policy "ce eventos leer"   on ce_eventos for select to anon, authenticated using (true);
create policy "ce eventos crear"  on ce_eventos for insert to anon, authenticated with check (true);
create policy "ce eventos editar" on ce_eventos for update to anon, authenticated
  using (ce_permitido(codigo)) with check (ce_permitido(codigo));
create policy "ce eventos borrar" on ce_eventos for delete to anon, authenticated
  using (ce_permitido(codigo));

drop policy if exists "ce items leer"   on ce_items;
drop policy if exists "ce items crear"  on ce_items;
drop policy if exists "ce items editar" on ce_items;
drop policy if exists "ce items borrar" on ce_items;
create policy "ce items leer"   on ce_items for select to anon, authenticated using (true);
create policy "ce items crear"  on ce_items for insert to anon, authenticated with check (true);
create policy "ce items editar" on ce_items for update to anon, authenticated
  using (ce_permitido(codigo)) with check (ce_permitido(codigo));
create policy "ce items borrar" on ce_items for delete to anon, authenticated
  using (ce_permitido(codigo));

-- ── 7. archivos: solo se borran los que ya no tienen evento ──
-- La tabla storage.objects no es nuestra: es de Supabase. Ya viene con la
-- seguridad activada, así que no hace falta (ni se puede) tocarla. Y si el
-- proyecto tampoco nos deja crear la política desde acá, lo avisa y sigue:
-- el resto del sistema de claves no depende de esto.
do $ce$
begin
  -- por las dudas, que la seguridad esté prendida (en Supabase ya viene así)
  begin
    execute 'alter table storage.objects enable row level security';
  exception when insufficient_privilege or undefined_table then
    null;   -- no es nuestra la tabla: ya viene prendida de fábrica
  end;
  -- la regla en sí
  begin
    execute 'drop policy if exists "ce medios borrar" on storage.objects';
    execute $ce_pol$
      create policy "ce medios borrar" on storage.objects for delete to anon, authenticated
        using (
          bucket_id = 'ce-medios'
          and not exists (select 1 from public.ce_eventos e
                          where e.codigo = split_part(objects.name, '/', 1))
        )$ce_pol$;
    raise notice 'PASO 7 OK: la política de archivos quedó creada.';
  exception when insufficient_privilege or undefined_table then
    raise notice 'PASO 7 PENDIENTE: este proyecto no deja tocar storage.objects desde el editor. Hay que crear la política a mano desde Storage. Todo lo demás quedó instalado.';
  end;
end $ce$;

-- ── 8. cambiar la clave de un evento (con la vieja o con la maestra) ──
create or replace function ce_cambiar_clave(p_codigo text, p_nueva text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not ce_permitido(p_codigo) then
    raise exception 'Clave incorrecta' using errcode = '28000';
  end if;
  if p_nueva is null or length(p_nueva) < 4 then
    raise exception 'La clave nueva es muy corta' using errcode = '22023';
  end if;
  insert into ce_claves(codigo, hash) values (p_codigo, crypt(p_nueva, gen_salt('bf')))
  on conflict (codigo) do update set hash = excluded.hash;
end $$;

create or replace function ce_cambiar_maestra(p_actual text, p_nueva text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare m text;
begin
  select valor into m from ce_ajustes where nombre = 'maestra';
  if m is null or crypt(p_actual, m) <> m then
    raise exception 'Clave maestra incorrecta' using errcode = '28000';
  end if;
  update ce_ajustes set valor = crypt(p_nueva, gen_salt('bf')) where nombre = 'maestra';
end $$;

-- ── 9. para que la app sepa qué puede hacer y avise bien ──
create or replace function ce_quien_soy(p_codigo text default null)
returns json language plpgsql stable security definer set search_path = public, extensions as $$
begin
  return json_build_object(
    'llego_la_clave', ce_clave_dada() is not null,
    'es_maestra',     ce_es_maestra(),
    'puede_editar',   case when p_codigo is null then false else ce_permitido(p_codigo) end
  );
end $$;

-- Las políticas llaman a ce_permitido como el usuario que consulta, así que
-- anon TIENE que poder ejecutarla. Es segura: solo devuelve sí o no, y por
-- dentro corre como dueña para leer las claves, que anon no puede ver.
grant execute on function ce_permitido(text) to anon, authenticated;
grant execute on function ce_quien_soy(text), ce_cambiar_clave(text,text),
  ce_cambiar_maestra(text,text) to anon, authenticated;
revoke all on function ce_clave_dada() from public;
grant execute on function ce_clave_dada() to anon, authenticated;

-- ── que PostgREST se entere ──
-- El caché de esquema de PostgREST no se actualiza solo al toque: una
-- función recién creada existe en la base pero la API contesta PGRST202,
-- "no matches were found in the schema cache". O sea que el SQL da todas
-- las comprobaciones en true —miran pg_proc directo— y la app sigue sin
-- poder llamarla. Medido el 25/09/2026 con ce_espiar_cabeceras.
notify pgrst, 'reload schema';
