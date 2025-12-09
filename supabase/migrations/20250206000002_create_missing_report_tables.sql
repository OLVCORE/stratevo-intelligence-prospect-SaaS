-- =====================================================
-- CRIAR TABELAS FALTANTES PARA RELATÓRIOS ICP (MULTITENANT)
-- =====================================================
-- Created: 2025-02-06
-- Purpose: Criar tabelas multitenant que podem estar faltando para os relatórios ICP
-- 
-- ⚠️ IMPORTANTE: Estas tabelas são MULTITENANT (genéricas)
-- Todas as tabelas usam tenant_id para isolar dados por tenant
-- Novos tenants funcionarão automaticamente ao cadastrar dados
-- =====================================================

-- 0. Criar competitive_analysis se não existir (pode estar faltando)
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  icp_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE SET NULL,
  
  -- Dados dos concorrentes analisados
  competitor_data JSONB DEFAULT '[]'::jsonb,
  
  -- Análises geradas
  ceo_analysis TEXT,
  swot_analysis JSONB DEFAULT '{}'::jsonb,
  market_share_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para um registro por tenant
  CONSTRAINT unique_competitive_analysis_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_competitive_analysis_tenant ON public.competitive_analysis(tenant_id);

-- RLS para competitive_analysis
ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant competitive analysis" ON public.competitive_analysis;
CREATE POLICY "Users can view their tenant competitive analysis"
  ON public.competitive_analysis FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their tenant competitive analysis" ON public.competitive_analysis;
CREATE POLICY "Users can insert their tenant competitive analysis"
  ON public.competitive_analysis FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their tenant competitive analysis" ON public.competitive_analysis;
CREATE POLICY "Users can update their tenant competitive analysis"
  ON public.competitive_analysis FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_competitive_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_competitive_analysis_updated_at ON public.competitive_analysis;
CREATE TRIGGER trigger_competitive_analysis_updated_at
  BEFORE UPDATE ON public.competitive_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_competitive_analysis_updated_at();

-- 1. icp_competitive_swot (Análise SWOT baseada em produtos)
CREATE TABLE IF NOT EXISTS public.icp_competitive_swot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  icp_profile_metadata_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE SET NULL,
  
  -- Análise SWOT
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  threats JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icp_competitive_swot_tenant ON public.icp_competitive_swot(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_competitive_swot_icp ON public.icp_competitive_swot(icp_profile_metadata_id);
CREATE INDEX IF NOT EXISTS idx_icp_competitive_swot_created ON public.icp_competitive_swot(created_at DESC);

-- 2. icp_bcg_matrix (Matriz BCG)
CREATE TABLE IF NOT EXISTS public.icp_bcg_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  icp_profile_metadata_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE SET NULL,
  
  -- Matriz BCG
  stars INTEGER DEFAULT 0,
  cash_cows INTEGER DEFAULT 0,
  question_marks INTEGER DEFAULT 0,
  dogs INTEGER DEFAULT 0,
  
  -- Dados adicionais
  matrix_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icp_bcg_matrix_tenant ON public.icp_bcg_matrix(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_bcg_matrix_icp ON public.icp_bcg_matrix(icp_profile_metadata_id);
CREATE INDEX IF NOT EXISTS idx_icp_bcg_matrix_created ON public.icp_bcg_matrix(created_at DESC);

-- 3. icp_market_insights (Insights de mercado)
CREATE TABLE IF NOT EXISTS public.icp_market_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  icp_profile_metadata_id UUID NOT NULL REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  
  -- Insights de mercado
  trends JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  threats JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  sector_analysis TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icp_market_insights_tenant ON public.icp_market_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_market_insights_icp ON public.icp_market_insights(icp_profile_metadata_id);
CREATE INDEX IF NOT EXISTS idx_icp_market_insights_created ON public.icp_market_insights(created_at DESC);

-- RLS para as novas tabelas
ALTER TABLE public.icp_competitive_swot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_bcg_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_market_insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
DROP POLICY IF EXISTS "Users can view their tenant competitive swot" ON public.icp_competitive_swot;
CREATE POLICY "Users can view their tenant competitive swot"
  ON public.icp_competitive_swot FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their tenant competitive swot" ON public.icp_competitive_swot;
CREATE POLICY "Users can insert their tenant competitive swot"
  ON public.icp_competitive_swot FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their tenant competitive swot" ON public.icp_competitive_swot;
CREATE POLICY "Users can update their tenant competitive swot"
  ON public.icp_competitive_swot FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their tenant bcg matrix" ON public.icp_bcg_matrix;
CREATE POLICY "Users can view their tenant bcg matrix"
  ON public.icp_bcg_matrix FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their tenant bcg matrix" ON public.icp_bcg_matrix;
CREATE POLICY "Users can insert their tenant bcg matrix"
  ON public.icp_bcg_matrix FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their tenant bcg matrix" ON public.icp_bcg_matrix;
CREATE POLICY "Users can update their tenant bcg matrix"
  ON public.icp_bcg_matrix FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their tenant market insights" ON public.icp_market_insights;
CREATE POLICY "Users can view their tenant market insights"
  ON public.icp_market_insights FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their tenant market insights" ON public.icp_market_insights;
CREATE POLICY "Users can insert their tenant market insights"
  ON public.icp_market_insights FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their tenant market insights" ON public.icp_market_insights;
CREATE POLICY "Users can update their tenant market insights"
  ON public.icp_market_insights FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

-- Comentários
COMMENT ON TABLE public.icp_competitive_swot IS 'Análise SWOT baseada em produtos do tenant vs concorrentes';
COMMENT ON TABLE public.icp_bcg_matrix IS 'Matriz BCG calculada para nichos e clientes';
COMMENT ON TABLE public.icp_market_insights IS 'Insights de mercado e tendências setoriais';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

