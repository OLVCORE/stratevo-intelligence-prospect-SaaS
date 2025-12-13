-- ==========================================
-- 🔍 VERIFICAR ESTRUTURA REAL DAS TABELAS
-- ==========================================
-- Ver quais colunas realmente existem
-- ==========================================

-- 1. COLUNAS DE tenant_products
SELECT 
  '📦 COLUNAS tenant_products' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
ORDER BY ordinal_position;

-- 2. COLUNAS DE tenant_competitor_products
SELECT 
  '🏢 COLUNAS tenant_competitor_products' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_competitor_products'
ORDER BY ordinal_position;

