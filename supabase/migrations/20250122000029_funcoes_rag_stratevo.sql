-- ============================================================================
-- MIGRATION: Funções RPC para Busca Vetorial - STRATEVO RAG
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Funções PostgreSQL para busca semântica usando embeddings
-- ============================================================================

-- ============================================
-- FUNÇÃO: match_knowledge
-- Buscar na base de conhecimento
-- ============================================
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

-- ============================================
-- FUNÇÃO: match_conversations
-- Buscar em conversas passadas
-- ============================================
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

-- ============================================
-- FUNÇÃO: match_patterns
-- Buscar padrões aprendidos
-- ============================================
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


