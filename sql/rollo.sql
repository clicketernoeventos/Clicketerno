-- ═══════════════════════════════════════════════════════════════
--  CLICK ETERNO · cámara descartable ("Rollo")
--  Se corre UNA vez, en el SQL Editor de Supabase. Es seguro correrlo
--  de nuevo: no duplica nada ni pisa datos existentes.
--
--  Requiere que ya esté instalado sql/claves.sql (usa ce_eventos,
--  ce_permitido y el mismo sistema de clave por evento).
-- ═══════════════════════════════════════════════════════════════

-- ── 0. ajustes de cámara en el propio evento ──
-- Un evento puede tener el muro (ya existente) y/o la cámara. Reutiliza
-- "cerrado": cuando el organizador cierra el evento, se corta todo.
alter table ce_eventos add column if not exists camara       boolean default false;
alter table ce_eventos add column if not exists cupo_fotos   integer default 24;
alter table ce_eventos add column if not exists revela_en    timestamptz;
alter table ce_eventos add column if not exists revelado     boolean default false;

-- ── 1. el rollo de cada invitado ──
-- El token lo genera el celular del invitado (no hay cuenta ni login) y
-- vive en su localStorage. Es una cadena al azar: adivinarlo no sirve de
-- nada porque además hace falta que el evento exista y no esté cerrado.
create table if not exists ce_rollos(
  token    text primary key default gen_random_uuid()::text,
  codigo   text not null references ce_eventos(codigo) on delete cascade,
  nombre   text not null default 'Invitado',
  disparos integer not null default 0,
  creado   timestamptz default now()
);
create index if not exists ce_rollos_codigo on ce_rollos(codigo);
alter table ce_rollos enable row level security;   -- sin políticas = nadie entra directo

-- ── 2. cada disparo (una foto) ──
create table if not exists ce_disparos(
  id     text primary key,
  codigo text not null references ce_eventos(codigo) on delete cascade,
  token  text not null references ce_rollos(token) on delete cascade,
  filtro text not null default 'natural',
  ruta   text not null unique,      -- camino dentro del depósito ce-rollos
  ts     bigint not null
);
create index if not exists ce_disparos_codigo on ce_disparos(codigo);
alter table ce_disparos enable row level security;  -- sin políticas = nadie entra directo

-- Nadie llega a estas dos tablas por la API de tablas (ni para leer ni para
-- escribir): todo pasa por las funciones de abajo, que son las únicas que
-- pueden saltar la seguridad porque son "security definer".

-- ── 3. ¿ya se reveló este rollo? ──
-- Se revela solo (a la hora que puso el organizador) o a mano (el
-- organizador aprieta "Revelar ahora"). Lo decide la base, no el reloj
-- del celular de nadie.
create or replace function ce_camara_revelada(p_codigo text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select coalesce(revelado,false) or (revela_en is not null and now() >= revela_en)
       from ce_eventos where codigo = p_codigo),
    false);   -- evento inexistente = no revelado (nunca NULL: NULL no es "false" en una política)
$$;

-- ── 4. entrar con el rollo (primera vez lo crea, después solo informa) ──
create or replace function ce_mi_rollo(p_codigo text, p_token text, p_nombre text)
returns json language plpgsql security definer set search_path = public as $$
declare v_camara boolean; v_cerrado boolean; v_cupo integer; v_revela_en timestamptz;
        v_disparos integer; v_nombre text;
begin
  select camara, cerrado, cupo_fotos, revela_en into v_camara, v_cerrado, v_cupo, v_revela_en
    from ce_eventos where codigo = p_codigo;
  if not found then
    raise exception 'No existe ese evento' using errcode = 'P0002';
  end if;

  insert into ce_rollos(token, codigo, nombre)
    values (p_token, p_codigo, coalesce(nullif(trim(coalesce(p_nombre,'')),''), 'Invitado'))
  on conflict (token) do nothing;

  select disparos, nombre into v_disparos, v_nombre from ce_rollos
    where token = p_token and codigo = p_codigo;
  if not found then
    -- el token existía pero de otro evento: nunca debería pasar desde la app
    raise exception 'Ese rollo no es de este evento' using errcode = '28000';
  end if;

  return json_build_object(
    'token', p_token, 'nombre', v_nombre,
    -- cupo_fotos nunca puede viajar vacío: del otro lado, en JavaScript,
    -- "0 >= null" da verdadero y el invitado quedaba con el rollo lleno
    -- sin haber sacado una sola foto.
    'disparos', v_disparos, 'cupo', coalesce(v_cupo, 24),
    'camara', coalesce(v_camara,false), 'cerrado', coalesce(v_cerrado,false),
    'revelado', ce_camara_revelada(p_codigo), 'revela_en', v_revela_en
  );
end $$;

-- ── 5. sacar una foto (atómico: nadie se pasa del rollo) ──
create or replace function ce_tomar_foto(p_codigo text, p_token text, p_filtro text, p_ruta text)
returns json language plpgsql security definer set search_path = public as $$
declare v_disparos integer; v_cupo integer; v_cerrado boolean; v_camara boolean;
begin
  if p_filtro not in ('natural','clasico','bn','flash','dorado') then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;

  select cupo_fotos, cerrado, camara into v_cupo, v_cerrado, v_camara
    from ce_eventos where codigo = p_codigo;
  if not found or not coalesce(v_camara,false) then
    raise exception 'Esta fiesta no tiene cámara' using errcode = 'P0002';
  end if;
  if coalesce(v_cerrado,false) then
    raise exception 'La cámara ya cerró' using errcode = '28000';
  end if;

  -- bloquea la fila de ESTE rollo: dos disparos casi simultáneos del mismo
  -- teléfono no pueden pasarse del cupo.
  select disparos into v_disparos from ce_rollos
    where token = p_token and codigo = p_codigo for update;
  if not found then
    raise exception 'Ese rollo no existe' using errcode = '28000';
  end if;
  -- y acá al revés: "v_disparos >= null" no es verdadero NUNCA, así que
  -- con la columna vacía no había cupo que valiera y se podía llenar el
  -- depósito sin límite.
  if v_disparos >= coalesce(v_cupo, 24) then
    raise exception 'Ya usaste todas tus fotos' using errcode = '28000';
  end if;

  insert into ce_disparos(id, codigo, token, filtro, ruta, ts)
    values (gen_random_uuid()::text, p_codigo, p_token, p_filtro, p_ruta,
            (extract(epoch from now())*1000)::bigint);
  update ce_rollos set disparos = disparos + 1 where token = p_token;

  return json_build_object('restantes', coalesce(v_cupo, 24) - v_disparos - 1);
end $$;

-- ── 5b. devolver una foto que nunca llegó a subirse ──
-- El disparo se anota ANTES de subir el archivo (si no, el cupo no se puede
-- garantizar). Pero en un salón con mala señal la subida falla seguido, y
-- sin esto el invitado perdía la foto para siempre sin haber sacado nada.
-- Solo se devuelve si el archivo NO está en el depósito: así nadie puede
-- borrar una foto ya subida para ganarse un disparo extra.
create or replace function ce_devolver_foto(p_codigo text, p_token text, p_ruta text)
returns json language plpgsql security definer set search_path = public as $$
declare v_borradas integer;
begin
  if exists (select 1 from storage.objects
              where bucket_id = 'ce-rollos' and name = p_ruta) then
    raise exception 'Esa foto ya está subida' using errcode = '28000';
  end if;

  delete from ce_disparos
    where ruta = p_ruta and codigo = p_codigo and token = p_token;
  get diagnostics v_borradas = row_count;

  if v_borradas > 0 then
    update ce_rollos set disparos = greatest(disparos - v_borradas, 0)
      where token = p_token and codigo = p_codigo;
  end if;

  return json_build_object('devueltas', v_borradas,
    'disparos', (select disparos from ce_rollos where token = p_token));
end $$;

-- ── 6. el álbum, pero solo si ya se reveló ──
-- Devuelve los caminos de archivo, no URLs: el celular las firma después
-- llamando a Storage, que solo firma lo que la política de abajo permite
-- (es decir: lo que ya se reveló). Así, aunque alguien copie esta
-- respuesta, no sirve de nada antes de hora.
create or replace function ce_album_de(p_codigo text, p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare v_mias json; v_todas json;
begin
  if not ce_camara_revelada(p_codigo) then
    raise exception 'Todavía no se reveló' using errcode = '28000';
  end if;

  select coalesce(json_agg(json_build_object(
           'id', id, 'ruta', ruta, 'filtro', filtro, 'ts', ts
         ) order by ts), '[]'::json)
    into v_mias
    from ce_disparos where codigo = p_codigo and token = p_token;

  select coalesce(json_agg(json_build_object(
           'id', d.id, 'ruta', d.ruta, 'filtro', d.filtro, 'ts', d.ts,
           'nombre', r.nombre, 'mia', d.token = p_token
         ) order by d.ts desc), '[]'::json)
    into v_todas
    from (select * from ce_disparos where codigo = p_codigo
          order by ts desc limit 400) d
    join ce_rollos r on r.token = d.token;

  return json_build_object(
    'revelado', true, 'mias', v_mias, 'todas', v_todas,
    'total_fotos', (select count(*) from ce_disparos where codigo = p_codigo),
    'total_invitados', (select count(*) from ce_rollos where codigo = p_codigo)
  );
end $$;

-- ── 7. lo que ve el organizador antes de revelar: solo números ──
create or replace function ce_camara_stats(p_codigo text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'invitados', (select count(*) from ce_rollos where codigo = p_codigo),
    'fotos', (select count(*) from ce_disparos where codigo = p_codigo),
    'revelado', ce_camara_revelada(p_codigo)
  );
$$;

-- ── 7b. las rutas de un evento, para poder borrarlas del depósito ──
-- Solo la usa el panel del organizador al eliminar un evento (por eso pide
-- la clave, con ce_permitido). Sin esto, no hay forma de saber qué archivos
-- había en ce-rollos una vez que el evento (y en cascada, sus filas) ya no
-- existen.
-- Va adentro de un bloque porque es la única de todo el archivo que depende
-- de claves.sql (usa ce_permitido). Es una función de limpieza: si falta,
-- no puede llevarse puesta la instalación entera.
do $ce$
begin
  execute $fn$
    create or replace function ce_rutas_rollo(p_codigo text)
    returns text[] language sql stable security definer set search_path = public as $cuerpo$
      select coalesce(array_agg(ruta), array[]::text[])
      from ce_disparos where codigo = p_codigo and ce_permitido(p_codigo);
    $cuerpo$$fn$;
  execute 'grant execute on function ce_rutas_rollo(text) to anon, authenticated';
exception when undefined_function then
  raise notice 'FALTA claves.sql: sin ce_permitido no se pudo crear ce_rutas_rollo (solo se usa para limpiar los archivos al borrar un evento). Todo lo demás quedó instalado.';
end $ce$;

-- ── 7b bis. el álbum de a tandas, para el organizador ──
-- ce_album_de devuelve como mucho 400 fotos: es lo que se puede dibujar en
-- una pantalla sin colgar el teléfono. Pero el organizador que se quiere
-- llevar TODAS necesita las 1450 de un casamiento, y con el tope de 400 el
-- zip se bajaba incompleto diciendo "listo": la peor manera de perder las
-- fotos de una fiesta.
-- Pide la clave del evento, como ce_rutas_rollo: nadie más tiene por qué
-- poder listarle el álbum entero a nadie.
do $ce$
begin
  execute $fn$
    create or replace function ce_album_pagina(p_codigo text, p_desde integer, p_cuanto integer)
    returns json language sql stable security definer set search_path = public as $cuerpo$
      select coalesce(json_agg(json_build_object(
               'id', t.id, 'ruta', t.ruta, 'filtro', t.filtro, 'ts', t.ts, 'nombre', t.nombre
             ) order by t.ts, t.id), '[]'::json)
      from (select d.id, d.ruta, d.filtro, d.ts, r.nombre
            from ce_disparos d join ce_rollos r on r.token = d.token
            where d.codigo = p_codigo and ce_permitido(p_codigo)
            -- ts, id: dos fotos del mismo milisegundo tienen que salir
            -- siempre en el mismo orden, o al pasar de tanda se repite una
            -- y se saltea otra.
            order by d.ts, d.id
            offset greatest(coalesce(p_desde,0),0)
            limit least(greatest(coalesce(p_cuanto,500),1),500)) t;
    $cuerpo$$fn$;
  execute 'grant execute on function ce_album_pagina(text,integer,integer) to anon, authenticated';
exception when undefined_function then
  raise notice 'FALTA claves.sql: sin ce_permitido no se pudo crear ce_album_pagina (es la que deja bajar TODAS las fotos de un evento grande). Todo lo demás quedó instalado.';
end $ce$;

-- ── 7c. ¿este camino ya fue reservado por ce_tomar_foto? ──
-- Hace falta como función aparte (y no una consulta directa a ce_disparos
-- dentro de la política de Storage) porque ce_disparos no tiene ninguna
-- política de lectura: sin esto, la política de "subir" de más abajo
-- correría como anon, vería siempre cero filas y nadie podría subir nada.
create or replace function ce_ruta_reservada(p_ruta text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ce_disparos where ruta = p_ruta);
$$;

grant execute on function
  ce_camara_revelada(text), ce_mi_rollo(text,text,text), ce_tomar_foto(text,text,text,text),
  ce_album_de(text,text), ce_camara_stats(text), ce_ruta_reservada(text),
  ce_devolver_foto(text,text,text)
  to anon, authenticated;

-- ── 8. el depósito de las fotos ──
-- Privado (a diferencia de ce-medios, que es público): antes del revelado
-- nadie tiene que poder abrir ni adivinando la dirección.
--
-- OJO: desde 2025 Supabase no deja tocar storage.objects desde el editor
-- (la tabla es de supabase_storage_admin, no nuestra). Por eso TODO esto va
-- adentro de un bloque que atrapa el error y sigue de largo, igual que el
-- paso 7 de claves.sql. Si no, un solo error acá tira abajo el script
-- entero: el editor corre todo en una transacción y se deshace hasta lo que
-- ya se había creado bien.
--
-- Si sale "PENDIENTE", hay que crear el depósito y sus tres reglas a mano
-- desde el panel (Storage). Está explicado en el README.
do $ce$
declare v_faltan text := '';
begin
  -- el depósito
  begin
    insert into storage.buckets(id, name, public)
      values ('ce-rollos', 'ce-rollos', false)
      on conflict (id) do nothing;
    raise notice 'DEPÓSITO OK: ce-rollos existe y es privado.';
  exception when insufficient_privilege or undefined_table then
    v_faltan := v_faltan || ' el depósito ce-rollos;';
  end;

  -- por las dudas, que la seguridad esté prendida (en Supabase ya viene así)
  begin
    execute 'alter table storage.objects enable row level security';
  exception when insufficient_privilege or undefined_table then
    null;   -- no es nuestra la tabla: ya viene prendida de fábrica
  end;

  -- Solo se puede subir a un camino que YA fue reservado por ce_tomar_foto.
  -- Nadie puede subir basura al azar: primero tiene que pasar por la
  -- función, que exige cupo disponible y evento abierto.
  begin
    execute 'drop policy if exists "ce rollos subir" on storage.objects';
    execute $pol$
      create policy "ce rollos subir" on storage.objects for insert to anon, authenticated
        with check (
          bucket_id = 'ce-rollos'
          and public.ce_ruta_reservada(name)
        )$pol$;
    raise notice 'REGLA OK: "ce rollos subir".';
  exception when insufficient_privilege or undefined_table then
    v_faltan := v_faltan || ' la regla de subir;';
  end;

  -- Solo se puede leer (y por lo tanto, solo se puede firmar una URL) cuando
  -- el evento al que pertenece la carpeta ya se reveló.
  --
  -- El segundo caso (evento que ya no existe) no es un permiso de más: en un
  -- "delete ... where name = ..." Postgres exige permiso de LECTURA sobre las
  -- filas que filtra, así que sin esto la regla de borrar de más abajo no
  -- llega a aplicarse nunca y las fotos de un evento eliminado quedan para
  -- siempre en el depósito, ocupando lugar.
  begin
    execute 'drop policy if exists "ce rollos leer" on storage.objects';
    execute $pol$
      create policy "ce rollos leer" on storage.objects for select to anon, authenticated
        using (
          bucket_id = 'ce-rollos'
          and (
            public.ce_camara_revelada(split_part(name, '/', 1))
            or not exists (select 1 from public.ce_eventos e
                            where e.codigo = split_part(name, '/', 1))
          )
        )$pol$;
    raise notice 'REGLA OK: "ce rollos leer".';
  exception when insufficient_privilege or undefined_table then
    v_faltan := v_faltan || ' la regla de leer;';
  end;

  -- Igual que en ce-medios: un archivo solo se borra cuando su evento ya no existe.
  begin
    execute 'drop policy if exists "ce rollos borrar" on storage.objects';
    execute $pol$
      create policy "ce rollos borrar" on storage.objects for delete to anon, authenticated
        using (
          bucket_id = 'ce-rollos'
          and not exists (select 1 from public.ce_eventos e
                           where e.codigo = split_part(name, '/', 1))
        )$pol$;
    raise notice 'REGLA OK: "ce rollos borrar".';
  exception when insufficient_privilege or undefined_table then
    v_faltan := v_faltan || ' la regla de borrar;';
  end;

  if v_faltan <> '' then
    raise notice '── ATENCIÓN ──';
    raise notice 'Todo lo demás quedó instalado, pero este proyecto no deja tocar el depósito desde el editor.';
    raise notice 'Falta crear a mano, desde el panel de Storage:%', v_faltan;
    raise notice 'Está paso a paso en el README, en "Si el depósito quedó pendiente".';
  end if;
end $ce$;
