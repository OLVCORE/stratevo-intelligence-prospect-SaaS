-- =====================================================
-- SCRIPT SQL COMPLETO - VERIFICAÇÃO DE DADOS (VERSÃO PRONTA PARA USO)
-- =====================================================
-- 
-- ⚠️ INSTRUÇÕES IMPORTANTES:
-- 1. ANTES de executar, SUBSTITUA o UUID abaixo pelo seu tenant_id real
-- 2. Para encontrar seu tenant_id, execute: SELECT id, nome, cnpj FROM tenants LIMIT 5;
-- 3. Cole o UUID do seu tenant no lugar de 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'
-- 
-- =====================================================

-- =====================================================
-- CONFIGURAÇÃO: TENANT ID (SUBSTITUA AQUI)
-- =====================================================
-- ⚠️ SUBSTITUA 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID' pelo seu tenant_id real (UUID)
-- Exemplo: '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
-- =====================================================

-- Primeiro, vamos listar os tenants disponíveis para você escolher
SELECT 
  '📋 TENANTS DISPONÍVEIS (escolha um UUID abaixo)' as instrucao,
  id as tenant_id,
  nome,
  cnpj,
  created_at
FROM public.tenants
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- AGORA SUBSTITUA O UUID ABAIXO PELO UUID DO TENANT ESCOLHIDO
-- =====================================================

-- Variável para o tenant (SUBSTITUA AQUI)
DO $$
DECLARE
  v_tenant uuid; -- ⚠️ SUBSTITUA o valor abaixo
BEGIN
  -- ⚠️⚠️⚠️ SUBSTITUA AQUI PELO SEU TENANT_ID ⚠️⚠️⚠️
  v_tenant := '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid;
  
  -- Validação: verificar se o tenant existe
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant) THEN
    RAISE EXCEPTION 'Tenant ID não encontrado: %. Execute a query acima para ver os tenants disponíveis.', v_tenant;
  END IF;
  
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'VERIFICAÇÃO DE DADOS DAS 6 ETAPAS DO ONBOARDING';
  RAISE NOTICE 'Tenant ID: %', v_tenant;
  RAISE NOTICE '====================================================';
END $$;

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS CRÍTICAS
-- =====================================================

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

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS safe_count(TEXT, UUID);

-- Criar nova função
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
-- ⚠️ SUBSTITUA 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID' pelo UUID real

-- STEP 1: Dados Básicos
WITH latest_session AS (
  SELECT *
  FROM public.onboarding_sessions s
  WHERE s.tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid
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
  WHERE s.tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid
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
  WHERE s.tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71::uuid
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
  WHERE s.tenant_id = 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'::uuid
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
  WHERE s.tenant_id = 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'::uuid
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
-- ⚠️ SUBSTITUA '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71' pelo UUID real

-- Concorrentes cadastrados
WITH t AS (SELECT '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid AS tenant_id)
SELECT 
  '🔍 CONCORRENTES CADASTRADOS' as secao,
  safe_count('competitive_analysis', t.tenant_id) as analises_competitivas,
  (SELECT COUNT(*) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as produtos_concorrentes
FROM t;

-- Produtos do tenant
WITH t AS (SELECT '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid AS tenant_id)
SELECT 
  '📦 PRODUTOS DO TENANT' as secao,
  (SELECT COUNT(*) FROM public.tenant_products WHERE tenant_id = t.tenant_id) as total_produtos,
  (SELECT COUNT(DISTINCT COALESCE(categoria, category)) FROM public.tenant_products WHERE tenant_id = t.tenant_id) as categorias_diferentes
FROM t;

-- Produtos dos concorrentes
WITH t AS (SELECT '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid AS tenant_id)
SELECT 
  '📦 PRODUTOS DOS CONCORRENTES' as secao,
  (SELECT COUNT(*) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as total_produtos,
  (SELECT COUNT(DISTINCT competitor_name) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as concorrentes_diferentes,
  (SELECT COUNT(DISTINCT categoria) FROM public.tenant_competitor_products WHERE tenant_id = t.tenant_id) as categorias_diferentes
FROM t;

-- Análise SWOT
WITH t AS (SELECT '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::uuid AS tenant_id)
SELECT 
  '📊 ANÁLISE SWOT' as secao,
  safe_count('icp_competitive_swot', t.tenant_id) as total_swot
FROM t;

-- Matriz BCG
WITH t AS (SELECT 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'::uuid AS tenant_id)
SELECT 
  '📊 MATRIZ BCG' as secao,
  safe_count('icp_bcg_matrix', t.tenant_id) as total_matrizes
FROM t;

-- Market Insights
WITH t AS (SELECT 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'::uuid AS tenant_id)
SELECT 
  '📊 MARKET INSIGHTS' as secao,
  safe_count('icp_market_insights', t.tenant_id) as total_insights
FROM t;

-- =====================================================
-- 5. VERIFICAR RELATÓRIOS GERADOS
-- =====================================================
-- ⚠️ SUBSTITUA 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID' pelo UUID real

WITH t AS (SELECT 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'::uuid AS tenant_id)
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
-- ⚠️ SUBSTITUA 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID' pelo UUID real

WITH t AS (SELECT 'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'::uuid AS tenant_id)
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
-- 7. VERIFICAR SE TABELAS FALTANTES EXISTEM
-- =====================================================

SELECT 
  '🔍 VERIFICAÇÃO DE TABELAS' as secao,
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM (VALUES 
  ('onboarding_sessions'),
  ('icp_reports'),
  ('tenants'),
  ('tenant_products'),
  ('tenant_competitor_products'),
  ('competitive_analysis'),
  ('icp_competitive_swot'),
  ('icp_bcg_matrix'),
  ('icp_market_insights')
) AS t(table_name);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- 
-- INSTRUÇÕES FINAIS:
-- 1. Execute a primeira query para ver os tenants disponíveis
-- 2. Copie o UUID do tenant desejado
-- 3. Use Ctrl+H (Find & Replace) para substituir TODAS as ocorrências de:
--    'SUBSTITUA_AQUI_PELO_SEU_TENANT_ID'
--    pelo UUID real (ex: '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71')
-- 4. Execute o script completo
-- 5. Se alguma tabela mostrar "Tabela não existe", execute a migration:
--    supabase/migrations/20250206000002_create_missing_report_tables.sql
-- 
-- =====================================================

