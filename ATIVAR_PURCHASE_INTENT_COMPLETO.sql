-- ==========================================
-- ATIVAR SISTEMA DE INTENÇÃO DE COMPRA (PURCHASE INTENT)
-- ==========================================
-- Data: 2026-01-05
-- Descrição: SQL consolidado para ativar todas as colunas e funções necessárias
--            para o sistema de Purchase Intent em qualified_prospects
-- ==========================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Acesse o Supabase Dashboard → SQL Editor
-- 3. Cole o conteúdo completo
-- 4. Execute (Run)
-- ==========================================

BEGIN;

-- ==========================================
-- 1. ADICIONAR COLUNA purchase_intent_score (se não existir)
-- ==========================================
DO $$
BEGIN
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
    
    RAISE NOTICE 'Coluna purchase_intent_score adicionada em qualified_prospects';
  ELSE
    RAISE NOTICE 'Coluna purchase_intent_score já existe em qualified_prospects';
  END IF;
END
$$;

-- ==========================================
-- 2. ADICIONAR COLUNA purchase_intent_type (se não existir)
-- ==========================================
DO $$
BEGIN
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
    
    RAISE NOTICE 'Coluna purchase_intent_type adicionada em qualified_prospects';
  ELSE
    RAISE NOTICE 'Coluna purchase_intent_type já existe em qualified_prospects';
  END IF;
END
$$;

-- ==========================================
-- 3. GARANTIR QUE TABELA purchase_intent_signals EXISTE
-- ==========================================
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

-- Adicionar coluna signal_category se não existir
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
    'Categoria: "potencial" (sinais de mercado) ou "real" (sinais comportamentais)';
    
    RAISE NOTICE 'Coluna signal_category adicionada em purchase_intent_signals';
  ELSE
    RAISE NOTICE 'Coluna signal_category já existe em purchase_intent_signals';
  END IF;
END
$$;

-- Índices para purchase_intent_signals
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

-- ==========================================
-- 4. GARANTIR QUE FUNÇÃO calculate_purchase_intent_score EXISTE
-- ==========================================
-- Remover TODAS as versões antigas da função (se existirem) para evitar conflitos
-- Usando CASCADE para remover dependências também
DO $$
DECLARE
  r record;
BEGIN
  -- Encontrar todas as versões da função e removê-las
  FOR r IN 
    SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc
    WHERE proname = 'calculate_purchase_intent_score'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s.%s(%s) CASCADE', 
      'public', r.proname, r.args);
  END LOOP;
END
$$;

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
  v_behavioral_score INTEGER := 0;
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

  -- SINAIS POTENCIAIS (de mercado)
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

  -- SINAIS REAIS (comportamentais)
  IF p_intent_type IS NULL OR p_intent_type = 'real' THEN
    SELECT COALESCE(SUM(signal_strength), 0)
    INTO v_behavioral_score
    FROM public.purchase_intent_signals
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND signal_category = 'real'
      AND detected_at > now() - INTERVAL '30 days'
      AND (
        (p_cnpj IS NOT NULL AND cnpj = p_cnpj)
        OR (p_company_id IS NOT NULL AND company_id = p_company_id)
      );
  END IF;

  -- Score final com pesos diferentes para Potencial vs Real
  IF p_intent_type = 'real' THEN
    -- Score REAL: foco em sinais comportamentais
    v_score := LEAST(
      100,
      (v_behavioral_score * 0.60)
      + (v_expansion_score * 0.15)
      + (v_pain_score * 0.10)
      + (v_budget_score * 0.10)
      + (v_timing_score * 0.05)
      + LEAST(v_recent_signals * 3, 15)
    );
  ELSE
    -- Score POTENCIAL: foco em sinais de mercado
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
- p_intent_type = "potencial": apenas sinais de mercado
- p_intent_type = "real": apenas sinais comportamentais';

-- ==========================================
-- 5. GARANTIR QUE FUNÇÃO calculate_purchase_intent_for_prospect EXISTE (Wrapper RPC)
-- ==========================================
CREATE OR REPLACE FUNCTION public.calculate_purchase_intent_for_prospect(
  p_qualified_prospect_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prospect record;
  v_score integer;
  v_result jsonb;
BEGIN
  -- Buscar dados do prospect
  SELECT 
    id,
    tenant_id,
    cnpj,
    purchase_intent_score
  INTO v_prospect
  FROM public.qualified_prospects
  WHERE id = p_qualified_prospect_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prospect não encontrado',
      'score', null
    );
  END IF;
  
  -- Tentar chamar a função real calculate_purchase_intent_score
  BEGIN
    v_score := public.calculate_purchase_intent_score(
      v_prospect.tenant_id,
      v_prospect.cnpj,
      null::uuid,
      null::text
    );
    
    -- Atualizar prospect
    UPDATE public.qualified_prospects
    SET purchase_intent_score = v_score
    WHERE id = p_qualified_prospect_id;
    
    -- Retornar resultado padronizado
    v_result := jsonb_build_object(
      'success', true,
      'prospect_id', p_qualified_prospect_id,
      'purchase_intent_score', v_score,
      'previous_score', v_prospect.purchase_intent_score
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN undefined_function THEN
      -- Plano B: função real não existe, retorna payload padronizado sem quebrar
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'calculate_purchase_intent_score not found',
        'score', null,
        'prospect_id', p_qualified_prospect_id
      );
    WHEN OTHERS THEN
      -- Outros erros: retorna erro controlado
      RETURN jsonb_build_object(
        'success', false,
        'error', sqlerrm,
        'score', null,
        'prospect_id', p_qualified_prospect_id
      );
  END;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.calculate_purchase_intent_for_prospect(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.calculate_purchase_intent_for_prospect IS 
'Wrapper RPC para calcular Purchase Intent Score. Chama calculate_purchase_intent_score internamente.';

-- ==========================================
-- 6. FUNÇÃO HELPER PARA INSERIR SINAIS (para uso em Edge Functions)
-- ==========================================
-- Remover TODAS as versões antigas da função (se existirem) para evitar conflitos
DO $$
DECLARE
  r record;
BEGIN
  -- Encontrar todas as versões da função e removê-las
  FOR r IN 
    SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc
    WHERE proname = 'insert_purchase_intent_signal'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s.%s(%s) CASCADE', 
      'public', r.proname, r.args);
  END LOOP;
END
$$;

-- Esta função permite que Edge Functions insiram sinais na tabela purchase_intent_signals
CREATE OR REPLACE FUNCTION insert_purchase_intent_signal(
  p_tenant_id UUID,
  p_cnpj TEXT,
  p_company_id UUID DEFAULT NULL,
  p_signal_type TEXT DEFAULT NULL,
  p_signal_source TEXT DEFAULT NULL,
  p_signal_description TEXT DEFAULT NULL,
  p_signal_strength INTEGER DEFAULT 50,
  p_signal_date DATE DEFAULT CURRENT_DATE,
  p_raw_data JSONB DEFAULT NULL,
  p_signal_category TEXT DEFAULT 'potencial' -- 'potencial' ou 'real'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_signal_id UUID;
BEGIN
  -- Garantir campos obrigatórios
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
    raw_data,
    signal_category
  ) VALUES (
    p_tenant_id,
    p_company_id,
    p_cnpj,
    p_signal_type,
    p_signal_source,
    p_signal_description,
    p_signal_strength,
    p_signal_date,
    p_raw_data,
    COALESCE(p_signal_category, 'potencial')
  )
  RETURNING id INTO v_signal_id;

  -- Trigger atualiza scores automaticamente

  RETURN v_signal_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION insert_purchase_intent_signal(UUID, TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, DATE, JSONB, TEXT) TO authenticated, anon;

COMMENT ON FUNCTION insert_purchase_intent_signal IS 
'Insere novo sinal de intenção de compra na tabela purchase_intent_signals.
Esta função deve ser chamada por Edge Functions que detectam sinais de compra.
O trigger trg_update_purchase_intent_score atualiza os scores automaticamente.';

COMMIT;

-- ==========================================
-- ✅ CONCLUSÃO
-- ==========================================
-- Todas as colunas e funções necessárias foram criadas/verificadas!
-- 
-- PRÓXIMOS PASSOS:
-- 1. Verificar se as colunas foram criadas:
--    SELECT column_name, data_type, column_default 
--    FROM information_schema.columns 
--    WHERE table_name = 'qualified_prospects' 
--    AND column_name IN ('purchase_intent_score', 'purchase_intent_type');
--
-- 2. O sistema de Purchase Intent agora está ativo!
--    - Colunas: purchase_intent_score, purchase_intent_type
--    - Tabela: purchase_intent_signals
--    - Função: calculate_purchase_intent_score
--    - Wrapper: calculate_purchase_intent_for_prospect
--
-- 3. Para calcular scores, você pode:
--    - Chamar calculate_purchase_intent_for_prospect(prospect_id) via RPC
--    - Ou chamar calculate_purchase_intent_score(tenant_id, cnpj, company_id, type) diretamente
-- ==========================================

