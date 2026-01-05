-- ============================================================================
-- MIGRATION: Tabelas de Configuração do Tenant
-- ============================================================================
-- Data: 2025-01-19
-- Descrição: Cria tabelas para configuração multi-tenant e análises 360°
-- ============================================================================

-- ==========================================
-- TABELA: tenant_products (Produtos/Serviços do Tenant)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identificação do Produto
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  
  -- Fit Analysis (critérios de recomendação)
  sector_fit TEXT[], -- Setores onde se encaixa
  niche_fit TEXT[],  -- Nichos onde se encaixa
  cnae_fit TEXT[],   -- CNAEs onde se encaixa
  use_cases TEXT[],  -- Casos de uso
  
  -- Pricing
  base_price DECIMAL(15,2),
  min_price DECIMAL(15,2),
  max_price DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Recomendação
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  product_type VARCHAR(50), -- 'primary', 'relevant', 'complementary'
  roi_months INTEGER,
  
  -- Metadata customizável
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_category ON public.tenant_products(tenant_id, category);
-- NOTA: A coluna is_active pode não existir se a tabela foi criada pela migration 20250201000001_tenant_products_catalog.sql
-- que usa 'ativo' ao invés de 'is_active'. Este índice será criado apenas se a coluna existir.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tenant_products_active ON public.tenant_products(tenant_id, is_active) WHERE is_active = true;
  END IF;
END $$;
-- ✅ CORRIGIDO: Verificar se colunas sector_fit e niche_fit existem antes de criar índices
-- A migração 20250201000001_tenant_products_catalog.sql cria a tabela com estrutura diferente (setores_alvo ao invés de sector_fit)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'sector_fit'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tenant_products_sector_fit ON public.tenant_products USING GIN(sector_fit);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'niche_fit'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tenant_products_niche_fit ON public.tenant_products USING GIN(niche_fit);
  END IF;
END $$;

-- ==========================================
-- TABELA: tenant_search_configs (Configuração de Busca)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tenant_search_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  company_name VARCHAR(255) NOT NULL, -- Nome da empresa do tenant
  
  -- Termos de Busca
  search_terms TEXT[] NOT NULL DEFAULT '{}', -- Termos principais de busca
  aliases TEXT[] DEFAULT '{}', -- Variações do nome
  product_keywords TEXT[] DEFAULT '{}', -- Keywords dos produtos
  
  -- Configuração de Busca
  search_strategy VARCHAR(50) DEFAULT 'comprehensive', -- 'comprehensive', 'focused', 'aggressive'
  min_confidence DECIMAL(3,2) DEFAULT 0.70, -- Confiança mínima (0-1)
  
  -- Controle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_search_configs_tenant ON public.tenant_search_configs(tenant_id);
-- ✅ CORRIGIDO: Verificar se coluna search_terms existe antes de criar índice
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_search_configs' 
    AND column_name = 'search_terms'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tenant_search_configs_search_terms ON public.tenant_search_configs USING GIN(search_terms);
  END IF;
END $$;

-- ==========================================
-- TABELA: sector_configs (Configuração por Setor - Reutilizável)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sector_configs (
  sector_code VARCHAR(50) PRIMARY KEY,
  sector_name VARCHAR(100) NOT NULL,
  
  -- Configuração de Decisores
  decision_maker_config JSONB DEFAULT '{}'::jsonb, -- { typical_roles: [], keywords: [], hierarchy_levels: number }
  
  -- Configuração Digital
  digital_config JSONB DEFAULT '{}'::jsonb, -- { relevant_metrics: [], tech_categories: [], maturity_indicators: [] }
  
  -- Configuração de Competidores
  competitor_config JSONB DEFAULT '{}'::jsonb, -- { discovery_keywords: [], market_segments: [] }
  
  -- Configuração de Similaridade
  similarity_config JSONB DEFAULT '{}'::jsonb, -- { factors: [], weights: {}, thresholds: {} }
  
  -- Configuração de Client Discovery
  client_discovery_config JSONB DEFAULT '{}'::jsonb, -- { strategies: [], paths: [], keywords: [] }
  
  -- Configuração 360°
  analysis_360_config JSONB DEFAULT '{}'::jsonb, -- { dimensions: [], metrics: {}, benchmarks: {} }
  
  -- Configuração de Summary
  summary_config JSONB DEFAULT '{}'::jsonb, -- { sections: [], key_metrics: [], template: {} }
  
  -- Controle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABELA: tenant_competitor_configs (Competidores do Tenant)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tenant_competitor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Competidores Conhecidos
  known_competitors TEXT[], -- Nomes de competidores conhecidos
  competitor_keywords TEXT[], -- Keywords para identificar competidores
  
  -- Posicionamento
  market_position VARCHAR(50), -- 'leader', 'challenger', 'follower', 'niche'
  market_share DECIMAL(5,2), -- Percentual de market share
  
  -- Análise Competitiva
  competitive_advantages TEXT[], -- Vantagens competitivas
  competitive_disadvantages TEXT[], -- Desvantagens competitivas
  
  -- Controle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_competitor_configs_tenant ON public.tenant_competitor_configs(tenant_id);
-- ✅ CORRIGIDO: Verificar se coluna known_competitors existe antes de criar índice
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_competitor_configs' 
    AND column_name = 'known_competitors'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tenant_competitor_configs_competitors ON public.tenant_competitor_configs USING GIN(known_competitors);
  END IF;
END $$;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- tenant_products
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_products'
      AND policyname='Tenant can manage their products'
  ) THEN
    CREATE POLICY "Tenant can manage their products"
    ON public.tenant_products
    FOR ALL
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- tenant_search_configs
ALTER TABLE public.tenant_search_configs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_search_configs'
      AND policyname='Tenant can manage their search config'
  ) THEN
    CREATE POLICY "Tenant can manage their search config"
    ON public.tenant_search_configs
    FOR ALL
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- tenant_competitor_configs
ALTER TABLE public.tenant_competitor_configs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_competitor_configs'
      AND policyname='Tenant can manage their competitor config'
  ) THEN
    CREATE POLICY "Tenant can manage their competitor config"
    ON public.tenant_competitor_configs
    FOR ALL
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- sector_configs (público, todos podem ler)
ALTER TABLE public.sector_configs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sector_configs'
      AND policyname='Anyone can read sector configs'
  ) THEN
    CREATE POLICY "Anyone can read sector configs"
    ON public.sector_configs
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- ==========================================
-- TRIGGERS: updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_tenant_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenant_products_updated_at ON public.tenant_products;
CREATE TRIGGER trigger_update_tenant_products_updated_at
  BEFORE UPDATE ON public.tenant_products
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_config_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tenant_search_configs_updated_at ON public.tenant_search_configs;
CREATE TRIGGER trigger_update_tenant_search_configs_updated_at
  BEFORE UPDATE ON public.tenant_search_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_config_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tenant_competitor_configs_updated_at ON public.tenant_competitor_configs;
CREATE TRIGGER trigger_update_tenant_competitor_configs_updated_at
  BEFORE UPDATE ON public.tenant_competitor_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_config_updated_at();

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON TABLE public.tenant_products IS 'Produtos/serviços oferecidos pelo tenant';
COMMENT ON TABLE public.tenant_search_configs IS 'Configuração de busca e termos do tenant';
COMMENT ON TABLE public.sector_configs IS 'Configuração reutilizável por setor (260 setores)';
COMMENT ON TABLE public.tenant_competitor_configs IS 'Configuração de competidores do tenant';

