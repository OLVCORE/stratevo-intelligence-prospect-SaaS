-- ============================================================================
-- VALIDAÇÃO COMPLETA: Verificar se TUDO foi criado corretamente
-- ============================================================================

DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_count INTEGER;
  tabelas_count INTEGER;
  tabelas_faltando TEXT[] := ARRAY[]::TEXT[];
  funcoes_faltando TEXT[] := ARRAY[]::TEXT[];
  tabela TEXT;
  funcao TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO COMPLETA DO PROJETO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- ========================================
  -- VERIFICAR SETORES E NICHOS
  -- ========================================
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  RAISE NOTICE 'SETORES E NICHOS:';
  RAISE NOTICE '  Setores: % / Esperado: 12', sectors_count;
  RAISE NOTICE '  Nichos: % / Esperado: 120', niches_count;
  
  IF sectors_count < 12 THEN
    RAISE WARNING '⚠️ Setores faltando! Execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
  ELSE
    RAISE NOTICE '  ✅ Setores OK';
  END IF;
  
  IF niches_count < 120 THEN
    RAISE WARNING '⚠️ Nichos faltando! Execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
  ELSE
    RAISE NOTICE '  ✅ Nichos OK';
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================
  -- VERIFICAR FUNÇÕES RPC
  -- ========================================
  RAISE NOTICE 'FUNÇÕES RPC:';
  
  FOREACH funcao IN ARRAY ARRAY['get_user_tenant', 'get_sectors_niches', 'get_sectors_niches_json', 'log_api_call']
  LOOP
    IF NOT EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = funcao
    ) THEN
      funcoes_faltando := array_append(funcoes_faltando, funcao);
      RAISE WARNING '  ❌ Função faltando: %', funcao;
    ELSE
      RAISE NOTICE '  ✅ Função existe: %', funcao;
    END IF;
  END LOOP;
  
  SELECT COUNT(*) INTO rpc_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant', 'get_sectors_niches', 'get_sectors_niches_json', 'log_api_call');
  
  RAISE NOTICE '  Total: % / Esperado: 4', rpc_count;
  RAISE NOTICE '';
  
  -- ========================================
  -- VERIFICAR TABELAS PRINCIPAIS
  -- ========================================
  RAISE NOTICE 'TABELAS PRINCIPAIS:';
  
  FOREACH tabela IN ARRAY ARRAY[
    'companies', 'icp_analysis_results', 'stc_verification_history',
    'decision_makers', 'digital_presence', 'governance_signals',
    'sdr_deals', 'suggested_companies', 'sectors', 'niches',
    'discarded_companies', 'leads_pool', 'leads_qualified',
    'similar_companies', 'simple_totvs_checks', 'totvs_usage_detection',
    'insights', 'sdr_notifications', 'filter_presets',
    'product_catalog', 'tenant_products', 'tenant_competitor_configs',
    'tenant_search_configs', 'sector_configs', 'icp_profile',
    'api_call_logs'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = tabela
    ) THEN
      tabelas_faltando := array_append(tabelas_faltando, tabela);
      RAISE WARNING '  ❌ Tabela faltando: %', tabela;
    ELSE
      RAISE NOTICE '  ✅ Tabela existe: %', tabela;
    END IF;
  END LOOP;
  
  SELECT COUNT(*) INTO tabelas_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'icp_analysis_results', 'stc_verification_history',
    'decision_makers', 'digital_presence', 'governance_signals',
    'sdr_deals', 'suggested_companies', 'sectors', 'niches'
  );
  
  RAISE NOTICE '  Tabelas principais: % / Esperado: 10+', tabelas_count;
  RAISE NOTICE '';
  
  -- ========================================
  -- VERIFICAR RLS E PERMISSÕES
  -- ========================================
  RAISE NOTICE 'RLS E PERMISSÕES:';
  
  -- Verificar se sectors e niches têm apenas SELECT
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sectors') THEN
    IF EXISTS (
      SELECT FROM information_schema.table_privileges
      WHERE table_schema = 'public'
      AND table_name = 'sectors'
      AND grantee IN ('authenticated', 'anon')
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    ) THEN
      RAISE WARNING '  ⚠️ Tabela sectors tem permissões excessivas!';
    ELSE
      RAISE NOTICE '  ✅ Permissões de sectors OK';
    END IF;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'niches') THEN
    IF EXISTS (
      SELECT FROM information_schema.table_privileges
      WHERE table_schema = 'public'
      AND table_name = 'niches'
      AND grantee IN ('authenticated', 'anon')
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    ) THEN
      RAISE WARNING '  ⚠️ Tabela niches tem permissões excessivas!';
    ELSE
      RAISE NOTICE '  ✅ Permissões de niches OK';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  
  -- ========================================
  -- RESUMO FINAL
  -- ========================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: % / Esperado: 12', sectors_count;
  RAISE NOTICE 'Nichos: % / Esperado: 120', niches_count;
  RAISE NOTICE 'Funções RPC: % / Esperado: 4', rpc_count;
  RAISE NOTICE 'Tabelas principais: % / Esperado: 10+', tabelas_count;
  RAISE NOTICE '';
  
  IF array_length(tabelas_faltando, 1) > 0 THEN
    RAISE WARNING 'TABELAS FALTANDO (%):', array_length(tabelas_faltando, 1);
    FOREACH tabela IN ARRAY tabelas_faltando
    LOOP
      RAISE WARNING '  - %', tabela;
    END LOOP;
  END IF;
  
  IF array_length(funcoes_faltando, 1) > 0 THEN
    RAISE WARNING 'FUNÇÕES RPC FALTANDO (%):', array_length(funcoes_faltando, 1);
    FOREACH funcao IN ARRAY funcoes_faltando
    LOOP
      RAISE WARNING '  - %', funcao;
    END LOOP;
  END IF;
  
  IF sectors_count >= 12 
     AND niches_count >= 120 
     AND rpc_count >= 4 
     AND tabelas_count >= 10
     AND array_length(tabelas_faltando, 1) = 0
     AND array_length(funcoes_faltando, 1) = 0 THEN
    RAISE NOTICE '🎉 TUDO CRIADO COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Aguarde 30 segundos para PostgREST processar';
    RAISE NOTICE '2. Recarregue o frontend (Ctrl+Shift+R)';
    RAISE NOTICE '3. Verifique o console do navegador';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS COISAS AINDA FALTAM';
    IF sectors_count < 12 OR niches_count < 120 THEN
      RAISE NOTICE '';
      RAISE NOTICE 'Execute: SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
    END IF;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- Mostrar estrutura das tabelas críticas
SELECT 
  'ESTRUTURA TABELAS' as verificacao,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('sectors', 'niches', 'companies', 'icp_analysis_results', 'stc_verification_history')
ORDER BY table_name, ordinal_position
LIMIT 50;

