-- ==========================================
-- 🔧 CORREÇÃO: Verificação de Duplicatas Muito Restritiva
-- ==========================================
-- PROBLEMA IDENTIFICADO:
-- A verificação de duplicatas em scan-website-products usa apenas:
--   .eq('tenant_id', tenant_id)
--   .ilike('nome', product.nome.trim())
--
-- Isso pode estar detectando produtos antigos como duplicatas mesmo quando não são.
--
-- SOLUÇÃO:
-- Adicionar filtro por extraido_de ou data para evitar falsos positivos
-- ==========================================

-- 1. Verificar se há produtos antigos que podem estar bloqueando
SELECT 
  '🔍 PRODUTOS ANTIGOS QUE PODEM ESTAR BLOQUEANDO' as secao,
  COUNT(*) as total_produtos_antigos,
  MIN(created_at) as primeiro_produto,
  MAX(created_at) as ultimo_produto
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
  AND created_at < NOW() - INTERVAL '7 days'; -- Produtos com mais de 7 dias

-- 2. Verificar produtos com nomes similares (que podem ser detectados como duplicatas)
SELECT 
  '🔄 PRODUTOS COM NOMES SIMILARES' as secao,
  LOWER(TRIM(nome)) as nome_normalizado,
  COUNT(*) as quantidade,
  STRING_AGG(nome, ' | ') as nomes_originais
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
GROUP BY LOWER(TRIM(nome))
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

