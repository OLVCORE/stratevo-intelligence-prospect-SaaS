-- ============================================================================
-- MIGRATION: Corrigir políticas RLS para INSERT e DELETE em tenants
-- ============================================================================
-- Data: 2025-02-17
-- Descrição: Adiciona políticas RLS que faltam para permitir criação e deleção de tenants
-- ============================================================================

-- ==========================================
-- PASSO 1: Adicionar política INSERT para tenants
-- ==========================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "tenants_insert_user_tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can insert tenants" ON public.tenants;

-- INSERT: Usuários autenticados podem criar novos tenants
-- (não precisa estar vinculado a um tenant existente para criar um novo)
CREATE POLICY "tenants_insert_user_tenants" ON public.tenants
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL  -- Apenas usuários autenticados podem criar
  );

-- ==========================================
-- PASSO 2: Adicionar política DELETE para tenants
-- ==========================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "tenants_delete_user_tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can delete own tenant" ON public.tenants;

-- DELETE: Usuários podem deletar tenants dos quais são OWNER ou ADMIN
-- (usando função helper para evitar recursão)
CREATE POLICY "tenants_delete_user_tenants" ON public.tenants
  FOR DELETE
  USING (
    id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.tenant_id = tenants.id
      AND u.auth_user_id = auth.uid()
      AND u.role IN ('OWNER', 'ADMIN')
    )
  );

-- ==========================================
-- PASSO 3: Garantir que função create_tenant_direct existe
-- ==========================================

CREATE OR REPLACE FUNCTION public.create_tenant_direct(
  p_slug VARCHAR(255),
  p_nome VARCHAR(255),
  p_cnpj VARCHAR(18),
  p_email VARCHAR(255),
  p_schema_name VARCHAR(255),
  p_telefone VARCHAR(20) DEFAULT NULL,
  p_plano VARCHAR(50) DEFAULT 'FREE',
  p_status VARCHAR(50) DEFAULT 'TRIAL',
  p_creditos INTEGER DEFAULT 10,
  p_data_expiracao TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug VARCHAR(255),
  nome VARCHAR(255),
  cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone VARCHAR(20),
  schema_name VARCHAR(255),
  plano VARCHAR(50),
  status VARCHAR(50),
  creditos INTEGER,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Inserir tenant
  INSERT INTO public.tenants (
    slug, nome, cnpj, email, telefone, schema_name, plano, status, creditos, data_expiracao
  ) VALUES (
    p_slug, p_nome, p_cnpj, p_email, p_telefone, p_schema_name, p_plano, p_status, p_creditos, p_data_expiracao
  )
  RETURNING public.tenants.id INTO v_tenant_id;

  -- Retornar tenant criado
  RETURN QUERY
  SELECT 
    t.id, t.slug, t.nome, t.cnpj, t.email, t.telefone, t.schema_name,
    t.plano, t.status, t.creditos, t.data_expiracao, t.created_at, t.updated_at
  FROM public.tenants t
  WHERE t.id = v_tenant_id;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_tenant_direct TO anon, authenticated, service_role;

-- ==========================================
-- PASSO 4: Garantir que função soft_delete_tenant existe
-- ==========================================

-- Criar função soft_delete_tenant (idempotente - pode ser executada múltiplas vezes)
CREATE OR REPLACE FUNCTION public.soft_delete_tenant(
  p_tenant_id UUID,
  p_reason TEXT DEFAULT 'Deletado pelo usuário'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant RECORD;
  v_deleted_id UUID;
BEGIN
  -- Buscar dados do tenant
  SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant não encontrado');
  END IF;
  
  -- Verificar se tabela deleted_tenants existe, se não existir, criar
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deleted_tenants') THEN
    -- Criar tabela deleted_tenants se não existir
    CREATE TABLE IF NOT EXISTS public.deleted_tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_tenant_id UUID NOT NULL,
      nome TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      slug TEXT,
      schema_name TEXT,
      plano TEXT DEFAULT 'FREE',
      status TEXT DEFAULT 'DELETED',
      creditos INTEGER DEFAULT 0,
      data_expiracao TIMESTAMPTZ,
      original_created_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_by UUID REFERENCES auth.users(id),
      reason TEXT,
      related_data JSONB DEFAULT '{}',
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
      permanently_deleted BOOLEAN DEFAULT FALSE
    );
  END IF;
  
  -- Mover para lixeira (tabela deleted_tenants)
  INSERT INTO deleted_tenants (
    original_tenant_id,
    nome,
    cnpj,
    email,
    telefone,
    slug,
    schema_name,
    plano,
    status,
    creditos,
    data_expiracao,
    original_created_at,
    deleted_by,
    reason
  ) VALUES (
    v_tenant.id,
    v_tenant.nome,
    v_tenant.cnpj,
    v_tenant.email,
    v_tenant.telefone,
    v_tenant.slug,
    v_tenant.schema_name,
    v_tenant.plano,
    'DELETED',
    v_tenant.creditos,
    v_tenant.data_expiracao,
    v_tenant.created_at,
    auth.uid(),
    p_reason
  )
  RETURNING id INTO v_deleted_id;
  
  -- Deletar tenant original (cascade deleta dados relacionados)
  DELETE FROM tenants WHERE id = p_tenant_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', v_deleted_id,
    'message', 'Tenant movido para lixeira com sucesso'
  );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.soft_delete_tenant TO authenticated, service_role;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON POLICY "tenants_insert_user_tenants" ON public.tenants IS 
  'Permite que usuários autenticados criem novos tenants';

COMMENT ON POLICY "tenants_delete_user_tenants" ON public.tenants IS 
  'Permite que OWNER ou ADMIN deletem seus tenants';

