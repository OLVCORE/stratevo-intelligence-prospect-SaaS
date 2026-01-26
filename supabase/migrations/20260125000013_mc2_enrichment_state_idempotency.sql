-- ============================================================================
-- MC2: ENRICHMENT STATE + IDEMPOTENCY
-- ============================================================================
-- Data: 2026-01-24
-- Objetivo: Implementar estado de enrichment e idempotência obrigatória
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNA DE ESTADO DE ENRIQUECIMENTO EM companies
-- ============================================================================
-- Usar JSONB para flexibilidade e rastreabilidade completa
-- ============================================================================

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS enrichment_state JSONB DEFAULT '{
  "receita_enriched": false,
  "apollo_org_enriched": false,
  "decision_makers_enriched": false,
  "website_scanned": false,
  "products_extracted": false,
  "matching_done": false,
  "last_enrichment_at": null,
  "enrichment_history": []
}'::JSONB;

-- Índice para busca rápida de estado
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_state 
ON public.companies USING GIN(enrichment_state);

-- Comentário
COMMENT ON COLUMN public.companies.enrichment_state IS 
'MC2: Estado de enrichment por tipo. Evita reexecução desnecessária de APIs externas.';

-- ============================================================================
-- 2. FUNÇÃO: can_run_enrichment(company_id, enrichment_type)
-- ============================================================================
-- Verifica se um enrichment pode ser executado (idempotência)
-- Retorna JSONB com { can_run: boolean, reason: string, existing_data: any }
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_run_enrichment(
  p_company_id UUID,
  p_enrichment_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_state JSONB;
  v_result JSONB;
  v_decision_makers_count INTEGER := 0;
  v_products_count INTEGER := 0;
BEGIN
  -- 1. Buscar company e estado
  SELECT 
    id,
    apollo_organization_id,
    linkedin_url,
    website,
    enrichment_state
  INTO v_company
  FROM public.companies
  WHERE id = p_company_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_run', false,
      'reason', 'company_not_found',
      'message', 'Company not found'
    );
  END IF;
  
  v_state := COALESCE(v_company.enrichment_state, '{}'::JSONB);
  
  -- 2. Verificar por tipo de enrichment
  CASE p_enrichment_type
    WHEN 'apollo_org' THEN
      -- Apollo Org: verificar se apollo_organization_id já existe
      IF v_company.apollo_organization_id IS NOT NULL AND v_company.apollo_organization_id != '' THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'already_enriched',
          'message', 'Apollo organization ID already exists',
          'existing_data', jsonb_build_object(
            'apollo_organization_id', v_company.apollo_organization_id
          )
        );
      END IF;
      
      -- Verificar estado
      IF (v_state->>'apollo_org_enriched')::boolean = true THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'state_blocked',
          'message', 'Apollo org enrichment already marked as complete',
          'existing_data', jsonb_build_object(
            'apollo_organization_id', v_company.apollo_organization_id
          )
        );
      END IF;
    
    WHEN 'decision_makers' THEN
      -- Decision Makers: verificar se já existem decisores
      SELECT COUNT(*) INTO v_decision_makers_count
      FROM public.decision_makers
      WHERE company_id = p_company_id;
      
      IF v_decision_makers_count > 0 THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'already_enriched',
          'message', format('Decision makers already exist (%s)', v_decision_makers_count),
          'existing_data', jsonb_build_object(
            'decision_makers_count', v_decision_makers_count
          )
        );
      END IF;
      
      -- Verificar estado
      IF (v_state->>'decision_makers_enriched')::boolean = true THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'state_blocked',
          'message', 'Decision makers enrichment already marked as complete',
          'existing_data', jsonb_build_object(
            'decision_makers_count', v_decision_makers_count
          )
        );
      END IF;
    
    WHEN 'website' THEN
      -- Website: verificar se linkedin_url já existe
      IF v_company.linkedin_url IS NOT NULL AND v_company.linkedin_url != '' THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'already_enriched',
          'message', 'LinkedIn URL already exists',
          'existing_data', jsonb_build_object(
            'linkedin_url', v_company.linkedin_url
          )
        );
      END IF;
      
      -- Verificar estado
      IF (v_state->>'website_scanned')::boolean = true THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'state_blocked',
          'message', 'Website already scanned',
          'existing_data', jsonb_build_object(
            'linkedin_url', v_company.linkedin_url,
            'website', v_company.website
          )
        );
      END IF;
    
    WHEN 'products' THEN
      -- Products: verificar se já existem produtos extraídos
      SELECT COUNT(*) INTO v_products_count
      FROM public.prospect_extracted_products
      WHERE company_id = p_company_id;
      
      IF v_products_count > 0 THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'already_enriched',
          'message', format('Products already extracted (%s)', v_products_count),
          'existing_data', jsonb_build_object(
            'products_count', v_products_count
          )
        );
      END IF;
      
      -- Verificar estado
      IF (v_state->>'products_extracted')::boolean = true THEN
        RETURN jsonb_build_object(
          'can_run', false,
          'reason', 'state_blocked',
          'message', 'Products extraction already marked as complete',
          'existing_data', jsonb_build_object(
            'products_count', v_products_count
          )
        );
      END IF;
    
    ELSE
      RETURN jsonb_build_object(
        'can_run', false,
        'reason', 'unknown_type',
        'message', format('Unknown enrichment type: %s', p_enrichment_type)
      );
  END CASE;
  
  -- 3. Se passou todas as verificações, pode rodar
  RETURN jsonb_build_object(
    'can_run', true,
    'reason', 'ok',
    'message', 'Enrichment can proceed'
  );
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.can_run_enrichment IS 
'MC2: Verifica se um enrichment pode ser executado (idempotência). Retorna motivo do skip se não puder.';

-- ============================================================================
-- 3. FUNÇÃO: mark_enrichment_done(company_id, enrichment_type, metadata)
-- ============================================================================
-- Marca um enrichment como concluído e atualiza estado
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_enrichment_done(
  p_company_id UUID,
  p_enrichment_type TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_state JSONB;
  v_new_state JSONB;
  v_history JSONB;
BEGIN
  -- 1. Buscar estado atual
  SELECT enrichment_state INTO v_current_state
  FROM public.companies
  WHERE id = p_company_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Company not found'
    );
  END IF;
  
  v_current_state := COALESCE(v_current_state, '{}'::JSONB);
  
  -- 2. Atualizar estado baseado no tipo
  v_new_state := v_current_state;
  
  CASE p_enrichment_type
    WHEN 'apollo_org' THEN
      v_new_state := jsonb_set(v_new_state, '{apollo_org_enriched}', 'true'::JSONB);
    WHEN 'decision_makers' THEN
      v_new_state := jsonb_set(v_new_state, '{decision_makers_enriched}', 'true'::JSONB);
    WHEN 'website' THEN
      v_new_state := jsonb_set(v_new_state, '{website_scanned}', 'true'::JSONB);
    WHEN 'products' THEN
      v_new_state := jsonb_set(v_new_state, '{products_extracted}', 'true'::JSONB);
    WHEN 'matching' THEN
      v_new_state := jsonb_set(v_new_state, '{matching_done}', 'true'::JSONB);
    WHEN 'receita' THEN
      v_new_state := jsonb_set(v_new_state, '{receita_enriched}', 'true'::JSONB);
  END CASE;
  
  -- 3. Atualizar timestamp
  v_new_state := jsonb_set(v_new_state, '{last_enrichment_at}', to_jsonb(NOW()));
  
  -- 4. Adicionar ao histórico
  v_history := COALESCE(v_new_state->'enrichment_history', '[]'::JSONB);
  v_history := v_history || jsonb_build_array(
    jsonb_build_object(
      'type', p_enrichment_type,
      'completed_at', NOW(),
      'metadata', p_metadata
    )
  );
  v_new_state := jsonb_set(v_new_state, '{enrichment_history}', v_history);
  
  -- 5. Atualizar companies
  UPDATE public.companies
  SET 
    enrichment_state = v_new_state,
    updated_at = NOW()
  WHERE id = p_company_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'enrichment_type', p_enrichment_type,
    'updated_at', NOW()
  );
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.mark_enrichment_done IS 
'MC2: Marca um enrichment como concluído e atualiza estado + histórico.';

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.can_run_enrichment TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_enrichment_done TO authenticated;
