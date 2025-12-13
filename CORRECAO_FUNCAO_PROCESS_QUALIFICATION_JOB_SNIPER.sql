-- ==========================================
-- 🔧 CORREÇÃO COMPLETA: process_qualification_job_sniper
-- ==========================================
-- Correções aplicadas:
-- 1. Removidos pontos "neutros" de setor (15 pontos) quando não há critério
-- 2. Removidos pontos "neutros" de localização (10 pontos) quando não há UF
-- 3. Corrigido source_name para usar v_candidate.source_name (se disponível)
-- ==========================================

CREATE OR REPLACE FUNCTION process_qualification_job_sniper(
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
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_candidate RECORD;
  v_icp_profile RECORD;
  v_processed_count INTEGER := 0;
  v_qualified_count INTEGER := 0;
  v_fit_score NUMERIC(5,2);
  v_grade TEXT;
  v_grade_a_plus INTEGER := 0;
  v_grade_a INTEGER := 0;
  v_grade_b INTEGER := 0;
  v_grade_c INTEGER := 0;
  v_grade_d INTEGER := 0;
  v_job_batch_id TEXT;
  v_match_breakdown jsonb;
  v_sector_match BOOLEAN;
  v_sector_score NUMERIC(5,2);
  v_location_match BOOLEAN;
  v_location_score NUMERIC(5,2);
  v_data_complete BOOLEAN;
  v_data_score NUMERIC(5,2);
  v_website_present BOOLEAN;
  v_website_score NUMERIC(5,2);
  v_contact_present BOOLEAN;
  v_contact_score NUMERIC(5,2);
  v_cnpj_normalized TEXT;
  v_cnpj_raw TEXT;
  v_source_name TEXT;
BEGIN
  -- Buscar job
  SELECT * INTO v_job
  FROM public.prospect_qualification_jobs qj
  WHERE qj.id = p_job_id
    AND qj.tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, false, 'Job não encontrado';
    RETURN;
  END IF;

  -- Reset se completed
  IF v_job.status = 'completed' THEN
    UPDATE public.prospect_qualification_jobs qj
    SET 
      status = 'pending',
      processed_count = 0,
      enriched_count = 0,
      failed_count = 0,
      grade_a_plus = 0,
      grade_a = 0,
      grade_b = 0,
      grade_c = 0,
      grade_d = 0,
      progress_percentage = 0,
      started_at = null,
      completed_at = null,
      error_message = null
    WHERE qj.id = p_job_id;

    DELETE FROM public.qualified_prospects
    WHERE job_id = p_job_id AND tenant_id = p_tenant_id;

    UPDATE public.prospecting_candidates
    SET 
      status = 'pending',
      processed_at = null,
      error_message = null
    WHERE tenant_id = p_tenant_id
      AND icp_id = v_job.icp_id
      AND source_batch_id = v_job.source_file_name;

    SELECT * INTO v_job
    FROM public.prospect_qualification_jobs qj
    WHERE qj.id = p_job_id;
  END IF;

  -- Marcar processing
  UPDATE public.prospect_qualification_jobs qj
  SET status = 'processing', started_at = now()
  WHERE qj.id = p_job_id;

  -- Buscar ICP profile (se houver)
  IF v_job.icp_id IS NOT NULL THEN
    SELECT * INTO v_icp_profile
    FROM public.icp_profiles_metadata ic
    WHERE ic.id = v_job.icp_id
      AND ic.tenant_id = p_tenant_id;
  END IF;

  v_job_batch_id := v_job.source_file_name;

  -- Loop candidatos
  FOR v_candidate IN
    SELECT * FROM public.prospecting_candidates pc
    WHERE pc.tenant_id = p_tenant_id
      AND pc.icp_id = v_job.icp_id
      AND pc.source_batch_id = v_job_batch_id
      AND pc.status = 'pending'
    ORDER BY pc.created_at
    LIMIT 1000
  LOOP
    BEGIN
      -- Validar CNPJ e nome
      IF v_candidate.cnpj IS NULL OR v_candidate.company_name IS NULL THEN
        UPDATE public.prospecting_candidates
        SET status = 'failed', error_message = 'CNPJ ou nome da empresa ausente'
        WHERE id = v_candidate.id;

        UPDATE public.prospect_qualification_jobs qj
        SET failed_count = COALESCE(qj.failed_count, 0) + 1
        WHERE qj.id = p_job_id;
        CONTINUE;
      END IF;

      -- Normalizar CNPJ
      v_cnpj_normalized := REGEXP_REPLACE(COALESCE(v_candidate.cnpj, ''), '[^0-9]', '', 'g');

      IF LENGTH(v_cnpj_normalized) != 14 THEN
        UPDATE public.prospecting_candidates
        SET status = 'failed', error_message = 'CNPJ inválido após normalização (deve ter 14 dígitos): ' || v_candidate.cnpj
        WHERE id = v_candidate.id;

        UPDATE public.prospect_qualification_jobs qj
        SET failed_count = COALESCE(qj.failed_count, 0) + 1
        WHERE qj.id = p_job_id;
        CONTINUE;
      END IF;

      v_cnpj_raw := CASE WHEN v_candidate.cnpj <> v_cnpj_normalized
                         THEN v_candidate.cnpj
                         ELSE COALESCE(v_candidate.cnpj_raw, v_cnpj_normalized)
                    END;

      -- 🔥 FIX: Determinar source_name (priorizar do candidato, depois do job)
      v_source_name := COALESCE(v_candidate.source_name, v_job.source_file_name, v_job.job_name);

      -- Scoring
      v_fit_score := 0;
      v_match_breakdown := '[]'::jsonb;
      v_sector_match := false; v_sector_score := 0;
      v_location_match := false; v_location_score := 0;
      v_data_complete := false; v_data_score := 0;
      v_website_present := false; v_website_score := 0;
      v_contact_present := false; v_contact_score := 0;

      -- 1. Setor match (30%) - se ICP tiver setor_foco
      -- 🔥 FIX: Não adicionar pontos quando não há critério de matching
      IF v_icp_profile IS NOT NULL AND v_icp_profile.setor_foco IS NOT NULL THEN
        IF v_candidate.sector IS NOT NULL AND 
           LOWER(v_candidate.sector) LIKE '%' || LOWER(v_icp_profile.setor_foco) || '%' THEN
          v_sector_match := true;
          v_sector_score := 30;
          v_fit_score := v_fit_score + 30;
        ELSE
          -- Setor não corresponde - 0 pontos (não negativo, apenas sem pontos)
          v_sector_score := 0;
        END IF;
      ELSE
        -- Sem critério específico de setor - 0 pontos (não adicionar pontos "neutros")
        v_sector_score := 0;
      END IF;

      -- 2. Localização (25%)
      -- 🔥 FIX: Não adicionar pontos quando não há UF
      IF v_candidate.uf IS NOT NULL AND v_candidate.uf <> '' THEN
        v_location_match := true;
        v_location_score := 25;
        v_fit_score := v_fit_score + 25;
      ELSE
        -- Sem UF - 0 pontos (não adicionar pontos "neutros")
        v_location_score := 0;
      END IF;

      -- 3. Dados completos (20%)
      IF v_candidate.cnpj IS NOT NULL AND v_candidate.company_name IS NOT NULL THEN
        v_data_complete := true;
        v_data_score := 20;
        v_fit_score := v_fit_score + 20;
      END IF;

      -- 4. Website (15%)
      IF v_candidate.website IS NOT NULL AND v_candidate.website <> '' THEN
        v_website_present := true;
        v_website_score := 15;
        v_fit_score := v_fit_score + 15;
      END IF;

      -- 5. Contato (10%)
      IF (v_candidate.contact_email IS NOT NULL AND v_candidate.contact_email <> '') OR
         (v_candidate.contact_phone IS NOT NULL AND v_candidate.contact_phone <> '') THEN
        v_contact_present := true;
        v_contact_score := 10;
        v_fit_score := v_fit_score + 10;
      END IF;

      v_fit_score := LEAST(v_fit_score, 100);

      -- Grade
      IF v_fit_score >= 90 THEN
        v_grade := 'A+'; v_grade_a_plus := v_grade_a_plus + 1;
      ELSIF v_fit_score >= 75 THEN
        v_grade := 'A'; v_grade_a := v_grade_a + 1;
      ELSIF v_fit_score >= 60 THEN
        v_grade := 'B'; v_grade_b := v_grade_b + 1;
      ELSIF v_fit_score >= 40 THEN
        v_grade := 'C'; v_grade_c := v_grade_c + 1;
      ELSE
        v_grade := 'D'; v_grade_d := v_grade_d + 1;
      END IF;

      -- Breakdown
      v_match_breakdown := jsonb_build_object(
        'sector_match', v_sector_match,
        'sector_score', v_sector_score,
        'location_match', v_location_match,
        'location_score', v_location_score,
        'data_complete', v_data_complete,
        'data_score', v_data_score,
        'website_present', v_website_present,
        'website_score', v_website_score,
        'contact_present', v_contact_present,
        'contact_score', v_contact_score
      );

      -- Upsert
      INSERT INTO public.qualified_prospects (
        tenant_id, job_id, icp_id, cnpj, cnpj_raw, razao_social,
        cidade, estado, setor, website, fit_score, grade,
        sector_fit_score, geo_fit_score, fit_reasons, source_name,
        created_at, updated_at
      )
      VALUES (
        p_tenant_id, p_job_id, v_job.icp_id, v_cnpj_normalized, v_cnpj_raw, v_candidate.company_name,
        v_candidate.city, v_candidate.uf, v_candidate.sector, v_candidate.website, v_fit_score, v_grade,
        v_sector_score, v_location_score, v_match_breakdown, v_source_name,
        now(), now()
      )
      ON CONFLICT (tenant_id, cnpj) DO UPDATE
      SET job_id = EXCLUDED.job_id,
          fit_score = EXCLUDED.fit_score,
          grade = EXCLUDED.grade,
          source_name = EXCLUDED.source_name,
          updated_at = now();

      -- Marcar processado
      UPDATE public.prospecting_candidates
      SET status = 'processed', processed_at = now()
      WHERE id = v_candidate.id;

      v_processed_count := v_processed_count + 1;
      v_qualified_count := v_qualified_count + 1;

    EXCEPTION WHEN OTHERS THEN
      UPDATE public.prospecting_candidates
      SET status = 'failed', error_message = SQLERRM
      WHERE id = v_candidate.id;

      UPDATE public.prospect_qualification_jobs qj
      SET failed_count = COALESCE(qj.failed_count, 0) + 1
      WHERE qj.id = p_job_id;
    END;
  END LOOP;

  -- Finalizar job
  UPDATE public.prospect_qualification_jobs qj
  SET status = 'completed',
      processed_count = v_processed_count,
      qualified_count = v_qualified_count,
      grade_a_plus = v_grade_a_plus,
      grade_a = v_grade_a,
      grade_b = v_grade_b,
      grade_c = v_grade_c,
      grade_d = v_grade_d,
      progress_percentage = 100,
      completed_at = now()
  WHERE qj.id = p_job_id;

  -- Retorno
  RETURN QUERY SELECT
    v_processed_count,
    v_qualified_count,
    true,
    'Processamento concluído com sucesso';

END;
$$;

