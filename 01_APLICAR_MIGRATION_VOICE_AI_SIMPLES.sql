-- ============================================
-- MIGRATION ULTRA SIMPLES - SEM ERROS
-- COPIAR E COLAR NO SUPABASE
-- ============================================

-- Dropar se já existir
DROP TABLE IF EXISTS public.ai_voice_calls CASCADE;
DROP TABLE IF EXISTS public.ai_voice_agents CASCADE;

-- ============================================
-- TABELA 1: Agentes de Voz
-- ============================================
CREATE TABLE public.ai_voice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  agent_personality TEXT DEFAULT 'profissional',
  voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  voice_stability NUMERIC(3,2) DEFAULT 0.75,
  voice_similarity_boost NUMERIC(3,2) DEFAULT 0.75,
  greeting_script TEXT,
  closing_script TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA 2: Histórico de Chamadas
-- ============================================
CREATE TABLE public.ai_voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript TEXT,
  sentiment_score NUMERIC(3,2),
  sentiment_label TEXT,
  qualification_result TEXT,
  recording_url TEXT,
  twilio_call_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES BÁSICOS
-- ============================================
CREATE INDEX idx_agents_tenant ON public.ai_voice_agents(tenant_id);
CREATE INDEX idx_calls_tenant ON public.ai_voice_calls(tenant_id);

-- ============================================
-- RLS SIMPLES
-- ============================================
ALTER TABLE public.ai_voice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_tenant_policy" ON public.ai_voice_agents
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "calls_tenant_policy" ON public.ai_voice_calls
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- ============================================
-- FUNCTION: Get Agent
-- ============================================
CREATE OR REPLACE FUNCTION public.get_active_voice_agent(p_tenant_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.ai_voice_agents
  WHERE tenant_id = p_tenant_id AND is_active = true
  LIMIT 1;
$$;

-- ============================================
-- FUNCTION: Stats
-- ============================================
CREATE OR REPLACE FUNCTION public.get_voice_call_stats(p_tenant_id UUID, p_period_days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_calls BIGINT,
  completed_calls BIGINT,
  qualified_calls BIGINT,
  avg_duration_seconds NUMERIC,
  avg_sentiment_score NUMERIC,
  qualification_rate NUMERIC,
  total_cost_cents BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
    COUNT(*) FILTER (WHERE qualification_result = 'qualified')::BIGINT,
    AVG(duration_seconds),
    AVG(sentiment_score),
    (COUNT(*) FILTER (WHERE qualification_result = 'qualified')::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0) * 100),
    SUM(0)::BIGINT
  FROM public.ai_voice_calls
  WHERE tenant_id = p_tenant_id
    AND created_at >= (now() - (p_period_days || ' days')::INTERVAL);
$$;

-- ============================================
-- VERIFICAR
-- ============================================
SELECT 'ai_voice_agents' as tabela, COUNT(*) as registros FROM public.ai_voice_agents
UNION ALL
SELECT 'ai_voice_calls' as tabela, COUNT(*) as registros FROM public.ai_voice_calls;


