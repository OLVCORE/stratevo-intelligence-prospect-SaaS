-- ==========================================
-- 🔧 ATUALIZAR ORIGEM DE EMPRESAS EXISTENTES
-- ==========================================
-- Execute este script no Supabase SQL Editor para atualizar
-- a origem de todas as empresas que já existem no banco
-- ==========================================

-- Verificar quantas empresas precisam ser atualizadas
SELECT 
  COUNT(*) as total_empresas,
  COUNT(CASE WHEN origem IS NULL OR origem IN ('Legacy', 'qualification_engine', 'upload_massa') THEN 1 END) as precisam_atualizacao
FROM public.companies;

-- Verificar quantos registros ICP precisam ser atualizados
SELECT 
  COUNT(*) as total_icp,
  COUNT(CASE WHEN origem IS NULL OR origem IN ('upload_massa', 'icp_individual') THEN 1 END) as precisam_atualizacao
FROM public.icp_analysis_results;

-- ==========================================
-- EXECUTAR ATUALIZAÇÃO
-- ==========================================
-- Copie e cole o conteúdo do arquivo:
-- supabase/migrations/20250224000005_update_existing_companies_origem.sql
-- ==========================================

