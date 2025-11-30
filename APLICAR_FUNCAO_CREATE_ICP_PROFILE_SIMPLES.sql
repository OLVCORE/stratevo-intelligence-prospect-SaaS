-- ==========================================
-- APLICAR FUNÇÃO CREATE_ICP_PROFILE (Versão Simplificada)
-- ==========================================
-- Execute este script no Supabase SQL Editor
-- Esta versão cria a tabela de forma mais direta

-- PASSO 1: Criar tabela icp_generation_counters primeiro (sem foreign key inicialmente)
CREATE TABLE IF NOT EXISTS public.icp_generation_counters (
  tenant_id UUID PRIMARY KEY,
  generated_count INTEGER NOT NULL DEFAULT 0,
  last_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar foreign key depois (se tenants existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    BEGIN
      ALTER TABLE public.icp_generation_counters 
      DROP CONSTRAINT IF EXISTS icp_generation_counters_tenant_id_fkey;
      
      ALTER TABLE public.icp_generation_counters 
      ADD CONSTRAINT icp_generation_counters_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível adicionar foreign key: %', SQLERRM;
    END;
  END IF;
END;
$$;

ALTER TABLE public.icp_generation_counters ENABLE ROW LEVEL SECURITY;

-- PASSO 2: Criar/Atualizar função increment_icp_generation_counter
CREATE OR REPLACE FUNCTION public.increment_icp_generation_counter(
  p_tenant_id UUID,
  p_increment INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_counter INTEGER;
BEGIN
  -- Verificar se a tabela existe antes de inserir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_generation_counters') THEN
    INSERT INTO public.icp_generation_counters (tenant_id, generated_count, last_generation)
    VALUES (p_tenant_id, p_increment, NOW())
    ON CONFLICT (tenant_id) DO UPDATE
    SET generated_count = public.icp_generation_counters.generated_count + p_increment,
        last_generation = NOW()
    RETURNING generated_count INTO v_counter;

    RETURN v_counter;
  ELSE
    RAISE EXCEPTION 'Tabela icp_generation_counters não existe';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 3: Criar tabela icp_profiles_metadata (se não existir)
CREATE TABLE IF NOT EXISTS public.icp_profiles_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  schema_name TEXT NOT NULL,
  icp_profile_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('core', 'mercado')),
  setor_foco TEXT,
  nicho_foco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  icp_principal BOOLEAN NOT NULL DEFAULT false,
  prioridade INTEGER DEFAULT 1,
  generated_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar foreign key para tenants (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    BEGIN
      ALTER TABLE public.icp_profiles_metadata 
      DROP CONSTRAINT IF EXISTS icp_profiles_metadata_tenant_id_fkey;
      
      ALTER TABLE public.icp_profiles_metadata 
      ADD CONSTRAINT icp_profiles_metadata_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;

-- Criar índice único
DROP INDEX IF EXISTS public.unique_principal_per_tenant;
CREATE UNIQUE INDEX IF NOT EXISTS unique_principal_per_tenant 
ON public.icp_profiles_metadata(tenant_id) 
WHERE icp_principal = true AND ativo = true;

ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar função create_icp_profile (continua no próximo script ou parte do script original)
-- [O resto da função create_icp_profile deve ser copiado do script original a partir da linha 60]

