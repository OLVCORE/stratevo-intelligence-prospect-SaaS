-- ==========================================
-- QUERIES PARA TESTE DO MATCHING SNIPER - UNILUVAS
-- Execute no Supabase SQL Editor
-- Tenant: Uniluvas (8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71)
-- ==========================================

-- CONSTANTE: Tenant ID da Uniluvas
DO $$
DECLARE
  v_tenant_id UUID := '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID;
  v_icp_id UUID;
BEGIN
  -- Buscar ICP principal da Uniluvas
  SELECT id INTO v_icp_id
  FROM public.icp_profiles_metadata
  WHERE tenant_id = v_tenant_id
    AND icp_principal = true
    AND ativo = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não encontrar principal, buscar qualquer ICP
  IF v_icp_id IS NULL THEN
    SELECT id INTO v_icp_id
    FROM public.icp_profiles_metadata
    WHERE tenant_id = v_tenant_id
      AND ativo = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'ICP ID: %', v_icp_id;
END $$;

-- ==========================================
-- 1. VERIFICAR TENANT E ICP DA UNILUVAS
-- ==========================================
WITH uniluvas_data AS (
  SELECT 
    '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID as tenant_id,
    t.name as tenant_name,
    t.slug,
    icpm.id as icp_id,
    icpm.nome as icp_name,
    icpm.icp_principal,
    icpm.created_at as icp_created_at
  FROM public.tenants t
  LEFT JOIN public.icp_profiles_metadata icpm 
    ON icpm.tenant_id = t.id 
    AND icpm.ativo = true
  WHERE t.id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  ORDER BY icpm.icp_principal DESC NULLS LAST, icpm.created_at DESC
  LIMIT 1
)
SELECT * FROM uniluvas_data;

-- ==========================================
-- 2. EXTRAIR INTELIGÊNCIA DO ICP DA UNILUVAS
-- ==========================================
WITH uniluvas_icp AS (
  SELECT 
    id as icp_id,
    tenant_id
  FROM public.icp_profiles_metadata
  WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
    AND icp_principal = true
    AND ativo = true
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  ui.icp_id,
  ui.tenant_id,
  public.extract_icp_intelligence_complete(ui.icp_id, ui.tenant_id) as intelligence_id
FROM uniluvas_icp ui;

-- ==========================================
-- 3. VERIFICAR INTELIGÊNCIA EXTRAÍDA
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
  ic.id,
  ic.icp_profile_metadata_id,
  ic.tenant_id,
  ic.setores_alvo,
  ic.cnaes_alvo,
  ic.nichos_alvo,
  ic.clientes_base,
  ic.versao_extracao,
  ic.created_at,
  ic.updated_at
FROM uniluvas_icp ui
LEFT JOIN public.icp_intelligence_consolidated ic 
  ON ic.icp_profile_metadata_id = ui.icp_id;

-- ==========================================
-- 4. VERIFICAR CNAE DO TENANT UNILUVAS
-- ==========================================
SELECT * FROM public.extract_tenant_cnae_from_onboarding('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID);

-- ==========================================
-- 5. VERIFICAR PRODUTOS DA UNILUVAS
-- ==========================================
SELECT 
  id,
  nome,
  descricao,
  categoria,
  cnaes_alvo,
  setores_alvo,
  ativo
FROM public.tenant_products
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  AND ativo = true
ORDER BY destaque DESC, nome;

-- ==========================================
-- 6. VERIFICAR SUPPLY CHAIN GERADO
-- ==========================================
SELECT 
  id,
  tenant_id,
  icp_id,
  tenant_cnae_principal,
  tenant_cnae_principal_descricao,
  array_length(cnaes_compradores, 1) as total_cnaes_compradores,
  gerado_por_ia,
  created_at,
  updated_at
FROM public.tenant_cnae_supply_chain
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
ORDER BY updated_at DESC;

-- ==========================================
-- 7. VERIFICAR PROSPECTS QUALIFICADOS COM METODOLOGIA
-- ==========================================
SELECT 
  id,
  cnpj,
  razao_social,
  fit_score,
  grade,
  cnae_match_principal,
  setor_match,
  cnae_match_codigo,
  setor_match_codigo,
  CASE 
    WHEN methodology_explanation IS NOT NULL THEN LEFT(methodology_explanation, 100) || '...'
    ELSE NULL
  END as methodology_preview,
  array_length(match_reasons, 1) as total_match_reasons,
  jsonb_array_length(match_breakdown) as total_breakdown_items,
  pipeline_status,
  created_at
FROM public.qualified_prospects
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  AND pipeline_status = 'new'
ORDER BY fit_score DESC NULLS LAST
LIMIT 20;

-- ==========================================
-- 8. ESTATÍSTICAS DE MATCHING DA UNILUVAS
-- ==========================================
SELECT 
  COUNT(*) as total_prospects,
  COUNT(*) FILTER (WHERE cnae_match_principal = true) as cnae_matches,
  COUNT(*) FILTER (WHERE setor_match = true) as setor_matches,
  ROUND(AVG(fit_score), 2) as avg_score,
  COUNT(*) FILTER (WHERE grade = 'A+') as grade_a_plus,
  COUNT(*) FILTER (WHERE grade = 'A') as grade_a,
  COUNT(*) FILTER (WHERE grade = 'B') as grade_b,
  COUNT(*) FILTER (WHERE grade = 'C') as grade_c,
  COUNT(*) FILTER (WHERE grade = 'D') as grade_d,
  COUNT(*) FILTER (WHERE methodology_explanation IS NOT NULL) as com_metodologia,
  COUNT(*) FILTER (WHERE match_breakdown IS NOT NULL AND jsonb_array_length(match_breakdown) > 0) as com_breakdown
FROM public.qualified_prospects
WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
  AND pipeline_status = 'new';

-- ==========================================
-- 9. QUERY TUDO-EM-UM: Status Completo
-- ==========================================
WITH uniluvas_icp AS (
  SELECT 
    id as icp_id,
    nome as icp_name,
    icp_principal
  FROM public.icp_profiles_metadata
  WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
    AND icp_principal = true
    AND ativo = true
  ORDER BY created_at DESC
  LIMIT 1
),
intelligence_status AS (
  SELECT 
    COUNT(*) > 0 as tem_inteligencia,
    MAX(versao_extracao) as ultima_versao
  FROM uniluvas_icp ui
  JOIN public.icp_intelligence_consolidated ic ON ic.icp_profile_metadata_id = ui.icp_id
),
supply_chain_status AS (
  SELECT 
    COUNT(*) > 0 as tem_supply_chain,
    MAX(updated_at) as ultima_atualizacao
  FROM public.tenant_cnae_supply_chain
  WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
),
prospects_status AS (
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE fit_score IS NOT NULL) as com_score,
    COUNT(*) FILTER (WHERE match_breakdown IS NOT NULL) as com_breakdown
  FROM public.qualified_prospects
  WHERE tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'::UUID
    AND pipeline_status = 'new'
)
SELECT 
  ui.icp_id,
  ui.icp_name,
  ui.icp_principal,
  is.tem_inteligencia,
  is.ultima_versao,
  scs.tem_supply_chain,
  scs.ultima_atualizacao,
  ps.total as total_prospects,
  ps.com_score,
  ps.com_breakdown,
  CASE 
    WHEN is.tem_inteligencia AND scs.tem_supply_chain AND ps.com_score > 0 THEN '✅ Pronto para qualificação'
    WHEN is.tem_inteligencia AND NOT scs.tem_supply_chain THEN '⚠️ Falta gerar Supply Chain'
    WHEN NOT is.tem_inteligencia THEN '⚠️ Falta extrair inteligência do ICP'
    ELSE '✅ Sistema funcionando'
  END as status_geral
FROM uniluvas_icp ui
CROSS JOIN intelligence_status is
CROSS JOIN supply_chain_status scs
CROSS JOIN prospects_status ps;

