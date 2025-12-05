-- ============================================
-- GROWTH ENGINE - AI VOICE SDR MULTI-TENANT
-- MIGRATION LIMPA E SEGURA
-- COPIAR E COLAR NO SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- LIMPEZA (dropar se existir)
-- ============================================

-- Dropar policies antigas
DROP POLICY IF EXISTS "Users can view their tenant's voice agent" ON public.ai_voice_agents;
DROP POLICY IF EXISTS "Users can manage voice agents" ON public.ai_voice_agents;
DROP POLICY IF EXISTS "Users can view their tenant's voice calls" ON public.ai_voice_calls;
DROP POLICY IF EXISTS "Users can create voice calls" ON public.ai_voice_calls;
DROP POLICY IF EXISTS "Users can update voice calls" ON public.ai_voice_calls;

-- Dropar triggers
DROP TRIGGER IF EXISTS trigger_update_ai_voice_agents_updated_at ON public.ai_voice_agents;
DROP TRIGGER IF EXISTS trigger_update_ai_voice_calls_updated_at ON public.ai_voice_calls;

-- Dropar functions antigas
DROP FUNCTION IF EXISTS public.get_active_voice_agent(UUID);
DROP FUNCTION IF EXISTS public.get_voice_call_stats(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.update_ai_voice_updated_at();

-- Dropar índices
DROP INDEX IF EXISTS public.idx_ai_voice_agents_tenant;
DROP INDEX IF EXISTS public.idx_ai_voice_agents_active;
DROP INDEX IF EXISTS public.idx_ai_voice_calls_tenant;
DROP INDEX IF EXISTS public.idx_ai_voice_calls_agent;
DROP INDEX IF EXISTS public.idx_ai_voice_calls_lead;
DROP INDEX IF EXISTS public.idx_ai_voice_calls_status;
DROP INDEX IF EXISTS public.idx_ai_voice_calls_created;
DROP INDEX IF EXISTS public.idx_ai_voice_calls_twilio;

-- Dropar tabelas (CASCADE para remover dependências)
DROP TABLE IF EXISTS public.ai_voice_calls CASCADE;
DROP TABLE IF EXISTS public.ai_voice_agents CASCADE;

-- ============================================
-- CRIAR TABELAS DO ZERO
-- ============================================

-- TABELA 1: ai_voice_agents
CREATE TABLE public.ai_voice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  agent_personality TEXT NOT NULL DEFAULT 'profissional',
  agent_language TEXT NOT NULL DEFAULT 'pt-BR',
  voice_id TEXT NOT NULL DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  voice_stability NUMERIC(3,2) DEFAULT 0.75,
  voice_similarity_boost NUMERIC(3,2) DEFAULT 0.75,
  greeting_script TEXT NOT NULL,
  qualification_questions JSONB DEFAULT '[]'::JSONB,
  objection_handling JSONB DEFAULT '{}'::JSONB,
  closing_script TEXT,
  max_call_duration_seconds INTEGER DEFAULT 300,
  auto_hangup_on_silence BOOLEAN DEFAULT true,
  silence_threshold_seconds INTEGER DEFAULT 10,
  auto_create_activity BOOLEAN DEFAULT true,
  auto_transcribe BOOLEAN DEFAULT true,
  auto_sentiment_analysis BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- TABELA 2: ai_voice_calls
CREATE TABLE public.ai_voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID,
  lead_id UUID,
  company_id UUID,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  talk_time_seconds INTEGER,
  customer_talk_time_seconds INTEGER,
  transcript TEXT,
  transcript_language TEXT DEFAULT 'pt-BR',
  sentiment_score NUMERIC(3,2),
  sentiment_label TEXT,
  emotions_detected JSONB,
  qualification_result TEXT,
  qualification_score INTEGER,
  objections_raised TEXT[],
  pain_points_identified TEXT[],
  buying_signals JSONB,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  next_best_action TEXT,
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  twilio_call_sid TEXT,
  twilio_status TEXT,
  twilio_error_code TEXT,
  twilio_error_message TEXT,
  cost_cents INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_ai_voice_agents_tenant ON public.ai_voice_agents(tenant_id);
CREATE INDEX idx_ai_voice_agents_active ON public.ai_voice_agents(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX idx_ai_voice_calls_tenant ON public.ai_voice_calls(tenant_id);
CREATE INDEX idx_ai_voice_calls_agent ON public.ai_voice_calls(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_ai_voice_calls_lead ON public.ai_voice_calls(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_ai_voice_calls_status ON public.ai_voice_calls(tenant_id, status);
CREATE INDEX idx_ai_voice_calls_created ON public.ai_voice_calls(tenant_id, created_at DESC);
CREATE INDEX idx_ai_voice_calls_twilio ON public.ai_voice_calls(twilio_call_sid) WHERE twilio_call_sid IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.ai_voice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_calls ENABLE ROW LEVEL SECURITY;

-- Policies para ai_voice_agents
CREATE POLICY "Users can view their tenant's voice agent"
  ON public.ai_voice_agents FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage voice agents"
  ON public.ai_voice_agents FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Policies para ai_voice_calls
CREATE POLICY "Users can view their tenant's voice calls"
  ON public.ai_voice_calls FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create voice calls"
  ON public.ai_voice_calls FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update voice calls"
  ON public.ai_voice_calls FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função: Obter agente ativo do tenant
CREATE FUNCTION public.get_active_voice_agent(p_tenant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
BEGIN
  SELECT id INTO v_agent_id
  FROM public.ai_voice_agents
  WHERE tenant_id = p_tenant_id
    AND is_active = true
  LIMIT 1;
  
  RETURN v_agent_id;
END;
$$;

-- Função: Estatísticas de chamadas
CREATE FUNCTION public.get_voice_call_stats(
  p_tenant_id UUID, 
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_calls BIGINT,
  completed_calls BIGINT,
  qualified_calls BIGINT,
  avg_duration_seconds NUMERIC,
  avg_sentiment_score NUMERIC,
  qualification_rate NUMERIC,
  total_cost_cents BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_calls,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_calls,
    COUNT(*) FILTER (WHERE qualification_result = 'qualified')::BIGINT as qualified_calls,
    AVG(duration_seconds) as avg_duration_seconds,
    AVG(sentiment_score) as avg_sentiment_score,
    (COUNT(*) FILTER (WHERE qualification_result = 'qualified')::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0) * 100) as qualification_rate,
    SUM(cost_cents)::BIGINT as total_cost_cents
  FROM public.ai_voice_calls
  WHERE tenant_id = p_tenant_id
    AND created_at >= (now() - (p_period_days || ' days')::INTERVAL);
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger function: Atualizar updated_at
CREATE FUNCTION public.update_ai_voice_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar triggers
CREATE TRIGGER trigger_update_ai_voice_agents_updated_at
  BEFORE UPDATE ON public.ai_voice_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_voice_updated_at();

CREATE TRIGGER trigger_update_ai_voice_calls_updated_at
  BEFORE UPDATE ON public.ai_voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_voice_updated_at();

-- ============================================
-- COMENTÁRIOS (Documentação)
-- ============================================
COMMENT ON TABLE public.ai_voice_agents IS 'Configuração de agentes de voz IA por tenant - cada empresa tem seu próprio assistente virtual';
COMMENT ON TABLE public.ai_voice_calls IS 'Histórico completo de chamadas realizadas pelo agente de voz IA';

COMMENT ON COLUMN public.ai_voice_agents.agent_name IS 'Nome do agente (ex: Assistente Virtual Acme Corp)';
COMMENT ON COLUMN public.ai_voice_agents.voice_id IS 'ID da voz no ElevenLabs';
COMMENT ON COLUMN public.ai_voice_calls.sentiment_score IS 'Score de sentimento: -1.0 (negativo) a 1.0 (positivo)';
COMMENT ON COLUMN public.ai_voice_calls.qualification_result IS 'Resultado: qualified, not_qualified, follow_up_required, not_interested';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Contar tabelas criadas
SELECT 
  COUNT(*) as tabelas_criadas,
  '✅ Migration aplicada com sucesso!' as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('ai_voice_agents', 'ai_voice_calls');

-- Listar colunas da tabela ai_voice_calls para confirmar
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ai_voice_calls'
ORDER BY ordinal_position;
