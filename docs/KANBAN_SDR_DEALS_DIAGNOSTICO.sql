-- ============================================================
-- DIAGNÓSTICO: Kanban drag & drop e tabela sdr_deals
-- Execute no Supabase SQL Editor (uma seção por vez)
-- ============================================================

-- 1. Verificar se RLS está ativo em sdr_deals
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'sdr_deals';

-- 2. Listar policies de sdr_deals (UPDATE)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'sdr_deals'
  AND (cmd = 'UPDATE' OR cmd = 'ALL');

-- 3. Colunas da tabela (ver se existe stage, deal_stage, deleted_at, tenant_id)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- 4. Deal específico que retorna 400 (substitua o ID se necessário)
-- SELECT id, deal_title, title, deal_stage, stage, status, tenant_id, deleted_at, created_at, updated_at
-- FROM sdr_deals
-- WHERE id = '0de3210c-3a7e-44b2-9611-015d20bd181d';

-- 5. Contar deals totais vs ativos (se existir deleted_at)
-- SELECT COUNT(*) AS total FROM sdr_deals;
-- SELECT COUNT(*) AS ativos FROM sdr_deals WHERE deleted_at IS NULL;
