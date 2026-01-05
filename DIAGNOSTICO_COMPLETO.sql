-- ============================================
-- DIAGNÓSTICO COMPLETO - Encontrar TODAS as referências a data_source
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este script encontra TODAS as referências à coluna data_source

-- 1. Verificar se a coluna data_source existe na tabela
SELECT 
  'TABELA' as tipo,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name = 'data_source'
ORDER BY column_name;

-- 2. Verificar TODAS as colunas da tabela decision_makers
SELECT 
  'TODAS_COLUNAS' as tipo,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

-- 3. Verificar funções que referenciam decision_makers
SELECT 
  'FUNCAO' as tipo,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%decision_makers%'
  AND routine_definition LIKE '%data_source%';

-- 4. Verificar views que referenciam decision_makers
SELECT 
  'VIEW' as tipo,
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%decision_makers%'
  AND view_definition LIKE '%data_source%';

-- 5. Verificar triggers que referenciam decision_makers
SELECT 
  'TRIGGER' as tipo,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND action_statement LIKE '%decision_makers%'
  AND action_statement LIKE '%data_source%';

-- 6. Verificar constraints que referenciam decision_makers
SELECT 
  'CONSTRAINT' as tipo,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'decision_makers';

-- 7. Verificar índices que referenciam decision_makers
SELECT 
  'INDEX' as tipo,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'decision_makers'
  AND indexdef LIKE '%data_source%';

-- 8. Verificar a função insert_decision_makers_batch
SELECT 
  'FUNCAO_RPC' as tipo,
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'insert_decision_makers_batch';

-- 9. Verificar se há alguma coluna com nome similar
SELECT 
  'COLUNAS_SIMILARES' as tipo,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%data_source%'
ORDER BY table_name, column_name;

