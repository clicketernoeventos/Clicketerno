-- Corré esto en el SQL Editor de Supabase después de rollo.sql y pegame el
-- resultado. Las filas 1 a 11 las instala el script solo. Las 12 a 14 son
-- las del depósito: si este proyecto no deja tocarlas desde el editor
-- (pasa desde 2025), hay que crearlas a mano desde el panel de Storage.
select 1 as n, 'BASE · Columnas de cámara en ce_eventos' as parte,
  (select count(*) from information_schema.columns
   where table_name='ce_eventos' and column_name in ('camara','cupo_fotos','revela_en','revelado'))=4 as listo
union all select  2, 'BASE · Tabla de rollos (ce_rollos)',     to_regclass('public.ce_rollos')   is not null
union all select  3, 'BASE · Tabla de disparos (ce_disparos)', to_regclass('public.ce_disparos') is not null
union all select  4, 'BASE · Función ce_camara_revelada', exists(select 1 from pg_proc where proname='ce_camara_revelada')
union all select  5, 'BASE · Función ce_mi_rollo',        exists(select 1 from pg_proc where proname='ce_mi_rollo')
union all select  6, 'BASE · Función ce_tomar_foto',      exists(select 1 from pg_proc where proname='ce_tomar_foto')
union all select  7, 'BASE · Función ce_devolver_foto',   exists(select 1 from pg_proc where proname='ce_devolver_foto')
union all select  8, 'BASE · Función ce_album_de',        exists(select 1 from pg_proc where proname='ce_album_de')
union all select  9, 'BASE · Función ce_camara_stats',    exists(select 1 from pg_proc where proname='ce_camara_stats')
union all select 10, 'BASE · Función ce_rutas_rollo',     exists(select 1 from pg_proc where proname='ce_rutas_rollo')
union all select 11, 'BASE · Función ce_ruta_reservada',  exists(select 1 from pg_proc where proname='ce_ruta_reservada')
union all select 12, 'DEPÓSITO · ce-rollos existe y es privado',
  exists(select 1 from storage.buckets where id='ce-rollos' and public=false)
union all select 13, 'DEPÓSITO · Regla de subir',
  exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ce rollos subir')
union all select 14, 'DEPÓSITO · Regla de leer',
  exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ce rollos leer')
union all select 15, 'DEPÓSITO · Regla de borrar',
  exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ce rollos borrar')
order by n;
