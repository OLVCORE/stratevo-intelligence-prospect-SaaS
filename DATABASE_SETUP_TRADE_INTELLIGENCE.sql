-- ============================================================================
-- OLV TRADE INTELLIGENCE - DATABASE SETUP
-- ============================================================================
-- Execute este script NO NOVO PROJETO Supabase (trade.olv.com.br)
-- ============================================================================

-- 1️⃣ CRIAR TABELA TENANTS (Clientes da plataforma SaaS)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cnpj TEXT UNIQUE,
  website TEXT,
  industry TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0052CC',
  secondary_color TEXT DEFAULT '#00B8D9',
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'pro', -- 'starter', 'pro', 'enterprise'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  monthly_price_brl DECIMAL DEFAULT 2997.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_cnpj ON tenants(cnpj);

-- 2️⃣ CRIAR TABELA WORKSPACES (Operações dentro de cada tenant)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('domestic', 'export', 'import')),
  description TEXT,
  target_countries TEXT[], -- ['US', 'DE', 'JP']
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_tenant_workspace_type UNIQUE(tenant_id, type)
);

-- Índices
CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX idx_workspaces_type ON workspaces(type);

-- 3️⃣ CRIAR TABELA TENANT_PRODUCTS (Catálogo de produtos)
CREATE TABLE IF NOT EXISTS tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT,
  hs_code TEXT, -- Código NCM/SH internacional (ex: 9506.91.00)
  price_brl DECIMAL,
  price_usd DECIMAL,
  price_eur DECIMAL,
  moq INTEGER, -- Minimum Order Quantity
  lead_time_days INTEGER,
  weight_kg DECIMAL,
  dimensions_cm TEXT, -- "100x50x30"
  certifications TEXT[], -- ['ISO 9001', 'CE', 'FDA']
  target_segments TEXT[], -- ['Pilates Studios', 'Gyms']
  image_url TEXT,
  product_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tenant_products_tenant ON tenant_products(tenant_id);
CREATE INDEX idx_tenant_products_hs_code ON tenant_products(hs_code);

-- 4️⃣ ADICIONAR tenant_id E workspace_id NAS TABELAS EXISTENTES

-- Companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_workspace ON companies(workspace_id);

-- ICP Analysis Results
ALTER TABLE icp_analysis_results ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE icp_analysis_results ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_icp_tenant ON icp_analysis_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_workspace ON icp_analysis_results(workspace_id);

-- Leads Pool
ALTER TABLE leads_pool ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE leads_pool ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads_pool(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads_pool(workspace_id);

-- Decision Makers
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_decisors_tenant ON decision_makers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisors_workspace ON decision_makers(workspace_id);

-- Users (adicionar tenant_id e default_workspace_id)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_workspace_id UUID REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- 5️⃣ HABILITAR ROW LEVEL SECURITY (RLS)

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_companies ON companies;
CREATE POLICY tenant_isolation_companies ON companies
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- ICP Analysis
ALTER TABLE icp_analysis_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_icp ON icp_analysis_results;
CREATE POLICY tenant_isolation_icp ON icp_analysis_results
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Leads Pool
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_leads ON leads_pool;
CREATE POLICY tenant_isolation_leads ON leads_pool
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Decision Makers
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_decisors ON decision_makers;
CREATE POLICY tenant_isolation_decisors ON decision_makers
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Tenant Products
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_products ON tenant_products;
CREATE POLICY tenant_isolation_products ON tenant_products
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_workspaces ON workspaces;
CREATE POLICY tenant_isolation_workspaces ON workspaces
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- 6️⃣ INSERIR TENANT METALIFE (Primeiro cliente)

INSERT INTO tenants (id, name, slug, cnpj, website, industry, primary_color, subscription_tier)
VALUES (
  'c8f5e8d0-1234-5678-90ab-cdef12345678', -- UUID fixo para facilitar
  'MetaLife Pilates',
  'metalife',
  '06334616000185',
  'https://metalifepilates.com.br/',
  'Fitness Equipment Manufacturing',
  '#10B981', -- Verde MetaLife
  'pro'
) ON CONFLICT (slug) DO NOTHING;

-- 7️⃣ CRIAR 3 WORKSPACES PARA METALIFE

INSERT INTO workspaces (tenant_id, name, type, target_countries, description)
VALUES 
(
  'c8f5e8d0-1234-5678-90ab-cdef12345678',
  'Prospecção Brasil',
  'domestic',
  ARRAY['BR'],
  'Vender equipamentos MetaLife no mercado brasileiro'
),
(
  'c8f5e8d0-1234-5678-90ab-cdef12345678',
  'Export Intelligence',
  'export',
  ARRAY['US', 'DE', 'JP', 'AU', 'ES', 'IT'],
  'Encontrar importadores internacionais de equipamentos de pilates'
),
(
  'c8f5e8d0-1234-5678-90ab-cdef12345678',
  'Import Sourcing',
  'import',
  ARRAY['CN', 'TW', 'KR', 'IN'],
  'Encontrar fornecedores internacionais de componentes e matéria-prima'
)
ON CONFLICT (tenant_id, type) DO NOTHING;

-- 8️⃣ CRIAR TABELA TRADE_DATA (Histórico de importação/exportação)

CREATE TABLE IF NOT EXISTS trade_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  hs_code TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('import', 'export')),
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  volume_usd DECIMAL,
  shipments_count INTEGER,
  frequency TEXT, -- 'monthly', 'quarterly', 'yearly'
  suppliers_countries TEXT[], -- Para imports
  buyers_countries TEXT[], -- Para exports
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trade_data_company ON trade_data(company_id);
CREATE INDEX idx_trade_data_hs_code ON trade_data(hs_code);
CREATE INDEX idx_trade_data_country ON trade_data(country);

-- 9️⃣ CRIAR TABELA HS_CODES (Nomenclatura internacional)

CREATE TABLE IF NOT EXISTS hs_codes (
  code TEXT PRIMARY KEY, -- '9506.91.00'
  description_pt TEXT,
  description_en TEXT,
  category TEXT,
  tariff_usa DECIMAL, -- Tarifa USA (%)
  tariff_eu DECIMAL,  -- Tarifa EU (%)
  tariff_cn DECIMAL,  -- Tarifa China (%)
  certifications_required TEXT[], -- ['FDA', 'CE', 'ISO']
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir HS Codes relevantes para MetaLife
INSERT INTO hs_codes (code, description_pt, description_en, category, tariff_usa, tariff_eu, certifications_required)
VALUES 
(
  '9506.91.00',
  'Artigos e equipamentos para cultura física, ginástica ou atletismo',
  'Articles and equipment for general physical exercise, gymnastics or athletics',
  'Fitness Equipment',
  0.0, -- USA: 0% para fitness equipment
  0.0, -- EU: 0%
  ARRAY['ISO 9001'] -- Certificações recomendadas
),
(
  '9506.99.00',
  'Outros artigos e equipamentos para esporte',
  'Other articles and equipment for sports',
  'Sports Accessories',
  0.0,
  0.0,
  ARRAY[]
),
(
  '9403.60.00',
  'Outros móveis de madeira',
  'Other wooden furniture',
  'Furniture',
  0.0,
  0.0,
  ARRAY['FSC'] -- Forest Stewardship Council
)
ON CONFLICT (code) DO NOTHING;

-- 🔟 CRIAR FUNÇÃO HELPER: get_tenant_context()

CREATE OR REPLACE FUNCTION get_tenant_context()
RETURNS TABLE (
  tenant_id UUID,
  workspace_id UUID,
  workspace_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.tenant_id,
    u.default_workspace_id AS workspace_id,
    w.type AS workspace_type
  FROM users u
  LEFT JOIN workspaces w ON w.id = u.default_workspace_id
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ✅ SETUP COMPLETO!
-- ============================================================================

-- Verificar se tudo foi criado:
SELECT 
  'Tenants' AS tabela, COUNT(*) AS registros FROM tenants
UNION ALL
SELECT 'Workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'Tenant Products', COUNT(*) FROM tenant_products
UNION ALL
SELECT 'HS Codes', COUNT(*) FROM hs_codes;

-- Resultado esperado:
-- Tenants: 1 (MetaLife)
-- Workspaces: 3 (Domestic, Export, Import)
-- Tenant Products: 0 (será importado do site)
-- HS Codes: 3 (9506.91.00, 9506.99.00, 9403.60.00)

