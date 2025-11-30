-- ============================================================================
-- VERIFICAÇÃO COMPLETA DO POSTGREST - DIAGNÓSTICO PROFUNDO
-- ============================================================================
-- Execute este script para verificar TODOS os aspectos do acesso PostgREST
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICAÇÃO DE ESTRUTURA
-- ============================================================================

SELECT '=== 1. ESTRUTURA DAS TABELAS ===' as secao;

-- 1.1. Verificar se as tabelas existem
SELECT 
    '1.1 - Existência das tabelas' as item,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sectors') as sectors_existe,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'niches') as niches_existe;

-- 1.2. Verificar estrutura das colunas
SELECT 
    '1.2 - Colunas de sectors' as item,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sectors'
ORDER BY ordinal_position;

SELECT 
    '1.2 - Colunas de niches' as item,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'niches'
ORDER BY ordinal_position;

-- 1.3. Verificar dados
SELECT 
    '1.3 - Dados nas tabelas' as item,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    (SELECT COUNT(DISTINCT sector_code) FROM public.niches) as setores_com_nichos;

-- ============================================================================
-- PARTE 2: VERIFICAÇÃO DE RLS E POLÍTICAS
-- ============================================================================

SELECT '=== 2. RLS E POLÍTICAS ===' as secao;

-- 2.1. Verificar se RLS está habilitado
SELECT 
    '2.1 - RLS Habilitado' as item,
    relforcerowsecurity as sectors_rls
FROM pg_class 
WHERE relname = 'sectors' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
UNION ALL
SELECT 
    '2.1 - RLS Habilitado' as item,
    relforcerowsecurity as niches_rls
FROM pg_class 
WHERE relname = 'niches' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2.2. Listar TODAS as políticas
SELECT 
    '2.2 - Políticas Existentes' as item,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('sectors', 'niches')
ORDER BY tablename, policyname;

-- 2.3. Verificar roles
SELECT 
    '2.3 - Roles do Sistema' as item,
    rolname,
    rolsuper,
    rolcreaterole,
    rolcanlogin
FROM pg_roles
WHERE rolname IN ('authenticated', 'anon', 'service_role', 'postgres')
ORDER BY rolname;

-- ============================================================================
-- PARTE 3: VERIFICAÇÃO DE PERMISSÕES (GRANTs)
-- ============================================================================

SELECT '=== 3. PERMISSÕES (GRANTs) ===' as secao;

-- 3.1. Verificar GRANTs no schema
SELECT 
    '3.1 - GRANTs no Schema Public' as item,
    grantee,
    privilege_type
FROM information_schema.usage_privileges
WHERE object_schema = 'public' AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

-- 3.2. Verificar GRANTs nas tabelas
SELECT 
    '3.2 - GRANTs nas Tabelas' as item,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name IN ('sectors', 'niches')
AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 3.3. Verificar GRANTs nas colunas específicas
SELECT 
    '3.3 - GRANTs nas Colunas' as item,
    table_name,
    column_name,
    grantee,
    privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' 
AND table_name IN ('sectors', 'niches')
AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, column_name, grantee;

-- ============================================================================
-- PARTE 4: TESTE DE ACESSO SIMULANDO O FRONTEND
-- ============================================================================

SELECT '=== 4. TESTE DE ACESSO (Simulando Frontend) ===' as secao;

-- 4.1. Teste como role authenticated (simula usuário logado)
SET ROLE authenticated;
SELECT 
    '4.1 - Teste como authenticated' as item,
    COUNT(*) as setores_acessaveis,
    (SELECT COUNT(*) FROM public.niches LIMIT 10) as nichos_acessaveis
FROM public.sectors LIMIT 10;
RESET ROLE;

-- 4.2. Teste como role anon (simula usuário não logado)
SET ROLE anon;
SELECT 
    '4.2 - Teste como anon' as item,
    COUNT(*) as setores_acessaveis,
    (SELECT COUNT(*) FROM public.niches LIMIT 10) as nichos_acessaveis
FROM public.sectors LIMIT 10;
RESET ROLE;

-- ============================================================================
-- PARTE 5: VERIFICAÇÃO DE CONFIGURAÇÕES POSTGREST
-- ============================================================================

SELECT '=== 5. CONFIGURAÇÕES POSTGREST ===' as secao;

-- 5.1. Verificar configurações de schema exposto (se acessível)
SELECT 
    '5.1 - Schemas Disponíveis' as item,
    nspname as schema_name,
    nspowner::regrole as owner
FROM pg_namespace
WHERE nspname IN ('public', 'pg_catalog', 'information_schema')
ORDER BY nspname;

-- 5.2. Verificar extensões relacionadas
SELECT 
    '5.2 - Extensões Instaladas' as item,
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('postgrest', 'pgjwt')
ORDER BY extname;

-- ============================================================================
-- PARTE 6: VERIFICAÇÃO DE DADOS ESPECÍFICOS
-- ============================================================================

SELECT '=== 6. VERIFICAÇÃO DE DADOS ===' as secao;

-- 6.1. Mostrar amostra de setores
SELECT 
    '6.1 - Amostra de Setores' as item,
    sector_code,
    sector_name,
    LEFT(description, 50) as descricao_resumida
FROM public.sectors
ORDER BY sector_name
LIMIT 5;

-- 6.2. Mostrar amostra de nichos
SELECT 
    '6.2 - Amostra de Nichos' as item,
    niche_code,
    niche_name,
    sector_code,
    LEFT(description, 50) as descricao_resumida
FROM public.niches
ORDER BY niche_name
LIMIT 5;

-- 6.3. Nichos por setor (estatísticas)
SELECT 
    '6.3 - Nichos por Setor' as item,
    n.sector_code,
    s.sector_name,
    COUNT(*) as total_nichos
FROM public.niches n
LEFT JOIN public.sectors s ON n.sector_code = s.sector_code
GROUP BY n.sector_code, s.sector_name
ORDER BY total_nichos DESC
LIMIT 10;

-- ============================================================================
-- PARTE 7: DIAGNÓSTICO DE PROBLEMAS COMUNS
-- ============================================================================

SELECT '=== 7. DIAGNÓSTICO DE PROBLEMAS ===' as secao;

-- 7.1. Verificar se há setores sem nichos
SELECT 
    '7.1 - Setores Sem Nichos' as item,
    s.sector_code,
    s.sector_name
FROM public.sectors s
LEFT JOIN public.niches n ON s.sector_code = n.sector_code
WHERE n.sector_code IS NULL;

-- 7.2. Verificar se há nichos órfãos (sem setor correspondente)
SELECT 
    '7.2 - Nichos Órfãos' as item,
    n.niche_code,
    n.niche_name,
    n.sector_code
FROM public.niches n
LEFT JOIN public.sectors s ON n.sector_code = s.sector_code
WHERE s.sector_code IS NULL
LIMIT 10;

-- 7.3. Verificar duplicatas
SELECT 
    '7.3 - Nichos Duplicados' as item,
    sector_code,
    niche_code,
    COUNT(*) as quantidade
FROM public.niches
GROUP BY sector_code, niche_code
HAVING COUNT(*) > 1;

-- ============================================================================
-- PARTE 8: RESUMO FINAL E RECOMENDAÇÕES
-- ============================================================================

SELECT '=== 8. RESUMO FINAL ===' as secao;

SELECT 
    'RESUMO' as tipo,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors') as policies_sectors,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches') as policies_niches,
    EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE table_schema = 'public' 
        AND table_name = 'sectors' 
        AND privilege_type = 'SELECT'
        AND grantee IN ('authenticated', 'anon')
    ) as sectors_accessible,
    EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE table_schema = 'public' 
        AND table_name = 'niches' 
        AND privilege_type = 'SELECT'
        AND grantee IN ('authenticated', 'anon')
    ) as niches_accessible;

-- Mensagem final
DO $$
DECLARE
    total_setores INTEGER;
    total_nichos INTEGER;
    policies_sectors INTEGER;
    policies_niches INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_setores FROM public.sectors;
    SELECT COUNT(*) INTO total_nichos FROM public.niches;
    SELECT COUNT(*) INTO policies_sectors FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors';
    SELECT COUNT(*) INTO policies_niches FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches';
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '📊 RESUMO DO DIAGNÓSTICO:';
    RAISE NOTICE '   - Setores: % | Nichos: %', total_setores, total_nichos;
    RAISE NOTICE '   - Políticas RLS (sectors): % | (niches): %', policies_sectors, policies_niches;
    RAISE NOTICE '';
    
    IF total_setores = 0 OR total_nichos = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: Tabelas vazias ou não existem!';
        RAISE NOTICE '   Execute: ADICIONAR_NICHOS_COMPLETO_B2B.sql';
    END IF;
    
    IF policies_sectors = 0 OR policies_niches = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: Falta políticas RLS!';
        RAISE NOTICE '   Execute: DIAGNOSTICO_E_CORRECAO_POSTGREST.sql';
    END IF;
    
    RAISE NOTICE '⚠️ PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Se tudo estiver OK acima, REINICIE o projeto Supabase';
    RAISE NOTICE '   2. Verifique: Dashboard → Settings → API → Exposed schemas → "public"';
    RAISE NOTICE '   3. Teste a URL: {SUPABASE_URL}/rest/v1/sectors?select=*';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

