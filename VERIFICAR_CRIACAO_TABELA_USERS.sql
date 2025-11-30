-- ============================================================================
-- VERIFICAÇÃO: Tabela users e função get_user_tenant
-- ============================================================================
-- Execute este script para verificar se tudo foi criado corretamente
-- ============================================================================

-- 1. Verificar se a tabela users existe
SELECT 
  'Tabela users existe' AS verificacao,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) AS resultado;

-- 2. Verificar se a função get_user_tenant existe
SELECT 
  'Função get_user_tenant existe' AS verificacao,
  EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_user_tenant'
  ) AS resultado;

-- 3. Verificar estrutura da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'users';

-- 5. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

-- 6. Verificar permissões da função
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  r.rolname AS granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl pa ON pa.oid = p.oid
LEFT JOIN pg_roles r ON r.oid = ANY(pa.proacl)
WHERE n.nspname = 'public'
AND p.proname = 'get_user_tenant';

