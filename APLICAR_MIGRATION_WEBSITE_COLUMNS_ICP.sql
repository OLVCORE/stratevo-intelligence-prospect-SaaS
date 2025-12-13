-- ==========================================
-- 🚨 APLICAR ESTE SCRIPT NO SUPABASE DASHBOARD SQL EDITOR
-- ==========================================
-- Adiciona colunas website_encontrado, website_fit_score, linkedin_url
-- na tabela icp_analysis_results

DO $$ 
BEGIN
  -- Website encontrado automaticamente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'icp_analysis_results' AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE icp_analysis_results ADD COLUMN website_encontrado text;
  END IF;
  
  -- Score de fit do website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'icp_analysis_results' AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE icp_analysis_results ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
  END IF;
  
  -- Produtos compatíveis encontrados no website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'icp_analysis_results' AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE icp_analysis_results ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  -- LinkedIn da empresa (se encontrado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'icp_analysis_results' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE icp_analysis_results ADD COLUMN linkedin_url text;
  END IF;
END $$;

