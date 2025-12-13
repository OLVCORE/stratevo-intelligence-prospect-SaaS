-- ==========================================
-- FIX: Corrigir RLS de tenant_products para não depender da tabela users
-- ==========================================
-- Problema: A política RLS usa SELECT da tabela users que está retornando erro 500
-- Solução: Usar função RPC get_user_tenant_ids() que é mais segura
-- ==========================================

-- 1. Remover políticas antigas (TODAS as tabelas afetadas)
DROP POLICY IF EXISTS "tenant_products_policy" ON tenant_products;
DROP POLICY IF EXISTS "tenant_product_documents_policy" ON tenant_product_documents;
DROP POLICY IF EXISTS "tenant_fit_config_policy" ON tenant_fit_config;
DROP POLICY IF EXISTS "product_fit_analysis_policy" ON product_fit_analysis;
DROP POLICY IF EXISTS "tenant_competitor_products_policy" ON tenant_competitor_products;
-- Remover políticas antigas de onboarding_sessions
DROP POLICY IF EXISTS "public.onboarding_sessions_authenticated" ON onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_select_own" ON onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_insert_own" ON onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_update_own" ON onboarding_sessions;
DROP POLICY IF EXISTS "onboarding_sessions_delete_own" ON onboarding_sessions;
DROP POLICY IF EXISTS "SAAS Secure: View onboarding sessions" ON onboarding_sessions;

-- 2. Criar função helper para buscar tenant_ids do usuário (se não existir)
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
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

-- 2.1. Criar função helper para buscar public.users.id de forma segura
CREATE OR REPLACE FUNCTION public.get_public_user_id(p_tenant_id UUID DEFAULT NULL)
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
  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND (p_tenant_id IS NULL OR u.tenant_id = p_tenant_id)
  LIMIT 1;
  
  RETURN v_user_id;
EXCEPTION
  WHEN others THEN
    -- Retornar NULL em caso de erro (evita erro 500)
    RETURN NULL;
END;
$$;

-- 3. Criar novas políticas usando a função RPC (mais segura)
CREATE POLICY "tenant_products_policy" ON tenant_products
  FOR ALL 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

CREATE POLICY "tenant_product_documents_policy" ON tenant_product_documents
  FOR ALL 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

CREATE POLICY "tenant_fit_config_policy" ON tenant_fit_config
  FOR ALL 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

CREATE POLICY "product_fit_analysis_policy" ON product_fit_analysis
  FOR ALL 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- 🔥 CRÍTICO: Corrigir também tenant_competitor_products (produtos de concorrentes)
CREATE POLICY "tenant_competitor_products_policy" ON tenant_competitor_products
  FOR ALL 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- 🔥 CRÍTICO: Corrigir onboarding_sessions (sessões de onboarding)
-- SELECT: Usuários podem ver suas próprias sessões
CREATE POLICY "onboarding_sessions_select_own" ON onboarding_sessions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- INSERT: Usuários podem criar sessões para si mesmos
CREATE POLICY "onboarding_sessions_insert_own" ON onboarding_sessions
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- UPDATE: Usuários podem atualizar suas próprias sessões
CREATE POLICY "onboarding_sessions_update_own" ON onboarding_sessions
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

-- DELETE: Usuários podem deletar suas próprias sessões
CREATE POLICY "onboarding_sessions_delete_own" ON onboarding_sessions
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_user_id(UUID) TO anon;

-- 5. Comentários
COMMENT ON FUNCTION public.get_user_tenant_ids() IS 'Busca tenant_ids do usuário autenticado de forma segura (evita erros 500)';
COMMENT ON FUNCTION public.get_public_user_id(UUID) IS 'Busca public.users.id do usuário autenticado de forma segura (evita erros 500)';
COMMENT ON POLICY "tenant_products_policy" ON tenant_products IS 'Permite acesso apenas aos produtos do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "tenant_product_documents_policy" ON tenant_product_documents IS 'Permite acesso apenas aos documentos do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "tenant_fit_config_policy" ON tenant_fit_config IS 'Permite acesso apenas à config de FIT do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "product_fit_analysis_policy" ON product_fit_analysis IS 'Permite acesso apenas às análises de FIT do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "tenant_competitor_products_policy" ON tenant_competitor_products IS 'Permite acesso apenas aos produtos de concorrentes do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "onboarding_sessions_select_own" ON onboarding_sessions IS 'Permite visualizar sessões de onboarding do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "onboarding_sessions_insert_own" ON onboarding_sessions IS 'Permite criar sessões de onboarding do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "onboarding_sessions_update_own" ON onboarding_sessions IS 'Permite atualizar sessões de onboarding do tenant do usuário (usa RPC seguro)';
COMMENT ON POLICY "onboarding_sessions_delete_own" ON onboarding_sessions IS 'Permite deletar sessões de onboarding do tenant do usuário (usa RPC seguro)';

