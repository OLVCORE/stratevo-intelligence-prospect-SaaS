-- ============================================================================
-- 🔧 DELETAR TENANT OLV INTERNACIONAL MANUALMENTE
-- ============================================================================
-- Execute esta query no Supabase SQL Editor para deletar o tenant OLV Internacional
-- ============================================================================

-- PASSO 1: Verificar se o tenant existe
SELECT 
  id, 
  nome, 
  cnpj,
  created_at,
  'EXISTE' as status
FROM tenants 
WHERE cnpj = '67867580000190' 
   OR nome ILIKE '%OLV INTERNACIONAL%';

-- PASSO 2: Verificar dependências (quantos registros relacionados existem)
SELECT 
  'users' as tabela,
  COUNT(*) as quantidade
FROM users 
WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4'

UNION ALL

SELECT 
  'onboarding_sessions' as tabela,
  COUNT(*) as quantidade
FROM onboarding_sessions 
WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4'

UNION ALL

SELECT 
  'tenant_products' as tabela,
  COUNT(*) as quantidade
FROM tenant_products 
WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4'

UNION ALL

SELECT 
  'tenant_competitor_products' as tabela,
  COUNT(*) as quantidade
FROM tenant_competitor_products 
WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4'

UNION ALL

SELECT 
  'icp_profiles_metadata' as tabela,
  COUNT(*) as quantidade
FROM icp_profiles_metadata 
WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4'

UNION ALL

SELECT 
  'companies' as tabela,
  COUNT(*) as quantidade
FROM companies 
WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';

-- PASSO 3: Executar soft_delete_tenant via RPC
-- Descomente a linha abaixo e execute:
/*
SELECT soft_delete_tenant(
  'ab404d3b-0d2e-4196-bc69-784bdd35cec4'::UUID,
  'Deletado manualmente via SQL - CNPJ duplicado'
);
*/

-- PASSO 4: Se a função RPC não funcionar, deletar manualmente (CUIDADO!)
-- ⚠️ ATENÇÃO: Execute apenas se tiver certeza que quer deletar TUDO relacionado a este tenant
-- Descomente o bloco abaixo APENAS se necessário:

/*
BEGIN;

-- Deletar dependências na ordem correta
DELETE FROM tenant_competitor_products WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM tenant_products WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM icp_analysis_results WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM icp_profiles_metadata WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM icp_reports WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM icp_competitive_swot WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM icp_bcg_matrix WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM icp_market_insights WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM onboarding_sessions WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM qualified_prospects WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM companies WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM competitive_analysis WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM leads WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM website_scan_jobs WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM users WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';
DELETE FROM tenant_users WHERE tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';

-- Deletar o tenant
DELETE FROM tenants WHERE id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';

-- Verificar se foi deletado
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM tenants WHERE id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4') 
    THEN 'AINDA EXISTE - ERRO!'
    ELSE 'DELETADO COM SUCESSO ✅'
  END as resultado;

COMMIT;
*/

-- PASSO 5: Verificar se foi deletado
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM tenants WHERE id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4') 
    THEN 'AINDA EXISTE'
    ELSE 'DELETADO'
  END as status_tenant,
  CASE 
    WHEN EXISTS (SELECT 1 FROM deleted_tenants WHERE original_tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4') 
    THEN 'ESTÁ NA LIXEIRA'
    ELSE 'NÃO ESTÁ NA LIXEIRA'
  END as status_lixeira;

