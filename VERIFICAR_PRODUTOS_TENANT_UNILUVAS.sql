-- =====================================================
-- 🔍 VERIFICAR PRODUTOS DO TENANT UNILUVAS
-- =====================================================
-- Tenant ID: 4a542a72-b8d9-4b05-a96d-dba7e2da4761
-- =====================================================

-- 1. CONTAR TOTAL DE PRODUTOS
SELECT 
  '📊 TOTAL DE PRODUTOS' as secao,
  COUNT(*) as total_produtos,
  COUNT(DISTINCT nome) as produtos_unicos,
  MIN(created_at) as primeiro_produto,
  MAX(created_at) as ultimo_produto
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761';

-- 2. LISTAR TODOS OS PRODUTOS
SELECT 
  '📦 LISTA DE PRODUTOS' as secao,
  id,
  nome,
  categoria,
  subcategoria,
  codigo_interno,
  extraido_de,
  confianca_extracao,
  created_at
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
ORDER BY created_at DESC;

-- 3. PRODUTOS POR DATA DE CRIAÇÃO
SELECT 
  '📅 PRODUTOS POR DATA' as secao,
  DATE(created_at) as data_criacao,
  COUNT(*) as total_produtos
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
GROUP BY DATE(created_at)
ORDER BY data_criacao DESC;

-- 4. PRODUTOS ÚLTIMAS 24 HORAS
SELECT 
  '⏰ ÚLTIMAS 24 HORAS' as secao,
  COUNT(*) as total_ultimas_24h
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
  AND created_at > NOW() - INTERVAL '24 hours';

