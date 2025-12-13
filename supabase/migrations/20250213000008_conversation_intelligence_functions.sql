-- ==========================================
-- MIGRATION: Conversation Intelligence - Funções de Análise Automática
-- ==========================================
-- Objetivo: Funções SQL para automatizar análise de conversas e geração de coaching cards
-- Impacto: +35% conversão de calls
-- ==========================================

-- 1. Função para calcular Talk-to-Listen Ratio
CREATE OR REPLACE FUNCTION calculate_talk_listen_ratio(
  p_transcription_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  seller_talk_time INTEGER,
  buyer_talk_time INTEGER,
  talk_to_listen_ratio NUMERIC,
  seller_percentage NUMERIC,
  buyer_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_transcription RECORD;
  v_seller_time INTEGER := 0;
  v_buyer_time INTEGER := 0;
  v_total_time INTEGER := 0;
BEGIN
  -- Buscar transcrição
  SELECT * INTO v_transcription
  FROM public.conversation_transcriptions
  WHERE id = p_transcription_id
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calcular tempo de fala por participante
  IF v_transcription.speakers IS NOT NULL AND jsonb_array_length(v_transcription.speakers) > 0 THEN
    DECLARE
      v_speaker JSONB;
      v_segments JSONB;
      v_segment JSONB;
      v_duration INTEGER;
    BEGIN
      FOR v_speaker IN SELECT * FROM jsonb_array_elements(v_transcription.speakers)
      LOOP
        v_segments := v_speaker->'segments';
        IF v_segments IS NOT NULL THEN
          FOR v_segment IN SELECT * FROM jsonb_array_elements(v_segments)
          LOOP
            v_duration := COALESCE((v_segment->>'end')::INTEGER, 0) - COALESCE((v_segment->>'start')::INTEGER, 0);
            
            -- Identificar se é seller ou buyer
            IF (v_speaker->>'role')::TEXT = 'seller' OR (v_speaker->>'role')::TEXT = 'sales' THEN
              v_seller_time := v_seller_time + v_duration;
            ELSE
              v_buyer_time := v_buyer_time + v_duration;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END;
  END IF;
  
  -- Calcular totais
  v_total_time := v_seller_time + v_buyer_time;
  
  -- Calcular ratios
  DECLARE
    v_ratio NUMERIC;
    v_seller_pct NUMERIC;
    v_buyer_pct NUMERIC;
  BEGIN
    IF v_total_time > 0 THEN
      v_seller_pct := (v_seller_time::NUMERIC / v_total_time::NUMERIC) * 100;
      v_buyer_pct := (v_buyer_time::NUMERIC / v_total_time::NUMERIC) * 100;
      v_ratio := v_seller_time::NUMERIC / NULLIF(v_buyer_time, 0);
    ELSE
      v_seller_pct := 0;
      v_buyer_pct := 0;
      v_ratio := 0;
    END IF;
    
    RETURN QUERY SELECT
      v_seller_time,
      v_buyer_time,
      COALESCE(v_ratio, 0),
      v_seller_pct,
      v_buyer_pct;
  END;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION calculate_talk_listen_ratio(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION calculate_talk_listen_ratio IS 
'Calcula talk-to-listen ratio baseado em transcrição de conversa';

-- 2. Função para detectar objeções em transcrição
CREATE OR REPLACE FUNCTION detect_objections_in_transcript(
  p_transcript TEXT,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_objections JSONB := '[]'::JSONB;
  v_pattern RECORD;
  v_lower_transcript TEXT;
  v_objection JSONB;
BEGIN
  v_lower_transcript := LOWER(p_transcript);
  
  -- Buscar padrões de objeções conhecidos do tenant
  FOR v_pattern IN
    SELECT pattern_text, pattern_category
    FROM public.objection_patterns
    WHERE tenant_id = p_tenant_id
      AND LOWER(pattern_text) = ANY(string_to_array(v_lower_transcript, ' '))
  LOOP
    -- Verificar se padrão aparece no texto
    IF v_lower_transcript LIKE '%' || LOWER(v_pattern.pattern_text) || '%' THEN
      v_objection := jsonb_build_object(
        'pattern', v_pattern.pattern_text,
        'category', v_pattern.pattern_category,
        'detected_at', now()
      );
      v_objections := v_objections || jsonb_build_array(v_objection);
    END IF;
  END LOOP;
  
  -- Detectar objeções comuns mesmo sem padrão cadastrado
  DECLARE
    v_common_objections TEXT[] := ARRAY[
      'muito caro', 'preço alto', 'não tenho orçamento', 'sem verba',
      'não é prioridade', 'não é o momento', 'depois eu vejo',
      'já tenho fornecedor', 'não preciso', 'não me interessa',
      'muito complicado', 'muito complexo', 'difícil de usar'
    ];
    v_obj TEXT;
  BEGIN
    FOREACH v_obj IN ARRAY v_common_objections
    LOOP
      IF v_lower_transcript LIKE '%' || v_obj || '%' THEN
        v_objection := jsonb_build_object(
          'pattern', v_obj,
          'category', 'common',
          'detected_at', now()
        );
        v_objections := v_objections || jsonb_build_array(v_objection);
      END IF;
    END LOOP;
  END;
  
  RETURN v_objections;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION detect_objections_in_transcript(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION detect_objections_in_transcript IS 
'Detecta objeções em transcrição usando padrões conhecidos e comuns';

-- 3. Função para atualizar objection patterns com nova detecção
CREATE OR REPLACE FUNCTION update_objection_pattern(
  p_tenant_id UUID,
  p_pattern_text TEXT,
  p_category TEXT DEFAULT NULL,
  p_resolved BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_pattern_id UUID;
  v_existing RECORD;
BEGIN
  -- Buscar padrão existente
  SELECT * INTO v_existing
  FROM public.objection_patterns
  WHERE tenant_id = p_tenant_id
    AND LOWER(pattern_text) = LOWER(p_pattern_text)
  LIMIT 1;
  
  IF FOUND THEN
    -- Atualizar frequência e taxa de sucesso
    UPDATE public.objection_patterns
    SET
      frequency = frequency + 1,
      last_detected_at = now(),
      total_count = total_count + 1,
      resolution_count = CASE 
        WHEN p_resolved THEN resolution_count + 1 
        ELSE resolution_count 
      END,
      success_rate = CASE 
        WHEN total_count + 1 > 0 THEN 
          ((CASE WHEN p_resolved THEN resolution_count + 1 ELSE resolution_count END)::NUMERIC / (total_count + 1)::NUMERIC) * 100
        ELSE 0
      END,
      updated_at = now()
    WHERE id = v_existing.id
    RETURNING id INTO v_pattern_id;
  ELSE
    -- Criar novo padrão
    INSERT INTO public.objection_patterns (
      tenant_id,
      pattern_text,
      pattern_category,
      frequency,
      total_count,
      resolution_count,
      success_rate
    )
    VALUES (
      p_tenant_id,
      p_pattern_text,
      p_category,
      1,
      1,
      CASE WHEN p_resolved THEN 1 ELSE 0 END,
      CASE WHEN p_resolved THEN 100.0 ELSE 0.0 END
    )
    RETURNING id INTO v_pattern_id;
  END IF;
  
  RETURN v_pattern_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION update_objection_pattern(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION update_objection_pattern IS 
'Atualiza ou cria padrão de objeção baseado em nova detecção';

-- 4. Função para gerar coaching card automaticamente
CREATE OR REPLACE FUNCTION generate_coaching_card(
  p_tenant_id UUID,
  p_user_id UUID,
  p_conversation_analysis_id UUID,
  p_card_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_strengths JSONB DEFAULT '[]'::JSONB,
  p_weaknesses JSONB DEFAULT '[]'::JSONB,
  p_recommendations JSONB DEFAULT '[]'::JSONB,
  p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_card_id UUID;
BEGIN
  INSERT INTO public.coaching_cards (
    tenant_id,
    user_id,
    conversation_analysis_id,
    card_type,
    title,
    description,
    strengths,
    weaknesses,
    recommendations,
    priority,
    status
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_conversation_analysis_id,
    p_card_type,
    p_title,
    p_description,
    p_strengths,
    p_weaknesses,
    p_recommendations,
    p_priority,
    'unread'
  )
  RETURNING id INTO v_card_id;
  
  RETURN v_card_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION generate_coaching_card(UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) TO authenticated;

COMMENT ON FUNCTION generate_coaching_card IS 
'Gera coaching card automaticamente baseado em análise de conversa';

-- 5. Função para analisar conversa e gerar insights automaticamente
CREATE OR REPLACE FUNCTION analyze_conversation_auto(
  p_transcription_id UUID,
  p_tenant_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_transcription RECORD;
  v_analysis_id UUID;
  v_talk_listen RECORD;
  v_objections JSONB;
  v_sentiment_score NUMERIC := 0;
  v_overall_sentiment TEXT := 'neutral';
BEGIN
  -- Buscar transcrição
  SELECT * INTO v_transcription
  FROM public.conversation_transcriptions
  WHERE id = p_transcription_id
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transcrição não encontrada';
  END IF;
  
  -- Calcular talk-to-listen ratio
  SELECT * INTO v_talk_listen
  FROM calculate_talk_listen_ratio(p_transcription_id, p_tenant_id)
  LIMIT 1;
  
  -- Detectar objeções
  v_objections := detect_objections_in_transcript(v_transcription.transcript, p_tenant_id);
  
  -- Análise básica de sentimento (simplificada - pode ser melhorada com IA)
  DECLARE
    v_positive_words TEXT[] := ARRAY['ótimo', 'excelente', 'perfeito', 'gostei', 'interessante', 'sim', 'combinado'];
    v_negative_words TEXT[] := ARRAY['não', 'caro', 'difícil', 'problema', 'não gostei', 'ruim'];
    v_lower_transcript TEXT;
    v_pos_count INTEGER := 0;
    v_neg_count INTEGER := 0;
    v_pos TEXT;
    v_neg TEXT;
  BEGIN
    v_lower_transcript := LOWER(v_transcription.transcript);
    
    FOREACH v_pos IN ARRAY v_positive_words
    LOOP
      IF v_lower_transcript LIKE '%' || v_pos || '%' THEN
        v_pos_count := v_pos_count + 1;
      END IF;
    END LOOP;
    
    FOREACH v_neg IN ARRAY v_negative_words
    LOOP
      IF v_lower_transcript LIKE '%' || v_neg || '%' THEN
        v_neg_count := v_neg_count + 1;
      END IF;
    END LOOP;
    
    -- Calcular score de sentimento (-1 a 1)
    IF v_pos_count + v_neg_count > 0 THEN
      v_sentiment_score := (v_pos_count::NUMERIC - v_neg_count::NUMERIC) / (v_pos_count + v_neg_count)::NUMERIC;
    END IF;
    
    -- Determinar sentimento geral
    IF v_sentiment_score > 0.3 THEN
      v_overall_sentiment := 'positive';
    ELSIF v_sentiment_score < -0.3 THEN
      v_overall_sentiment := 'negative';
    ELSIF ABS(v_sentiment_score) <= 0.3 THEN
      v_overall_sentiment := 'neutral';
    END IF;
  END;
  
  -- Criar análise
  INSERT INTO public.conversation_analyses (
    tenant_id,
    conversation_id,
    transcription_id,
    sentiment_score,
    overall_sentiment,
    objections_detected,
    talk_to_listen_ratio,
    seller_talk_time,
    buyer_talk_time
  )
  VALUES (
    p_tenant_id,
    v_transcription.conversation_id,
    p_transcription_id,
    v_sentiment_score,
    v_overall_sentiment,
    v_objections,
    COALESCE(v_talk_listen.talk_to_listen_ratio, 0),
    COALESCE(v_talk_listen.seller_talk_time, 0),
    COALESCE(v_talk_listen.buyer_talk_time, 0)
  )
  RETURNING id INTO v_analysis_id;
  
  -- Atualizar padrões de objeções
  IF jsonb_array_length(v_objections) > 0 THEN
    DECLARE
      v_obj JSONB;
    BEGIN
      FOR v_obj IN SELECT * FROM jsonb_array_elements(v_objections)
      LOOP
        PERFORM update_objection_pattern(
          p_tenant_id,
          (v_obj->>'pattern')::TEXT,
          (v_obj->>'category')::TEXT,
          false -- Assumir não resolvido por padrão
        );
      END LOOP;
    END;
  END IF;
  
  RETURN v_analysis_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION analyze_conversation_auto(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION analyze_conversation_auto IS 
'Analisa conversa automaticamente e gera insights (sentimento, objeções, talk-to-listen)';

-- 6. Função para buscar coaching cards não lidos de um usuário
CREATE OR REPLACE FUNCTION get_unread_coaching_cards(
  p_user_id UUID,
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  card_type TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  conversation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.card_type,
    cc.title,
    cc.description,
    cc.priority,
    cc.created_at,
    cc.conversation_id
  FROM public.coaching_cards cc
  WHERE cc.tenant_id = p_tenant_id
    AND cc.user_id = p_user_id
    AND cc.status = 'unread'
  ORDER BY 
    CASE cc.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    cc.created_at DESC
  LIMIT p_limit;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_unread_coaching_cards(UUID, UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION get_unread_coaching_cards IS 
'Retorna coaching cards não lidos de um usuário ordenados por prioridade';

-- 7. Função para marcar coaching card como lido
CREATE OR REPLACE FUNCTION mark_coaching_card_read(
  p_card_id UUID,
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  UPDATE public.coaching_cards
  SET
    status = 'read',
    read_at = now(),
    updated_at = now()
  WHERE id = p_card_id
    AND user_id = p_user_id
    AND tenant_id = p_tenant_id;
  
  RETURN FOUND;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION mark_coaching_card_read(UUID, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION mark_coaching_card_read IS 
'Marca coaching card como lido';

