-- ==========================================
-- VERIFICAR E CORRIGIR CAMPOS DE WEBSITE
-- ==========================================
-- Garante que os campos existam e tenham os tipos corretos

-- 1. Verificar e adicionar campos se não existirem
DO $$
BEGIN
  -- website_encontrado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' 
    AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE qualified_prospects 
      ADD COLUMN website_encontrado text;
    RAISE NOTICE 'Campo website_encontrado adicionado';
  END IF;

  -- linkedin_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' 
    AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE qualified_prospects 
      ADD COLUMN linkedin_url text;
    RAISE NOTICE 'Campo linkedin_url adicionado';
  END IF;

  -- website_fit_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' 
    AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE qualified_prospects 
      ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
    RAISE NOTICE 'Campo website_fit_score adicionado';
  END IF;

  -- website_products_match
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' 
    AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE qualified_prospects 
      ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Campo website_products_match adicionado';
  END IF;
END $$;

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_website_encontrado 
  ON qualified_prospects(website_encontrado) 
  WHERE website_encontrado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qualified_prospects_linkedin_url 
  ON qualified_prospects(linkedin_url) 
  WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qualified_prospects_website_fit_score 
  ON qualified_prospects(website_fit_score DESC) 
  WHERE website_fit_score > 0;

-- 3. Adicionar comentários
COMMENT ON COLUMN qualified_prospects.website_encontrado IS 'Website oficial encontrado via busca (SERPER/Google)';
COMMENT ON COLUMN qualified_prospects.linkedin_url IS 'URL do LinkedIn da empresa encontrada via busca';
COMMENT ON COLUMN qualified_prospects.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN qualified_prospects.website_products_match IS 'Array de produtos compatíveis encontrados no website';

