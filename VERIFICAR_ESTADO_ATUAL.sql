-- ============================================
-- VERIFICAR ESTADO ATUAL DO BANCO
-- ============================================
-- Execute este SQL para verificar o estado atual
-- e identificar o problema exato

-- 1. Verificar colunas da tabela decision_makers
SELECT 
  'COLUNAS' as tipo,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 2. Verificar todas as colunas (para debug)
SELECT 
  'TODAS_COLUNAS' as tipo,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

-- 3. Verificar funções RPC
SELECT 
  'FUNCOES_RPC' as tipo,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%decision_makers%'
ORDER BY routine_name;

-- 4. Verificar views que referenciam decision_makers
SELECT 
  'VIEWS' as tipo,
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%decision_makers%'
  AND (view_definition LIKE '%data_source%' OR view_definition LIKE '%source%');

-- 5. Verificar triggers
SELECT 
  'TRIGGERS' as tipo,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'decision_makers';


