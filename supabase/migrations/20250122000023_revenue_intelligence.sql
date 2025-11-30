-- ============================================
-- MIGRATION: REVENUE INTELLIGENCE - Inteligência de Receita
-- ============================================
-- Cria tabelas para suportar análise preditiva de receita
-- 
-- PROTOCOLO DE SEGURANÇA:
-- - Esta migration é 100% NOVA
-- - Não modifica nenhuma tabela existente
-- - Não interfere com integração chat → CRM
-- ============================================

-- ============================================
-- 1. TABELA: revenue_forecasts
-- ============================================
CREATE TABLE IF NOT EXISTS public.revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  granularity TEXT NOT NULL CHECK (granularity IN ('daily', 'weekly', 'monthly', 'quarterly')),
  predicted_revenue DECIMAL(12,2) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL, -- 0-100
  deals_count INTEGER,
  average_deal_size DECIMAL(12,2),
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABELA: deal_risk_scores
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL, -- 0-100
  risk_factors JSONB, -- Array de fatores de risco
  recommended_actions JSONB, -- Array de ações recomendadas
  days_stalled INTEGER,
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA: pipeline_health_scores
-- ============================================
CREATE TABLE IF NOT EXISTS public.pipeline_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL, -- 0-100
  stage_distribution JSONB, -- Distribuição por estágio
  velocity DECIMAL(5,2), -- Dias médios por estágio
  conversion_rates JSONB, -- Taxas de conversão entre estágios
  bottlenecks JSONB, -- Array de gargalos identificados
  recommendations JSONB, -- Array de recomendações
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABELA: next_best_actions
-- ============================================
CREATE TABLE IF NOT EXISTS public.next_best_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'deal')),
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('call', 'email', 'meeting', 'proposal', 'follow-up')),
  action_description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  confidence DECIMAL(5,2) NOT NULL, -- 0-100
  expected_outcome TEXT,
  urgency INTEGER NOT NULL, -- 0-100
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 5. TABELA: deal_scores
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL, -- 0-100
  factors JSONB NOT NULL, -- {value, probability, velocity, engagement, fit}
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_tenant_id ON public.revenue_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_period ON public.revenue_forecasts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_granularity ON public.revenue_forecasts(granularity);

CREATE INDEX IF NOT EXISTS idx_deal_risk_scores_tenant_id ON public.deal_risk_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deal_risk_scores_deal_id ON public.deal_risk_scores(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_risk_scores_risk_level ON public.deal_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_deal_risk_scores_risk_score ON public.deal_risk_scores(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_health_scores_tenant_id ON public.pipeline_health_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_health_scores_period ON public.pipeline_health_scores(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_next_best_actions_tenant_id ON public.next_best_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_entity ON public.next_best_actions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_priority ON public.next_best_actions(priority);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_completed ON public.next_best_actions(is_completed) WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_deal_scores_tenant_id ON public.deal_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deal_scores_deal_id ON public.deal_scores(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_scores_overall ON public.deal_scores(overall_score DESC);

-- ============================================
-- 7. RLS (Row Level Security)
-- ============================================
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_best_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_scores ENABLE ROW LEVEL SECURITY;

-- Policies para revenue_forecasts
DROP POLICY IF EXISTS "Users can view revenue forecasts from their tenant" ON public.revenue_forecasts;
CREATE POLICY "Users can view revenue forecasts from their tenant"
  ON public.revenue_forecasts FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para deal_risk_scores
DROP POLICY IF EXISTS "Users can view deal risk scores from their tenant" ON public.deal_risk_scores;
CREATE POLICY "Users can view deal risk scores from their tenant"
  ON public.deal_risk_scores FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para pipeline_health_scores
DROP POLICY IF EXISTS "Users can view pipeline health scores from their tenant" ON public.pipeline_health_scores;
CREATE POLICY "Users can view pipeline health scores from their tenant"
  ON public.pipeline_health_scores FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para next_best_actions
DROP POLICY IF EXISTS "Users can view next best actions from their tenant" ON public.next_best_actions;
CREATE POLICY "Users can view next best actions from their tenant"
  ON public.next_best_actions FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage next best actions in their tenant" ON public.next_best_actions;
CREATE POLICY "Users can manage next best actions in their tenant"
  ON public.next_best_actions FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para deal_scores
DROP POLICY IF EXISTS "Users can view deal scores from their tenant" ON public.deal_scores;
CREATE POLICY "Users can view deal scores from their tenant"
  ON public.deal_scores FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- ============================================
-- 8. TRIGGERS: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_revenue_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
DROP TRIGGER IF EXISTS trigger_update_revenue_forecasts_updated_at ON public.revenue_forecasts;
CREATE TRIGGER trigger_update_revenue_forecasts_updated_at
  BEFORE UPDATE ON public.revenue_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_revenue_intelligence_updated_at();

DROP TRIGGER IF EXISTS trigger_update_deal_risk_scores_updated_at ON public.deal_risk_scores;
CREATE TRIGGER trigger_update_deal_risk_scores_updated_at
  BEFORE UPDATE ON public.deal_risk_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_revenue_intelligence_updated_at();

DROP TRIGGER IF EXISTS trigger_update_pipeline_health_scores_updated_at ON public.pipeline_health_scores;
CREATE TRIGGER trigger_update_pipeline_health_scores_updated_at
  BEFORE UPDATE ON public.pipeline_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_revenue_intelligence_updated_at();

DROP TRIGGER IF EXISTS trigger_update_next_best_actions_updated_at ON public.next_best_actions;
CREATE TRIGGER trigger_update_next_best_actions_updated_at
  BEFORE UPDATE ON public.next_best_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_revenue_intelligence_updated_at();

DROP TRIGGER IF EXISTS trigger_update_deal_scores_updated_at ON public.deal_scores;
CREATE TRIGGER trigger_update_deal_scores_updated_at
  BEFORE UPDATE ON public.deal_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_revenue_intelligence_updated_at();

-- ============================================
-- 9. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.revenue_forecasts IS 'Previsões preditivas de receita usando ML';
COMMENT ON TABLE public.deal_risk_scores IS 'Scores de risco de deals identificados';
COMMENT ON TABLE public.pipeline_health_scores IS 'Health scores do pipeline em tempo real';
COMMENT ON TABLE public.next_best_actions IS 'Recomendações automáticas de próximas melhores ações';
COMMENT ON TABLE public.deal_scores IS 'Scores automáticos de deals baseados em múltiplos fatores';

