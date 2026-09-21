-- ═══════════════════════════════════════════════════════════════
--  CLICK ETERNO · blindaje 2 · el muro
--
--  Se corre UNA vez, DESPUÉS de blindaje.sql. Es seguro correrlo de
--  nuevo: no duplica ni pisa datos.
--
--  El rollo ya estaba blindado; el muro no. Medido contra una copia
--  local del esquema de producción, un desconocido SIN NINGUNA CLAVE
--  podía:
--
--   1. Meter 500 filas en el muro de una fiesta ajena. Y 500.000: no
--      había ningún tope. El almacenamiento lo paga el negocio y la
--      pantalla del salón proyecta lo que llegue.
--   2. Seguir subiendo con el muro CERRADO. El organizador aprieta
--      "Muro cerrado" y la app deja de mostrarle el formulario, pero eso
--      lo decide el navegador: la base aceptaba igual. Es exactamente la
--      trampa que ya nos costó caro dos veces.
--   3. Meter fotos en un evento que NO EXISTE. Filas huérfanas que no
--      se pueden limpiar desde ningún lado, porque no hay evento al que
--      borrarle nada.
--   4. Elegir el "ts" de su recuerdo, que es lo que ordena la
--      proyección. Poniendo un número grande, su foto quedaba SIEMPRE
--      primera en la pantalla del salón, toda la noche.
--
--  El depósito de archivos ya estaba bien (ce_evento_abierto y los
--  límites de tamaño y tipo). Lo que faltaba era la tabla.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. la puerta de ce_items ──
-- Va como disparador y no como política para poder DECIR qué pasó: una
-- política rechaza con "new row violates row-level security policy", que
-- al invitado de una fiesta no le explica nada.
create or replace function ce_items_puerta() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cuantos integer; v_rafaga integer; v_ahora bigint;
begin
  v_ahora := (extract(epoch from now()) * 1000)::bigint;

  -- a) el evento tiene que existir y estar abierto. Mismo criterio que
  --    usa el depósito para aceptar el archivo: si no, la foto entraba
  --    en la tabla y el archivo no, o al revés.
  if not ce_evento_existe(new.codigo) then
    raise exception 'No encontré esa fiesta' using errcode = 'P0002';
  end if;
  if not ce_evento_abierto(new.codigo) then
    raise exception 'El muro de esta fiesta está cerrado' using errcode = '28000';
  end if;

  -- b) el "cuándo" lo pone la base, no el teléfono. Con el ts en manos
  --    del que sube, poner 9999999999999 dejaba su foto primera en la
  --    proyección para siempre.
  new.ts := v_ahora;

  -- c) los largos. El navegador los corta en 26, 90 y 180; a la página
  --    no hay que creerle nada. Se recortan en vez de rechazar: que una
  --    dedicatoria larga entre cortada es mejor que perderla.
  new.autor := left(coalesce(new.autor, ''), 40);
  new.texto := left(coalesce(new.texto, ''), 400);
  if length(coalesce(new.url, '')) > 600 then
    raise exception 'La dirección del archivo es demasiado larga' using errcode = '22023';
  end if;

  -- d) que sea una de las cuatro cosas que el muro sabe mostrar
  if coalesce(new.kind, '') not in ('foto', 'video', 'mensaje', 'voz') then
    raise exception 'Tipo de recuerdo desconocido' using errcode = '22023';
  end if;

  -- e) tope por fiesta. Doscientos invitados con diez recuerdos cada uno
  --    son dos mil: ninguna fiesta de verdad llega, un script sí.
  select count(*) into v_cuantos from ce_items where codigo = new.codigo;
  if v_cuantos >= 2000 then
    raise exception 'Esta fiesta ya llegó al tope de recuerdos' using errcode = '28000';
  end if;

  -- f) ráfaga. En el brindis suben todos juntos, así que el tope es
  --    alto: ciento veinte por minuto no los manda una persona.
  select count(*) into v_rafaga from ce_items
   where codigo = new.codigo and ts > v_ahora - 60000;
  if v_rafaga >= 120 then
    raise exception 'Están llegando muchas juntas, probá de nuevo en un minuto'
      using errcode = '28000';
  end if;

  return new;
end $$;

-- Los dos nombres: el viejo por si quedó de una corrida anterior, y el
-- que se usa ahora. Sin el segundo, correr este archivo dos veces falla
-- con "trigger already exists" — y "es seguro correrlo de nuevo" tiene
-- que ser cierto, no una intención.
drop trigger if exists ce_items_puerta   on ce_items;
drop trigger if exists z_ce_items_puerta on ce_items;
-- Se llama "z_..." a propósito: los disparadores BEFORE corren en orden
-- alfabético y este tiene que correr DESPUÉS de ce_items_estado, que es
-- el que decide si el recuerdo nace pendiente o aprobado.
create trigger z_ce_items_puerta before insert on ce_items
  for each row execute function ce_items_puerta();

-- ── 2. que no se puedan crear eventos sin fin ──
-- Crear un evento es gratis y sin cuenta, y cada evento habilita una
-- carpeta en el depósito. Un script que crea cien mil eventos abre cien
-- mil carpetas. Una persona crea uno cada tanto; treinta por minuto en
-- toda la base no los crea nadie a mano.
create or replace function ce_eventos_freno() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_rafaga integer;
begin
  select count(*) into v_rafaga from ce_eventos
   where creado > (extract(epoch from now()) * 1000)::bigint - 60000;
  if v_rafaga >= 30 then
    raise exception 'Se están creando muchos eventos a la vez. Probá en un minuto.'
      using errcode = '28000';
  end if;
  return new;
end $$;

drop trigger if exists ce_eventos_freno on ce_eventos;
create trigger ce_eventos_freno before insert on ce_eventos
  for each row execute function ce_eventos_freno();

-- ── 3. dejar asentado que el organizador aceptó ──
-- Quién responde por los datos de una fiesta es el que la organiza: él
-- decide hacerla, él invita y él sabe quiénes son menores. Nosotros
-- tratamos por su cuenta y orden (art. 25 de la Ley 25.326). Eso está
-- escrito en los Términos, y acá queda la constancia de CUÁNDO lo aceptó:
-- sin la casilla marcada la app no crea el evento, y el momento se guarda.
-- Un contrato que nadie puede probar que se aceptó no sirve de mucho.
alter table ce_eventos add column if not exists acepto bigint;

-- ── 4. comprobación ──
-- Las cuatro tienen que dar true después de correr esto.
select 'la puerta de ce_items está puesta' as que,
       exists(select 1 from pg_trigger where tgname = 'z_ce_items_puerta') as ok
union all
select 'el freno de ce_eventos está puesto',
       exists(select 1 from pg_trigger where tgname = 'ce_eventos_freno')
union all
select 'ce_items_puerta corre como dueña (security definer)',
       (select p.prosecdef from pg_proc p where p.proname = 'ce_items_puerta')
union all
select 'ce_evento_abierto existe (la usa la puerta)',
       exists(select 1 from pg_proc where proname = 'ce_evento_abierto')
union all
select 'columna acepto · constancia de quién se hizo cargo',
       exists(select 1 from information_schema.columns
              where table_name = 'ce_eventos' and column_name = 'acepto');
