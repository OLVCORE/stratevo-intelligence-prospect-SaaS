-- ============================================================
-- SCRIPT PARA LIMPAR BASE DE DADOS DE TESTE
-- ============================================================
-- ⚠️ ATENÇÃO: Este script DELETA TUDO! Use com cuidado!
-- ============================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE (facilita limpeza)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE icp_analysis_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE discarded_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE stc_verification_history DISABLE ROW LEVEL SECURITY;

-- 2. DELETAR TODOS OS DEALS
DELETE FROM sdr_deals;
DELETE FROM deal_health_scores;
DELETE FROM sdr_deal_activities;

-- 3. DELETAR ANÁLISES ICP
DELETE FROM icp_analysis_results;

-- 4. DELETAR EMPRESAS DESCARTADAS
DELETE FROM discarded_companies;

-- 5. DELETAR HISTÓRICO STC
DELETE FROM stc_verification_history;

-- 6. DELETAR TODAS AS EMPRESAS
DELETE FROM companies;

-- 7. RESETAR SEQUÊNCIAS (se houver)
-- (Não é necessário se estamos usando UUIDs)

-- 8. REABILITAR RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE discarded_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

-- 9. VERIFICAR LIMPEZA
SELECT 
  'companies' as tabela, 
  COUNT(*) as registros 
FROM companies
UNION ALL
SELECT 
  'icp_analysis_results', 
  COUNT(*) 
FROM icp_analysis_results
UNION ALL
SELECT 
  'sdr_deals', 
  COUNT(*) 
FROM sdr_deals
UNION ALL
SELECT 
  'discarded_companies', 
  COUNT(*) 
FROM discarded_companies
UNION ALL
SELECT 
  'stc_verification_history', 
  COUNT(*) 
FROM stc_verification_history;

-- ✅ BASE LIMPA! Pronto para testar rastreabilidade com uploads nomeados.

-- ============================================================
-- PRÓXIMOS PASSOS:
-- ============================================================
-- 1. Execute ADICIONAR_RASTREABILIDADE.sql (se ainda não executou)
-- 2. Faça upload de 3 CSVs com nomes diferentes:
--    - "Prospecção Q1 2025" (100 empresas)
--    - "Leads Manuais Filtrados" (40 empresas)
--    - "Teste Aleatório" (30 empresas)
-- 3. Valide que source_name aparece em todas as tabelas
-- ============================================================

