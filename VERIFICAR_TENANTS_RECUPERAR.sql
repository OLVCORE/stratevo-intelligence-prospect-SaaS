-- ==========================================
-- VERIFICAR E RECUPERAR TENANTS PERDIDOS
-- ==========================================
-- Execute este SQL no Supabase SQL Editor para verificar se os tenants ainda existem
-- ==========================================

-- 1. VERIFICAR TODOS OS TENANTS NO BANCO
SELECT 
  id,
  name,
  cnpj,
  email,
  status,
  plano,
  created_at,
  updated_at
FROM public.tenants
ORDER BY created_at DESC;

-- 2. VERIFICAR TENANTS DO USUÁRIO ESPECÍFICO
-- Substitua 'b52ce768-b0f3-4996-9d5b-0b66b33b74bb' pelo seu auth_user_id
SELECT 
  u.id as user_id,
  u.auth_user_id,
  u.tenant_id,
  t.id as tenant_table_id,
  t.name as tenant_name,
  t.cnpj as tenant_cnpj,
  t.status as tenant_status,
  t.plano as tenant_plano
FROM public.users u
LEFT JOIN public.tenants t ON t.id = u.tenant_id
WHERE u.auth_user_id = 'b52ce768-b0f3-4996-9d5b-0b66b33b74bb';

-- 3. VERIFICAR SE HÁ TENANTS NA LIXEIRA (soft delete)
SELECT 
  id,
  original_tenant_id,
  nome,
  cnpj,
  deleted_at,
  permanently_deleted
FROM public.deleted_tenants
WHERE permanently_deleted = FALSE
ORDER BY deleted_at DESC;

-- 4. BUSCAR TENANTS POR NOME (Uniluvas e OLV Internacional)
SELECT 
  id,
  name,
  cnpj,
  email,
  status,
  plano,
  created_at
FROM public.tenants
WHERE 
  LOWER(name) LIKE '%uniluvas%' 
  OR LOWER(name) LIKE '%olv%'
  OR LOWER(name) LIKE '%internacional%'
ORDER BY created_at DESC;

-- 5. VERIFICAR SE HÁ REGISTROS NA TABELA users PARA ESTES TENANTS
-- Primeiro, encontre os IDs dos tenants Uniluvas e OLV
-- Depois execute:
SELECT 
  u.id,
  u.auth_user_id,
  u.tenant_id,
  t.name as tenant_name,
  t.cnpj as tenant_cnpj
FROM public.users u
INNER JOIN public.tenants t ON t.id = u.tenant_id
WHERE 
  LOWER(t.name) LIKE '%uniluvas%' 
  OR LOWER(t.name) LIKE '%olv%'
  OR LOWER(t.name) LIKE '%internacional%';

-- ==========================================
-- SE OS TENANTS EXISTEM MAS NÃO APARECEM:
-- ==========================================

-- 6. RECRIAR RELAÇÃO users -> tenants (se necessário)
-- Substitua os valores pelos IDs corretos encontrados nas queries acima
/*
INSERT INTO public.users (auth_user_id, tenant_id, created_at, updated_at)
VALUES 
  ('b52ce768-b0f3-4996-9d5b-0b66b33b74bb', 'ID_TENANT_UNILUVAS', NOW(), NOW()),
  ('b52ce768-b0f3-4996-9d5b-0b66b33b74bb', 'ID_TENANT_OLV', NOW(), NOW())
ON CONFLICT (auth_user_id, tenant_id) DO NOTHING;
*/

-- 7. RESTAURAR TENANTS DA LIXEIRA (se estiverem lá)
-- Primeiro encontre o ID na tabela deleted_tenants, depois execute:
/*
SELECT public.restore_tenant('ID_DELETED_TENANT_AQUI');
*/

-- ==========================================
-- VERIFICAR RLS (Row Level Security)
-- ==========================================

-- 8. VERIFICAR POLÍTICAS RLS DA TABELA tenants
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
WHERE tablename = 'tenants';

-- 9. VERIFICAR POLÍTICAS RLS DA TABELA users
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
WHERE tablename = 'users';

