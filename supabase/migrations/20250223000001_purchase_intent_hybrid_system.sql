-- ==========================================
-- MIGRATION: Sistema Híbrido Purchase Intent (Potencial vs Real)
-- ==========================================
-- Objetivo: Distinguir entre Purchase Intent "Potencial" (sinais de mercado) 
-- e "Real" (sinais comportamentais após engajamento)
-- ==========================================

-- 1. Adicionar coluna purchase_intent_type nas tabelas relevantes
DO $$
BEGIN
  -- qualified_prospects
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'qualified_prospects' 
      AND column_name = 'purchase_intent_type'
  ) THEN
    ALTER TABLE public.qualified_prospects 
    ADD COLUMN purchase_intent_type TEXT DEFAULT 'potencial' CHECK (purchase_intent_type IN ('potencial', 'real'));
    
    COMMENT ON COLUMN public.qualified_prospects.purchase_intent_type IS 
    'Tipo de Purchase Intent: "potencial" (sinais de mercado) ou "real" (sinais comportamentais após engajamento)';
  END IF;

  -- icp_analysis_results
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'icp_analysis_results' 
        AND column_name = 'purchase_intent_type'
    ) THEN
      ALTER TABLE public.icp_analysis_results 
      ADD COLUMN purchase_intent_type TEXT DEFAULT 'potencial' CHECK (purchase_intent_type IN ('potencial', 'real'));
      
      COMMENT ON COLUMN public.icp_analysis_results.purchase_intent_type IS 
      'Tipo de Purchase Intent: "potencial" (sinais de mercado) ou "real" (sinais comportamentais após engajamento)';
    END IF;
  END IF;

  -- companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'companies' 
      AND column_name = 'purchase_intent_type'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN purchase_intent_type TEXT DEFAULT 'potencial' CHECK (purchase_intent_type IN ('potencial', 'real'));
    
    COMMENT ON COLUMN public.companies.purchase_intent_type IS 
    'Tipo de Purchase Intent: "potencial" (sinais de mercado) ou "real" (sinais comportamentais após engajamento)';
  END IF;
END
$$;

-- 2. Adicionar coluna signal_category na tabela purchase_intent_signals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'purchase_intent_signals' 
      AND column_name = 'signal_category'
  ) THEN
    ALTER TABLE public.purchase_intent_signals 
    ADD COLUMN signal_category TEXT DEFAULT 'potencial' CHECK (signal_category IN ('potencial', 'real'));
    
    COMMENT ON COLUMN public.purchase_intent_signals.signal_category IS 
    'Categoria do sinal: "potencial" (expansão, funding, notícias) ou "real" (visitas, downloads, emails, demos)';
  END IF;
END
$$;

-- 3. Atualizar função calculate_purchase_intent_score para suportar tipo
CREATE OR REPLACE FUNCTION calculate_purchase_intent_score(
  p_tenant_id UUID DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_intent_type TEXT DEFAULT NULL -- 'potencial', 'real', ou NULL (ambos)
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_score numeric := 0;
  v_expansion_score INTEGER := 0;
  v_pain_score INTEGER := 0;
  v_budget_score INTEGER := 0;
  v_timing_score INTEGER := 0;
  v_competitor_score INTEGER := 0;
  v_behavioral_score INTEGER := 0; -- ✅ NOVO: Sinais comportamentais
  v_signal_count INTEGER := 0;
  v_recent_signals INTEGER := 0;
BEGIN
  -- Buscar sinais recentes (últimos 90 dias) filtrados por tipo
  SELECT 
    COUNT(*) AS total_signals,
    COUNT(*) FILTER (WHERE detected_at > now() - INTERVAL '30 days') AS recent_signals
  INTO v_signal_count, v_recent_signals
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND (p_intent_type IS NULL OR signal_category = p_intent_type)
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  -- Se não há sinais, retornar 0
  IF v_signal_count = 0 THEN
    RETURN 0;
  END IF;

  -- ✅ SINAIS POTENCIAIS (de mercado) - sempre calculados
  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_expansion_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'expansion'
    AND signal_category = 'potencial'
    AND detected_at > now() - INTERVAL '90 days'
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_pain_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'pain'
    AND signal_category = 'potencial'
    AND detected_at > now() - INTERVAL '90 days'
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_budget_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'budget'
    AND signal_category = 'potencial'
    AND detected_at > now() - INTERVAL '90 days'
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_timing_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'timing'
    AND signal_category = 'potencial'
    AND detected_at > now() - INTERVAL '30 days'
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_competitor_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'competitor'
    AND signal_category = 'potencial'
    AND detected_at > now() - INTERVAL '90 days'
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  -- ✅ SINAIS REAIS (comportamentais) - apenas se p_intent_type = 'real' ou NULL
  IF p_intent_type IS NULL OR p_intent_type = 'real' THEN
    SELECT COALESCE(SUM(signal_strength), 0)
    INTO v_behavioral_score
    FROM public.purchase_intent_signals
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND signal_category = 'real'
      AND detected_at > now() - INTERVAL '30 days' -- Sinais comportamentais são mais recentes
      AND (
        (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
        OR (p_company_id IS NOT NULL AND company_id = p_company_id)
      );
  END IF;

  -- Score final com pesos diferentes para Potencial vs Real
  IF p_intent_type = 'real' THEN
    -- ✅ Score REAL: foco em sinais comportamentais (peso maior)
    v_score := LEAST(
      100,
      (v_behavioral_score * 0.60) -- 60% peso em comportamento
      + (v_expansion_score * 0.15)
      + (v_pain_score * 0.10)
      + (v_budget_score * 0.10)
      + (v_timing_score * 0.05)
      + LEAST(v_recent_signals * 3, 15)
    );
  ELSE
    -- ✅ Score POTENCIAL: foco em sinais de mercado
    v_score := LEAST(
      100,
      (v_expansion_score * 0.30)
      + (v_pain_score * 0.25)
      + (v_budget_score * 0.20)
      + (v_timing_score * 0.15)
      + (v_competitor_score * 0.10)
      + LEAST(v_recent_signals * 5, 20)
    );
  END IF;

  RETURN ROUND(v_score)::INTEGER;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION calculate_purchase_intent_score(UUID, TEXT, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION calculate_purchase_intent_score IS 
'Calcula score de intenção de compra (0-100). 
- p_intent_type = NULL: calcula ambos (potencial + real)
- p_intent_type = "potencial": apenas sinais de mercado (expansão, funding, notícias)
- p_intent_type = "real": apenas sinais comportamentais (visitas, downloads, emails, demos)';

-- 4. Função para marcar Purchase Intent como "Real" após primeiro engajamento
CREATE OR REPLACE FUNCTION mark_purchase_intent_as_real(
  p_tenant_id UUID,
  p_cnpj TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  -- Atualizar qualified_prospects
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'qualified_prospects'
  ) THEN
    UPDATE public.qualified_prospects
    SET purchase_intent_type = 'real',
        purchase_intent_score = calculate_purchase_intent_score(
          p_tenant_id,
          cnpj,
          NULL,
          'real'
        )
    WHERE tenant_id = p_tenant_id
      AND (p_cnpj IS NULL OR cnpj = p_cnpj)
      AND (p_company_id IS NULL OR id = p_company_id)
      AND purchase_intent_type = 'potencial';
  END IF;

  -- Atualizar icp_analysis_results
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results'
  ) THEN
    UPDATE public.icp_analysis_results
    SET purchase_intent_type = 'real',
        purchase_intent_score = calculate_purchase_intent_score(
          NULL::UUID,
          cnpj,
          NULL,
          'real'
        )
    WHERE (p_cnpj IS NULL OR cnpj = p_cnpj)
      AND purchase_intent_type = 'potencial';
  END IF;

  -- Atualizar companies
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'companies'
  ) THEN
    UPDATE public.companies
    SET purchase_intent_type = 'real',
        purchase_intent_score = calculate_purchase_intent_score(
          p_tenant_id,
          cnpj,
          id,
          'real'
        )
    WHERE tenant_id = p_tenant_id
      AND (p_cnpj IS NULL OR cnpj = p_cnpj)
      AND (p_company_id IS NULL OR id = p_company_id)
      AND purchase_intent_type = 'potencial';
  END IF;
END;
$func$;

GRANT EXECUTE ON FUNCTION mark_purchase_intent_as_real(UUID, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION mark_purchase_intent_as_real IS 
'Marca Purchase Intent como "Real" após primeiro engajamento (visita, download, email, demo) e recalcula score baseado em sinais comportamentais';

-- 5. Trigger para marcar como "Real" quando há engajamento (exemplo: visita ao site)
-- NOTA: Este trigger será ativado quando detectarmos sinais comportamentais
-- Por enquanto, deixamos como função manual que pode ser chamada após engajamento

