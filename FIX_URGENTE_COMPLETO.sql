-- ============================================
-- FIX URGENTE: RESOLVER TUDO DE UMA VEZ
-- ============================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE (para diagnóstico)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_profiles_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions DISABLE ROW LEVEL SECURITY;

-- 2. DIAGNÓSTICO COMPLETO
SELECT '=== USUÁRIOS ===' as secao;
SELECT * FROM users LIMIT 10;

SELECT '=== EMPRESAS POR TENANT ===' as secao;
SELECT 
  tenant_id,
  COUNT(*) as total_empresas,
  MIN(created_at) as primeira,
  MAX(created_at) as ultima
FROM companies
GROUP BY tenant_id
ORDER BY ultima DESC;

SELECT '=== ÚLTIMAS 60 EMPRESAS IMPORTADAS ===' as secao;
SELECT 
  id,
  cnpj,
  company_name,
  tenant_id,
  source_name,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 60;

SELECT '=== EMPRESAS SEM TENANT ===' as secao;
SELECT COUNT(*) as total_sem_tenant
FROM companies
WHERE tenant_id IS NULL;

SELECT '=== CNPJS DUPLICADOS ===' as secao;
SELECT 
  cnpj,
  COUNT(*) as qtd_duplicadas,
  array_agg(id) as ids
FROM companies
WHERE cnpj IS NOT NULL
GROUP BY cnpj
HAVING COUNT(*) > 1;

-- ============================================
-- RESULTADO: COLE AQUI O OUTPUT COMPLETO
-- ============================================

