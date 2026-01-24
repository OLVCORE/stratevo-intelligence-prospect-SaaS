-- ==========================================
-- MICROCICLO 3: Validação de Transições de Estado
-- ==========================================
-- Data: 2026-01-24
-- Descrição: Funções para validar transições de estado canônico

-- Função para validar transição de estado
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

-- Comentário
COMMENT ON FUNCTION validate_state_transition IS 
'Valida se uma transição de estado canônico é permitida. Transições permitidas: RAW → BASE → ACTIVE → PIPELINE (BASE pode pular POOL). Qualquer estado pode ir para DISCARDED.';

-- Função para validar criação de lead (só pode ser criado em ACTIVE)
CREATE OR REPLACE FUNCTION can_create_lead(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_state TEXT;
BEGIN
  -- Determinar estado atual da entidade origem
  CASE p_entity_type
    WHEN 'quarantine' THEN
      SELECT 
        CASE 
          WHEN validation_status = 'approved' THEN 'ACTIVE'
          WHEN validation_status IN ('rejected', 'duplicate', 'invalid_data') THEN 'DISCARDED'
          ELSE 'POOL'
        END
      INTO v_current_state
      FROM public.leads_quarantine
      WHERE id = p_entity_id
        AND tenant_id = p_tenant_id;
    
    WHEN 'company' THEN
      SELECT COALESCE(canonical_status, 'BASE')
      INTO v_current_state
      FROM public.companies
      WHERE id = p_entity_id
        AND tenant_id = p_tenant_id;
    
    WHEN 'qualified_prospect' THEN
      SELECT 'BASE'
      INTO v_current_state
      FROM public.qualified_prospects
      WHERE id = p_entity_id
        AND tenant_id = p_tenant_id;
    
    ELSE
      -- Se tipo desconhecido, não permitir
      RETURN false;
  END CASE;
  
  -- Lead só pode ser criado se entidade origem estiver em ACTIVE
  RETURN v_current_state = 'ACTIVE';
END;
$$;

-- Comentário
COMMENT ON FUNCTION can_create_lead IS 
'Valida se um lead pode ser criado. Leads só podem ser criados se a entidade origem estiver em estado ACTIVE (SALES TARGET).';

-- Trigger para validar transição de canonical_status em companies
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

-- Criar trigger (apenas se a coluna canonical_status existir)
-- A coluna será criada na migration anterior, então o trigger pode ser criado aqui
DROP TRIGGER IF EXISTS trigger_validate_company_state_transition ON public.companies;
CREATE TRIGGER trigger_validate_company_state_transition
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_state_transition();

-- Comentário
COMMENT ON TRIGGER trigger_validate_company_state_transition ON public.companies IS 
'Valida transições de canonical_status em companies. Impede saltos de estado e regressões.';

-- Permissões
GRANT EXECUTE ON FUNCTION validate_state_transition(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_lead(TEXT, UUID, UUID) TO authenticated;
