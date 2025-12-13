-- ==========================================
-- LIMPAR TODAS AS FUNÇÕES RPC CRIADAS
-- Execute no Supabase SQL Editor para remover
-- ==========================================

-- 1. REMOVER get_user_tenant_ids (sem parâmetro)
DROP FUNCTION IF EXISTS public.get_user_tenant_ids() CASCADE;

-- 2. REMOVER get_user_tenant_ids (com parâmetro)
DROP FUNCTION IF EXISTS public.get_user_tenant_ids(UUID) CASCADE;

-- 3. REMOVER get_tenant_safe
DROP FUNCTION IF EXISTS public.get_tenant_safe(UUID) CASCADE;

-- 4. REMOVER get_user_tenants_complete
DROP FUNCTION IF EXISTS public.get_user_tenants_complete() CASCADE;

-- 5. REMOVER POLÍTICAS RLS CRIADAS (se quiser)
DROP POLICY IF EXISTS "Users can view their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view own record" ON users;

-- 6. VERIFICAR O QUE FOI REMOVIDO
SELECT 
  'Funções removidas com sucesso' as status;

