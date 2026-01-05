-- ============================================
-- VERIFICAR TODAS AS REFERÊNCIAS A data_source
-- ============================================
-- Execute este SQL para encontrar TODAS as referências
-- que podem estar causando o problema

-- 1. Verificar colunas
SELECT 'COLUNAS' as tipo, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 2. Verificar TODAS as colunas da tabela
SELECT 'TODAS_COLUNAS' as tipo, column_name, data_type, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

-- 3. Verificar views
SELECT 'VIEWS' as tipo, table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND (view_definition LIKE '%decision_makers%' AND view_definition LIKE '%data_source%');

-- 4. Verificar funções
SELECT 'FUNCOES' as tipo, routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition LIKE '%decision_makers%' AND routine_definition LIKE '%data_source%');

-- 5. Verificar triggers
SELECT 'TRIGGERS' as tipo, trigger_name, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'decision_makers'
  AND action_statement LIKE '%data_source%';

-- 6. Verificar constraints
SELECT 'CONSTRAINTS' as tipo, constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND check_clause LIKE '%decision_makers%'
  AND check_clause LIKE '%data_source%';

-- 7. Verificar índices
SELECT 'INDICES' as tipo, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'decision_makers'
  AND indexdef LIKE '%data_source%';


