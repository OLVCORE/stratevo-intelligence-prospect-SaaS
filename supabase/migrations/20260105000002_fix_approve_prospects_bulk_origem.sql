-- ==========================================
-- FIX: Corrigir função approve_prospects_bulk para preservar origem (source_file_name/job_name)
-- ==========================================
-- Problema: Função estava salvando valor fixo 'motor_qualificacao' em vez de buscar nome do arquivo
-- Solução: Buscar source_file_name ou job_name da tabela prospect_qualification_jobs
-- ==========================================

CREATE OR REPLACE FUNCTION approve_prospects_bulk(
  p_tenant_id uuid,
  p_job_id uuid,
  p_grades text[] -- Ex: ['A+', 'A']
)
RETURNS TABLE (
  approved_count integer,
  empresa_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approved_count integer;
  v_empresa_ids uuid[];
  v_job_source_file_name text;
  v_job_name text;
  v_job_source_type text;
  v_origem text;
BEGIN
  -- ✅ BUSCAR DADOS DO JOB PARA PEGAR ORIGEM (nome do arquivo)
  SELECT 
    source_file_name,
    job_name,
    source_type
  INTO 
    v_job_source_file_name,
    v_job_name,
    v_job_source_type
  FROM prospect_qualification_jobs
  WHERE id = p_job_id
    AND tenant_id = p_tenant_id;

  -- ✅ ORIGEM: Priorizar source_file_name (nome do arquivo), depois job_name, depois source_type, depois default
  v_origem := COALESCE(
    v_job_source_file_name,
    v_job_name,
    CASE v_job_source_type
      WHEN 'upload_csv' THEN 'CSV Upload'
      WHEN 'upload_excel' THEN 'Excel Upload'
      WHEN 'google_sheets' THEN 'Google Sheets'
      WHEN 'api_empresas_aqui' THEN 'API Empresas Aqui'
      ELSE 'Motor de Qualificação'
    END,
    'Motor de Qualificação'
  );

  -- Inserir prospects qualificados na tabela 'empresas'
  WITH inserted AS (
    INSERT INTO empresas (
      tenant_id,
      cnpj,
      razao_social,
      nome_fantasia,
      cidade,
      estado,
      setor,
      capital_social,
      origem,
      fit_score,
      grade,
      status
    )
    SELECT
      p_tenant_id,
      qp.cnpj,
      qp.razao_social,
      qp.nome_fantasia,
      qp.cidade,
      qp.estado,
      qp.setor,
      qp.capital_social,
      v_origem, -- ✅ USAR ORIGEM DO JOB (não mais valor fixo)
      qp.fit_score,
      qp.grade,
      'pending_review' -- Vai para Quarentena
    FROM qualified_prospects qp
    WHERE qp.tenant_id = p_tenant_id
      AND qp.job_id = p_job_id
      AND qp.grade = ANY(p_grades)
      AND qp.pipeline_status = 'new'
    ON CONFLICT (tenant_id, cnpj) DO UPDATE
    SET
      origem = EXCLUDED.origem, -- ✅ ATUALIZAR ORIGEM também no UPDATE
      fit_score = EXCLUDED.fit_score,
      grade = EXCLUDED.grade,
      status = EXCLUDED.status,
      updated_at = now()
    RETURNING id
  )
  SELECT 
    COUNT(*)::integer,
    array_agg(id)
  INTO v_approved_count, v_empresa_ids
  FROM inserted;
  
  -- Atualizar status dos prospects
  UPDATE qualified_prospects
  SET 
    pipeline_status = 'approved',
    approved_at = now()
  WHERE tenant_id = p_tenant_id
    AND job_id = p_job_id
    AND grade = ANY(p_grades);
  
  RETURN QUERY SELECT v_approved_count, v_empresa_ids;
END;
$$;

-- Comentário
COMMENT ON FUNCTION approve_prospects_bulk IS 
'Aprova prospects em massa e move para Base de Empresas (tabela empresas).
A função agora preserva a origem (source_file_name/job_name) do job de qualificação.';

