-- ==========================================
-- SEQUÊNCIAS COMERCIAIS (MVP)
-- Sistema simples de sequências para comunicação
-- ==========================================

-- 1. Tabela de Sequências
CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabela de Steps da Sequência
CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  
  day_offset INTEGER NOT NULL DEFAULT 0, -- Dias após início da sequência
  tipo TEXT NOT NULL CHECK (tipo IN ('whatsapp', 'email', 'task')),
  template_text TEXT NOT NULL,
  subject TEXT, -- Para emails
  step_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Execuções de Sequências
CREATE TABLE IF NOT EXISTS public.sequence_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_sequences_tenant ON public.sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sequences_active ON public.sequences(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON public.sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_order ON public.sequence_steps(sequence_id, step_order);

CREATE INDEX IF NOT EXISTS idx_sequence_executions_tenant ON public.sequence_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sequence_executions_sequence ON public.sequence_executions(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_executions_lead ON public.sequence_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_executions_deal ON public.sequence_executions(deal_id);
CREATE INDEX IF NOT EXISTS idx_sequence_executions_status ON public.sequence_executions(tenant_id, status);

-- 5. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sequences_updated_at ON public.sequences;
CREATE TRIGGER trigger_update_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_sequences_updated_at();

CREATE OR REPLACE FUNCTION update_sequence_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sequence_executions_updated_at ON public.sequence_executions;
CREATE TRIGGER trigger_update_sequence_executions_updated_at
  BEFORE UPDATE ON public.sequence_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_sequence_executions_updated_at();

-- 6. RLS Policies
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_executions ENABLE ROW LEVEL SECURITY;

-- Sequences: Users can view sequences from their tenant
CREATE POLICY "Users can view sequences from their tenant"
  ON public.sequences FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Sequences: Users can manage sequences in their tenant
CREATE POLICY "Users can manage sequences in their tenant"
  ON public.sequences FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Sequence Steps: Users can view steps from their tenant sequences
CREATE POLICY "Users can view sequence steps from their tenant"
  ON public.sequence_steps FOR SELECT
  USING (
    sequence_id IN (
      SELECT id FROM public.sequences
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.users 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Sequence Steps: Users can manage steps from their tenant sequences
CREATE POLICY "Users can manage sequence steps from their tenant"
  ON public.sequence_steps FOR ALL
  USING (
    sequence_id IN (
      SELECT id FROM public.sequences
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.users 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Sequence Executions: Users can view executions from their tenant
CREATE POLICY "Users can view sequence executions from their tenant"
  ON public.sequence_executions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Sequence Executions: Users can manage executions from their tenant
CREATE POLICY "Users can manage sequence executions from their tenant"
  ON public.sequence_executions FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 7. Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequence_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequence_executions TO authenticated;

-- 8. Comentários
COMMENT ON TABLE public.sequences IS 'Sequências comerciais para comunicação com leads/deals';
COMMENT ON TABLE public.sequence_steps IS 'Passos individuais de uma sequência comercial';
COMMENT ON TABLE public.sequence_executions IS 'Execuções ativas de sequências para leads/deals específicos';

COMMENT ON COLUMN public.sequence_steps.day_offset IS 'Dias após início da sequência para executar este passo';
COMMENT ON COLUMN public.sequence_steps.tipo IS 'Tipo de comunicação: whatsapp, email, task';
COMMENT ON COLUMN public.sequence_executions.status IS 'Status: active (em andamento), paused (pausada), completed (concluída), cancelled (cancelada)';


