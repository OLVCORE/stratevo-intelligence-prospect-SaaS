-- ============================================================================
-- MC3: APOLLO PERSISTENCE + DECISION_MAKERS_COUNT
-- ============================================================================
-- Data: 2026-01-24
-- Objetivo: Garantir persistência canônica de decisores e COUNT automático
-- ============================================================================

-- ============================================================================
-- 1. TRIGGER: Atualizar decision_makers_count automaticamente
-- ============================================================================
-- Atualiza icp_analysis_results.decision_makers_count quando decision_makers muda
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_update_decision_makers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_new_count INTEGER;
  v_old_count INTEGER;
BEGIN
  -- Determinar company_id (INSERT/UPDATE/DELETE)
  IF TG_OP = 'DELETE' THEN
    v_company_id := OLD.company_id;
  ELSE
    v_company_id := NEW.company_id;
  END IF;
  
  -- Validar company_id (não pode ser NULL)
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'MC3: decision_maker cannot be saved without company_id';
  END IF;
  
  -- Calcular novo count
  SELECT COUNT(*) INTO v_new_count
  FROM public.decision_makers
  WHERE company_id = v_company_id;
  
  -- Atualizar icp_analysis_results para TODOS os registros com este company_id
  UPDATE public.icp_analysis_results
  SET 
    decision_makers_count = v_new_count,
    updated_at = NOW()
  WHERE company_id = v_company_id;
  
  -- Log para debugging (opcional, pode ser removido em produção)
  RAISE NOTICE 'MC3: Updated decision_makers_count to % for company_id %', v_new_count, v_company_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS update_decision_makers_count_trigger ON public.decision_makers;
CREATE TRIGGER update_decision_makers_count_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.decision_makers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_decision_makers_count();

-- Comentário
COMMENT ON TRIGGER update_decision_makers_count_trigger ON public.decision_makers IS 
'MC3: Atualiza automaticamente decision_makers_count em icp_analysis_results quando decision_makers muda.';

-- ============================================================================
-- 2. FUNÇÃO: Reconciliar company_id para decisores órfãos (se necessário)
-- ============================================================================
-- Garante que decisores sempre tenham company_id válido
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reconcile_decision_maker_company_id(
  p_decision_maker_id UUID,
  p_cnpj TEXT DEFAULT NULL,
  p_apollo_organization_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_decision_maker RECORD;
  v_company_id UUID;
BEGIN
  -- 1. Buscar decisor
  SELECT * INTO v_decision_maker
  FROM public.decision_makers
  WHERE id = p_decision_maker_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Decision maker not found: %', p_decision_maker_id;
  END IF;
  
  -- 2. Se já tem company_id válido, retornar
  IF v_decision_maker.company_id IS NOT NULL THEN
    RETURN v_decision_maker.company_id;
  END IF;
  
  -- 3. Tentar reconciliar por CNPJ
  IF p_cnpj IS NOT NULL THEN
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = regexp_replace(p_cnpj, '[^0-9]', '', 'g')
    LIMIT 1;
    
    IF v_company_id IS NOT NULL THEN
      UPDATE public.decision_makers
      SET company_id = v_company_id
      WHERE id = p_decision_maker_id;
      
      RETURN v_company_id;
    END IF;
  END IF;
  
  -- 4. Tentar reconciliar por apollo_organization_id
  IF p_apollo_organization_id IS NOT NULL THEN
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE apollo_organization_id = p_apollo_organization_id
    LIMIT 1;
    
    IF v_company_id IS NOT NULL THEN
      UPDATE public.decision_makers
      SET company_id = v_company_id
      WHERE id = p_decision_maker_id;
      
      RETURN v_company_id;
    END IF;
  END IF;
  
  -- 5. Se não encontrou, retornar NULL (não criar company automaticamente)
  RETURN NULL;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.reconcile_decision_maker_company_id IS 
'MC3: Reconcilia company_id para decisores órfãos. Retorna NULL se não encontrar company.';

-- ============================================================================
-- 3. CONSTRAINT: Garantir que company_id nunca seja NULL
-- ============================================================================
-- A constraint já existe na tabela (NOT NULL), mas vamos garantir que está ativa
-- ============================================================================

-- Verificar se constraint existe
DO $$
BEGIN
  -- Se não existir constraint NOT NULL, adicionar
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'decision_makers_company_id_not_null'
  ) THEN
    ALTER TABLE public.decision_makers
    ADD CONSTRAINT decision_makers_company_id_not_null 
    CHECK (company_id IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- 4. BACKFILL: Atualizar decision_makers_count para registros existentes
-- ============================================================================
-- Garante que todos os icp_analysis_results tenham count correto
-- ============================================================================

UPDATE public.icp_analysis_results iar
SET decision_makers_count = COALESCE(
  (
    SELECT COUNT(*)
    FROM public.decision_makers dm
    WHERE dm.company_id = iar.company_id
  ),
  0
)
WHERE iar.company_id IS NOT NULL;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.reconcile_decision_maker_company_id TO authenticated;
