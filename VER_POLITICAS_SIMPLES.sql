-- ==========================================
-- 🔍 VER POLÍTICAS DE FORMA SIMPLES
-- ==========================================

-- 1. POLÍTICA DE tenant_competitor_products (QUE FUNCIONA - 8 produtos inseridos)
SELECT 
  '🏢 COMPETITORS (FUNCIONA)' as tabela,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_competitor_products';

-- 2. POLÍTICA DE tenant_products (NÃO FUNCIONA - 0 produtos inseridos)
SELECT 
  '📦 TENANT (NÃO FUNCIONA)' as tabela,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_products';

