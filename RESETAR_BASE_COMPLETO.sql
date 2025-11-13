-- ============================================================================
-- RESETAR BASE COMPLETO - DELETAR TODAS AS EMPRESAS DE TESTE
-- ============================================================================

-- ⚠️ CUIDADO: Este SQL deleta TUDO!
-- Execute apenas se tem certeza que quer começar do zero

-- PASSO 1: Deletar decisores
DELETE FROM decision_makers;

-- PASSO 2: Deletar empresas
DELETE FROM companies;

-- PASSO 3: Deletar quarentena ICP
DELETE FROM icp_analysis_results;

-- PASSO 4: Deletar relatórios TOTVS
DELETE FROM stc_verification_history;

-- PASSO 5: Deletar empresas descartadas
DELETE FROM discarded_companies;

-- PASSO 6: Deletar leads aprovados (se tiver)
DELETE FROM leads_pool;

-- PASSO 7: VERIFICAR (tudo deve estar 0)
SELECT 
  (SELECT COUNT(*) FROM companies) as total_companies,
  (SELECT COUNT(*) FROM decision_makers) as total_decisores,
  (SELECT COUNT(*) FROM icp_analysis_results) as total_quarentena,
  (SELECT COUNT(*) FROM stc_verification_history) as total_relatorios;

-- ============================================================================
-- RESULTADO ESPERADO: Tudo zerado, pronto para importar empresas REAIS!
-- ============================================================================

