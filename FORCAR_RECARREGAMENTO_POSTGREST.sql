-- ============================================
-- FORÇAR RECARREGAMENTO DO CACHE DO POSTGREST
-- ============================================
-- Execute este SQL no Supabase SQL Editor quando
-- o erro "Could not find the 'data_source' column" aparecer

-- Método 1: Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

-- Aguardar alguns segundos para o cache ser atualizado
SELECT pg_sleep(2);

-- Método 2: Verificar se as colunas existem corretamente
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('data_source', 'data_sources', 'city', 'state', 'country', 'photo_url', 'headline')
ORDER BY column_name;

-- Método 3: Verificar se a função RPC existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'insert_decision_makers_batch';

-- Método 4: Verificar permissões da função
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  r.rolname AS owner
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'insert_decision_makers_batch';

-- Se ainda não funcionar após executar este script:
-- 1. Reinicie o projeto Supabase (Settings → General → Restart Project)
-- 2. Aguarde 2-3 minutos
-- 3. Tente novamente

