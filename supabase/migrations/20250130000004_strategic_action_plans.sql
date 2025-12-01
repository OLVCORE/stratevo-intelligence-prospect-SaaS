-- Tabela para Planos de Ação Estratégicos
-- Armazena planos gerados com investimentos proporcionais ao capital social

CREATE TABLE IF NOT EXISTS public.strategic_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  icp_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE SET NULL,
  
  -- Capital social base para cálculo de investimentos
  company_capital_social NUMERIC(15,2) DEFAULT 0,
  
  -- Dados do plano
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ações com status, prioridade, prazo, responsável, investimento
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb, -- KPIs e métricas
  risks JSONB NOT NULL DEFAULT '[]'::jsonb, -- Matriz de riscos
  quick_wins JSONB NOT NULL DEFAULT '[]'::jsonb, -- Quick wins imediatos
  critical_decisions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Decisões críticas
  ceo_recommendation TEXT, -- Recomendação principal do CEO
  
  -- Resumo de investimentos
  investment_summary JSONB NOT NULL DEFAULT '{
    "shortTerm": 0,
    "mediumTerm": 0,
    "longTerm": 0
  }'::jsonb,
  
  -- Metadados
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_strategic_plans_tenant ON public.strategic_action_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_icp ON public.strategic_action_plans(icp_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_status ON public.strategic_action_plans(status);

-- RLS
ALTER TABLE public.strategic_action_plans ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver planos do seu tenant
CREATE POLICY "Users can view their tenant strategic plans" 
ON public.strategic_action_plans FOR SELECT 
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Política: usuários podem criar planos para seu tenant
CREATE POLICY "Users can create strategic plans for their tenant" 
ON public.strategic_action_plans FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Política: usuários podem atualizar planos do seu tenant
CREATE POLICY "Users can update their tenant strategic plans" 
ON public.strategic_action_plans FOR UPDATE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Política: usuários podem deletar planos do seu tenant
CREATE POLICY "Users can delete their tenant strategic plans" 
ON public.strategic_action_plans FOR DELETE 
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_strategic_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS strategic_plans_updated_at ON public.strategic_action_plans;
CREATE TRIGGER strategic_plans_updated_at
  BEFORE UPDATE ON public.strategic_action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_plan_updated_at();

-- Comentários
COMMENT ON TABLE public.strategic_action_plans IS 'Planos de ação estratégicos com investimentos proporcionais ao capital social';
COMMENT ON COLUMN public.strategic_action_plans.actions IS 'Array de ações com status (backlog, todo, in_progress, done), prioridade, prazo, responsável e investimento estimado';
COMMENT ON COLUMN public.strategic_action_plans.investment_summary IS 'Resumo de investimentos por prazo: curto (0-6m), médio (6-18m), longo (18-36m)';

