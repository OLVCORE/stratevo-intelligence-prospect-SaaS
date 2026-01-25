-- ==========================================
-- MC-2.6.5: CORREÇÃO DE TRATAMENTO DE NULLs NA FUNÇÃO DE APROVAÇÃO
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Corrige tratamento de valores NULL e conversões numéricas na função approve_company_to_leads
--            para evitar erros 400 ao aprovar empresas

-- ==========================================
-- FUNÇÃO: Aprovar empresa da Base para Leads Aprovados (CORRIGIDA)
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
  v_cnae_code TEXT;
  v_setor TEXT;
  v_setor_industria TEXT;
  v_categoria TEXT;
  v_raw_cnae TEXT;
  v_cnae_description TEXT;
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
  
  -- 2.1. Extrair CNAE e buscar setor da tabela cnae_classifications
  -- ✅ CRÍTICO: companies não tem coluna cnae_principal, apenas raw_data
  v_cnae_code := NULL;
  v_cnae_description := NULL;
  
  -- Tentar extrair CNAE APENAS de raw_data (companies não tem cnae_principal como coluna)
  IF v_company.raw_data IS NOT NULL THEN
    -- Extrair código CNAE bruto
    v_raw_cnae := COALESCE(
      (v_company.raw_data->'receita_federal'->'atividade_principal'->0->>'code'),
      (v_company.raw_data->'receita'->'atividade_principal'->0->>'code'),
      (v_company.raw_data->'atividade_principal'->0->>'code'),
      (v_company.raw_data->>'cnae_fiscal'),
      (v_company.raw_data->>'cnae_principal')
    );
    
    -- ✅ CRÍTICO: Extrair também a DESCRIÇÃO do CNAE
    v_cnae_description := COALESCE(
      (v_company.raw_data->'receita_federal'->'atividade_principal'->0->>'text'),
      (v_company.raw_data->'receita'->'atividade_principal'->0->>'text'),
      (v_company.raw_data->'atividade_principal'->0->>'text'),
      (v_company.raw_data->>'cnae_principal_descricao'),
      (v_company.raw_data->>'cnae_descricao')
    );
    
    -- Normalizar para formato da tabela cnae_classifications: "6203-1/00" (sem pontos)
    IF v_raw_cnae IS NOT NULL THEN
      -- Usar função normalize_cnae_code se existir, senão normalizar manualmente
      BEGIN
        v_cnae_code := normalize_cnae_code(v_raw_cnae);
      EXCEPTION
        WHEN OTHERS THEN
          -- Fallback: normalizar manualmente (remover pontos, manter traços e barras)
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_raw_cnae), '.', ''), ' ', ''));
      END;
    END IF;
  END IF;
  
  -- Buscar setor_industria E categoria na tabela cnae_classifications
  -- ✅ FORMATO: "Setor - Categoria" (ex: "Manufatura - Fabricante")
  IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
    SELECT setor_industria, categoria 
    INTO v_setor_industria, v_categoria
    FROM public.cnae_classifications
    WHERE cnae_code = v_cnae_code
    LIMIT 1;
    
    -- Formatar como "Setor - Categoria" se ambos existirem
    IF v_setor_industria IS NOT NULL THEN
      IF v_categoria IS NOT NULL THEN
        v_setor := v_setor_industria || ' - ' || v_categoria;
      ELSE
        v_setor := v_setor_industria;
      END IF;
    END IF;
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
    -- ✅ MC2.6.5: Garantir que todos os valores numéricos tenham defaults seguros
    v_normalized_data := jsonb_build_object(
      'company_id', v_company.id,
      'tenant_id', p_tenant_id,
      'cnpj', COALESCE(v_company.cnpj, ''), -- ✅ NOT NULL: sempre terá valor
      'razao_social', COALESCE(v_company.company_name, v_company.name, 'N/A'), -- ✅ NOT NULL: sempre terá valor
      'nome_fantasia', (v_company.location->>'name')::text,
      'uf', (v_company.location->>'state')::text,
      'municipio', (v_company.location->>'city')::text,
      'porte', NULL,
      'cnae_principal', v_cnae_code,
      'website', v_company.website,
      'email', NULL,
      'telefone', NULL,
      'website_encontrado', v_company.website_encontrado,
      'website_fit_score', COALESCE((v_company.website_fit_score)::numeric, 0),
      'website_products_match', COALESCE(v_company.website_products_match, '[]'::jsonb),
      'linkedin_url', v_company.linkedin_url,
      'icp_score', 0,
      'fit_score', NULL,
      'purchase_intent_score', COALESCE((v_company.purchase_intent_score)::numeric, 0),
      'purchase_intent_type', 'potencial',
      'status', 'aprovada', -- ✅ STATUS CRÍTICO: 'aprovada' para aparecer em Leads Aprovados
      'temperatura', 'cold',
      'totvs_status', NULL,
      'origem', COALESCE(v_company.origem, v_company.source_name, 'icp_individual'),
      'setor', v_setor,
      'raw_data', COALESCE(v_company.raw_data, '{}'::jsonb),
      'raw_analysis', jsonb_build_object(
        'migrated_from_companies', true,
        'migrated_at', now(),
        'canonical_status_previous', v_current_state,
        'canonical_status_new', 'ACTIVE',
        'cnae_code', v_cnae_code,
        'setor_source', 'cnae_classifications'
      )
    );
    
    -- 3.3. Verificar se já existe registro em icp_analysis_results
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
        website_fit_score = COALESCE((v_normalized_data->>'website_fit_score')::numeric, website_fit_score, 0),
        website_products_match = COALESCE((v_normalized_data->>'website_products_match')::jsonb, website_products_match, '[]'::jsonb),
        linkedin_url = COALESCE(NULLIF(v_normalized_data->>'linkedin_url', ''), linkedin_url),
        icp_score = COALESCE((v_normalized_data->>'icp_score')::numeric, icp_score, 0),
        purchase_intent_score = COALESCE((v_normalized_data->>'purchase_intent_score')::numeric, purchase_intent_score, 0),
        purchase_intent_type = COALESCE((v_normalized_data->>'purchase_intent_type')::text, purchase_intent_type, 'potencial'),
        temperatura = COALESCE((v_normalized_data->>'temperatura')::text, temperatura, 'cold'),
        origem = COALESCE(v_normalized_data->>'origem', origem, 'icp_individual'),
        setor = COALESCE(v_normalized_data->>'setor', setor),
        raw_data = COALESCE((v_normalized_data->>'raw_data')::jsonb, raw_data, '{}'::jsonb),
        raw_analysis = COALESCE(
          (raw_analysis || jsonb_build_object(
            'migrated_from_companies', true,
            'migrated_at', now(),
            'canonical_status_previous', v_current_state,
            'canonical_status_new', 'ACTIVE',
            'approved_at', now(),
            'cnae_descricao', v_cnae_description
          )),
          jsonb_build_object(
            'migrated_from_companies', true,
            'migrated_at', now(),
            'canonical_status_previous', v_current_state,
            'canonical_status_new', 'ACTIVE',
            'approved_at', now(),
            'cnae_descricao', v_cnae_description
          )
        ),
        updated_at = now()
      WHERE id = v_icp_analysis_id;
    ELSE
      -- Inserir novo registro
      -- ✅ MC2.6.5: Garantir que todos os valores numéricos tenham COALESCE com defaults
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
        setor,
        raw_data,
        raw_analysis
      )
      VALUES (
        (v_normalized_data->>'company_id')::UUID,
        (v_normalized_data->>'tenant_id')::UUID,
        COALESCE(v_normalized_data->>'cnpj', ''),
        COALESCE(v_normalized_data->>'razao_social', 'N/A'),
        NULLIF(v_normalized_data->>'nome_fantasia', ''),
        NULLIF(v_normalized_data->>'uf', ''),
        NULLIF(v_normalized_data->>'municipio', ''),
        NULLIF(v_normalized_data->>'porte', ''),
        NULLIF(v_normalized_data->>'cnae_principal', ''),
        NULLIF(v_normalized_data->>'website', ''),
        NULLIF(v_normalized_data->>'email', ''),
        NULLIF(v_normalized_data->>'telefone', ''),
        NULLIF(v_normalized_data->>'website_encontrado', ''),
        COALESCE(
          CASE 
            WHEN v_normalized_data->>'website_fit_score' IS NULL OR v_normalized_data->>'website_fit_score' = '' 
            THEN NULL 
            ELSE (v_normalized_data->>'website_fit_score')::numeric 
          END, 
          0
        ),
        COALESCE(
          CASE 
            WHEN v_normalized_data->>'website_products_match' IS NULL 
            THEN '[]'::jsonb 
            ELSE (v_normalized_data->>'website_products_match')::jsonb 
          END, 
          '[]'::jsonb
        ),
        NULLIF(v_normalized_data->>'linkedin_url', ''),
        COALESCE(
          CASE 
            WHEN v_normalized_data->>'icp_score' IS NULL OR v_normalized_data->>'icp_score' = '' 
            THEN NULL 
            ELSE (v_normalized_data->>'icp_score')::numeric 
          END, 
          0
        ),
        CASE 
          WHEN v_normalized_data->>'fit_score' IS NULL OR v_normalized_data->>'fit_score' = '' 
          THEN NULL 
          ELSE (v_normalized_data->>'fit_score')::numeric 
        END,
        COALESCE(
          CASE 
            WHEN v_normalized_data->>'purchase_intent_score' IS NULL OR v_normalized_data->>'purchase_intent_score' = '' 
            THEN NULL 
            ELSE (v_normalized_data->>'purchase_intent_score')::numeric 
          END, 
          0
        ),
        COALESCE((v_normalized_data->>'purchase_intent_type')::text, 'potencial'),
        COALESCE(v_normalized_data->>'status', 'aprovada'), -- ✅ 'aprovada'
        COALESCE((v_normalized_data->>'temperatura')::text, 'cold'),
        NULLIF(v_normalized_data->>'totvs_status', ''),
        COALESCE(v_normalized_data->>'origem', 'icp_individual'),
        v_normalized_data->>'setor',
        COALESCE((v_normalized_data->>'raw_data')::jsonb, '{}'::jsonb),
        COALESCE((v_normalized_data->>'raw_analysis')::jsonb, '{}'::jsonb)
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

-- Comentários
COMMENT ON FUNCTION approve_company_to_leads IS 
'MC2.6.5: Aprova empresa da Base (BASE/POOL) para Leads Aprovados (ACTIVE). Corrigido tratamento de NULLs e conversões numéricas para evitar erros 400.';
