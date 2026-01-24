-- ==========================================
-- FUNÇÃO: Aprovar Lead da Quarentena para CRM
-- ==========================================
-- Cria registros em empresas, leads e deals quando aprovado da quarentena

CREATE OR REPLACE FUNCTION approve_quarantine_to_crm(
  p_quarantine_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  empresa_id UUID,
  lead_id UUID,
  deal_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quarantine RECORD;
  v_empresa_id UUID;
  v_lead_id UUID;
  v_deal_id UUID;
  v_company_id UUID; -- ID da tabela companies (se existir)
BEGIN
  -- Buscar dados da quarentena
  SELECT * INTO v_quarantine
  FROM public.leads_quarantine
  WHERE id = p_quarantine_id
    AND tenant_id = p_tenant_id
    AND validation_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, 'Lead não encontrado ou já processado';
    RETURN;
  END IF;
  
  -- 1. Criar/atualizar registro em empresas
  INSERT INTO public.empresas (
    tenant_id,
    cnpj,
    razao_social,
    nome_fantasia,
    cidade,
    estado,
    setor,
    fit_score,
    grade,
    status,
    origem
  )
  VALUES (
    p_tenant_id,
    v_quarantine.cnpj,
    v_quarantine.name,
    v_quarantine.nome_fantasia,
    v_quarantine.city,
    v_quarantine.state,
    v_quarantine.sector,
    COALESCE(v_quarantine.icp_score, 0),
    CASE 
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 95 THEN 'A+'
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 85 THEN 'A'
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 70 THEN 'B'
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 60 THEN 'C'
      ELSE 'D'
    END,
    'active',
    'quarantine_approved'
  )
  ON CONFLICT (tenant_id, cnpj) DO UPDATE
  SET
    razao_social = EXCLUDED.razao_social,
    nome_fantasia = EXCLUDED.nome_fantasia,
    status = 'active',
    updated_at = now()
  RETURNING id INTO v_empresa_id;
  
  -- 🚨 MICROCICLO 3: Validar que quarentena está em POOL antes de criar lead
  -- Quarentena em POOL pode transicionar para ACTIVE (criando lead)
  IF v_quarantine.validation_status != 'pending' THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, 
      'Lead da quarentena não está em estado POOL (pending). Apenas leads em POOL podem ser aprovados para ACTIVE.';
    RETURN;
  END IF;
  
  -- 2. Criar lead (se houver email ou telefone)
  -- 🚨 MICROCICLO 3: Lead só pode ser criado quando quarentena transiciona de POOL → ACTIVE
  IF v_quarantine.email IS NOT NULL OR v_quarantine.phone IS NOT NULL THEN
    INSERT INTO public.leads (
      tenant_id,
      name,
      email,
      phone,
      company_name,
      status,
      source,
      lead_score,
      priority
    )
    VALUES (
      p_tenant_id,
      COALESCE(v_quarantine.contact_name, v_quarantine.name, 'Contato'),
      COALESCE(v_quarantine.email, ''),
      COALESCE(v_quarantine.phone, ''),
      v_quarantine.name,
      'novo',
      'quarantine',
      COALESCE(v_quarantine.icp_score, 0),
      CASE 
        WHEN COALESCE(v_quarantine.temperatura, '') = 'hot' THEN 'high'
        WHEN COALESCE(v_quarantine.temperatura, '') = 'warm' THEN 'medium'
        ELSE 'low'
      END
    )
    ON CONFLICT (tenant_id, email) DO UPDATE
    SET
      name = EXCLUDED.name,
      phone = COALESCE(EXCLUDED.phone, leads.phone),
      updated_at = now()
    RETURNING id INTO v_lead_id;
  END IF;
  
  -- 3. Buscar ou criar registro em companies (para vincular deal)
  IF v_quarantine.cnpj IS NOT NULL THEN
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE cnpj = v_quarantine.cnpj
      AND tenant_id = p_tenant_id
    LIMIT 1;
    
    -- Se não encontrou, criar em companies
    IF v_company_id IS NULL THEN
      INSERT INTO public.companies (
        tenant_id,
        name,
        company_name,
        cnpj,
        industry,
        location
      )
      VALUES (
        p_tenant_id,
        COALESCE(v_quarantine.nome_fantasia, v_quarantine.name),
        v_quarantine.name,
        v_quarantine.cnpj,
        v_quarantine.sector,
        jsonb_build_object(
          'city', v_quarantine.city,
          'state', v_quarantine.state,
          'country', 'BR'
        )
      )
      ON CONFLICT (cnpj) DO UPDATE
      SET
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        updated_at = now()
      RETURNING id INTO v_company_id;
    END IF;
  END IF;
  
  -- 4. Criar deal (SEMPRE, mesmo sem lead - vinculado à empresa)
  INSERT INTO public.deals (
    tenant_id,
    lead_id,
    company_id,
    title,
    description,
    stage,
    probability,
    priority,
    source
  )
  VALUES (
    p_tenant_id,
    v_lead_id, -- Pode ser NULL se não houver lead
    v_company_id, -- Vinculado à empresa
    'Oportunidade - ' || v_quarantine.name,
    'Oportunidade criada a partir da aprovação da quarentena',
    'discovery',
    CASE 
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 85 THEN 40
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 70 THEN 30
      ELSE 25
    END,
    CASE 
      WHEN COALESCE(v_quarantine.temperatura, '') = 'hot' THEN 'high'
      WHEN COALESCE(v_quarantine.temperatura, '') = 'warm' THEN 'medium'
      WHEN COALESCE(v_quarantine.icp_score, 0) >= 80 THEN 'high'
      ELSE 'low'
    END,
    'quarantine'
  )
  RETURNING id INTO v_deal_id;
  
  -- 5. Atualizar status da quarentena
  UPDATE public.leads_quarantine
  SET
    validation_status = 'approved',
    review_status = 'approved',
    approved_at = now()
  WHERE id = p_quarantine_id;
  
  -- 6. Retornar resultado
  RETURN QUERY SELECT 
    v_empresa_id,
    v_lead_id,
    v_deal_id,
    true,
    'Lead aprovado e movido para CRM com sucesso. Deal criado automaticamente.';
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION approve_quarantine_to_crm(UUID, UUID) TO authenticated;

-- Comentário atualizado
COMMENT ON FUNCTION approve_quarantine_to_crm IS 
'🚨 MICROCICLO 3: Aprova lead da quarentena (POOL → ACTIVE) e cria registros em empresas, leads e deals no CRM. Valida que quarentena está em POOL antes de criar lead. Empresas criadas/atualizadas recebem canonical_status = ACTIVE.';


