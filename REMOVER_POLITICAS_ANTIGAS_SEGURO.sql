-- ==========================================
-- 🔧 REMOVER APENAS POLÍTICAS ANTIGAS PROBLEMÁTICAS
-- ==========================================
-- ⚠️ IMPORTANTE: Execute VERIFICAR_CONTEUDO_POLITICAS.sql PRIMEIRO
-- para identificar quais políticas NÃO permitem SERVICE_ROLE_KEY
-- ==========================================
--
-- O QUE ESTE SCRIPT FAZ:
-- ✅ Remove APENAS políticas antigas que NÃO permitem SERVICE_ROLE_KEY
-- ✅ Mantém políticas novas que funcionam (_policy)
-- ✅ NÃO remove nada que permite SERVICE_ROLE_KEY
--
-- O QUE ESTE SCRIPT NÃO FAZ:
-- ❌ NÃO remove políticas que permitem SERVICE_ROLE_KEY
-- ❌ NÃO remove políticas novas (_policy)
-- ❌ NÃO altera estrutura da tabela
-- ==========================================

-- 1. Remover política INSERT antiga (se não permitir SERVICE_ROLE_KEY)
-- NOTA: A política nova tenant_products_insert_policy JÁ permite SERVICE_ROLE_KEY
DO $$
BEGIN
  -- Verificar se política antiga existe e não permite SERVICE_ROLE_KEY
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenant_products' 
    AND policyname = 'tenant_products_insert'
    AND cmd = 'INSERT'
    AND (with_check NOT LIKE '%auth.uid() IS NULL%' OR with_check IS NULL)
  ) THEN
    DROP POLICY IF EXISTS "tenant_products_insert" ON tenant_products;
    RAISE NOTICE '✅ Política antiga tenant_products_insert removida (não permitia SERVICE_ROLE_KEY)';
  ELSE
    RAISE NOTICE 'ℹ️ Política tenant_products_insert não existe ou já permite SERVICE_ROLE_KEY. Pulando.';
  END IF;
END $$;

-- 2. Remover política SELECT antiga (se não permitir SERVICE_ROLE_KEY)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenant_products' 
    AND policyname = 'tenant_products_read'
    AND cmd = 'SELECT'
    AND (qual NOT LIKE '%auth.uid() IS NULL%' OR qual IS NULL)
  ) THEN
    DROP POLICY IF EXISTS "tenant_products_read" ON tenant_products;
    RAISE NOTICE '✅ Política antiga tenant_products_read removida (não permitia SERVICE_ROLE_KEY)';
  ELSE
    RAISE NOTICE 'ℹ️ Política tenant_products_read não existe ou já permite SERVICE_ROLE_KEY. Pulando.';
  END IF;
END $$;

-- 3. Remover política UPDATE antiga (se não permitir SERVICE_ROLE_KEY)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenant_products' 
    AND policyname = 'tenant_products_update'
    AND cmd = 'UPDATE'
    AND (
      (qual NOT LIKE '%auth.uid() IS NULL%' OR qual IS NULL)
      AND (with_check NOT LIKE '%auth.uid() IS NULL%' OR with_check IS NULL)
    )
  ) THEN
    DROP POLICY IF EXISTS "tenant_products_update" ON tenant_products;
    RAISE NOTICE '✅ Política antiga tenant_products_update removida (não permitia SERVICE_ROLE_KEY)';
  ELSE
    RAISE NOTICE 'ℹ️ Política tenant_products_update não existe ou já permite SERVICE_ROLE_KEY. Pulando.';
  END IF;
END $$;

-- 4. Verificar resultado final
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  cmd,
  COUNT(*) as quantidade_politicas,
  STRING_AGG(policyname, ', ') as politicas_restantes,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Apenas uma política (OK)'
    WHEN COUNT(*) > 1 THEN '⚠️ Ainda há duplicatas'
    ELSE '❌ Nenhuma política (PROBLEMA!)'
  END as status_final
FROM pg_policies
WHERE tablename = 'tenant_products'
GROUP BY cmd
ORDER BY cmd;

