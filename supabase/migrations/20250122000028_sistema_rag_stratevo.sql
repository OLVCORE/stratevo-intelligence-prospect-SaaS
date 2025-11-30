-- ============================================================================
-- MIGRATION: Sistema RAG - STRATEVO Assistant
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Implementa sistema de RAG (Retrieval-Augmented Generation) para
--            aprendizado contínuo do Assistente Virtual da STRATEVO
-- ============================================================================

-- ============================================
-- EXTENSÃO: pgvector para embeddings
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABELA: conversation_embeddings
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message_id UUID,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  feedback_score NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para busca vetorial
CREATE INDEX IF NOT EXISTS conversation_embeddings_vector_idx 
ON public.conversation_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS conversation_embeddings_session_idx 
ON public.conversation_embeddings(session_id);

CREATE INDEX IF NOT EXISTS conversation_embeddings_score_idx 
ON public.conversation_embeddings(feedback_score DESC);

-- ============================================
-- TABELA: learning_patterns
-- ============================================
CREATE TABLE IF NOT EXISTS public.learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  question_pattern TEXT NOT NULL,
  best_answer TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  success_rate NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_patterns_type_idx 
ON public.learning_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS learning_patterns_success_idx 
ON public.learning_patterns(success_rate DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.conversation_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Sistema pode gerenciar embeddings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_embeddings' AND policyname='Sistema pode gerenciar embeddings') THEN
    DROP POLICY "Sistema pode gerenciar embeddings" ON public.conversation_embeddings;
  END IF;
END $$;
CREATE POLICY "Sistema pode gerenciar embeddings"
ON public.conversation_embeddings FOR ALL 
USING (true) WITH CHECK (true);

-- Policy: Admins podem ver embeddings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_embeddings' AND policyname='Admins podem ver embeddings') THEN
    DROP POLICY "Admins podem ver embeddings" ON public.conversation_embeddings;
  END IF;
END $$;
CREATE POLICY "Admins podem ver embeddings"
ON public.conversation_embeddings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'direcao', 'gerencia')
  )
);

-- Policy: Sistema pode gerenciar padrões
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='learning_patterns' AND policyname='Sistema pode gerenciar padrões') THEN
    DROP POLICY "Sistema pode gerenciar padrões" ON public.learning_patterns;
  END IF;
END $$;
CREATE POLICY "Sistema pode gerenciar padrões"
ON public.learning_patterns FOR ALL 
USING (true) WITH CHECK (true);

-- Policy: Admins podem ver padrões
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='learning_patterns' AND policyname='Admins podem ver padrões') THEN
    DROP POLICY "Admins podem ver padrões" ON public.learning_patterns;
  END IF;
END $$;
CREATE POLICY "Admins podem ver padrões"
ON public.learning_patterns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'direcao', 'gerencia')
  )
);

-- ============================================
-- FUNÇÃO: Atualizar timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_learning_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_conversation_embeddings_timestamp ON public.conversation_embeddings;
CREATE TRIGGER update_conversation_embeddings_timestamp
BEFORE UPDATE ON public.conversation_embeddings
FOR EACH ROW EXECUTE FUNCTION update_learning_timestamp();

DROP TRIGGER IF EXISTS update_learning_patterns_timestamp ON public.learning_patterns;
CREATE TRIGGER update_learning_patterns_timestamp
BEFORE UPDATE ON public.learning_patterns
FOR EACH ROW EXECUTE FUNCTION update_learning_timestamp();

-- ============================================
-- ATUALIZAR: knowledge_base (se existir)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_base') THEN
    ALTER TABLE public.knowledge_base 
    ADD COLUMN IF NOT EXISTS embedding vector(768),
    ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS success_rate NUMERIC DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
    ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 50);
  END IF;
END $$;

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';


