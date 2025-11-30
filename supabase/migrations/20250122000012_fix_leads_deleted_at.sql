-- ============================================================================
-- MIGRATION: Fix leads.deleted_at column
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Garante que a coluna deleted_at existe na tabela leads
-- ============================================================================

-- Adicionar coluna deleted_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';






