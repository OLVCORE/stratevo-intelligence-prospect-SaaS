-- ==========================================
-- MIGRATION: Auto-criação de Deals na Aprovação
-- ==========================================
-- Objetivo: Garantir que deals sejam criados automaticamente quando leads são aprovados,
-- mesmo quando não há email/telefone (sem lead), vinculando diretamente à empresa
-- ==========================================

-- 1. Adicionar company_id à tabela deals (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.deals 
    ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    
    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id) WHERE company_id IS NOT NULL;
    
    COMMENT ON COLUMN public.deals.company_id IS 'Referência direta à empresa, permite criar deals mesmo sem lead';
  END IF;
END $$;

-- NOTA: A função approve_quarantine_to_crm foi atualizada na migration 20250206000004
-- Esta migration apenas adiciona a coluna company_id à tabela deals

