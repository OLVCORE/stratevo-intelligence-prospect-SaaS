-- ============================================================================
-- VERIFICAR SE A FUNÇÃO RPC REALMENTE EXISTE E ESTÁ ACESSÍVEL
-- ============================================================================

-- 1. Verificar se a função existe
SELECT 
  'FUNÇÃO RPC' as verificacao,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER ✅'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  CASE 
    WHEN p.provolatile = 's' THEN 'STABLE ✅'
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    ELSE 'VOLATILE'
  END as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_sectors_niches';

-- 2. Verificar permissões da função
SELECT 
  'PERMISSÕES FUNÇÃO' as verificacao,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_sectors_niches'
ORDER BY grantee, privilege_type;

-- 3. Testar a função diretamente
SELECT 
  'TESTE DIRETO' as verificacao,
  public.get_sectors_niches() as resultado_json;

-- 4. Verificar se PostgREST consegue ver a função
-- (Isso é difícil de verificar via SQL, mas podemos verificar o schema)
SELECT 
  'SCHEMA PUBLIC' as verificacao,
  nspname as schema_name,
  nspowner::regrole as owner
FROM pg_namespace
WHERE nspname = 'public';

-- 5. Verificar todas as funções RPC no schema public
SELECT 
  'TODAS FUNÇÕES RPC PUBLIC' as verificacao,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%sectors%' OR p.proname LIKE '%niches%'
ORDER BY p.proname;

-- 6. Verificar se há problemas de permissões no schema
SELECT 
  'PERMISSÕES SCHEMA' as verificacao,
  grantee,
  privilege_type
FROM information_schema.schema_privileges
WHERE schema_name = 'public'
ORDER BY grantee, privilege_type;

