-- ==========================================
-- MICROCICLO MC1.1: Permitir BASE → ACTIVE
-- ==========================================
-- Data: 2026-01-24
-- Descrição: Atualiza validação de transições para permitir BASE → ACTIVE diretamente
-- (Quarentena ICP eliminada do fluxo operacional)

-- Atualizar função de validação para permitir BASE → ACTIVE
CREATE OR REPLACE FUNCTION validate_state_transition(
  p_from_state TEXT,
  p_to_state TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Estados canônicos válidos
  IF p_from_state NOT IN ('RAW', 'BASE', 'POOL', 'ACTIVE', 'PIPELINE', 'DISCARDED') THEN
    RETURN false;
  END IF;
  
  IF p_to_state NOT IN ('RAW', 'BASE', 'POOL', 'ACTIVE', 'PIPELINE', 'DISCARDED') THEN
    RETURN false;
  END IF;
  
  -- Se estados são iguais, não é transição válida
  IF p_from_state = p_to_state THEN
    RETURN false;
  END IF;
  
  -- DISCARDED é terminal - não pode transicionar
  IF p_from_state = 'DISCARDED' THEN
    RETURN false;
  END IF;
  
  -- Qualquer estado pode ir para DISCARDED
  IF p_to_state = 'DISCARDED' THEN
    RETURN true;
  END IF;
  
  -- Transições permitidas (sequenciais)
  -- ✅ AJUSTADO: BASE pode ir direto para ACTIVE (Quarentena eliminada)
  CASE p_from_state
    WHEN 'RAW' THEN
      RETURN p_to_state IN ('BASE', 'DISCARDED');
    WHEN 'BASE' THEN
      RETURN p_to_state IN ('ACTIVE', 'DISCARDED'); -- ✅ BASE → ACTIVE (pula POOL)
    WHEN 'POOL' THEN
      RETURN p_to_state IN ('ACTIVE', 'DISCARDED'); -- Mantido para compatibilidade
    WHEN 'ACTIVE' THEN
      RETURN p_to_state IN ('PIPELINE', 'DISCARDED');
    WHEN 'PIPELINE' THEN
      RETURN p_to_state = 'DISCARDED';
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Atualizar comentário
COMMENT ON FUNCTION validate_state_transition IS 
'Valida se uma transição de estado canônico é permitida. Transições permitidas: RAW → BASE → ACTIVE → PIPELINE (BASE pode pular POOL). Qualquer estado pode ir para DISCARDED.';

-- Atualizar mensagem de erro no trigger
CREATE OR REPLACE FUNCTION validate_company_state_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  -- Obter valores de canonical_status (pode ser NULL)
  v_old_status := COALESCE(OLD.canonical_status, 'BASE');
  v_new_status := NEW.canonical_status;
  
  -- Se canonical_status mudou e não é NULL, validar transição
  IF v_old_status IS DISTINCT FROM v_new_status AND v_new_status IS NOT NULL THEN
    IF NOT validate_state_transition(v_old_status, v_new_status) THEN
      RAISE EXCEPTION 'Transição de estado inválida: % → %. Transições permitidas: RAW → BASE → ACTIVE → PIPELINE (BASE pode pular POOL).',
        v_old_status,
        v_new_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Comentário
COMMENT ON TRIGGER trigger_validate_company_state_transition ON public.companies IS 
'Valida transições de canonical_status em companies. Permite BASE → ACTIVE diretamente (Quarentena eliminada).';
