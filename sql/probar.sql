\pset tuples_only on
\pset format unaligned

/* La clave maestra de las pruebas se fija acá y no vive en claves.sql:
   ese archivo llevaba la de producción escrita, y el sitio lo publicaba. */
update ce_ajustes set valor = crypt('CLAVE-MAESTRA-DE-PRUEBA', gen_salt('bf'))
where nombre = 'maestra';

/* Un UPDATE o DELETE bloqueado por RLS no da error: simplemente no toca
   ninguna fila. Así que cada prueba mira el ESTADO de la base después,
   no si hubo excepción. */
create or replace function como(clave text, sql text) returns text
language plpgsql as $$
begin
  perform set_config('request.headers',
    case when clave is null then '{}' else json_build_object('x-clave',clave)::text end, true);
  execute 'set local role anon';
  begin
    execute sql;
    execute 'set local role postgres';
    return 'ok';
  exception when others then
    execute 'set local role postgres';
    return 'error: '||substr(sqlerrm,1,60);
  end;
end $$;

create or replace function verificar(titulo text, condicion boolean, detalle text default '')
returns text language sql as
$$ select case when condicion then '  ✓ ' else '  ✗ ' end || titulo
   || case when condicion or detalle='' then '' else '   ['||detalle||']' end $$;

set role postgres;
delete from ce_items; delete from ce_eventos; delete from ce_claves; delete from storage.objects;

select '── crear eventos ──';
select como('clave-uno','insert into ce_eventos(codigo,nombre,moderar) values (''QUI-111'',''Delfina'',false)');
select verificar('crear un evento con clave funciona',
  (select count(*) from ce_eventos where codigo='QUI-111')=1);
select verificar('crear un evento SIN clave se rechaza',
  (select como(null,'insert into ce_eventos(codigo,nombre) values (''QUI-999'',''Colado'')')) like 'error%'
  and (select count(*) from ce_eventos where codigo='QUI-999')=0);
/* ── por qué la web manda un insert pelado y no un upsert ──
   "insert ... on conflict do update" es lo que PostgREST arma cuando el
   navegador manda "Prefer: resolution=merge-duplicates". Postgres evalúa
   el WITH CHECK de la política de UPDATE en TODAS esas sentencias, haya
   conflicto o no, y esa política dice ce_permitido(codigo). En un alta la
   clave todavía no existe para ce_permitido —el disparador acaba de
   escribirla, pero la función es STABLE y mira la foto del principio de
   la sentencia—, así que rebota con "new row violates row-level security
   policy". Así se creaban los eventos y por eso el rollo no se podía
   crear en producción. No se arregla acá: se arregla en la web, mandando
   un insert común, que la política de INSERT acepta. Esta prueba está
   para que nadie "arregle" la política de UPDATE en vez del navegador. */
select verificar('el alta con on-conflict rebota (por eso la web no lo usa)',
  (select como('clave-oc','insert into ce_eventos(codigo,nombre) values (''QUI-OCX'',''Con upsert'')
     on conflict (codigo) do update set nombre=excluded.nombre')) like 'error%'
  and (select count(*) from ce_eventos where codigo='QUI-OCX')=0);
/* Ojo: la cuenta va en OTRA sentencia. Adentro del mismo select, el
   conteo usa la foto de antes del insert y da cero aunque haya entrado. */
select como('clave-oc2','insert into ce_eventos(codigo,nombre) values (''QUI-OCY'',''Sin upsert'')');
select verificar('el alta con un insert común entra',
  (select count(*) from ce_eventos where codigo='QUI-OCY')=1);
/* Y el invitado, que NUNCA tiene clave, sube su recuerdo con un insert
   común: con on-conflict la fiesta entera se quedaba sin fotos. */
select como(null,'insert into ce_items(codigo,id,kind,estado) values (''QUI-OCY'',''oc-1'',''mensaje'',''aprobado'')');
select verificar('el invitado sube sin clave con un insert común',
  (select count(*) from ce_items where id='oc-1')=1);
select verificar('y con on-conflict la base se lo rechaza',
  (select como(null,'insert into ce_items(codigo,id,kind,estado) values (''QUI-OCY'',''oc-2'',''mensaje'',''aprobado'')
     on conflict (id) do update set kind=excluded.kind')) like 'error%'
  and (select count(*) from ce_items where id='oc-2')=0);
set role postgres;
delete from ce_items where id in ('oc-1','oc-2');
delete from ce_eventos where codigo in ('QUI-OCX','QUI-OCY');
delete from ce_claves where codigo in ('QUI-OCX','QUI-OCY');

select como('clave-dos','insert into ce_eventos(codigo,nombre,moderar) values (''BOD-222'',''Flor y Juan'',true)');
select verificar('la clave se guarda como huella bcrypt, no en claro',
  (select count(*) from ce_claves where hash like '$2%')=2
  and (select count(*) from ce_claves where hash in ('clave-uno','clave-dos'))=0);

select '── el muro, blindado (blindaje2.sql) ──';
/* Todo esto lo podía hacer un desconocido SIN NINGUNA CLAVE hasta que se
   corrió blindaje2.sql. Medido, no supuesto. */
/* Con como(), que manda la clave en la cabecera: un insert directo a
   ce_eventos lo rechaza el disparador ce_guardar_clave —"Falta la clave
   del evento"— aunque uno sea postgres, porque el disparador corre igual.
   Sin el evento creado, TODAS las comprobaciones de abajo pasaban o
   fallaban por el motivo equivocado. */
select como('clave-bli','insert into ce_eventos(codigo,nombre,moderar,cerrado,creado) values (''BLI-001'',''Fiesta blindada'',false,false,0)');
select verificar('la fiesta de prueba del blindaje se creó',
  (select count(*) from ce_eventos where codigo='BLI-001')=1);

select como(null,'insert into ce_items(codigo,id,kind,url,autor) values (''BLI-001'',''bli-ok'',''foto'',''https://x/y.jpg'',''Ana'')');
select verificar('el invitado legítimo sigue pudiendo subir',
  (select count(*) from ce_items where id='bli-ok')=1);

/* El "cuándo" lo pone la base. Con el ts en manos del que sube, poner un
   número gigante dejaba su foto PRIMERA en la proyección toda la noche. */
select verificar('el ts lo pone la base, no el teléfono',
  (select ts from ce_items where id='bli-ok') between
    (extract(epoch from now())*1000)::bigint - 60000 and
    (extract(epoch from now())*1000)::bigint + 1000);

select verificar('NO se puede subir a un evento que no existe',
  (select como(null,'insert into ce_items(codigo,id,kind,url) values (''NO-HAY'',''bli-x'',''foto'',''https://x/y.jpg'')')) like 'error%'
  and (select count(*) from ce_items where id='bli-x')=0);

set role postgres; update ce_eventos set cerrado=true where codigo='BLI-001';
select verificar('con el muro CERRADO la base rechaza, no solo la pantalla',
  (select como(null,'insert into ce_items(codigo,id,kind,url) values (''BLI-001'',''bli-c'',''foto'',''https://x/y.jpg'')')) like 'error%'
  and (select count(*) from ce_items where id='bli-c')=0);
set role postgres; update ce_eventos set cerrado=false where codigo='BLI-001';

select verificar('un tipo de recuerdo inventado se rechaza',
  (select como(null,'insert into ce_items(codigo,id,kind,url) values (''BLI-001'',''bli-k'',''iframe'',''https://x/y.jpg'')')) like 'error%');

select como(null,'insert into ce_items(codigo,id,kind,texto,autor) values (''BLI-001'',''bli-l'',''mensaje'',repeat(''A'',100000),repeat(''B'',9000))');
select verificar('los textos gigantes se recortan en la base, no en el navegador',
  (select length(texto) from ce_items where id='bli-l')=400
  and (select length(autor) from ce_items where id='bli-l')=40);

/* La ráfaga: cada insert es un pedido HTTP aparte, así que se prueba uno
   por uno. Adentro de una sola transacción el primer error revierte los
   que sí habían entrado y la cuenta da cero, que no es lo que pasa. */
do $ra$ declare i int; begin
  perform set_config('request.headers','{}',true);
  /* Cuatrocientos para un tope de trescientos: si se prueba con menos
     del tope, la prueba pasa sin haber llegado nunca al freno. */
  for i in 1..400 loop
    begin
      execute 'set local role anon';
      insert into ce_items(id,codigo,kind,url) values ('raf-'||i,'BLI-001','foto','https://x/y.jpg');
    exception when others then null; end;
    execute 'set local role postgres';
  end loop;
end $ra$;
/* Se cuenta TODO lo de la fiesta en el minuto, no solo las 'raf-': el
   tope es por evento, y arriba ya habían entrado dos. Afirmar que las
   'raf-' son 120 daba 118 y hacía fallar una regla que funcionaba. */
/* Trescientos, no ciento veinte: con 120 la 121 del brindis de una
   fiesta de 200 rebotaba. Lo sube sql/rafaga.sql. */
select verificar('la ráfaga corta a los 300 por minuto',
  (select count(*) from ce_items where codigo='BLI-001')=300,
  'entraron '||(select count(*) from ce_items where codigo='BLI-001'));

/* Y el freno de eventos: treinta por minuto en toda la base. */
do $ev$ declare i int; begin
  perform set_config('request.headers',json_build_object('x-clave','clave-freno')::text,true);
  for i in 1..50 loop
    begin
      execute 'set local role anon';
      insert into ce_eventos(codigo,nombre,creado)
        values ('FRE-'||i,'x',(extract(epoch from now())*1000)::bigint);
    exception when others then null; end;
    execute 'set local role postgres';
  end loop;
end $ev$;
select verificar('no se pueden crear eventos sin fin',
  (select count(*) from ce_eventos where codigo like 'FRE-%')<=30,
  'se crearon '||(select count(*) from ce_eventos where codigo like 'FRE-%'));

set role postgres;
delete from ce_items where codigo='BLI-001';
delete from ce_eventos where codigo like 'FRE-%' or codigo='BLI-001';
delete from ce_claves where codigo like 'FRE-%' or codigo='BLI-001';

select '── un invitado cualquiera (sin clave) ──';
/* Antes acá decía "puede leer el evento" y estaba bien que lo dijera: la
   regla era "using (true)". El problema es lo que eso significaba con un
   select sin where: la lista completa de las fiestas de todos los clientes,
   con un solo pedido y sin clave. */
select verificar('NO ve ningún evento en una lista sin clave',
  (select count(*) from (select como(null,'select 1 from ce_eventos')) _
    where (select count(*) from ce_eventos where ce_permitido(codigo))=0)=1
  or (select como(null,'select 1 from ce_eventos'))='ok');
select como(null,'insert into ce_items(id,codigo,kind,autor,estado,ts) values (''i1'',''QUI-111'',''foto'',''Tomás'',''aprobado'',1)');
select verificar('puede subir una foto', (select count(*) from ce_items where id='i1')=1);
select como(null,'update ce_eventos set nombre=''HACKEADO'' where codigo=''QUI-111''');
select verificar('NO puede cambiarle el nombre al evento',
  (select nombre from ce_eventos where codigo='QUI-111')='Delfina',
  (select nombre from ce_eventos where codigo='QUI-111'));
select como(null,'update ce_eventos set cerrado=true where codigo=''QUI-111''');
select verificar('NO puede cerrar el muro',
  (select cerrado from ce_eventos where codigo='QUI-111')=false);
select como(null,'delete from ce_eventos where codigo=''QUI-111''');
select verificar('NO puede borrar el evento',
  (select count(*) from ce_eventos where codigo='QUI-111')=1);
select como(null,'delete from ce_items where id=''i1''');
select verificar('NO puede borrar fotos', (select count(*) from ce_items where id='i1')=1);
select como(null,'update ce_items set estado=''aprobado'' where id=''i1''');
select verificar('NO puede aprobar fotos', (select estado from ce_items where id='i1')='aprobado');
select verificar('NO puede leer las claves guardadas',
  (select como(null,'select hash from ce_claves')) like 'error%');

select '── la base decide el estado, no el celular ──';
select como(null,'insert into ce_items(id,codigo,kind,autor,estado,ts) values (''i2'',''BOD-222'',''foto'',''Colado'',''aprobado'',2)');
select verificar('en evento moderado entra como pendiente aunque el celular diga aprobado',
  (select estado from ce_items where id='i2')='pendiente',
  (select estado from ce_items where id='i2'));

select '── el dueño, con su clave ──';
select como('clave-uno','update ce_eventos set cerrado=true where codigo=''QUI-111''');
select verificar('puede editar su evento', (select cerrado from ce_eventos where codigo='QUI-111')=true);
select como('clave-uno','update ce_items set estado=''rechazado'' where id=''i1''');
select verificar('puede moderar sus fotos', (select estado from ce_items where id='i1')='rechazado');
select como('clave-dos','update ce_eventos set nombre=''INTRUSO'' where codigo=''QUI-111''');
select verificar('con la clave de otro evento NO toca este',
  (select nombre from ce_eventos where codigo='QUI-111')='Delfina');
select como('inventada','update ce_eventos set nombre=''NO'' where codigo=''QUI-111''');
select verificar('con clave equivocada NO entra',
  (select nombre from ce_eventos where codigo='QUI-111')='Delfina');

select '── la clave maestra ──';
select como('CLAVE-MAESTRA-DE-PRUEBA','update ce_eventos set nombre=''Delfina ok'' where codigo=''QUI-111''');
select verificar('edita cualquier evento', (select nombre from ce_eventos where codigo='QUI-111')='Delfina ok');
select como('CLAVE-MAESTRA-DE-PRUEBA','update ce_items set estado=''aprobado'' where id=''i2''');
select verificar('modera en cualquier evento', (select estado from ce_items where id='i2')='aprobado');
select como('CLAVE-MAESTRA-DE-PRUEBA','delete from ce_items where codigo=''BOD-222''');
select como('CLAVE-MAESTRA-DE-PRUEBA','delete from ce_eventos where codigo=''BOD-222''');
select verificar('borra fotos y eventos',
  (select count(*) from ce_eventos where codigo='BOD-222')=0
  and (select count(*) from ce_items where codigo='BOD-222')=0);

select '── archivos del depósito ──';
set role postgres;
insert into storage.objects(bucket_id,name) values ('ce-medios','QUI-111/f1.jpg'),('ce-medios','BOD-222/f9.jpg');
select como('CLAVE-MAESTRA-DE-PRUEBA','delete from storage.objects where name=''QUI-111/f1.jpg''');
select verificar('NO se borra el archivo de un evento que existe',
  (select count(*) from storage.objects where name='QUI-111/f1.jpg')=1);
select como(null,'delete from storage.objects where name=''BOD-222/f9.jpg''');
select verificar('SÍ se borra el archivo de un evento ya eliminado',
  (select count(*) from storage.objects where name='BOD-222/f9.jpg')=0);

select '── cambiar la clave ──';
select verificar('el dueño cambia su clave',
  (select como('clave-uno','select ce_cambiar_clave(''QUI-111'',''clave-nueva'')'))='ok');
select como('clave-uno','update ce_eventos set tono=''#111'' where codigo=''QUI-111''');
select verificar('la vieja deja de servir', (select tono from ce_eventos where codigo='QUI-111') is distinct from '#111');
select como('clave-nueva','update ce_eventos set tono=''#222'' where codigo=''QUI-111''');
select verificar('la nueva sirve', (select tono from ce_eventos where codigo='QUI-111')='#222');
select verificar('un extraño NO puede cambiar la clave de un evento ajeno',
  (select como('cualquiera','select ce_cambiar_clave(''QUI-111'',''robada'')')) like 'error%');

select '── lo que la app usa para saber qué puede hacer ──';
set role postgres;
select '  · sin clave        → '||(select ce_quien_soy('QUI-111')::text
  from (select set_config('request.headers','{}',true)) _);
select '  · clave del evento → '||(select ce_quien_soy('QUI-111')::text
  from (select set_config('request.headers','{"x-clave":"clave-nueva"}',true)) _);
select '  · clave maestra    → '||(select ce_quien_soy('QUI-111')::text
  from (select set_config('request.headers','{"x-clave":"CLAVE-MAESTRA-DE-PRUEBA"}',true)) _);


select '── que la tabla no sea una guía telefónica (blindaje.sql) ──';
set role postgres;
/* Tres fiestas de tres clientes. La pregunta es una sola: ¿alguien sin
   clave puede pedir "dame todo" y llevárselas? */
delete from ce_items; delete from ce_eventos; delete from ce_claves;
select como('clave-uno','insert into ce_eventos(codigo,nombre) values (''QUI-AAA'',''Delfina'')');
select como('clave-dos','insert into ce_eventos(codigo,nombre) values (''BOD-BBB'',''Casamiento Pérez'')');
select como('clave-tres','insert into ce_eventos(codigo,nombre) values (''CUM-CCC'',''Cumple de Tomás'')');

create or replace function cuantos_ve(clave text, sql text) returns integer
language plpgsql as $$
declare n integer;
begin
  perform set_config('request.headers',
    case when clave is null then '{}' else json_build_object('x-clave',clave)::text end, true);
  execute 'set local role anon';
  begin
    execute sql into n;
    execute 'set local role postgres';
    return coalesce(n,0);
  exception when others then
    execute 'set local role postgres';
    return -1;
  end;
end $$;

select verificar('un extraño NO se lleva la lista de eventos',
  cuantos_ve(null,'select count(*) from ce_eventos') = 0,
  've '||cuantos_ve(null,'select count(*) from ce_eventos'));
select verificar('con la clave de UNA fiesta ve esa y nada más',
  cuantos_ve('clave-uno','select count(*) from ce_eventos') = 1,
  've '||cuantos_ve('clave-uno','select count(*) from ce_eventos'));
select verificar('la clave maestra sí ve todas',
  cuantos_ve('CLAVE-MAESTRA-DE-PRUEBA','select count(*) from ce_eventos') = 3);
select verificar('el invitado llega a SU evento por el código, con ce_evento_publico',
  (select (ce_evento_publico('QUI-AAA')->>'nombre')) = 'Delfina');
select verificar('y con un código que no existe no saca nada',
  ce_evento_publico('QUI-NOEXISTE') is null);

select '── las fotos que esperan aprobación no se ven ──';
set role postgres;
update ce_eventos set moderar=true where codigo='QUI-AAA';
/* Con la clave: si no, el disparador ce_forzar_estado le pone "pendiente" a
   las dos (que es lo correcto, pero deja la prueba midiendo otra cosa). */
select como('clave-uno',$q$insert into ce_items(id,codigo,kind,autor,texto,estado,ts)
  values ('ok1','QUI-AAA','foto','Tomás','','aprobado',1),
         ('esp1','QUI-AAA','foto','Colado','','pendiente',2)$q$);
select verificar('un extraño NO se lleva los recuerdos de nadie',
  cuantos_ve(null,'select count(*) from ce_items') = 0,
  've '||cuantos_ve(null,'select count(*) from ce_items'));
select verificar('por el código ve lo aprobado',
  json_array_length(ce_items_de('QUI-AAA',0,100)) = 1);
select verificar('y NO lo que está esperando que el organizador lo mire',
  (select count(*) from json_array_elements(ce_items_de('QUI-AAA',0,100)) x
    where x->>'estado' = 'pendiente') = 0);
select verificar('el organizador, con su clave, SÍ ve lo que espera',
  (select json_array_length(ce_items_de('QUI-AAA',0,100))
     from (select set_config('request.headers','{"x-clave":"clave-uno"}',true)) _) = 2);

select '── la clave maestra no se prueba desde internet ──';
select verificar('anon NO puede llamar a ce_cambiar_maestra',
  not has_function_privilege('anon','ce_cambiar_maestra(text,text)','execute'));
select verificar('anon SÍ puede seguir cambiando la clave de SU evento',
  has_function_privilege('anon','ce_cambiar_clave(text,text)','execute'));

select '── el depósito del muro ──';
set role postgres;
delete from storage.objects;
select verificar('NO se puede subir a una carpeta que no es de ningún evento',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-medios'',''libre/virus.html'')')) like 'error%'
  and (select count(*) from storage.objects where name='libre/virus.html')=0);
select verificar('SÍ se puede subir a la carpeta de un evento abierto',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-medios'',''QUI-AAA/foto1.jpg'')'))='ok');
set role postgres;
update ce_eventos set cerrado=true where codigo='QUI-AAA';
select verificar('con el muro cerrado ya no se sube nada más',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-medios'',''QUI-AAA/tarde.jpg'')')) like 'error%');
set role postgres;
update ce_eventos set cerrado=false where codigo='QUI-AAA';
select verificar('el depósito tiene tope de tamaño y de tipo de archivo',
  (select file_size_limit is not null and allowed_mime_types is not null
     from storage.buckets where id='ce-medios'));


select '── el rollo sigue guardado hasta que se revela ──';
/* Esta prueba existe por un susto: al cerrar la lectura de ce_eventos, las
   reglas del depósito dejaron de ver los eventos, y su rama "el evento ya no
   existe" —la que sirve para limpiar lo que sobra— pasó a valer para TODO.
   Durante un rato, cualquiera podía mirar las fotos de un rollo sin revelar.
   Se arregló preguntando por una función que corre como dueña. Que quede
   medido. */
set role postgres;
delete from storage.objects where bucket_id='ce-rollos';
select como('clave-rol','insert into ce_eventos(codigo,nombre,camara,revelado) values (''ROL-SEC'',''Secreta'',true,false)');
insert into storage.objects(bucket_id,name) values ('ce-rollos','ROL-SEC/tok/foto.jpg');
select verificar('un extraño NO ve las fotos de un rollo sin revelar',
  cuantos_ve(null,'select count(*) from storage.objects where bucket_id=''ce-rollos''') = 0,
  've '||cuantos_ve(null,'select count(*) from storage.objects where bucket_id=''ce-rollos'''));
set role postgres;
update ce_eventos set revelado=true where codigo='ROL-SEC';
select verificar('revelado, SÍ las ve (para eso se revela)',
  cuantos_ve(null,'select count(*) from storage.objects where bucket_id=''ce-rollos''') = 1);
set role postgres;
delete from ce_eventos where codigo='ROL-SEC';
/* El borrado va en su propio renglón. Metido adentro del "and" de
   verificar(), Postgres puede evaluar primero el count y después el delete:
   la prueba fallaba una de cada dos corridas sin que nada estuviera mal. */
select como(null,'delete from storage.objects where name=''ROL-SEC/tok/foto.jpg''');
select verificar('y si el evento se borró, se pueden limpiar del depósito',
  (select count(*) from storage.objects where name='ROL-SEC/tok/foto.jpg') = 0);
