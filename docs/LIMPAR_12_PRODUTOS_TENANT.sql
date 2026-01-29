-- =============================================================================
-- LIMPAR OS 12 PRODUTOS ERRADOS DO TENANT
-- (produtos que vieram do prospect por engano para tenant_products)
-- Executar no Supabase SQL Editor
-- tenant_id: f23bdc79-a26a-4ebc-a87a-01a37177a623
-- =============================================================================

-- 1. VER os produtos mais recentes (confirmar antes de deletar)
-- Schema: nome, categoria (20250201000001_tenant_products_catalog)
SELECT 
  id, 
  nome, 
  categoria, 
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS data_criacao
FROM tenant_products 
WHERE tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623'
ORDER BY created_at DESC 
LIMIT 15;

-- 2. DELETAR os últimos 12 produtos (que vieram do prospect por engano)
-- ⚠️ ATENÇÃO: Confirme visualmente os IDs do passo 1 antes de executar!
DELETE FROM tenant_products
WHERE id IN (
  SELECT id 
  FROM tenant_products 
  WHERE tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623'
  ORDER BY created_at DESC 
  LIMIT 12
);

-- 3. VERIFICAR quantos produtos restaram (esperado: 13)
SELECT COUNT(*) AS total_produtos_tenant
FROM tenant_products 
WHERE tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623';

-- 4. OPCIONAL: Ver quais produtos permaneceram
SELECT id, nome, categoria, created_at
FROM tenant_products 
WHERE tenant_id = 'f23bdc79-a26a-4ebc-a87a-01a37177a623'
ORDER BY created_at DESC;
