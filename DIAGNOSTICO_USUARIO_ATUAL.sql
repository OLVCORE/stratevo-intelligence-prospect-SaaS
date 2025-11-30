-- ============================================================================
-- DIAGNÓSTICO: Verificar usuário atual e status do onboarding
-- ============================================================================
-- Execute este script para verificar o estado atual do seu usuário
-- ============================================================================

-- 1. Verificar usuário autenticado atual
SELECT 
  'Usuário Autenticado' AS verificacao,
  auth.uid() AS user_id,
  auth.email() AS email;

-- 2. Verificar se existe registro em public.users
SELECT 
  'Registro em public.users' AS verificacao,
  u.id,
  u.email,
  u.nome,
  u.tenant_id,
  u.auth_user_id,
  u.role,
  u.created_at
FROM public.users u
WHERE u.auth_user_id = auth.uid();

-- 3. Verificar se existe tenant criado (mas sem usuário vinculado)
SELECT 
  'Tenants sem usuário vinculado' AS verificacao,
  t.id AS tenant_id,
  t.nome,
  t.email,
  t.cnpj,
  t.status,
  t.created_at
FROM public.tenants t
WHERE t.email = auth.email()
AND NOT EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.tenant_id = t.id
);

-- 4. Verificar função get_user_tenant()
SELECT 
  'Resultado get_user_tenant()' AS verificacao,
  public.get_user_tenant() AS tenant_id;

-- 5. Verificar políticas RLS que podem estar bloqueando
SELECT 
  'Políticas RLS na tabela users' AS verificacao,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'users';

