-- ==========================================
-- EXECUTAR CORREÇÃO IMEDIATA
-- ==========================================
-- Copie e cole esta query no Supabase SQL Editor
-- ==========================================

-- CORRIGIR TODAS as empresas órfãs do tenant
SELECT * FROM sync_all_orphan_active_companies('f23bdc79-a26a-4ebc-a87a-01a37177a623'::UUID);

-- ==========================================
-- VERIFICAR RESULTADO APÓS CORREÇÃO
-- ==========================================
SELECT 
  c.id as company_id,
  c.canonical_status,
  iar.id as icp_analysis_id,
  iar.status as icp_status,
  c.tenant_id
FROM public.companies c
LEFT JOIN public.icp_analysis_results iar 
  ON iar.company_id = c.id 
  AND iar.tenant_id = c.tenant_id
WHERE c.tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623'
  AND COALESCE(c.canonical_status, 'BASE') = 'ACTIVE'
ORDER BY c.updated_at DESC;
