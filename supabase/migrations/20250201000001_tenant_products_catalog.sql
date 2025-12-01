-- =====================================================
-- CATÁLOGO DE PRODUTOS DO TENANT
-- Permite que cada tenant cadastre seus produtos/serviços
-- para calcular FIT com empresas prospectadas
-- =====================================================

-- 1. TABELA PRINCIPAL: Produtos do Tenant
CREATE TABLE IF NOT EXISTS tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Dados básicos do produto
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  codigo_interno VARCHAR(50),
  
  -- Preços e tickets
  preco_minimo DECIMAL(15,2),
  preco_maximo DECIMAL(15,2),
  ticket_medio DECIMAL(15,2),
  moeda VARCHAR(3) DEFAULT 'BRL',
  
  -- Critérios de qualificação (para matching)
  cnaes_alvo TEXT[], -- CNAEs que mais compram este produto
  setores_alvo TEXT[], -- Setores ideais
  portes_alvo TEXT[], -- ['MEI', 'ME', 'EPP', 'MEDIO', 'GRANDE']
  capital_social_minimo DECIMAL(15,2),
  capital_social_maximo DECIMAL(15,2),
  regioes_alvo TEXT[], -- UFs ou regiões atendidas
  
  -- Diferenciais e argumentos de venda
  diferenciais TEXT[],
  casos_uso TEXT[],
  dores_resolvidas TEXT[],
  beneficios TEXT[],
  
  -- Concorrência
  concorrentes_diretos TEXT[],
  vantagens_competitivas TEXT[],
  
  -- Documentos e mídia
  imagem_url TEXT,
  documentos JSONB DEFAULT '[]', -- [{nome, url, tipo}]
  
  -- Status e prioridade
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false, -- Produto carro-chefe
  ordem_exibicao INTEGER DEFAULT 0,
  
  -- Metadados de extração IA
  extraido_de TEXT, -- 'website', 'upload_pdf', 'upload_xlsx', 'manual'
  dados_extraidos JSONB, -- Dados brutos da extração
  confianca_extracao DECIMAL(3,2), -- 0.00 a 1.00
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para busca
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(descricao, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(categoria, '')), 'C')
  ) STORED
);

-- 2. TABELA: Documentos de Produtos (uploads)
CREATE TABLE IF NOT EXISTS tenant_product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES tenant_products(id) ON DELETE SET NULL,
  
  -- Metadados do arquivo
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(50), -- 'pdf', 'xlsx', 'docx', 'image', 'txt'
  tamanho_bytes BIGINT,
  url_storage TEXT NOT NULL,
  
  -- Status de processamento
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  erro_mensagem TEXT,
  
  -- Dados extraídos pela IA
  dados_extraidos JSONB,
  produtos_identificados INTEGER DEFAULT 0,
  confianca_extracao DECIMAL(3,2),
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'error'))
);

-- 3. TABELA: Configuração de Pesos de FIT por Tenant
CREATE TABLE IF NOT EXISTS tenant_fit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  
  -- Pesos dos critérios (devem somar 100)
  peso_cnae INTEGER DEFAULT 25,
  peso_porte INTEGER DEFAULT 20,
  peso_capital_social INTEGER DEFAULT 15,
  peso_setor INTEGER DEFAULT 20,
  peso_localizacao INTEGER DEFAULT 10,
  peso_dores INTEGER DEFAULT 10,
  
  -- Thresholds de decisão
  threshold_go INTEGER DEFAULT 70, -- Score >= 70 = GO
  threshold_warm INTEGER DEFAULT 40, -- Score >= 40 e < 70 = WARM
  -- Score < 40 = NO-GO
  
  -- Configurações adicionais
  considerar_concorrentes BOOLEAN DEFAULT true,
  considerar_fornecedores BOOLEAN DEFAULT true,
  permitir_ajuste_manual BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_weights CHECK (
    peso_cnae + peso_porte + peso_capital_social + peso_setor + peso_localizacao + peso_dores = 100
  )
);

-- 4. TABELA: Histórico de FIT calculados
CREATE TABLE IF NOT EXISTS product_fit_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  cnpj VARCHAR(20),
  
  -- Scores calculados
  score_total INTEGER, -- 0-100
  score_por_produto JSONB, -- {product_id: score, ...}
  decisao VARCHAR(10), -- 'go', 'warm', 'no_go'
  
  -- Breakdown detalhado
  breakdown JSONB, -- {cnae: 80, porte: 100, capital: 60, ...}
  
  -- Ajustes manuais do SDR
  score_ajustado INTEGER,
  motivo_ajuste TEXT,
  ajustado_por UUID REFERENCES auth.users(id),
  ajustado_em TIMESTAMP WITH TIME ZONE,
  
  -- Produtos recomendados (ordenados por fit)
  produtos_recomendados JSONB, -- [{id, nome, score, motivo}, ...]
  produto_carro_chefe UUID REFERENCES tenant_products(id),
  
  -- Concorrentes/Fornecedores detectados
  concorrentes_detectados JSONB, -- [{nome, fonte, confianca}, ...]
  fornecedores_detectados JSONB,
  
  -- Metadados
  fontes_consultadas TEXT[],
  tempo_analise_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_search ON tenant_products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_tenant_products_cnaes ON tenant_products USING GIN(cnaes_alvo);
CREATE INDEX IF NOT EXISTS idx_tenant_products_setores ON tenant_products USING GIN(setores_alvo);
CREATE INDEX IF NOT EXISTS idx_product_documents_tenant ON tenant_product_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_status ON tenant_product_documents(status);
CREATE INDEX IF NOT EXISTS idx_product_fit_tenant ON product_fit_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_fit_company ON product_fit_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_product_fit_cnpj ON product_fit_analysis(cnpj);

-- 6. RLS (Row Level Security)
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_fit_analysis ENABLE ROW LEVEL SECURITY;

-- Políticas: Tenant só vê seus próprios dados
CREATE POLICY "tenant_products_policy" ON tenant_products
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "tenant_product_documents_policy" ON tenant_product_documents
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "tenant_fit_config_policy" ON tenant_fit_config
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "product_fit_analysis_policy" ON product_fit_analysis
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_id = auth.uid()
  ));

-- 7. TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenant_products_updated_at
  BEFORE UPDATE ON tenant_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_fit_config_updated_at
  BEFORE UPDATE ON tenant_fit_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_fit_analysis_updated_at
  BEFORE UPDATE ON product_fit_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. COMENTÁRIOS
COMMENT ON TABLE tenant_products IS 'Catálogo de produtos/serviços do tenant para cálculo de FIT';
COMMENT ON TABLE tenant_product_documents IS 'Documentos enviados para extração automática de produtos';
COMMENT ON TABLE tenant_fit_config IS 'Configuração de pesos e thresholds de FIT por tenant';
COMMENT ON TABLE product_fit_analysis IS 'Histórico de análises de FIT produto vs empresa';

