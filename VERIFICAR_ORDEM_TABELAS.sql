-- Script de verificação: verificar se as tabelas necessárias existem
-- Execute este script ANTES de aplicar APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql

SELECT 
  table_schema,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'icp_profiles_metadata', 'icp_generation_counters')
ORDER BY table_name;

-- Se a tabela tenants não existir, isso pode causar problemas
-- Verifique se você já aplicou as migrations básicas do sistema

