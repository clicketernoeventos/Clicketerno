-- ══════════════════════════════════════════════════════════════════
--  ¿QUÉ ESTÁ PUESTO EN ESTA BASE Y QUÉ FALTA?
--
--  Una sola consulta, para pegar en el SQL Editor de Supabase y pegar
--  el resultado de vuelta en el chat. Los tres revisar.sql dicen lo
--  mismo con mucho más detalle; esto contesta la pregunta de todos los
--  días —"¿puedo hacer un evento de verdad?"— en dieciséis filas.
--
--  Todo tiene que dar ✅. Lo que aparezca con ❌ dice qué archivo
--  falta correr:
--    ce_permitido, ce_items_de, ce_item  → sql/claves.sql
--    ce_mi_rollo, ce_tomar_foto, ce_album_*, ce_rutas_rollo → sql/rollo.sql
--    ce_evento_publico/existe/abierto, ce_eventos cerrada → sql/blindaje.sql
--  El orden es claves → rollo → blindaje, y blindaje SIEMPRE último.
-- ══════════════════════════════════════════════════════════════════
select case when ok then '✅' else '❌ FALTA' end as estado, que
from (
  select 'ce_permitido · la clave por evento' as que,
         to_regprocedure('public.ce_permitido(text)') is not null as ok
  union all select 'ce_evento_publico · leer un evento sin clave (el QR)',
         to_regprocedure('public.ce_evento_publico(text)') is not null
  union all select 'ce_items_de · el muro de a tandas',
         to_regprocedure('public.ce_items_de(text,integer,integer)') is not null
  union all select 'ce_mi_rollo · abrirle la cámara al invitado',
         to_regprocedure('public.ce_mi_rollo(text,text,text)') is not null
  union all select 'ce_tomar_foto · gastar una foto del rollo',
         to_regprocedure('public.ce_tomar_foto(text,text,text,text)') is not null
  union all select 'ce_album_de · ver el álbum revelado',
         to_regprocedure('public.ce_album_de(text,text)') is not null
  union all select 'ce_album_pagina · DESCARGAR TODAS LAS FOTOS',
         to_regprocedure('public.ce_album_pagina(text,integer,integer)') is not null
  union all select 'ce_rutas_rollo · borrar un evento con sus fotos',
         to_regprocedure('public.ce_rutas_rollo(text)') is not null
  union all select 'ce_evento_existe · las reglas del depósito',
         to_regprocedure('public.ce_evento_existe(text)') is not null
  union all select 'ce_evento_abierto · que nadie espíe un rollo sin revelar',
         to_regprocedure('public.ce_evento_abierto(text)') is not null
  union all select 'columna vence · los 90 días',
         exists(select 1 from information_schema.columns
                where table_name='ce_eventos' and column_name='vence')
  union all select 'columna cupo_invitados · tope de rollos por evento',
         exists(select 1 from information_schema.columns
                where table_name='ce_eventos' and column_name='cupo_invitados')
  union all select 'ce_eventos CERRADA a curl (blindaje corrido)',
         not exists(select 1 from pg_policies
                    where tablename='ce_eventos' and cmd in ('SELECT','ALL')
                      and 'anon'=any(roles) and coalesce(qual,'true')='true')
  union all select 'puerta de ce_items · tope, muro cerrado y ts (blindaje2)',
         exists(select 1 from pg_trigger where tgname='z_ce_items_puerta')
  union all select 'freno de ce_eventos · no se crean sin fin (blindaje2)',
         exists(select 1 from pg_trigger where tgname='ce_eventos_freno')
  union all select 'columna acepto · constancia del organizador (blindaje2)',
         exists(select 1 from information_schema.columns
                where table_name='ce_eventos' and column_name='acepto')
) t order by ok, que;
