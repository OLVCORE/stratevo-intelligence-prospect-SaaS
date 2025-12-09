-- ==========================================
-- FUNÇÃO: Processar Job de Qualificação
-- ==========================================
-- Processa prospecting_candidates e cria qualified_prospects
-- Calcula fit_score usando ICP

CREATE OR REPLACE FUNCTION process_qualification_job(
  p_job_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  processed_count INTEGER,
  qualified_count INTEGER,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job RECORD;
  v_candidate RECORD;
  v_icp_profile RECORD;
  v_processed INTEGER := 0;
  v_qualified INTEGER := 0;
  v_fit_score NUMERIC;
  v_grade TEXT;
  v_candidates_cursor CURSOR FOR
    SELECT * FROM public.prospecting_candidates
    WHERE tenant_id = p_tenant_id
      AND status = 'pending'
      AND icp_id = v_job.icp_id
    LIMIT 1000; -- Processar em lotes
BEGIN
  -- Buscar job
  SELECT * INTO v_job
  FROM public.prospect_qualification_jobs
  WHERE id = p_job_id
    AND tenant_id = p_tenant_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, false, 'Job não encontrado ou já processado';
    RETURN;
  END IF;
  
  -- Atualizar status do job para processing
  UPDATE public.prospect_qualification_jobs
  SET status = 'processing', started_at = now()
  WHERE id = p_job_id;
  
  -- Buscar ICP profile (se houver)
  IF v_job.icp_id IS NOT NULL THEN
    SELECT * INTO v_icp_profile
    FROM public.icp_profiles_metadata
    WHERE id = v_job.icp_id
      AND tenant_id = p_tenant_id;
  END IF;
  
  -- Processar cada candidato
  FOR v_candidate IN v_candidates_cursor LOOP
    BEGIN
      -- Calcular fit_score simples (pode ser melhorado com lógica mais complexa)
      -- Por enquanto, score baseado em:
      -- - Setor match: 30%
      -- - Localização match: 25%
      -- - Dados completos: 20%
      -- - Website presente: 15%
      -- - Contato presente: 10%
      
      v_fit_score := 0;
      
      -- Setor match (30%)
      IF v_icp_profile IS NOT NULL AND v_icp_profile.target_sectors IS NOT NULL THEN
        IF v_candidate.sector IS NOT NULL AND 
           EXISTS (
             SELECT 1 FROM unnest(v_icp_profile.target_sectors) AS target_sector
             WHERE LOWER(v_candidate.sector) LIKE '%' || LOWER(target_sector) || '%'
           ) THEN
          v_fit_score := v_fit_score + 30;
        END IF;
      ELSE
        v_fit_score := v_fit_score + 15; -- Sem ICP, score neutro
      END IF;
      
      -- Localização match (25%)
      IF v_icp_profile IS NOT NULL AND v_icp_profile.target_states IS NOT NULL THEN
        IF v_candidate.uf IS NOT NULL AND 
           v_candidate.uf = ANY(v_icp_profile.target_states) THEN
          v_fit_score := v_fit_score + 25;
        END IF;
      ELSE
        v_fit_score := v_fit_score + 12; -- Sem ICP, score neutro
      END IF;
      
      -- Dados completos (20%)
      IF v_candidate.cnpj IS NOT NULL AND v_candidate.company_name IS NOT NULL THEN
        v_fit_score := v_fit_score + 20;
      END IF;
      
      -- Website presente (15%)
      IF v_candidate.website IS NOT NULL AND v_candidate.website != '' THEN
        v_fit_score := v_fit_score + 15;
      END IF;
      
      -- Contato presente (10%)
      IF (v_candidate.contact_email IS NOT NULL AND v_candidate.contact_email != '') OR
         (v_candidate.contact_phone IS NOT NULL AND v_candidate.contact_phone != '') THEN
        v_fit_score := v_fit_score + 10;
      END IF;
      
      -- Determinar grade
      IF v_fit_score >= 95 THEN
        v_grade := 'A+';
      ELSIF v_fit_score >= 85 THEN
        v_grade := 'A';
      ELSIF v_fit_score >= 70 THEN
        v_grade := 'B';
      ELSIF v_fit_score >= 60 THEN
        v_grade := 'C';
      ELSE
        v_grade := 'D';
      END IF;
      
      -- Inserir em qualified_prospects (apenas se fit_score >= 60)
      IF v_fit_score >= 60 THEN
        INSERT INTO public.qualified_prospects (
          tenant_id,
          job_id,
          icp_id,
          cnpj,
          razao_social,
          nome_fantasia,
          cidade,
          estado,
          setor,
          website,
          fit_score,
          grade,
          pipeline_status,
          created_at
        )
        VALUES (
          p_tenant_id,
          p_job_id,
          v_job.icp_id,
          v_candidate.cnpj,
          v_candidate.company_name,
          v_candidate.company_name, -- Usar company_name como nome_fantasia se não houver
          v_candidate.city,
          v_candidate.uf,
          v_candidate.sector,
          v_candidate.website,
          v_fit_score,
          v_grade,
          'new',
          now()
        )
        ON CONFLICT (tenant_id, cnpj) DO NOTHING; -- Evitar duplicatas
        
        v_qualified := v_qualified + 1;
      END IF;
      
      -- Atualizar status do candidato
      UPDATE public.prospecting_candidates
      SET status = 'processed', processed_at = now()
      WHERE id = v_candidate.id;
      
      v_processed := v_processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Em caso de erro, marcar como failed mas continuar
      UPDATE public.prospecting_candidates
      SET status = 'failed', error_message = SQLERRM
      WHERE id = v_candidate.id;
      
      -- Atualizar contador de erros do job
      UPDATE public.prospect_qualification_jobs
      SET failed_count = failed_count + 1
      WHERE id = p_job_id;
    END;
  END LOOP;
  
  -- Atualizar estatísticas do job
  UPDATE public.prospect_qualification_jobs
  SET
    processed_count = processed_count + v_processed,
    enriched_count = v_qualified,
    status = 'completed',
    completed_at = now(),
    progress_percentage = 100.00
  WHERE id = p_job_id;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_processed,
    v_qualified,
    true,
    format('Processados: %s, Qualificados: %s', v_processed, v_qualified);
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION process_qualification_job(UUID, UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION process_qualification_job IS 
'Processa job de qualificação: lê prospecting_candidates, calcula fit_score e cria qualified_prospects';

