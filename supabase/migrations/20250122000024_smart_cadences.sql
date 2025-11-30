-- ============================================================================
-- MIGRATION: Smart Cadences - Cadências Multi-Canal Inteligentes
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Sistema de cadências inteligentes com otimização de timing e personalização
-- ============================================================================

-- ============================================
-- 1. TABELA: SMART CADENCES (Cadências Inteligentes)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_cadences') THEN
    CREATE TABLE public.smart_cadences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Informações básicas
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      
      -- Configuração de canais
      channels JSONB NOT NULL DEFAULT '[]'::JSONB, -- ['email', 'linkedin', 'whatsapp', 'call']
      channel_sequence JSONB NOT NULL DEFAULT '[]'::JSONB, -- Sequência de canais
      
      -- Timing inteligente
      timing_rules JSONB DEFAULT '{}'::JSONB, -- Regras de timing por canal
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      business_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}'::JSONB,
      
      -- Personalização
      personalization_enabled BOOLEAN DEFAULT true,
      personalization_rules JSONB DEFAULT '{}'::JSONB,
      
      -- Auto-skip
      auto_skip_enabled BOOLEAN DEFAULT true,
      auto_skip_rules JSONB DEFAULT '{}'::JSONB, -- Regras para pular leads não responsivos
      
      -- Priorização
      prioritization_enabled BOOLEAN DEFAULT true,
      prioritization_rules JSONB DEFAULT '{}'::JSONB,
      
      -- Analytics
      total_leads INTEGER DEFAULT 0,
      active_leads INTEGER DEFAULT 0,
      completed_leads INTEGER DEFAULT 0,
      response_rate NUMERIC(5,2) DEFAULT 0,
      average_response_time INTEGER, -- em horas
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_smart_cadences_tenant ON public.smart_cadences(tenant_id);
    CREATE INDEX idx_smart_cadences_active ON public.smart_cadences(tenant_id, is_active);
  END IF;
END $$;

-- ============================================
-- 2. TABELA: CADENCE EXECUTIONS (Execuções de Cadência)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cadence_executions') THEN
    CREATE TABLE public.cadence_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      cadence_id UUID NOT NULL REFERENCES public.smart_cadences(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
      deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed, skipped
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER NOT NULL,
      
      -- Timing
      started_at TIMESTAMPTZ DEFAULT now(),
      next_action_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      paused_at TIMESTAMPTZ,
      
      -- Respostas
      has_response BOOLEAN DEFAULT false,
      first_response_at TIMESTAMPTZ,
      response_channel TEXT,
      
      -- Priorização
      priority_score NUMERIC(5,2) DEFAULT 0,
      last_priority_update TIMESTAMPTZ,
      
      -- Metadata
      execution_data JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_cadence_executions_tenant ON public.cadence_executions(tenant_id);
    CREATE INDEX idx_cadence_executions_cadence ON public.cadence_executions(cadence_id);
    CREATE INDEX idx_cadence_executions_lead ON public.cadence_executions(lead_id);
    CREATE INDEX idx_cadence_executions_status ON public.cadence_executions(tenant_id, status);
    CREATE INDEX idx_cadence_executions_next_action ON public.cadence_executions(tenant_id, next_action_at) WHERE status = 'active';
  END IF;
END $$;

-- ============================================
-- 3. TABELA: CADENCE STEPS (Passos da Cadência)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cadence_steps') THEN
    CREATE TABLE public.cadence_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      cadence_id UUID NOT NULL REFERENCES public.smart_cadences(id) ON DELETE CASCADE,
      
      -- Ordem e tipo
      step_order INTEGER NOT NULL,
      step_type TEXT NOT NULL, -- email, linkedin, whatsapp, call, task
      
      -- Configuração
      template_id UUID, -- Referência a email_template ou outro template
      subject TEXT,
      content TEXT,
      delay_days INTEGER DEFAULT 0, -- Dias após passo anterior
      delay_hours INTEGER DEFAULT 0, -- Horas após passo anterior
      
      -- Timing otimizado
      optimal_time_window JSONB, -- {"start": "10:00", "end": "14:00"}
      day_of_week INTEGER[], -- [1,2,3,4,5] para segunda a sexta
      
      -- Condições
      conditions JSONB DEFAULT '{}'::JSONB, -- Condições para executar este passo
      skip_conditions JSONB DEFAULT '{}'::JSONB, -- Condições para pular este passo
      
      -- Analytics
      execution_count INTEGER DEFAULT 0,
      response_count INTEGER DEFAULT 0,
      response_rate NUMERIC(5,2) DEFAULT 0,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      
      UNIQUE(cadence_id, step_order)
    );

    CREATE INDEX idx_cadence_steps_cadence ON public.cadence_steps(cadence_id);
    CREATE INDEX idx_cadence_steps_tenant ON public.cadence_steps(tenant_id);
  END IF;
END $$;

-- ============================================
-- 4. TABELA: CADENCE PERFORMANCE (Performance de Cadências)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cadence_performance') THEN
    CREATE TABLE public.cadence_performance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      cadence_id UUID NOT NULL REFERENCES public.smart_cadences(id) ON DELETE CASCADE,
      
      -- Período
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      
      -- Métricas
      total_leads INTEGER DEFAULT 0,
      active_leads INTEGER DEFAULT 0,
      completed_leads INTEGER DEFAULT 0,
      skipped_leads INTEGER DEFAULT 0,
      
      -- Respostas
      total_responses INTEGER DEFAULT 0,
      response_rate NUMERIC(5,2) DEFAULT 0,
      average_response_time INTEGER, -- em horas
      
      -- Conversões
      meetings_booked INTEGER DEFAULT 0,
      deals_created INTEGER DEFAULT 0,
      deals_won INTEGER DEFAULT 0,
      
      -- Revenue
      total_revenue NUMERIC(12,2) DEFAULT 0,
      
      -- Metadata
      calculated_at TIMESTAMPTZ DEFAULT now(),
      
      UNIQUE(cadence_id, period_start, period_end)
    );

    CREATE INDEX idx_cadence_performance_cadence ON public.cadence_performance(cadence_id);
    CREATE INDEX idx_cadence_performance_tenant ON public.cadence_performance(tenant_id);
    CREATE INDEX idx_cadence_performance_period ON public.cadence_performance(period_start, period_end);
  END IF;
END $$;

-- ============================================
-- 5. RLS (Row Level Security)
-- ============================================
ALTER TABLE public.smart_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_performance ENABLE ROW LEVEL SECURITY;

-- Policies para smart_cadences
DROP POLICY IF EXISTS "Users can view smart cadences from their tenant" ON public.smart_cadences;
CREATE POLICY "Users can view smart cadences from their tenant"
  ON public.smart_cadences FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage smart cadences in their tenant" ON public.smart_cadences;
CREATE POLICY "Users can manage smart cadences in their tenant"
  ON public.smart_cadences FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para cadence_executions
DROP POLICY IF EXISTS "Users can view cadence executions from their tenant" ON public.cadence_executions;
CREATE POLICY "Users can view cadence executions from their tenant"
  ON public.cadence_executions FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage cadence executions in their tenant" ON public.cadence_executions;
CREATE POLICY "Users can manage cadence executions in their tenant"
  ON public.cadence_executions FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para cadence_steps
DROP POLICY IF EXISTS "Users can view cadence steps from their tenant" ON public.cadence_steps;
CREATE POLICY "Users can view cadence steps from their tenant"
  ON public.cadence_steps FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage cadence steps in their tenant" ON public.cadence_steps;
CREATE POLICY "Users can manage cadence steps in their tenant"
  ON public.cadence_steps FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para cadence_performance
DROP POLICY IF EXISTS "Users can view cadence performance from their tenant" ON public.cadence_performance;
CREATE POLICY "Users can view cadence performance from their tenant"
  ON public.cadence_performance FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- ============================================
-- 6. TRIGGERS: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_smart_cadences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_smart_cadences_updated_at ON public.smart_cadences;
CREATE TRIGGER trigger_update_smart_cadences_updated_at
  BEFORE UPDATE ON public.smart_cadences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_smart_cadences_updated_at();

DROP TRIGGER IF EXISTS trigger_update_cadence_executions_updated_at ON public.cadence_executions;
CREATE TRIGGER trigger_update_cadence_executions_updated_at
  BEFORE UPDATE ON public.cadence_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_smart_cadences_updated_at();

DROP TRIGGER IF EXISTS trigger_update_cadence_steps_updated_at ON public.cadence_steps;
CREATE TRIGGER trigger_update_cadence_steps_updated_at
  BEFORE UPDATE ON public.cadence_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_smart_cadences_updated_at();

-- ============================================
-- 7. NOTIFY POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

