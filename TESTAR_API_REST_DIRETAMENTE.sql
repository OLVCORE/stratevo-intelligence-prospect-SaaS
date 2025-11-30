-- ============================================================================
-- TESTAR API REST DIRETAMENTE - Verificar se PostgREST está expondo corretamente
-- ============================================================================
-- Este script verifica se PostgREST consegue ver tabelas e funções
-- ============================================================================

-- ========================================
-- VERIFICAR SE TABELAS ESTÃO ACESSÍVEIS VIA POSTGREST
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_json_exists BOOLEAN;
  rpc_table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO POSTGREST';
  RAISE NOTICE '========================================';
  
  -- Contar dados
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  -- Verificar funções RPC
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches_json'
    AND pg_get_function_arguments(p.oid) = ''
  ) INTO rpc_json_exists;
  
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
    AND pg_get_function_arguments(p.oid) = ''
  ) INTO rpc_table_exists;
  
  RAISE NOTICE 'Dados no banco:';
  RAISE NOTICE '  Setores: %', sectors_count;
  RAISE NOTICE '  Nichos: %', niches_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Funções RPC no banco:';
  RAISE NOTICE '  get_sectors_niches_json: %', 
    CASE WHEN rpc_json_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;
  RAISE NOTICE '  get_sectors_niches: %', 
    CASE WHEN rpc_table_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;
  
  IF sectors_count > 0 AND niches_count > 0 AND rpc_json_exists AND rpc_table_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ TUDO ESTÁ NO BANCO DE DADOS!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ SE POSTGREST AINDA NÃO VÊ:';
    RAISE NOTICE '1. Verifique Settings → API → Exposed schemas = "public"';
    RAISE NOTICE '2. REINICIE o projeto Supabase (Settings → General → Restart)';
    RAISE NOTICE '3. Aguarde 2-3 minutos após restart';
    RAISE NOTICE '4. Teste a URL diretamente no navegador:';
    RAISE NOTICE '   https://qtcwetabhhkhvomcrqgm.supabase.co/rest/v1/rpc/get_sectors_niches_json';
  END IF;
END $$;

-- ========================================
-- TESTAR FUNÇÕES DIRETAMENTE
-- ========================================
-- Testar get_sectors_niches_json
SELECT 
  'TESTE JSON' as teste,
  jsonb_pretty(public.get_sectors_niches_json()) as resultado;

-- Testar get_sectors_niches (primeiras 5 linhas)
SELECT 
  'TESTE TABLE' as teste,
  sector_code,
  sector_name,
  niche_code,
  niche_name
FROM public.get_sectors_niches()
LIMIT 5;

-- ========================================
-- VERIFICAR PERMISSÕES E RLS
-- ========================================
SELECT 
  'PERMISSÕES SECTORS' as verificacao,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'sectors'
  AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

SELECT 
  'PERMISSÕES NICHES' as verificacao,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'niches'
  AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

SELECT 
  'PERMISSÕES RPC' as verificacao,
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('get_sectors_niches_json', 'get_sectors_niches')
  AND grantee IN ('authenticated', 'anon')
ORDER BY routine_name, grantee;

