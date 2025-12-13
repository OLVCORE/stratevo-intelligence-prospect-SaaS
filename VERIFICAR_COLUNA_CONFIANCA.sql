-- ==========================================
-- 🔍 VERIFICAR SE COLUNA confianca_extracao EXISTE
-- ==========================================

-- 1. VERIFICAR COLUNAS DE tenant_products
SELECT 
  '📦 COLUNAS tenant_products' as secao,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND column_name IN ('confianca_extracao', 'extraido_de', 'dados_extraidos', 'nome', 'categoria')
ORDER BY column_name;

-- 2. VERIFICAR SE COLUNA EXISTE (resultado direto)
SELECT 
  '✅/❌ COLUNA confianca_extracao' as secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'confianca_extracao'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - PRECISA CRIAR'
  END as status;

