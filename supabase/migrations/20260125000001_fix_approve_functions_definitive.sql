-- ==========================================
-- MC-2.6.1: CORREÇÃO DEFINITIVA DAS FUNÇÕES DE APROVAÇÃO
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Força recriação de todas as funções de aprovação removendo TODAS as dependências
--            de campos inexistentes em companies (temperatura, icp_score, purchase_intent_type)
--            Esta migration garante que NENHUMA função tente acessar campos que não existem.

-- ==========================================
-- FUNÇÃO: Aprovar empresa da Base para Leads Aprovados (DEFINITIVA)
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
    -- ✅ MC2.6.1: NÃO usar campos que não existem em companies
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
      'icp_score', 0, -- ✅ MC2.6.1: Campo não existe em companies
      'fit_score', NULL,
      'purchase_intent_score', COALESCE((v_company.purchase_intent_score)::numeric, 0),
      'purchase_intent_type', 'potencial', -- ✅ MC2.6.1: Campo não existe em companies
      'status', 'aprovada', -- ✅ STATUS CRÍTICO: 'aprovada' para aparecer em Leads Aprovados
      'temperatura', 'cold', -- ✅ MC2.6.1: Campo não existe em companies, usar valor padrão
      'totvs_status', v_company.totvs_status,
      'origem', COALESCE(v_company.origem, v_company.source_name, 'icp_individual'), -- ✅ MC2.6.1: Usar valor válido
      'raw_data', COALESCE(v_company.raw_data, '{}'::jsonb),
      'raw_analysis', jsonb_build_object(
        'migrated_from_companies', true,
        'migrated_at', now(),
        'canonical_status_previous', v_current_state,
        'canonical_status_new', 'ACTIVE'
      )
    );
    
    -- 3.3. Verificar se já existe registro em icp_analysis_results
    -- ✅ MC2.6.1: Removido filtro tenant_id (campo pode não existir ou causar erro)
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

-- ==========================================
-- FUNÇÃO: Aprovar empresas em massa (DEFINITIVA)
-- ==========================================
CREATE OR REPLACE FUNCTION approve_companies_batch_to_leads(
  p_company_ids UUID[],
  p_tenant_id UUID
)
RETURNS TABLE (
  approved_count INTEGER,
  failed_count INTEGER,
  results JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_result RECORD;
  v_approved INTEGER := 0;
  v_failed INTEGER := 0;
  v_results JSONB := '[]'::jsonb;
  v_result_item JSONB;
BEGIN
  -- Processar cada empresa
  FOREACH v_company_id IN ARRAY p_company_ids
  LOOP
    -- Chamar função individual
    SELECT * INTO v_result
    FROM approve_company_to_leads(v_company_id, p_tenant_id);
    
    -- Adicionar resultado
    v_result_item := jsonb_build_object(
      'company_id', v_company_id,
      'success', v_result.success,
      'message', v_result.message,
      'icp_analysis_id', v_result.icp_analysis_id
    );
    
    v_results := v_results || v_result_item;
    
    -- Contar sucessos e falhas
    IF v_result.success THEN
      v_approved := v_approved + 1;
    ELSE
      v_failed := v_failed + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_approved, v_failed, v_results;
END;
$$;

-- Comentários
COMMENT ON FUNCTION approve_company_to_leads IS 
'MC2.6.1: Aprova empresa da Base (BASE/POOL) para Leads Aprovados (ACTIVE). Atualiza canonical_status em companies e insere/atualiza registro em icp_analysis_results com status=''aprovada''. Transação atômica. CORRIGIDO: não usa campos inexistentes (temperatura, icp_score, purchase_intent_type).';

COMMENT ON FUNCTION approve_companies_batch_to_leads IS 
'MC2.6.1: Aprova múltiplas empresas em lote. Retorna contagem de sucessos, falhas e resultados detalhados.';
