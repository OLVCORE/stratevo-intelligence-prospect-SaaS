-- ============================================================================
-- FORÇAR RELOAD COMPLETO DO POSTGREST
-- ============================================================================
-- Este script verifica se tudo existe e força o PostgREST a recarregar
-- ============================================================================

-- ========================================
-- FASE 1: VERIFICAR SE TUDO EXISTE
-- ========================================
DO $$
DECLARE
  sectors_exists BOOLEAN;
  niches_exists BOOLEAN;
  rpc_exists BOOLEAN;
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO INICIAL';
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
  
  -- Verificar função RPC
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
  ) INTO rpc_exists;
  
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
  
  RAISE NOTICE 'Tabela sectors existe: %', sectors_exists;
  RAISE NOTICE 'Tabela niches existe: %', niches_exists;
  RAISE NOTICE 'Função RPC existe: %', rpc_exists;
  RAISE NOTICE 'Setores: %', sectors_count;
  RAISE NOTICE 'Nichos: %', niches_count;
  
  IF NOT sectors_exists OR NOT niches_exists OR sectors_count = 0 OR niches_count = 0 THEN
    RAISE WARNING '⚠️ TABELAS OU DADOS FALTANDO! Execute CRIAR_SETORES_NICHOS_URGENTE.sql primeiro!';
    RETURN;
  END IF;
  
  IF NOT rpc_exists THEN
    RAISE WARNING '⚠️ FUNÇÃO RPC FALTANDO!';
  END IF;
  
  RAISE NOTICE '✅ Tudo existe no banco de dados';
END $$;

-- ========================================
-- FASE 2: VERIFICAR PERMISSÕES
-- ========================================
DO $$
BEGIN
  -- Garantir que sectors e niches têm SELECT para anon e authenticated
  GRANT SELECT ON public.sectors TO authenticated, anon;
  GRANT SELECT ON public.niches TO authenticated, anon;
  
  -- Garantir que funções RPC têm EXECUTE
  GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated, anon;
  GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO authenticated, anon;
  
  RAISE NOTICE '✅ Permissões garantidas';
END $$;

-- ========================================
-- FASE 3: FORÇAR RELOAD POSTGREST (MÚLTIPLOS MÉTODOS)
-- ========================================

-- Método 1: NOTIFY
NOTIFY pgrst, 'reload schema';

-- Método 2: Alterar comentários (usando DO block)
DO $$
DECLARE
  ts text := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON TABLE public.sectors IS %L;$f$, 'Catálogo de setores - Reload: ' || ts);
  EXECUTE format($f$COMMENT ON TABLE public.niches IS %L;$f$, 'Catálogo de nichos - Reload: ' || ts);
  
  -- Comentar função também
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches() IS %L;$f$, 'Retorna setores e nichos - Reload: ' || ts);
  EXECUTE format($f$COMMENT ON FUNCTION public.get_sectors_niches_json() IS %L;$f$, 'Retorna setores e nichos JSON - Reload: ' || ts);
END $$;

-- Método 3: Criar uma view temporária e dropar (força refresh)
CREATE OR REPLACE VIEW public._pgrst_reload_helper AS
SELECT 
  'reload' as action,
  NOW() as timestamp;

DROP VIEW IF EXISTS public._pgrst_reload_helper;

-- Método 4: Fazer uma query simples nas tabelas (força cache refresh)
DO $$
BEGIN
  PERFORM 1 FROM public.sectors LIMIT 1;
  PERFORM 1 FROM public.niches LIMIT 1;
  PERFORM public.get_sectors_niches() LIMIT 1;
END $$;

-- ========================================
-- FASE 4: VERIFICAR SCHEMA PUBLIC ESTÁ EXPOSTO
-- ========================================
DO $$
DECLARE
  public_schema_oid INTEGER;
BEGIN
  SELECT oid INTO public_schema_oid
  FROM pg_namespace
  WHERE nspname = 'public';
  
  IF public_schema_oid IS NULL THEN
    RAISE WARNING '⚠️ Schema public não encontrado!';
  ELSE
    RAISE NOTICE '✅ Schema public existe (OID: %)', public_schema_oid;
  END IF;
END $$;

-- ========================================
-- FASE 5: VALIDAÇÃO FINAL
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
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores no banco: %', sectors_count;
  RAISE NOTICE 'Nichos no banco: %', niches_count;
  RAISE NOTICE 'Funções RPC: %', rpc_count;
  RAISE NOTICE '';
  
  IF sectors_count > 0 AND niches_count > 0 AND rpc_count >= 2 THEN
    RAISE NOTICE '✅ TUDO ESTÁ NO BANCO DE DADOS!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ SE AINDA NÃO FUNCIONAR NO FRONTEND:';
    RAISE NOTICE '1. Vá para Supabase Dashboard → Settings → API';
    RAISE NOTICE '2. Verifique se "Exposed schemas" inclui "public"';
    RAISE NOTICE '3. Se não incluir, adicione "public" e salve';
    RAISE NOTICE '4. Vá para Settings → General → Restart Project';
    RAISE NOTICE '5. Aguarde 2-3 minutos';
    RAISE NOTICE '6. Recarregue o frontend (Ctrl+Shift+R)';
  ELSE
    RAISE WARNING '❌ ALGO ESTÁ FALTANDO NO BANCO!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- Mostrar estrutura das tabelas para debug
SELECT 
  'DEBUG' as tipo,
  'sectors' as tabela,
  COUNT(*) as registros
FROM public.sectors
UNION ALL
SELECT 
  'DEBUG' as tipo,
  'niches' as tabela,
  COUNT(*) as registros
FROM public.niches;

