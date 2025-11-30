-- ============================================================================
-- SCRIPT CONSOLIDADO: Executar Todas as Migrations do CRM
-- ============================================================================
-- Execute este script COMPLETO no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: CRM Multi-Tenant Base Infrastructure
-- ============================================================================

-- ============================================
-- TABELA: TENANT_USERS (Relação Usuários <-> Tenants)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Papéis específicos do tenant
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, manager, sales, sdr, viewer
  
  -- Permissões
  permissions JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, invited, suspended
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON public.tenant_users(tenant_id, status);

-- RLS para tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can view their tenant memberships"
  ON public.tenant_users FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view members of their tenant" ON public.tenant_users;
CREATE POLICY "Users can view members of their tenant"
  ON public.tenant_users FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- FUNÇÃO: GET CURRENT TENANT ID
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Busca o tenant_id do usuário atual
  SELECT tenant_id INTO tenant_uuid
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
  
  RETURN tenant_uuid;
END;
$$;

-- ============================================
-- FUNÇÃO: HAS TENANT ROLE
-- ============================================
CREATE OR REPLACE FUNCTION public.has_tenant_role(
  _tenant_id UUID,
  _role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id = _tenant_id
      AND user_id = auth.uid()
      AND role = _role
      AND status = 'active'
  );
END;
$$;

-- ============================================
-- TRIGGER: UPDATE UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON public.tenant_users;
CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 2: CRM Multi-Tenant Tables (LEADS, DEALS, ACTIVITIES, PROPOSALS, etc)
-- ============================================================================
-- [CONTINUA COM O CONTEÚDO DO ARQUIVO 20250122000001_crm_multi_tenant_tables.sql]
-- NOTA: Por limitação de tamanho, execute os arquivos individuais na ordem


