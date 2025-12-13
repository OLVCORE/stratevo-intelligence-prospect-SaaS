-- ==========================================
-- 🔍 VERIFICAR CONTEÚDO EXATO DAS POLÍTICAS
-- ==========================================
-- Ver o conteúdo completo para entender por que não funciona
-- ==========================================

-- 1. TODAS AS POLÍTICAS DE tenant_products (com conteúdo completo)
SELECT 
  '📦 TENANT_PRODUCTS - TODAS AS POLÍTICAS' as secao,
  policyname,
  cmd,
  permissive,
  roles,
  qual as condicao_using,
  with_check as condicao_with_check,
  CASE 
    WHEN cmd = 'INSERT' AND (with_check LIKE '%auth.uid() IS NULL%') THEN '✅ INSERT permite SERVICE_ROLE_KEY'
    WHEN cmd = 'SELECT' AND (qual LIKE '%auth.uid() IS NULL%') THEN '✅ SELECT permite SERVICE_ROLE_KEY'
    WHEN cmd = 'UPDATE' AND ((qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%')) THEN '✅ UPDATE permite SERVICE_ROLE_KEY'
    WHEN cmd = 'DELETE' AND (qual LIKE '%auth.uid() IS NULL%') THEN '✅ DELETE permite SERVICE_ROLE_KEY'
    WHEN cmd = 'ALL' AND (qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%') THEN '✅ ALL permite SERVICE_ROLE_KEY'
    ELSE '❌ NÃO permite SERVICE_ROLE_KEY'
  END as status_service_role
FROM pg_policies
WHERE tablename = 'tenant_products'
ORDER BY cmd, policyname;

-- 2. TODAS AS POLÍTICAS DE tenant_competitor_products (com conteúdo completo)
SELECT 
  '🏢 TENANT_COMPETITOR_PRODUCTS - TODAS AS POLÍTICAS' as secao,
  policyname,
  cmd,
  permissive,
  roles,
  qual as condicao_using,
  with_check as condicao_with_check,
  CASE 
    WHEN cmd = 'INSERT' AND (with_check LIKE '%auth.uid() IS NULL%') THEN '✅ INSERT permite SERVICE_ROLE_KEY'
    WHEN cmd = 'SELECT' AND (qual LIKE '%auth.uid() IS NULL%') THEN '✅ SELECT permite SERVICE_ROLE_KEY'
    WHEN cmd = 'UPDATE' AND ((qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%')) THEN '✅ UPDATE permite SERVICE_ROLE_KEY'
    WHEN cmd = 'DELETE' AND (qual LIKE '%auth.uid() IS NULL%') THEN '✅ DELETE permite SERVICE_ROLE_KEY'
    WHEN cmd = 'ALL' AND (qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%') THEN '✅ ALL permite SERVICE_ROLE_KEY'
    ELSE '❌ NÃO permite SERVICE_ROLE_KEY'
  END as status_service_role
FROM pg_policies
WHERE tablename = 'tenant_competitor_products'
ORDER BY cmd, policyname;

-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
  '🔒 STATUS RLS' as secao,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenant_products', 'tenant_competitor_products')
ORDER BY tablename;

