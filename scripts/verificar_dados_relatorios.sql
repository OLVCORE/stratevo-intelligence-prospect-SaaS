-- =====================================================
-- SCRIPT DE VERIFICAÇÃO COMPLETA - DADOS PARA RELATÓRIOS
-- =====================================================
-- ⚠️ Tenant de TESTE (troque se necessário)
--    8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71
-- ⚠️ Todas as tabelas são MULTITENANT
-- ⚠️ Execute a migration 20250206000002_create_missing_report_tables.sql
--     para criar: competitive_analysis, icp_competitive_swot, icp_bcg_matrix, icp_market_insights
-- =====================================================

-- 0. Funções auxiliares para contagem segura
CREATE OR REPLACE FUNCTION safe_count(table_name TEXT, tenant_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  sql_query TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = safe_count.table_name
  ) THEN
    RETURN 'Tabela não existe';
  END IF;

  sql_query := format('SELECT COUNT(*)::text FROM %I WHERE tenant_id = $1', safe_count.table_name);
  EXECUTE sql_query INTO result USING tenant_id_param;
  RETURN COALESCE(result, '0');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Erro: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION safe_count_where(
  table_name TEXT,
  where_sql TEXT,
  tenant_id_param UUID
) RETURNS TEXT AS $$
DECLARE
  result TEXT;
  sql_query TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = safe_count_where.table_name
  ) THEN
    RETURN 'Tabela não existe';
  END IF;

  -- table_name com %I (identificador) e where_sql injetado como texto controlado no script
  sql_query := format('SELECT COUNT(*)::text FROM %I WHERE tenant_id = $1 AND (%s)', table_name, where_sql);
  EXECUTE sql_query INTO result USING tenant_id_param;
  RETURN COALESCE(result, '0');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Erro: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- =====================================================
SELECT 
  '📊 VERIFICAÇÃO DE TABELAS' as secao,
  table_name,
  CASE WHEN table_name IN (
    'icp_reports',
    'icp_profiles_metadata',
    'tenants',
    'onboarding_sessions',
    'competitive_analysis',
    'tenant_products',
    'tenant_competitor_products',
    'companies',
    'icp_analysis_criteria',
    'icp_competitive_swot',
    'icp_bcg_matrix',
    'icp_market_insights'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'icp_reports',
    'icp_profiles_metadata',
    'tenants',
    'onboarding_sessions',
    'competitive_analysis',
    'tenant_products',
    'tenant_competitor_products',
    'companies',
    'icp_analysis_criteria',
    'icp_competitive_swot',
    'icp_bcg_matrix',
    'icp_market_insights'
  )
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR COLUNAS CRÍTICAS DE icp_reports
-- =====================================================
SELECT 
  '📋 COLUNAS DE icp_reports' as secao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'icp_reports'
  AND column_name IN (
    'full_report_markdown',
    'executive_summary_markdown',
    'report_data',
    'status',
    'report_type'
  )
ORDER BY column_name;

-- =====================================================
-- 3. VERIFICAR COLUNAS DE tenant_products
-- =====================================================
SELECT 
  '📦 COLUNAS DE tenant_products' as secao,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND column_name IN ('nome', 'product_name', 'categoria', 'category', 'descricao', 'description')
ORDER BY column_name;

-- =====================================================
-- 4. VERIFICAR DADOS REAIS - CONCORRENTES
-- =====================================================
SELECT 
  '🔍 CONCORRENTES NO ONBOARDING' as secao,
  'Step1' as fonte,
  jsonb_array_length(step1_data->'concorrentesDiretos') as total_concorrentes,
  step1_data->'concorrentesDiretos' as dados
FROM onboarding_sessions
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
  AND step1_data->'concorrentesDiretos' IS NOT NULL
  AND jsonb_array_length(step1_data->'concorrentesDiretos') > 0
ORDER BY updated_at DESC
LIMIT 1;

SELECT 
  '🔍 CONCORRENTES NO ONBOARDING' as secao,
  'Step4' as fonte,
  jsonb_array_length(step4_data->'concorrentesDiretos') as total_concorrentes,
  step4_data->'concorrentesDiretos' as dados
FROM onboarding_sessions
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
  AND step4_data->'concorrentesDiretos' IS NOT NULL
  AND jsonb_array_length(step4_data->'concorrentesDiretos') > 0
ORDER BY updated_at DESC
LIMIT 1;

-- =====================================================
-- 5. VERIFICAR DADOS REAIS - PRODUTOS
-- =====================================================
SELECT 
  '📦 PRODUTOS DO TENANT' as secao,
  COUNT(*) as total_produtos,
  COUNT(DISTINCT categoria) as categorias_diferentes,
  COUNT(DISTINCT COALESCE(nome, product_name)) as produtos_unicos
FROM tenant_products
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71';

SELECT 
  '📦 PRODUTOS DOS CONCORRENTES' as secao,
  COUNT(*) as total_produtos,
  COUNT(DISTINCT competitor_name) as concorrentes_diferentes,
  COUNT(DISTINCT categoria) as categorias_diferentes
FROM tenant_competitor_products
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71';

-- =====================================================
-- 6. VERIFICAR DADOS REAIS - CLIENTES E BENCHMARKING
-- =====================================================
SELECT 
  '👥 CLIENTES NO ONBOARDING' as secao,
  'Step1' as fonte,
  jsonb_array_length(step1_data->'clientesAtuais') as total_clientes
FROM onboarding_sessions
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
  AND step1_data->'clientesAtuais' IS NOT NULL
  AND jsonb_array_length(step1_data->'clientesAtuais') > 0
ORDER BY updated_at DESC
LIMIT 1;

SELECT 
  '👥 CLIENTES NO ONBOARDING' as secao,
  'Step5' as fonte,
  jsonb_array_length(step5_data->'clientesAtuais') as total_clientes
FROM onboarding_sessions
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
  AND step5_data->'clientesAtuais' IS NOT NULL
  AND jsonb_array_length(step5_data->'clientesAtuais') > 0
ORDER BY updated_at DESC
LIMIT 1;

SELECT 
  '🏆 BENCHMARKING NO ONBOARDING' as secao,
  'Step5' as fonte,
  jsonb_array_length(step5_data->'empresasBenchmarking') as total_benchmarking
FROM onboarding_sessions
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
  AND step5_data->'empresasBenchmarking' IS NOT NULL
  AND jsonb_array_length(step5_data->'empresasBenchmarking') > 0
ORDER BY updated_at DESC
LIMIT 1;

-- =====================================================
-- 7. VERIFICAR DADOS REAIS - DIFERENCIAIS
-- =====================================================
SELECT 
  '⭐ DIFERENCIAIS NO ONBOARDING' as secao,
  'Step4' as fonte,
  jsonb_array_length(step4_data->'diferenciais') as total_diferenciais,
  step4_data->'diferenciais' as dados
FROM onboarding_sessions
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
  AND step4_data->'diferenciais' IS NOT NULL
  AND jsonb_array_length(step4_data->'diferenciais') > 0
ORDER BY updated_at DESC
LIMIT 1;

-- =====================================================
-- 8. VERIFICAR ANÁLISES SALVAS (com verificação segura)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'competitive_analysis') THEN
    RAISE NOTICE '✅ Tabela competitive_analysis existe';
  ELSE
    RAISE NOTICE '⚠️ Tabela competitive_analysis NÃO existe - Execute a migration 20250206000002_create_missing_report_tables.sql';
  END IF;
END $$;

-- Usando safe_count e safe_count_where (evita erro de relação inexistente)
SELECT 
  '📊 ANÁLISE COMPETITIVA SALVA' as secao,
  safe_count('competitive_analysis', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid) as total_analises,
  safe_count_where(
    'competitive_analysis',
    'swot_analysis IS NOT NULL AND swot_analysis::text <> ''{}''',
    '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid
  ) as com_swot;

SELECT 
  '📊 SWOT BASEADA EM PRODUTOS' as secao,
  safe_count('icp_competitive_swot', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid) as total_swot,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_competitive_swot')
    THEN COALESCE((SELECT MAX(created_at)::text FROM icp_competitive_swot WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'), 'N/A')
    ELSE 'N/A'
  END as ultima_analise;

SELECT 
  '📊 MATRIZ BCG' as secao,
  safe_count('icp_bcg_matrix', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid) as total_matrizes,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_bcg_matrix')
    THEN COALESCE((SELECT MAX(created_at)::text FROM icp_bcg_matrix WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'), 'N/A')
    ELSE 'N/A'
  END as ultima_matriz;

SELECT 
  '📊 MARKET INSIGHTS' as secao,
  safe_count('icp_market_insights', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid) as total_insights,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_market_insights')
    THEN COALESCE((SELECT MAX(created_at)::text FROM icp_market_insights WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'), 'N/A')
    ELSE 'N/A'
  END as ultimo_insight;

-- =====================================================
-- 9. RESUMO FINAL (usando verificação segura)
-- =====================================================
SELECT 
  '✅ RESUMO FINAL' as secao,
  (SELECT COUNT(*) FROM tenant_products WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71')::text as produtos_tenant,
  (SELECT COUNT(*) FROM tenant_competitor_products WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71')::text as produtos_concorrentes,
  safe_count('competitive_analysis', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID) as analises_competitivas,
  safe_count('icp_competitive_swot', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID) as swot_produtos,
  safe_count('icp_bcg_matrix', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID) as matrizes_bcg,
  safe_count('icp_market_insights', '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID) as market_insights;
