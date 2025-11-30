-- ============================================================================
-- MIGRATION: Permitir múltiplos tenants por usuário
-- ============================================================================
-- Esta migration altera a constraint da tabela users para permitir que um
-- usuário tenha vínculos com múltiplos tenants (empresas)
-- ============================================================================

-- 1. Remover a constraint UNIQUE existente em auth_user_id (se existir)
DO $$ 
BEGIN
  -- Tentar remover a constraint existente
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_auth_user_id_key' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_auth_user_id_key;
    RAISE NOTICE 'Constraint users_auth_user_id_key removida com sucesso';
  END IF;
END $$;

-- 2. Criar nova constraint UNIQUE composta (auth_user_id + tenant_id)
-- Isso permite que o mesmo usuário tenha múltiplos tenants, mas não duplicatas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_auth_user_id_tenant_id_key' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_auth_user_id_tenant_id_key 
    UNIQUE (auth_user_id, tenant_id);
    RAISE NOTICE 'Constraint users_auth_user_id_tenant_id_key criada com sucesso';
  END IF;
END $$;

-- 3. Criar índice para performance nas buscas de tenants por usuário
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
ON users(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id 
ON users(tenant_id);

-- 4. Criar função para contar tenants de um usuário
CREATE OR REPLACE FUNCTION count_user_tenants(p_auth_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count
  FROM users
  WHERE auth_user_id = p_auth_user_id;
  
  RETURN COALESCE(tenant_count, 0);
END;
$$;

-- 5. Criar função para verificar se usuário pode criar mais tenants
CREATE OR REPLACE FUNCTION can_user_create_tenant(p_auth_user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  current_count INTEGER,
  plan_limit INTEGER,
  plan_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_plan TEXT;
  v_limit INTEGER;
BEGIN
  -- Contar tenants atuais do usuário
  SELECT COUNT(*) INTO v_current_count
  FROM users
  WHERE auth_user_id = p_auth_user_id;
  
  -- Buscar o plano do tenant mais recente do usuário
  SELECT t.plano INTO v_plan
  FROM users u
  JOIN tenants t ON u.tenant_id = t.id
  WHERE u.auth_user_id = p_auth_user_id
  ORDER BY u.created_at DESC
  LIMIT 1;
  
  -- Se não encontrou plano, assumir FREE
  IF v_plan IS NULL THEN
    v_plan := 'FREE';
  END IF;
  
  -- Definir limite baseado no plano
  v_limit := CASE v_plan
    WHEN 'FREE' THEN 1
    WHEN 'STARTER' THEN 2
    WHEN 'GROWTH' THEN 5
    WHEN 'ENTERPRISE' THEN 15
    ELSE 1
  END;
  
  RETURN QUERY SELECT 
    v_current_count < v_limit,
    v_current_count,
    v_limit,
    v_plan;
END;
$$;

-- 6. Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Criar/atualizar política para permitir usuário ver seus próprios registros
DROP POLICY IF EXISTS "Users can view own records" ON users;
CREATE POLICY "Users can view own records" ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- 8. Criar/atualizar política para permitir inserção de novos vínculos
DROP POLICY IF EXISTS "Users can insert own records" ON users;
CREATE POLICY "Users can insert own records" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- 9. Criar/atualizar política para permitir atualização
DROP POLICY IF EXISTS "Users can update own records" ON users;
CREATE POLICY "Users can update own records" ON users
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

COMMENT ON TABLE users IS 'Tabela de vínculos usuário-tenant. Um usuário pode ter múltiplos tenants conforme seu plano.';

