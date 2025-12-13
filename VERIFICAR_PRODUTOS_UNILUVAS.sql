-- ==========================================
-- VERIFICAÇÃO DE PRODUTOS - UNILUVAS
-- Tenant ID: 4a542a72-b8d9-4b05-a96d-dba7e2da4761
-- CNPJ: 19426235000178
-- ==========================================

-- 1. CONTAR PRODUTOS NO BANCO
SELECT 
  '📦 TOTAL DE PRODUTOS NO BANCO' as secao,
  COUNT(*) as total_produtos,
  COUNT(DISTINCT categoria) as categorias_diferentes,
  COUNT(DISTINCT nome) as produtos_unicos,
  MIN(created_at) as primeiro_produto,
  MAX(created_at) as ultimo_produto
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761';

-- 2. LISTAR TODOS OS PRODUTOS
SELECT 
  '📋 LISTA DE PRODUTOS' as secao,
  id,
  nome as nome_produto,
  categoria,
  descricao,
  created_at,
  extraido_de,
  confianca_extracao
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
ORDER BY created_at DESC;

-- 3. VERIFICAR PRODUTOS POR DATA DE CRIAÇÃO
SELECT 
  '📅 PRODUTOS POR DATA' as secao,
  DATE(created_at) as data_criacao,
  COUNT(*) as total_produtos
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
GROUP BY DATE(created_at)
ORDER BY data_criacao DESC;

-- 4. VERIFICAR SE HÁ PRODUTOS DUPLICADOS (mesmo nome)
SELECT 
  '🔄 PRODUTOS DUPLICADOS' as secao,
  nome as nome_produto,
  COUNT(*) as quantidade,
  STRING_AGG(id::text, ', ') as ids
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
GROUP BY nome
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 5. VERIFICAR RLS POLICIES
SELECT 
  '🔒 POLÍTICAS RLS' as secao,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'tenant_products';

-- 6. TESTAR ACESSO COM SERVICE_ROLE (simular)
-- NOTA: Isso precisa ser executado com SERVICE_ROLE_KEY
SELECT 
  '🔍 TESTE DE ACESSO' as secao,
  COUNT(*) as produtos_visiveis
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761';

-- 7. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  '🏗️ ESTRUTURA DA TABELA' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
ORDER BY ordinal_position;

-- 8. VERIFICAR ÚLTIMAS INSERÇÕES (últimas 24 horas)
SELECT 
  '⏰ ÚLTIMAS INSERÇÕES (24h)' as secao,
  COUNT(*) as total_ultimas_24h
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
  AND created_at > NOW() - INTERVAL '24 hours';

