-- Script para criar tabela icp_profiles_metadata se não existir
-- Execute este script no Supabase SQL Editor

-- Criar tabela pública para gerenciar múltiplos ICPs (metadados)
CREATE TABLE IF NOT EXISTS public.icp_profiles_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  schema_name TEXT NOT NULL,
  icp_profile_id UUID NOT NULL, -- ID do ICP no schema do tenant
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

-- Garantir apenas um ICP principal por tenant (usando índice único parcial)
CREATE UNIQUE INDEX IF NOT EXISTS unique_principal_per_tenant 
  ON public.icp_profiles_metadata(tenant_id) 
  WHERE icp_principal = true AND ativo = true;

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_tenant ON public.icp_profiles_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_tipo ON public.icp_profiles_metadata(tipo);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_ativo ON public.icp_profiles_metadata(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_principal ON public.icp_profiles_metadata(tenant_id) 
  WHERE icp_principal = true AND ativo = true;

-- RLS Policies
ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver ICPs do seu tenant
CREATE POLICY "Users can view ICPs from their tenant" ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem criar ICPs no seu tenant
CREATE POLICY "Users can create ICPs in their tenant" ON public.icp_profiles_metadata
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar ICPs do seu tenant
CREATE POLICY "Users can update ICPs from their tenant" ON public.icp_profiles_metadata
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem deletar ICPs do seu tenant
CREATE POLICY "Users can delete ICPs from their tenant" ON public.icp_profiles_metadata
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_icp_profiles_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_icp_profiles_metadata_updated_at ON public.icp_profiles_metadata;
CREATE TRIGGER trigger_update_icp_profiles_metadata_updated_at
  BEFORE UPDATE ON public.icp_profiles_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_icp_profiles_metadata_updated_at();

