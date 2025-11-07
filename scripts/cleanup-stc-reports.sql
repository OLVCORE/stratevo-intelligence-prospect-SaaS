-- 🧹 LIMPEZA SEGURA DE RELATÓRIOS TOTVS
-- Remove apenas relatórios antigos/corrompidos
-- MANTÉM: empresas, configurações, usuários, conversas

-- ========================================
-- 1. LIMPAR HISTÓRICO DE VERIFICAÇÕES STC
-- ========================================
-- Remove todos os relatórios salvos (podem estar corrompidos)
DELETE FROM stc_verification_history;

-- ========================================
-- 2. LIMPAR CACHE DE TOTVS CHECKS
-- ========================================
-- Remove cache de verificações (força novas buscas)
DELETE FROM simple_totvs_checks;

-- ========================================
-- 3. RESETAR STATUS DAS EMPRESAS EM QUARENTENA
-- ========================================
-- Volta todas as empresas para status 'pendente'
UPDATE icp_analysis_results 
SET status = 'pendente',
    analysis_data = NULL
WHERE status IN ('processando', 'concluído', 'rascunho');

-- ========================================
-- 4. LIMPAR RELATÓRIOS DESCARTADOS (OPCIONAL)
-- ========================================
-- Descomente se quiser limpar empresas descartadas também
-- DELETE FROM discarded_companies;

-- ========================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ========================================
SELECT 
  'stc_verification_history' as tabela,
  COUNT(*) as registros
FROM stc_verification_history
UNION ALL
SELECT 
  'simple_totvs_checks' as tabela,
  COUNT(*) as registros
FROM simple_totvs_checks
UNION ALL
SELECT 
  'icp_analysis_results' as tabela,
  COUNT(*) as registros
FROM icp_analysis_results
WHERE status = 'pendente';

-- ========================================
-- ✅ O QUE FOI PRESERVADO:
-- ========================================
-- ✅ Tabela 'companies' (suas 40 empresas)
-- ✅ Tabela 'icp_analysis_results' (mas com status resetado)
-- ✅ Tabela 'users' (usuários)
-- ✅ Tabela 'conversations' (histórico de conversas)
-- ✅ Todas as configurações do sistema

-- ========================================
-- ❌ O QUE FOI REMOVIDO:
-- ========================================
-- ❌ Relatórios salvos antigos (corrompidos)
-- ❌ Cache de verificações TOTVS
-- ❌ Status 'processando'/'concluído' das análises

-- ========================================
-- 🔄 PRÓXIMOS PASSOS:
-- ========================================
-- 1. Executar este script no Supabase SQL Editor
-- 2. Recarregar localhost:5173
-- 3. Abrir qualquer empresa
-- 4. Verificar TOTVS (nova busca, consumirá créditos)
-- 5. Salvar relatório (agora com full_report correto)
-- 6. Testar histórico (deve carregar corretamente)

