-- ============================================================================
-- MC1: CANONICAL COMPANIES + SYNC LAYER
-- ============================================================================
-- Data: 2026-01-24
-- Objetivo: Declarar companies como fonte canônica e criar sincronismo para derivados
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO: sync_company(company_id, opts)
-- ============================================================================
-- Sincroniza dados de companies para tabelas derivadas (icp_analysis_results, qualified_prospects)
-- APENAS quando existirem referências (company_id não nulo)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_company(
  p_company_id UUID,
  p_opts JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_synced_icp INTEGER := 0;
  v_synced_qualified INTEGER := 0;
  v_result JSONB;
BEGIN
  -- 1. Buscar dados da empresa canônica
  SELECT 
    id,
    linkedin_url,
    website,
    domain,
    apollo_organization_id,
    industry,
    description,
    cnpj,
    raw_data
  INTO v_company
  FROM public.companies
  WHERE id = p_company_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Company not found',
      'company_id', p_company_id
    );
  END IF;
  
  -- 2. Sincronizar icp_analysis_results (se company_id existir)
  UPDATE public.icp_analysis_results
  SET
    linkedin_url = COALESCE(
      CASE WHEN (p_opts->>'force_linkedin')::boolean THEN v_company.linkedin_url ELSE NULL END,
      linkedin_url,
      v_company.linkedin_url
    ),
    website = COALESCE(
      CASE WHEN (p_opts->>'force_website')::boolean THEN v_company.website ELSE NULL END,
      website,
      v_company.website
    ),
    apollo_id = COALESCE(
      CASE WHEN (p_opts->>'force_apollo_id')::boolean THEN v_company.apollo_organization_id ELSE NULL END,
      apollo_id,
      v_company.apollo_organization_id
    ),
    raw_data = COALESCE(raw_data, '{}'::JSONB) || jsonb_build_object(
      'canonical_sync_at', NOW(),
      'canonical_company_id', p_company_id
    ),
    updated_at = NOW()
  WHERE company_id = p_company_id
    AND (
      -- Sincronizar apenas se campos estão diferentes ou force_* está true
      linkedin_url IS DISTINCT FROM v_company.linkedin_url
      OR website IS DISTINCT FROM v_company.website
      OR apollo_id IS DISTINCT FROM v_company.apollo_organization_id
      OR (p_opts->>'force_linkedin')::boolean = true
      OR (p_opts->>'force_website')::boolean = true
      OR (p_opts->>'force_apollo_id')::boolean = true
    );
  
  GET DIAGNOSTICS v_synced_icp = ROW_COUNT;
  
  -- 3. Sincronizar qualified_prospects (se company_id existir)
  UPDATE public.qualified_prospects
  SET
    linkedin_url = COALESCE(
      CASE WHEN (p_opts->>'force_linkedin')::boolean THEN v_company.linkedin_url ELSE NULL END,
      linkedin_url,
      v_company.linkedin_url
    ),
    website_encontrado = COALESCE(
      CASE WHEN (p_opts->>'force_website')::boolean THEN v_company.website ELSE NULL END,
      website_encontrado,
      v_company.website
    ),
    enrichment_data = COALESCE(enrichment_data, '{}'::JSONB) || jsonb_build_object(
      'canonical_sync_at', NOW(),
      'canonical_company_id', p_company_id
    ),
    updated_at = NOW()
  WHERE company_id = p_company_id
    AND (
      -- Sincronizar apenas se campos estão diferentes ou force_* está true
      linkedin_url IS DISTINCT FROM v_company.linkedin_url
      OR website_encontrado IS DISTINCT FROM v_company.website
      OR (p_opts->>'force_linkedin')::boolean = true
      OR (p_opts->>'force_website')::boolean = true
    );
  
  GET DIAGNOSTICS v_synced_qualified = ROW_COUNT;
  
  -- 4. Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'synced_icp', v_synced_icp,
    'synced_qualified', v_synced_qualified,
    'synced_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.sync_company IS 
'MC1: Sincroniza dados canônicos de companies para tabelas derivadas (icp_analysis_results, qualified_prospects). Usa company_id como chave, nunca cnpj.';

-- ============================================================================
-- 2. TRIGGER: Sincronização automática quando companies muda
-- ============================================================================
-- Sincroniza automaticamente quando linkedin_url, website ou apollo_organization_id mudam
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_sync_company_to_derived()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sincronizar apenas se campos canônicos mudaram
  IF (
    OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url
    OR OLD.website IS DISTINCT FROM NEW.website
    OR OLD.domain IS DISTINCT FROM NEW.domain
    OR OLD.apollo_organization_id IS DISTINCT FROM NEW.apollo_organization_id
  ) THEN
    -- Chamar função de sincronização (sem force, apenas atualizar se NULL)
    PERFORM public.sync_company(NEW.id, '{}'::JSONB);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS sync_company_to_derived ON public.companies;
CREATE TRIGGER sync_company_to_derived
  AFTER UPDATE OF linkedin_url, website, domain, apollo_organization_id
  ON public.companies
  FOR EACH ROW
  WHEN (
    OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url
    OR OLD.website IS DISTINCT FROM NEW.website
    OR OLD.domain IS DISTINCT FROM NEW.domain
    OR OLD.apollo_organization_id IS DISTINCT FROM NEW.apollo_organization_id
  )
  EXECUTE FUNCTION public.trigger_sync_company_to_derived();

-- Comentário
COMMENT ON TRIGGER sync_company_to_derived ON public.companies IS 
'MC1: Sincroniza automaticamente linkedin_url, website e apollo_organization_id para tabelas derivadas quando companies muda.';

-- ============================================================================
-- 3. FUNÇÃO: reconcile_company_id(cnpj, tenant_id)
-- ============================================================================
-- Reconcilia registros sem company_id, criando ou vinculando company
-- Match por cnpj normalizado + tenant_id (sem duplicar empresa)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reconcile_company_id(
  p_cnpj TEXT,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cnpj_normalized TEXT;
  v_company_id UUID;
  v_existing_company RECORD;
BEGIN
  -- Normalizar CNPJ (remover caracteres não numéricos)
  v_cnpj_normalized := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  
  IF length(v_cnpj_normalized) != 14 THEN
    RAISE EXCEPTION 'CNPJ inválido: %', p_cnpj;
  END IF;
  
  -- 1. Buscar company existente por CNPJ
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = v_cnpj_normalized
  LIMIT 1;
  
  -- 2. Se encontrou, retornar
  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;
  
  -- 3. Se não encontrou, criar nova company (apenas se dados básicos existirem)
  -- NOTA: Esta função NÃO cria company automaticamente - apenas retorna NULL
  -- A criação deve ser feita explicitamente pelo caller quando necessário
  RETURN NULL;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.reconcile_company_id IS 
'MC1: Reconcilia company_id para registros sem vínculo. Busca company existente por CNPJ normalizado. Retorna NULL se não encontrado (não cria automaticamente).';

-- ============================================================================
-- 4. ÍNDICES para performance
-- ============================================================================

-- Índice para busca rápida de company_id em derivados
CREATE INDEX IF NOT EXISTS idx_icp_results_company_id_sync 
ON public.icp_analysis_results(company_id) 
WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qualified_prospects_company_id_sync 
ON public.qualified_prospects(company_id) 
WHERE company_id IS NOT NULL;

-- Índice para busca de CNPJ normalizado em companies
CREATE INDEX IF NOT EXISTS idx_companies_cnpj_normalized 
ON public.companies(regexp_replace(cnpj, '[^0-9]', '', 'g'))
WHERE cnpj IS NOT NULL;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.sync_company TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_company_id TO authenticated;
