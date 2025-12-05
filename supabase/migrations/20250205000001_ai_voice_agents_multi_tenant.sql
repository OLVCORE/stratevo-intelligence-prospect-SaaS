-- ============================================
-- AI VOICE AGENTS - MULTI-TENANT
-- Cada tenant configura seu próprio agente de voz
-- ============================================

-- Tabela de configuração de agentes de voz por tenant
CREATE TABLE IF NOT EXISTS public.ai_voice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-Tenant
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Configuração do Agente
  agent_name TEXT NOT NULL, -- Nome do agente (ex: "Assistente Virtual Acme Corp")
  agent_personality TEXT NOT NULL, -- Personalidade (ex: "profissional", "amigável", "técnico")
  agent_language TEXT NOT NULL DEFAULT 'pt-BR',
  
  -- Voz (ElevenLabs)
  voice_id TEXT NOT NULL, -- ID da voz no ElevenLabs
  voice_stability NUMERIC(3,2) DEFAULT 0.75, -- 0.0 - 1.0
  voice_similarity_boost NUMERIC(3,2) DEFAULT 0.75, -- 0.0 - 1.0
  
  -- Scripts & Comportamento
  greeting_script TEXT NOT NULL, -- Script de saudação inicial
  qualification_questions JSONB DEFAULT '[]'::JSONB, -- Perguntas de qualificação
  objection_handling JSONB DEFAULT '{}'::JSONB, -- Respostas para objeções comuns
  closing_script TEXT, -- Script de encerramento
  
  -- Configurações de Chamada
  max_call_duration_seconds INTEGER DEFAULT 300, -- 5 minutos padrão
  auto_hangup_on_silence BOOLEAN DEFAULT true,
  silence_threshold_seconds INTEGER DEFAULT 10,
  
  -- Integração com CRM
  auto_create_activity BOOLEAN DEFAULT true, -- Criar atividade no CRM automaticamente
  auto_transcribe BOOLEAN DEFAULT true, -- Transcrever chamada automaticamente
  auto_sentiment_analysis BOOLEAN DEFAULT true, -- Análise de sentimento automática
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Garantir 1 agente ativo por tenant
  UNIQUE(tenant_id, is_active)
);

-- Índices
CREATE INDEX idx_ai_voice_agents_tenant ON public.ai_voice_agents(tenant_id);
CREATE INDEX idx_ai_voice_agents_active ON public.ai_voice_agents(tenant_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.ai_voice_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's voice agent"
  ON public.ai_voice_agents FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage voice agents"
  ON public.ai_voice_agents FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- AI VOICE CALLS - Histórico de Chamadas
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-Tenant
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Agente Utilizado
  agent_id UUID NOT NULL REFERENCES public.ai_voice_agents(id) ON DELETE CASCADE,
  
  -- Relacionamento com CRM
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Dados da Chamada
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'outbound', 'inbound'
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'
  
  -- Duração & Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  talk_time_seconds INTEGER, -- Tempo de fala do agente
  customer_talk_time_seconds INTEGER, -- Tempo de fala do cliente
  
  -- Transcrição & Análise
  transcript TEXT,
  transcript_language TEXT DEFAULT 'pt-BR',
  
  -- Sentiment Analysis
  sentiment_score NUMERIC(3,2), -- -1.0 (muito negativo) a 1.0 (muito positivo)
  sentiment_label TEXT, -- 'positive', 'neutral', 'negative'
  emotions_detected JSONB, -- ['feliz', 'frustrado', 'interessado']
  
  -- Qualificação & Resultado
  qualification_result TEXT, -- 'qualified', 'not_qualified', 'follow_up_required', 'not_interested'
  qualification_score INTEGER, -- 0-100
  objections_raised TEXT[], -- Array de objeções mencionadas
  pain_points_identified TEXT[], -- Dores identificadas
  buying_signals JSONB, -- Sinais de compra detectados
  
  -- Próximos Passos
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  next_best_action TEXT, -- Recomendação de próxima ação
  
  -- Arquivos & Links
  recording_url TEXT, -- URL da gravação (Twilio)
  recording_duration_seconds INTEGER,
  
  -- Integração Twilio
  twilio_call_sid TEXT UNIQUE,
  twilio_status TEXT,
  twilio_error_code TEXT,
  twilio_error_message TEXT,
  
  -- Custos
  cost_cents INTEGER, -- Custo em centavos
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para Performance
CREATE INDEX idx_ai_voice_calls_tenant ON public.ai_voice_calls(tenant_id);
CREATE INDEX idx_ai_voice_calls_agent ON public.ai_voice_calls(agent_id);
CREATE INDEX idx_ai_voice_calls_lead ON public.ai_voice_calls(lead_id);
CREATE INDEX idx_ai_voice_calls_status ON public.ai_voice_calls(tenant_id, status);
CREATE INDEX idx_ai_voice_calls_created ON public.ai_voice_calls(tenant_id, created_at DESC);
CREATE INDEX idx_ai_voice_calls_qualification ON public.ai_voice_calls(tenant_id, qualification_result);

-- RLS
ALTER TABLE public.ai_voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's voice calls"
  ON public.ai_voice_calls FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create voice calls"
  ON public.ai_voice_calls FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their tenant's voice calls"
  ON public.ai_voice_calls FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid()
  ));

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função: Obter agente ativo do tenant
CREATE OR REPLACE FUNCTION public.get_active_voice_agent(p_tenant_id UUID)
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

-- Função: Calcular estatísticas de chamadas
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
    (COUNT(*) FILTER (WHERE qualification_result = 'qualified')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0) * 100) as qualification_rate,
    SUM(cost_cents)::BIGINT as total_cost_cents
  FROM public.ai_voice_calls
  WHERE tenant_id = p_tenant_id
    AND created_at >= (now() - (p_period_days || ' days')::INTERVAL);
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_ai_voice_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_ai_voice_agents_updated_at
  BEFORE UPDATE ON public.ai_voice_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_voice_updated_at();

CREATE TRIGGER trigger_update_ai_voice_calls_updated_at
  BEFORE UPDATE ON public.ai_voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_voice_updated_at();

-- ============================================
-- DADOS INICIAIS (Exemplo)
-- ============================================

-- Inserir agente padrão para cada tenant existente
-- (Executar apenas se tenants já existem)
-- INSERT INTO public.ai_voice_agents (tenant_id, agent_name, agent_personality, voice_id, greeting_script)
-- SELECT 
--   id as tenant_id,
--   'Assistente Virtual ' || name as agent_name,
--   'profissional' as agent_personality,
--   'ElevenLabs_voice_id_here' as voice_id,
--   'Olá! Sou o assistente virtual da ' || name || '. Como posso ajudá-lo hoje?' as greeting_script
-- FROM public.tenants
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.ai_voice_agents WHERE ai_voice_agents.tenant_id = tenants.id
-- );

-- ============================================
-- COMENTÁRIOS & DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.ai_voice_agents IS 'Configuração de agentes de voz IA por tenant - cada empresa tem seu próprio assistente virtual';
COMMENT ON TABLE public.ai_voice_calls IS 'Histórico completo de chamadas realizadas pelo agente de voz IA';

COMMENT ON COLUMN public.ai_voice_agents.agent_name IS 'Nome do agente (ex: Assistente Virtual Acme Corp)';
COMMENT ON COLUMN public.ai_voice_agents.agent_personality IS 'Personalidade do agente: profissional, amigável, técnico, consultivo';
COMMENT ON COLUMN public.ai_voice_agents.voice_id IS 'ID da voz no ElevenLabs - cada tenant pode ter voz customizada';

COMMENT ON COLUMN public.ai_voice_calls.sentiment_score IS 'Score de sentimento: -1.0 (muito negativo) a 1.0 (muito positivo)';
COMMENT ON COLUMN public.ai_voice_calls.qualification_result IS 'Resultado da qualificação: qualified, not_qualified, follow_up_required, not_interested';
COMMENT ON COLUMN public.ai_voice_calls.buying_signals IS 'Sinais de compra detectados durante a conversa (JSONB)';

-- ============================================
-- FIM DA MIGRATION
-- ============================================


