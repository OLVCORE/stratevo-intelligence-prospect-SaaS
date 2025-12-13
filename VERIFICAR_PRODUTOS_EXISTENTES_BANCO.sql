-- ==========================================
-- 🔍 VERIFICAR PRODUTOS EXISTENTES NO BANCO
-- ==========================================
-- Verificar se há produtos que podem estar sendo detectados como duplicatas
-- ==========================================

-- 1. PRODUTOS DO TENANT (Uniluvas)
SELECT 
  '📦 PRODUTOS DO TENANT NO BANCO' as secao,
  id,
  nome,
  categoria,
  created_at,
  LOWER(TRIM(nome)) as nome_normalizado
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
ORDER BY created_at DESC;

-- 2. PRODUTOS DE CONCORRENTES (Uniluvas)
SELECT 
  '🏢 PRODUTOS DE CONCORRENTES NO BANCO' as secao,
  id,
  nome,
  categoria,
  competitor_name,
  created_at,
  LOWER(TRIM(nome)) as nome_normalizado
FROM tenant_competitor_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
ORDER BY created_at DESC;

-- 3. VERIFICAR SE HÁ PRODUTOS COM NOMES SIMILARES (que podem ser detectados como duplicatas)
SELECT 
  '🔄 POSSÍVEIS DUPLICATAS POR NOME SIMILAR' as secao,
  LOWER(TRIM(nome)) as nome_normalizado,
  COUNT(*) as quantidade,
  STRING_AGG(nome, ' | ') as nomes_originais,
  STRING_AGG(id::text, ', ') as ids
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
GROUP BY LOWER(TRIM(nome))
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 4. CONTAR TOTAL DE PRODUTOS
SELECT 
  '📊 RESUMO' as secao,
  (SELECT COUNT(*) FROM tenant_products WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761') as total_tenant,
  (SELECT COUNT(*) FROM tenant_competitor_products WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761') as total_competitor,
  (SELECT COUNT(DISTINCT LOWER(TRIM(nome))) FROM tenant_products WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761') as produtos_unicos_tenant,
  (SELECT COUNT(DISTINCT LOWER(TRIM(nome))) FROM tenant_competitor_products WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761') as produtos_unicos_competitor;

