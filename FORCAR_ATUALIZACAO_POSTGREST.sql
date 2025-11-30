-- ============================================================================
-- FORÇAR ATUALIZAÇÃO DO POSTGREST SCHEMA CACHE
-- ============================================================================
-- Este script força o PostgREST a atualizar seu schema cache
-- Execute APÓS executar SOLUCAO_DEFINITIVA_SETORES_NICHOS.sql
-- ============================================================================

-- ========================================
-- MÉTODO 1: NOTIFY pgrst (método oficial)
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- MÉTODO 2: Criar/Alterar uma view temporária
-- ========================================
-- Criar uma view temporária força o PostgREST a recarregar o schema
CREATE OR REPLACE VIEW public._postgrest_schema_reload AS
SELECT 
  'sectors' as table_name,
  COUNT(*) as record_count
FROM public.sectors
UNION ALL
SELECT 
  'niches' as table_name,
  COUNT(*) as record_count
FROM public.niches;

-- Garantir permissões na view
GRANT SELECT ON public._postgrest_schema_reload TO authenticated;
GRANT SELECT ON public._postgrest_schema_reload TO anon;

-- ========================================
-- MÉTODO 3: Alterar comentário de uma tabela existente
-- ========================================
-- Alterar comentários força recarregamento do schema
DO $$
DECLARE
  ts text := to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format(
    'COMMENT ON TABLE public.sectors IS %L',
    'Catálogo de setores - Atualizado: ' || ts
  );
  EXECUTE format(
    'COMMENT ON TABLE public.niches IS %L',
    'Catálogo de nichos - Atualizado: ' || ts
  );
END $$;

-- ========================================
-- MÉTODO 4: Criar função dummy e dropar
-- ========================================
-- Criar e dropar uma função força recarregamento
CREATE OR REPLACE FUNCTION public._force_postgrest_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1;
END;
$$;

DROP FUNCTION IF EXISTS public._force_postgrest_reload();

-- ========================================
-- MÉTODO 5: Verificar e garantir publicação
-- ========================================
-- Verificar se tabelas estão no schema public (devem estar)
SELECT 
  'VERIFICAÇÃO FINAL' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sectors')
      AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'niches')
    THEN '✅ Tabelas existem no schema public'
    ELSE '❌ Tabelas NÃO existem no schema public'
  END as tabelas,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_sectors_niches')
    THEN '✅ Função RPC existe'
    ELSE '❌ Função RPC NÃO existe'
  END as rpc_function;

-- ========================================
-- INSTRUÇÕES FINAIS
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AÇÕES REALIZADAS:';
  RAISE NOTICE '1. NOTIFY pgrst executado';
  RAISE NOTICE '2. View temporária criada';
  RAISE NOTICE '3. Comentários atualizados';
  RAISE NOTICE '4. Função dummy criada e removida';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Aguardar 30-60 segundos';
  RAISE NOTICE '2. Se ainda não funcionar, REINICIAR PROJETO no Dashboard';
  RAISE NOTICE '   Settings → General → Restart Project';
  RAISE NOTICE '3. Recarregar página do frontend';
  RAISE NOTICE '========================================';
END $$;

