-- ==========================================
-- CORREÇÃO: Fazer process_qualification_job realmente qualificar candidatos
-- ==========================================
-- Problema: Job marca como concluído mas não processa candidatos nem cria qualified_prospects
-- Solução: Implementar lógica real de qualificação baseada em dados reais
-- 
-- ✅ ATUALIZAÇÃO: Inclui normalização de CNPJ e salvamento de cnpj_raw

-- 1) Garantir índice/constraint única para (tenant_id, cnpj) em qualified_prospects

DO $$

DECLARE
  has_unique boolean := false;

BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'qualified_prospects'
      AND indexname IN (
        -- cobre nomes comuns de índices/constraints
        'qualified_prospects_tenant_id_cnpj_key',
        'qualified_prospects_tenant_id_cnpj_idx',
        'qualified_prospects_tenant_cnpj_key',
        'qualified_prospects_tenant_cnpj_idx'
      )
  ) INTO has_unique;

  -- Checa também via catálogos se já há qualquer índice único exatamente nessas colunas
  IF NOT has_unique THEN
    SELECT EXISTS (
      SELECT 1
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'qualified_prospects'
        AND ix.indisunique = true
        AND (SELECT array_agg(attname ORDER BY attnum)
             FROM pg_attribute
             WHERE attrelid = t.oid AND attnum = ANY(ix.indkey))
            = ARRAY['tenant_id','cnpj']
    ) INTO has_unique;
  END IF;

  IF NOT has_unique THEN
    -- Cria UNIQUE CONSTRAINT de forma segura
    BEGIN
      ALTER TABLE public.qualified_prospects
      ADD CONSTRAINT qualified_prospects_tenant_id_cnpj_key
      UNIQUE (tenant_id, cnpj);
    EXCEPTION
      WHEN duplicate_table THEN
        -- Caso de corrida: outro processo criou, ignore
        NULL;
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- 2) Função process_qualification_job completa e corrigida

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
  v_processed_count INTEGER := 0;
  v_qualified_count INTEGER := 0;
  v_fit_score NUMERIC;
  v_grade TEXT;
  v_grade_a_plus INTEGER := 0;
  v_grade_a INTEGER := 0;
  v_grade_b INTEGER := 0;
  v_grade_c INTEGER := 0;
  v_grade_d INTEGER := 0;
  v_job_batch_id TEXT;
  v_match_breakdown jsonb;
  v_sector_match BOOLEAN;
  v_sector_score NUMERIC;
  v_location_match BOOLEAN;
  v_location_score NUMERIC;
  v_data_complete BOOLEAN;
  v_data_score NUMERIC;
  v_website_present BOOLEAN;
  v_website_score NUMERIC;
  v_contact_present BOOLEAN;
  v_contact_score NUMERIC;
  -- ✅ Variáveis para normalização de CNPJ
  v_cnpj_normalized TEXT;
  v_cnpj_raw TEXT;
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

  -- ICP profile
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
      -- ✅ VALIDAÇÃO: Pular candidatos sem CNPJ ou empresa
      IF v_candidate.cnpj IS NULL OR v_candidate.company_name IS NULL THEN
        UPDATE public.prospecting_candidates
        SET status = 'failed', error_message = 'CNPJ ou nome da empresa ausente'
        WHERE id = v_candidate.id;

        UPDATE public.prospect_qualification_jobs qj
        SET failed_count = COALESCE(qj.failed_count, 0) + 1
        WHERE qj.id = p_job_id;

        CONTINUE;
      END IF;

      -- ✅ NORMALIZAÇÃO OBRIGATÓRIA: Normalizar CNPJ antes de processar
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

      -- Se cnpj original tinha formatação, usar como raw; senão, usar normalizado
      IF v_candidate.cnpj != v_cnpj_normalized THEN
        v_cnpj_raw := v_candidate.cnpj;
      ELSE
        v_cnpj_raw := COALESCE(v_candidate.cnpj_raw, v_cnpj_normalized);
      END IF;

      -- ✅ Calcular fit_score baseado em critérios reais com match_breakdown
      v_fit_score := 0;
      v_match_breakdown := '[]'::jsonb;
      v_sector_match := false;
      v_sector_score := 0;
      v_location_match := false;
      v_location_score := 0;
      v_data_complete := false;
      v_data_score := 0;
      v_website_present := false;
      v_website_score := 0;
      v_contact_present := false;
      v_contact_score := 0;

      -- 1. Setor match (30%) - se ICP tiver setor_foco
      IF v_icp_profile IS NOT NULL AND v_icp_profile.setor_foco IS NOT NULL THEN
        IF v_candidate.sector IS NOT NULL AND 
           LOWER(v_candidate.sector) LIKE '%' || LOWER(v_icp_profile.setor_foco) || '%' THEN
          v_sector_match := true;
          v_sector_score := 30;
          v_fit_score := v_fit_score + 30;
        END IF;
      ELSE
        -- Sem critério específico, score neutro
        v_sector_score := 15;
        v_fit_score := v_fit_score + 15;
      END IF;

      -- 2. Localização (25%)
      IF v_candidate.uf IS NOT NULL AND v_candidate.uf != '' THEN
        v_location_match := true;
        v_location_score := 25;
        v_fit_score := v_fit_score + 25;
      ELSE
        v_location_score := 10;
        v_fit_score := v_fit_score + 10;
      END IF;

      -- 3. Dados completos (20%)
      IF v_candidate.cnpj IS NOT NULL AND v_candidate.company_name IS NOT NULL THEN
        v_data_complete := true;
        v_data_score := 20;
        v_fit_score := v_fit_score + 20;
      END IF;

      -- 4. Website (15%)
      IF v_candidate.website IS NOT NULL AND v_candidate.website != '' THEN
        v_website_present := true;
        v_website_score := 15;
        v_fit_score := v_fit_score + 15;
      END IF;

      -- 5. Contatos (10%)
      IF (v_candidate.contact_email IS NOT NULL AND v_candidate.contact_email != '') OR
         (v_candidate.contact_phone IS NOT NULL AND v_candidate.contact_phone != '') THEN
        v_contact_present := true;
        v_contact_score := 10;
        v_fit_score := v_fit_score + 10;
      END IF;

      -- ✅ Match breakdown detalhado
      v_match_breakdown := jsonb_build_array(
        jsonb_build_object('criteria','sector_match','label','Setor','weight',0.30,'matched',v_sector_match,'score',v_sector_score),
        jsonb_build_object('criteria','location_match','label','Localização','weight',0.25,'matched',v_location_match,'score',v_location_score),
        jsonb_build_object('criteria','data_complete','label','Dados Completos','weight',0.20,'matched',v_data_complete,'score',v_data_score),
        jsonb_build_object('criteria','website_present','label','Website','weight',0.15,'matched',v_website_present,'score',v_website_score),
        jsonb_build_object('criteria','contact_present','label','Contatos','weight',0.10,'matched',v_contact_present,'score',v_contact_score)
      );

      -- Determinar grade baseado no fit_score
      IF v_fit_score >= 95 THEN
        v_grade := 'A+';
        v_grade_a_plus := v_grade_a_plus + 1;
      ELSIF v_fit_score >= 85 THEN
        v_grade := 'A';
        v_grade_a := v_grade_a + 1;
      ELSIF v_fit_score >= 70 THEN
        v_grade := 'B';
        v_grade_b := v_grade_b + 1;
      ELSIF v_fit_score >= 60 THEN
        v_grade := 'C';
        v_grade_c := v_grade_c + 1;
      ELSE
        v_grade := 'D';
        v_grade_d := v_grade_d + 1;
      END IF;

      -- ✅ Inserir/atualizar em qualified_prospects (TODAS as empresas, independente do score)
      INSERT INTO public.qualified_prospects (
        tenant_id, job_id, icp_id, cnpj, cnpj_raw,
        razao_social, nome_fantasia, cidade, estado, setor,
        website, fit_score, grade, match_breakdown,
        pipeline_status, created_at
      )
      VALUES (
        p_tenant_id, p_job_id, v_job.icp_id,
        v_cnpj_normalized,            -- ✅ CNPJ normalizado (14 dígitos)
        v_cnpj_raw,                   -- ✅ CNPJ original (com máscara se disponível)
        v_candidate.company_name,     -- ✅ razao_social (nunca "Empresa sem nome")
        v_candidate.nome_fantasia,    -- ✅ nome_fantasia (copiado de prospecting_candidates)
        v_candidate.city,
        v_candidate.uf,
        v_candidate.sector,
        v_candidate.website,
        v_fit_score,
        v_grade,
        v_match_breakdown,
        'new',
        now()
      )
      ON CONFLICT (tenant_id, cnpj) DO UPDATE
      SET
        cnpj_raw = COALESCE(EXCLUDED.cnpj_raw, qualified_prospects.cnpj_raw), -- ✅ Preservar raw se já existir
        job_id = EXCLUDED.job_id,
        icp_id = EXCLUDED.icp_id,
        fit_score = EXCLUDED.fit_score,
        grade = EXCLUDED.grade,
        match_breakdown = EXCLUDED.match_breakdown,
        razao_social = COALESCE(EXCLUDED.razao_social, qualified_prospects.razao_social), -- ✅ Não sobrescrever com null
        nome_fantasia = COALESCE(EXCLUDED.nome_fantasia, qualified_prospects.nome_fantasia),
        cidade = COALESCE(EXCLUDED.cidade, qualified_prospects.cidade),
        estado = COALESCE(EXCLUDED.estado, qualified_prospects.estado),
        setor = COALESCE(EXCLUDED.setor, qualified_prospects.setor),
        website = COALESCE(EXCLUDED.website, qualified_prospects.website),
        updated_at = now();

      v_qualified_count := v_qualified_count + 1;

      -- Atualizar status do candidato
      UPDATE public.prospecting_candidates
      SET status = 'processed', processed_at = now()
      WHERE id = v_candidate.id;

      v_processed_count := v_processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      UPDATE public.prospecting_candidates
      SET status = 'failed', error_message = SQLERRM
      WHERE id = v_candidate.id;

      UPDATE public.prospect_qualification_jobs qj
      SET failed_count = COALESCE(qj.failed_count, 0) + 1
      WHERE qj.id = p_job_id;
    END;
  END LOOP;

  -- Atualizar contadores e status do job
  UPDATE public.prospect_qualification_jobs qj
  SET
    processed_count = v_processed_count,
    enriched_count = v_qualified_count,
    grade_a_plus = v_grade_a_plus,
    grade_a = v_grade_a,
    grade_b = v_grade_b,
    grade_c = v_grade_c,
    grade_d = v_grade_d,
    status = 'completed',
    completed_at = now(),
    progress_percentage = CASE 
      WHEN qj.total_cnpjs > 0 THEN (v_processed_count::numeric / qj.total_cnpjs::numeric * 100.0)
      ELSE 100.0
    END
  WHERE qj.id = p_job_id;

  RETURN QUERY SELECT 
    v_processed_count,
    v_qualified_count,
    true,
    format(
      'Processados: %s, Qualificados: %s (A+: %s, A: %s, B: %s, C: %s, D: %s)',
      v_processed_count, v_qualified_count,
      v_grade_a_plus, v_grade_a, v_grade_b, v_grade_c, v_grade_d
    );
END;
$$;

GRANT EXECUTE ON FUNCTION process_qualification_job(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION process_qualification_job IS 
'Processa job de qualificação: lê prospecting_candidates, calcula fit_score real e cria qualified_prospects. CORRIGIDO: agora realmente processa e qualifica candidatos com normalização de CNPJ e salvamento de cnpj_raw.';
