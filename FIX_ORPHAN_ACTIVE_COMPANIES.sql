-- ==========================================
-- SCRIPT DE CORREÇÃO: Empresas ACTIVE Órfãs
-- ==========================================
-- Execute este script no Supabase SQL Editor para corrigir
-- empresas que estão ACTIVE mas não têm registro em icp_analysis_results
-- ==========================================

-- 1. Verificar quantas empresas órfãs existem
SELECT 
  COUNT(*) as total_orphans,
  tenant_id
FROM public.companies c
WHERE COALESCE(c.canonical_status, 'BASE') = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM public.icp_analysis_results iar
    WHERE iar.company_id = c.id
      AND iar.tenant_id = c.tenant_id
  )
GROUP BY tenant_id;

-- 2. Listar empresas órfãs (ajustar tenant_id conforme necessário)
SELECT 
  c.id,
  c.company_name,
  c.cnpj,
  c.canonical_status,
  c.tenant_id
FROM public.companies c
WHERE c.tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623' -- ✅ AJUSTAR tenant_id
  AND COALESCE(c.canonical_status, 'BASE') = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM public.icp_analysis_results iar
    WHERE iar.company_id = c.id
      AND iar.tenant_id = c.tenant_id
  );

-- 3. CORRIGIR TODAS as empresas órfãs do tenant
-- ✅ Execute esta query para corrigir automaticamente
SELECT * FROM sync_all_orphan_active_companies('f23bdc79-a26a-4ebc-a87a-01a37177a623'::UUID);

-- 4. Verificar resultado após correção
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
WHERE c.tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623' -- ✅ AJUSTAR tenant_id
  AND COALESCE(c.canonical_status, 'BASE') = 'ACTIVE'
ORDER BY c.updated_at DESC;

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- Todas as empresas ACTIVE devem ter:
-- - canonical_status = 'ACTIVE' em companies
-- - Registro correspondente em icp_analysis_results
-- - status = 'aprovada' em icp_analysis_results
-- - tenant_id correto em ambas as tabelas
-- ==========================================
