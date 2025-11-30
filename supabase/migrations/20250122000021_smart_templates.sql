-- ============================================
-- MIGRATION: SMART TEMPLATES - Templates Inteligentes IA
-- ============================================
-- Cria tabelas para suportar templates gerados por IA
-- 
-- PROTOCOLO DE SEGURANÇA:
-- - Esta migration é 100% NOVA
-- - Não modifica nenhuma tabela existente
-- - Não interfere com integração chat → CRM
-- ============================================

-- ============================================
-- 1. TABELA: smart_templates
-- ============================================
CREATE TABLE IF NOT EXISTS public.smart_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('template', 'voice-script')),
  template_type TEXT, -- 'cold-email', 'follow-up', 'nurturing', 'closing', etc
  channel TEXT CHECK (channel IN ('email', 'whatsapp', 'linkedin', 'sms')),
  tone TEXT CHECK (tone IN ('professional', 'friendly', 'urgent', 'casual')),
  content TEXT NOT NULL,
  variables JSONB, -- Variáveis dinâmicas do template
  performance_metrics JSONB, -- Métricas de performance (open rate, click rate, etc)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 2. TABELA: template_ab_tests
-- ============================================
CREATE TABLE IF NOT EXISTS public.template_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  template_a_id UUID REFERENCES public.smart_templates(id) ON DELETE CASCADE,
  template_b_id UUID REFERENCES public.smart_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  results JSONB, -- Resultados do teste A/B
  winner_id UUID REFERENCES public.smart_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. TABELA: template_performance
-- ============================================
CREATE TABLE IF NOT EXISTS public.template_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.smart_templates(id) ON DELETE CASCADE,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2), -- porcentagem
  click_rate DECIMAL(5,2),
  reply_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_smart_templates_tenant_id ON public.smart_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_smart_templates_type ON public.smart_templates(type);
CREATE INDEX IF NOT EXISTS idx_smart_templates_channel ON public.smart_templates(channel);
CREATE INDEX IF NOT EXISTS idx_smart_templates_active ON public.smart_templates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_template_ab_tests_tenant_id ON public.template_ab_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_ab_tests_status ON public.template_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_template_performance_tenant_id ON public.template_performance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_template_id ON public.template_performance(template_id);
CREATE INDEX IF NOT EXISTS idx_template_performance_period ON public.template_performance(period_start, period_end);

-- ============================================
-- 5. RLS (Row Level Security)
-- ============================================
ALTER TABLE public.smart_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_performance ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver templates do seu tenant
DROP POLICY IF EXISTS "Users can view smart templates from their tenant" ON public.smart_templates;
CREATE POLICY "Users can view smart templates from their tenant"
  ON public.smart_templates FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem gerenciar templates do seu tenant
DROP POLICY IF EXISTS "Users can manage smart templates in their tenant" ON public.smart_templates;
CREATE POLICY "Users can manage smart templates in their tenant"
  ON public.smart_templates FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem ver testes A/B do seu tenant
DROP POLICY IF EXISTS "Users can view ab tests from their tenant" ON public.template_ab_tests;
CREATE POLICY "Users can view ab tests from their tenant"
  ON public.template_ab_tests FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem gerenciar testes A/B do seu tenant
DROP POLICY IF EXISTS "Users can manage ab tests in their tenant" ON public.template_ab_tests;
CREATE POLICY "Users can manage ab tests in their tenant"
  ON public.template_ab_tests FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem ver performance do seu tenant
DROP POLICY IF EXISTS "Users can view template performance from their tenant" ON public.template_performance;
CREATE POLICY "Users can view template performance from their tenant"
  ON public.template_performance FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- ============================================
-- 6. TRIGGERS: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_smart_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_smart_templates_updated_at ON public.smart_templates;
CREATE TRIGGER trigger_update_smart_templates_updated_at
  BEFORE UPDATE ON public.smart_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_smart_templates_updated_at();

CREATE OR REPLACE FUNCTION public.update_template_ab_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_ab_tests_updated_at ON public.template_ab_tests;
CREATE TRIGGER trigger_update_template_ab_tests_updated_at
  BEFORE UPDATE ON public.template_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_ab_tests_updated_at();

CREATE OR REPLACE FUNCTION public.update_template_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_performance_updated_at ON public.template_performance;
CREATE TRIGGER trigger_update_template_performance_updated_at
  BEFORE UPDATE ON public.template_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_performance_updated_at();

-- ============================================
-- 7. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.smart_templates IS 'Templates inteligentes gerados por IA';
COMMENT ON TABLE public.template_ab_tests IS 'Testes A/B de templates';
COMMENT ON TABLE public.template_performance IS 'Métricas de performance de templates';
COMMENT ON COLUMN public.smart_templates.performance_metrics IS 'Métricas agregadas de performance (open rate, click rate, etc)';

