-- ============================================
-- Migration: Adicionar campos PhantomBuster à linkedin_connections
-- Data: 2026-01-06
-- Descrição: Adiciona campos para rastreamento de envio real via PhantomBuster
-- ============================================

-- Adicionar campos se não existirem
DO $$ 
BEGIN
  -- Adicionar phantom_container_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'linkedin_connections' 
    AND column_name = 'phantom_container_id'
  ) THEN
    ALTER TABLE public.linkedin_connections 
    ADD COLUMN phantom_container_id TEXT;
    
    COMMENT ON COLUMN public.linkedin_connections.phantom_container_id IS 'ID do container do PhantomBuster usado para enviar a conexão';
  END IF;

  -- Adicionar phantom_result
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'linkedin_connections' 
    AND column_name = 'phantom_result'
  ) THEN
    ALTER TABLE public.linkedin_connections 
    ADD COLUMN phantom_result JSONB;
    
    COMMENT ON COLUMN public.linkedin_connections.phantom_result IS 'Resultado completo retornado pelo PhantomBuster após envio';
  END IF;

  -- Adicionar status 'failed' ao CHECK constraint se não existir
  -- (PostgreSQL não permite ALTER CHECK diretamente, então precisamos recriar)
  -- Por enquanto, apenas documentamos - a constraint será atualizada na próxima migration completa
END $$;

-- Índice para phantom_container_id (para rastreamento)
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_phantom_container 
ON public.linkedin_connections(phantom_container_id) 
WHERE phantom_container_id IS NOT NULL;

