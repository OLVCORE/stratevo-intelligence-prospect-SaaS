-- ============================================================================
-- MIGRATION: Sistema de Lixeira para Tenants
-- ============================================================================
-- Este sistema permite soft delete de tenants com possibilidade de restauração
-- ============================================================================

-- 1. Criar tabela de tenants deletados (lixeira)
CREATE TABLE IF NOT EXISTS deleted_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_tenant_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  slug TEXT,
  schema_name TEXT,
  plano TEXT DEFAULT 'FREE',
  status TEXT DEFAULT 'DELETED',
  creditos INTEGER DEFAULT 0,
  data_expiracao TIMESTAMPTZ,
  original_created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_by UUID REFERENCES auth.users(id),
  reason TEXT,
  -- Dados relacionados salvos como JSON para restauração
  related_data JSONB DEFAULT '{}',
  -- Expiração automática (30 dias por padrão)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  permanently_deleted BOOLEAN DEFAULT FALSE
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_deleted_tenants_cnpj ON deleted_tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_deleted_tenants_deleted_by ON deleted_tenants(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_tenants_expires_at ON deleted_tenants(expires_at);
CREATE INDEX IF NOT EXISTS idx_deleted_tenants_permanently_deleted ON deleted_tenants(permanently_deleted);

-- 3. Habilitar RLS
ALTER TABLE deleted_tenants ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
DROP POLICY IF EXISTS "Admins can view deleted tenants" ON deleted_tenants;
CREATE POLICY "Admins can view deleted tenants" ON deleted_tenants
  FOR SELECT USING (
    deleted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('OWNER', 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "Admins can insert deleted tenants" ON deleted_tenants;
CREATE POLICY "Admins can insert deleted tenants" ON deleted_tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update deleted tenants" ON deleted_tenants;
CREATE POLICY "Admins can update deleted tenants" ON deleted_tenants
  FOR UPDATE USING (deleted_by = auth.uid());

DROP POLICY IF EXISTS "Admins can delete from trash" ON deleted_tenants;
CREATE POLICY "Admins can delete from trash" ON deleted_tenants
  FOR DELETE USING (deleted_by = auth.uid());

-- 5. Função para SOFT DELETE de tenant (move para lixeira)
CREATE OR REPLACE FUNCTION soft_delete_tenant(
  p_tenant_id UUID,
  p_reason TEXT DEFAULT 'Deletado pelo usuário'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant RECORD;
  v_related_data JSONB;
  v_deleted_id UUID;
BEGIN
  -- Buscar dados do tenant
  SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant não encontrado');
  END IF;
  
  -- Coletar dados relacionados para backup
  SELECT jsonb_build_object(
    'users', (SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb) FROM users u WHERE u.tenant_id = p_tenant_id),
    'onboarding_sessions', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM onboarding_sessions o WHERE o.tenant_id = p_tenant_id),
    'icp_profiles', (SELECT COALESCE(jsonb_agg(row_to_json(i)), '[]'::jsonb) FROM icp_profiles_metadata i WHERE i.tenant_id = p_tenant_id)
  ) INTO v_related_data;
  
  -- Inserir na lixeira
  INSERT INTO deleted_tenants (
    original_tenant_id,
    nome,
    cnpj,
    email,
    telefone,
    slug,
    schema_name,
    plano,
    creditos,
    data_expiracao,
    original_created_at,
    deleted_by,
    reason,
    related_data
  ) VALUES (
    v_tenant.id,
    v_tenant.nome,
    v_tenant.cnpj,
    v_tenant.email,
    v_tenant.telefone,
    v_tenant.slug,
    v_tenant.schema_name,
    v_tenant.plano,
    v_tenant.creditos,
    v_tenant.data_expiracao,
    v_tenant.created_at,
    auth.uid(),
    p_reason,
    v_related_data
  ) RETURNING id INTO v_deleted_id;
  
  -- Deletar dados relacionados
  DELETE FROM onboarding_sessions WHERE tenant_id = p_tenant_id;
  DELETE FROM icp_profiles_metadata WHERE tenant_id = p_tenant_id;
  DELETE FROM users WHERE tenant_id = p_tenant_id;
  
  -- Deletar o tenant
  DELETE FROM tenants WHERE id = p_tenant_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'deleted_id', v_deleted_id,
    'message', 'Tenant movido para lixeira com sucesso'
  );
END;
$$;

-- 6. Função para RESTAURAR tenant da lixeira
CREATE OR REPLACE FUNCTION restore_tenant(p_deleted_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted RECORD;
  v_new_tenant_id UUID;
  v_user JSONB;
  v_session JSONB;
  v_icp JSONB;
BEGIN
  -- Buscar dados da lixeira
  SELECT * INTO v_deleted FROM deleted_tenants WHERE id = p_deleted_id AND permanently_deleted = FALSE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registro não encontrado na lixeira');
  END IF;
  
  -- Verificar se CNPJ já existe
  IF EXISTS (SELECT 1 FROM tenants WHERE cnpj = v_deleted.cnpj) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CNPJ já existe em outro tenant ativo');
  END IF;
  
  -- Restaurar tenant
  INSERT INTO tenants (
    id, nome, cnpj, email, telefone, slug, schema_name, plano, status, creditos, data_expiracao, created_at
  ) VALUES (
    v_deleted.original_tenant_id,
    v_deleted.nome,
    v_deleted.cnpj,
    v_deleted.email,
    v_deleted.telefone,
    v_deleted.slug,
    v_deleted.schema_name,
    v_deleted.plano,
    'TRIAL',
    v_deleted.creditos,
    v_deleted.data_expiracao,
    v_deleted.original_created_at
  ) RETURNING id INTO v_new_tenant_id;
  
  -- Restaurar usuários
  FOR v_user IN SELECT * FROM jsonb_array_elements(v_deleted.related_data->'users')
  LOOP
    INSERT INTO users (auth_user_id, tenant_id, role, email, nome)
    VALUES (
      (v_user->>'auth_user_id')::UUID,
      v_new_tenant_id,
      v_user->>'role',
      v_user->>'email',
      v_user->>'nome'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Restaurar sessões de onboarding
  FOR v_session IN SELECT * FROM jsonb_array_elements(v_deleted.related_data->'onboarding_sessions')
  LOOP
    INSERT INTO onboarding_sessions (tenant_id, user_id, step1_data, step2_data, step3_data, step4_data, step5_data, status)
    VALUES (
      v_new_tenant_id,
      (v_session->>'user_id')::UUID,
      v_session->'step1_data',
      v_session->'step2_data',
      v_session->'step3_data',
      v_session->'step4_data',
      v_session->'step5_data',
      v_session->>'status'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Marcar como restaurado na lixeira
  UPDATE deleted_tenants 
  SET permanently_deleted = TRUE, 
      reason = 'Restaurado em ' || NOW()::TEXT
  WHERE id = p_deleted_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'tenant_id', v_new_tenant_id,
    'message', 'Tenant restaurado com sucesso'
  );
END;
$$;

-- 7. Função para DELETAR PERMANENTEMENTE
CREATE OR REPLACE FUNCTION permanent_delete_tenant(p_deleted_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se existe
  IF NOT EXISTS (SELECT 1 FROM deleted_tenants WHERE id = p_deleted_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registro não encontrado');
  END IF;
  
  -- Deletar permanentemente
  DELETE FROM deleted_tenants WHERE id = p_deleted_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Deletado permanentemente');
END;
$$;

-- 8. Função para listar tenants na lixeira do usuário
CREATE OR REPLACE FUNCTION list_deleted_tenants()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  cnpj TEXT,
  plano TEXT,
  deleted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  days_until_expiry INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id,
    dt.nome,
    dt.cnpj,
    dt.plano,
    dt.deleted_at,
    dt.expires_at,
    EXTRACT(DAY FROM (dt.expires_at - NOW()))::INTEGER as days_until_expiry
  FROM deleted_tenants dt
  WHERE dt.permanently_deleted = FALSE
    AND dt.deleted_by = auth.uid()
  ORDER BY dt.deleted_at DESC;
END;
$$;

-- 9. Comentários
COMMENT ON TABLE deleted_tenants IS 'Lixeira de tenants deletados - mantém por 30 dias antes de expirar';
COMMENT ON FUNCTION soft_delete_tenant IS 'Move um tenant para a lixeira com todos os dados relacionados';
COMMENT ON FUNCTION restore_tenant IS 'Restaura um tenant da lixeira';
COMMENT ON FUNCTION permanent_delete_tenant IS 'Deleta permanentemente um tenant da lixeira';

