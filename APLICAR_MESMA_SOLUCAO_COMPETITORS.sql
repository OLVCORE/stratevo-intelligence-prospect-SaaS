-- ==========================================
-- 🔧 APLICAR MESMA SOLUÇÃO QUE FUNCIONA EM COMPETITORS
-- ==========================================
-- Se tenant_competitor_products funciona (8 produtos inseridos),
-- vamos verificar sua política e aplicar EXATAMENTE a mesma em tenant_products
-- ==========================================
--
-- ⚠️ IMPORTANTE: Execute VERIFICAR_POLITICAS_EXATAS.sql PRIMEIRO
-- para ver qual política está funcionando em competitors
-- ==========================================

-- 1. Verificar política atual de tenant_competitor_products
SELECT 
  '🔍 POLÍTICA DE COMPETITORS (QUE FUNCIONA)' as secao,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_competitor_products'
ORDER BY cmd, policyname;

-- 2. Se a política de competitors for FOR ALL e permitir SERVICE_ROLE_KEY,
-- vamos criar política FOR ALL similar para tenant_products
-- MAS apenas se não houver conflito com políticas existentes

-- NOTA: Aguardar resultado do passo 1 antes de continuar

