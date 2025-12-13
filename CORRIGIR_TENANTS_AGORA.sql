-- ==========================================
-- CORREÇÃO URGENTE: Fazer tenants aparecerem
-- Execute no Supabase SQL Editor
-- ==========================================

-- 1. VERIFICAR SE HÁ TENANTS NO BANCO (usa name - coluna que existe)
SELECT 
  id,
  COALESCE(name, nome) as nome,
  cnpj,
  slug,
  status,
  created_at
FROM tenants
ORDER BY created_at DESC;

-- 2. VERIFICAR SE USUÁRIOS ESTÃO ASSOCIADOS AOS TENANTS
SELECT 
  u.id as user_id,
  u.auth_user_id,
  u.tenant_id,
  COALESCE(t.name, t.nome) as tenant_name,
  t.cnpj as tenant_cnpj
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.created_at DESC;

-- 3. CRIAR/ATUALIZAR FUNÇÃO get_user_tenant_ids (SEM PARÂMETRO)
DROP FUNCTION IF EXISTS public.get_user_tenant_ids() CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.tenant_id IS NOT NULL;
END;
$$;

-- 4. CRIAR/ATUALIZAR FUNÇÃO get_tenant_safe (usa name - coluna que existe no banco)
DROP FUNCTION IF EXISTS public.get_tenant_safe(UUID) CASCADE;
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
    COALESCE(t.name, t.nome, '')::TEXT as nome,
    COALESCE(t.cnpj, '')::TEXT as cnpj,
    COALESCE(t.slug, '')::TEXT as slug
  FROM public.tenants t
  WHERE t.id = p_tenant_id;
EXCEPTION
  WHEN others THEN
    -- Retornar vazio em caso de erro
    RETURN;
END;
$$;

-- 5. CRIAR FUNÇÃO PARA BUSCAR TODOS OS TENANTS DO USUÁRIO (COMPLETA - usa name)
DROP FUNCTION IF EXISTS public.get_user_tenants_complete() CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_tenants_complete()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  cnpj TEXT,
  slug TEXT,
  status TEXT,
  plano TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    t.id,
    COALESCE(t.name, t.nome, '')::TEXT as nome,
    COALESCE(t.cnpj, '')::TEXT as cnpj,
    COALESCE(t.slug, '')::TEXT as slug,
    COALESCE(t.status::TEXT, 'ACTIVE') as status,
    COALESCE(t.plano::TEXT, 'FREE') as plano
  FROM public.users u
  INNER JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.auth_user_id = auth.uid()
    AND u.tenant_id IS NOT NULL
    AND t.id IS NOT NULL;
END;
$$;

-- 6. PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_safe(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_tenants_complete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenants_complete() TO anon;

-- 7. TESTAR FUNÇÃO (substitua pelo seu auth_user_id se necessário)
-- SELECT * FROM get_user_tenants_complete();

-- 8. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('tenants', 'users')
ORDER BY tablename, policyname;

-- 9. CRIAR POLÍTICA RLS PERMISSIVA PARA TENANTS (se necessário)
-- ATENÇÃO: Isso permite que usuários autenticados vejam seus próprios tenants
DROP POLICY IF EXISTS "Users can view their own tenants" ON tenants;
CREATE POLICY "Users can view their own tenants"
ON tenants
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
  )
);

-- 10. CRIAR POLÍTICA RLS PERMISSIVA PARA USERS (se necessário)
DROP POLICY IF EXISTS "Users can view their own user record" ON users;
CREATE POLICY "Users can view their own user record"
ON users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

