-- ==========================================
-- ADICIONAR CAMPOS DE WEBSITE E LINKEDIN
-- ==========================================
-- Adiciona campos necessários para enriquecimento de website
-- em qualified_prospects

-- 1. Adicionar campos de website e LinkedIn
ALTER TABLE qualified_prospects 
  ADD COLUMN IF NOT EXISTS website_encontrado text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS website_fit_score numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website_products_match jsonb DEFAULT '[]'::jsonb;

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_website_encontrado 
  ON qualified_prospects(website_encontrado) 
  WHERE website_encontrado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qualified_prospects_linkedin_url 
  ON qualified_prospects(linkedin_url) 
  WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qualified_prospects_website_fit_score 
  ON qualified_prospects(website_fit_score DESC) 
  WHERE website_fit_score > 0;

-- 3. Comentários
COMMENT ON COLUMN qualified_prospects.website_encontrado IS 'Website oficial encontrado via busca (SERPER/Google)';
COMMENT ON COLUMN qualified_prospects.linkedin_url IS 'URL do LinkedIn da empresa encontrada via busca';
COMMENT ON COLUMN qualified_prospects.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN qualified_prospects.website_products_match IS 'Array de produtos compatíveis encontrados no website';

