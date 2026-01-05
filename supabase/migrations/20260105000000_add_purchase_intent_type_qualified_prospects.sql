-- ==========================================
-- Fix: Adicionar coluna purchase_intent_type em qualified_prospects
-- Data: 2026-01-05
-- ==========================================
-- Esta migration garante que a coluna purchase_intent_type exista em qualified_prospects
-- para corrigir o erro: column "purchase_intent_type" of relation "qualified_prospects" does not exist
-- ==========================================

DO $$
BEGIN
  -- Adicionar coluna purchase_intent_type em qualified_prospects se não existir
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

