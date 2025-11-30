-- ============================================================================
-- RECRIAR FUNÇÃO RPC COM TODAS AS CONFIGURAÇÕES CORRETAS
-- ============================================================================
-- Execute este script para garantir que a função RPC está criada corretamente
-- ============================================================================

-- 1. DROPAR função se existir (para recriar do zero)
DROP FUNCTION IF EXISTS public.get_sectors_niches();

-- 2. CRIAR função com todas as configurações corretas
CREATE OR REPLACE FUNCTION public.get_sectors_niches()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verificar se tabelas existem antes de consultar
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sectors') THEN
    RAISE EXCEPTION 'Tabela public.sectors não existe';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'niches') THEN
    RAISE EXCEPTION 'Tabela public.niches não existe';
  END IF;
  
  -- Construir resultado JSONB
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

-- 3. GARANTIR PERMISSÕES EXPLÍCITAS
-- Revogar todas as permissões primeiro
REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM anon;

-- Conceder EXECUTE para authenticated e anon
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon;

-- 4. TESTAR A FUNÇÃO
DO $$
DECLARE
  test_result JSONB;
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  -- Executar função
  SELECT public.get_sectors_niches() INTO test_result;
  
  -- Verificar resultado
  IF test_result IS NULL THEN
    RAISE EXCEPTION 'Função retornou NULL';
  END IF;
  
  -- Contar setores e nichos
  sectors_count := jsonb_array_length(test_result->'sectors');
  niches_count := jsonb_array_length(test_result->'niches');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FUNÇÃO RPC RECRIADA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores retornados: %', sectors_count;
  RAISE NOTICE 'Nichos retornados: %', niches_count;
  RAISE NOTICE '========================================';
  
  IF sectors_count = 0 OR niches_count = 0 THEN
    RAISE WARNING '⚠️ Função funciona mas retornou dados vazios. Verifique se as tabelas têm dados.';
  END IF;
END $$;

-- 5. VERIFICAR PERMISSÕES FINAIS
SELECT 
  'PERMISSÕES FINAIS' as verificacao,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'get_sectors_niches'
ORDER BY grantee, privilege_type;

-- 6. FORÇAR RELOAD DO POSTGREST
NOTIFY pgrst, 'reload schema';

-- 7. CRIAR VIEW TEMPORÁRIA PARA FORÇAR RELOAD
CREATE OR REPLACE VIEW public._force_rpc_reload AS
SELECT 
  'get_sectors_niches' as function_name,
  (SELECT COUNT(*) FROM public.sectors) as sectors_count,
  (SELECT COUNT(*) FROM public.niches) as niches_count;

GRANT SELECT ON public._force_rpc_reload TO authenticated, anon;

