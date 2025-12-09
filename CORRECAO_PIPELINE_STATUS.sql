-- ==========================================
-- CORREÇÃO CRÍTICA: pipeline_status não atualizado no ON CONFLICT
-- ==========================================
-- Problema: Quando uma empresa já existe em qualified_prospects e é reprocessada,
-- o pipeline_status não era atualizado para 'new', então ela não aparecia no estoque.
-- 
-- Solução: Adicionar pipeline_status = 'new' no ON CONFLICT UPDATE

DROP FUNCTION IF EXISTS process_qualification_job(UUID, UUID);

-- Copiar a função completa da migration corrigida
-- (A função completa está em: supabase/migrations/20250210000002_fix_process_qualification_job_nome_fantasia.sql)

-- ✅ IMPORTANTE: Execute o arquivo completo da migration corrigida
-- Ou aplique apenas a correção no ON CONFLICT:

-- A correção está na linha do ON CONFLICT:
-- pipeline_status = 'new', -- ✅ CRÍTICO: Atualizar pipeline_status para 'new' quando reprocessar

-- Para aplicar rapidamente, execute a migration completa:
-- supabase/migrations/20250210000002_fix_process_qualification_job_nome_fantasia.sql

