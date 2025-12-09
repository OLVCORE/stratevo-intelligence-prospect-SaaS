-- =====================================================
-- SCRIPT SQL COMPLETO - VERIFICAÇÃO DE DADOS (VERSÃO FINAL)
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- 
-- ⚠️ Este script verifica TODOS os dados das 6 etapas do onboarding
-- que devem estar disponíveis para os relatórios ICP
-- 
-- ⚠️ IMPORTANTE: Substitua o UUID do tenant abaixo pelo seu tenant_id real
-- =====================================================

-- =====================================================
-- CONFIGURAÇÃO: TENANT ID (SUBSTITUA AQUI)
-- =====================================================
-- ⚠️ SUBSTITUA 'e33e7d01-2c05-4040-9738-f19ef47d9acb' pelo seu tenant_id real
-- =====================================================

DO $$
DECLARE
  v_tenant uuid := 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid; -- ⚠️ SUBSTITUA AQUI
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'VERIFICAÇÃO DE DADOS DAS 6 ETAPAS DO ONBOARDING';
  RAISE NOTICE 'Tenant ID: %', v_tenant;
  RAISE NOTICE '====================================================';
END $$;

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS CRÍTICAS
-- =====================================================

-- onboarding_sessions: colunas esperadas
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

-- icp_reports: colunas esperadas
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
-- 2. FUNÇÃO AUXILIAR (CORRIGIDA - SEM AMBIGUIDADE)
-- =====================================================

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

-- =====================================================
-- 3. VERIFICAR DADOS DAS 6 ETAPAS (sessão mais recente)
-- =====================================================

-- STEP 1: Dados Básicos
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY s.updated_at DESC
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

-- STEP 2: Setores e Nichos
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY s.updated_at DESC
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

-- STEP 3: Perfil Cliente Ideal
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY s.updated_at DESC
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

-- STEP 4: Situação Atual (CRÍTICO)
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY s.updated_at DESC
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

-- STEP 5: Histórico e Enriquecimento
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY s.updated_at DESC
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
-- 4. VERIFICAR DADOS DE INTELIGÊNCIA INTERNA
-- =====================================================

-- Concorrentes cadastrados
WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '🔍 CONCORRENTES CADASTRADOS' as secao,
  safe_count('competitive_analysis', t.tenant_id) as analises_competitivas,
  (SELECT COUNT(*) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as produtos_concorrentes
FROM t;

-- Produtos do tenant
WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '📦 PRODUTOS DO TENANT' as secao,
  (SELECT COUNT(*) FROM public.tenant_products WHERE tenant_id = t.tenant_id) as total_produtos,
  (SELECT COUNT(DISTINCT COALESCE(categoria, category)) FROM public.tenant_products WHERE tenant_id = t.tenant_id) as categorias_diferentes
FROM t;

-- Produtos dos concorrentes
WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '📦 PRODUTOS DOS CONCORRENTES' as secao,
  (SELECT COUNT(*) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as total_produtos,
  (SELECT COUNT(DISTINCT competitor_name) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as concorrentes_diferentes,
  (SELECT COUNT(DISTINCT categoria) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as categorias_diferentes
FROM t;

-- Análise SWOT
WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '📊 ANÁLISE SWOT' as secao,
  safe_count('icp_competitive_swot', t.tenant_id) as total_swot
FROM t;

-- Matriz BCG
WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '📊 MATRIZ BCG' as secao,
  safe_count('icp_bcg_matrix', t.tenant_id) as total_matrizes
FROM t;

-- Market Insights
WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '📊 MARKET INSIGHTS' as secao,
  safe_count('icp_market_insights', t.tenant_id) as total_insights
FROM t;

-- =====================================================
-- 5. VERIFICAR RELATÓRIOS GERADOS
-- =====================================================

WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '📄 RELATÓRIOS GERADOS' as secao,
  (SELECT COUNT(*) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id) as total_relatorios,
  (SELECT COUNT(*) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id AND ir.full_report_markdown IS NOT NULL AND length(ir.full_report_markdown) > 100) as com_full_markdown,
  (SELECT COUNT(*) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id AND ir.executive_summary_markdown IS NOT NULL AND length(ir.executive_summary_markdown) > 100) as com_summary_markdown,
  (SELECT COUNT(*) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id AND ir.status = 'completed') as completos,
  (SELECT COUNT(*) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id AND ir.status = 'generating') as em_geracao,
  (SELECT COUNT(*) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id AND ir.status = 'failed') as falhados,
  (SELECT MAX(ir.generated_at) FROM public.icp_reports ir WHERE ir.tenant_id = t.tenant_id) as ultimo_relatorio
FROM t;

-- =====================================================
-- 6. RESUMO FINAL COMPLETO
-- =====================================================

WITH t AS (SELECT 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid AS tenant_id) -- ⚠️ SUBSTITUA AQUI
SELECT 
  '✅ RESUMO FINAL - DADOS DISPONÍVEIS' as secao,
  (SELECT COUNT(*) FROM public.onboarding_sessions WHERE tenant_id = t.tenant_id)::text as sessoes_onboarding,
  (SELECT COUNT(*) FILTER (WHERE step1_data IS NOT NULL) FROM public.onboarding_sessions WHERE tenant_id = t.tenant_id)::text as com_step1,
  (SELECT COUNT(*) FILTER (WHERE step2_data IS NOT NULL) FROM public.onboarding_sessions WHERE tenant_id = t.tenant_id)::text as com_step2,
  (SELECT COUNT(*) FILTER (WHERE step3_data IS NOT NULL) FROM public.onboarding_sessions WHERE tenant_id = t.tenant_id)::text as com_step3,
  (SELECT COUNT(*) FILTER (WHERE step4_data IS NOT NULL) FROM public.onboarding_sessions WHERE tenant_id = t.tenant_id)::text as com_step4,
  (SELECT COUNT(*) FILTER (WHERE step5_data IS NOT NULL) FROM public.onboarding_sessions WHERE tenant_id = t.tenant_id)::text as com_step5,
  (SELECT COUNT(*) FROM public.tenant_products WHERE tenant_id = t.tenant_id)::text as produtos_tenant,
  (SELECT COUNT(*) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id)::text as produtos_concorrentes,
  safe_count('competitive_analysis', t.tenant_id) as analises_competitivas,
  safe_count('icp_competitive_swot', t.tenant_id) as swot_produtos,
  safe_count('icp_bcg_matrix', t.tenant_id) as matrizes_bcg,
  safe_count('icp_market_insights', t.tenant_id) as market_insights,
  (SELECT COUNT(*) FROM public.icp_reports WHERE tenant_id = t.tenant_id)::text as relatorios_gerados
FROM t;

-- =====================================================
-- 7. (Opcional) Ver dados completos da sessão mais recente
-- =====================================================

/*
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'::uuid -- ⚠️ SUBSTITUA AQUI
  ORDER BY s.updated_at DESC
  LIMIT 1
)
SELECT 
  id,
  tenant_id,
  updated_at,
  step1_data->'razaoSocial' as razao_social,
  COALESCE(jsonb_array_length(step1_data->'concorrentesDiretos'), 0) as concorrentes_step1,
  COALESCE(jsonb_array_length(step1_data->'clientesAtuais'), 0) as clientes_step1,
  COALESCE(jsonb_array_length(step2_data->'setoresAlvo'), 0) as setores_alvo,
  COALESCE(jsonb_array_length(step2_data->'nichosAlvo'), 0) as nichos_alvo,
  COALESCE(jsonb_array_length(step3_data->'porteAlvo'), 0) as portes_alvo,
  step3_data->'localizacaoAlvo' as localizacao_alvo,
  COALESCE(jsonb_array_length(step4_data->'diferenciais'), 0) as diferenciais,
  COALESCE(jsonb_array_length(step4_data->'casosDeUso'), 0) as casos_uso,
  COALESCE(jsonb_array_length(step4_data->'concorrentesDiretos'), 0) as concorrentes_step4,
  COALESCE(jsonb_array_length(step5_data->'clientesAtuais'), 0) as clientes_step5,
  COALESCE(jsonb_array_length(step5_data->'empresasBenchmarking'), 0) as benchmarking
FROM latest_session;
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Substitua TODAS as ocorrências de 'e33e7d01-2c05-4040-9738-f19ef47d9acb' pelo seu tenant_id real
-- 2. Execute o script completo no Supabase SQL Editor
-- 3. Verifique os resultados de cada seção
-- 4. Se algum dado estiver faltando, complete o onboarding nas etapas correspondentes
-- 
-- =====================================================

