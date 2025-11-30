-- ============================================================================
-- SOLUÇÃO FINAL: Forçar tudo e preparar para RESTART
-- ============================================================================
-- Execute este script ANTES de fazer RESTART do projeto Supabase
-- ============================================================================

-- ========================================
-- VERIFICAR E GARANTIR QUE TUDO EXISTE
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  SELECT COUNT(*) INTO rpc_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_sectors_niches', 'get_sectors_niches_json');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO PRÉ-RESTART';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: %', sectors_count;
  RAISE NOTICE 'Nichos: %', niches_count;
  RAISE NOTICE 'Funções RPC: %', rpc_count;
  
  IF sectors_count = 0 OR niches_count = 0 THEN
    RAISE WARNING '⚠️ TABELAS VAZIAS! Execute CRIAR_SETORES_NICHOS_URGENTE.sql primeiro!';
    RETURN;
  END IF;
  
  IF rpc_count < 2 THEN
    RAISE WARNING '⚠️ FUNÇÕES RPC FALTANDO!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ TUDO PRONTO PARA RESTART!';
END $$;

-- ========================================
-- GARANTIR PERMISSÕES ABSOLUTAS
-- ========================================
-- Revogar tudo primeiro
REVOKE ALL ON public.sectors FROM authenticated, anon, PUBLIC;
REVOKE ALL ON public.niches FROM authenticated, anon, PUBLIC;
REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_sectors_niches_json() FROM PUBLIC;

-- Conceder apenas o necessário
GRANT SELECT ON public.sectors TO authenticated, anon;
GRANT SELECT ON public.niches TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO authenticated, anon;

-- ========================================
-- GARANTIR RLS ESTÁ HABILITADO
-- ========================================
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS sectors_read ON public.sectors;
DROP POLICY IF EXISTS niches_read ON public.niches;

-- Criar políticas novas
CREATE POLICY sectors_read ON public.sectors 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

CREATE POLICY niches_read ON public.niches 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- ========================================
-- FORÇAR RELOAD POSTGREST (MÚLTIPLOS MÉTODOS)
-- ========================================
NOTIFY pgrst, 'reload schema';

-- Atualizar comentários
DO $$
DECLARE
  ts text := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON TABLE public.sectors IS %L;$f$, 'Setores - ' || ts);
  EXECUTE format($f$COMMENT ON TABLE public.niches IS %L;$f$, 'Nichos - ' || ts);
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches() IS %L;$f$, 'RPC - ' || ts);
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches_json() IS %L;$f$, 'RPC JSON - ' || ts);
END $$;

-- ========================================
-- TESTAR FUNÇÕES DIRETAMENTE NO BANCO
-- ========================================
DO $$
DECLARE
  test_json JSONB;
  test_table_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'TESTANDO FUNÇÕES NO BANCO:';
  
  -- Testar JSON
  BEGIN
    SELECT public.get_sectors_niches_json() INTO test_json;
    RAISE NOTICE '  ✅ get_sectors_niches_json() funciona';
    RAISE NOTICE '     Setores: %', jsonb_array_length(test_json->'sectors');
    RAISE NOTICE '     Nichos: %', jsonb_array_length(test_json->'niches');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '  ❌ get_sectors_niches_json() falhou: %', SQLERRM;
  END;
  
  -- Testar TABLE
  BEGIN
    SELECT COUNT(*) INTO test_table_count FROM public.get_sectors_niches();
    RAISE NOTICE '  ✅ get_sectors_niches() funciona: % linhas', test_table_count;
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
  RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'AGORA FAÇA O RESTART DO PROJETO:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Vá para: Supabase Dashboard';
  RAISE NOTICE '2. Settings → General';
  RAISE NOTICE '3. Clique em "RESTART PROJECT"';
  RAISE NOTICE '4. Aguarde 2-3 minutos';
  RAISE NOTICE '';
  RAISE NOTICE 'DEPOIS DO RESTART:';
  RAISE NOTICE '1. Aguarde mais 30 segundos';
  RAISE NOTICE '2. Recarregue frontend (Ctrl+Shift+R)';
  RAISE NOTICE '3. Verifique console - não deve ter mais 404';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

