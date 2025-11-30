-- ============================================================================
-- CORRIGIR POSTGREST SCHEMA CACHE
-- ============================================================================
-- O PostgREST precisa "ver" as tabelas no schema cache
-- Execute este script para garantir que tudo está configurado corretamente
-- ============================================================================

-- ========================================
-- PASSO 1: VERIFICAR SE AS TABELAS EXISTEM
-- ========================================
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('sectors', 'niches')
ORDER BY tablename;

-- ========================================
-- PASSO 2: VERIFICAR SE ESTÃO PUBLICADAS NO POSTGREST
-- ========================================
-- O PostgREST usa a configuração de publicação automática
-- Mas vamos garantir que estão acessíveis

-- Verificar permissões
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('sectors', 'niches')
ORDER BY table_name, grantee;

-- ========================================
-- PASSO 3: GARANTIR PERMISSÕES CORRETAS
-- ========================================
-- Garantir que authenticated e anon podem SELECT
GRANT SELECT ON public.sectors TO authenticated;
GRANT SELECT ON public.sectors TO anon;
GRANT SELECT ON public.niches TO authenticated;
GRANT SELECT ON public.niches TO anon;

-- ========================================
-- PASSO 4: VERIFICAR RLS ESTÁ HABILITADO
-- ========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sectors', 'niches');

-- ========================================
-- PASSO 5: VERIFICAR POLÍTICAS RLS
-- ========================================
SELECT 
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
-- PASSO 6: FORÇAR ATUALIZAÇÃO DO SCHEMA CACHE
-- ========================================
-- O PostgREST atualiza o cache automaticamente, mas podemos forçar
-- Isso geralmente acontece quando você:
-- 1. Reinicia o projeto no Supabase Dashboard
-- 2. Ou aguarda alguns minutos

-- Verificar se podemos acessar via função (que funciona)
SELECT COUNT(*) as total_setores FROM public.sectors;
SELECT COUNT(*) as total_nichos FROM public.niches;

-- ========================================
-- PASSO 7: CRIAR/ATUALIZAR FUNÇÃO RPC (SOLUÇÃO TEMPORÁRIA)
-- ========================================
-- Enquanto o cache não atualiza, vamos usar a função RPC
CREATE OR REPLACE FUNCTION public.get_sectors_niches()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'sectors', (
      SELECT json_agg(row_to_json(s)) 
      FROM (
        SELECT 
          sector_code,
          sector_name,
          description
        FROM public.sectors 
        ORDER BY sector_name
      ) s
    ),
    'niches', (
      SELECT json_agg(row_to_json(n)) 
      FROM (
        SELECT 
          niche_code,
          niche_name,
          sector_code,
          description,
          keywords,
          cnaes,
          ncms
        FROM public.niches 
        ORDER BY niche_name
      ) n
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{"sectors":[],"niches":[]}'::json);
END;
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon;

-- Testar a função
SELECT public.get_sectors_niches();

-- ========================================
-- PASSO 8: VERIFICAR SE FUNÇÃO FOI CRIADA
-- ========================================
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_sectors_niches';

