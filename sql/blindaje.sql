-- ═══════════════════════════════════════════════════════════════
--  CLICK ETERNO · blindaje
--
--  Se corre UNA vez, después de claves.sql y rollo.sql. Es seguro
--  correrlo de nuevo: no duplica ni pisa datos.
--
--  Qué arregla, en una línea cada cosa:
--
--   1. Cualquiera podía bajarse la tabla de eventos entera. Con un
--      solo pedido salían los códigos, nombres, fechas y salones de
--      TODAS las fiestas de todos los clientes. Y con el código en la
--      mano se entra a subir al muro y, si el rollo está revelado, al
--      álbum completo. El arreglo del panel (que ya no los muestra) no
--      servía de nada: el que mira no usa la app, usa curl.
--   2. Lo mismo con las fotos y los mensajes: se bajaba ce_items
--      completo, incluidas las que estaban ESPERANDO APROBACIÓN. Le
--      prometemos al organizador que nada se ve antes de que él lo
--      mire, y eso se cumplía solo del lado del dibujo.
--   3. ce_tomar_foto aceptaba cualquier camino de archivo que le
--      mandaran. Con eso se podía subir a la carpeta de otro evento, o
--      a una carpeta inventada: los archivos de una carpeta cuyo
--      evento no existe quedan legibles para siempre, así que el
--      depósito del negocio servía de hosting gratis para cualquiera.
--   4. Cada token inventado creaba un rollo nuevo, sin tope: 24 fotos
--      por token, tokens infinitos. La factura del almacenamiento la
--      paga el negocio.
--   5. ce_cambiar_maestra se podía llamar desde internet. Con
--      paciencia se prueba la clave maestra, y el que acierta te deja
--      afuera de tus propios eventos.
--   6. El depósito aceptaba archivos de cualquier tipo y tamaño, en
--      cualquier carpeta.
--
--  Después de correrlo, mirá sql/revisar.sql: tienen que dar todas
--  true.
-- ═══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- 1 · LA TABLA DE EVENTOS DEJA DE SER UNA GUÍA TELEFÓNICA
-- ══════════════════════════════════════════════════════════════
-- El código del evento pasa a ser lo que siempre debió ser: una llave.
-- Sin él no se ve nada; con él se ve ese evento y nada más.
--
-- Ojo con esto: Postgres exige permiso de LECTURA sobre las filas que
-- filtra un "update ... where" o un "delete ... where". Por eso la
-- regla de leer tiene que ser IGUAL de amplia que las de editar y
-- borrar, nunca más angosta, o el organizador deja de poder tocar su
-- propio evento. Las tres dicen ce_permitido(codigo).
drop policy if exists "ce eventos leer" on ce_eventos;
create policy "ce eventos leer" on ce_eventos for select to anon, authenticated
  using (ce_permitido(codigo));

drop policy if exists "ce items leer" on ce_items;
create policy "ce items leer" on ce_items for select to anon, authenticated
  using (ce_permitido(codigo));

-- Lo que ve el invitado, que no tiene clave: UN evento, el suyo, el que
-- le apunta el QR. Nunca una lista.
create or replace function ce_evento_publico(p_codigo text)
returns json language plpgsql stable security definer set search_path = public as $$
declare v json;
begin
  if p_codigo is null or length(p_codigo) < 3 or length(p_codigo) > 40 then
    return null;
  end if;
  select to_json(e) into v from ce_eventos e where e.codigo = p_codigo;
  return v;   -- null si no existe: el que prueba códigos al azar no saca nada
end $$;

-- Y los recuerdos de ESE evento, de a tandas. El invitado ve solamente
-- lo aprobado; el organizador (el que trae la clave) ve todo, que para
-- eso tiene la solapa de moderar.
create or replace function ce_items_de(p_codigo text, p_desde integer, p_cuanto integer)
returns json language plpgsql stable security definer set search_path = public as $$
declare v_puede boolean; v json;
begin
  -- Una sola vez, no una por fila: ce_permitido compara un bcrypt, que
  -- a propósito es lento. Adentro de un "where" lo corría por cada
  -- recuerdo del álbum.
  v_puede := ce_permitido(p_codigo);
  select coalesce(json_agg(to_json(t) order by t.ts, t.id), '[]'::json) into v
  from (select i.* from ce_items i
         where i.codigo = p_codigo
           and (v_puede or i.estado = 'aprobado')
         order by i.ts, i.id
         offset greatest(coalesce(p_desde, 0), 0)
         limit least(greatest(coalesce(p_cuanto, 1000), 1), 1000)) t;
  return v;
end $$;

-- Un recuerdo suelto, por su id. Se usa al volver de subir uno.
create or replace function ce_item(p_codigo text, p_id text)
returns json language plpgsql stable security definer set search_path = public as $$
declare v json;
begin
  select to_json(i) into v from ce_items i
   where i.codigo = p_codigo and i.id = p_id
     and (ce_permitido(p_codigo) or i.estado = 'aprobado');
  return v;
end $$;

grant execute on function ce_evento_publico(text), ce_items_de(text,integer,integer),
  ce_item(text,text) to anon, authenticated;

-- ── y ahora lo que casi se nos escapa ──
-- Las reglas del depósito preguntan "¿existe el evento de esta carpeta?"
-- con un select a ce_eventos. Ese select corre como el que sube o mira, o
-- sea anon, así que AHORA que ce_eventos ya no es de lectura libre, anon no
-- ve ninguna fila y la respuesta pasa a ser siempre "no existe".
--
-- Eso da vuelta la regla de leer del rollo: su segunda rama ("el evento ya
-- no existe") es la que deja limpiar los archivos que sobran, y de golpe
-- valía para TODAS las fotos. Cualquiera podía firmar y mirar las fotos de
-- un rollo sin revelar, que es exactamente lo que el producto promete que
-- no pasa.
--
-- Es la misma trampa que ya nos había costado caro con el borrado: una
-- política no ve más de lo que ve quien la dispara. La salida es la misma
-- que usa ce_ruta_reservada: preguntarle a una función que corre como
-- dueña. Estas dos solo devuelven sí o no.
create or replace function ce_evento_existe(p_codigo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ce_eventos where codigo = p_codigo);
$$;
create or replace function ce_evento_abierto(p_codigo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ce_eventos
                 where codigo = p_codigo and coalesce(cerrado,false) = false);
$$;
grant execute on function ce_evento_existe(text), ce_evento_abierto(text)
  to anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- 2 · LA CLAVE MAESTRA NO SE PRUEBA DESDE INTERNET
-- ══════════════════════════════════════════════════════════════
-- Cambiarla es algo que se hace una vez cada tanto, desde el SQL Editor,
-- sentado. No hay ningún motivo para que esa puerta esté abierta al
-- mundo, y estándolo cualquiera podía ir probando claves hasta acertar:
-- el que acierta, la cambia, y el dueño se queda afuera.
--     select ce_cambiar_maestra('la de ahora','la nueva');   ← desde el editor
revoke execute on function ce_cambiar_maestra(text,text) from anon, authenticated, public;

-- ══════════════════════════════════════════════════════════════
-- 3 · UNA FOTO DEL ROLLO SOLO PUEDE IR A SU PROPIA CARPETA
-- ══════════════════════════════════════════════════════════════
-- El camino del archivo lo mandaba el teléfono y la base lo creía. Con
-- eso alcanzaba para reservar (y después subir) un archivo dentro de la
-- carpeta de OTRO evento, o de una carpeta que no es de ningún evento
-- —que por la regla de lectura del depósito queda visible para siempre,
-- porque "el evento no existe" es justamente el caso que dejamos pasar
-- para poder limpiar lo que sobra.
create or replace function ce_tomar_foto(p_codigo text, p_token text, p_filtro text, p_ruta text)
returns json language plpgsql security definer set search_path = public as $$
declare v_disparos integer; v_cupo integer; v_cerrado boolean; v_camara boolean;
begin
  if p_filtro not in ('natural','clasico','bn','flash','dorado') then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;

  -- El camino tiene que ser exactamente CODIGO/TOKEN/algo.jpg, con el
  -- código y el token de quien está sacando la foto. Tres partes, sin
  -- barras de más, sin ".." y sin caracteres raros.
  if p_ruta is null
     or p_ruta !~ '^[A-Za-z0-9._-]{1,48}/[A-Za-z0-9._-]{1,64}/[A-Za-z0-9._-]{1,80}\.jpg$'
     or position('..' in p_ruta) > 0
     or split_part(p_ruta, '/', 1) <> p_codigo
     or split_part(p_ruta, '/', 2) <> p_token then
    raise exception 'Camino de archivo inválido' using errcode = '22023';
  end if;

  select cupo_fotos, cerrado, camara into v_cupo, v_cerrado, v_camara
    from ce_eventos where codigo = p_codigo;
  if not found or not coalesce(v_camara,false) then
    raise exception 'Esta fiesta no tiene cámara' using errcode = 'P0002';
  end if;
  if coalesce(v_cerrado,false) then
    raise exception 'La cámara ya cerró' using errcode = '28000';
  end if;

  select disparos into v_disparos from ce_rollos
    where token = p_token and codigo = p_codigo for update;
  if not found then
    raise exception 'Ese rollo no existe' using errcode = '28000';
  end if;
  if v_disparos >= coalesce(v_cupo, 24) then
    raise exception 'Ya usaste todas tus fotos' using errcode = '28000';
  end if;

  insert into ce_disparos(id, codigo, token, filtro, ruta, ts)
    values (gen_random_uuid()::text, p_codigo, p_token, p_filtro, p_ruta,
            (extract(epoch from now())*1000)::bigint);
  update ce_rollos set disparos = disparos + 1 where token = p_token;

  return json_build_object('restantes', coalesce(v_cupo, 24) - v_disparos - 1);
end $$;

-- ══════════════════════════════════════════════════════════════
-- 4 · UN ROLLO NO PUEDE TENER INVITADOS INFINITOS
-- ══════════════════════════════════════════════════════════════
-- El token lo inventa el teléfono, así que inventando tokens se creaban
-- rollos sin fin, de 24 fotos cada uno. Una foto pesa como 441 KB: con
-- mil tokens son diez gigas en el depósito que paga el negocio.
alter table ce_eventos add column if not exists cupo_invitados integer default 300;

create or replace function ce_mi_rollo(p_codigo text, p_token text, p_nombre text)
returns json language plpgsql security definer set search_path = public as $$
declare v_camara boolean; v_cerrado boolean; v_cupo integer; v_revela_en timestamptz;
        v_disparos integer; v_nombre text; v_cupo_inv integer; v_cuantos integer;
begin
  -- El token también viene del teléfono: que sea algo razonable y no un
  -- texto de un megabyte.
  if p_token is null or p_token !~ '^[A-Za-z0-9._-]{8,64}$' then
    raise exception 'Rollo inválido' using errcode = '22023';
  end if;

  select camara, cerrado, cupo_fotos, revela_en, cupo_invitados
    into v_camara, v_cerrado, v_cupo, v_revela_en, v_cupo_inv
    from ce_eventos where codigo = p_codigo;
  if not found then
    raise exception 'No existe ese evento' using errcode = 'P0002';
  end if;

  if not exists (select 1 from ce_rollos where token = p_token and codigo = p_codigo) then
    select count(*) into v_cuantos from ce_rollos where codigo = p_codigo;
    if v_cuantos >= coalesce(v_cupo_inv, 300) then
      raise exception 'Esta fiesta ya tiene todas sus cámaras repartidas' using errcode = '28000';
    end if;
    insert into ce_rollos(token, codigo, nombre)
      values (p_token, p_codigo,
              -- el nombre se dibuja en el álbum: que entre en la pantalla
              left(coalesce(nullif(trim(coalesce(p_nombre,'')),''), 'Invitado'), 40))
    on conflict (token) do nothing;
  end if;

  select disparos, nombre into v_disparos, v_nombre from ce_rollos
    where token = p_token and codigo = p_codigo;
  if not found then
    raise exception 'Ese rollo no es de este evento' using errcode = '28000';
  end if;

  return json_build_object(
    'token', p_token, 'nombre', v_nombre,
    'disparos', v_disparos, 'cupo', coalesce(v_cupo, 24),
    'camara', coalesce(v_camara,false), 'cerrado', coalesce(v_cerrado,false),
    'revelado', ce_camara_revelada(p_codigo), 'revela_en', v_revela_en
  );
end $$;

-- Y que nadie se ponga un cupo de un millón de fotos por invitado.
do $ce$
begin
  execute 'alter table ce_eventos drop constraint if exists ce_cupos_sanos';
  execute $c$alter table ce_eventos add constraint ce_cupos_sanos check (
    (cupo_fotos     is null or cupo_fotos     between 1 and 100) and
    (cupo_invitados is null or cupo_invitados between 1 and 2000))$c$;
exception when others then
  raise notice 'No se pudo poner el tope de cupos (%). Revisá si hay filas con valores fuera de rango.', sqlerrm;
end $ce$;

grant execute on function ce_mi_rollo(text,text,text), ce_tomar_foto(text,text,text,text)
  to anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- 5 · EL DEPÓSITO DEL MURO
-- ══════════════════════════════════════════════════════════════
-- ce-medios es público a propósito (las fotos se proyectan y se
-- comparten). Lo que no puede ser es que acepte CUALQUIER archivo en
-- CUALQUIER carpeta: así se le sube un .html a un dominio del negocio y
-- se usa el depósito de hosting, además de inflar la factura.
--
-- Todo va adentro de bloques que atrapan el error, como en claves.sql:
-- desde 2025 Supabase no siempre deja tocar storage desde el editor, y
-- un error suelto deshace el archivo entero.
do $ce$
declare v_faltan text := '';
begin
  -- subir: solo a la carpeta de un evento que existe y no está cerrado
  begin
    execute 'drop policy if exists "ce medios subir" on storage.objects';
    execute $pol$
      create policy "ce medios subir" on storage.objects for insert to anon, authenticated
        with check (
          bucket_id = 'ce-medios'
          and public.ce_evento_abierto(split_part(objects.name, '/', 1))
        )$pol$;
    raise notice 'REGLA OK: "ce medios subir".';
  exception when insufficient_privilege or undefined_table then
    v_faltan := v_faltan || ' la regla de subir de ce-medios;';
  end;

  -- No hay regla de UPDATE para ce-medios, y no la tiene que haber: sin
  -- ella no se puede PISAR un archivo que ya está. Con el depósito
  -- abierto para que suban los invitados, poder pisar quiere decir que
  -- cualquiera cambia la portada que se proyecta en el salón.
  begin
    execute 'drop policy if exists "ce medios editar" on storage.objects';
    execute 'drop policy if exists "ce medios actualizar" on storage.objects';
  exception when insufficient_privilege or undefined_table then null;
  end;

  -- tamaño y tipo, en el depósito mismo: el tope del navegador lo pone
  -- nuestra página, y a la página no hay que creerle nada.
  begin
    update storage.buckets
       set file_size_limit = 62914560,                        -- 60 MB
           allowed_mime_types = array['image/*','video/*','audio/*']
     where id = 'ce-medios';
    update storage.buckets
       set file_size_limit = 10485760,                        -- 10 MB
           allowed_mime_types = array['image/jpeg']
     where id = 'ce-rollos';
    raise notice 'LÍMITES OK: tamaño y tipo de archivo en los dos depósitos.';
  exception when others then
    v_faltan := v_faltan || ' los límites de tamaño y tipo (se ponen a mano en Storage → el depósito → Settings);';
  end;

  -- Las tres reglas que preguntaban "¿ya no existe el evento?" con un select
  -- a mano. Van de nuevo, ahora por ce_evento_existe.
  begin
    execute 'drop policy if exists "ce medios borrar" on storage.objects';
    execute $pol$
      create policy "ce medios borrar" on storage.objects for delete to anon, authenticated
        using (
          bucket_id = 'ce-medios'
          and not public.ce_evento_existe(split_part(objects.name, '/', 1))
        )$pol$;
    execute 'drop policy if exists "ce rollos leer" on storage.objects';
    execute $pol$
      create policy "ce rollos leer" on storage.objects for select to anon, authenticated
        using (
          bucket_id = 'ce-rollos'
          and (
            public.ce_camara_revelada(split_part(name, '/', 1))
            or not public.ce_evento_existe(split_part(name, '/', 1))
          )
        )$pol$;
    execute 'drop policy if exists "ce rollos borrar" on storage.objects';
    execute $pol$
      create policy "ce rollos borrar" on storage.objects for delete to anon, authenticated
        using (
          bucket_id = 'ce-rollos'
          and not public.ce_evento_existe(split_part(name, '/', 1))
        )$pol$;
    raise notice 'REGLAS OK: las tres que miran si el evento sigue existiendo.';
  exception when insufficient_privilege or undefined_table then
    v_faltan := v_faltan || ' las reglas de leer/borrar (hay que rehacerlas a mano usando ce_evento_existe);';
  end;

  if v_faltan <> '' then
    raise notice '── ATENCIÓN ──';
    raise notice 'Todo lo demás quedó puesto, pero este proyecto no deja tocar el depósito desde el editor.';
    raise notice 'Falta a mano, desde el panel de Storage:%', v_faltan;
  end if;
end $ce$;
