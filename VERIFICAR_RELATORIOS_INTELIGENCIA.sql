-- ==========================================
-- VERIFICAR SE OS RELATÓRIOS DE INTELIGÊNCIA AINDA EXISTEM
-- Execute no Supabase SQL Editor
-- ==========================================

-- IDs dos tenants
-- Uniluvas: 8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71
-- OLV Internacional: 7677686a-b98a-4a7f-aa95-7fd633ce50c9

-- 1. VERIFICAR ONBOARDING SESSIONS (6 etapas)
SELECT 
  id,
  tenant_id,
  status,
  step1_data IS NOT NULL as tem_step1,
  step2_data IS NOT NULL as tem_step2,
  step3_data IS NOT NULL as tem_step3,
  step4_data IS NOT NULL as tem_step4,
  step5_data IS NOT NULL as tem_step5,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
ORDER BY tenant_id, updated_at DESC;

-- 2. VERIFICAR ICP PROFILES
SELECT 
  id,
  tenant_id,
  nome as icp_name,
  created_at,
  updated_at
FROM icp_profiles_metadata
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
ORDER BY tenant_id, created_at DESC;

-- 3. VERIFICAR ICP INTELLIGENCE CONSOLIDATED
SELECT 
  id,
  icp_profile_metadata_id,
  tenant_id,
  extraido_em AS created_at,
  updated_at
FROM icp_intelligence_consolidated
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
ORDER BY tenant_id, extraido_em DESC;

-- 4. VERIFICAR COMPETITIVE ANALYSIS
SELECT 
  id,
  tenant_id,
  icp_id,
  created_at,
  updated_at
FROM competitive_analysis
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
ORDER BY tenant_id, created_at DESC;

-- 5. VERIFICAR TENANT CNAE SUPPLY CHAIN
SELECT 
  id,
  tenant_id,
  icp_id,
  tenant_cnae_principal,
  updated_at
FROM tenant_cnae_supply_chain
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
ORDER BY tenant_id, updated_at DESC;

-- 6. VERIFICAR QUALIFIED PROSPECTS
SELECT 
  COUNT(*) as total_qualified,
  tenant_id
FROM qualified_prospects
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
GROUP BY tenant_id;

-- 7. VERIFICAR PROSPECTING CANDIDATES
SELECT 
  COUNT(*) as total_candidates,
  tenant_id
FROM prospecting_candidates
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
GROUP BY tenant_id;

-- 8. VERIFICAR COMPANIES
SELECT 
  COUNT(*) as total_companies,
  tenant_id
FROM companies
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
GROUP BY tenant_id;

