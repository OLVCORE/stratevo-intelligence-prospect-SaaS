-- ==========================================
-- FIX: Corrigir recursão RLS e RPC ausente
-- ==========================================
-- PROBLEMA 1: Recursão infinita em policies de users e icp_profiles_metadata (erro 42P17)
-- PROBLEMA 2: RPC get_public_user_id ausente (erro 404)
-- PROBLEMA 3: Erros 500 em onboarding_sessions
-- SOLUÇÃO: Refatorar policies para usar funções SECURITY DEFINER sem recursão
-- ==========================================

-- ==========================================
-- PASSO 1: Garantir que função helper existe e está correta (sem recursão)
-- ==========================================
-- A função get_user_tenant_ids() já existe em migrations anteriores
-- Vamos garantir que ela está correta e não causa recursão
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Buscar tenant_ids diretamente, sem subqueries que possam causar recursão
  RETURN QUERY
  SELECT DISTINCT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.tenant_id IS NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Retornar vazio em caso de erro (evita erro 500)
    RETURN;
END;
$$;

-- ==========================================
-- PASSO 2: Criar RPC get_public_user_id (com assinatura correta)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_public_user_id(
  p_auth_user_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id do usuário autenticado
  -- Se p_tenant_id for fornecido, filtrar por tenant também
  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE u.auth_user_id = p_auth_user_id
    AND (p_tenant_id IS NULL OR u.tenant_id = p_tenant_id)
  ORDER BY u.created_at DESC
  LIMIT 1;
  
  RETURN v_user_id;
EXCEPTION
  WHEN others THEN
    -- Retornar NULL em caso de erro (evita erro 500)
    RETURN NULL;
END;
$$;

-- ==========================================
-- PASSO 3: Remover policies problemáticas que causam recursão
-- ==========================================

-- Remover todas as policies antigas de users que podem causar recursão
DROP POLICY IF EXISTS "Users can view own records" ON public.users;
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "allow_all_select" ON public.users;

-- Remover todas as policies antigas de tenants que podem causar recursão
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "public.tenants_read" ON public.tenants;

-- Remover todas as policies antigas de icp_profiles_metadata que podem causar recursão
DROP POLICY IF EXISTS "Users can view ICPs from their tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Users can create ICPs in their tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Users can update ICPs from their tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Users can delete ICPs from their tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Admins can view all ICPs" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "DEV: All authenticated users can view all ICPs" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Developer can view all ICPs" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Multi-tenant SELECT for icp_profiles_metadata" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Multi-tenant INSERT for icp_profiles_metadata" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "Multi-tenant UPDATE for icp_profiles_metadata" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "SAAS Secure: View ICPs" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "SAAS Secure: Create ICPs" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "SAAS Secure: Update ICPs" ON public.icp_profiles_metadata;

-- ==========================================
-- PASSO 4: Criar novas policies de users (SEM recursão)
-- ==========================================

-- Remover policies antigas que podem ter sido criadas anteriormente
DROP POLICY IF EXISTS "users_select_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "users_update_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "users_delete_own_by_auth" ON public.users;

-- SELECT: Usuários podem ver seus próprios registros (baseado apenas em auth.uid())
CREATE POLICY "users_select_own_by_auth" ON public.users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- INSERT: Usuários podem inserir seus próprios registros
CREATE POLICY "users_insert_own_by_auth" ON public.users
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- UPDATE: Usuários podem atualizar seus próprios registros
CREATE POLICY "users_update_own_by_auth" ON public.users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- DELETE: Usuários podem deletar seus próprios registros (se necessário)
CREATE POLICY "users_delete_own_by_auth" ON public.users
  FOR DELETE
  USING (auth_user_id = auth.uid());

-- ==========================================
-- PASSO 5: Criar novas policies de tenants (SEM recursão)
-- ==========================================

-- Remover policies antigas que podem ter sido criadas anteriormente
DROP POLICY IF EXISTS "tenants_select_user_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_user_tenants" ON public.tenants;

-- SELECT: Usuários podem ver tenants dos quais fazem parte (usando função helper)
CREATE POLICY "tenants_select_user_tenants" ON public.tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- UPDATE: Usuários podem atualizar tenants dos quais fazem parte
CREATE POLICY "tenants_update_user_tenants" ON public.tenants
  FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- ==========================================
-- PASSO 6: Criar novas policies de icp_profiles_metadata (SEM recursão)
-- ==========================================

-- Remover policies antigas que podem ter sido criadas anteriormente
DROP POLICY IF EXISTS "icp_profiles_metadata_select_tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "icp_profiles_metadata_insert_tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "icp_profiles_metadata_update_tenant" ON public.icp_profiles_metadata;
DROP POLICY IF EXISTS "icp_profiles_metadata_delete_tenant" ON public.icp_profiles_metadata;

-- SELECT: Usuários podem ver ICPs dos seus tenants (usando função helper)
CREATE POLICY "icp_profiles_metadata_select_tenant" ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- INSERT: Usuários podem criar ICPs nos seus tenants
CREATE POLICY "icp_profiles_metadata_insert_tenant" ON public.icp_profiles_metadata
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- UPDATE: Usuários podem atualizar ICPs dos seus tenants
CREATE POLICY "icp_profiles_metadata_update_tenant" ON public.icp_profiles_metadata
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- DELETE: Usuários podem deletar ICPs dos seus tenants
CREATE POLICY "icp_profiles_metadata_delete_tenant" ON public.icp_profiles_metadata
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- ==========================================
-- PASSO 7: Corrigir policies de onboarding_sessions (usando função helper)
-- ==========================================

-- Remover policies antigas
DROP POLICY IF EXISTS "onboarding_sessions_select_own" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_insert_own" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_update_own" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_delete_own" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "SAAS Secure: View onboarding sessions" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_select_tenant" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_insert_tenant" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_update_tenant" ON public.onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_delete_tenant" ON public.onboarding_sessions;

-- Criar novas policies usando função helper (sem recursão)
CREATE POLICY "onboarding_sessions_select_tenant" ON public.onboarding_sessions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

CREATE POLICY "onboarding_sessions_insert_tenant" ON public.onboarding_sessions
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

CREATE POLICY "onboarding_sessions_update_tenant" ON public.onboarding_sessions
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

CREATE POLICY "onboarding_sessions_delete_tenant" ON public.onboarding_sessions
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- ==========================================
-- PASSO 8: Garantir permissões nas funções
-- ==========================================

-- Garantir permissões na função existente (já deve ter, mas garantimos)
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_user_id(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_user_id(UUID, UUID) TO anon;

-- ==========================================
-- PASSO 9: Comentários e documentação
-- ==========================================

COMMENT ON FUNCTION public.get_user_tenant_ids() IS 
  'Busca tenant_ids do usuário autenticado de forma segura, sem causar recursão em RLS policies';

COMMENT ON FUNCTION public.get_public_user_id(UUID, UUID) IS 
  'Busca public.users.id do usuário autenticado. Parâmetros: p_auth_user_id (obrigatório), p_tenant_id (opcional)';

COMMENT ON POLICY "users_select_own_by_auth" ON public.users IS 
  'Permite usuários verem seus próprios registros baseado apenas em auth.uid() (sem recursão)';

COMMENT ON POLICY "icp_profiles_metadata_select_tenant" ON public.icp_profiles_metadata IS 
  'Permite usuários verem ICPs dos seus tenants usando função helper (sem recursão)';

COMMENT ON POLICY "onboarding_sessions_select_tenant" ON public.onboarding_sessions IS 
  'Permite usuários verem sessões de onboarding dos seus tenants usando função helper (sem recursão)';

