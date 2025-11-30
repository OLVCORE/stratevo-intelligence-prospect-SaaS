-- ============================================================================
-- SISTEMA COMPLETO: Gerenciamento de Usuários e Múltiplos Tenants
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- PARTE 1: Garantir que tabela users permite múltiplos tenants por usuário
-- (Um usuário pode ter múltiplos registros em users, um para cada tenant)

-- Remover constraint UNIQUE de email se existir (para permitir mesmo email em múltiplos tenants)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- Criar índice único composto (email + tenant_id) em vez de apenas email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_tenant_unique 
ON public.users(email, tenant_id);

-- PARTE 2: Criar tabela de convites (se não existir)
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant can view invitations" ON public.user_invitations;
CREATE POLICY "Tenant can view invitations"
  ON public.user_invitations FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant admins can create invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can create invitations"
  ON public.user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (SELECT role FROM public.users WHERE auth_user_id = auth.uid() AND tenant_id = user_invitations.tenant_id LIMIT 1) IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "Tenant admins can update invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can update invitations"
  ON public.user_invitations FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (SELECT role FROM public.users WHERE auth_user_id = auth.uid() AND tenant_id = user_invitations.tenant_id LIMIT 1) IN ('OWNER', 'ADMIN')
  );

GRANT ALL ON TABLE public.user_invitations TO authenticated;

-- PARTE 3: Função para verificar limite de usuários por plano
CREATE OR REPLACE FUNCTION public.check_user_limit(p_tenant_id UUID)
RETURNS TABLE (
  can_add BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  plan_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano VARCHAR(50);
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  -- Obter plano do tenant
  SELECT plano INTO v_plano FROM public.tenants WHERE id = p_tenant_id;
  
  -- Definir limite baseado no plano
  v_limit := CASE
    WHEN v_plano = 'FREE' THEN 1
    WHEN v_plano = 'STARTER' THEN 2
    WHEN v_plano = 'GROWTH' THEN 5
    WHEN v_plano = 'ENTERPRISE' THEN 999999
    ELSE 1
  END;
  
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_count FROM public.users WHERE tenant_id = p_tenant_id;
  
  RETURN QUERY SELECT
    v_count < v_limit AS can_add,
    v_count AS current_count,
    v_limit AS limit_count,
    v_plano AS plan_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_limit TO authenticated;

-- PARTE 4: Verificação final
SELECT 
  '✅ Sistema de usuários configurado' as status,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.tenants) as total_tenants,
  (SELECT COUNT(*) FROM public.user_invitations) as total_invitations;

