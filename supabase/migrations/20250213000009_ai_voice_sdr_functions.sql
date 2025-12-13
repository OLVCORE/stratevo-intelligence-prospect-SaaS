-- ==========================================
-- MIGRATION: AI Voice SDR - Funções de Automação
-- ==========================================
-- Objetivo: Funções SQL para automatizar chamadas e processar resultados
-- Impacto: +300% volume de contatos
-- ==========================================

-- 1. Função para agendar chamada automática para lead aprovado
CREATE OR REPLACE FUNCTION schedule_voice_call_for_lead(
  p_tenant_id UUID,
  p_lead_id UUID,
  p_agent_id UUID DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_call_id UUID;
  v_lead RECORD;
  v_agent_id_final UUID;
  v_phone_number TEXT;
BEGIN
  -- Buscar lead
  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado';
  END IF;
  
  -- Validar telefone
  v_phone_number := COALESCE(v_lead.phone, '');
  IF v_phone_number IS NULL OR v_phone_number = '' THEN
    RAISE EXCEPTION 'Lead não possui telefone cadastrado';
  END IF;
  
  -- Buscar agente ativo se não fornecido
  IF p_agent_id IS NULL THEN
    SELECT id INTO v_agent_id_final
    FROM public.ai_voice_agents
    WHERE tenant_id = p_tenant_id
      AND is_active = true
    LIMIT 1;
    
    IF v_agent_id_final IS NULL THEN
      RAISE EXCEPTION 'Nenhum agente de voz ativo encontrado para este tenant';
    END IF;
  ELSE
    v_agent_id_final := p_agent_id;
  END IF;
  
  -- Criar chamada
  INSERT INTO public.ai_voice_calls (
    tenant_id,
    agent_id,
    lead_id,
    phone_number,
    direction,
    status,
    scheduled_at,
    created_at
  )
  VALUES (
    p_tenant_id,
    v_agent_id_final,
    p_lead_id,
    v_phone_number,
    'outbound',
    'queued',
    COALESCE(p_scheduled_at, now()),
    now()
  )
  RETURNING id INTO v_call_id;
  
  RETURN v_call_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION schedule_voice_call_for_lead(UUID, UUID, UUID, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION schedule_voice_call_for_lead IS 
'Agenda chamada automática para lead aprovado';

-- 2. Função para processar resultado de chamada e criar atividade
CREATE OR REPLACE FUNCTION process_voice_call_result(
  p_call_id UUID,
  p_tenant_id UUID,
  p_status TEXT,
  p_transcript TEXT DEFAULT NULL,
  p_sentiment_label TEXT DEFAULT NULL,
  p_sentiment_score NUMERIC DEFAULT NULL,
  p_qualification_result TEXT DEFAULT NULL,
  p_outcome TEXT DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_call RECORD;
  v_activity_id UUID;
  v_deal_id UUID;
BEGIN
  -- Buscar chamada
  SELECT * INTO v_call
  FROM public.ai_voice_calls
  WHERE id = p_call_id
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chamada não encontrada';
  END IF;
  
  -- Atualizar chamada
  UPDATE public.ai_voice_calls
  SET
    status = p_status,
    transcript = COALESCE(p_transcript, transcript),
    sentiment_label = COALESCE(p_sentiment_label, sentiment_label),
    sentiment_score = COALESCE(p_sentiment_score, sentiment_score),
    qualification_result = COALESCE(p_qualification_result, qualification_result),
    outcome = COALESCE(p_outcome, outcome),
    duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = now(),
    ended_at = CASE WHEN p_status IN ('completed', 'failed', 'no_answer', 'busy') THEN now() ELSE ended_at END
  WHERE id = p_call_id;
  
  -- Se chamada foi completada e há lead, criar atividade
  IF p_status = 'completed' AND v_call.lead_id IS NOT NULL THEN
    -- Criar atividade no CRM (se tabela existir)
    DECLARE
      v_activity_type TEXT;
      v_activity_description TEXT;
    BEGIN
      v_activity_type := 'call';
      v_activity_description := 'Chamada realizada por IA Voice SDR';
      
      IF p_transcript IS NOT NULL THEN
        v_activity_description := v_activity_description || E'\n\nTranscrição: ' || LEFT(p_transcript, 500);
      END IF;
      
      IF p_qualification_result IS NOT NULL THEN
        v_activity_description := v_activity_description || E'\n\nResultado: ' || p_qualification_result;
      END IF;
      
      -- Tentar inserir em sdr_deal_activities (se tabela existir)
      BEGIN
        INSERT INTO public.sdr_deal_activities (
          tenant_id,
          deal_id,
          lead_id,
          activity_type,
          description,
          metadata
        )
        VALUES (
          p_tenant_id,
          v_call.deal_id,
          v_call.lead_id,
          v_activity_type,
          v_activity_description,
          jsonb_build_object(
            'call_id', p_call_id,
            'sentiment', p_sentiment_label,
            'outcome', p_outcome,
            'duration', p_duration_seconds
          )
        )
        RETURNING id INTO v_activity_id;
      EXCEPTION
        WHEN undefined_table THEN
          -- Tabela não existe, ignorar
          NULL;
      END;
    END;
  END IF;
  
  -- Se lead está qualificado e interessado, criar deal (se não existir)
  IF p_qualification_result = 'qualified' 
     AND p_outcome IN ('interested', 'meeting-scheduled')
     AND v_call.lead_id IS NOT NULL
     AND v_call.deal_id IS NULL THEN
    
    -- Buscar lead para criar deal
    DECLARE
      v_lead RECORD;
    BEGIN
      SELECT * INTO v_lead
      FROM public.leads
      WHERE id = v_call.lead_id
        AND tenant_id = p_tenant_id;
      
      IF FOUND THEN
        -- Criar deal
        INSERT INTO public.deals (
          tenant_id,
          lead_id,
          company_id,
          title,
          description,
          stage,
          probability,
          priority,
          source,
          value
        )
        VALUES (
          p_tenant_id,
          v_call.lead_id,
          NULL, -- company_id será preenchido depois se necessário
          'Oportunidade - ' || COALESCE(v_lead.name, 'Lead'),
          'Deal criado automaticamente após chamada de IA Voice SDR. Resultado: ' || COALESCE(p_outcome, 'interessado'),
          'discovery',
          30, -- Probabilidade inicial
          'medium',
          'ai_voice_sdr',
          0
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_deal_id;
        
        -- Atualizar chamada com deal_id
        IF v_deal_id IS NOT NULL THEN
          UPDATE public.ai_voice_calls
          SET deal_id = v_deal_id
          WHERE id = p_call_id;
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN p_call_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION process_voice_call_result(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, INTEGER, JSONB) TO authenticated;

COMMENT ON FUNCTION process_voice_call_result IS 
'Processa resultado de chamada, cria atividade e deal se necessário';

-- 3. Função para buscar chamadas pendentes para processar
CREATE OR REPLACE FUNCTION get_pending_voice_calls(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  lead_id UUID,
  deal_id UUID,
  phone_number TEXT,
  agent_id UUID,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    avc.id,
    avc.lead_id,
    avc.deal_id,
    avc.phone_number,
    avc.agent_id,
    avc.scheduled_at,
    avc.created_at
  FROM public.ai_voice_calls avc
  WHERE avc.tenant_id = p_tenant_id
    AND avc.status = 'queued'
    AND (avc.scheduled_at IS NULL OR avc.scheduled_at <= now())
  ORDER BY avc.created_at ASC
  LIMIT p_limit;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_pending_voice_calls(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION get_pending_voice_calls IS 
'Retorna chamadas pendentes para processar';

-- 4. Função para calcular estatísticas detalhadas de chamadas (por período específico)
CREATE OR REPLACE FUNCTION get_voice_call_stats_by_date_range(
  p_tenant_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_calls BIGINT,
  completed_calls BIGINT,
  failed_calls BIGINT,
  no_answer_calls BIGINT,
  interested_count BIGINT,
  qualified_count BIGINT,
  avg_duration_seconds NUMERIC,
  avg_sentiment_score NUMERIC,
  total_cost_cents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_date_from TIMESTAMPTZ;
  v_date_to TIMESTAMPTZ;
BEGIN
  -- Definir período padrão (últimos 30 dias se não especificado)
  IF p_date_from IS NULL THEN
    v_date_from := now() - INTERVAL '30 days';
  ELSE
    v_date_from := p_date_from;
  END IF;
  
  IF p_date_to IS NULL THEN
    v_date_to := now();
  ELSE
    v_date_to := p_date_to;
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_calls,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_calls,
    COUNT(*) FILTER (WHERE status = 'no_answer') AS no_answer_calls,
    COUNT(*) FILTER (WHERE outcome = 'interested' OR outcome = 'meeting-scheduled') AS interested_count,
    COUNT(*) FILTER (WHERE qualification_result = 'qualified') AS qualified_count,
    AVG(duration_seconds) AS avg_duration_seconds,
    AVG(sentiment_score) AS avg_sentiment_score,
    SUM(COALESCE(cost_cents, 0)) AS total_cost_cents
  FROM public.ai_voice_calls
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_date_from
    AND created_at <= v_date_to;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_voice_call_stats_by_date_range(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION get_voice_call_stats_by_date_range IS 
'Retorna estatísticas detalhadas de chamadas para um período específico (complementa get_voice_call_stats existente)';

-- 5. Função para detectar necessidade de handoff para humano
CREATE OR REPLACE FUNCTION check_voice_call_handoff_needed(
  p_call_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_call RECORD;
  v_needs_handoff BOOLEAN := false;
BEGIN
  -- Buscar chamada
  SELECT * INTO v_call
  FROM public.ai_voice_calls
  WHERE id = p_call_id
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar condições que requerem handoff
  -- 1. Sentimento muito negativo
  IF v_call.sentiment_score IS NOT NULL AND v_call.sentiment_score < -0.5 THEN
    v_needs_handoff := true;
  END IF;
  
  -- 2. Múltiplas objeções não resolvidas
  IF v_call.objections_raised IS NOT NULL AND array_length(v_call.objections_raised, 1) >= 3 THEN
    v_needs_handoff := true;
  END IF;
  
  -- 3. Cliente pediu explicitamente para falar com humano
  IF v_call.transcript IS NOT NULL AND (
    LOWER(v_call.transcript) LIKE '%falar com%humano%' OR
    LOWER(v_call.transcript) LIKE '%falar com%pessoa%' OR
    LOWER(v_call.transcript) LIKE '%quero falar com%' OR
    LOWER(v_call.transcript) LIKE '%pode me passar%'
  ) THEN
    v_needs_handoff := true;
  END IF;
  
  -- 4. Interesse muito alto (quer fechar negócio)
  IF v_call.outcome = 'interested' AND v_call.qualification_score IS NOT NULL AND v_call.qualification_score >= 80 THEN
    v_needs_handoff := true;
  END IF;
  
  RETURN v_needs_handoff;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION check_voice_call_handoff_needed(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION check_voice_call_handoff_needed IS 
'Verifica se chamada precisa de handoff para humano baseado em critérios';

-- 6. Função para agendar chamadas em lote para leads aprovados
CREATE OR REPLACE FUNCTION schedule_batch_voice_calls(
  p_tenant_id UUID,
  p_lead_ids UUID[],
  p_agent_id UUID DEFAULT NULL,
  p_delay_minutes INTEGER DEFAULT 0
)
RETURNS TABLE (
  scheduled_count INTEGER,
  failed_count INTEGER,
  call_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_lead_id UUID;
  v_call_id UUID;
  v_scheduled_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_call_ids UUID[] := ARRAY[]::UUID[];
  v_scheduled_at TIMESTAMPTZ;
BEGIN
  -- Calcular horário de agendamento
  v_scheduled_at := now() + (p_delay_minutes || ' minutes')::INTERVAL;
  
  -- Iterar sobre leads
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    BEGIN
      -- Agendar chamada
      SELECT schedule_voice_call_for_lead(
        p_tenant_id,
        v_lead_id,
        p_agent_id,
        v_scheduled_at
      ) INTO v_call_id;
      
      v_scheduled_count := v_scheduled_count + 1;
      v_call_ids := array_append(v_call_ids, v_call_id);
      
      -- Incrementar delay para próxima chamada (evitar sobrecarga)
      v_scheduled_at := v_scheduled_at + INTERVAL '2 minutes';
      
    EXCEPTION
      WHEN OTHERS THEN
        v_failed_count := v_failed_count + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT
    v_scheduled_count,
    v_failed_count,
    v_call_ids;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION schedule_batch_voice_calls(UUID, UUID[], UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION schedule_batch_voice_calls IS 
'Agenda múltiplas chamadas em lote para leads aprovados com delay entre chamadas';

-- 7. Adicionar coluna scheduled_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_voice_calls'
      AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.ai_voice_calls
    ADD COLUMN scheduled_at TIMESTAMPTZ;
    
    CREATE INDEX IF NOT EXISTS idx_ai_voice_calls_scheduled 
      ON public.ai_voice_calls(tenant_id, scheduled_at) 
      WHERE status = 'queued';
  END IF;
END $$;

