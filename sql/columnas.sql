-- ═══════════════════════════════════════════════════════════════
--  CLICK ETERNO · hashtag y lugar del evento
--  Se corre UNA vez. Es seguro correrlo de nuevo.
-- ═══════════════════════════════════════════════════════════════
alter table ce_eventos add column if not exists hashtag text;
alter table ce_eventos add column if not exists lugar   text;
