-- ==========================================
-- 🔍 COMPARAR POLÍTICAS RLS: tenant_products vs tenant_competitor_products
-- ==========================================
-- Se concorrentes funcionam mas tenant não, a diferença está nas políticas RLS
-- ==========================================

-- 1. POLÍTICAS DE tenant_products
SELECT 
  '📦 TENANT_PRODUCTS' as tabela,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%' THEN '✅ Permite SERVICE_ROLE_KEY'
    ELSE '❌ NÃO permite SERVICE_ROLE_KEY'
  END as permite_service_role,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_products'
ORDER BY cmd, policyname;

-- 2. POLÍTICAS DE tenant_competitor_products
SELECT 
  '🏢 TENANT_COMPETITOR_PRODUCTS' as tabela,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%' THEN '✅ Permite SERVICE_ROLE_KEY'
    ELSE '❌ NÃO permite SERVICE_ROLE_KEY'
  END as permite_service_role,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_competitor_products'
ORDER BY cmd, policyname;

-- 3. COMPARAÇÃO LADO A LADO
SELECT 
  '🔍 COMPARAÇÃO' as secao,
  'tenant_products' as tabela_tenant,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tenant_products' AND cmd = 'INSERT') as politicas_insert_tenant,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tenant_products' AND cmd = 'INSERT' AND (qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%')) as permite_service_tenant,
  'tenant_competitor_products' as tabela_competitor,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tenant_competitor_products' AND cmd = 'INSERT') as politicas_insert_competitor,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tenant_competitor_products' AND cmd = 'INSERT' AND (qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%')) as permite_service_competitor;

