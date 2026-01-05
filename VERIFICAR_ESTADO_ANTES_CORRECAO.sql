-- ============================================
-- VERIFICAÇÃO RÁPIDA - ANTES DE APLICAR CORREÇÃO
-- ============================================
-- Execute este script para verificar o estado atual
-- antes de aplicar a correção definitiva

-- 1. Verificar colunas relacionadas a source
SELECT 
  'COLUNAS_SOURCE' as verificação,
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 2. Verificar função RPC atual
SELECT 
  'FUNCAO_RPC' as verificação,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

-- 3. Verificar parâmetros da função
SELECT 
  'PARAMETROS_FUNCAO' as verificação,
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE 'insert_decision_makers_batch%'
ORDER BY ordinal_position;

-- 4. Verificar se há índices únicos
SELECT 
  'INDICES' as verificação,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'decision_makers'
  AND indexname LIKE '%apollo_person%';

-- 5. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 VERIFICAÇÃO CONCLUÍDA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Se você vê "data_source" (singular) acima, execute:';
  RAISE NOTICE '  → SOLUCAO_DEFINITIVA_360_ENGENHEIRO_CHEFE.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'Se você vê apenas "data_sources" (plural), mas o erro persiste:';
  RAISE NOTICE '  → REINICIE o projeto Supabase (Settings → General → Restart)';
  RAISE NOTICE '';
END $$;

