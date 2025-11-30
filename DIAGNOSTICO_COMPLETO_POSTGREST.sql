-- ============================================================================
-- DIAGNÓSTICO COMPLETO: PostgREST Schema Cache
-- ============================================================================
-- Execute este script para verificar o estado atual do sistema
-- ============================================================================

-- ========================================
-- 1. VERIFICAR SE TABELAS EXISTEM NO BANCO
-- ========================================
SELECT 
  'TABELAS NO BANCO' as categoria,
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('sectors', 'niches')
ORDER BY tablename;

-- ========================================
-- 2. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================
SELECT 
  'ESTRUTURA SECTORS' as categoria,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sectors'
ORDER BY ordinal_position;

SELECT 
  'ESTRUTURA NICHES' as categoria,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'niches'
ORDER BY ordinal_position;

-- ========================================
-- 3. VERIFICAR DADOS NAS TABELAS
-- ========================================
SELECT 
  'DADOS SECTORS' as categoria,
  COUNT(*) as total_registros,
  string_agg(sector_name, ', ') as exemplos
FROM public.sectors
LIMIT 1;

SELECT 
  'DADOS NICHOS' as categoria,
  COUNT(*) as total_registros,
  string_agg(niche_name, ', ') as exemplos
FROM public.niches
LIMIT 1;

-- ========================================
-- 4. VERIFICAR RLS E POLÍTICAS
-- ========================================
SELECT 
  'POLÍTICAS RLS' as categoria,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('sectors', 'niches')
ORDER BY tablename, policyname;

-- ========================================
-- 5. VERIFICAR PERMISSÕES GRANT
-- ========================================
SELECT 
  'PERMISSÕES GRANT' as categoria,
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('sectors', 'niches')
  AND grantee IN ('authenticated', 'anon', 'public')
ORDER BY table_name, grantee, privilege_type;

-- ========================================
-- 6. VERIFICAR FUNÇÃO RPC
-- ========================================
SELECT 
  'FUNÇÃO RPC' as categoria,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_sectors_niches';

-- ========================================
-- 7. VERIFICAR PERMISSÕES DA FUNÇÃO RPC
-- ========================================
SELECT 
  'PERMISSÕES RPC' as categoria,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_sectors_niches'
ORDER BY grantee, privilege_type;

-- ========================================
-- 8. TESTAR ACESSO DIRETO AO BANCO
-- ========================================
SELECT 
  'TESTE DIRETO SECTORS' as categoria,
  COUNT(*) as total,
  array_agg(sector_name ORDER BY sector_name) as nomes
FROM public.sectors;

SELECT 
  'TESTE DIRETO NICHOS' as categoria,
  COUNT(*) as total,
  array_agg(niche_name ORDER BY niche_name LIMIT 5) as nomes_exemplo
FROM public.niches;

-- ========================================
-- 9. TESTAR FUNÇÃO RPC DIRETAMENTE
-- ========================================
SELECT 
  'TESTE RPC' as categoria,
  public.get_sectors_niches() as resultado;

-- ========================================
-- 10. VERIFICAR SCHEMA CACHE DO POSTGREST
-- ========================================
-- Nota: Não há forma direta de verificar o cache do PostgREST via SQL
-- Mas podemos verificar se as tabelas estão "publicadas" corretamente

SELECT 
  'PUBLICAÇÃO POSTGREST' as categoria,
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('sectors', 'niches')
    ) THEN 'Tabelas existem no banco'
    ELSE 'Tabelas NÃO existem no banco'
  END as status_banco,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('sectors', 'niches')
    ) THEN 'RLS configurado'
    ELSE 'RLS NÃO configurado'
  END as status_rls
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('sectors', 'niches')
LIMIT 1;

