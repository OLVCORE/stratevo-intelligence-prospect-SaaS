-- =====================================================
-- SCRIPT SQL COMPLETO - VERIFICAÇÃO E CORREÇÃO DE DADOS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- 
-- ⚠️ Este script verifica e documenta TODOS os dados das 6 etapas do onboarding
-- que devem estar disponíveis para os relatórios ICP
-- 
-- ⚠️ IMPORTANTE: Todas as tabelas são MULTITENANT
-- =====================================================

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS CRÍTICAS
-- =====================================================

-- Verificar se a tabela onboarding_sessions existe e tem as colunas corretas
SELECT 
  '📋 ESTRUTURA onboarding_sessions' as secao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'onboarding_sessions'
  AND column_name IN (
    'step1_data',
    'step2_data',
    'step3_data',
    'step4_data',
    'step5_data',
    'step6_data',
    'tenant_id',
    'updated_at'
  )
ORDER BY column_name;

-- Verificar se a tabela icp_reports existe e tem as colunas de markdown
SELECT 
  '📋 ESTRUTURA icp_reports' as secao,
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
    'report_type',
    'icp_profile_metadata_id',
    'tenant_id'
  )
ORDER BY column_name;

-- =====================================================
-- 2. VERIFICAR DADOS DAS 6 ETAPAS DO ONBOARDING
-- =====================================================

-- Função auxiliar para contar registros de forma segura
-- Remover função antiga se existir (com assinatura diferente)
DROP FUNCTION IF EXISTS safe_count(TEXT, UUID);

-- Criar nova função com parâmetros renomeados
CREATE OR REPLACE FUNCTION safe_count(p_table_name TEXT, p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
  v_sql_query TEXT;
  v_table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) INTO v_table_exists;
  
  IF NOT v_table_exists THEN
    RETURN 'Tabela não existe';
  END IF;
  
  -- Construir e executar query dinâmica
  v_sql_query := format('SELECT COUNT(*)::text FROM %I WHERE tenant_id = $1', p_table_name);
  EXECUTE v_sql_query INTO v_result USING p_tenant_id;
  
  RETURN COALESCE(v_result, '0');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Erro: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ⚠️ SUBSTITUA 'SEU_TENANT_ID_AQUI' pelo seu tenant_id real
-- Exemplo: '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
DO $$
DECLARE
  tenant_id_test UUID := 'SEU_TENANT_ID_AQUI'::uuid; -- ⚠️ SUBSTITUA AQUI
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'VERIFICAÇÃO DE DADOS DAS 6 ETAPAS DO ONBOARDING';
  RAISE NOTICE 'Tenant ID: %', tenant_id_test;
  RAISE NOTICE '====================================================';
END $$;

-- Verificar dados do Step 1 (Dados Básicos) - Sessão mais recente
WITH latest_session AS (
  SELECT *
  FROM onboarding_sessions
  WHERE tenant_id = 'SEU_TENANT_ID_AQUI'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY updated_at DESC
  LIMIT 1
)
SELECT 
  '📊 STEP 1 - DADOS BÁSICOS' as secao,
  1 as total_sessoes,
  (latest_session.step1_data IS NOT NULL)::int as com_step1,
  (latest_session.step1_data->'concorrentesDiretos' IS NOT NULL)::int as com_concorrentes_step1,
  (latest_session.step1_data->'clientesAtuais' IS NOT NULL)::int as com_clientes_step1,
  COALESCE(jsonb_array_length(latest_session.step1_data->'concorrentesDiretos'), 0) as total_concorrentes_step1,
  COALESCE(jsonb_array_length(latest_session.step1_data->'clientesAtuais'), 0) as total_clientes_step1
FROM latest_session;

-- Verificar dados do Step 2 (Setores e Nichos) - Sessão mais recente
WITH latest_session AS (
  SELECT *
  FROM onboarding_sessions
  WHERE tenant_id = 'SEU_TENANT_ID_AQUI'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY updated_at DESC
  LIMIT 1
)
SELECT 
  '📊 STEP 2 - SETORES E NICHOS' as secao,
  1 as total_sessoes,
  (latest_session.step2_data IS NOT NULL)::int as com_step2,
  COALESCE(jsonb_array_length(latest_session.step2_data->'setoresAlvo'), 0) as total_setores,
  COALESCE(jsonb_array_length(latest_session.step2_data->'nichosAlvo'), 0) as total_nichos,
  COALESCE(jsonb_array_length(latest_session.step2_data->'cnaesAlvo'), 0) as total_cnaes
FROM latest_session;

-- Verificar dados do Step 3 (Perfil Cliente Ideal) - Sessão mais recente
WITH latest_session AS (
  SELECT *
  FROM onboarding_sessions
  WHERE tenant_id = 'SEU_TENANT_ID_AQUI'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY updated_at DESC
  LIMIT 1
)
SELECT 
  '📊 STEP 3 - PERFIL CLIENTE IDEAL' as secao,
  1 as total_sessoes,
  (latest_session.step3_data IS NOT NULL)::int as com_step3,
  COALESCE(jsonb_array_length(latest_session.step3_data->'porteAlvo'), 0) as total_portes,
  COALESCE(jsonb_array_length(latest_session.step3_data->'caracteristicasEspeciais'), 0) as total_caracteristicas,
  latest_session.step3_data->'localizacaoAlvo' as localizacao_alvo,
  latest_session.step3_data->'faturamentoAlvo' as faturamento_alvo,
  latest_session.step3_data->'funcionariosAlvo' as funcionarios_alvo
FROM latest_session;

-- Verificar dados do Step 4 (Situação Atual) - 🔥 MAIS IMPORTANTE - Sessão mais recente
WITH latest_session AS (
  SELECT *
  FROM onboarding_sessions
  WHERE tenant_id = 'SEU_TENANT_ID_AQUI'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY updated_at DESC
  LIMIT 1
)
SELECT 
  '📊 STEP 4 - SITUAÇÃO ATUAL (CRÍTICO)' as secao,
  1 as total_sessoes,
  (latest_session.step4_data IS NOT NULL)::int as com_step4,
  COALESCE(jsonb_array_length(latest_session.step4_data->'diferenciais'), 0) as total_diferenciais,
  COALESCE(jsonb_array_length(latest_session.step4_data->'casosDeUso'), 0) as total_casos_uso,
  COALESCE(jsonb_array_length(latest_session.step4_data->'ticketsECiclos'), 0) as total_tickets_ciclos,
  COALESCE(jsonb_array_length(latest_session.step4_data->'concorrentesDiretos'), 0) as total_concorrentes_step4,
  latest_session.step4_data->'categoriaSolucao' as categoria_solucao,
  latest_session.step4_data->'ticketMedio' as ticket_medio,
  latest_session.step4_data->'cicloVendaMedia' as ciclo_venda_media
FROM latest_session;

-- Verificar dados do Step 5 (Histórico e Enriquecimento) - Sessão mais recente
WITH latest_session AS (
  SELECT *
  FROM onboarding_sessions
  WHERE tenant_id = 'SEU_TENANT_ID_AQUI'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY updated_at DESC
  LIMIT 1
)
SELECT 
  '📊 STEP 5 - HISTÓRICO E ENRIQUECIMENTO' as secao,
  1 as total_sessoes,
  (latest_session.step5_data IS NOT NULL)::int as com_step5,
  COALESCE(jsonb_array_length(latest_session.step5_data->'clientesAtuais'), 0) as total_clientes_step5,
  COALESCE(jsonb_array_length(latest_session.step5_data->'empresasBenchmarking'), 0) as total_benchmarking
FROM latest_session;

-- =====================================================
-- 3. VERIFICAR DADOS DE INTELIGÊNCIA INTERNA
-- =====================================================

-- Verificar concorrentes cadastrados
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '🔍 CONCORRENTES CADASTRADOS' as secao,
  safe_count('competitive_analysis', params.tenant_id) as analises_competitivas,
  (SELECT COUNT(*) FROM tenant_competitor_products WHERE tenant_id = params.tenant_id) as produtos_concorrentes
FROM params;

-- Verificar produtos do tenant
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '📦 PRODUTOS DO TENANT' as secao,
  (SELECT COUNT(*) FROM tenant_products WHERE tenant_id = params.tenant_id) as total_produtos,
  (SELECT COUNT(DISTINCT COALESCE(categoria, category)) FROM tenant_products WHERE tenant_id = params.tenant_id) as categorias_diferentes
FROM params;

-- Verificar produtos dos concorrentes
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '📦 PRODUTOS DOS CONCORRENTES' as secao,
  (SELECT COUNT(*) FROM tenant_competitor_products WHERE tenant_id = params.tenant_id) as total_produtos,
  (SELECT COUNT(DISTINCT competitor_name) FROM tenant_competitor_products WHERE tenant_id = params.tenant_id) as concorrentes_diferentes,
  (SELECT COUNT(DISTINCT categoria) FROM tenant_competitor_products WHERE tenant_id = params.tenant_id) as categorias_diferentes
FROM params;

-- Verificar análises SWOT
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '📊 ANÁLISE SWOT' as secao,
  safe_count('icp_competitive_swot', params.tenant_id) as total_swot
FROM params;

-- Verificar matriz BCG
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '📊 MATRIZ BCG' as secao,
  safe_count('icp_bcg_matrix', params.tenant_id) as total_matrizes
FROM params;

-- Verificar market insights
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '📊 MARKET INSIGHTS' as secao,
  safe_count('icp_market_insights', params.tenant_id) as total_insights
FROM params;

-- =====================================================
-- 4. VERIFICAR RELATÓRIOS GERADOS
-- =====================================================

-- Verificar relatórios com markdown completo
WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '📄 RELATÓRIOS GERADOS' as secao,
  (SELECT COUNT(*) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id) as total_relatorios,
  (SELECT COUNT(*) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id AND ir.full_report_markdown IS NOT NULL AND length(ir.full_report_markdown) > 100) as com_full_markdown,
  (SELECT COUNT(*) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id AND ir.executive_summary_markdown IS NOT NULL AND length(ir.executive_summary_markdown) > 100) as com_summary_markdown,
  (SELECT COUNT(*) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id AND ir.status = 'completed') as completos,
  (SELECT COUNT(*) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id AND ir.status = 'generating') as em_geracao,
  (SELECT COUNT(*) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id AND ir.status = 'failed') as falhados,
  (SELECT MAX(ir.generated_at) FROM icp_reports ir WHERE ir.tenant_id = params.tenant_id) as ultimo_relatorio
FROM params;

-- =====================================================
-- 5. RESUMO FINAL COMPLETO
-- =====================================================

WITH params AS (
  SELECT 'SEU_TENANT_ID_AQUI'::uuid AS tenant_id -- ⚠️ SUBSTITUA AQUI
)
SELECT 
  '✅ RESUMO FINAL - DADOS DISPONÍVEIS' as secao,
  (SELECT COUNT(*) FROM onboarding_sessions WHERE tenant_id = params.tenant_id)::text as sessoes_onboarding,
  (SELECT COUNT(*) FILTER (WHERE step1_data IS NOT NULL) FROM onboarding_sessions WHERE tenant_id = params.tenant_id)::text as com_step1,
  (SELECT COUNT(*) FILTER (WHERE step2_data IS NOT NULL) FROM onboarding_sessions WHERE tenant_id = params.tenant_id)::text as com_step2,
  (SELECT COUNT(*) FILTER (WHERE step3_data IS NOT NULL) FROM onboarding_sessions WHERE tenant_id = params.tenant_id)::text as com_step3,
  (SELECT COUNT(*) FILTER (WHERE step4_data IS NOT NULL) FROM onboarding_sessions WHERE tenant_id = params.tenant_id)::text as com_step4,
  (SELECT COUNT(*) FILTER (WHERE step5_data IS NOT NULL) FROM onboarding_sessions WHERE tenant_id = params.tenant_id)::text as com_step5,
  (SELECT COUNT(*) FROM tenant_products WHERE tenant_id = params.tenant_id)::text as produtos_tenant,
  (SELECT COUNT(*) FROM tenant_competitor_products WHERE tenant_id = params.tenant_id)::text as produtos_concorrentes,
  safe_count('competitive_analysis', params.tenant_id) as analises_competitivas,
  safe_count('icp_competitive_swot', params.tenant_id) as swot_produtos,
  safe_count('icp_bcg_matrix', params.tenant_id) as matrizes_bcg,
  safe_count('icp_market_insights', params.tenant_id) as market_insights,
  (SELECT COUNT(*) FROM icp_reports WHERE tenant_id = params.tenant_id)::text as relatorios_gerados
FROM params;

-- =====================================================
-- 6. EXEMPLO DE QUERY PARA VER DADOS COMPLETOS DE UMA SESSÃO
-- =====================================================

-- Descomente e execute para ver TODOS os dados de uma sessão específica
/*
SELECT 
  id,
  tenant_id,
  updated_at,
  -- Step 1
  step1_data->'razaoSocial' as razao_social,
  jsonb_array_length(step1_data->'concorrentesDiretos') as concorrentes_step1,
  jsonb_array_length(step1_data->'clientesAtuais') as clientes_step1,
  -- Step 2
  jsonb_array_length(step2_data->'setoresAlvo') as setores_alvo,
  jsonb_array_length(step2_data->'nichosAlvo') as nichos_alvo,
  -- Step 3
  jsonb_array_length(step3_data->'porteAlvo') as portes_alvo,
  step3_data->'localizacaoAlvo' as localizacao_alvo,
  -- Step 4
  jsonb_array_length(step4_data->'diferenciais') as diferenciais,
  jsonb_array_length(step4_data->'casosDeUso') as casos_uso,
  jsonb_array_length(step4_data->'concorrentesDiretos') as concorrentes_step4,
  -- Step 5
  jsonb_array_length(step5_data->'clientesAtuais') as clientes_step5,
  jsonb_array_length(step5_data->'empresasBenchmarking') as benchmarking
FROM onboarding_sessions
WHERE tenant_id = 'SEU_TENANT_ID_AQUI'::uuid -- ⚠️ SUBSTITUA AQUI
ORDER BY updated_at DESC
LIMIT 1;
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Substitua TODAS as ocorrências de 'SEU_TENANT_ID_AQUI' pelo seu tenant_id real
-- 2. Execute o script completo no Supabase SQL Editor
-- 3. Verifique os resultados de cada seção
-- 4. Se algum dado estiver faltando, complete o onboarding nas etapas correspondentes
-- 
-- =====================================================

