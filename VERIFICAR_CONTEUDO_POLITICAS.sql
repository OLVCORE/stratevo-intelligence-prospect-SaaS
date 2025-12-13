-- ==========================================
-- 🔍 VERIFICAR CONTEÚDO DAS POLÍTICAS DUPLICADAS
-- ==========================================
-- Ver o conteúdo exato para identificar qual está bloqueando
-- ==========================================

-- 1. POLÍTICAS INSERT (as duplicadas)
SELECT 
  '🔍 POLÍTICAS INSERT' as secao,
  policyname,
  with_check as condicao_insert,
  CASE 
    WHEN with_check LIKE '%auth.uid() IS NULL%' THEN '✅ Permite SERVICE_ROLE_KEY'
    WHEN with_check LIKE '%get_user_tenant_ids%' AND with_check NOT LIKE '%auth.uid() IS NULL%' THEN '❌ NÃO permite SERVICE_ROLE_KEY'
    ELSE '❓ Verificar'
  END as permite_service_role
FROM pg_policies
WHERE tablename = 'tenant_products'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. POLÍTICAS SELECT (as duplicadas)
SELECT 
  '🔍 POLÍTICAS SELECT' as secao,
  policyname,
  qual as condicao_select,
  CASE 
    WHEN qual LIKE '%auth.uid() IS NULL%' THEN '✅ Permite SERVICE_ROLE_KEY'
    WHEN qual LIKE '%get_user_tenant_ids%' AND qual NOT LIKE '%auth.uid() IS NULL%' THEN '❌ NÃO permite SERVICE_ROLE_KEY'
    ELSE '❓ Verificar'
  END as permite_service_role
FROM pg_policies
WHERE tablename = 'tenant_products'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 3. POLÍTICAS UPDATE (as duplicadas)
SELECT 
  '🔍 POLÍTICAS UPDATE' as secao,
  policyname,
  qual as condicao_using,
  with_check as condicao_with_check,
  CASE 
    WHEN (qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%') THEN '✅ Permite SERVICE_ROLE_KEY'
    WHEN (qual LIKE '%get_user_tenant_ids%' OR with_check LIKE '%get_user_tenant_ids%') 
         AND (qual NOT LIKE '%auth.uid() IS NULL%' AND with_check NOT LIKE '%auth.uid() IS NULL%') 
    THEN '❌ NÃO permite SERVICE_ROLE_KEY'
    ELSE '❓ Verificar'
  END as permite_service_role
FROM pg_policies
WHERE tablename = 'tenant_products'
  AND cmd = 'UPDATE'
ORDER BY policyname;

