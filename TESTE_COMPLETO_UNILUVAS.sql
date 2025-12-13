-- ==========================================
-- TESTE COMPLETO - UNILUVAS
-- Execute no Supabase SQL Editor
-- Tenant: 8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71
-- ==========================================

-- ==========================================
-- PASSO 1: Verificar Tenant e ICP
-- ==========================================
WITH uniluvas_icp AS (
  SELECT 
    icpm.id as icp_id,
    icpm.nome as icp_name,
    icpm.icp_principal,
    t.id as tenant_id,
    t.name as tenant_name
  FROM public.tenants t
  LEFT JOIN public.icp_profiles_metadata icpm 
    ON icpm.tenant_id = t.id 
    AND icpm.ativo = true
  WHERE t.id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  ORDER BY icpm.icp_principal DESC NULLS LAST, icpm.created_at DESC
  LIMIT 1
)
SELECT 
  '✅ Tenant e ICP encontrados' as status,
  ui.tenant_id,
  ui.tenant_name,
  ui.icp_id,
  ui.icp_name,
  ui.icp_principal
FROM uniluvas_icp ui;

-- ==========================================
-- PASSO 2: Extrair Inteligência do ICP
-- ==========================================
WITH uniluvas_icp AS (
  SELECT 
    id as icp_id,
    '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID as tenant_id
  FROM public.icp_profiles_metadata
  WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
    AND icp_principal = true
    AND ativo = true
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  '✅ Extraindo inteligência...' as status,
  ui.icp_id,
  ui.tenant_id,
  public.extract_icp_intelligence_complete(ui.icp_id, ui.tenant_id) as intelligence_id
FROM uniluvas_icp ui;

-- ==========================================
-- PASSO 3: Verificar Inteligência Extraída
-- ==========================================
WITH uniluvas_icp AS (
  SELECT id as icp_id
  FROM public.icp_profiles_metadata
  WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
    AND icp_principal = true
    AND ativo = true
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  '✅ Inteligência consolidada' as status,
  ic.id,
  ic.icp_profile_metadata_id,
  array_length(ic.setores_alvo, 1) as total_setores,
  array_length(ic.cnaes_alvo, 1) as total_cnaes,
  array_length(ic.nichos_alvo, 1) as total_nichos,
  jsonb_array_length(ic.clientes_base) as total_clientes,
  ic.versao_extracao,
  ic.updated_at
FROM uniluvas_icp ui
LEFT JOIN public.icp_intelligence_consolidated ic 
  ON ic.icp_profile_metadata_id = ui.icp_id;

-- ==========================================
-- PASSO 4: Verificar CNAE do Tenant
-- ==========================================
SELECT 
  '✅ CNAE do tenant' as status,
  *
FROM public.extract_tenant_cnae_from_onboarding('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID);

-- ==========================================
-- PASSO 5: Verificar Produtos
-- ==========================================
SELECT 
  '✅ Produtos cadastrados' as status,
  COUNT(*) as total_produtos,
  array_agg(nome) as nomes_produtos
FROM public.tenant_products
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  AND ativo = true;

-- ==========================================
-- PASSO 6: Verificar Supply Chain
-- ==========================================
SELECT 
  '✅ Supply Chain' as status,
  id,
  tenant_id,
  icp_id,
  tenant_cnae_principal,
  array_length(cnaes_compradores, 1) as total_cnaes_compradores,
  gerado_por_ia,
  updated_at
FROM public.tenant_cnae_supply_chain
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
ORDER BY updated_at DESC
LIMIT 1;

-- ==========================================
-- PASSO 7: Verificar Prospects Qualificados
-- ==========================================
SELECT 
  '✅ Prospects qualificados' as status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE fit_score IS NOT NULL) as com_score,
  COUNT(*) FILTER (WHERE match_breakdown IS NOT NULL) as com_breakdown,
  COUNT(*) FILTER (WHERE methodology_explanation IS NOT NULL) as com_metodologia,
  ROUND(AVG(fit_score), 2) as score_medio,
  COUNT(*) FILTER (WHERE grade = 'A+') as grade_a_plus,
  COUNT(*) FILTER (WHERE grade = 'A') as grade_a,
  COUNT(*) FILTER (WHERE grade = 'B') as grade_b
FROM public.qualified_prospects
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  AND pipeline_status = 'new';

-- ==========================================
-- PASSO 8: Exemplo de Prospect com Metodologia Completa
-- ==========================================
SELECT 
  '✅ Exemplo de prospect qualificado' as status,
  cnpj,
  razao_social,
  fit_score,
  grade,
  cnae_match_principal,
  setor_match,
  cnae_match_codigo,
  setor_match_codigo,
  methodology_explanation,
  match_reasons,
  match_breakdown
FROM public.qualified_prospects
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  AND pipeline_status = 'new'
  AND match_breakdown IS NOT NULL
ORDER BY fit_score DESC
LIMIT 1;

