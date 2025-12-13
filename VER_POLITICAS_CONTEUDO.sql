-- ==========================================
-- 🔍 VER CONTEÚDO EXATO DAS POLÍTICAS
-- ==========================================

-- 1. POLÍTICA DE tenant_competitor_products (QUE FUNCIONA)
SELECT 
  '🏢 COMPETITORS (FUNCIONA - 8 produtos)' as tabela,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_competitor_products';

-- 2. POLÍTICA DE tenant_products (NÃO FUNCIONA - 0 produtos)
SELECT 
  '📦 TENANT (NÃO FUNCIONA - 0 produtos)' as tabela,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_products';

