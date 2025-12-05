-- ========================================
-- 🗑️ DELETAR TODAS AS EMPRESAS DE TESTE
-- ========================================
-- ⚠️ ATENÇÃO: Isso vai DELETAR TUDO para começar do zero!
-- Use apenas em ambiente de desenvolvimento/teste

-- 🔐 DESABILITAR RLS TEMPORARIAMENTE (para poder deletar tudo)
ALTER TABLE icp_analysis_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads_qualified DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads_pool DISABLE ROW LEVEL SECURITY;

-- 📊 VER QUANTAS EMPRESAS EXISTEM ANTES
SELECT 
  'companies' as tabela,
  COUNT(*) as total
FROM companies
UNION ALL
SELECT 
  'icp_analysis_results' as tabela,
  COUNT(*) as total
FROM icp_analysis_results
UNION ALL
SELECT 
  'sdr_deals' as tabela,
  COUNT(*) as total
FROM sdr_deals
UNION ALL
SELECT 
  'leads_qualified' as tabela,
  COUNT(*) as total
FROM leads_qualified
UNION ALL
SELECT 
  'leads_pool' as tabela,
  COUNT(*) as total
FROM leads_pool;

-- ========================================
-- 🗑️ DELETAR EM CASCATA (ORDEM CORRETA)
-- ========================================

-- 1. Deletar Deals (Pipeline) primeiro
DELETE FROM sdr_deals;
SELECT 'Deals deletados' as status, COUNT(*) FROM sdr_deals;

-- 2. Deletar Leads Qualified e Pool
DELETE FROM leads_qualified;
DELETE FROM leads_pool;
SELECT 'Leads deletados' as status, COUNT(*) FROM leads_qualified;

-- 3. Deletar Análises ICP (Quarentena + Aprovados)
DELETE FROM icp_analysis_results;
SELECT 'Análises ICP deletadas' as status, COUNT(*) FROM icp_analysis_results;

-- 4. Deletar Empresas (Base de Empresas)
DELETE FROM companies;
SELECT 'Empresas deletadas' as status, COUNT(*) FROM companies;

-- ========================================
-- 🔄 RESETAR SEQUÊNCIAS (IDs voltam para 1)
-- ========================================

-- Não é necessário - UUID não usa sequence

-- ========================================
-- 🔐 REABILITAR RLS
-- ========================================

ALTER TABLE icp_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_qualified ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ✅ VERIFICAR QUE ESTÁ TUDO VAZIO
-- ========================================

SELECT 
  'companies' as tabela,
  COUNT(*) as total_apos_delete
FROM companies
UNION ALL
SELECT 
  'icp_analysis_results' as tabela,
  COUNT(*) as total_apos_delete
FROM icp_analysis_results
UNION ALL
SELECT 
  'sdr_deals' as tabela,
  COUNT(*) as total_apos_delete
FROM sdr_deals;

-- ========================================
-- 🎯 RESULTADO ESPERADO:
-- ========================================
-- companies: 0
-- icp_analysis_results: 0
-- sdr_deals: 0
-- leads_qualified: 0
-- leads_pool: 0

-- ✅ PRONTO PARA COMEÇAR DO ZERO!

