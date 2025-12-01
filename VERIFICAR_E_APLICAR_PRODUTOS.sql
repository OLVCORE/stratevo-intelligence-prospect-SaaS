-- =====================================================
-- VERIFICAR E APLICAR TABELAS DE PRODUTOS
-- =====================================================
-- 
-- Este script verifica quais tabelas existem e aplica apenas o que falta
-- Execute no Supabase SQL Editor
--
-- =====================================================

-- 1. VERIFICAR QUAIS TABELAS EXISTEM
SELECT 
  t.table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status
FROM (VALUES 
  ('tenant_products'),
  ('tenant_product_documents'),
  ('tenant_fit_config'),
  ('product_fit_analysis'),
  ('tenant_competitor_products')
) AS t(table_name);

-- =====================================================
-- 2. APLICAR APENAS O QUE FALTA
-- =====================================================

-- 2.1. tenant_product_documents (se não existir)
CREATE TABLE IF NOT EXISTS tenant_product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES tenant_products(id) ON DELETE CASCADE,
  
  -- Dados do documento
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(50), -- 'pdf', 'xlsx', 'docx', 'image'
  url_armazenamento TEXT,
  tamanho_bytes BIGINT,
  
  -- Metadados de extração
  produtos_extraidos JSONB DEFAULT '[]', -- Produtos encontrados no documento
  extraido_por_ia BOOLEAN DEFAULT false,
  confianca_extracao DECIMAL(3,2),
  dados_brutos JSONB,
  
  -- Status
  processado BOOLEAN DEFAULT false,
  processado_em TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_documents_tenant ON tenant_product_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_product ON tenant_product_documents(product_id);

-- RLS
ALTER TABLE tenant_product_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_product_documents_policy" ON tenant_product_documents;
CREATE POLICY "tenant_product_documents_policy" ON tenant_product_documents
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- 2.2. tenant_fit_config (se não existir)
CREATE TABLE IF NOT EXISTS tenant_fit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Pesos para cálculo de FIT (devem somar 100)
  peso_cnae DECIMAL(5,2) DEFAULT 25.00,
  peso_setor DECIMAL(5,2) DEFAULT 20.00,
  peso_porte DECIMAL(5,2) DEFAULT 15.00,
  peso_capital_social DECIMAL(5,2) DEFAULT 15.00,
  peso_localizacao DECIMAL(5,2) DEFAULT 10.00,
  peso_situacao DECIMAL(5,2) DEFAULT 10.00,
  peso_outros DECIMAL(5,2) DEFAULT 5.00,
  
  -- Thresholds
  score_minimo_aprovacao DECIMAL(5,2) DEFAULT 70.00,
  score_minimo_quarentena DECIMAL(5,2) DEFAULT 50.00,
  
  -- Configurações adicionais
  considerar_historico BOOLEAN DEFAULT true,
  considerar_tendencia BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_fit_config_tenant ON tenant_fit_config(tenant_id);

-- RLS
ALTER TABLE tenant_fit_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_fit_config_policy" ON tenant_fit_config;
CREATE POLICY "tenant_fit_config_policy" ON tenant_fit_config
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- 2.3. product_fit_analysis (se não existir)
CREATE TABLE IF NOT EXISTS product_fit_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES tenant_products(id) ON DELETE CASCADE,
  company_id UUID, -- REFERENCES companies(id) ON DELETE CASCADE (se tabela companies existir)
  company_cnpj VARCHAR(20),
  
  -- Score de FIT
  score_fit DECIMAL(5,2) NOT NULL, -- 0.00 a 100.00
  score_breakdown JSONB, -- Detalhamento por critério
  
  -- Análise
  pontos_positivos TEXT[],
  pontos_negativos TEXT[],
  recomendacao TEXT, -- 'APROVAR', 'QUARENTENA', 'REJEITAR'
  motivo_principal TEXT,
  
  -- Ajustes manuais
  score_ajustado DECIMAL(5,2),
  ajustado_por UUID REFERENCES auth.users(id),
  ajustado_em TIMESTAMP WITH TIME ZONE,
  
  -- Produtos recomendados (ordenados por fit)
  produtos_recomendados JSONB, -- [{id, nome, score, motivo}, ...]
  produto_carro_chefe UUID REFERENCES tenant_products(id),
  
  -- Concorrentes/Fornecedores detectados
  concorrentes_detectados JSONB, -- [{nome, fonte, confianca}, ...]
  fornecedores_detectados JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fit_analysis_tenant ON product_fit_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fit_analysis_product ON product_fit_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_fit_analysis_company ON product_fit_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_fit_analysis_cnpj ON product_fit_analysis(company_cnpj);
CREATE INDEX IF NOT EXISTS idx_fit_analysis_score ON product_fit_analysis(score_fit);

-- RLS
ALTER TABLE product_fit_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_fit_analysis_policy" ON product_fit_analysis;
CREATE POLICY "product_fit_analysis_policy" ON product_fit_analysis
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- 2.4. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_product_documents_updated_at ON tenant_product_documents;
CREATE TRIGGER update_product_documents_updated_at
  BEFORE UPDATE ON tenant_product_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fit_config_updated_at ON tenant_fit_config;
CREATE TRIGGER update_fit_config_updated_at
  BEFORE UPDATE ON tenant_fit_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fit_analysis_updated_at ON product_fit_analysis;
CREATE TRIGGER update_fit_analysis_updated_at
  BEFORE UPDATE ON product_fit_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. VERIFICAR RESULTADO FINAL
-- =====================================================
SELECT 
  table_name,
  '✅ CRIADA' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'tenant_products',
  'tenant_product_documents',
  'tenant_fit_config',
  'product_fit_analysis',
  'tenant_competitor_products'
)
ORDER BY table_name;

-- ✅ Todas as tabelas de produtos foram verificadas e criadas!

