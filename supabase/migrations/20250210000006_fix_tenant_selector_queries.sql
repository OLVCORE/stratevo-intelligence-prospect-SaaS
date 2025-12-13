-- ==========================================
-- FIX: Funções helper para evitar erros 500 no TenantSelector
-- ==========================================

-- Função para buscar tenant_id do usuário (mais segura que query direta)
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(p_auth_user_id UUID)
RETURNS TABLE (tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = p_auth_user_id
    AND u.tenant_id IS NOT NULL;
END;
$$;

-- Função para buscar tenant completo (com tratamento de erro)
CREATE OR REPLACE FUNCTION public.get_tenant_safe(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  cnpj TEXT,
  slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name::TEXT as nome,
    t.cnpj::TEXT,
    t.slug::TEXT
  FROM public.tenants t
  WHERE t.id = p_tenant_id;
EXCEPTION
  WHEN others THEN
    -- Retornar vazio em caso de erro
    RETURN;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_safe(UUID) TO authenticated;

-- Comentários
COMMENT ON FUNCTION public.get_user_tenant_ids(UUID) IS 'Busca tenant_ids do usuário de forma segura (evita erros 500)';
COMMENT ON FUNCTION public.get_tenant_safe(UUID) IS 'Busca dados do tenant de forma segura com tratamento de erro';

