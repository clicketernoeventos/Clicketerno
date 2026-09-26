-- ══════════════════════════════════════════════════════════════════
--  QUE NO SE QUEDE UNA FIESTA SIN CÁMARAS
--
--  Medido contra una copia del esquema de producción: alguien que lee
--  el QR de cualquier mesa —o al que le reenviaron el link por
--  WhatsApp— llama 300 veces a ce_mi_rollo con tokens inventados. Sin
--  clave, sin cuenta, 300 pedidos. Agotado cupo_invitados, al invitado
--  siguiente le contesta "Esta fiesta ya tiene todas sus cámaras
--  repartidas" y NO HAY FORMA DE ARREGLARLO DESDE EL PANEL: la fiesta
--  se quedó sin cámaras en el medio.
--
--  Es la misma familia que "si el navegador lo genera, el navegador lo
--  puede repetir": el token lo inventa el teléfono.
--
--  Tres piezas, y las tres hacen falta:
--
--    1. UN FRENO DE RITMO. Cien cámaras nuevas por minuto y por fiesta.
--       Ojo con bajarlo: cuando el QR aparece en la pantalla, doscientos
--       invitados lo leen en dos minutos. Cien por minuto es una fiesta;
--       trescientas en diez segundos es un script. Ya nos pasó de poner
--       un tope pensando en un atacante y cortarle el brindis a una
--       fiesta de verdad (ver rafaga.sql): el freno va holgado a
--       propósito. Llega como 429 para que el navegador espere y vuelva.
--
--    2. QUE NO CUENTEN LAS CÁMARAS VACÍAS Y VIEJAS. El cupo existe para
--       limitar lo que el negocio paga en depósito, y una cámara sin
--       ninguna foto no ocupa nada. Así que para decidir si entra una
--       nueva se cuentan las que TIENEN fotos, más las vacías recientes
--       —las de alguien que acaba de llegar y todavía no disparó—. Con
--       esto el ataque se cura solo a las tres horas.
--       No le saca la cámara a nadie: el token que ya existe sigue
--       andando igual, esto solo cambia la cuenta para admitir uno nuevo.
--
--    3. UNA SALIDA PARA EL ORGANIZADOR, que hoy no existe:
--       ce_liberar_vacias(codigo) borra las cámaras sin una sola foto y
--       devuelve cuántas liberó. Pide la clave del evento. Es lo que
--       salva la noche si igual llega a pasar: las otras dos la demoran,
--       ésta la arregla.
--
--  Va DESPUÉS de blindaje.sql, porque reemplaza ce_mi_rollo entera. Si
--  algún día se vuelve a correr blindaje.sql, hay que volver a correr
--  este.
--
--  Es seguro correrlo más de una vez. No toca ninguna tabla ni ninguna
--  política.
--
--  Al final tienen que dar las tres comprobaciones en true.
-- ══════════════════════════════════════════════════════════════════

create or replace function ce_mi_rollo(p_codigo text, p_token text, p_nombre text)
returns json language plpgsql security definer set search_path = public as $$
declare v_camara boolean; v_cerrado boolean; v_cupo integer; v_revela_en timestamptz;
        v_disparos integer; v_nombre text; v_cupo_inv integer; v_cuantos integer;
        v_nuevas integer;
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

    -- (1) ritmo: cien cámaras nuevas por minuto y por fiesta.
    select count(*) into v_nuevas from ce_rollos
     where codigo = p_codigo and creado > now() - interval '1 minute';
    if v_nuevas >= 100 then
      raise exception 'Se están abriendo muchas cámaras juntas, probá de nuevo en un minuto'
        using errcode = 'PT429';
    end if;

    -- (2) el cupo cuenta las que tienen fotos y las vacías recientes. Una
    --     cámara sin una sola foto y de hace horas no es un invitado.
    select count(*) into v_cuantos from ce_rollos
     where codigo = p_codigo
       and (disparos > 0 or creado > now() - interval '3 hours');
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

-- ── (3) la salida del organizador ──
-- Borra las cámaras que no tienen NI UNA foto. La cascada de ce_disparos
-- no se lleva nada porque justamente no hay disparos; y el que estaba
-- usando esa cámara sin haber sacado ninguna vuelve a pedir la suya y le
-- dan una nueva, que es lo mismo que tenía.
create or replace function ce_liberar_vacias(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare v_borradas integer;
begin
  if not ce_permitido(p_codigo) then
    raise exception 'Sin permiso para este evento' using errcode = '28000';
  end if;
  delete from ce_rollos where codigo = p_codigo and disparos = 0;
  get diagnostics v_borradas = row_count;
  return json_build_object('liberadas', v_borradas,
    'quedan', (select count(*) from ce_rollos where codigo = p_codigo));
end $$;

revoke all on function ce_liberar_vacias(text) from public;
grant execute on function ce_liberar_vacias(text) to anon, authenticated;


-- ── que PostgREST se entere ──
-- El caché de esquema de PostgREST no se actualiza solo al toque: una
-- función recién creada existe en la base pero la API contesta PGRST202,
-- "no matches were found in the schema cache". O sea que el SQL da todas
-- las comprobaciones en true —miran pg_proc directo— y la app sigue sin
-- poder llamarla. Medido el 25/09/2026 con ce_espiar_cabeceras.
notify pgrst, 'reload schema';

-- ══ las comprobaciones: las tres tienen que decir true ══
select 'freno de ritmo al abrir cámaras' as que,
       (regexp_match(prosrc, 'v_nuevas >= (\d+)'))[1] as vale,
       prosrc like '%v_nuevas >= 100%' as bien
  from pg_proc where proname = 'ce_mi_rollo'
union all
select 'el cupo no cuenta las vacías viejas', '3 horas',
       prosrc like '%disparos > 0 or creado >%'
  from pg_proc where proname = 'ce_mi_rollo'
union all
select 'el organizador puede liberar las vacías', 'ce_liberar_vacias',
       exists(select 1 from pg_proc where proname = 'ce_liberar_vacias');
