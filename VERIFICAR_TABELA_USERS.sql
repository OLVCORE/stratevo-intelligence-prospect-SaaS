-- ============================================================================
-- VERIFICAÇÃO: Tabela users e estrutura completa
-- ============================================================================

-- 1. Verificar se tabela existe
SELECT 
  'Tabela users existe' AS verificacao,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) AS resultado;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'users';

-- 4. Verificar RLS habilitado
SELECT 
  'RLS habilitado' AS verificacao,
  relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname = 'users';

-- 5. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

-- 6. Contar registros (deve ser 0 se ainda não completou onboarding)
SELECT 
  'Total de registros' AS verificacao,
  COUNT(*) AS total
FROM public.users;

