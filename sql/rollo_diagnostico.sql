-- Si rollo.sql no deja nada instalado, corré esto y pegame el resultado:
-- dice en qué estado está la base ANTES de instalar la cámara.
select 1 as n, 'Tabla ce_eventos'                as parte, to_regclass('public.ce_eventos') is not null as ok
union all select 2, 'Tabla ce_items',   to_regclass('public.ce_items')  is not null
union all select 3, 'claves.sql corrido (ce_claves)', to_regclass('public.ce_claves') is not null
union all select 4, 'claves.sql corrido (ce_permitido)', exists(select 1 from pg_proc where proname='ce_permitido')
union all select 5, 'Extensión pgcrypto',  exists(select 1 from pg_extension where extname='pgcrypto')
union all select 6, 'Esquema storage a la vista', to_regclass('storage.buckets') is not null
order by n;
