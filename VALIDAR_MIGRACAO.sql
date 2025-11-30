-- ============================================================================
-- SCRIPT DE VALIDAÇÃO: Verificar se todas as tabelas foram criadas
-- ============================================================================
-- Execute este script após MIGRACOES_ESSENCIAIS_LIMPO.sql
-- ============================================================================

SET search_path = public;

-- ============================================================================
-- 1. LISTAR TODAS AS TABELAS CRIADAS
-- ============================================================================

SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. VERIFICAR TABELAS ESSENCIAIS ESPERADAS
-- ============================================================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN '✅'
        ELSE '❌'
    END as status,
    'tenants' as tabela
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN '✅' ELSE '❌' END,
    'users'
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN '✅' ELSE '❌' END,
    'companies'
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'decision_makers') THEN '✅' ELSE '❌' END,
    'decision_makers'
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_analysis_results') THEN '✅' ELSE '❌' END,
    'icp_analysis_results'
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sdr_deals') THEN '✅' ELSE '❌' END,
    'sdr_deals'
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stc_verification_history') THEN '✅' ELSE '❌' END,
    'stc_verification_history'
UNION ALL
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'onboarding_data') THEN '✅' ELSE '❌' END,
    'onboarding_data';

-- ============================================================================
-- 3. VERIFICAR COLUNA tenant_id EM companies
-- ============================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'companies' 
            AND column_name = 'tenant_id'
        ) THEN '✅ tenant_id existe em companies'
        ELSE '❌ tenant_id NÃO existe em companies'
    END as status;

-- ============================================================================
-- 4. VERIFICAR FUNÇÕES CRIADAS
-- ============================================================================

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- 5. VERIFICAR TRIGGERS CRIADOS
-- ============================================================================

SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgrelid IN (
    SELECT oid FROM pg_class 
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND relkind = 'r'
)
AND NOT tgisinternal
ORDER BY table_name, trigger_name;

-- ============================================================================
-- 6. VERIFICAR RLS HABILITADO
-- ============================================================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS Desabilitado'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 7. CONTAR POLICIES RLS POR TABELA
-- ============================================================================

SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 8. VERIFICAR ÍNDICES CRIADOS
-- ============================================================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tabelas,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_funcoes,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND relkind = 'r') AND NOT tgisinternal) as total_triggers,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indices;

