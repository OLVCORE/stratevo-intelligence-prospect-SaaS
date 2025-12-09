-- ==========================================
-- FUNÇÃO: Criar Job de Qualificação após Importação
-- ==========================================
-- Cria automaticamente um job de qualificação quando há novos prospecting_candidates

CREATE OR REPLACE FUNCTION create_qualification_job_after_import(
  p_tenant_id UUID,
  p_icp_id UUID,
  p_source_type TEXT,
  p_source_batch_id TEXT,
  p_job_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
  v_total_candidates INTEGER;
  v_job_name_final TEXT;
BEGIN
  -- Contar candidatos pendentes para este batch
  SELECT COUNT(*) INTO v_total_candidates
  FROM public.prospecting_candidates
  WHERE tenant_id = p_tenant_id
    AND icp_id = p_icp_id
    AND source_batch_id = p_source_batch_id
    AND status = 'pending';
  
  IF v_total_candidates = 0 THEN
    RAISE EXCEPTION 'Nenhum candidato pendente encontrado para este batch';
  END IF;
  
  -- Gerar nome do job se não fornecido
  IF p_job_name IS NULL OR p_job_name = '' THEN
    v_job_name_final := format(
      'Importação %s - %s empresas',
      to_char(now(), 'DD/MM/YYYY HH24:MI'),
      v_total_candidates
    );
  ELSE
    v_job_name_final := p_job_name;
  END IF;
  
  -- Criar job
  INSERT INTO public.prospect_qualification_jobs (
    tenant_id,
    icp_id,
    job_name,
    source_type,
    source_file_name,
    total_cnpjs,
    status
  )
  VALUES (
    p_tenant_id,
    p_icp_id,
    v_job_name_final,
    p_source_type,
    p_source_batch_id,
    v_total_candidates,
    'pending'
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION create_qualification_job_after_import(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Comentário
COMMENT ON FUNCTION create_qualification_job_after_import IS 
'Cria automaticamente um job de qualificação após importação de prospecting_candidates';

