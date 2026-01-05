-- ==========================================
-- CORREÇÃO: Criar tabelas/funções faltantes (erros 404)
-- ==========================================
-- Data: 2026-01-05
-- Descrição: Cria tabelas e funções que estão retornando 404
-- ==========================================

BEGIN;

-- ==========================================
-- 1. CRIAR TABELA intent_signals (se não existir)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.intent_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_source TEXT NOT NULL,
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  signal_url TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_intent_signals_company_id ON public.intent_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_detected_at ON public.intent_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_confidence ON public.intent_signals(confidence_score DESC);

-- RLS
ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view intent signals for their companies" ON public.intent_signals;
CREATE POLICY "Users can view intent signals for their companies"
ON public.intent_signals
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert intent signals" ON public.intent_signals;
CREATE POLICY "Users can insert intent signals"
ON public.intent_signals
FOR INSERT
WITH CHECK (true);

-- ==========================================
-- 2. CRIAR TABELA intent_signals_detection (se não existir)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.intent_signals_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  region TEXT,
  sector TEXT,
  niche TEXT,
  score INTEGER NOT NULL,
  temperature TEXT,
  confidence TEXT,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  methodology JSONB,
  sources_checked INTEGER NOT NULL DEFAULT 4,
  platforms_scanned TEXT[],
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_intent_detection_company ON public.intent_signals_detection(company_id, checked_at DESC);

-- RLS
ALTER TABLE public.intent_signals_detection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_intent_detection_auth" ON public.intent_signals_detection;
CREATE POLICY "read_intent_detection_auth"
ON public.intent_signals_detection FOR SELECT
USING (true);

DROP POLICY IF EXISTS "insert_intent_detection_service" ON public.intent_signals_detection;
CREATE POLICY "insert_intent_detection_service"
ON public.intent_signals_detection FOR INSERT
WITH CHECK (true);

-- ==========================================
-- 3. CRIAR FUNÇÃO calculate_intent_score (se não existir)
-- ==========================================
CREATE OR REPLACE FUNCTION public.calculate_intent_score(company_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_score INTEGER := 0;
  signal_count INTEGER := 0;
BEGIN
  -- Calcular média ponderada de sinais recentes (últimos 90 dias)
  SELECT 
    COALESCE(SUM(confidence_score), 0),
    COUNT(*)
  INTO total_score, signal_count
  FROM public.intent_signals
  WHERE company_id = company_uuid
    AND detected_at > now() - interval '90 days'
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Retornar média (max 100)
  IF signal_count > 0 THEN
    RETURN LEAST(ROUND(total_score::numeric / signal_count), 100);
  ELSE
    RETURN 0;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_intent_score(UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.calculate_intent_score IS 
'Calcula score de intenção de compra (0-100) baseado em sinais de intent_signals';

COMMIT;

-- ==========================================
-- ✅ CONCLUSÃO
-- ==========================================
-- Tabelas e funções criadas:
-- - intent_signals (tabela)
-- - intent_signals_detection (tabela)
-- - calculate_intent_score (função)
-- 
-- Isso deve resolver os erros 404 relacionados a essas tabelas/funções.
-- ==========================================

