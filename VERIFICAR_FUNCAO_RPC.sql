-- ============================================
-- VERIFICAR SE A FUNÇÃO RPC EXISTE
-- ============================================
-- Execute este SQL no Supabase SQL Editor para verificar
-- se a função insert_decision_makers_batch foi criada

-- Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

-- Se não retornar nenhuma linha, a função NÃO existe
-- Nesse caso, execute: APLICAR_FUNCAO_INSERT_DECISION_MAKERS.sql

-- Verificar permissões da função
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proacl IS NULL THEN 'Sem permissões específicas'
    ELSE array_to_string(p.proacl, ', ')
  END as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'insert_decision_makers_batch';

-- Testar a função (se existir)
-- Descomente as linhas abaixo para testar:
/*
SELECT public.insert_decision_makers_batch('[]'::JSONB);
*/

