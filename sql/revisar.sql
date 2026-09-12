select 1 as n, 'Tabla de claves (ce_claves)'      as parte, to_regclass('public.ce_claves')  is not null as listo
union all select 2, 'Tabla de ajustes (ce_ajustes)', to_regclass('public.ce_ajustes') is not null
union all select 3, 'Función ce_permitido',      exists(select 1 from pg_proc where proname='ce_permitido')
union all select 4, 'Función ce_quien_soy',      exists(select 1 from pg_proc where proname='ce_quien_soy')
union all select 5, 'Función ce_cambiar_clave',  exists(select 1 from pg_proc where proname='ce_cambiar_clave')
union all select 6, 'Al crear evento pide clave',exists(select 1 from pg_trigger where tgname='ce_eventos_clave')
union all select 7, 'El estado lo decide la base',exists(select 1 from pg_trigger where tgname='ce_items_estado')
union all select 8, 'Reglas de eventos (van 4)', (select count(*) from pg_policies where tablename='ce_eventos')=4
union all select 9, 'Reglas de recuerdos (van 4)',(select count(*) from pg_policies where tablename='ce_items')=4
union all select 10,'Regla de archivos (opcional)',exists(select 1 from pg_policies
              where schemaname='storage' and tablename='objects' and policyname='ce medios borrar')
order by n;
