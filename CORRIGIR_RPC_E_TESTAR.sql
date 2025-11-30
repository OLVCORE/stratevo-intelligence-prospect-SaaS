-- ============================================================================
-- CORRIGIR RPC E TESTAR - Garantir que funções retornam dados corretos
-- ============================================================================

-- ========================================
-- VERIFICAR DADOS NAS TABELAS
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO INICIAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: %', sectors_count;
  RAISE NOTICE 'Nichos: %', niches_count;
  
  IF sectors_count = 0 OR niches_count = 0 THEN
    RAISE WARNING '⚠️ TABELAS VAZIAS! Execute CRIAR_SETORES_NICHOS_URGENTE.sql primeiro!';
    RETURN;
  END IF;
END $$;

-- ========================================
-- RECRIAR FUNÇÃO get_sectors_niches_json COM CAMPOS CORRETOS
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
-- RECRIAR FUNÇÃO get_sectors_niches (TABLE) COM CAMPOS CORRETOS
-- ========================================
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
    s.sector_code::text,
    s.sector_name::text,
    s.description::text,
    n.niche_code::text,
    n.niche_name::text,
    n.description::text as niche_description,
    COALESCE(n.keywords, ARRAY[]::TEXT[]) as keywords,
    COALESCE(n.cnaes, ARRAY[]::TEXT[]) as cnaes,
    COALESCE(n.ncms, ARRAY[]::TEXT[]) as ncms
  FROM public.sectors s
  LEFT JOIN public.niches n ON n.sector_code = s.sector_code
  ORDER BY s.sector_name, n.niche_name;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon, authenticated;

-- ========================================
-- TESTAR FUNÇÕES E MOSTRAR RESULTADOS
-- ========================================
DO $$
DECLARE
  json_result JSONB;
  sectors_count INTEGER;
  niches_count INTEGER;
  table_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTANDO FUNÇÕES RPC';
  RAISE NOTICE '========================================';
  
  -- Testar JSON
  BEGIN
    SELECT public.get_sectors_niches_json() INTO json_result;
    
    IF json_result IS NULL THEN
      RAISE WARNING '❌ get_sectors_niches_json() retornou NULL';
    ELSE
      sectors_count := jsonb_array_length(COALESCE(json_result->'sectors', '[]'::jsonb));
      niches_count := jsonb_array_length(COALESCE(json_result->'niches', '[]'::jsonb));
      
      RAISE NOTICE '✅ get_sectors_niches_json() funciona';
      RAISE NOTICE '   Setores: %', sectors_count;
      RAISE NOTICE '   Nichos: %', niches_count;
      
      IF sectors_count > 0 THEN
        RAISE NOTICE '   Primeiro setor: %', json_result->'sectors'->0->>'sector_name';
      END IF;
      
      IF niches_count > 0 THEN
        RAISE NOTICE '   Primeiro nicho: %', json_result->'niches'->0->>'niche_name';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ get_sectors_niches_json() falhou: %', SQLERRM;
  END;
  
  -- Testar TABLE
  BEGIN
    SELECT COUNT(*) INTO table_count FROM public.get_sectors_niches();
    RAISE NOTICE '';
    RAISE NOTICE '✅ get_sectors_niches() funciona';
    RAISE NOTICE '   Linhas retornadas: %', table_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ get_sectors_niches() falhou: %', SQLERRM;
  END;
END $$;

-- ========================================
-- MOSTRAR ESTRUTURA DOS DADOS RETORNADOS
-- ========================================
-- Mostrar JSON completo (primeiros itens)
SELECT 
  'RESULTADO JSON' as tipo,
  jsonb_pretty(
    jsonb_build_object(
      'sectors', (
        SELECT jsonb_agg(s ORDER BY sector_name) 
        FROM (
          SELECT sector_code, sector_name, description 
          FROM public.sectors 
          LIMIT 3
        ) s
      ),
      'niches', (
        SELECT jsonb_agg(n ORDER BY niche_name) 
        FROM (
          SELECT niche_code, niche_name, sector_code, description 
          FROM public.niches 
          LIMIT 3
        ) n
      )
    )
  ) as dados;

-- Mostrar primeiras linhas da função TABLE
SELECT 
  'RESULTADO TABLE' as tipo,
  sector_code,
  sector_name,
  niche_code,
  niche_name
FROM public.get_sectors_niches()
LIMIT 10;

-- ========================================
-- FORÇAR RELOAD POSTGREST
-- ========================================
NOTIFY pgrst, 'reload schema';

DO $$
DECLARE
  ts text := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches_json() IS %L;$f$, 'RPC JSON - ' || ts);
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches() IS %L;$f$, 'RPC TABLE - ' || ts);
END $$;

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FUNÇÕES RPC CORRIGIDAS E TESTADAS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Aguarde 30-60 segundos';
  RAISE NOTICE '2. Recarregue frontend (Ctrl+Shift+R)';
  RAISE NOTICE '3. Verifique console - deve mostrar dados carregados';
  RAISE NOTICE '';
  RAISE NOTICE 'Se ainda não funcionar:';
  RAISE NOTICE '- Verifique se projeto Supabase foi reiniciado';
  RAISE NOTICE '- Verifique Settings → API → Exposed schemas inclui "public"';
  RAISE NOTICE '========================================';
END $$;

