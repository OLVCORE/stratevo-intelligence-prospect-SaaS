-- =============================================================================
-- ETAPA 1 — CONFIRMAÇÃO TÉCNICA (EVIDÊNCIA OBRIGATÓRIA)
-- PROMPT CIRÚRGICO: Discovery / Tenant / Product Fit
-- NÃO declarar tabela "vazia" sem evidência SQL.
-- =============================================================================
-- Execute no Supabase SQL Editor e anexe o resultado ao RELATORIO_DISCOVERY_CATALOGO_E_FIT_REAL.md
-- =============================================================================

-- 1) Quantidade total por tenant em tenant_products
SELECT 
  t.id AS tenant_id,
  t.nome AS tenant_name,
  COUNT(tp.id) AS total_produtos,
  COUNT(*) FILTER (WHERE (tp.ativo IS NOT FALSE OR tp.ativo IS NULL)) AS ativos
FROM tenants t
LEFT JOIN tenant_products tp ON tp.tenant_id = t.id
GROUP BY t.id, t.nome
ORDER BY total_produtos DESC;

-- 2) Categorias distintas em tenant_products (por tenant)
SELECT 
  tp.tenant_id,
  COUNT(DISTINCT tp.categoria) AS categorias_distintas,
  array_agg(DISTINCT tp.categoria) FILTER (WHERE tp.categoria IS NOT NULL) AS categorias
FROM tenant_products tp
GROUP BY tp.tenant_id;

-- 3) Origem dos produtos (extraido_de, manual, website, etc.)
SELECT 
  COALESCE(tp.extraido_de, 'manual') AS origem,
  COUNT(*) AS quantidade
FROM tenant_products tp
GROUP BY COALESCE(tp.extraido_de, 'manual');

-- 4) Amostra para OLV / tenant com mais produtos (evidência “25 serviços”)
SELECT 
  tp.id,
  tp.nome,
  tp.categoria,
  tp.descricao,
  COALESCE(tp.extraido_de, 'manual') AS origem
FROM tenant_products tp
WHERE tp.tenant_id = (SELECT id FROM tenants ORDER BY (SELECT COUNT(*) FROM tenant_products tp2 WHERE tp2.tenant_id = tenants.id) DESC LIMIT 1)
ORDER BY tp.created_at DESC
LIMIT 30;

-- 5) Existência de tenant_product_categories (se existir)
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'tenant_product_categories'
) AS existe_tenant_product_categories;

-- 6) Colunas reais de tenant_products (schema)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tenant_products'
ORDER BY ordinal_position;
