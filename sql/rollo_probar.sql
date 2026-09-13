\pset tuples_only on
\pset format unaligned

/* Pruebas de la cámara descartable. Igual que probar.sql: un UPDATE o
   DELETE bloqueado por RLS no da error, simplemente no toca ninguna fila,
   así que cada prueba mira el ESTADO de la base después. */

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
    return 'error: '||substr(sqlerrm,1,70);
  end;
end $$;

/* como() pero devolviendo lo que contestó la función */
create or replace function pido(clave text, sql text) returns text
language plpgsql as $$
declare r text;
begin
  perform set_config('request.headers',
    case when clave is null then '{}' else json_build_object('x-clave',clave)::text end, true);
  execute 'set local role anon';
  begin
    execute sql into r;
    execute 'set local role postgres';
    return coalesce(r,'(nulo)');
  exception when others then
    execute 'set local role postgres';
    return 'error: '||substr(sqlerrm,1,70);
  end;
end $$;

create or replace function verificar(titulo text, condicion boolean, detalle text default '')
returns text language sql as
$$ select case when condicion then '  ✓ ' else '  ✗ ' end || titulo
   || case when condicion or detalle='' then '' else '   ['||detalle||']' end $$;

set role postgres;
delete from ce_disparos; delete from ce_rollos; delete from ce_items;
delete from ce_eventos; delete from ce_claves; delete from storage.objects;

select '── preparar la fiesta ──';
select como('clave-fiesta','insert into ce_eventos(codigo,nombre) values (''QUI-111'',''Delfina'')');
select como('clave-fiesta','update ce_eventos set camara=true, cupo_fotos=3 where codigo=''QUI-111''');
select verificar('el organizador prende la cámara y pone cupo 3',
  (select camara and cupo_fotos=3 from ce_eventos where codigo='QUI-111'));

select '── el invitado agarra su rollo ──';
select pido(null,'select ce_mi_rollo(''QUI-111'',''tok-ana'',''Ana'')::text');
select verificar('se crea el rollo sin necesidad de clave',
  (select count(*) from ce_rollos where token='tok-ana' and codigo='QUI-111')=1);
select verificar('un nombre vacío no rompe',
  (select pido(null,'select ce_mi_rollo(''QUI-111'',''tok-vacio'','''')::text')) not like 'error%',
  (select pido(null,'select ce_mi_rollo(''QUI-111'',''tok-vacio2'','''')::text')));
select verificar('un nombre nulo no rompe',
  (select pido(null,'select ce_mi_rollo(''QUI-111'',''tok-nulo'',null)::text')) not like 'error%',
  (select pido(null,'select ce_mi_rollo(''QUI-111'',''tok-nulo2'',null)::text')));

select '── nadie mira las tablas por la puerta de atrás ──';
select verificar('NO puede leer los rollos',
  (select como(null,'select * from ce_rollos')) like 'error%'
  or (select pido(null,'select count(*)::text from ce_rollos'))='0');
select verificar('NO puede leer los disparos',
  (select como(null,'select * from ce_disparos')) like 'error%'
  or (select pido(null,'select count(*)::text from ce_disparos'))='0');
select verificar('NO puede inventar un disparo a mano',
  (select como(null,'insert into ce_disparos(id,codigo,token,filtro,ruta,ts) values (''x'',''QUI-111'',''tok-ana'',''bn'',''QUI-111/tok-ana/x.jpg'',1)')) like 'error%'
  and (select count(*) from ce_disparos where id='x')=0);
select verificar('NO puede regalarse fotos editando su rollo',
  (select como(null,'update ce_rollos set disparos=0 where token=''tok-ana''')) like 'error%'
  or (select disparos from ce_rollos where token='tok-ana')=0);

select '── sacar fotos ──';
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''dorado'',''QUI-111/tok-ana/1.jpg'')::text');
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''bn'',''QUI-111/tok-ana/2.jpg'')::text');
select verificar('el contador sube en la base', (select disparos from ce_rollos where token='tok-ana')=2);
select verificar('un filtro inventado se rechaza',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''hackeado'',''QUI-111/tok-ana/h.jpg'')::text')) like 'error%');
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''natural'',''QUI-111/tok-ana/3.jpg'')::text');
select verificar('la foto 4 (una más que el cupo) se rechaza',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''natural'',''QUI-111/tok-ana/4.jpg'')::text')) like 'error%',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''natural'',''QUI-111/tok-ana/4b.jpg'')::text')));
select verificar('quedaron exactamente 3 disparos', (select count(*) from ce_disparos where token='tok-ana')=3);
select verificar('con un rollo que no existe no se puede disparar',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-fantasma'',''bn'',''QUI-111/tok-fantasma/1.jpg'')::text')) like 'error%');

select '── la foto que no llegó a subirse ──';
set role postgres;
update ce_eventos set cupo_fotos=4 where codigo='QUI-111';
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''bn'',''QUI-111/tok-ana/perdida.jpg'')::text');
select verificar('el disparo quedó anotado', (select disparos from ce_rollos where token='tok-ana')=4);
select pido(null,'select ce_devolver_foto(''QUI-111'',''tok-ana'',''QUI-111/tok-ana/perdida.jpg'')::text');
select verificar('si la subida falla, la foto se devuelve',
  (select disparos from ce_rollos where token='tok-ana')=3
  and (select count(*) from ce_disparos where ruta='QUI-111/tok-ana/perdida.jpg')=0,
  'disparos='||(select disparos::text from ce_rollos where token='tok-ana'));
set role postgres;
update ce_eventos set cupo_fotos=3 where codigo='QUI-111';
insert into storage.objects(bucket_id,name) values ('ce-rollos','QUI-111/tok-ana/1.jpg');
select verificar('una foto YA subida no se puede devolver (sería cupo infinito)',
  (select pido(null,'select ce_devolver_foto(''QUI-111'',''tok-ana'',''QUI-111/tok-ana/1.jpg'')::text')) like 'error%');
select verificar('y el contador no se movió', (select disparos from ce_rollos where token='tok-ana')=3);
set role postgres;
delete from storage.objects where name='QUI-111/tok-ana/1.jpg';

select '── el candado del álbum ──';
select verificar('antes del revelado el álbum NO se abre',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana'')::text')) like 'error%');
select verificar('los números sí son públicos (para el panel)',
  (select pido(null,'select ce_camara_stats(''QUI-111'')::text')) like '%"fotos" : 3%');
select verificar('un invitado NO puede revelar el rollo él mismo',
  (select como(null,'update ce_eventos set revelado=true where codigo=''QUI-111''')) like 'error%'
  or (select revelado from ce_eventos where codigo='QUI-111')=false,
  'revelado='||(select revelado::text from ce_eventos where codigo='QUI-111'));
select verificar('un invitado NO puede adelantar la hora de revelado',
  (select como(null,'update ce_eventos set revela_en=now()-interval ''1 hour'' where codigo=''QUI-111''')) like 'error%'
  or (select revela_en from ce_eventos where codigo='QUI-111') is null);
select verificar('un invitado NO puede subirse el cupo',
  (select como(null,'update ce_eventos set cupo_fotos=99 where codigo=''QUI-111''')) like 'error%'
  or (select cupo_fotos from ce_eventos where codigo='QUI-111')=3);

select '── los archivos, antes del revelado ──';
select verificar('NO se puede subir a un camino que nadie reservó',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-rollos'',''QUI-111/tok-ana/colado.jpg'')')) like 'error%'
  and (select count(*) from storage.objects where name='QUI-111/tok-ana/colado.jpg')=0);
select verificar('SÍ se puede subir al camino que reservó ce_tomar_foto',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-rollos'',''QUI-111/tok-ana/1.jpg'')'))='ok',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-rollos'',''QUI-111/tok-ana/2.jpg'')')));
select verificar('NO se puede LEER (ni firmar URL) antes del revelado',
  (select pido(null,'select count(*)::text from storage.objects where bucket_id=''ce-rollos'''))='0',
  (select pido(null,'select count(*)::text from storage.objects where bucket_id=''ce-rollos''')));

select '── el organizador revela ──';
select como('clave-fiesta','update ce_eventos set revelado=true where codigo=''QUI-111''');
select verificar('con la clave sí puede revelar', (select revelado from ce_eventos where codigo='QUI-111')=true);
select verificar('ahora el álbum se abre',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana'')::text')) like '%"revelado" : true%');
select verificar('el álbum trae las 3 fotos propias',
  (select pido(null,'select json_array_length(ce_album_de(''QUI-111'',''tok-ana'')->''mias'')::text'))='3');
select verificar('ahora SÍ se pueden leer los archivos (firmar URLs)',
  (select pido(null,'select count(*)::text from storage.objects where bucket_id=''ce-rollos'''))='2');

select '── revelado por hora, sin tocar nada ──';
set role postgres;
update ce_eventos set revelado=false, revela_en=now()+interval '1 hour' where codigo='QUI-111';
select verificar('con la hora en el futuro sigue cerrado',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana'')::text')) like 'error%');
update ce_eventos set revela_en=now()-interval '1 minute' where codigo='QUI-111';
select verificar('pasada la hora se abre solo',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana'')::text')) like '%"revelado" : true%');

select '── dos fiestas no se mezclan ──';
set role postgres;
select como('otra-clave','insert into ce_eventos(codigo,nombre,camara) values (''BOD-222'',''Flor y Juan'',true)');
select pido(null,'select ce_mi_rollo(''BOD-222'',''tok-nico'',''Nico'')::text');
select verificar('un token de otra fiesta se rechaza',
  (select pido(null,'select ce_mi_rollo(''BOD-222'',''tok-ana'',''Ana'')::text')) like 'error%');
select verificar('no se puede disparar en la fiesta ajena con el token propio',
  (select pido(null,'select ce_tomar_foto(''BOD-222'',''tok-ana'',''bn'',''BOD-222/tok-ana/1.jpg'')::text')) like 'error%');
select verificar('el álbum de una fiesta no muestra fotos de la otra',
  (select pido(null,'select json_array_length(ce_album_de(''QUI-111'',''tok-ana'')->''todas'')::text'))='3');

select '── la fiesta cerrada ──';
set role postgres;
update ce_eventos set cerrado=true where codigo='QUI-111';
update ce_rollos set disparos=0 where token='tok-ana';
select verificar('con el evento cerrado no se saca ni una foto más',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''bn'',''QUI-111/tok-ana/9.jpg'')::text')) like 'error%');
update ce_eventos set cerrado=false, camara=false where codigo='QUI-111';
select verificar('con la cámara apagada tampoco',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana'',''bn'',''QUI-111/tok-ana/9.jpg'')::text')) like 'error%');

select '── borrar el evento ──';
set role postgres;
update ce_eventos set camara=true where codigo='QUI-111';
select verificar('sin clave NO se listan las rutas para borrar',
  (select pido(null,'select coalesce(array_length(ce_rutas_rollo(''QUI-111''),1),0)::text'))='0');
select verificar('con la clave sí',
  (select pido('clave-fiesta','select array_length(ce_rutas_rollo(''QUI-111''),1)::text'))='3');
select verificar('NO se borra el archivo de un evento que existe',
  (select como(null,'delete from storage.objects where name=''QUI-111/tok-ana/1.jpg''')) like 'error%'
  or (select count(*) from storage.objects where name='QUI-111/tok-ana/1.jpg')=1);
select como('clave-fiesta','delete from ce_eventos where codigo=''QUI-111''');
select verificar('al borrar el evento caen sus rollos y disparos',
  (select count(*) from ce_rollos where codigo='QUI-111')=0
  and (select count(*) from ce_disparos where codigo='QUI-111')=0);
/* en dos pasos a propósito: si el borrado y el conteo van en la misma
   expresión, SQL puede evaluar el conteo primero y la prueba miente. */
select como(null,'delete from storage.objects where name=''QUI-111/tok-ana/1.jpg''');
select verificar('recién ahí se puede limpiar el depósito',
  (select count(*) from storage.objects where name='QUI-111/tok-ana/1.jpg')=0);
