-- ==========================================
-- MICROCICLO MC2.2: Correção de Empresas Órfãs
-- ==========================================
-- Data: 2026-01-24
-- Descrição: Sincroniza empresas ACTIVE que não têm registro em icp_analysis_results
-- Garante que TODAS as empresas ACTIVE tenham registro correspondente em icp_analysis_results

-- ==========================================
-- FUNÇÃO: Sincronizar empresa ACTIVE órfã
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
    'email', v_company.email,
    'telefone', NULL,
    'website_encontrado', v_company.website_encontrado,
    'website_fit_score', COALESCE((v_company.website_fit_score)::numeric, 0),
    'website_products_match', COALESCE(v_company.website_products_match, '[]'::jsonb),
    'linkedin_url', v_company.linkedin_url,
    'icp_score', COALESCE((v_company.icp_score)::numeric, 0),
    'fit_score', NULL,
    'purchase_intent_score', COALESCE((v_company.purchase_intent_score)::numeric, 0),
    'purchase_intent_type', COALESCE(v_company.purchase_intent_type, 'potencial'),
    'status', 'aprovada',
    'temperatura', COALESCE(v_company.temperatura, 'cold'),
    'totvs_status', v_company.totvs_status,
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
-- FUNÇÃO: Sincronizar TODAS as empresas órfãs de um tenant
-- ==========================================
CREATE OR REPLACE FUNCTION sync_all_orphan_active_companies(
  p_tenant_id UUID
)
RETURNS TABLE (
  total_found INTEGER,
  synced_count INTEGER,
  failed_count INTEGER,
  results JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_result RECORD;
  v_total INTEGER := 0;
  v_synced INTEGER := 0;
  v_failed INTEGER := 0;
  v_results JSONB := '[]'::jsonb;
  v_result_item JSONB;
BEGIN
  -- Encontrar todas as empresas ACTIVE sem registro em icp_analysis_results
  FOR v_company IN
    SELECT c.id, c.tenant_id
    FROM public.companies c
    WHERE c.tenant_id = p_tenant_id
      AND COALESCE(c.canonical_status, 'BASE') = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1
        FROM public.icp_analysis_results iar
        WHERE iar.company_id = c.id
          AND iar.tenant_id = c.tenant_id
      )
  LOOP
    v_total := v_total + 1;
    
    -- Sincronizar empresa
    SELECT * INTO v_result
    FROM sync_orphan_active_company(v_company.id, v_company.tenant_id);
    
    -- Adicionar resultado
    v_result_item := jsonb_build_object(
      'company_id', v_company.id,
      'success', v_result.success,
      'message', v_result.message,
      'icp_analysis_id', v_result.icp_analysis_id
    );
    
    v_results := v_results || v_result_item;
    
    -- Contar sucessos e falhas
    IF v_result.success THEN
      v_synced := v_synced + 1;
    ELSE
      v_failed := v_failed + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_total, v_synced, v_failed, v_results;
END;
$$;

-- Comentários
COMMENT ON FUNCTION sync_orphan_active_company IS 
'Sincroniza uma empresa ACTIVE que não tem registro em icp_analysis_results. Cria registro com status=''aprovada''.';

COMMENT ON FUNCTION sync_all_orphan_active_companies IS 
'Sincroniza TODAS as empresas ACTIVE órfãs de um tenant. Retorna contagem e resultados detalhados.';

-- Permissões
GRANT EXECUTE ON FUNCTION sync_orphan_active_company(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_orphan_active_companies(UUID) TO authenticated;

-- ==========================================
-- SCRIPT DE CORREÇÃO MANUAL (executar após migration)
-- ==========================================
-- Para corrigir empresas órfãs de um tenant específico:
-- 
-- SELECT * FROM sync_all_orphan_active_companies('f23bdc79-a26a-4ebc-a87a-01a37177a623');
--
-- Para corrigir uma empresa específica:
--
-- SELECT * FROM sync_orphan_active_company(
--   'company_id_aqui'::UUID,
--   'f23bdc79-a26a-4ebc-a87a-01a37177a623'::UUID
-- );
