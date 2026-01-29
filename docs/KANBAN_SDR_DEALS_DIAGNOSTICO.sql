-- ============================================================
-- DIAGNÓSTICO: Kanban (arrastar e soltar) e tabela sdr_deals
-- Rode no Supabase SQL Editor — uma seção por vez
-- ============================================================

-- 1. Ver se o RLS está ligado na tabela sdr_deals
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'sdr_deals';

-- 2. Ver as policies de sdr_deals (UPDATE)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'sdr_deals'
  AND (cmd = 'UPDATE' OR cmd = 'ALL');

-- 3. Ver colunas da tabela sdr_deals (tem title e stage; não tem deal_title nem tenant_id)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- 4. Ver um negócio específico (troque o ID se precisar)
-- SELECT id, title, stage, status, company_id, created_at, updated_at
-- FROM sdr_deals
-- WHERE id = '0de3210c-3a7e-44b2-9611-015d20bd181d';

-- 5. Contar negócios: total e ativos (só se existir coluna deleted_at)
-- SELECT COUNT(*) AS total FROM sdr_deals;
-- SELECT COUNT(*) AS ativos FROM sdr_deals WHERE deleted_at IS NULL;

-- 6. NEGÓCIOS ÓRFÃOS: stage que não existe em sdr_pipeline_stages (por isso 11 vs 2 no pipeline)
-- Ver etapas válidas do pipeline:
-- SELECT id, key, name FROM sdr_pipeline_stages WHERE is_closed = false ORDER BY sort_order;

-- Negócios cujo stage não está em sdr_pipeline_stages (órfãos)
SELECT d.id, d.title, d.stage AS etapa_atual, d.company_id, d.created_at
FROM sdr_deals d
WHERE d.stage IS NOT NULL
  AND d.stage NOT IN (SELECT key FROM sdr_pipeline_stages WHERE is_closed = false);

-- Contagem: total, visíveis no pipeline e órfãos
SELECT
  (SELECT COUNT(*) FROM sdr_deals) AS total_negocios,
  (SELECT COUNT(*) FROM sdr_deals d WHERE d.stage IN (SELECT key FROM sdr_pipeline_stages WHERE is_closed = false)) AS negocios_visiveis,
  (SELECT COUNT(*) FROM sdr_deals d WHERE d.stage IS NOT NULL AND d.stage NOT IN (SELECT key FROM sdr_pipeline_stages WHERE is_closed = false)) AS negocios_orfaos;

-- 7. OPCIONAL: Ajustar órfãos — colocar todos na etapa 'lead' (troque 'lead' se quiser)
-- UPDATE sdr_deals
-- SET stage = 'lead'
-- WHERE stage IS NOT NULL
--   AND stage NOT IN (SELECT key FROM sdr_pipeline_stages WHERE is_closed = false);

-- 8. OPCIONAL: Apagar órfãos (soft delete se tiver deleted_at, ou DELETE direto)
-- DELETE FROM sdr_deals
-- WHERE stage IS NOT NULL
--   AND stage NOT IN (SELECT key FROM sdr_pipeline_stages WHERE is_closed = false);
