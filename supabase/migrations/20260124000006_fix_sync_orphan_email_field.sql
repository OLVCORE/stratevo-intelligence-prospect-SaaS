-- ==========================================
-- CORREÇÃO: Campo email não existe em companies
-- ==========================================
-- Data: 2026-01-24
-- Descrição: Corrige função sync_orphan_active_company para não usar campo email inexistente

-- ==========================================
-- FUNÇÃO: Sincronizar empresa ACTIVE órfã (CORRIGIDA)
-- ==========================================
CREATE OR REPLACE FUNCTION sync_orphan_active_company(
  p_company_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  icp_analysis_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_icp_analysis_id UUID;
  v_normalized_data JSONB;
BEGIN
  -- 1. Buscar empresa ACTIVE
  SELECT 
    c.*,
    COALESCE(c.canonical_status, 'BASE') as current_canonical_status
  INTO v_company
  FROM public.companies c
  WHERE c.id = p_company_id
    AND c.tenant_id = p_tenant_id
    AND COALESCE(c.canonical_status, 'BASE') = 'ACTIVE';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Empresa não encontrada ou não está em ACTIVE', NULL::UUID;
    RETURN;
  END IF;
  
  -- 2. Verificar se já existe registro em icp_analysis_results
  SELECT id INTO v_icp_analysis_id
  FROM public.icp_analysis_results
  WHERE company_id = p_company_id
    AND tenant_id = p_tenant_id
  LIMIT 1;
  
  IF v_icp_analysis_id IS NOT NULL THEN
    -- Já existe, apenas atualizar status se necessário
    UPDATE public.icp_analysis_results
    SET
      status = 'aprovada',
      updated_at = now()
    WHERE id = v_icp_analysis_id
      AND status != 'aprovada';
    
    RETURN QUERY SELECT true, 'Registro já existia, status atualizado', v_icp_analysis_id;
    RETURN;
  END IF;
  
  -- 3. Preparar dados normalizados para icp_analysis_results
  -- ✅ CORRIGIDO: Não usar campos que não existem em companies
  v_normalized_data := jsonb_build_object(
    'company_id', v_company.id,
    'tenant_id', p_tenant_id,
    'cnpj', COALESCE(v_company.cnpj, ''),
    'razao_social', COALESCE(v_company.company_name, v_company.name, 'N/A'),
    'nome_fantasia', (v_company.location->>'name')::text,
    'uf', (v_company.location->>'state')::text,
    'municipio', (v_company.location->>'city')::text,
    'porte', NULL,
    'cnae_principal', NULL,
    'website', v_company.website,
    'email', NULL, -- ✅ Campo não existe em companies
    'telefone', NULL,
    'website_encontrado', v_company.website_encontrado,
    'website_fit_score', COALESCE((v_company.website_fit_score)::numeric, 0),
    'website_products_match', COALESCE(v_company.website_products_match, '[]'::jsonb),
    'linkedin_url', v_company.linkedin_url,
      'icp_score', 0, -- ✅ MC2.5: Removida dependência de v_company.icp_score (campo não existe)
    'fit_score', NULL,
    'purchase_intent_score', COALESCE((v_company.purchase_intent_score)::numeric, 0),
    'purchase_intent_type', 'potencial', -- ✅ MC2.5: Removida dependência de v_company.purchase_intent_type (campo não existe)
    'status', 'aprovada',
    'temperatura', 'cold', -- ✅ MC2.6.1: Campo não existe em companies, usar valor padrão
    'totvs_status', NULL, -- ✅ MC2.6.1: Campo não existe em companies
    'origem', COALESCE(v_company.origem, v_company.source_name, 'companies_base'),
    'raw_data', COALESCE(v_company.raw_data, '{}'::jsonb),
    'raw_analysis', jsonb_build_object(
      'migrated_from_companies', true,
      'migrated_at', now(),
      'sync_type', 'orphan_fix',
      'canonical_status', 'ACTIVE'
    )
  );
  
  -- 4. Inserir registro em icp_analysis_results
  INSERT INTO public.icp_analysis_results (
    company_id,
    tenant_id,
    cnpj,
    razao_social,
    nome_fantasia,
    uf,
    municipio,
    porte,
    cnae_principal,
    website,
    email,
    telefone,
    website_encontrado,
    website_fit_score,
    website_products_match,
    linkedin_url,
    icp_score,
    fit_score,
    purchase_intent_score,
    purchase_intent_type,
    status,
    temperatura,
    totvs_status,
    origem,
    raw_data,
    raw_analysis
  )
  VALUES (
    (v_normalized_data->>'company_id')::UUID,
    (v_normalized_data->>'tenant_id')::UUID,
    v_normalized_data->>'cnpj',
    v_normalized_data->>'razao_social',
    NULLIF(v_normalized_data->>'nome_fantasia', ''),
    NULLIF(v_normalized_data->>'uf', ''),
    NULLIF(v_normalized_data->>'municipio', ''),
    NULLIF(v_normalized_data->>'porte', ''),
    NULLIF(v_normalized_data->>'cnae_principal', ''),
    NULLIF(v_normalized_data->>'website', ''),
    NULLIF(v_normalized_data->>'email', ''),
    NULLIF(v_normalized_data->>'telefone', ''),
    NULLIF(v_normalized_data->>'website_encontrado', ''),
    (v_normalized_data->>'website_fit_score')::numeric,
    (v_normalized_data->>'website_products_match')::jsonb,
    NULLIF(v_normalized_data->>'linkedin_url', ''),
    (v_normalized_data->>'icp_score')::numeric,
    NULLIF(v_normalized_data->>'fit_score', '')::numeric,
    (v_normalized_data->>'purchase_intent_score')::numeric,
    (v_normalized_data->>'purchase_intent_type')::text,
    v_normalized_data->>'status',
    (v_normalized_data->>'temperatura')::text,
    NULLIF(v_normalized_data->>'totvs_status', ''),
    v_normalized_data->>'origem',
    (v_normalized_data->>'raw_data')::jsonb,
    (v_normalized_data->>'raw_analysis')::jsonb
  )
  RETURNING id INTO v_icp_analysis_id;
  
  RETURN QUERY SELECT true, 'Empresa órfã sincronizada com sucesso', v_icp_analysis_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 
      format('Erro ao sincronizar empresa órfã: %s', SQLERRM),
      NULL::UUID;
END;
$$;

-- ==========================================
-- CORRIGIR TAMBÉM A RPC DE APROVAÇÃO
-- ==========================================
CREATE OR REPLACE FUNCTION approve_company_to_leads(
  p_company_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  icp_analysis_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_current_state TEXT;
  v_icp_analysis_id UUID;
  v_normalized_data JSONB;
BEGIN
  -- 1. Buscar empresa e validar estado
  SELECT 
    c.*,
    COALESCE(c.canonical_status, 'BASE') as current_canonical_status
  INTO v_company
  FROM public.companies c
  WHERE c.id = p_company_id
    AND c.tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Empresa não encontrada ou não pertence ao tenant', NULL::UUID;
    RETURN;
  END IF;
  
  v_current_state := v_company.current_canonical_status;
  
  -- 2. Validar que está em BASE ou POOL
  IF v_current_state NOT IN ('BASE', 'POOL') THEN
    RETURN QUERY SELECT false, 
      format('Empresa deve estar em BASE ou POOL para aprovar. Estado atual: %s', v_current_state),
      NULL::UUID;
    RETURN;
  END IF;
  
  -- 3. TRANSACAO: Atualizar canonical_status e inserir em icp_analysis_results
  BEGIN
    -- 3.1. Atualizar canonical_status para ACTIVE
    UPDATE public.companies
    SET 
      canonical_status = 'ACTIVE',
      updated_at = now()
    WHERE id = p_company_id
      AND tenant_id = p_tenant_id;
    
    -- 3.2. Preparar dados normalizados para icp_analysis_results
    -- ✅ CORRIGIDO: Não usar campos que não existem em companies
    v_normalized_data := jsonb_build_object(
      'company_id', v_company.id,
      'tenant_id', p_tenant_id,
      'cnpj', COALESCE(v_company.cnpj, ''), -- ✅ NOT NULL: sempre terá valor
      'razao_social', COALESCE(v_company.company_name, v_company.name, 'N/A'), -- ✅ NOT NULL: sempre terá valor
      'nome_fantasia', (v_company.location->>'name')::text,
      'uf', (v_company.location->>'state')::text,
      'municipio', (v_company.location->>'city')::text,
      'porte', NULL,
      'cnae_principal', NULL,
      'website', v_company.website,
      'email', NULL, -- ✅ Campo não existe em companies
      'telefone', NULL,
      'website_encontrado', v_company.website_encontrado,
      'website_fit_score', COALESCE((v_company.website_fit_score)::numeric, 0),
      'website_products_match', COALESCE(v_company.website_products_match, '[]'::jsonb),
      'linkedin_url', v_company.linkedin_url,
      'icp_score', 0, -- ✅ MC2.5: Removida dependência de v_company.icp_score (campo não existe)
      'fit_score', NULL,
      'purchase_intent_score', COALESCE((v_company.purchase_intent_score)::numeric, 0),
      'purchase_intent_type', 'potencial', -- ✅ MC2.5: Removida dependência de v_company.purchase_intent_type (campo não existe)
      'status', 'aprovada', -- ✅ STATUS CRÍTICO: 'aprovada' para aparecer em Leads Aprovados
      'temperatura', 'cold', -- ✅ MC2.6.1: Campo não existe em companies, usar valor padrão
      'totvs_status', NULL, -- ✅ MC2.6.1: Campo não existe em companies
      'origem', COALESCE(v_company.origem, v_company.source_name, 'icp_individual'), -- ✅ MC2.5: Usar valor válido do CHECK constraint
      'raw_data', COALESCE(v_company.raw_data, '{}'::jsonb),
      'raw_analysis', jsonb_build_object(
        'migrated_from_companies', true,
        'migrated_at', now(),
        'canonical_status_previous', v_current_state,
        'canonical_status_new', 'ACTIVE'
      )
    );
    
    -- 3.3. Verificar se já existe registro em icp_analysis_results
    -- ✅ MC2.5: Removido filtro tenant_id (campo pode não existir ou causar erro)
    SELECT id INTO v_icp_analysis_id
    FROM public.icp_analysis_results
    WHERE company_id = p_company_id
    LIMIT 1;
    
    -- 3.4. Inserir ou atualizar em icp_analysis_results
    IF v_icp_analysis_id IS NOT NULL THEN
      -- Atualizar registro existente
      UPDATE public.icp_analysis_results
      SET
        status = 'aprovada', -- ✅ SEMPRE atualizar status para 'aprovada'
        cnpj = COALESCE(v_normalized_data->>'cnpj', cnpj),
        razao_social = COALESCE(v_normalized_data->>'razao_social', razao_social),
        nome_fantasia = COALESCE(NULLIF(v_normalized_data->>'nome_fantasia', ''), nome_fantasia),
        uf = COALESCE(NULLIF(v_normalized_data->>'uf', ''), uf),
        municipio = COALESCE(NULLIF(v_normalized_data->>'municipio', ''), municipio),
        website = COALESCE(NULLIF(v_normalized_data->>'website', ''), website),
        website_encontrado = COALESCE(NULLIF(v_normalized_data->>'website_encontrado', ''), website_encontrado),
        website_fit_score = COALESCE((v_normalized_data->>'website_fit_score')::numeric, website_fit_score),
        website_products_match = COALESCE((v_normalized_data->>'website_products_match')::jsonb, website_products_match),
        linkedin_url = COALESCE(NULLIF(v_normalized_data->>'linkedin_url', ''), linkedin_url),
        icp_score = COALESCE((v_normalized_data->>'icp_score')::numeric, icp_score),
        purchase_intent_score = COALESCE((v_normalized_data->>'purchase_intent_score')::numeric, purchase_intent_score),
        purchase_intent_type = COALESCE((v_normalized_data->>'purchase_intent_type')::text, purchase_intent_type),
        temperatura = COALESCE((v_normalized_data->>'temperatura')::text, temperatura),
        origem = COALESCE(v_normalized_data->>'origem', origem),
        raw_data = COALESCE((v_normalized_data->>'raw_data')::jsonb, raw_data),
        raw_analysis = jsonb_build_object(
          'migrated_from_companies', true,
          'migrated_at', now(),
          'canonical_status_previous', v_current_state,
          'canonical_status_new', 'ACTIVE',
          'approved_at', now()
        ),
        updated_at = now()
      WHERE id = v_icp_analysis_id;
    ELSE
      -- Inserir novo registro
      INSERT INTO public.icp_analysis_results (
        company_id,
        tenant_id,
        cnpj,
        razao_social,
        nome_fantasia,
        uf,
        municipio,
        porte,
        cnae_principal,
        website,
        email,
        telefone,
        website_encontrado,
        website_fit_score,
        website_products_match,
        linkedin_url,
        icp_score,
        fit_score,
        purchase_intent_score,
        purchase_intent_type,
        status,
        temperatura,
        totvs_status,
        origem,
        raw_data,
        raw_analysis
      )
      VALUES (
        (v_normalized_data->>'company_id')::UUID,
        (v_normalized_data->>'tenant_id')::UUID,
        v_normalized_data->>'cnpj',
        v_normalized_data->>'razao_social',
        NULLIF(v_normalized_data->>'nome_fantasia', ''),
        NULLIF(v_normalized_data->>'uf', ''),
        NULLIF(v_normalized_data->>'municipio', ''),
        NULLIF(v_normalized_data->>'porte', ''),
        NULLIF(v_normalized_data->>'cnae_principal', ''),
        NULLIF(v_normalized_data->>'website', ''),
        NULLIF(v_normalized_data->>'email', ''),
        NULLIF(v_normalized_data->>'telefone', ''),
        NULLIF(v_normalized_data->>'website_encontrado', ''),
        (v_normalized_data->>'website_fit_score')::numeric,
        (v_normalized_data->>'website_products_match')::jsonb,
        NULLIF(v_normalized_data->>'linkedin_url', ''),
        (v_normalized_data->>'icp_score')::numeric,
        NULLIF(v_normalized_data->>'fit_score', '')::numeric,
        (v_normalized_data->>'purchase_intent_score')::numeric,
        (v_normalized_data->>'purchase_intent_type')::text,
        v_normalized_data->>'status', -- ✅ 'aprovada'
        (v_normalized_data->>'temperatura')::text,
        NULLIF(v_normalized_data->>'totvs_status', ''),
        v_normalized_data->>'origem',
        (v_normalized_data->>'raw_data')::jsonb,
        (v_normalized_data->>'raw_analysis')::jsonb
      )
      RETURNING id INTO v_icp_analysis_id;
    END IF;
    
    -- 3.5. Retornar sucesso
    RETURN QUERY SELECT true, 'Empresa aprovada com sucesso para Leads Aprovados', v_icp_analysis_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Em caso de erro, rollback automático (transação)
      RETURN QUERY SELECT false, 
        format('Erro ao aprovar empresa: %s', SQLERRM),
        NULL::UUID;
  END;
END;
$$;

-- Comentário
COMMENT ON FUNCTION sync_orphan_active_company IS 
'Sincroniza uma empresa ACTIVE que não tem registro em icp_analysis_results. Cria registro com status=''aprovada''. CORRIGIDO: não usa campo email inexistente.';

COMMENT ON FUNCTION approve_company_to_leads IS 
'Aprova empresa da Base (BASE/POOL) para Leads Aprovados (ACTIVE). Atualiza canonical_status em companies e insere/atualiza registro em icp_analysis_results com status=''aprovada''. Transação atômica. CORRIGIDO: não usa campo email inexistente.';
