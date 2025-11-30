-- ============================================================================
-- APLICAR MIGRATIONS: Sistema RAG - STRATEVO
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================================
-- IMPORTANTE: Execute na ordem:
-- 1. Primeiro: 20250122000028_sistema_rag_stratevo.sql
-- 2. Depois: 20250122000029_funcoes_rag_stratevo.sql
-- ============================================================================

-- ============================================
-- MIGRATION 1: Sistema RAG - Tabelas e Embeddings
-- ============================================

-- Ativar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar embeddings das conversas
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

-- Tabela para armazenar padrões de aprendizado
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

-- RLS Policies
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

-- Função para atualizar timestamp
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

-- Atualizar knowledge_base (se existir)
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

-- ============================================
-- MIGRATION 2: Funções RPC para Busca Vetorial
-- ============================================

-- Função: match_knowledge
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid, 
  category text, 
  question text, 
  answer text,
  priority int, 
  usage_count int, 
  success_rate numeric, 
  similarity float
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se knowledge_base existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'knowledge_base'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    kb.id, 
    kb.category, 
    kb.question, 
    kb.answer, 
    kb.priority,
    kb.usage_count, 
    kb.success_rate,
    1 - (kb.embedding <=> query_embedding::vector) as similarity
  FROM public.knowledge_base kb
  WHERE kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY kb.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;

-- Função: match_conversations
CREATE OR REPLACE FUNCTION public.match_conversations(
  query_embedding text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid, 
  session_id uuid, 
  content text, 
  feedback_score numeric,
  usage_count int, 
  created_at timestamptz, 
  similarity float
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id, 
    ce.session_id, 
    ce.content, 
    ce.feedback_score,
    ce.usage_count, 
    ce.created_at,
    1 - (ce.embedding <=> query_embedding::vector) as similarity
  FROM public.conversation_embeddings ce
  WHERE ce.embedding IS NOT NULL
    AND 1 - (ce.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY ce.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;

-- Função: match_patterns
CREATE OR REPLACE FUNCTION public.match_patterns(
  query_embedding text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid, 
  pattern_type text, 
  question_pattern text, 
  best_answer text,
  context jsonb, 
  success_rate numeric, 
  usage_count int, 
  similarity float
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Por enquanto, retornar padrões baseados em texto (sem embeddings)
  -- Futuramente pode ser expandido para usar embeddings
  RETURN QUERY
  SELECT 
    lp.id, 
    lp.pattern_type, 
    lp.question_pattern, 
    lp.best_answer,
    lp.context, 
    lp.success_rate, 
    lp.usage_count,
    0.8::float as similarity  -- Placeholder até implementar embeddings em patterns
  FROM public.learning_patterns lp
  WHERE lp.success_rate > 0.5
  ORDER BY lp.success_rate DESC, lp.usage_count DESC
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.match_knowledge TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.match_conversations TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.match_patterns TO authenticated, anon, service_role;

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';


