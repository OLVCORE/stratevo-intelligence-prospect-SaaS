-- ==========================================
-- VERIFICAR DADOS DO ONBOARDING NO BANCO
-- Execute no Supabase SQL Editor
-- ==========================================

-- IDs dos tenants
-- Uniluvas: 8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71
-- OLV Internacional: 7677686a-b98a-4a7f-aa95-7fd633ce50c9

-- 1. VERIFICAR ONBOARDING SESSIONS (6 etapas)
SELECT 
  id,
  tenant_id,
  user_id,
  status,
  step1_data IS NOT NULL as tem_step1,
  step2_data IS NOT NULL as tem_step2,
  step3_data IS NOT NULL as tem_step3,
  step4_data IS NOT NULL as tem_step4,
  step5_data IS NOT NULL as tem_step5,
  step6_data IS NOT NULL as tem_step6,
  icp_data IS NOT NULL as tem_icp_data,
  created_at,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
ORDER BY tenant_id, updated_at DESC;

-- 2. VERIFICAR CONTEÚDO DETALHADO DO STEP1 (Dados Básicos)
SELECT 
  tenant_id,
  step1_data->>'cnpj' as cnpj,
  step1_data->>'razao_social' as razao_social,
  step1_data->>'nome_fantasia' as nome_fantasia,
  step1_data->>'email' as email,
  step1_data->>'telefone' as telefone,
  jsonb_array_length(COALESCE(step1_data->'produtos', '[]'::jsonb)) as qtd_produtos,
  jsonb_array_length(COALESCE(step1_data->'clientesAtuais', '[]'::jsonb)) as qtd_clientes,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
  AND step1_data IS NOT NULL;

-- 3. VERIFICAR CONTEÚDO DETALHADO DO STEP2 (Setores, Nichos, CNAEs)
SELECT 
  tenant_id,
  jsonb_array_length(COALESCE(step2_data->'setoresAlvo', '[]'::jsonb)) as qtd_setores,
  jsonb_array_length(COALESCE(step2_data->'nichosAlvo', '[]'::jsonb)) as qtd_nichos,
  jsonb_array_length(COALESCE(step2_data->'cnaesAlvo', '[]'::jsonb)) as qtd_cnaes,
  jsonb_array_length(COALESCE(step2_data->'ncmsRecomendados', '[]'::jsonb)) as qtd_ncms,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
  AND step2_data IS NOT NULL;

-- 4. VERIFICAR CONTEÚDO DETALHADO DO STEP3 (Cliente Ideal)
SELECT 
  tenant_id,
  step3_data->>'faturamento_min' as faturamento_min,
  step3_data->>'faturamento_max' as faturamento_max,
  step3_data->>'funcionarios_min' as funcionarios_min,
  step3_data->>'funcionarios_max' as funcionarios_max,
  jsonb_array_length(COALESCE(step3_data->'estados_alvo', '[]'::jsonb)) as qtd_estados,
  jsonb_array_length(COALESCE(step3_data->'regioes_alvo', '[]'::jsonb)) as qtd_regioes,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
  AND step3_data IS NOT NULL;

-- 5. VERIFICAR CONTEÚDO DETALHADO DO STEP4 (Diferenciais, Concorrentes)
SELECT 
  tenant_id,
  jsonb_array_length(COALESCE(step4_data->'diferenciaisCompetitivos', '[]'::jsonb)) as qtd_diferenciais,
  jsonb_array_length(COALESCE(step4_data->'concorrentes', '[]'::jsonb)) as qtd_concorrentes,
  jsonb_array_length(COALESCE(step4_data->'empresasBenchmarking', '[]'::jsonb)) as qtd_benchmarking,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
  AND step4_data IS NOT NULL;

-- 6. VERIFICAR CONTEÚDO DETALHADO DO STEP5 (Histórico, Enriquecimento)
SELECT 
  tenant_id,
  jsonb_array_length(COALESCE(step5_data->'clientesAtuais', '[]'::jsonb)) as qtd_clientes_step5,
  jsonb_array_length(COALESCE(step5_data->'empresasBenchmarking', '[]'::jsonb)) as qtd_benchmarking_step5,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
  AND step5_data IS NOT NULL;

-- 7. VERIFICAR ICP DATA (dados consolidados)
SELECT 
  tenant_id,
  icp_data->>'nome' as icp_nome,
  jsonb_array_length(COALESCE(icp_data->'setores_alvo', '[]'::jsonb)) as qtd_setores_icp,
  jsonb_array_length(COALESCE(icp_data->'cnaes_alvo', '[]'::jsonb)) as qtd_cnaes_icp,
  updated_at
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
  AND icp_data IS NOT NULL;

-- 8. RESUMO GERAL POR TENANT
SELECT 
  tenant_id,
  COUNT(*) as total_sessoes,
  MAX(updated_at) as ultima_atualizacao,
  SUM(CASE WHEN step1_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_step1,
  SUM(CASE WHEN step2_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_step2,
  SUM(CASE WHEN step3_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_step3,
  SUM(CASE WHEN step4_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_step4,
  SUM(CASE WHEN step5_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_step5,
  SUM(CASE WHEN step6_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_step6,
  SUM(CASE WHEN icp_data IS NOT NULL THEN 1 ELSE 0 END) as sessoes_com_icp
FROM onboarding_sessions
WHERE tenant_id IN ('8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71', '7677686a-b98a-4a7f-aa95-7fd633ce50c9')
GROUP BY tenant_id;

