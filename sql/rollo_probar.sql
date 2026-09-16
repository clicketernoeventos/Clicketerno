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
select pido(null,'select ce_mi_rollo(''QUI-111'',''tok-ana-01'',''Ana'')::text');
select verificar('se crea el rollo sin necesidad de clave',
  (select count(*) from ce_rollos where token='tok-ana-01' and codigo='QUI-111')=1);
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
  (select como(null,'insert into ce_disparos(id,codigo,token,filtro,ruta,ts) values (''x'',''QUI-111'',''tok-ana-01'',''bn'',''QUI-111/tok-ana-01/x.jpg'',1)')) like 'error%'
  and (select count(*) from ce_disparos where id='x')=0);
select verificar('NO puede regalarse fotos editando su rollo',
  (select como(null,'update ce_rollos set disparos=0 where token=''tok-ana-01''')) like 'error%'
  or (select disparos from ce_rollos where token='tok-ana-01')=0);

select '── sacar fotos ──';
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''dorado'',''QUI-111/tok-ana-01/1.jpg'')::text');
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''bn'',''QUI-111/tok-ana-01/2.jpg'')::text');
select verificar('el contador sube en la base', (select disparos from ce_rollos where token='tok-ana-01')=2);
select verificar('un filtro inventado se rechaza',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''hackeado'',''QUI-111/tok-ana-01/h.jpg'')::text')) like 'error%');
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''natural'',''QUI-111/tok-ana-01/3.jpg'')::text');
select verificar('la foto 4 (una más que el cupo) se rechaza',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''natural'',''QUI-111/tok-ana-01/4.jpg'')::text')) like 'error%',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''natural'',''QUI-111/tok-ana-01/4b.jpg'')::text')));
select verificar('quedaron exactamente 3 disparos', (select count(*) from ce_disparos where token='tok-ana-01')=3);
select verificar('con un rollo que no existe no se puede disparar',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-fantasma'',''bn'',''QUI-111/tok-fantasma/1.jpg'')::text')) like 'error%');

select '── la foto que no llegó a subirse ──';
set role postgres;
update ce_eventos set cupo_fotos=4 where codigo='QUI-111';
select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''bn'',''QUI-111/tok-ana-01/perdida.jpg'')::text');
select verificar('el disparo quedó anotado', (select disparos from ce_rollos where token='tok-ana-01')=4);
select pido(null,'select ce_devolver_foto(''QUI-111'',''tok-ana-01'',''QUI-111/tok-ana-01/perdida.jpg'')::text');
select verificar('si la subida falla, la foto se devuelve',
  (select disparos from ce_rollos where token='tok-ana-01')=3
  and (select count(*) from ce_disparos where ruta='QUI-111/tok-ana-01/perdida.jpg')=0,
  'disparos='||(select disparos::text from ce_rollos where token='tok-ana-01'));
set role postgres;
update ce_eventos set cupo_fotos=3 where codigo='QUI-111';
insert into storage.objects(bucket_id,name) values ('ce-rollos','QUI-111/tok-ana-01/1.jpg');
select verificar('una foto YA subida no se puede devolver (sería cupo infinito)',
  (select pido(null,'select ce_devolver_foto(''QUI-111'',''tok-ana-01'',''QUI-111/tok-ana-01/1.jpg'')::text')) like 'error%');
select verificar('y el contador no se movió', (select disparos from ce_rollos where token='tok-ana-01')=3);
set role postgres;
delete from storage.objects where name='QUI-111/tok-ana-01/1.jpg';

select '── el candado del álbum ──';
select verificar('antes del revelado el álbum NO se abre',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana-01'')::text')) like 'error%');
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
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-rollos'',''QUI-111/tok-ana-01/colado.jpg'')')) like 'error%'
  and (select count(*) from storage.objects where name='QUI-111/tok-ana-01/colado.jpg')=0);
select verificar('SÍ se puede subir al camino que reservó ce_tomar_foto',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-rollos'',''QUI-111/tok-ana-01/1.jpg'')'))='ok',
  (select como(null,'insert into storage.objects(bucket_id,name) values (''ce-rollos'',''QUI-111/tok-ana-01/2.jpg'')')));
select verificar('NO se puede LEER (ni firmar URL) antes del revelado',
  (select pido(null,'select count(*)::text from storage.objects where bucket_id=''ce-rollos'''))='0',
  (select pido(null,'select count(*)::text from storage.objects where bucket_id=''ce-rollos''')));

select '── el organizador revela ──';
select como('clave-fiesta','update ce_eventos set revelado=true where codigo=''QUI-111''');
select verificar('con la clave sí puede revelar', (select revelado from ce_eventos where codigo='QUI-111')=true);
select verificar('ahora el álbum se abre',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana-01'')::text')) like '%"revelado" : true%');
select verificar('el álbum trae las 3 fotos propias',
  (select pido(null,'select json_array_length(ce_album_de(''QUI-111'',''tok-ana-01'')->''mias'')::text'))='3');
select verificar('ahora SÍ se pueden leer los archivos (firmar URLs)',
  (select pido(null,'select count(*)::text from storage.objects where bucket_id=''ce-rollos'''))='2');

select '── revelado por hora, sin tocar nada ──';
set role postgres;
update ce_eventos set revelado=false, revela_en=now()+interval '1 hour' where codigo='QUI-111';
select verificar('con la hora en el futuro sigue cerrado',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana-01'')::text')) like 'error%');
update ce_eventos set revela_en=now()-interval '1 minute' where codigo='QUI-111';
select verificar('pasada la hora se abre solo',
  (select pido(null,'select ce_album_de(''QUI-111'',''tok-ana-01'')::text')) like '%"revelado" : true%');

select '── dos fiestas no se mezclan ──';
set role postgres;
select como('otra-clave','insert into ce_eventos(codigo,nombre,camara) values (''BOD-222'',''Flor y Juan'',true)');
select pido(null,'select ce_mi_rollo(''BOD-222'',''tok-nico'',''Nico'')::text');
select verificar('un token de otra fiesta se rechaza',
  (select pido(null,'select ce_mi_rollo(''BOD-222'',''tok-ana-01'',''Ana'')::text')) like 'error%');
select verificar('no se puede disparar en la fiesta ajena con el token propio',
  (select pido(null,'select ce_tomar_foto(''BOD-222'',''tok-ana-01'',''bn'',''BOD-222/tok-ana-01/1.jpg'')::text')) like 'error%');
select verificar('el álbum de una fiesta no muestra fotos de la otra',
  (select pido(null,'select json_array_length(ce_album_de(''QUI-111'',''tok-ana-01'')->''todas'')::text'))='3');

select '── la fiesta cerrada ──';
set role postgres;
update ce_eventos set cerrado=true where codigo='QUI-111';
update ce_rollos set disparos=0 where token='tok-ana-01';
select verificar('con el evento cerrado no se saca ni una foto más',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''bn'',''QUI-111/tok-ana-01/9.jpg'')::text')) like 'error%');
update ce_eventos set cerrado=false, camara=false where codigo='QUI-111';
select verificar('con la cámara apagada tampoco',
  (select pido(null,'select ce_tomar_foto(''QUI-111'',''tok-ana-01'',''bn'',''QUI-111/tok-ana-01/9.jpg'')::text')) like 'error%');

select '── borrar el evento ──';
set role postgres;
update ce_eventos set camara=true where codigo='QUI-111';
select verificar('sin clave NO se listan las rutas para borrar',
  (select pido(null,'select coalesce(array_length(ce_rutas_rollo(''QUI-111''),1),0)::text'))='0');
select verificar('con la clave sí',
  (select pido('clave-fiesta','select array_length(ce_rutas_rollo(''QUI-111''),1)::text'))='3');
select verificar('NO se borra el archivo de un evento que existe',
  (select como(null,'delete from storage.objects where name=''QUI-111/tok-ana-01/1.jpg''')) like 'error%'
  or (select count(*) from storage.objects where name='QUI-111/tok-ana-01/1.jpg')=1);
select como('clave-fiesta','delete from ce_eventos where codigo=''QUI-111''');
select verificar('al borrar el evento caen sus rollos y disparos',
  (select count(*) from ce_rollos where codigo='QUI-111')=0
  and (select count(*) from ce_disparos where codigo='QUI-111')=0);
/* en dos pasos a propósito: si el borrado y el conteo van en la misma
   expresión, SQL puede evaluar el conteo primero y la prueba miente. */
select como(null,'delete from storage.objects where name=''QUI-111/tok-ana-01/1.jpg''');
select verificar('recién ahí se puede limpiar el depósito',
  (select count(*) from storage.objects where name='QUI-111/tok-ana-01/1.jpg')=0);

select '── la columna del cupo, vacía ──';
/* Un evento creado antes de rollo.sql, o tocado a mano, puede tener
   cupo_fotos en NULL. Del lado de la base "v_disparos >= null" nunca es
   verdadero: no había cupo que valiera y se podía llenar el depósito
   entero. Del lado del navegador es al revés, "0 >= null" da verdadero y
   al invitado le aparecía el rollo lleno sin haber sacado una foto. */
select como('clave-nul','insert into ce_eventos(codigo,nombre,camara,cupo_fotos) values (''QUI-NUL'',''Sin cupo'',true,null)');
set role postgres;
insert into ce_rollos(token,codigo,nombre) values ('tok-sincupo','QUI-NUL','Vale');
select verificar('con la columna vacía el cupo que se informa son 24',
  (select pido(null,'select (ce_mi_rollo(''QUI-NUL'',''tok-sincupo'',''Vale'')->>''cupo'')'))='24');
update ce_rollos set disparos=24 where token='tok-sincupo';
select verificar('con la columna vacía el cupo igual frena a las 24',
  (select pido(null,'select ce_tomar_foto(''QUI-NUL'',''tok-sincupo'',''bn'',''QUI-NUL/tok-sincupo/25.jpg'')::text')) like 'error%');
update ce_rollos set disparos=0 where token='tok-sincupo';
select verificar('y antes de las 24 deja sacar, contando bien lo que queda',
  (select pido(null,'select (ce_tomar_foto(''QUI-NUL'',''tok-sincupo'',''bn'',''QUI-NUL/tok-sincupo/1.jpg'')->>''restantes'')'))='23');

select '── el álbum de a tandas ──';
/* ce_album_de corta en 400, que es lo que se puede dibujar en una pantalla.
   El organizador que se lleva TODAS necesita las 1450 de un casamiento: sin
   esto el zip se bajaba con 400 y decía "listo". */
select como('clave-big','insert into ce_eventos(codigo,nombre,camara,cupo_fotos,revelado) values (''BOD-BIG'',''Casamiento'',true,24,true)');
set role postgres;
insert into ce_rollos(token,codigo,nombre)
  select 'tk'||g,'BOD-BIG','Invitado '||g from generate_series(1,60) g;
insert into ce_disparos(id,codigo,token,filtro,ruta,ts)
  select 'd'||g,'BOD-BIG','tk'||((g%60)+1),'bn','BOD-BIG/f/'||g||'.jpg',g from generate_series(1,1450) g;
select verificar('el álbum de pantalla corta en 400 pero dice cuántas hay',
  (select pido(null,'select json_array_length(ce_album_de(''BOD-BIG'',''tk1'')->''todas'')::text'))='400'
  and (select pido(null,'select ce_album_de(''BOD-BIG'',''tk1'')->>''total_fotos'''))='1450');
select verificar('sin la clave del evento, las tandas no traen nada',
  (select pido(null,'select json_array_length(ce_album_pagina(''BOD-BIG'',0,500))::text'))='0');
select verificar('con la clave, las tandas traen las 1450 completas',
  (select pido('clave-big','select (json_array_length(ce_album_pagina(''BOD-BIG'',0,500))
      + json_array_length(ce_album_pagina(''BOD-BIG'',500,500))
      + json_array_length(ce_album_pagina(''BOD-BIG'',1000,500)))::text'))='1450');
select verificar('pasada la última, la tanda viene vacía (así corta el bucle)',
  (select pido('clave-big','select json_array_length(ce_album_pagina(''BOD-BIG'',1500,500))::text'))='0');
/* Las tres tandas juntas tienen que dar las 1450 exactas, sin repetir
   ninguna ni saltear ninguna: es donde se esconden los errores de más uno
   en la cuenta del offset.
   Aclaración honesta: la función ordena por (ts, id) y no solo por ts,
   porque dos fotos del mismo milisegundo tienen que salir siempre en el
   mismo orden. Eso es una GARANTÍA, no algo que esta prueba demuestre:
   probamos a romper el desempate —incluso con 300 fotos empatadas montadas
   sobre el corte— y la base las devolvió igual igual. Así que esta prueba
   agarra la cuenta del offset, no el desempate. */
set role postgres;
update ce_disparos set ts=7 where id in (select 'd'||g from generate_series(400,700) g);
select verificar('las tandas dan 1450 exactas: ni repetidas ni salteadas',
  (select pido('clave-big',$q$
     with t as (
       select value->>'ruta' as ruta from json_array_elements(ce_album_pagina('BOD-BIG',0,500))
       union all
       select value->>'ruta' from json_array_elements(ce_album_pagina('BOD-BIG',500,500))
       union all
       select value->>'ruta' from json_array_elements(ce_album_pagina('BOD-BIG',1000,500)))
     select (count(*) || '/' || count(distinct ruta)) from t $q$))='1450/1450');


select '── que una foto no pueda ir a la carpeta de otro (blindaje.sql) ──';
/* El camino del archivo lo mandaba el teléfono y la base lo creía. Con eso
   se podía reservar —y después subir— adentro de la carpeta de otro evento,
   o de una carpeta que no es de ninguno: esas quedan legibles para siempre,
   así que el depósito del negocio servía de hosting para cualquiera.
   Fiestas propias: a esta altura del archivo las de más arriba ya se
   borraron a propósito, probando el borrado en cascada. */
set role postgres;
select como('clave-ruta','insert into ce_eventos(codigo,nombre,camara,cupo_fotos) values (''QUI-RUT'',''Ruta'',true,10)');
select como('clave-otra','insert into ce_eventos(codigo,nombre,camara,cupo_fotos) values (''BOD-OTR'',''La de al lado'',true,10)');
select pido(null,'select ce_mi_rollo(''QUI-RUT'',''tok-colado-01'',''Colado'')::text');
select pido(null,'select ce_mi_rollo(''QUI-RUT'',''tok-vecino-01'',''Vecino'')::text');
select verificar('NO puede reservar en la carpeta de OTRO evento',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''BOD-OTR/tok-colado-01/1.jpg'')::text')) like 'error%');
select verificar('NO puede reservar con el token de otro',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''QUI-RUT/tok-vecino-01/robada.jpg'')::text')) like 'error%');
select verificar('NO puede inventarse una carpeta suelta',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''libre/suelto/virus.jpg'')::text')) like 'error%');
select verificar('NO puede subir a la raíz del depósito',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''cualquiera.jpg'')::text')) like 'error%');
select verificar('NO puede meter ".." en el camino',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''QUI-RUT/tok-colado-01/../a.jpg'')::text')) like 'error%');
select verificar('NO puede subir algo que no sea .jpg',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''QUI-RUT/tok-colado-01/pagina.html'')::text')) like 'error%');
select verificar('SÍ puede sacar su foto, en su carpeta',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''QUI-RUT/tok-colado-01/1.jpg'')::text')) not like 'error%',
  (select pido(null,'select ce_tomar_foto(''QUI-RUT'',''tok-colado-01'',''bn'',''QUI-RUT/tok-colado-01/1b.jpg'')::text')));
select verificar('y nada de todo lo de arriba quedó anotado',
  (select count(*) from ce_disparos where token='tok-colado-01')=2,
  (select count(*)::text from ce_disparos where token='tok-colado-01'));

select '── un rollo no tiene invitados infinitos ──';
/* El token lo inventa el teléfono: inventando tokens se creaban rollos sin
   fin, de 24 fotos cada uno. Eso lo paga el negocio. */
set role postgres;
select como('clave-cupo','insert into ce_eventos(codigo,nombre,camara,cupo_invitados) values (''CUM-CUP'',''Chiquita'',true,2)');
select pido(null,'select ce_mi_rollo(''CUM-CUP'',''invitado-0001'',''Uno'')::text');
select pido(null,'select ce_mi_rollo(''CUM-CUP'',''invitado-0002'',''Dos'')::text');
select verificar('lleno el cupo, el tercero no entra',
  (select pido(null,'select ce_mi_rollo(''CUM-CUP'',''invitado-0003'',''Tres'')::text')) like 'error%');
select verificar('quedaron los dos de siempre',
  (select count(*) from ce_rollos where codigo='CUM-CUP')=2);
select verificar('los que ya tenían su cámara siguen entrando',
  (select pido(null,'select ce_mi_rollo(''CUM-CUP'',''invitado-0001'',''Uno'')::text')) not like 'error%');
select verificar('un token con cualquier cosa adentro se rechaza',
  (select pido(null,'select ce_mi_rollo(''CUM-CUP'',''x'',''Corto'')::text')) like 'error%'
  and (select pido(null,'select ce_mi_rollo(''CUM-CUP'',''tok/con/barras'',''Raro'')::text')) like 'error%');
select pido(null,'select ce_mi_rollo(''QUI-RUT'',''invitado-0004'',''' || repeat('A',500) || ''')::text');
select verificar('un nombre larguísimo se recorta a 40, no se guarda entero',
  (select length(nombre) from ce_rollos where token='invitado-0004') = 40,
  coalesce((select length(nombre)::text from ce_rollos where token='invitado-0004'),'no se creó'));
select verificar('nadie puede ponerse un cupo de un millón de fotos',
  (select como('clave-cupo','update ce_eventos set cupo_fotos=999999 where codigo=''CUM-CUP''')) like 'error%'
  or (select cupo_fotos from ce_eventos where codigo='CUM-CUP') is distinct from 999999);
