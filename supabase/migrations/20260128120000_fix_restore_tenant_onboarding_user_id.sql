-- ============================================================================
-- FIX: restore_tenant - user_id em onboarding_sessions não existe em users
-- ============================================================================
-- Problema: Ao restaurar, inseríamos onboarding_sessions com user_id do backup.
-- Esses user_id referenciam linhas antigas de public.users que foram deletadas;
-- ao restaurar users, novas linhas ganham novos id, então a FK quebra.
-- Solução: Usar o id do usuário atual (auth.uid()) em public.users para o
-- tenant restaurado ao reinserir onboarding_sessions. Se o usuário atual não
-- existir em users para esse tenant, criá-lo antes.
-- ============================================================================

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
  v_current_user_id UUID;
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

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

  -- Restaurar usuários do backup (mesmo que antes; novos ids são gerados)
  IF v_deleted.related_data ? 'users' AND jsonb_array_length(v_deleted.related_data->'users') > 0 THEN
    FOR v_user IN SELECT * FROM jsonb_array_elements(v_deleted.related_data->'users')
    LOOP
      INSERT INTO users (auth_user_id, tenant_id, role, email, nome)
      VALUES (
        (v_user->>'auth_user_id')::UUID,
        v_new_tenant_id,
        COALESCE(v_user->>'role', 'USER'),
        COALESCE(v_user->>'email', ''),
        COALESCE(v_user->>'nome', '')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Obter o id do usuário atual em public.users para este tenant (quem está restaurando)
  SELECT u.id INTO v_current_user_id
  FROM public.users u
  WHERE u.auth_user_id = v_auth_uid AND u.tenant_id = v_new_tenant_id
  LIMIT 1;

  -- Se o usuário atual ainda não está em users para este tenant, inserir (ex.: quem restaura não estava no backup)
  IF v_current_user_id IS NULL THEN
    INSERT INTO public.users (auth_user_id, tenant_id, role, email, nome)
    SELECT
      v_auth_uid,
      v_new_tenant_id,
      'OWNER',
      COALESCE(au.email::TEXT, ''),
      COALESCE(au.raw_user_meta_data->>'full_name', au.email::TEXT, 'Usuário')
    FROM auth.users au
    WHERE au.id = v_auth_uid
    RETURNING id INTO v_current_user_id;
    IF v_current_user_id IS NULL THEN
      SELECT u.id INTO v_current_user_id
      FROM public.users u
      WHERE u.auth_user_id = v_auth_uid AND u.tenant_id = v_new_tenant_id
      LIMIT 1;
    END IF;
  END IF;

  -- Restaurar sessões de onboarding usando SEMPRE o user_id do usuário atual (evita FK quebrada)
  IF v_current_user_id IS NOT NULL
     AND v_deleted.related_data ? 'onboarding_sessions'
     AND jsonb_array_length(v_deleted.related_data->'onboarding_sessions') > 0
  THEN
    FOR v_session IN SELECT * FROM jsonb_array_elements(v_deleted.related_data->'onboarding_sessions')
    LOOP
      INSERT INTO onboarding_sessions (tenant_id, user_id, step1_data, step2_data, step3_data, step4_data, step5_data, status)
      VALUES (
        v_new_tenant_id,
        v_current_user_id,
        v_session->'step1_data',
        v_session->'step2_data',
        v_session->'step3_data',
        v_session->'step4_data',
        v_session->'step5_data',
        COALESCE(v_session->>'status', 'draft')
      )
      ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        step1_data = COALESCE(EXCLUDED.step1_data, onboarding_sessions.step1_data),
        step2_data = COALESCE(EXCLUDED.step2_data, onboarding_sessions.step2_data),
        step3_data = COALESCE(EXCLUDED.step3_data, onboarding_sessions.step3_data),
        step4_data = COALESCE(EXCLUDED.step4_data, onboarding_sessions.step4_data),
        step5_data = COALESCE(EXCLUDED.step5_data, onboarding_sessions.step5_data),
        status = COALESCE(EXCLUDED.status, onboarding_sessions.status),
        updated_at = NOW();
    END LOOP;
  END IF;

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

COMMENT ON FUNCTION restore_tenant(UUID) IS 'Restaura um tenant da lixeira. Usa o usuário atual (auth.uid()) para onboarding_sessions para evitar FK em user_id.';
