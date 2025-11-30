-- ============================================================================
-- VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
-- ============================================================================
-- Execute este script para verificar se as tabelas e funções existem
-- ============================================================================

-- Verificar tabela tenants
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
    THEN '✅ Tabela tenants EXISTE'
    ELSE '❌ Tabela tenants NÃO EXISTE'
  END as status_tenants,
  (SELECT COUNT(*) FROM public.tenants) as total_tenants;

-- Verificar tabela users
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN '✅ Tabela users EXISTE'
    ELSE '❌ Tabela users NÃO EXISTE'
  END as status_users,
  (SELECT COUNT(*) FROM public.users) as total_users;

-- Verificar função create_tenant_direct
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'create_tenant_direct'
    )
    THEN '✅ Função create_tenant_direct EXISTE'
    ELSE '❌ Função create_tenant_direct NÃO EXISTE'
  END as status_create_tenant;

-- Verificar função get_user_tenant
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_user_tenant'
    )
    THEN '✅ Função get_user_tenant EXISTE'
    ELSE '❌ Função get_user_tenant NÃO EXISTE'
  END as status_get_tenant;

-- Verificar permissões na tabela tenants
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'tenants'
ORDER BY grantee, privilege_type;

-- Verificar RLS na tabela tenants
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'tenants';

