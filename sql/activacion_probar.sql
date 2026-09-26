\pset tuples_only on
\pset format unaligned

/* ── EL ALTA DEJA DE SER GRATIS ──
   Se ataca como el que quiere el producto sin pagar: crear un evento sin
   código, con uno inventado, con uno ya usado, y gastando el mismo dos
   veces. Y del otro lado, que el dueño siga pudiendo trabajar.

   Contra el esquema SIN activacion.sql falla: ahí el alta es libre. */

create or replace function verificar(titulo text, condicion boolean, detalle text default '')
returns text language sql as
$$ select case when condicion then '  ✓ ' else '  ✗ ' end || titulo
   || case when condicion or detalle='' then '' else '   ['||detalle||']' end $$;

/* Corre algo con unas cabeceras dadas y dice si anduvo. */
create or replace function alta(clave text, activacion text, cod text) returns text
language plpgsql as $$
declare cab json;
begin
  cab := json_strip_nulls(json_build_object('x-clave', clave, 'x-activacion', activacion));
  perform set_config('request.headers', cab::text, false);
  begin
    insert into ce_eventos(codigo, nombre, fecha, creado)
      values (cod, 'Fiesta gratis', '2026-12-20', (extract(epoch from now())*1000)::bigint);
    return 'ok';
  exception when others then
    return 'error: ' || substr(sqlerrm, 1, 60);
  end;
end $$;

set role postgres;
/* La maestra de la copia limpia es el marcador de posición de claves.sql.
   Sin esto, ce_es_maestra() da false y TODO lo del dueño falla por el
   motivo equivocado: parece que el candado está mal y está bien. Es lo
   mismo que hace probar.sql. */
update ce_ajustes set valor = crypt('CLAVE-MAESTRA-DE-PRUEBA', gen_salt('bf'))
 where nombre = 'maestra';
delete from ce_eventos where codigo like 'QUI-ACT%';
delete from ce_codigos where nota = 'prueba';
select set_config('request.headers', '{"x-clave":"CLAVE-MAESTRA-DE-PRUEBA"}', false);

\echo ''
\echo '── sin código no hay evento ──'

select verificar('sin código de activación, la base se niega',
  alta('una-clave-cualquiera', null, 'QUI-ACT01') like 'error%');

select verificar('y con un código inventado tampoco',
  alta('una-clave-cualquiera', 'CE-INVENTADO', 'QUI-ACT02') like 'error%');

select verificar('ninguno de los dos eventos existe',
  not exists(select 1 from ce_eventos where codigo in ('QUI-ACT01','QUI-ACT02')));

\echo ''
\echo '── con un código de verdad sí ──'

select set_config('request.headers', '{"x-clave":"CLAVE-MAESTRA-DE-PRUEBA"}', false);
create temp table elcodigo as select (ce_crear_codigo('prueba')->>'codigo') as c;

select verificar('el dueño genera un código',
  (select c from elcodigo) like 'CE-%', (select c from elcodigo));

select verificar('y con ese código el cliente crea su evento',
  alta('la-clave-del-cliente', (select c from elcodigo), 'QUI-ACT03') = 'ok');

\echo ''
\echo '── y sirve UNA sola vez ──'

select verificar('el mismo código no entra dos veces',
  alta('otra-clave', (select c from elcodigo), 'QUI-ACT04') like '%ya se usó%');

select verificar('el segundo evento no existe',
  not exists(select 1 from ce_eventos where codigo = 'QUI-ACT04'));

select verificar('y queda anotado qué evento lo gastó',
  (select usado_por from ce_codigos where codigo = (select c from elcodigo)) = 'QUI-ACT03');

\echo ''
\echo '── el dueño sigue trabajando ──'

select verificar('con la clave maestra no hace falta código',
  alta('CLAVE-MAESTRA-DE-PRUEBA', null, 'QUI-ACT05') = 'ok');

\echo ''
\echo '── los códigos no se pueden espiar ──'

select verificar('un desconocido no puede listar los códigos',
  not has_table_privilege('anon', 'ce_codigos', 'select'));

create or replace function probar_lista(clave text) returns text
language plpgsql as $$
begin
  perform set_config('request.headers', json_build_object('x-clave', clave)::text, false);
  begin
    perform ce_codigos_lista();
    return 'ok';
  exception when others then return 'error: ' || substr(sqlerrm, 1, 40);
  end;
end $$;

select verificar('ni pedirlos por la función, sin la maestra',
  probar_lista('la-clave-de-un-evento') like '%Sin permiso%');

select verificar('ni generarse uno',
  (select case when ce_es_maestra() then 'maestra' else 'no' end
     from (select set_config('request.headers','{"x-clave":"cualquiera"}',false)) _) = 'no');

select verificar('pero el dueño sí los ve',
  probar_lista('CLAVE-MAESTRA-DE-PRUEBA') = 'ok');
