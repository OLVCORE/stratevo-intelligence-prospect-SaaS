-- ============================================================================
-- FUNÇÃO: Get User Tenant ID
-- ============================================================================
-- Retorna o tenant_id do usuário logado (primeiro tenant ativo)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Busca o primeiro tenant ativo do usuário
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$;