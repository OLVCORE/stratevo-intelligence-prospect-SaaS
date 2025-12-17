-- ==========================================
-- 🔧 CORRIGIR CHECK CONSTRAINT DE ORIGEM EM icp_analysis_results
-- ==========================================
-- O constraint atual só permite 3 valores, mas precisamos de mais
-- Vamos remover o constraint antigo e criar um novo mais flexível
-- ==========================================

-- 1. Remover constraint antigo (se existir)
DO $$
BEGIN
  -- Tentar remover constraint por nome
  ALTER TABLE public.icp_analysis_results 
    DROP CONSTRAINT IF EXISTS icp_analysis_results_origem_check;
  
  -- Tentar remover por nome alternativo
  ALTER TABLE public.icp_analysis_results 
    DROP CONSTRAINT IF EXISTS icp_analysis_results_origem_check1;
  
  RAISE NOTICE '✅ Constraints antigos removidos (se existiam)';
END $$;

-- 2. Criar novo constraint mais flexível (ou remover completamente se preferir)
-- Opção 1: Remover constraint completamente (permite qualquer valor)
ALTER TABLE public.icp_analysis_results 
  DROP CONSTRAINT IF EXISTS icp_analysis_results_origem_check;

-- Opção 2: Criar constraint mais flexível (comentado - descomente se preferir)
-- ALTER TABLE public.icp_analysis_results 
--   ADD CONSTRAINT icp_analysis_results_origem_check 
--   CHECK (origem IS NULL OR origem IN (
--     'upload_massa',
--     'icp_individual',
--     'icp_massa',
--     'qualification_engine',
--     'estoque',
--     'legacy',
--     'csv_upload',
--     'excel_upload',
--     'google_sheets',
--     'api_empresas_aqui'
--   ));

-- 3. Comentário explicativo
COMMENT ON COLUMN public.icp_analysis_results.origem IS 
  'Origem da empresa: upload_massa, icp_individual, icp_massa, qualification_engine, estoque, legacy, ou nome do arquivo (CSV/XLSX/Google Sheets/API)';

