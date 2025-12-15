-- ==========================================
-- 🔍 VERIFICAR SE MIGRATION FOI APLICADA
-- ==========================================
-- Execute este script no Supabase SQL Editor
-- para verificar se a coluna tenant_id existe
-- ==========================================

-- 1. VERIFICAR SE COLUNA tenant_id EXISTE
SELECT 
  '🔍 VERIFICAÇÃO DE COLUNA tenant_id' as secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results' 
      AND column_name = 'tenant_id'
    ) THEN '✅ COLUNA tenant_id EXISTE'
    ELSE '❌ COLUNA tenant_id NÃO EXISTE - PRECISA APLICAR MIGRATION'
  END as status;

-- 2. VER TODAS AS COLUNAS DE icp_analysis_results
SELECT 
  '📋 COLUNAS DA TABELA icp_analysis_results' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'icp_analysis_results'
ORDER BY ordinal_position;

-- 3. VERIFICAR CONSTRAINTS (CHECK) NA TABELA
SELECT 
  '🔒 CONSTRAINTS DA TABELA' as secao,
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'icp_analysis_results'
  AND tc.constraint_type = 'CHECK';

-- 4. VERIFICAR POLÍTICAS RLS
SELECT 
  '🛡️ POLÍTICAS RLS' as secao,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'icp_analysis_results'
ORDER BY cmd, policyname;

-- 5. CONTAR REGISTROS POR TENANT (se coluna existir)
SELECT 
  '📊 REGISTROS POR TENANT' as secao,
  tenant_id,
  COUNT(*) as total
FROM icp_analysis_results
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id
ORDER BY total DESC;

