-- =====================================================
-- 🔍 VERIFICAR ESTRUTURA COMPLETA DA TABELA
-- =====================================================
-- Identificar todas as colunas e suas constraints
-- =====================================================

-- 1. TODAS AS COLUNAS COM TIPOS E CONSTRAINTS
SELECT 
  '📋 ESTRUTURA COMPLETA' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTE COLUNA product_name
SELECT 
  '🔍 VERIFICAR product_name' as secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'product_name'
    ) THEN '❌ EXISTE - PROBLEMA!'
    ELSE '✅ NÃO EXISTE - OK'
  END as status;

-- 3. VERIFICAR SE EXISTE COLUNA nome
SELECT 
  '🔍 VERIFICAR nome' as secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'nome'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - PROBLEMA!'
  END as status;

-- 4. VERIFICAR CONSTRAINTS NOT NULL
SELECT 
  '🔒 CONSTRAINTS NOT NULL' as secao,
  column_name,
  is_nullable,
  CASE 
    WHEN is_nullable = 'NO' THEN '❌ NOT NULL'
    ELSE '✅ NULL PERMITIDO'
  END as constraint_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND is_nullable = 'NO'
ORDER BY column_name;

