-- ============================================================================
-- VALIDAÇÃO FINAL: Verificar Dados e Acesso PostgREST
-- ============================================================================
-- Execute este script para verificar se tudo está funcionando
-- ============================================================================

-- ========================================
-- 1. VERIFICAR CONTAGEM DE DADOS
-- ========================================
SELECT 
  'DADOS INSERIDOS' as categoria,
  (SELECT COUNT(*) FROM public.sectors) as total_setores,
  (SELECT COUNT(*) FROM public.niches) as total_nichos,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.sectors) >= 12 THEN '✅ OK'
    ELSE '❌ FALTANDO SETORES'
  END as status_setores,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.niches) >= 120 THEN '✅ OK'
    ELSE '⚠️ FALTANDO NICHOS (esperado: 120)'
  END as status_nichos;

-- ========================================
-- 2. VERIFICAR RLS E POLÍTICAS
-- ========================================
SELECT 
  'RLS E POLÍTICAS' as categoria,
  t.tablename,
  c.relrowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policies_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('sectors', 'niches')
ORDER BY t.tablename;

-- ========================================
-- 3. VERIFICAR PERMISSÕES GRANT
-- ========================================
SELECT 
  'PERMISSÕES' as categoria,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('sectors', 'niches')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- ========================================
-- 4. TESTAR FUNÇÃO RPC DIRETAMENTE
-- ========================================
SELECT 
  'TESTE RPC' as categoria,
  public.get_sectors_niches() as resultado_json;

-- ========================================
-- 5. VERIFICAR SE POSTGREST CONSEGUE VER
-- ========================================
-- Nota: Não há forma direta de verificar o cache do PostgREST via SQL
-- Mas podemos verificar se as tabelas estão "publicadas" corretamente
SELECT 
  'PUBLICAÇÃO POSTGREST' as categoria,
  t.schemaname,
  t.tablename,
  CASE 
    WHEN c.relrowsecurity THEN 'RLS habilitado ✅'
    ELSE 'RLS desabilitado ❌'
  END as rls_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = t.tablename
    ) THEN 'Políticas configuradas ✅'
    ELSE 'Sem políticas ❌'
  END as policies_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('sectors', 'niches')
ORDER BY t.tablename;

-- ========================================
-- 6. FORÇAR RELOAD NOVAMENTE
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- 7. RESUMO FINAL
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_exists BOOLEAN;
  rls_sectors BOOLEAN;
  rls_niches BOOLEAN;
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
  FROM pg_class 
  WHERE relname = 'sectors' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  SELECT relrowsecurity INTO rls_niches
  FROM pg_class 
  WHERE relname = 'niches' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO FINAL:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: % / Esperado: 12', sectors_count;
  RAISE NOTICE 'Nichos: % / Esperado: 120', niches_count;
  RAISE NOTICE 'Função RPC: %', rpc_exists;
  RAISE NOTICE 'RLS sectors: %', rls_sectors;
  RAISE NOTICE 'RLS niches: %', rls_niches;
  RAISE NOTICE '========================================';
  
  IF sectors_count >= 12 AND niches_count >= 120 AND rpc_exists AND rls_sectors AND rls_niches THEN
    RAISE NOTICE '✅ TUDO CONFIGURADO CORRETAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Aguardar 1-2 minutos para PostgREST atualizar';
    RAISE NOTICE '2. OU reiniciar projeto (Settings → General → Restart)';
    RAISE NOTICE '3. Recarregar página do frontend (Ctrl+Shift+R)';
    RAISE NOTICE '4. Verificar console (F12)';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS VERIFICAÇÕES FALHARAM';
    IF sectors_count < 12 THEN
      RAISE WARNING 'Execute novamente SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql para inserir setores faltantes';
    END IF;
    IF niches_count < 120 THEN
      RAISE WARNING 'Execute novamente SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql para inserir nichos faltantes';
    END IF;
  END IF;
END $$;

