-- =====================================================
-- APLICAR MIGRATION: tenant_competitor_products
-- =====================================================
-- 
-- Execute este SQL no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole este código > Run
--
-- =====================================================

-- 1. TABELA: Produtos dos Concorrentes
CREATE TABLE IF NOT EXISTS tenant_competitor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Referência ao concorrente (pode ser CNPJ ou nome)
  competitor_cnpj VARCHAR(20),
  competitor_name VARCHAR(255) NOT NULL,
  
  -- Dados do produto extraído
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  preco_minimo DECIMAL(15,2),
  preco_maximo DECIMAL(15,2),
  ticket_medio DECIMAL(15,2),
  
  -- Fonte da extração
  source_url TEXT NOT NULL, -- URL que foi escaneada
  source_type VARCHAR(20), -- 'website', 'instagram', 'linkedin', 'facebook'
  extraido_de TEXT, -- 'website_scan', 'instagram_scan', 'linkedin_scan'
  
  -- Metadados de extração
  dados_extraidos JSONB, -- Dados brutos da extração
  confianca_extracao DECIMAL(3,2), -- 0.00 a 1.00
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(descricao, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(categoria, '')), 'C')
  ) STORED
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_competitor_products_tenant ON tenant_competitor_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_cnpj ON tenant_competitor_products(competitor_cnpj);
CREATE INDEX IF NOT EXISTS idx_competitor_products_search ON tenant_competitor_products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_competitor_products_source ON tenant_competitor_products(source_url);

-- 3. RLS
ALTER TABLE tenant_competitor_products ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir
DROP POLICY IF EXISTS "tenant_competitor_products_policy" ON tenant_competitor_products;

CREATE POLICY "tenant_competitor_products_policy" ON tenant_competitor_products
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- 4. TRIGGER para updated_at (criar função se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_competitor_products_updated_at ON tenant_competitor_products;

CREATE TRIGGER update_competitor_products_updated_at
  BEFORE UPDATE ON tenant_competitor_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. COMENTÁRIOS
COMMENT ON TABLE tenant_competitor_products IS 'Produtos extraídos dos websites/redes sociais dos concorrentes do tenant';

-- ✅ Migration aplicada com sucesso!

