-- ============================================================================
-- MIGRATION: Add CRM fields to tenants table
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Adiciona campos business_model e crm_config à tabela tenants
-- ============================================================================

-- Adicionar campos se não existirem
DO $$ 
BEGIN
  -- Adicionar business_model
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants' 
    AND column_name = 'business_model'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN business_model TEXT;
  END IF;

  -- Adicionar crm_config
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants' 
    AND column_name = 'crm_config'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN crm_config JSONB DEFAULT '{}'::JSONB;
  END IF;

  -- Adicionar created_by se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.tenants.business_model IS 'Modelo de negócio do tenant (eventos, comercio_exterior, software, logistica)';
COMMENT ON COLUMN public.tenants.crm_config IS 'Configuração específica do CRM para este tenant';


