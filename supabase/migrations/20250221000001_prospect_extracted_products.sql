-- 🆕 NOVA TABELA: Produtos extraídos de empresas prospectadas
-- Isolada, não interfere com tenant_products ou tenant_competitor_products

CREATE TABLE IF NOT EXISTS prospect_extracted_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qualified_prospect_id uuid NOT NULL REFERENCES qualified_prospects(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Dados do produto extraído
  nome text NOT NULL,
  descricao text,
  categoria text,
  subcategoria text,
  codigo_interno text,
  
  -- Origem da extração
  fonte text NOT NULL, -- 'website' ou 'linkedin'
  url_origem text,
  confianca_extracao numeric(3,2) DEFAULT 0.5, -- 0.00 a 1.00
  
  -- Metadados
  extraido_em timestamptz NOT NULL DEFAULT now(),
  dados_brutos jsonb, -- Dados completos da extração
  
  -- Constraints
  UNIQUE(qualified_prospect_id, nome, fonte) -- Evitar duplicatas
);

-- Índices para performance
CREATE INDEX idx_prospect_products_prospect ON prospect_extracted_products(qualified_prospect_id);
CREATE INDEX idx_prospect_products_tenant ON prospect_extracted_products(tenant_id);
CREATE INDEX idx_prospect_products_categoria ON prospect_extracted_products(categoria);

-- RLS: Permitir acesso apenas ao próprio tenant
ALTER TABLE prospect_extracted_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant prospect products"
  ON prospect_extracted_products FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert prospect products"
  ON prospect_extracted_products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own tenant prospect products"
  ON prospect_extracted_products FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- 🔥 ADICIONAR COLUNAS NA TABELA qualified_prospects (se não existirem)
DO $$ 
BEGIN
  -- Website encontrado automaticamente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE qualified_prospects ADD COLUMN website_encontrado text;
  END IF;
  
  -- Score de fit do website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE qualified_prospects ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
  END IF;
  
  -- Produtos compatíveis encontrados no website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE qualified_prospects ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  -- LinkedIn da empresa (se encontrado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qualified_prospects' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE qualified_prospects ADD COLUMN linkedin_url text;
  END IF;
END $$;

