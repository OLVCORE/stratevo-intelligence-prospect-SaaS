-- ============================================================================
-- CRIAR FUNÇÕES RPC FALTANTES
-- ============================================================================
-- Baseado na análise do Supabase Assistant
-- As funções get_sectors_niches e get_user_tenant não existem ou não estão
-- sendo expostas pelo PostgREST
-- ============================================================================

-- ========================================
-- 1. CRIAR FUNÇÃO get_user_tenant
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.tenant_id 
  FROM public.users u 
  WHERE u.auth_user_id = auth.uid() 
  LIMIT 1;
$$;

-- Garantir permissões
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon, authenticated;

-- ========================================
-- 2. CRIAR FUNÇÃO get_sectors_niches (VERSÃO TABLE)
-- ========================================
-- Esta versão retorna uma TABLE que o PostgREST pode expor facilmente
CREATE OR REPLACE FUNCTION public.get_sectors_niches()
RETURNS TABLE (
  sector_code text,
  sector_name text,
  description text,
  niche_code text,
  niche_name text,
  niche_description text,
  keywords text[],
  cnaes text[],
  ncms text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    s.sector_code,
    s.sector_name,
    s.description,
    n.niche_code,
    n.niche_name,
    n.description as niche_description,
    n.keywords,
    n.cnaes,
    n.ncms
  FROM public.sectors s
  LEFT JOIN public.niches n ON n.sector_code = s.sector_code
  ORDER BY s.sector_name, n.niche_name;
$$;

-- Garantir permissões
REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon, authenticated;

-- ========================================
-- 3. CRIAR FUNÇÃO get_sectors_niches_json (VERSÃO JSONB)
-- ========================================
-- Esta versão retorna JSONB para compatibilidade com código existente
CREATE OR REPLACE FUNCTION public.get_sectors_niches_json()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'sectors', COALESCE(
      (SELECT jsonb_agg(s ORDER BY s.sector_name) 
       FROM public.sectors s),
      '[]'::jsonb
    ),
    'niches', COALESCE(
      (SELECT jsonb_agg(n ORDER BY n.niche_name) 
       FROM public.niches n),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Garantir permissões
REVOKE ALL ON FUNCTION public.get_sectors_niches_json() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO anon, authenticated;

-- ========================================
-- 4. GARANTIR POLÍTICAS RLS PARA TABELAS
-- ========================================
-- Verificar se RLS está habilitado
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Criar políticas de leitura se não existirem
DROP POLICY IF EXISTS sectors_read ON public.sectors;
CREATE POLICY sectors_read ON public.sectors 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS niches_read ON public.niches;
CREATE POLICY niches_read ON public.niches 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- ========================================
-- 5. GARANTIR PERMISSÕES NAS TABELAS
-- ========================================
-- Revogar todas e conceder apenas SELECT
REVOKE ALL ON public.sectors FROM authenticated, anon;
REVOKE ALL ON public.niches FROM authenticated, anon;

GRANT SELECT ON public.sectors TO authenticated, anon;
GRANT SELECT ON public.niches TO authenticated, anon;

-- ========================================
-- 6. TESTAR FUNÇÕES
-- ========================================
DO $$
DECLARE
  tenant_result uuid;
  sectors_niches_result RECORD;
  json_result JSONB;
BEGIN
  -- Testar get_user_tenant (pode retornar NULL se não houver usuário logado)
  BEGIN
    SELECT public.get_user_tenant() INTO tenant_result;
    RAISE NOTICE '✅ get_user_tenant() executada (resultado: %)', tenant_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ get_user_tenant() falhou: %', SQLERRM;
  END;
  
  -- Testar get_sectors_niches (TABLE)
  BEGIN
    SELECT COUNT(*) INTO sectors_niches_result
    FROM public.get_sectors_niches();
    RAISE NOTICE '✅ get_sectors_niches() executada';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ get_sectors_niches() falhou: %', SQLERRM;
  END;
  
  -- Testar get_sectors_niches_json
  BEGIN
    SELECT public.get_sectors_niches_json() INTO json_result;
    RAISE NOTICE '✅ get_sectors_niches_json() executada';
    RAISE NOTICE '   Setores: %', jsonb_array_length(json_result->'sectors');
    RAISE NOTICE '   Nichos: %', jsonb_array_length(json_result->'niches');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ get_sectors_niches_json() falhou: %', SQLERRM;
  END;
END $$;

-- ========================================
-- 7. FORÇAR RELOAD DO POSTGREST
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- 8. VERIFICAR FUNÇÕES CRIADAS
-- ========================================
SELECT 
  'FUNÇÕES CRIADAS' as verificacao,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant', 'get_sectors_niches', 'get_sectors_niches_json')
ORDER BY p.proname;

-- ========================================
-- 9. VERIFICAR PERMISSÕES
-- ========================================
SELECT 
  'PERMISSÕES FUNÇÕES' as verificacao,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_tenant', 'get_sectors_niches', 'get_sectors_niches_json')
ORDER BY routine_name, grantee;

