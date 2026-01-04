-- ============================================================================
-- Script de Verificação: Dados CNAE Classifications
-- ============================================================================
-- Execute este script no Supabase SQL Editor para verificar se os dados foram inseridos corretamente
-- ============================================================================

-- 1. Contar total de registros
SELECT COUNT(*) as total_registros FROM public.cnae_classifications;

-- 2. Verificar alguns registros de exemplo
SELECT * FROM public.cnae_classifications 
ORDER BY cnae_code 
LIMIT 10;

-- 3. Verificar setores únicos
SELECT DISTINCT setor_industria, COUNT(*) as quantidade
FROM public.cnae_classifications
GROUP BY setor_industria
ORDER BY quantidade DESC
LIMIT 20;

-- 4. Verificar categorias únicas
SELECT DISTINCT categoria, COUNT(*) as quantidade
FROM public.cnae_classifications
GROUP BY categoria
ORDER BY quantidade DESC
LIMIT 20;

-- 5. Testar função de busca por CNAE
SELECT * FROM public.get_cnae_classification('6201-5/00');

-- 6. Testar função de busca por Setor
SELECT * FROM public.get_cnaes_by_setor_categoria('Tecnologia da Informação', NULL)
LIMIT 10;

-- 7. Verificar se há registros duplicados
SELECT cnae_code, COUNT(*) as duplicados
FROM public.cnae_classifications
GROUP BY cnae_code
HAVING COUNT(*) > 1;

