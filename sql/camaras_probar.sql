\pset tuples_only on
\pset format unaligned

/* ── QUE NO SE QUEDE UNA FIESTA SIN CÁMARAS ──
   Mide lo que arregla camaras.sql, atacándolo como lo haría el que lee
   el QR de una mesa: tokens inventados hasta agotar el cupo.

   Contra el esquema SIN camaras.sql estas comprobaciones fallan: el
   invitado de verdad queda afuera y no hay ninguna forma de arreglarlo.
   (ce_liberar_vacias ni siquiera existe.) */

create or replace function verificar(titulo text, condicion boolean, detalle text default '')
returns text language sql as
$$ select case when condicion then '  ✓ ' else '  ✗ ' end || titulo
   || case when condicion or detalle='' then '' else '   ['||detalle||']' end $$;

/* Corre algo y dice si anduvo, sin tumbar el archivo. */
create or replace function intento(clave text, sql text) returns text
language plpgsql as $$
begin
  perform set_config('request.headers',
    case when clave is null then '{}' else json_build_object('x-clave',clave)::text end, false);
  begin
    execute sql;
    return 'ok';
  exception when others then
    return 'error: '||substr(sqlerrm,1,60);
  end;
end $$;

set role postgres;
delete from ce_disparos; delete from ce_rollos;
delete from ce_eventos where codigo like 'QUI-CAM%';

select set_config('request.headers','{"x-clave":"clave-de-la-fiesta"}',false);
insert into ce_eventos(codigo,nombre,fecha,camara,cupo_fotos,cupo_invitados,creado)
  values ('QUI-CAM01','Fiesta sin cámaras','2026-12-20',true,24,10,
          (extract(epoch from now())*1000)::bigint);

\echo ''
\echo '── el que lee el QR agota el cupo con tokens inventados ──'

/* El tope se mide con un begin/exception POR llamada: adentro de un solo
   bloque, la primera excepción revierte todo y el resultado dice "entraron
   cero", que parece un blindaje perfecto y no es lo que pasa. */
do $$
declare i int;
begin
  for i in 1..30 loop
    begin perform ce_mi_rollo('QUI-CAM01','atacante-'||lpad(i::text,8,'0'),'x');
    exception when others then null; end;
  end loop;
end $$;

select verificar('el atacante llena el cupo (es lo que hay que poder arreglar)',
  (select count(*) from ce_rollos where codigo='QUI-CAM01') >= 10,
  'abrió '||(select count(*) from ce_rollos where codigo='QUI-CAM01')||' cámaras');

select verificar('y con el cupo lleno, el invitado de verdad no entra',
  intento('clave-de-la-fiesta',
    'select ce_mi_rollo(''QUI-CAM01'',''invitado-real-001'',''Ana'')') like 'error%');

\echo ''
\echo '── la salida del organizador ──'

-- una cámara CON fotos, que no se puede borrar
insert into ce_rollos(token,codigo,nombre,disparos) values ('con-fotos-0001','QUI-CAM01','Beto',3)
  on conflict (token) do update set disparos=3;

/* Primero que EXISTA. Sin esto, las dos comprobaciones de permiso de más
   abajo pasan por el motivo equivocado: una función que no existe también
   devuelve error, así que "sin clave se niega" daba ✓ sobre la nada. */
select verificar('existe la salida del organizador (ce_liberar_vacias)',
  exists(select 1 from pg_proc where proname='ce_liberar_vacias'));

select verificar('el organizador libera las cámaras sin usar',
  exists(select 1 from pg_proc where proname='ce_liberar_vacias')
  and (select (ce_liberar_vacias('QUI-CAM01')->>'liberadas')::int) >= 10);

select verificar('y la que TENÍA fotos sigue intacta',
  (select disparos from ce_rollos where token='con-fotos-0001') = 3);

select verificar('después de liberar, el invitado de verdad entra',
  intento('clave-de-la-fiesta',
    'select ce_mi_rollo(''QUI-CAM01'',''invitado-real-001'',''Ana'')') = 'ok');

/* "Sin permiso", no cualquier error: si la función no estuviera, el mensaje
   sería "does not exist" y esto pasaría sin medir nada. */
select verificar('sin la clave del evento no se puede liberar',
  intento('la-clave-de-otro','select ce_liberar_vacias(''QUI-CAM01'')') like '%Sin permiso%');

select verificar('y sin ninguna clave tampoco',
  intento(null,'select ce_liberar_vacias(''QUI-CAM01'')') like '%Sin permiso%');

\echo ''
\echo '── el freno de ritmo ──'

select set_config('request.headers','{"x-clave":"clave-de-la-fiesta"}',false);
insert into ce_eventos(codigo,nombre,fecha,camara,cupo_fotos,cupo_invitados,creado)
  values ('QUI-CAM02','Ritmo','2026-12-20',true,24,2000,
          (extract(epoch from now())*1000)::bigint);

create temp table conteo(entraron int, rebotes int, primera int, cod text);
do $$
declare i int; e int:=0; r int:=0; pri int:=null; c text:=null; cc text;
begin
  for i in 1..120 loop
    begin
      perform ce_mi_rollo('QUI-CAM02','ritmo-'||lpad(i::text,8,'0'),'x');
      e := e+1;
    exception when others then
      get stacked diagnostics cc = returned_sqlstate;
      r := r+1; if pri is null then pri := i; c := cc; end if;
    end;
  end loop;
  insert into conteo values (e,r,pri,c);
end $$;

select verificar('cien cámaras nuevas por minuto entran (una fiesta, no un script)',
  (select entraron from conteo) = 100, 'entraron '||(select entraron from conteo));

select verificar('la ciento uno rebota',
  (select primera from conteo) = 101, 'rebotó la '||coalesce((select primera::text from conteo),'ninguna'));

select verificar('y rebota como 429, para que el navegador espere y vuelva',
  (select cod from conteo) = 'PT429', 'código '||coalesce((select cod from conteo),'ninguno'));

\echo ''
\echo '── se cura solo: las vacías viejas dejan de contar ──'

insert into ce_eventos(codigo,nombre,fecha,camara,cupo_fotos,cupo_invitados,creado)
  values ('QUI-CAM03','Cura sola','2026-12-20',true,24,5,
          (extract(epoch from now())*1000)::bigint);
insert into ce_rollos(token,codigo,nombre,disparos,creado)
  select 'vieja-'||lpad(g::text,8,'0'),'QUI-CAM03','x',0, now() - interval '4 hours'
  from generate_series(1,5) g;

select verificar('con el cupo lleno de cámaras vacías VIEJAS, el invitado entra',
  intento('clave-de-la-fiesta',
    'select ce_mi_rollo(''QUI-CAM03'',''invitado-tarde-01'',''Ana'')') = 'ok');

insert into ce_eventos(codigo,nombre,fecha,camara,cupo_fotos,cupo_invitados,creado)
  values ('QUI-CAM04','Recién llegados','2026-12-20',true,24,5,
          (extract(epoch from now())*1000)::bigint);
insert into ce_rollos(token,codigo,nombre,disparos,creado)
  select 'nueva-'||lpad(g::text,8,'0'),'QUI-CAM04','x',0, now()
  from generate_series(1,5) g;

select verificar('pero con las vacías RECIENTES el cupo se sigue respetando',
  intento('clave-de-la-fiesta',
    'select ce_mi_rollo(''QUI-CAM04'',''invitado-tarde-02'',''Ana'')') like 'error%',
  'son invitados que acaban de llegar y todavía no dispararon');
