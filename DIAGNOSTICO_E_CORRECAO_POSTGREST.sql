-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA PARA POSTGREST RECONHECER TABELAS
-- ============================================================================
-- Execute este script e depois REINICIE o projeto Supabase
-- ============================================================================

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO
-- ============================================================================

SELECT '=== DIAGNÓSTICO INICIAL ===' as etapa;

-- 1.1. Verificar se as tabelas existem e têm dados
SELECT 
    '1.1 - Verificação de tabelas' as item,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.sectors) > 0 AND (SELECT COUNT(*) FROM public.niches) > 0 
        THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as status;

-- 1.2. Verificar RLS
SELECT 
    '1.2 - RLS Habilitado' as item,
    (SELECT relforcerowsecurity FROM pg_class WHERE relname = 'sectors' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as sectors_rls,
    (SELECT relforcerowsecurity FROM pg_class WHERE relname = 'niches' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as niches_rls;

-- 1.3. Verificar políticas existentes
SELECT 
    '1.3 - Políticas' as item,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors') as policies_sectors,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches') as policies_niches;

-- 1.4. Verificar GRANTs
SELECT 
    '1.4 - GRANTs' as item,
    EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE table_schema = 'public' 
        AND table_name = 'sectors' 
        AND privilege_type = 'SELECT'
        AND grantee IN ('authenticated', 'anon')
    ) as sectors_grants,
    EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE table_schema = 'public' 
        AND table_name = 'niches' 
        AND privilege_type = 'SELECT'
        AND grantee IN ('authenticated', 'anon')
    ) as niches_grants;

-- 1.5. Verificar schema public exposto (PostgREST)
SELECT 
    '1.5 - Schema Public' as item,
    EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'public'
    ) as schema_exists;

-- ============================================================================
-- PARTE 2: CORREÇÃO FORÇADA
-- ============================================================================

SELECT '=== APLICANDO CORREÇÕES ===' as etapa;

-- 2.1. Habilitar RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- 2.2. Remover TODAS as políticas antigas
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover políticas de sectors
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sectors', r.policyname);
    END LOOP;
    
    -- Remover políticas de niches
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.niches', r.policyname);
    END LOOP;
    
    RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- 2.3. Criar políticas PERMISSIVAS (somente SELECT)
CREATE POLICY "sectors_read_all"
ON public.sectors
FOR SELECT
TO authenticated, anon, service_role
USING (true);

CREATE POLICY "niches_read_all"
ON public.niches
FOR SELECT
TO authenticated, anon, service_role
USING (true);

-- 2.4. Garantir GRANTs explícitos
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT SELECT ON public.sectors TO authenticated, anon, service_role;
GRANT SELECT ON public.niches TO authenticated, anon, service_role;

-- 2.5. Garantir que as colunas específicas usadas no frontend estão acessíveis
GRANT SELECT (sector_code, sector_name, description) ON public.sectors TO authenticated, anon, service_role;
GRANT SELECT (niche_code, niche_name, sector_code, description, keywords, cnaes, ncms) ON public.niches TO authenticated, anon, service_role;

-- 2.6. Forçar reload do PostgREST (múltiplas vezes)
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..5 LOOP
        PERFORM pg_notify('pgrst', 'reload schema');
        PERFORM pg_sleep(0.5);
    END LOOP;
    RAISE NOTICE '✅ Notificações de reload enviadas (5x)';
END $$;

-- 2.7. Atualizar comentários (invalida cache)
DO $do$
DECLARE
  ts text := to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format('COMMENT ON TABLE public.sectors IS %L;', 'Setores B2B - ' || ts);
  EXECUTE format('COMMENT ON TABLE public.niches IS %L;', 'Nichos B2B - ' || ts);
  EXECUTE format('COMMENT ON SCHEMA public IS %L;', 'Schema público - ' || ts);
END
$do$;

-- 2.8. Forçar atualização de estatísticas
ANALYZE public.sectors;
ANALYZE public.niches;

-- ============================================================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================================================

SELECT '=== VERIFICAÇÃO FINAL ===' as etapa;

-- 3.1. Teste de acesso direto (simula o frontend)
SELECT 
    '3.1 - Teste de SELECT' as item,
    (SELECT COUNT(*) FROM public.sectors LIMIT 10) as sectors_select_test,
    (SELECT COUNT(*) FROM public.niches LIMIT 10) as niches_select_test,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.sectors) > 0 
        THEN '✅ OK'
        ELSE '❌ ERRO'
    END as status;

-- 3.2. Verificar políticas criadas
SELECT 
    '3.2 - Políticas Ativas' as item,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('sectors', 'niches')
ORDER BY tablename, policyname;

-- 3.3. Resumo final
SELECT 
    '✅ RESUMO FINAL' as status,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors') as policies_sectors,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches') as policies_niches;

-- 3.4. Mensagem de instrução
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ CORREÇÕES APLICADAS COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ OBRIGATÓRIO: REINICIE O PROJETO SUPABASE AGORA:';
    RAISE NOTICE '   1. Dashboard → Settings → General → Restart Project';
    RAISE NOTICE '   2. Aguarde 2-3 minutos até voltar online';
    RAISE NOTICE '   3. Recarregue o frontend com Ctrl+Shift+R';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ TAMBÉM VERIFIQUE (IMPORTANTE):';
    RAISE NOTICE '   - Settings → API → Exposed schemas → deve incluir "public"';
    RAISE NOTICE '   - Settings → API → API Settings → Max Rows → deve ser ≥ 1000';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ TESTE A URL DIRETAMENTE:';
    RAISE NOTICE '   GET {SUPABASE_URL}/rest/v1/sectors?select=*';
    RAISE NOTICE '   GET {SUPABASE_URL}/rest/v1/niches?select=*';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

