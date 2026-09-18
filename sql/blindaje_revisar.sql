-- ¿Quedó puesto el blindaje? Tienen que dar TODAS true.
-- Si alguna da false, lo que falta está en sql/blindaje.sql, en el paso que
-- lleva ese mismo título.
select  1 as n, 'La tabla de eventos ya no es de lectura libre'      as parte,
        exists(select 1 from pg_policies where tablename='ce_eventos'
                and cmd='SELECT' and qual like '%ce_permitido%') as listo
union all select  2, 'Los recuerdos tampoco',
        exists(select 1 from pg_policies where tablename='ce_items'
                and cmd='SELECT' and qual like '%ce_permitido%')
union all select  3, 'Función ce_evento_publico (el invitado entra por el código)',
        exists(select 1 from pg_proc where proname='ce_evento_publico')
union all select  4, 'Función ce_items_de (sin clave, solo lo aprobado)',
        exists(select 1 from pg_proc where proname='ce_items_de')
union all select  5, 'Función ce_item',
        exists(select 1 from pg_proc where proname='ce_item')
union all select  6, 'Función ce_evento_existe (la usan las reglas del depósito)',
        exists(select 1 from pg_proc where proname='ce_evento_existe')
union all select  7, 'Función ce_evento_abierto',
        exists(select 1 from pg_proc where proname='ce_evento_abierto')
union all select  8, 'La clave maestra NO se puede cambiar desde internet',
        not has_function_privilege('anon','ce_cambiar_maestra(text,text)','execute')
union all select  9, 'Columna cupo_invitados (tope de cámaras por fiesta)',
        exists(select 1 from information_schema.columns
                where table_name='ce_eventos' and column_name='cupo_invitados')
union all select 10, 'Tope de cupos (que nadie se ponga un millón de fotos)',
        exists(select 1 from pg_constraint where conname='ce_cupos_sanos')
union all select 11, 'ce_tomar_foto revisa el camino del archivo',
        exists(select 1 from pg_proc where proname='ce_tomar_foto'
                and prosrc like '%Camino de archivo inválido%')
union all select 12, 'ce_mi_rollo revisa el token y el cupo de invitados',
        exists(select 1 from pg_proc where proname='ce_mi_rollo'
                and prosrc like '%cámaras repartidas%')
union all select 13, 'Regla de subir a ce-medios (solo a la carpeta de un evento abierto)',
        exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
                and policyname='ce medios subir' and with_check like '%ce_evento_abierto%')
union all select 14, 'Las reglas del depósito preguntan por función, no por select',
        exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
                and policyname='ce rollos leer' and qual like '%ce_evento_existe%')
union all select 15, 'Tope de tamaño y tipo en ce-rollos',
        exists(select 1 from storage.buckets
                where id='ce-rollos' and file_size_limit is not null and allowed_mime_types is not null)
union all select 16, 'Tope de tamaño y tipo en ce-medios',
        exists(select 1 from storage.buckets
                where id='ce-medios' and file_size_limit is not null and allowed_mime_types is not null)
order by n;
