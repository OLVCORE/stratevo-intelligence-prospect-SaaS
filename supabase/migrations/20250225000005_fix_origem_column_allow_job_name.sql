-- ==========================================
-- CORRIGIR COLUNA ORIGEM PARA PERMITIR NOME DO ARQUIVO
-- ==========================================
-- Esta migration remove o CHECK constraint da coluna origem em icp_analysis_results
-- para permitir que mostre o job_name (nome do arquivo) ao invés de apenas valores fixos
-- ==========================================

-- Remover CHECK constraint antigo que limita valores
ALTER TABLE public.icp_analysis_results 
  DROP CONSTRAINT IF EXISTS icp_analysis_results_origem_check;

-- Alterar coluna para permitir qualquer texto (nome do arquivo)
ALTER TABLE public.icp_analysis_results 
  ALTER COLUMN origem TYPE TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.icp_analysis_results.origem IS 'Origem da empresa: nome do arquivo de upload (job_name) ou tipo de origem (upload_massa, icp_individual, icp_massa)';

-- Fazer o mesmo para companies se tiver constraint
ALTER TABLE public.companies 
  DROP CONSTRAINT IF EXISTS companies_origem_check;

ALTER TABLE public.companies 
  ALTER COLUMN origem TYPE TEXT;

COMMENT ON COLUMN public.companies.origem IS 'Origem da empresa: nome do arquivo de upload (job_name) ou tipo de origem';
