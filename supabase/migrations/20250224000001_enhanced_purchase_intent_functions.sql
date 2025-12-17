-- ==========================================
-- MIGRATION: Funções Avançadas de Purchase Intent
-- ==========================================
-- Objetivo: Implementar análise avançada de Purchase Intent considerando:
-- - Produtos do tenant (website + CNAE)
-- - Produtos do prospect (website + CNAE)
-- - Dados completos do ICP (6 etapas)
-- - Similaridade com clientes atuais
-- - Análise competitiva
-- - Timing de mercado
-- ==========================================

-- 1. Função para inferir produtos a partir de CNAE
CREATE OR REPLACE FUNCTION infer_products_from_cnae(
  p_cnae_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_products JSONB;
  v_cnae_desc TEXT;
BEGIN
  -- Buscar descrição do CNAE
  SELECT descricao INTO v_cnae_desc
  FROM cnaes
  WHERE code = p_cnae_code
  LIMIT 1;
  
  -- Se não encontrou CNAE, retornar array vazio
  IF v_cnae_desc IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  -- Inferir produtos típicos baseado na descrição do CNAE
  -- Por enquanto, retornar produtos genéricos baseados na categoria
  -- (pode ser melhorado com tabela de mapeamento ou IA)
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', CASE 
        WHEN v_cnae_desc ILIKE '%software%' OR v_cnae_desc ILIKE '%tecnologia%' THEN 'Soluções de Software'
        WHEN v_cnae_desc ILIKE '%consultoria%' THEN 'Consultoria Especializada'
        WHEN v_cnae_desc ILIKE '%equipamento%' THEN 'Equipamentos Industriais'
        WHEN v_cnae_desc ILIKE '%serviço%' THEN 'Serviços Profissionais'
        ELSE 'Produtos/Serviços do Setor'
      END,
      'categoria', CASE
        WHEN v_cnae_desc ILIKE '%software%' OR v_cnae_desc ILIKE '%tecnologia%' THEN 'Tecnologia'
        WHEN v_cnae_desc ILIKE '%consultoria%' THEN 'Consultoria'
        WHEN v_cnae_desc ILIKE '%equipamento%' THEN 'Equipamentos'
        WHEN v_cnae_desc ILIKE '%serviço%' THEN 'Serviços'
        ELSE 'Geral'
      END,
      'tipo', 'inferred_from_cnae',
      'confianca', 0.5
    )
  )
  INTO v_products;
  
  RETURN COALESCE(v_products, '[]'::JSONB);
END;
$$;

COMMENT ON FUNCTION infer_products_from_cnae IS 
'Infere produtos típicos a partir de um código CNAE. Retorna array JSONB com produtos genéricos baseados na categoria do CNAE.';

-- 2. Função para calcular similaridade com clientes atuais
CREATE OR REPLACE FUNCTION calculate_similarity_to_customers(
  p_tenant_id UUID,
  p_prospect_cnpj TEXT,
  p_prospect_setor TEXT DEFAULT NULL,
  p_prospect_porte TEXT DEFAULT NULL,
  p_prospect_cnae TEXT DEFAULT NULL,
  p_prospect_faturamento NUMERIC DEFAULT NULL,
  p_prospect_funcionarios INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_similar_customers JSONB;
  v_avg_similarity NUMERIC := 0;
  v_count INTEGER := 0;
BEGIN
  -- Buscar clientes atuais do tenant que são similares ao prospect
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'customer_name', c.razao_social,
        'customer_cnpj', c.cnpj,
        'similarity_score', (
          CASE WHEN c.setor = p_prospect_setor THEN 30 ELSE 0 END +
          CASE WHEN c.porte = p_prospect_porte THEN 25 ELSE 0 END +
          CASE WHEN c.cnae_principal = p_prospect_cnae THEN 20 ELSE 0 END +
          CASE 
            WHEN p_prospect_faturamento IS NOT NULL AND c.faturamento IS NOT NULL 
            AND ABS(c.faturamento - p_prospect_faturamento) / NULLIF(p_prospect_faturamento, 0) < 0.3 
            THEN 15 ELSE 0 
          END +
          CASE 
            WHEN p_prospect_funcionarios IS NOT NULL AND c.funcionarios IS NOT NULL 
            AND ABS(c.funcionarios - p_prospect_funcionarios) / NULLIF(p_prospect_funcionarios, 0) < 0.3 
            THEN 10 ELSE 0 
          END
        ),
        'products_purchased', ARRAY[]::TEXT[] -- Pode ser preenchido depois com histórico de compras
      )
      ORDER BY (
        CASE WHEN c.setor = p_prospect_setor THEN 30 ELSE 0 END +
        CASE WHEN c.porte = p_prospect_porte THEN 25 ELSE 0 END +
        CASE WHEN c.cnae_principal = p_prospect_cnae THEN 20 ELSE 0 END +
        CASE 
          WHEN p_prospect_faturamento IS NOT NULL AND c.faturamento IS NOT NULL 
          AND ABS(c.faturamento - p_prospect_faturamento) / NULLIF(p_prospect_faturamento, 0) < 0.3 
          THEN 15 ELSE 0 
        END +
        CASE 
          WHEN p_prospect_funcionarios IS NOT NULL AND c.funcionarios IS NOT NULL 
          AND ABS(c.funcionarios - p_prospect_funcionarios) / NULLIF(p_prospect_funcionarios, 0) < 0.3 
          THEN 10 ELSE 0 
        END
      ) DESC
    ),
    COALESCE(AVG(
      CASE WHEN c.setor = p_prospect_setor THEN 30 ELSE 0 END +
      CASE WHEN c.porte = p_prospect_porte THEN 25 ELSE 0 END +
      CASE WHEN c.cnae_principal = p_prospect_cnae THEN 20 ELSE 0 END +
      CASE 
        WHEN p_prospect_faturamento IS NOT NULL AND c.faturamento IS NOT NULL 
        AND ABS(c.faturamento - p_prospect_faturamento) / NULLIF(p_prospect_faturamento, 0) < 0.3 
        THEN 15 ELSE 0 
      END +
      CASE 
        WHEN p_prospect_funcionarios IS NOT NULL AND c.funcionarios IS NOT NULL 
        AND ABS(c.funcionarios - p_prospect_funcionarios) / NULLIF(p_prospect_funcionarios, 0) < 0.3 
        THEN 10 ELSE 0 
      END
    ), 0),
    COUNT(*)
  INTO v_similar_customers, v_avg_similarity, v_count
  FROM companies c
  WHERE c.tenant_id = p_tenant_id
    AND c.is_customer = true
    AND (
      (p_prospect_setor IS NOT NULL AND c.setor = p_prospect_setor)
      OR (p_prospect_porte IS NOT NULL AND c.porte = p_prospect_porte)
      OR (p_prospect_cnae IS NOT NULL AND c.cnae_principal = p_prospect_cnae)
    )
  HAVING COUNT(*) > 0
  LIMIT 10;
  
  -- Montar resultado
  v_result := jsonb_build_object(
    'similar_customers_count', COALESCE(v_count, 0),
    'average_similarity_score', ROUND(COALESCE(v_avg_similarity, 0))::INTEGER,
    'similar_customers', COALESCE(v_similar_customers, '[]'::JSONB)
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION calculate_similarity_to_customers IS 
'Calcula similaridade entre um prospect e clientes atuais do tenant. Retorna JSONB com contagem, score médio e lista de clientes similares.';

-- 3. Função para detectar uso de concorrentes
CREATE OR REPLACE FUNCTION detect_competitor_usage(
  p_tenant_id UUID,
  p_prospect_cnpj TEXT,
  p_prospect_website TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_competitors JSONB;
  v_uses_competitor BOOLEAN := false;
  v_competitor_name TEXT;
  v_uses_legacy BOOLEAN := false;
  v_has_solution BOOLEAN := false;
BEGIN
  -- Buscar concorrentes do tenant
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', competitor_name,
      'cnpj', competitor_cnpj
    )
  )
  INTO v_competitors
  FROM (
    SELECT DISTINCT competitor_name, competitor_cnpj
    FROM tenant_competitor_products
    WHERE tenant_id = p_tenant_id
  ) sub;
  
  -- Por enquanto, retornar análise básica
  -- (pode ser melhorado com busca em website, vagas, etc.)
  v_result := jsonb_build_object(
    'uses_competitor', v_uses_competitor,
    'competitor_name', v_competitor_name,
    'uses_legacy', v_uses_legacy,
    'has_solution', v_has_solution,
    'migration_opportunity', v_uses_legacy,
    'greenfield_opportunity', NOT v_has_solution,
    'competitors_list', COALESCE(v_competitors, '[]'::JSONB)
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION detect_competitor_usage IS 
'Detecta se o prospect usa concorrentes do tenant. Retorna JSONB com análise competitiva.';

-- 4. Função para calcular timing de mercado
CREATE OR REPLACE FUNCTION calculate_market_timing_score(
  p_setor TEXT DEFAULT NULL,
  p_epoca_mes INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_favorable_period BOOLEAN := false;
  v_sector_growth TEXT := 'medio';
  v_urgency_signals TEXT[] := ARRAY[]::TEXT[];
  v_score INTEGER := 50;
BEGIN
  -- Determinar época favorável (últimos meses do ano = mais favorável)
  IF p_epoca_mes IS NOT NULL THEN
    v_favorable_period := p_epoca_mes IN (10, 11, 12, 1); -- Out-Dez e Janeiro
    IF v_favorable_period THEN
      v_score := v_score + 20;
      v_urgency_signals := array_append(v_urgency_signals, 'Época de orçamento anual');
    END IF;
  END IF;
  
  -- Por enquanto, retornar análise básica
  -- (pode ser melhorado com dados econômicos reais)
  v_result := jsonb_build_object(
    'favorable_period', v_favorable_period,
    'sector_growth', v_sector_growth,
    'urgency_signals', v_urgency_signals,
    'score', v_score,
    'recommended_approach_timing', CASE
      WHEN v_favorable_period THEN 'Aproximar-se imediatamente - época de orçamento'
      ELSE 'Acompanhar e preparar abordagem'
    END
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION calculate_market_timing_score IS 
'Calcula score de timing de mercado baseado em época do ano e crescimento do setor. Retorna JSONB com análise de timing.';

-- 5. Função principal: calcular Purchase Intent avançado
CREATE OR REPLACE FUNCTION calculate_enhanced_purchase_intent(
  p_tenant_id UUID,
  p_prospect_id UUID,
  p_icp_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_prospect_data JSONB;
  v_tenant_data JSONB;
  v_icp_data JSONB;
  v_products_tenant JSONB;
  v_products_prospect JSONB;
  v_customers_similar JSONB;
  v_competitive_data JSONB;
  v_market_data JSONB;
  v_prospect_cnpj TEXT;
  v_prospect_setor TEXT;
  v_prospect_porte TEXT;
  v_prospect_cnae TEXT;
  v_prospect_faturamento NUMERIC;
  v_prospect_funcionarios INTEGER;
BEGIN
  -- 1. Buscar dados do prospect
  SELECT 
    row_to_json(p.*)::JSONB,
    p.cnpj,
    p.setor,
    p.porte,
    p.cnae_principal,
    p.faturamento,
    p.funcionarios
  INTO 
    v_prospect_data,
    v_prospect_cnpj,
    v_prospect_setor,
    v_prospect_porte,
    v_prospect_cnae,
    v_prospect_faturamento,
    v_prospect_funcionarios
  FROM qualified_prospects p
  WHERE p.id = p_prospect_id
    AND p.tenant_id = p_tenant_id
  LIMIT 1;
  
  IF v_prospect_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Prospect não encontrado');
  END IF;
  
  -- 2. Buscar dados do tenant
  SELECT row_to_json(t.*)::JSONB
  INTO v_tenant_data
  FROM tenants t
  WHERE t.id = p_tenant_id
  LIMIT 1;
  
  -- 3. Buscar produtos do tenant (website + CNAE)
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'categoria', categoria,
      'descricao', descricao,
      'cnaes_alvo', cnaes_alvo,
      'setores_alvo', setores_alvo,
      'fonte', extraido_de
    )
  )
  INTO v_products_tenant
  FROM tenant_products
  WHERE tenant_id = p_tenant_id
    AND ativo = true;
  
  -- Adicionar produtos inferidos do CNAE do tenant (se houver)
  IF v_prospect_cnae IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'nome', (p->>'nome')::TEXT,
        'categoria', (p->>'categoria')::TEXT,
        'fonte', 'inferred_from_cnae'
      )
    )
    INTO v_products_tenant
    FROM jsonb_array_elements(infer_products_from_cnae(v_prospect_cnae)) p;
  END IF;
  
  -- 4. Buscar produtos do prospect (website + CNAE)
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'categoria', categoria,
      'descricao', descricao,
      'fonte', fonte
    )
  )
  INTO v_products_prospect
  FROM prospect_extracted_products
  WHERE qualified_prospect_id = p_prospect_id;
  
  -- Adicionar produtos inferidos do CNAE do prospect
  IF v_prospect_cnae IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'nome', (p->>'nome')::TEXT,
        'categoria', (p->>'categoria')::TEXT,
        'fonte', 'inferred_from_cnae'
      )
    )
    INTO v_products_prospect
    FROM jsonb_array_elements(infer_products_from_cnae(v_prospect_cnae)) p;
  END IF;
  
  -- 5. Buscar dados do ICP (se fornecido)
  IF p_icp_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'setores_alvo', target_sectors,
      'nichos_alvo', target_niches,
      'cnaes_alvo', target_cnaes,
      'porte_alvo', target_size,
      'faturamento_alvo', target_revenue,
      'funcionarios_alvo', target_employees,
      'localizacao_alvo', target_location
    )
    INTO v_icp_data
    FROM icp_profiles_metadata
    WHERE id = p_icp_id
      AND tenant_id = p_tenant_id
    LIMIT 1;
  END IF;
  
  -- 6. Buscar clientes similares
  v_customers_similar := calculate_similarity_to_customers(
    p_tenant_id,
    v_prospect_cnpj,
    v_prospect_setor,
    v_prospect_porte,
    v_prospect_cnae,
    v_prospect_faturamento,
    v_prospect_funcionarios
  );
  
  -- 7. Buscar análise competitiva
  v_competitive_data := detect_competitor_usage(
    p_tenant_id,
    v_prospect_cnpj,
    (v_prospect_data->>'website_encontrado')::TEXT
  );
  
  -- 8. Buscar análise de mercado
  v_market_data := calculate_market_timing_score(
    v_prospect_setor,
    EXTRACT(MONTH FROM NOW())::INTEGER
  );
  
  -- 9. Montar resultado completo
  v_result := jsonb_build_object(
    'prospect_data', v_prospect_data,
    'tenant_data', v_tenant_data,
    'icp_data', v_icp_data,
    'products_tenant', COALESCE(v_products_tenant, '[]'::JSONB),
    'products_prospect', COALESCE(v_products_prospect, '[]'::JSONB),
    'customers_similar', v_customers_similar,
    'competitive_data', v_competitive_data,
    'market_data', v_market_data,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION calculate_enhanced_purchase_intent IS 
'Calcula Purchase Intent avançado considerando produtos, ICP, clientes similares, análise competitiva e timing de mercado. Retorna JSONB com todos os dados para análise IA.';

-- Permissões
GRANT EXECUTE ON FUNCTION infer_products_from_cnae(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_similarity_to_customers(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_competitor_usage(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_market_timing_score(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_enhanced_purchase_intent(UUID, UUID, UUID) TO authenticated;

