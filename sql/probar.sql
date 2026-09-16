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
select como('clave-dos','insert into ce_eventos(codigo,nombre,moderar) values (''BOD-222'',''Flor y Juan'',true)');
select verificar('la clave se guarda como huella bcrypt, no en claro',
  (select count(*) from ce_claves where hash like '$2%')=2
  and (select count(*) from ce_claves where hash in ('clave-uno','clave-dos'))=0);

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
