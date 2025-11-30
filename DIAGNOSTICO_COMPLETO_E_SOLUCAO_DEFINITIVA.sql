-- ============================================================================
-- DIAGNÓSTICO COMPLETO E SOLUÇÃO DEFINITIVA
-- ============================================================================
-- Este script faz uma análise completa e cria TODAS as soluções possíveis
-- ============================================================================

-- ========================================
-- FASE 1: VERIFICAR TUDO QUE EXISTE
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_json_exists BOOLEAN;
  rpc_table_exists BOOLEAN;
  sectors_rls_enabled BOOLEAN;
  niches_rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 1: DIAGNÓSTICO COMPLETO';
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
  
  -- Verificar RLS
  SELECT relrowsecurity INTO sectors_rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'sectors';
  
  SELECT relrowsecurity INTO niches_rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'niches';
  
  RAISE NOTICE 'DADOS:';
  RAISE NOTICE '  Setores: %', sectors_count;
  RAISE NOTICE '  Nichos: %', niches_count;
  RAISE NOTICE '';
  RAISE NOTICE 'FUNÇÕES RPC:';
  RAISE NOTICE '  get_sectors_niches_json: %', CASE WHEN rpc_json_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  get_sectors_niches: %', CASE WHEN rpc_table_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';
  RAISE NOTICE 'RLS:';
  RAISE NOTICE '  sectors: %', CASE WHEN sectors_rls_enabled THEN 'ATIVADO' ELSE 'DESATIVADO' END;
  RAISE NOTICE '  niches: %', CASE WHEN niches_rls_enabled THEN 'ATIVADO' ELSE 'DESATIVADO' END;
  
  IF sectors_count = 0 OR niches_count = 0 THEN
    RAISE WARNING '⚠️ TABELAS VAZIAS! Execute CRIAR_SETORES_NICHOS_URGENTE.sql primeiro!';
  END IF;
  
  IF NOT rpc_json_exists OR NOT rpc_table_exists THEN
    RAISE WARNING '⚠️ FUNÇÕES RPC NÃO EXISTEM!';
  END IF;
END $$;

-- ========================================
-- FASE 2: DESABILITAR RLS TEMPORARIAMENTE (SE NECESSÁRIO)
-- ========================================
-- RLS pode estar bloqueando acesso mesmo com permissões
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 2: VERIFICANDO RLS E POLÍTICAS';
  RAISE NOTICE '========================================';
  
  -- Verificar se há políticas RLS
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors') THEN
    RAISE NOTICE '✅ Políticas RLS existem para sectors';
  ELSE
    RAISE NOTICE '⚠️ Nenhuma política RLS para sectors';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches') THEN
    RAISE NOTICE '✅ Políticas RLS existem para niches';
  ELSE
    RAISE NOTICE '⚠️ Nenhuma política RLS para niches';
  END IF;
END $$;

-- Criar políticas RLS permissivas se não existirem
DO $$
BEGIN
  -- Política para sectors: permitir SELECT para todos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'sectors' 
    AND policyname = 'allow_select_all'
  ) THEN
    CREATE POLICY allow_select_all ON public.sectors
    FOR SELECT
    TO authenticated, anon
    USING (true);
    RAISE NOTICE '✅ Política RLS criada para sectors';
  END IF;
  
  -- Política para niches: permitir SELECT para todos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'niches' 
    AND policyname = 'allow_select_all'
  ) THEN
    CREATE POLICY allow_select_all ON public.niches
    FOR SELECT
    TO authenticated, anon
    USING (true);
    RAISE NOTICE '✅ Política RLS criada para niches';
  END IF;
END $$;

-- ========================================
-- FASE 3: RECRIAR FUNÇÃO RPC COM TODAS AS CORREÇÕES
-- ========================================
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
      (SELECT jsonb_agg(
        jsonb_build_object(
          'sector_code', sector_code,
          'sector_name', sector_name,
          'description', COALESCE(description, '')
        ) ORDER BY sector_name
      ) 
       FROM public.sectors),
      '[]'::jsonb
    ),
    'niches', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'niche_code', niche_code,
          'niche_name', niche_name,
          'sector_code', sector_code,
          'description', COALESCE(description, ''),
          'keywords', COALESCE(to_jsonb(keywords), '[]'::jsonb),
          'cnaes', COALESCE(to_jsonb(cnaes), '[]'::jsonb),
          'ncms', COALESCE(to_jsonb(ncms), '[]'::jsonb)
        ) ORDER BY niche_name
      ) 
       FROM public.niches),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{"sectors":[],"niches":[]}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches_json() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO anon;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO service_role;

-- ========================================
-- FASE 4: GARANTIR PERMISSÕES DIRETAS NAS TABELAS
-- ========================================
-- Revogar tudo primeiro
REVOKE ALL ON TABLE public.sectors FROM anon, authenticated;
REVOKE ALL ON TABLE public.niches FROM anon, authenticated;

-- Conceder SELECT explicitamente
GRANT SELECT ON TABLE public.sectors TO anon;
GRANT SELECT ON TABLE public.sectors TO authenticated;
GRANT SELECT ON TABLE public.niches TO anon;
GRANT SELECT ON TABLE public.niches TO authenticated;

-- ========================================
-- FASE 5: TESTAR FUNÇÃO DIRETAMENTE
-- ========================================
DO $$
DECLARE
  test_result JSONB;
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 5: TESTE DIRETO DA FUNÇÃO';
  RAISE NOTICE '========================================';
  
  BEGIN
    SELECT public.get_sectors_niches_json() INTO test_result;
    
    IF test_result IS NULL THEN
      RAISE WARNING '❌ Função retornou NULL';
    ELSE
      sectors_count := jsonb_array_length(COALESCE(test_result->'sectors', '[]'::jsonb));
      niches_count := jsonb_array_length(COALESCE(test_result->'niches', '[]'::jsonb));
      
      RAISE NOTICE '✅ Função executada com sucesso!';
      RAISE NOTICE '   Setores retornados: %', sectors_count;
      RAISE NOTICE '   Nichos retornados: %', niches_count;
      
      IF sectors_count > 0 THEN
        RAISE NOTICE '   Primeiro setor: %', test_result->'sectors'->0->>'sector_name';
      END IF;
      
      IF niches_count > 0 THEN
        RAISE NOTICE '   Primeiro nicho: %', test_result->'niches'->0->>'niche_name';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao executar função: %', SQLERRM;
  END;
END $$;

-- ========================================
-- FASE 6: FORÇAR RELOAD POSTGREST MÚLTIPLAS VEZES
-- ========================================
DO $$
DECLARE
  i INTEGER;
  ts text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 6: FORÇANDO RELOAD POSTGREST';
  RAISE NOTICE '========================================';
  
  ts := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
  
  -- Múltiplos NOTIFY
  FOR i IN 1..5 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    RAISE NOTICE '  NOTIFY % executado', i;
  END LOOP;
  
  -- Atualizar comentários múltiplas vezes
  FOR i IN 1..3 LOOP
    EXECUTE format($f$COMMENT ON TABLE public.sectors IS %L;$f$, 'Reload ' || i || ' - ' || ts);
    EXECUTE format($f$COMMENT ON TABLE public.niches IS %L;$f$, 'Reload ' || i || ' - ' || ts);
    EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches_json() IS %L;$f$, 'Reload ' || i || ' - ' || ts);
    RAISE NOTICE '  Comentários atualizados (iteração %)', i;
  END LOOP;
END $$;

-- ========================================
-- FASE 7: INSTRUÇÕES FINAIS
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CONFIGURAÇÃO COMPLETA FINALIZADA!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'AÇÕES NECESSÁRIAS:';
  RAISE NOTICE '1. REINICIE o projeto Supabase (Settings → General → Restart)';
  RAISE NOTICE '2. Aguarde 3-5 minutos após restart';
  RAISE NOTICE '3. Teste a URL diretamente no navegador:';
  RAISE NOTICE '   https://SEU_PROJECT_ID.supabase.co/rest/v1/rpc/get_sectors_niches_json';
  RAISE NOTICE '4. Se retornar JSON com sectors/niches, o problema é no frontend';
  RAISE NOTICE '5. Se retornar 404, PostgREST ainda não vê a função (aguarde mais)';
  RAISE NOTICE '';
  RAISE NOTICE 'ALTERNATIVA: O frontend tem fallback para query direta';
  RAISE NOTICE 'Se RPC não funcionar, ele tentará:';
  RAISE NOTICE '  supabase.from("sectors").select("*")';
  RAISE NOTICE '  supabase.from("niches").select("*")';
  RAISE NOTICE '========================================';
END $$;

