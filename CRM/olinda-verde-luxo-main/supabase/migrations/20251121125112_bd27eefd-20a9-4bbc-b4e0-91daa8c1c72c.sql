-- Tabela para análises de IA
CREATE TABLE IF NOT EXISTS public.ai_lead_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  score_version TEXT NOT NULL,
  predicted_probability DECIMAL(5,2) NOT NULL CHECK (predicted_probability >= 0 AND predicted_probability <= 100),
  predicted_close_date DATE,
  churn_risk TEXT CHECK (churn_risk IN ('low', 'medium', 'high')),
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  confidence_level DECIMAL(5,2),
  analysis_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para transcrições de chamadas
CREATE TABLE IF NOT EXISTS public.call_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.call_history(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  transcription_text TEXT NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  confidence DECIMAL(5,2),
  duration_seconds INTEGER,
  sentiment_score DECIMAL(5,2),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  key_phrases JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  entities JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para insights do assistente virtual
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('next_action', 'response_suggestion', 'conversation_summary', 'opportunity', 'warning', 'trend')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_action TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  confidence DECIMAL(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para análise de sentimento de conversas
CREATE TABLE IF NOT EXISTS public.conversation_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('email', 'whatsapp', 'call', 'chat')),
  reference_id UUID,
  sentiment_score DECIMAL(5,2) NOT NULL,
  sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  emotions JSONB DEFAULT '[]'::jsonb,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high')),
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para histórico de predições
CREATE TABLE IF NOT EXISTS public.ai_predictions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  predicted_value TEXT NOT NULL,
  actual_value TEXT,
  accuracy_score DECIMAL(5,2),
  model_version TEXT,
  predicted_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_lead_analysis_lead ON public.ai_lead_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_lead_analysis_created ON public.ai_lead_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call ON public.call_transcriptions(call_id);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_lead ON public.call_transcriptions(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_lead ON public.ai_insights(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_read ON public.ai_insights(is_read, is_actioned);
CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_lead ON public.conversation_sentiment(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_type ON public.conversation_sentiment(conversation_type);
CREATE INDEX IF NOT EXISTS idx_predictions_history_lead ON public.ai_predictions_history(lead_id);

-- Triggers
CREATE TRIGGER update_ai_lead_analysis_updated_at
  BEFORE UPDATE ON public.ai_lead_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE public.ai_lead_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions_history ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_lead_analysis
CREATE POLICY "Admins/Gestores podem ver análises"
  ON public.ai_lead_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia', 'gestor')
    )
  );

CREATE POLICY "Vendedores podem ver análises de seus leads"
  ON public.ai_lead_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar análises"
  ON public.ai_lead_analysis FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para call_transcriptions
CREATE POLICY "Usuários autenticados podem ver transcrições"
  ON public.call_transcriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar transcrições"
  ON public.call_transcriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para ai_insights
CREATE POLICY "Usuários podem ver seus próprios insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus insights"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (true);

-- Políticas para conversation_sentiment
CREATE POLICY "Usuários autenticados podem ver sentimentos"
  ON public.conversation_sentiment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar sentimentos"
  ON public.conversation_sentiment FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para ai_predictions_history
CREATE POLICY "Admins podem ver histórico de predições"
  ON public.ai_predictions_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia')
    )
  );

CREATE POLICY "Sistema pode gerenciar histórico"
  ON public.ai_predictions_history FOR ALL
  USING (true)
  WITH CHECK (true);