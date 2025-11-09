-- 🗑️ SCRIPT PARA LIMPAR TODAS AS EMPRESAS DE TESTE
-- Execute no Supabase SQL Editor

-- ⚠️ ATENÇÃO: Este script vai deletar TODAS as empresas!
-- Se quiser manter alguma, NÃO execute!

-- 1️⃣ DELETAR EMPRESAS DA QUARENTENA ICP
DELETE FROM icp_analysis_results;

-- 2️⃣ DELETAR POOL DE LEADS (se existir)
DELETE FROM leads_pool;

-- 3️⃣ DELETAR EMPRESAS DO ESTOQUE
DELETE FROM companies;

-- 4️⃣ DELETAR DECISORES (OPCIONAL - se quiser limpar tudo)
-- DELETE FROM decision_makers;

-- ✅ PRONTO! Banco zerado e limpo para novos testes!

-- 📊 VERIFICAR SE DELETOU TUDO:
SELECT 'companies' as tabela, COUNT(*) as total FROM companies
UNION ALL
SELECT 'icp_analysis_results', COUNT(*) FROM icp_analysis_results
UNION ALL
SELECT 'leads_pool', COUNT(*) FROM leads_pool;

-- Resultado esperado: 0 em todas as tabelas

-- 📝 NOTA: Suas tabelas usam UUID (não sequences)
-- Não é necessário resetar contadores!

