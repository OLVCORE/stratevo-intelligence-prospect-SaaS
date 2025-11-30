-- ============================================================================
-- CICLO 9: IA & AUTOMAÇÃO AVANÇADA - COMPLETO
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: AI Lead Scoring, Transcrição Avançada, Assistente Virtual
-- ============================================================================

-- ============================================
-- 1. TABELA DE SCORES DE IA (AI LEAD SCORES)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_lead_scores') THEN
    CREATE TABLE public.ai_lead_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
      deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
      
      -- Scores
      overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
      close_probability NUMERIC(5,2) CHECK (close_probability >= 0 AND close_probability <= 100),
      churn_risk NUMERIC(5,2) CHECK (churn_risk >= 0 AND churn_risk <= 100),
      
      -- Análise
      next_best_action TEXT,
      recommended_stage TEXT,
      confidence_level NUMERIC(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
      
      -- Fatores
      factors JSONB DEFAULT '{}'::jsonb, -- { "engagement": 85, "budget": 70, "timeline": 60 }
      insights TEXT[],
      
      -- Metadata
      model_version TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_lead_scores_tenant_id ON public.ai_lead_scores(tenant_id);
    CREATE INDEX idx_ai_lead_scores_lead_id ON public.ai_lead_scores(lead_id);
    CREATE INDEX idx_ai_lead_scores_deal_id ON public.ai_lead_scores(deal_id);
    CREATE INDEX idx_ai_lead_scores_overall_score ON public.ai_lead_scores(overall_score DESC);
    
    ALTER TABLE public.ai_lead_scores ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view AI lead scores from their tenant"
      ON public.ai_lead_scores FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 2. TABELA DE SUGESTÕES DE IA (AI SUGGESTIONS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_suggestions') THEN
    CREATE TABLE public.ai_suggestions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Contexto
      context_type TEXT NOT NULL CHECK (context_type IN ('email', 'whatsapp', 'call', 'meeting', 'proposal', 'general')),
      context_id UUID, -- ID do lead, deal, activity, etc
      
      -- Sugestão
      suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('response', 'action', 'follow_up', 'objection_handling', 'closing')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
      
      -- Ações
      suggested_actions JSONB DEFAULT '[]'::jsonb,
      
      -- Status
      is_applied BOOLEAN DEFAULT FALSE,
      applied_at TIMESTAMPTZ,
      feedback TEXT, -- 'helpful', 'not_helpful', 'neutral'
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_suggestions_tenant_id ON public.ai_suggestions(tenant_id);
    CREATE INDEX idx_ai_suggestions_user_id ON public.ai_suggestions(user_id);
    CREATE INDEX idx_ai_suggestions_context ON public.ai_suggestions(context_type, context_id);
    CREATE INDEX idx_ai_suggestions_type ON public.ai_suggestions(suggestion_type);
    CREATE INDEX idx_ai_suggestions_unapplied ON public.ai_suggestions(user_id, is_applied) WHERE is_applied = FALSE;
    
    ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own AI suggestions"
      ON public.ai_suggestions FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
    
    CREATE POLICY "Users can update their own AI suggestions"
      ON public.ai_suggestions FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid())
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 3. TABELA DE RESUMOS DE CONVERSAS (AI CONVERSATION SUMMARIES)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_conversation_summaries') THEN
    CREATE TABLE public.ai_conversation_summaries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Contexto
      conversation_type TEXT NOT NULL CHECK (conversation_type IN ('email_thread', 'whatsapp_chat', 'call', 'meeting')),
      conversation_id UUID, -- ID do email thread, call recording, etc
      lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
      deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
      
      -- Resumo
      summary TEXT NOT NULL,
      key_points TEXT[],
      sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
      sentiment_score NUMERIC(3,2),
      
      -- Insights
      action_items JSONB DEFAULT '[]'::jsonb,
      next_steps TEXT[],
      topics_discussed TEXT[],
      
      -- Metadata
      word_count INTEGER,
      duration_minutes INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_conversation_summaries_tenant_id ON public.ai_conversation_summaries(tenant_id);
    CREATE INDEX idx_ai_conversation_summaries_lead_id ON public.ai_conversation_summaries(lead_id);
    CREATE INDEX idx_ai_conversation_summaries_deal_id ON public.ai_conversation_summaries(deal_id);
    CREATE INDEX idx_ai_conversation_summaries_type ON public.ai_conversation_summaries(conversation_type, conversation_id);
    
    ALTER TABLE public.ai_conversation_summaries ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view AI conversation summaries from their tenant"
      ON public.ai_conversation_summaries FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 4. FUNÇÃO: ATUALIZAR SCORE DE LEAD AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.update_ai_lead_score()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Obter tenant_id
  SELECT get_current_tenant_id() INTO v_tenant_id;
  
  -- Chamar Edge Function para calcular score (será implementado)
  -- Por enquanto, apenas criar registro placeholder
  INSERT INTO public.ai_lead_scores (
    tenant_id,
    lead_id,
    overall_score,
    close_probability,
    confidence_level
  ) VALUES (
    v_tenant_id,
    NEW.id,
    50, -- Score padrão
    50, -- Probabilidade padrão
    0.5 -- Confiança padrão
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar score quando lead é criado
DROP TRIGGER IF EXISTS trigger_update_ai_lead_score ON public.leads;
CREATE TRIGGER trigger_update_ai_lead_score
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_lead_score();

-- ============================================
-- 5. TRIGGERS PARA updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_ai_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_lead_scores_updated_at ON public.ai_lead_scores;
CREATE TRIGGER trigger_update_ai_lead_scores_updated_at
  BEFORE UPDATE ON public.ai_lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_tables_updated_at();

-- ============================================
-- 6. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.ai_lead_scores IS 'Scores de IA para leads e deals (probabilidade de fechamento, risco de churn)';
COMMENT ON TABLE public.ai_suggestions IS 'Sugestões automáticas de IA para respostas, ações e follow-ups';
COMMENT ON TABLE public.ai_conversation_summaries IS 'Resumos automáticos de conversas (emails, chamadas, reuniões)';

