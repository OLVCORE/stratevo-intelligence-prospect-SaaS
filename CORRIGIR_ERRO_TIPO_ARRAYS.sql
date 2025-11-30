-- ============================================================================
-- CORRIGIR ERRO DE TIPO: Arrays (text[]) precisam ser convertidos para JSONB
-- ============================================================================
-- Erro: COALESCE types text[] and jsonb cannot be matched
-- Solução: Usar to_jsonb() para converter arrays antes do COALESCE
-- ============================================================================

-- ========================================
-- RECRIAR FUNÇÃO get_sectors_niches_json COM CORREÇÃO DE TIPO
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
          'description', description
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
          'description', description,
          -- ✅ CORREÇÃO: Converter arrays para JSONB antes do COALESCE
          'keywords', COALESCE(to_jsonb(keywords), '[]'::jsonb),
          'cnaes', COALESCE(to_jsonb(cnaes), '[]'::jsonb),
          'ncms', COALESCE(to_jsonb(ncms), '[]'::jsonb)
        ) ORDER BY niche_name
      ) 
       FROM public.niches),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches_json() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO anon, authenticated;

-- ========================================
-- TESTAR FUNÇÃO CORRIGIDA
-- ========================================
DO $$
DECLARE
  test_result JSONB;
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTANDO FUNÇÃO CORRIGIDA';
  RAISE NOTICE '========================================';
  
  BEGIN
    SELECT public.get_sectors_niches_json() INTO test_result;
    
    IF test_result IS NULL THEN
      RAISE WARNING '❌ Função retornou NULL';
    ELSE
      sectors_count := jsonb_array_length(COALESCE(test_result->'sectors', '[]'::jsonb));
      niches_count := jsonb_array_length(COALESCE(test_result->'niches', '[]'::jsonb));
      
      RAISE NOTICE '✅ Função executada com sucesso!';
      RAISE NOTICE '   Setores: %', sectors_count;
      RAISE NOTICE '   Nichos: %', niches_count;
      
      IF sectors_count > 0 THEN
        RAISE NOTICE '   Primeiro setor: %', test_result->'sectors'->0->>'sector_name';
      END IF;
      
      IF niches_count > 0 THEN
        RAISE NOTICE '   Primeiro nicho: %', test_result->'niches'->0->>'niche_name';
        -- Verificar se arrays foram convertidos corretamente
        IF test_result->'niches'->0->'keywords' IS NOT NULL THEN
          RAISE NOTICE '   ✅ Campo keywords convertido corretamente';
        END IF;
        IF test_result->'niches'->0->'cnaes' IS NOT NULL THEN
          RAISE NOTICE '   ✅ Campo cnaes convertido corretamente';
        END IF;
        IF test_result->'niches'->0->'ncms' IS NOT NULL THEN
          RAISE NOTICE '   ✅ Campo ncms convertido corretamente';
        END IF;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao executar função: %', SQLERRM;
    RAISE WARNING '   Código do erro: %', SQLSTATE;
  END;
END $$;

-- ========================================
-- FORÇAR RELOAD POSTGREST
-- ========================================
NOTIFY pgrst, 'reload schema';

DO $$
DECLARE
  ts text := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches_json() IS %L;$f$, 'RPC JSON corrigido - ' || ts);
END $$;

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ERRO DE TIPO CORRIGIDO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Aguarde 30-60 segundos';
  RAISE NOTICE '2. Teste a função novamente: SELECT public.get_sectors_niches_json();';
  RAISE NOTICE '3. Se funcionar, recarregue frontend (Ctrl+Shift+R)';
  RAISE NOTICE '4. Verifique console do navegador para logs detalhados';
  RAISE NOTICE '========================================';
END $$;

