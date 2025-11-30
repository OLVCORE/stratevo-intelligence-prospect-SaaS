-- ============================================================================
-- SQL PARA APLICAR NO SUPABASE DASHBOARD
-- ============================================================================
-- Este script permite que um usuário tenha múltiplos tenants (empresas)
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Remover a constraint UNIQUE existente em auth_user_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_user_id_key;

-- 2. Criar nova constraint UNIQUE composta (auth_user_id + tenant_id)
-- Isso permite múltiplos tenants por usuário, mas não duplicatas
ALTER TABLE users 
ADD CONSTRAINT users_auth_user_id_tenant_id_key 
UNIQUE (auth_user_id, tenant_id);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- 4. Verificar se funcionou
SELECT 
  'Constraint criada com sucesso!' as status,
  conname as constraint_name
FROM pg_constraint 
WHERE conname = 'users_auth_user_id_tenant_id_key';

