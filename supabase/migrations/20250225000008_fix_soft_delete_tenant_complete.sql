-- ============================================================================
-- MIGRATION: Corrigir soft_delete_tenant para deletar TODAS as dependências
-- ============================================================================
-- Data: 2025-02-25
-- Descrição: Atualiza soft_delete_tenant para deletar TODAS as tabelas relacionadas
--            antes de deletar o tenant, evitando erro 409 (violação de foreign key)
-- ============================================================================

-- 🔥 CORRIGIR: Função soft_delete_tenant para deletar TODAS as dependências
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
  
  -- 🔥 COLETAR dados relacionados para backup (ANTES de deletar)
  SELECT jsonb_build_object(
    'users', (SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb) FROM users u WHERE u.tenant_id = p_tenant_id),
    'onboarding_sessions', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM onboarding_sessions o WHERE o.tenant_id = p_tenant_id),
    'icp_profiles', (SELECT COALESCE(jsonb_agg(row_to_json(i)), '[]'::jsonb) FROM icp_profiles_metadata i WHERE i.tenant_id = p_tenant_id),
    'tenant_products', (SELECT COALESCE(jsonb_agg(row_to_json(tp)), '[]'::jsonb) FROM tenant_products tp WHERE tp.tenant_id = p_tenant_id),
    'tenant_competitor_products', (SELECT COALESCE(jsonb_agg(row_to_json(tcp)), '[]'::jsonb) FROM tenant_competitor_products tcp WHERE tcp.tenant_id = p_tenant_id)
  ) INTO v_related_data;
  
  -- 🔥 DELETAR TODAS as dependências (ordem correta para evitar violações de FK)
  -- Ordem: deletar tabelas filhas primeiro, depois tabelas pais
  
  -- 1. Deletar dados de produtos (concorrentes primeiro, depois produtos do tenant)
  DELETE FROM tenant_competitor_products WHERE tenant_id = p_tenant_id;
  DELETE FROM tenant_products WHERE tenant_id = p_tenant_id;
  
  -- 2. Deletar dados de ICP e análises
  DELETE FROM icp_analysis_results WHERE tenant_id = p_tenant_id;
  DELETE FROM icp_profiles_metadata WHERE tenant_id = p_tenant_id;
  DELETE FROM icp_reports WHERE tenant_id = p_tenant_id;
  DELETE FROM icp_competitive_swot WHERE tenant_id = p_tenant_id;
  DELETE FROM icp_bcg_matrix WHERE tenant_id = p_tenant_id;
  DELETE FROM icp_market_insights WHERE tenant_id = p_tenant_id;
  
  -- 3. Deletar dados de onboarding
  DELETE FROM onboarding_sessions WHERE tenant_id = p_tenant_id;
  
  -- 4. Deletar dados de empresas e prospects
  DELETE FROM qualified_prospects WHERE tenant_id = p_tenant_id;
  DELETE FROM companies WHERE tenant_id = p_tenant_id;
  
  -- 5. Deletar dados de análise competitiva
  DELETE FROM competitive_analysis WHERE tenant_id = p_tenant_id;
  
  -- 6. Deletar dados de leads (CRM)
  DELETE FROM leads WHERE tenant_id = p_tenant_id;
  
  -- 7. Deletar jobs de scan
  DELETE FROM website_scan_jobs WHERE tenant_id = p_tenant_id;
  
  -- 8. Deletar usuários (deve ser antes de deletar o tenant)
  DELETE FROM users WHERE tenant_id = p_tenant_id;
  
  -- 9. Deletar relacionamentos tenant_users (se existir)
  DELETE FROM tenant_users WHERE tenant_id = p_tenant_id;
  
  -- 🔥 INSERIR na lixeira (APÓS coletar dados, ANTES de deletar tenant)
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
  
  -- 🔥 FINALMENTE: Deletar o tenant (último passo)
  DELETE FROM tenants WHERE id = p_tenant_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'deleted_id', v_deleted_id,
    'message', 'Tenant movido para lixeira com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 🔥 TRATAR ERROS: Retornar mensagem de erro detalhada
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Comentário
COMMENT ON FUNCTION soft_delete_tenant IS 'Move um tenant para a lixeira deletando TODAS as dependências (produtos, ICP, onboarding, empresas, prospects, etc.)';

