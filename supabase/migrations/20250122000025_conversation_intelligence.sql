-- ============================================================================
-- MIGRATION: Conversation Intelligence - Análise Profunda de Conversas
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Sistema completo de análise de conversas (chamadas, emails, WhatsApp)
-- ============================================================================

-- ============================================
-- 1. TABELA: CONVERSATION TRANSCRIPTIONS (Transcrições)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_transcriptions') THEN
    CREATE TABLE public.conversation_transcriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Identificação da conversa
      conversation_id UUID, -- ID da conversa original (pode ser call_recordings.id, email.id, etc)
      conversation_type TEXT NOT NULL CHECK (conversation_type IN ('call', 'email', 'whatsapp', 'meeting', 'chat')),
      
      -- Transcrição
      transcript TEXT NOT NULL,
      language TEXT DEFAULT 'pt-BR',
      
      -- Falantes/Participantes
      speakers JSONB DEFAULT '[]'::JSONB, -- [{ "name": "João", "role": "seller", "segments": [...] }]
      
      -- Timestamps
      timestamps JSONB DEFAULT '[]'::JSONB, -- [{ "start": 0, "end": 10, "speaker": "João", "text": "..." }]
      
      -- Metadados
      duration_seconds INTEGER,
      word_count INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Índices
    CREATE INDEX idx_conversation_transcriptions_tenant_id ON public.conversation_transcriptions(tenant_id);
    CREATE INDEX idx_conversation_transcriptions_conversation_id ON public.conversation_transcriptions(conversation_id);
    CREATE INDEX idx_conversation_transcriptions_type ON public.conversation_transcriptions(conversation_type);
    CREATE INDEX idx_conversation_transcriptions_created_at ON public.conversation_transcriptions(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 2. TABELA: CONVERSATION ANALYSES (Análises)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_analyses') THEN
    CREATE TABLE public.conversation_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Relacionamento
      conversation_id UUID NOT NULL,
      transcription_id UUID REFERENCES public.conversation_transcriptions(id) ON DELETE CASCADE,
      
      -- Sentiment Analysis
      sentiment_score NUMERIC(3,2) DEFAULT 0, -- -1.00 a 1.00
      sentiment_by_segment JSONB DEFAULT '[]'::JSONB, -- [{ "start": 0, "end": 60, "sentiment": "positive", "score": 0.8 }]
      overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
      
      -- Objeções Detectadas
      objections_detected JSONB DEFAULT '[]'::JSONB, -- [{ "type": "price", "text": "...", "timestamp": 120, "resolved": false }]
      
      -- Concorrentes Mencionados
      competitors_mentioned JSONB DEFAULT '[]'::JSONB, -- [{ "name": "SAP", "context": "...", "timestamp": 180 }]
      
      -- Talk-to-Listen Ratio
      talk_to_listen_ratio NUMERIC(5,2), -- % de tempo falando vs ouvindo
      seller_talk_time INTEGER, -- segundos
      buyer_talk_time INTEGER, -- segundos
      
      -- Palavras-chave
      keywords TEXT[], -- ["preço", "prazo", "ROI", "demo"]
      key_topics TEXT[], -- ["pricing", "delivery", "features"]
      
      -- Insights Gerais
      insights JSONB DEFAULT '[]'::JSONB, -- [{ "type": "opportunity", "text": "...", "confidence": 0.85 }]
      
      -- Momentos Críticos
      critical_moments JSONB DEFAULT '[]'::JSONB, -- [{ "type": "objection", "timestamp": 120, "severity": "high" }]
      
      -- Metadados
      analysis_version TEXT DEFAULT '1.0',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Índices
    CREATE INDEX idx_conversation_analyses_tenant_id ON public.conversation_analyses(tenant_id);
    CREATE INDEX idx_conversation_analyses_conversation_id ON public.conversation_analyses(conversation_id);
    CREATE INDEX idx_conversation_analyses_sentiment ON public.conversation_analyses(overall_sentiment);
    CREATE INDEX idx_conversation_analyses_created_at ON public.conversation_analyses(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 3. TABELA: COACHING CARDS (Cards de Coaching)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaching_cards') THEN
    CREATE TABLE public.coaching_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Relacionamento
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      conversation_id UUID,
      conversation_analysis_id UUID REFERENCES public.conversation_analyses(id) ON DELETE CASCADE,
      
      -- Tipo de Card
      card_type TEXT NOT NULL CHECK (card_type IN ('strength', 'weakness', 'suggestion', 'warning', 'congratulations')),
      
      -- Conteúdo
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      
      -- Análise
      strengths JSONB DEFAULT '[]'::JSONB, -- [{ "text": "...", "evidence": "..." }]
      weaknesses JSONB DEFAULT '[]'::JSONB, -- [{ "text": "...", "evidence": "...", "improvement": "..." }]
      recommendations JSONB DEFAULT '[]'::JSONB, -- [{ "action": "...", "priority": "high", "reason": "..." }]
      
      -- Próximas Perguntas Sugeridas
      suggested_questions JSONB DEFAULT '[]'::JSONB, -- [{ "question": "...", "context": "...", "expected_outcome": "..." }]
      
      -- Scripts de Resposta
      response_scripts JSONB DEFAULT '[]'::JSONB, -- [{ "objection": "...", "response": "...", "effectiveness": 0.85 }]
      
      -- Prioridade
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      
      -- Status
      status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'applied')),
      read_at TIMESTAMPTZ,
      applied_at TIMESTAMPTZ,
      
      -- Metadados
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Índices
    CREATE INDEX idx_coaching_cards_tenant_id ON public.coaching_cards(tenant_id);
    CREATE INDEX idx_coaching_cards_user_id ON public.coaching_cards(user_id);
    CREATE INDEX idx_coaching_cards_conversation_id ON public.coaching_cards(conversation_id);
    CREATE INDEX idx_coaching_cards_type ON public.coaching_cards(card_type);
    CREATE INDEX idx_coaching_cards_status ON public.coaching_cards(status);
    CREATE INDEX idx_coaching_cards_created_at ON public.coaching_cards(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 4. TABELA: OBJECTION PATTERNS (Padrões de Objeções)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'objection_patterns') THEN
    CREATE TABLE public.objection_patterns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Padrão
      pattern_text TEXT NOT NULL, -- Texto da objeção (ex: "muito caro", "preço alto")
      pattern_category TEXT, -- "price", "timing", "authority", "need", "competitor"
      
      -- Frequência
      frequency INTEGER DEFAULT 1, -- Quantas vezes foi detectada
      last_detected_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Melhor Resposta
      best_response TEXT,
      best_response_effectiveness NUMERIC(3,2), -- 0.00 a 1.00
      
      -- Taxa de Sucesso
      success_rate NUMERIC(5,2) DEFAULT 0, -- % de vezes que foi resolvida
      resolution_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 1,
      
      -- Contexto
      common_contexts JSONB DEFAULT '[]'::JSONB, -- [{ "stage": "proposal", "product": "..." }]
      
      -- Metadados
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Índices
    CREATE INDEX idx_objection_patterns_tenant_id ON public.objection_patterns(tenant_id);
    CREATE INDEX idx_objection_patterns_category ON public.objection_patterns(pattern_category);
    CREATE INDEX idx_objection_patterns_frequency ON public.objection_patterns(frequency DESC);
    CREATE INDEX idx_objection_patterns_success_rate ON public.objection_patterns(success_rate DESC);
    
    -- Índice único para evitar duplicatas
    CREATE UNIQUE INDEX IF NOT EXISTS idx_objection_patterns_unique 
      ON public.objection_patterns(tenant_id, LOWER(pattern_text));
  END IF;
END $$;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Conversation Transcriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_transcriptions' 
    AND policyname = 'Users can view transcriptions from their tenant'
  ) THEN
    CREATE POLICY "Users can view transcriptions from their tenant"
      ON public.conversation_transcriptions FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_transcriptions' 
    AND policyname = 'Users can insert transcriptions in their tenant'
  ) THEN
    CREATE POLICY "Users can insert transcriptions in their tenant"
      ON public.conversation_transcriptions FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_transcriptions' 
    AND policyname = 'Users can update transcriptions from their tenant'
  ) THEN
    CREATE POLICY "Users can update transcriptions from their tenant"
      ON public.conversation_transcriptions FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- Conversation Analyses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_analyses' 
    AND policyname = 'Users can view analyses from their tenant'
  ) THEN
    CREATE POLICY "Users can view analyses from their tenant"
      ON public.conversation_analyses FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_analyses' 
    AND policyname = 'Users can insert analyses in their tenant'
  ) THEN
    CREATE POLICY "Users can insert analyses in their tenant"
      ON public.conversation_analyses FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_analyses' 
    AND policyname = 'Users can update analyses from their tenant'
  ) THEN
    CREATE POLICY "Users can update analyses from their tenant"
      ON public.conversation_analyses FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- Coaching Cards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'coaching_cards' 
    AND policyname = 'Users can view their coaching cards'
  ) THEN
    CREATE POLICY "Users can view their coaching cards"
      ON public.coaching_cards FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()) AND (user_id = auth.uid() OR user_id IS NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'coaching_cards' 
    AND policyname = 'Users can insert coaching cards in their tenant'
  ) THEN
    CREATE POLICY "Users can insert coaching cards in their tenant"
      ON public.coaching_cards FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'coaching_cards' 
    AND policyname = 'Users can update their coaching cards'
  ) THEN
    CREATE POLICY "Users can update their coaching cards"
      ON public.coaching_cards FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND (user_id = auth.uid() OR user_id IS NULL));
  END IF;
END $$;

-- Objection Patterns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'objection_patterns' 
    AND policyname = 'Users can view objection patterns from their tenant'
  ) THEN
    CREATE POLICY "Users can view objection patterns from their tenant"
      ON public.objection_patterns FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'objection_patterns' 
    AND policyname = 'Users can insert objection patterns in their tenant'
  ) THEN
    CREATE POLICY "Users can insert objection patterns in their tenant"
      ON public.objection_patterns FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'objection_patterns' 
    AND policyname = 'Users can update objection patterns from their tenant'
  ) THEN
    CREATE POLICY "Users can update objection patterns from their tenant"
      ON public.objection_patterns FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 6. TRIGGERS (updated_at)
-- ============================================

-- Conversation Transcriptions
CREATE TRIGGER update_conversation_transcriptions_updated_at
  BEFORE UPDATE ON public.conversation_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Conversation Analyses
CREATE TRIGGER update_conversation_analyses_updated_at
  BEFORE UPDATE ON public.conversation_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Coaching Cards
CREATE TRIGGER update_coaching_cards_updated_at
  BEFORE UPDATE ON public.coaching_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Objection Patterns
CREATE TRIGGER update_objection_patterns_updated_at
  BEFORE UPDATE ON public.objection_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. NOTIFY POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- FIM DA MIGRATION
-- ============================================



