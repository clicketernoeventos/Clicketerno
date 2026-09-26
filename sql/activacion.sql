-- ══════════════════════════════════════════════════════════════════
--  EL ALTA DEJA DE SER GRATIS
--
--  Hasta acá cualquiera que llegara a /#entrar se armaba su evento sin
--  pagar: la "clave" que pide el panel es un PIN que el propio visitante
--  inventa y que se guarda EN ESE TELÉFONO —el comentario del código lo
--  dice: "sirve de traba en este aparato y nada más"—, y en el rollo no
--  había ni eso. Y no hacía falta ni el navegador: la política de INSERT
--  de ce_eventos dice "with check (true)", así que con curl también.
--
--  Es la misma trampa de siempre, la tercera vez que aparece: **lo que
--  decide el navegador no es una regla, es una decoración.** Esconder el
--  botón no cierra nada. El candado va acá.
--
--  CÓMO FUNCIONA
--  El dueño vende por WhatsApp como ya lo hace, cobra como quiera, y le
--  pasa al cliente un código de activación de un solo uso. Sin un código
--  válido la base NO crea el evento.
--
--    · El dueño los genera con ce_crear_codigo('para quién es'), que pide
--      la clave maestra.
--    · El navegador lo manda en la cabecera x-activacion.
--    · El disparador lo consume: lo marca usado y anota qué evento lo usó.
--      Un código sirve UNA vez.
--    · Con la clave maestra NO hace falta código: es para cuando el
--      evento lo arma Click Eterno, que es como se vende hoy.
--
--  LO QUE NO HACE, y conviene saberlo: esto no cobra. Es una puerta, no
--  una caja. El día que se quiera automatizar con Mercado Pago, MP no
--  tiene que hacer otra cosa que llamar a ce_crear_codigo cuando el pago
--  se acredita: este archivo es la base sobre la que eso se enchufa, no
--  un reemplazo.
--
--  EL ORDEN IMPORTA: PRIMERO LA WEB, DESPUÉS ESTO. La web nueva manda la
--  cabecera y, si la base todavía no tiene el candado, el evento se crea
--  igual. La web vieja NO manda nada, así que con este archivo puesto
--  antes de publicar, el alta deja de andar para todos —incluido el
--  dueño—. Es la misma regla que con blindaje.sql.
--
--  Es seguro correrlo más de una vez.
--  Al final, las cuatro comprobaciones tienen que dar true.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. los códigos ──
create table if not exists ce_codigos(
  codigo     text primary key,
  nota       text,
  creado     timestamptz not null default now(),
  usado_en   timestamptz,
  usado_por  text                      -- el código del evento que lo gastó
);
-- RLS prendido y SIN políticas: nadie los toca directo, ni para leerlos.
-- Si se pudieran leer, se podrían usar.
alter table ce_codigos enable row level security;
revoke all on table ce_codigos from anon, authenticated;

-- ── 2. leer la cabecera, igual que ce_clave_dada() ──
create or replace function ce_activacion_dada() returns text
language plpgsql stable as $$
declare cab text;
begin
  cab := current_setting('request.headers', true);
  if cab is null or cab = '' then return null; end if;
  return nullif(upper(trim(cab::json ->> 'x-activacion')), '');
exception when others then return null;
end $$;

-- ── 3. la puerta ──
-- Disparador y no política, por el mismo motivo que ce_items_puerta: una
-- política solo sabe decir que no. Acá hace falta DECIR por qué, porque
-- del otro lado hay un cliente que pagó y escribió mal una letra.
create or replace function ce_eventos_activacion() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_act text; v_hay boolean;
begin
  -- El dueño arma la fiesta del cliente: con la maestra no hace falta código.
  if ce_es_maestra() then return new; end if;

  v_act := ce_activacion_dada();
  if v_act is null then
    raise exception 'Para crear el evento hace falta un código de activación'
      using errcode = '28000';
  end if;

  -- Se consume en el mismo movimiento en que se comprueba: dos pedidos
  -- simultáneos con el mismo código no pueden entrar los dos, porque el
  -- update bloquea la fila. Si el insert falla después, esto se deshace
  -- solo: es la misma transacción.
  update ce_codigos
     set usado_en = now(), usado_por = new.codigo
   where codigo = v_act and usado_en is null;
  get diagnostics v_hay = row_count;

  if not v_hay then
    if exists (select 1 from ce_codigos where codigo = v_act) then
      raise exception 'Ese código de activación ya se usó' using errcode = '28000';
    end if;
    raise exception 'No encontré ese código de activación' using errcode = '28000';
  end if;
  return new;
end $$;

drop trigger if exists ce_eventos_activacion on ce_eventos;
create trigger ce_eventos_activacion before insert on ce_eventos
  for each row execute function ce_eventos_activacion();

-- ── 4. generarlos, solo con la clave maestra ──
-- El código lo arma la BASE, no el navegador: "si el navegador lo genera,
-- el navegador lo puede repetir". gen_random_bytes viene de pgcrypto, que
-- ya está instalada porque la usa crypt().
create or replace function ce_crear_codigo(p_nota text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_cod text;
begin
  if not ce_es_maestra() then
    raise exception 'Sin permiso' using errcode = '28000';
  end if;
  -- 8 caracteres de un alfabeto sin las que se confunden a mano (0/O, 1/I)
  loop
    select 'CE-' || string_agg(
             substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
                    1 + (get_byte(gen_random_bytes(1), 0) % 32), 1), '')
      into v_cod from generate_series(1, 8);
    exit when not exists (select 1 from ce_codigos where codigo = v_cod);
  end loop;
  insert into ce_codigos(codigo, nota) values (v_cod, nullif(trim(coalesce(p_nota, '')), ''));
  return json_build_object('codigo', v_cod, 'nota', p_nota);
end $$;

-- ── 5. mirarlos, solo con la clave maestra ──
create or replace function ce_codigos_lista()
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not ce_es_maestra() then
    raise exception 'Sin permiso' using errcode = '28000';
  end if;
  return coalesce((select json_agg(json_build_object(
      'codigo', codigo, 'nota', nota, 'creado', creado,
      'usado_en', usado_en, 'usado_por', usado_por) order by creado desc)
    from (select * from ce_codigos order by creado desc limit 300) t), '[]'::json);
end $$;

revoke all on function ce_crear_codigo(text), ce_codigos_lista() from public;
grant execute on function ce_crear_codigo(text), ce_codigos_lista() to anon, authenticated;

-- ── que PostgREST se entere ──
notify pgrst, 'reload schema';

-- ══ las comprobaciones: las cuatro tienen que decir true ══
select 'la tabla de códigos existe' as que,
       to_regclass('public.ce_codigos') is not null as bien
union all
select 'nadie la puede leer directo',
       not has_table_privilege('anon', 'ce_codigos', 'select')
union all
select 'el alta pide código de activación',
       exists(select 1 from pg_trigger where tgname = 'ce_eventos_activacion')
union all
select 'y el dueño los puede generar',
       exists(select 1 from pg_proc where proname = 'ce_crear_codigo');
