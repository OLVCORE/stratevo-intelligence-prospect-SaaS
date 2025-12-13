-- ==========================================
-- 🔍 VERIFICAÇÃO DETALHADA DAS POLÍTICAS
-- ==========================================
-- Verificar o CONTEÚDO das políticas para identificar conflitos
-- ==========================================

-- 1. VER CONTEÚDO COMPLETO DAS POLÍTICAS INSERT
SELECT 
  '🔍 POLÍTICAS INSERT (DETALHADAS)' as secao,
  policyname,
  cmd,
  qual,
  with_check,
  CASE 
    WHEN with_check LIKE '%auth.uid() IS NULL%' THEN '✅ Permite SERVICE_ROLE_KEY'
    WHEN with_check LIKE '%get_user_tenant_ids%' THEN '⚠️ Só permite usuários autenticados'
    ELSE '❓ Verificar manualmente'
  END as permite_service_role
FROM pg_policies
WHERE tablename = 'tenant_products'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. VER TODAS AS POLÍTICAS (para identificar duplicatas)
SELECT 
  '📋 TODAS AS POLÍTICAS' as secao,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid() IS NULL%' OR with_check LIKE '%auth.uid() IS NULL%' THEN '✅ Permite SERVICE_ROLE_KEY'
    ELSE '❌ NÃO permite SERVICE_ROLE_KEY'
  END as permite_service_role,
  LENGTH(qual) as tamanho_qual,
  LENGTH(with_check) as tamanho_with_check
FROM pg_policies
WHERE tablename = 'tenant_products'
ORDER BY cmd, policyname;

-- 3. VERIFICAR SE HÁ POLÍTICAS CONFLITANTES
SELECT 
  '⚠️ POSSÍVEIS CONFLITOS' as secao,
  cmd,
  COUNT(*) as quantidade_politicas,
  STRING_AGG(policyname, ', ') as nomes_politicas,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ MÚLTIPLAS POLÍTICAS - Pode causar conflito'
    ELSE '✅ Apenas uma política'
  END as status
FROM pg_policies
WHERE tablename = 'tenant_products'
GROUP BY cmd
ORDER BY cmd;

