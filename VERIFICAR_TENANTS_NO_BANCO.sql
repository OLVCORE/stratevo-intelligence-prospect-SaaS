-- ==========================================
-- VERIFICAR SE OS TENANTS EXISTEM NO BANCO
-- Execute no Supabase SQL Editor
-- ==========================================

-- 1. VERIFICAR TODOS OS TENANTS CADASTRADOS
SELECT 
  id,
  name as nome,
  cnpj,
  slug,
  status,
  plano,
  creditos,
  created_at,
  updated_at
FROM tenants
ORDER BY created_at DESC;

-- 2. VERIFICAR USUÁRIOS E SEUS TENANTS
SELECT 
  u.id as user_id,
  u.auth_user_id,
  u.tenant_id,
  t.name as tenant_nome,
  t.cnpj as tenant_cnpj,
  t.status as tenant_status
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.created_at DESC;

-- 3. VERIFICAR SE AS FUNÇÕES RPC EXISTEM
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant_ids', 'get_tenant_safe', 'get_user_tenant')
ORDER BY p.proname;

-- 4. VERIFICAR PERMISSÕES DAS FUNÇÕES RPC
SELECT 
  p.proname as function_name,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant_ids', 'get_tenant_safe', 'get_user_tenant')
  AND r.rolname IN ('authenticated', 'anon', 'service_role')
ORDER BY p.proname, r.rolname;

-- 5. TESTAR FUNÇÃO get_user_tenant_ids (substitua auth.uid() pelo seu user_id se necessário)
-- NOTA: Esta query só funciona se você estiver autenticado
SELECT * FROM get_user_tenant_ids();

-- 6. VERIFICAR POLÍTICAS RLS NA TABELA tenants
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY policyname;

-- 7. VERIFICAR POLÍTICAS RLS NA TABELA users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

