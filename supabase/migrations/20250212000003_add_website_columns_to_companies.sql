-- ==========================================
-- ADICIONAR COLUNAS DE WEBSITE EM companies
-- ==========================================
-- Adiciona colunas website_encontrado, website_fit_score, linkedin_url
-- para exibição na tabela "Gerenciar Empresas"

DO $$ 
BEGIN
  -- Website encontrado automaticamente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE companies ADD COLUMN website_encontrado text;
  END IF;
  
  -- Score de fit do website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE companies ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
  END IF;
  
  -- Produtos compatíveis encontrados no website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE companies ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  -- LinkedIn da empresa (se encontrado) - já existe linkedin_url, mas vamos garantir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN linkedin_url text;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN companies.website_encontrado IS 'Website oficial da empresa encontrado automaticamente via SERPER';
COMMENT ON COLUMN companies.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN companies.website_products_match IS 'Array de produtos compatíveis encontrados no website';
COMMENT ON COLUMN companies.linkedin_url IS 'URL do LinkedIn da empresa (se encontrado)';

