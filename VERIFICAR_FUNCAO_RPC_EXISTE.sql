-- ============================================
-- VERIFICAR SE A FUNÇÃO RPC EXISTE
-- ============================================
-- Execute este SQL para verificar se a função foi criada corretamente

SELECT 
  'FUNCAO_RPC' as tipo,
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

-- Verificar permissões
SELECT 
  'PERMISSOES' as tipo,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

-- Verificar se a coluna data_sources existe
SELECT 
  'COLUNAS_SOURCE' as tipo,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;
