-- ============================================================================
-- DIAGNÓSTICO E SOLUÇÃO FINAL - POSTGREST NÃO VÊ TABELAS
-- ============================================================================

-- ========================================
-- VERIFICAR SE TUDO EXISTE NO BANCO
-- ========================================
DO $$
DECLARE
  sectors_exists BOOLEAN;
  niches_exists BOOLEAN;
  rpc_json_exists BOOLEAN;
  rpc_table_exists BOOLEAN;
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETO';
  RAISE NOTICE '========================================';
  
  -- Verificar tabelas
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sectors'
  ) INTO sectors_exists;
  
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'niches'
  ) INTO niches_exists;
  
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
  
  -- Contar registros
  IF sectors_exists THEN
    SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  ELSE
    sectors_count := 0;
  END IF;
  
  IF niches_exists THEN
    SELECT COUNT(*) INTO niches_count FROM public.niches;
  ELSE
    niches_count := 0;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'BANCO DE DADOS:';
  RAISE NOTICE '  Tabela sectors: % (registros: %)', 
    CASE WHEN sectors_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END, 
    sectors_count;
  RAISE NOTICE '  Tabela niches: % (registros: %)', 
    CASE WHEN niches_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END, 
    niches_count;
  RAISE NOTICE '  Função get_sectors_niches_json: %', 
    CASE WHEN rpc_json_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;
  RAISE NOTICE '  Função get_sectors_niches: %', 
    CASE WHEN rpc_table_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;
  
  IF NOT sectors_exists OR NOT niches_exists OR sectors_count = 0 OR niches_count = 0 THEN
    RAISE WARNING '';
    RAISE WARNING '⚠️ PROBLEMA: Tabelas ou dados faltando!';
    RAISE WARNING 'SOLUÇÃO: Execute CRIAR_SETORES_NICHOS_URGENTE.sql';
    RETURN;
  END IF;
  
  IF NOT rpc_json_exists OR NOT rpc_table_exists THEN
    RAISE WARNING '';
    RAISE WARNING '⚠️ PROBLEMA: Funções RPC faltando!';
    RAISE WARNING 'SOLUÇÃO: Execute CRIAR_SETORES_NICHOS_URGENTE.sql';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ TUDO EXISTE NO BANCO DE DADOS!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ SE POSTGREST AINDA NÃO VÊ:';
  RAISE NOTICE 'O problema está na CONFIGURAÇÃO DO SUPABASE, não no banco!';
END $$;

-- ========================================
-- GARANTIR PERMISSÕES
-- ========================================
GRANT SELECT ON public.sectors TO authenticated, anon;
GRANT SELECT ON public.niches TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO authenticated, anon;

-- ========================================
-- FORÇAR RELOAD POSTGREST
-- ========================================
NOTIFY pgrst, 'reload schema';

DO $$
DECLARE
  ts text := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON TABLE public.sectors IS %L;$f$, 'Setores - ' || ts);
  EXECUTE format($f$COMMENT ON TABLE public.niches IS %L;$f$, 'Nichos - ' || ts);
END $$;

-- ========================================
-- TESTAR FUNÇÕES DIRETAMENTE
-- ========================================
DO $$
DECLARE
  test_result JSONB;
  test_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TESTANDO FUNÇÕES RPC:';
  
  -- Testar get_sectors_niches_json
  BEGIN
    SELECT public.get_sectors_niches_json() INTO test_result;
    SELECT jsonb_array_length(test_result->'sectors') INTO test_count;
    RAISE NOTICE '  ✅ get_sectors_niches_json() funciona: % setores', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '  ❌ get_sectors_niches_json() falhou: %', SQLERRM;
  END;
  
  -- Testar get_sectors_niches
  BEGIN
    SELECT COUNT(*) INTO test_count FROM public.get_sectors_niches();
    RAISE NOTICE '  ✅ get_sectors_niches() funciona: % linhas', test_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '  ❌ get_sectors_niches() falhou: %', SQLERRM;
  END;
END $$;

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS OBRIGATÓRIOS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. SUPABASE DASHBOARD → Settings → API';
  RAISE NOTICE '   Verifique se "Exposed schemas" inclui "public"';
  RAISE NOTICE '   Se não incluir, ADICIONE "public" e SALVE';
  RAISE NOTICE '';
  RAISE NOTICE '2. SUPABASE DASHBOARD → Settings → General';
  RAISE NOTICE '   Clique em "RESTART PROJECT"';
  RAISE NOTICE '   Aguarde 2-3 minutos';
  RAISE NOTICE '';
  RAISE NOTICE '3. RECARREGUE O FRONTEND';
  RAISE NOTICE '   Ctrl+Shift+R (hard refresh)';
  RAISE NOTICE '';
  RAISE NOTICE '4. VERIFIQUE O CONSOLE';
  RAISE NOTICE '   Não deve mais aparecer erros 404';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

