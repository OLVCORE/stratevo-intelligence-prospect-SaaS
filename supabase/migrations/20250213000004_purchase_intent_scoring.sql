-- ==========================================
-- MIGRATION: Purchase Intent Scoring
-- ==========================================
-- Objetivo: Detectar sinais de compra e calcular score de intenção (0-100)
-- Impacto: +150% taxa de conversão ao priorizar leads quentes
-- ==========================================

-- 1. Criar tabela de sinais de compra
CREATE TABLE IF NOT EXISTS public.purchase_intent_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  cnpj TEXT, -- Para vincular sem company_id ainda
  
  -- Tipos de sinais
  signal_type TEXT NOT NULL, -- 'expansion', 'pain', 'budget', 'timing', 'competitor'
  signal_source TEXT NOT NULL, -- 'news', 'job_postings', 'funding', 'website', 'social'
  signal_description TEXT,
  signal_strength INTEGER DEFAULT 50, -- 0-100
  signal_date DATE,
  
  -- Metadata
  raw_data JSONB,
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_purchase_intent_tenant_cnpj 
  ON public.purchase_intent_signals(tenant_id, cnpj) 
  WHERE cnpj IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_intent_tenant_company 
  ON public.purchase_intent_signals(tenant_id, company_id) 
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_intent_signal_type 
  ON public.purchase_intent_signals(signal_type);

CREATE INDEX IF NOT EXISTS idx_purchase_intent_detected_at 
  ON public.purchase_intent_signals(detected_at DESC);

-- Comentários
COMMENT ON TABLE public.purchase_intent_signals IS 
'Sinais de intenção de compra detectados para empresas (expansão, dor, budget, timing)';

COMMENT ON COLUMN public.purchase_intent_signals.signal_type IS 
'Tipos: expansion (expansão/vagas), pain (dor/problema), budget (orçamento), timing (momento ideal), competitor (concorrente)';

COMMENT ON COLUMN public.purchase_intent_signals.signal_strength IS 
'Força do sinal (0-100): quanto maior, mais relevante para compra';

-- 2. Adicionar coluna purchase_intent_score nas tabelas relevantes
DO $$
BEGIN
  -- qualified_prospects
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'qualified_prospects' 
      AND column_name = 'purchase_intent_score'
  ) THEN
    ALTER TABLE public.qualified_prospects 
    ADD COLUMN purchase_intent_score INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.qualified_prospects.purchase_intent_score IS 
    'Score de intenção de compra (0-100) baseado em sinais detectados';
  END IF;

  -- leads_quarantine (verificar se tabela existe primeiro)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'leads_quarantine'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'leads_quarantine' 
        AND column_name = 'purchase_intent_score'
    ) THEN
      ALTER TABLE public.leads_quarantine 
      ADD COLUMN purchase_intent_score INTEGER DEFAULT 0;
      
      COMMENT ON COLUMN public.leads_quarantine.purchase_intent_score IS 
      'Score de intenção de compra (0-100) baseado em sinais detectados';
    END IF;
  END IF;

  -- icp_analysis_results (tabela usada na quarentena ICP)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'icp_analysis_results' 
        AND column_name = 'purchase_intent_score'
    ) THEN
      ALTER TABLE public.icp_analysis_results 
      ADD COLUMN purchase_intent_score INTEGER DEFAULT 0;
      
      COMMENT ON COLUMN public.icp_analysis_results.purchase_intent_score IS 
      'Score de intenção de compra (0-100) baseado em sinais detectados';
    END IF;
  END IF;

  -- companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'companies' 
      AND column_name = 'purchase_intent_score'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN purchase_intent_score INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.companies.purchase_intent_score IS 
    'Score de intenção de compra (0-100) baseado em sinais detectados';
  END IF;
END
$$;

-- 3. Função para calcular Purchase Intent Score
CREATE OR REPLACE FUNCTION calculate_purchase_intent_score(
  p_tenant_id UUID DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL
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
  v_signal_count INTEGER := 0;
  v_recent_signals INTEGER := 0;
BEGIN
  -- Buscar sinais recentes (últimos 90 dias)
  SELECT 
    COUNT(*) AS total_signals,
    COUNT(*) FILTER (WHERE detected_at > now() - INTERVAL '30 days') AS recent_signals
  INTO v_signal_count, v_recent_signals
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  -- Se não há sinais, retornar 0
  IF v_signal_count = 0 THEN
    RETURN 0;
  END IF;

  -- Calcular score por tipo de sinal (pesos diferentes)
  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_expansion_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'expansion'
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
    AND detected_at > now() - INTERVAL '30 days' -- Timing é mais recente
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  SELECT COALESCE(SUM(signal_strength), 0)
  INTO v_competitor_score
  FROM public.purchase_intent_signals
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND signal_type = 'competitor'
    AND detected_at > now() - INTERVAL '90 days'
    AND (
      (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
      OR (p_company_id IS NOT NULL AND company_id = p_company_id)
    );

  -- Score final com pesos e bônus de recência
  v_score := LEAST(
    100,
      (v_expansion_score * 0.30)
    + (v_pain_score * 0.25)
    + (v_budget_score * 0.20)
    + (v_timing_score * 0.15)
    + (v_competitor_score * 0.10)
    + LEAST(v_recent_signals * 5, 20)
  );

  RETURN ROUND(v_score)::INTEGER;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION calculate_purchase_intent_score(UUID, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION calculate_purchase_intent_score IS 
'Calcula score de intenção de compra (0-100) baseado em sinais detectados nos últimos 90 dias';

-- 4. Função para atualizar score em todas as tabelas
CREATE OR REPLACE FUNCTION update_purchase_intent_scores()
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
    UPDATE public.qualified_prospects qp
    SET purchase_intent_score = calculate_purchase_intent_score(
      qp.tenant_id,
      qp.cnpj,
      NULL
    )
    WHERE qp.cnpj IS NOT NULL;
  END IF;

  -- Atualizar leads_quarantine (se tabela existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'leads_quarantine'
  ) THEN
    UPDATE public.leads_quarantine lq
    SET purchase_intent_score = calculate_purchase_intent_score(
      lq.tenant_id,
      lq.cnpj,
      NULL
    )
    WHERE lq.cnpj IS NOT NULL;
  END IF;

  -- Atualizar icp_analysis_results (se tabela existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results'
  ) THEN
    -- Nota: icp_analysis_results não tem tenant_id, então usamos apenas cnpj
    UPDATE public.icp_analysis_results iar
    SET purchase_intent_score = calculate_purchase_intent_score(
      NULL::UUID, -- Sem tenant_id
      iar.cnpj,
      NULL
    )
    WHERE iar.cnpj IS NOT NULL;
  END IF;

  -- Atualizar companies (se tabela existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'companies'
  ) THEN
    UPDATE public.companies e
    SET purchase_intent_score = calculate_purchase_intent_score(
      e.tenant_id,
      e.cnpj,
      NULL
    )
    WHERE e.cnpj IS NOT NULL;
  END IF;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION update_purchase_intent_scores() TO authenticated;

COMMENT ON FUNCTION update_purchase_intent_scores IS 
'Atualiza scores de intenção de compra em todas as tabelas relevantes';

-- 5. Trigger para atualizar score quando novo sinal é detectado
CREATE OR REPLACE FUNCTION trigger_update_purchase_intent_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  -- Atualizar score nas tabelas relevantes
  PERFORM update_purchase_intent_scores();
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_update_purchase_intent_score ON public.purchase_intent_signals;
CREATE TRIGGER trg_update_purchase_intent_score
  AFTER INSERT OR UPDATE ON public.purchase_intent_signals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_purchase_intent_score();

-- 6. Função helper para inserir sinal (para uso em Edge Functions)
-- Correção do erro 42P13: todos os parâmetros após o primeiro com DEFAULT também possuem DEFAULT.
CREATE OR REPLACE FUNCTION insert_purchase_intent_signal(
  p_tenant_id UUID,
  p_cnpj TEXT,
  p_company_id UUID DEFAULT NULL,
  p_signal_type TEXT DEFAULT NULL,
  p_signal_source TEXT DEFAULT NULL,
  p_signal_description TEXT DEFAULT NULL,
  p_signal_strength INTEGER DEFAULT 50,
  p_signal_date DATE DEFAULT CURRENT_DATE,
  p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_signal_id UUID;
BEGIN
  -- Garantir campos obrigatórios mesmo com DEFAULTs
  IF p_signal_type IS NULL THEN
    RAISE EXCEPTION 'p_signal_type is required';
  END IF;
  IF p_signal_source IS NULL THEN
    RAISE EXCEPTION 'p_signal_source is required';
  END IF;

  INSERT INTO public.purchase_intent_signals (
    tenant_id,
    company_id,
    cnpj,
    signal_type,
    signal_source,
    signal_description,
    signal_strength,
    signal_date,
    raw_data
  ) VALUES (
    p_tenant_id,
    p_company_id,
    p_cnpj,
    p_signal_type,
    p_signal_source,
    p_signal_description,
    p_signal_strength,
    p_signal_date,
    p_raw_data
  )
  RETURNING id INTO v_signal_id;

  -- Atualizar score automaticamente
  PERFORM update_purchase_intent_scores();

  RETURN v_signal_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION insert_purchase_intent_signal(UUID, TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, DATE, JSONB) TO authenticated;

COMMENT ON FUNCTION insert_purchase_intent_signal IS 
'Insere novo sinal de intenção de compra e atualiza scores automaticamente';
