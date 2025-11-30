-- ============================================================================
-- VALIDAÇÃO RÁPIDA: Antes e Depois do Restart
-- ============================================================================
-- Execute este script ANTES e DEPOIS de reiniciar o projeto
-- ============================================================================

-- ========================================
-- 1. VERIFICAR DADOS NO BANCO
-- ========================================
SELECT 
  '📊 DADOS NO BANCO' as verificacao,
  (SELECT COUNT(*) FROM public.sectors) as total_setores,
  (SELECT COUNT(*) FROM public.niches) as total_nichos,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.sectors) >= 12 
      AND (SELECT COUNT(*) FROM public.niches) >= 120 
    THEN '✅ OK'
    ELSE '❌ FALTANDO DADOS - Execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql'
  END as status;

-- ========================================
-- 2. VERIFICAR TABELAS E RLS
-- ========================================
SELECT 
  '🔒 RLS E POLÍTICAS' as verificacao,
  t.tablename,
  CASE WHEN c.relrowsecurity THEN '✅ RLS habilitado' ELSE '❌ RLS desabilitado' END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as total_policies
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('sectors', 'niches')
ORDER BY t.tablename;

-- ========================================
-- 3. VERIFICAR FUNÇÃO RPC
-- ========================================
SELECT 
  '🔧 FUNÇÃO RPC' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'get_sectors_niches'
    ) THEN '✅ Função existe'
    ELSE '❌ Função não existe'
  END as status;

-- ========================================
-- 4. TESTAR FUNÇÃO RPC (se existir)
-- ========================================
DO $$
DECLARE
  rpc_exists BOOLEAN;
  rpc_result JSONB;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
  ) INTO rpc_exists;
  
  IF rpc_exists THEN
    SELECT public.get_sectors_niches() INTO rpc_result;
    RAISE NOTICE '✅ Função RPC executada com sucesso';
    RAISE NOTICE '   Setores retornados: %', jsonb_array_length(rpc_result->'sectors');
    RAISE NOTICE '   Nichos retornados: %', jsonb_array_length(rpc_result->'niches');
  ELSE
    RAISE WARNING '❌ Função RPC não existe';
  END IF;
END $$;

-- ========================================
-- 5. VERIFICAR PERMISSÕES
-- ========================================
SELECT 
  '🔐 PERMISSÕES' as verificacao,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('sectors', 'niches')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- ========================================
-- 6. RESUMO FINAL
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_exists BOOLEAN;
  rls_sectors BOOLEAN;
  rls_niches BOOLEAN;
  policies_sectors INTEGER;
  policies_niches INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
  ) INTO rpc_exists;
  
  SELECT relrowsecurity INTO rls_sectors
  FROM pg_class WHERE relname = 'sectors' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  SELECT relrowsecurity INTO rls_niches
  FROM pg_class WHERE relname = 'niches' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  SELECT COUNT(*) INTO policies_sectors 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'sectors';
  
  SELECT COUNT(*) INTO policies_niches 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'niches';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 RESUMO DA VALIDAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: % / Esperado: 12', sectors_count;
  RAISE NOTICE 'Nichos: % / Esperado: 120', niches_count;
  RAISE NOTICE 'Função RPC: %', CASE WHEN rpc_exists THEN '✅ Existe' ELSE '❌ Não existe' END;
  RAISE NOTICE 'RLS sectors: %', CASE WHEN rls_sectors THEN '✅ Habilitado' ELSE '❌ Desabilitado' END;
  RAISE NOTICE 'RLS niches: %', CASE WHEN rls_niches THEN '✅ Habilitado' ELSE '❌ Desabilitado' END;
  RAISE NOTICE 'Políticas sectors: %', policies_sectors;
  RAISE NOTICE 'Políticas niches: %', policies_niches;
  RAISE NOTICE '========================================';
  
  IF sectors_count >= 12 
    AND niches_count >= 120 
    AND rpc_exists 
    AND rls_sectors 
    AND rls_niches 
    AND policies_sectors > 0 
    AND policies_niches > 0 THEN
    RAISE NOTICE '✅ TUDO CONFIGURADO CORRETAMENTE NO BANCO!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PRÓXIMO PASSO CRÍTICO:';
    RAISE NOTICE '   1. Vá em Settings → General → Restart Project';
    RAISE NOTICE '   2. Aguarde 2-3 minutos';
    RAISE NOTICE '   3. Execute este script novamente para confirmar';
    RAISE NOTICE '   4. Recarregue o frontend (Ctrl+Shift+R)';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS CONFIGURAÇÕES ESTÃO FALTANDO';
    IF sectors_count < 12 OR niches_count < 120 THEN
      RAISE WARNING '   → Execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
    END IF;
    IF NOT rpc_exists THEN
      RAISE WARNING '   → Função RPC não existe - execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
    END IF;
    IF NOT rls_sectors OR NOT rls_niches THEN
      RAISE WARNING '   → RLS não habilitado - execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
    END IF;
    IF policies_sectors = 0 OR policies_niches = 0 THEN
      RAISE WARNING '   → Políticas RLS faltando - execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql';
    END IF;
  END IF;
END $$;
