-- ==========================================
-- 🔍 VERIFICAR TODAS AS COLUNAS QUE PODEM ESTAR FALTANDO
-- ==========================================
-- Comparar com o que a Edge Function tenta inserir
-- ==========================================

-- 1. COLUNAS QUE A EDGE FUNCTION TENTA INSERIR
-- (baseado no código scan-website-products/index.ts)
SELECT 
  '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION' as secao,
  'tenant_id' as coluna,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'tenant_id') THEN '✅' ELSE '❌' END as existe
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'nome', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'nome') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'descricao', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'descricao') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'categoria', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'categoria') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'subcategoria', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'subcategoria') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'codigo_interno', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'codigo_interno') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'setores_alvo', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'setores_alvo') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'diferenciais', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'diferenciais') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'extraido_de', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'extraido_de') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'confianca_extracao', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'confianca_extracao') THEN '✅' ELSE '❌' END
UNION ALL
SELECT '🔍 COLUNAS ESPERADAS PELA EDGE FUNCTION', 'dados_extraidos', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_products' AND column_name = 'dados_extraidos') THEN '✅' ELSE '❌' END
ORDER BY coluna;

