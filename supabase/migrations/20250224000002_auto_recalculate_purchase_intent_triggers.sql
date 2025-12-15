-- ==========================================
-- MIGRATION: Triggers Automáticos para Purchase Intent Avançado
-- ==========================================
-- Objetivo: Recalcular Purchase Intent automaticamente quando:
-- 1. Empresa passa para Quarentena ICP
-- 2. Lead é aprovado
-- 3. Website é enriquecido
-- 4. ICP é atualizado
-- ==========================================

-- 1. Função para recalcular Purchase Intent quando empresa entra na quarentena
CREATE OR REPLACE FUNCTION trigger_recalculate_purchase_intent_on_quarantine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Buscar prospect_id e tenant_id
  -- 🔥 CORRIGIDO: Removido NEW.icp_id que não existe na tabela
  SELECT 
    qp.id,
    qp.tenant_id
  INTO v_prospect_id, v_tenant_id
  FROM qualified_prospects qp
  WHERE qp.cnpj = NEW.cnpj
    AND qp.tenant_id = NEW.tenant_id
  LIMIT 1;

  -- Se encontrou prospect, marcar para recálculo (via flag ou coluna)
  IF v_prospect_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    -- Atualizar flag para indicar que precisa recalcular
    UPDATE qualified_prospects
    SET purchase_intent_needs_recalculation = true
    WHERE id = v_prospect_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger para quarentena ICP
DROP TRIGGER IF EXISTS trg_recalculate_pi_on_quarantine ON icp_analysis_results;
CREATE TRIGGER trg_recalculate_pi_on_quarantine
  AFTER INSERT ON icp_analysis_results
  FOR EACH ROW
  WHEN (NEW.status = 'pendente')
  EXECUTE FUNCTION trigger_recalculate_purchase_intent_on_quarantine();

-- 3. Função para recalcular quando lead é aprovado
CREATE OR REPLACE FUNCTION trigger_recalculate_purchase_intent_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect_id UUID;
BEGIN
  -- Se status mudou para 'aprovada', buscar prospect_id
  IF NEW.status = 'aprovada' AND (OLD.status IS NULL OR OLD.status != 'aprovada') THEN
    SELECT qp.id
    INTO v_prospect_id
    FROM qualified_prospects qp
    WHERE qp.cnpj = NEW.cnpj
      AND qp.tenant_id = NEW.tenant_id
    LIMIT 1;

    -- Marcar para recálculo
    IF v_prospect_id IS NOT NULL THEN
      UPDATE qualified_prospects
      SET purchase_intent_needs_recalculation = true,
          purchase_intent_type = 'real' -- Mudar para "real" após aprovação
      WHERE id = v_prospect_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger para aprovação
DROP TRIGGER IF EXISTS trg_recalculate_pi_on_approval ON icp_analysis_results;
CREATE TRIGGER trg_recalculate_pi_on_approval
  AFTER UPDATE ON icp_analysis_results
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada' AND (OLD.status IS NULL OR OLD.status != 'aprovada'))
  EXECUTE FUNCTION trigger_recalculate_purchase_intent_on_approval();

-- 5. Adicionar coluna para flag de recálculo (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'qualified_prospects' 
      AND column_name = 'purchase_intent_needs_recalculation'
  ) THEN
    ALTER TABLE public.qualified_prospects 
    ADD COLUMN purchase_intent_needs_recalculation BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.qualified_prospects.purchase_intent_needs_recalculation IS 
    'Flag para indicar que Purchase Intent precisa ser recalculado (usado por triggers automáticos)';
  END IF;
END $$;

-- 6. Função para recalcular quando website é enriquecido
CREATE OR REPLACE FUNCTION trigger_recalculate_purchase_intent_on_website_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se website_fit_score foi atualizado, marcar para recálculo
  IF NEW.website_fit_score IS NOT NULL AND 
     (OLD.website_fit_score IS NULL OR OLD.website_fit_score != NEW.website_fit_score) THEN
    UPDATE qualified_prospects
    SET purchase_intent_needs_recalculation = true
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Trigger para enriquecimento de website
DROP TRIGGER IF EXISTS trg_recalculate_pi_on_website_enrichment ON qualified_prospects;
CREATE TRIGGER trg_recalculate_pi_on_website_enrichment
  AFTER UPDATE ON qualified_prospects
  FOR EACH ROW
  WHEN (NEW.website_fit_score IS NOT NULL AND (OLD.website_fit_score IS NULL OR OLD.website_fit_score != NEW.website_fit_score))
  EXECUTE FUNCTION trigger_recalculate_purchase_intent_on_website_enrichment();

-- 8. Comentários
COMMENT ON FUNCTION trigger_recalculate_purchase_intent_on_quarantine IS 
'Trigger que marca Purchase Intent para recálculo quando empresa entra na quarentena ICP';

COMMENT ON FUNCTION trigger_recalculate_purchase_intent_on_approval IS 
'Trigger que marca Purchase Intent para recálculo quando lead é aprovado e muda tipo para "real"';

COMMENT ON FUNCTION trigger_recalculate_purchase_intent_on_website_enrichment IS 
'Trigger que marca Purchase Intent para recálculo quando website é enriquecido';

