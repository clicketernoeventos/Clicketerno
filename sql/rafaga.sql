-- ══════════════════════════════════════════════════════════════════
--  EL BRINDIS NO ES UN ATAQUE
--
--  El freno de ráfaga de ce_items_puerta cortaba en 120 recuerdos por
--  minuto POR FIESTA. Medido contra una copia del esquema de producción
--  entero: en una fiesta de 200 invitados, cuando el QR aparece en la
--  pantalla o se levanta el brindis, la número 121 rebota con
--  "Están llegando muchas juntas". Doscientos en un minuto no los manda
--  un script: los manda una fiesta.
--
--  Dos cambios, nada más:
--
--    1. El tope pasa de 120 a 300 por minuto. El techo de verdad sigue
--       siendo el de 2000 por fiesta, que es el que limita lo que un
--       script puede costarnos en depósito; este de acá solo existe
--       para que nadie meta diez mil filas en diez segundos.
--
--    2. El error pasa de '28000' a 'PT429'. PostgREST traduce los
--       códigos que empiezan con PT al estado HTTP de los tres dígitos,
--       así que el navegador recibe un 429 —"muchos pedidos"— en vez de
--       un 403 —"no podés"—, que es lo que de verdad pasó. La app ya
--       sabe esperar y volver a intentar cuando ve un 429, así que en
--       esa espera el recuerdo entra solo y el invitado no se entera.
--       Igual la app lo reconoce también por el texto del mensaje, así
--       que si esa traducción no fuera la esperada, sigue andando.
--
--  Es seguro correrlo más de una vez: reemplaza la función entera.
--  No toca ninguna política, ningún disparador y ninguna tabla.
--
--  Después de correrlo, la última consulta tiene que decir 300.
-- ══════════════════════════════════════════════════════════════════

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

  -- f) ráfaga. En el brindis suben todos juntos. Estaba en 120 y se
  --    midió que en una fiesta de 200 eso rebota a partir de la 121:
  --    trescientos por minuto es una fiesta, no un script. Y va con
  --    PT429 para que el navegador reciba "muchos pedidos" y no "no
  --    podés": con eso la app espera y vuelve sola.
  select count(*) into v_rafaga from ce_items
   where codigo = new.codigo and ts > v_ahora - 60000;
  if v_rafaga >= 300 then
    raise exception 'Están llegando muchas juntas, probá de nuevo en un minuto'
      using errcode = 'PT429';
  end if;

  return new;
end $$;


-- ── que PostgREST se entere ──
-- El caché de esquema de PostgREST no se actualiza solo al toque: una
-- función recién creada existe en la base pero la API contesta PGRST202,
-- "no matches were found in the schema cache". O sea que el SQL da todas
-- las comprobaciones en true —miran pg_proc directo— y la app sigue sin
-- poder llamarla. Medido el 25/09/2026 con ce_espiar_cabeceras.
notify pgrst, 'reload schema';

-- ── la comprobación: tiene que decir 300 ──
select 'tope de ráfaga por minuto' as que,
       (regexp_match(prosrc, 'v_rafaga >= (\d+)'))[1] as vale,
       (regexp_match(prosrc, 'v_rafaga >= (\d+)'))[1] = '300' as bien
  from pg_proc where proname = 'ce_items_puerta';
