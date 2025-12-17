-- ==========================================
-- 🔧 ATUALIZAR ORIGEM DE EMPRESAS EXISTENTES
-- ==========================================
-- Este script atualiza a origem de empresas que já existem no banco,
-- buscando a origem de qualified_prospects ou raw_data
-- ==========================================

-- 0. ADICIONAR COLUNAS SE NÃO EXISTIREM
DO $$
BEGIN
  -- Adicionar coluna origem se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'companies' 
      AND column_name = 'origem'
  ) THEN
    ALTER TABLE public.companies 
      ADD COLUMN origem TEXT;
    RAISE NOTICE '✅ Coluna origem adicionada à companies';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna origem já existe em companies';
  END IF;

  -- Adicionar coluna source_name se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'companies' 
      AND column_name = 'source_name'
  ) THEN
    ALTER TABLE public.companies 
      ADD COLUMN source_name TEXT;
    RAISE NOTICE '✅ Coluna source_name adicionada à companies';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna source_name já existe em companies';
  END IF;
END $$;

-- 1. Atualizar empresas que vieram de qualified_prospects
-- Buscar origem do job de qualificação
UPDATE public.companies c
SET 
  origem = COALESCE(
    -- Prioridade 1: source_file_name do job (nome do arquivo)
    (SELECT pqj.source_file_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = c.cnpj 
       AND qp.tenant_id = c.tenant_id
       AND pqj.source_file_name IS NOT NULL
     LIMIT 1),
    -- Prioridade 2: job_name do job
    (SELECT pqj.job_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = c.cnpj 
       AND qp.tenant_id = c.tenant_id
       AND pqj.job_name IS NOT NULL
     LIMIT 1),
    -- Prioridade 3: source_name do prospect
    (SELECT qp.source_name 
     FROM public.qualified_prospects qp
     WHERE qp.cnpj = c.cnpj 
       AND qp.tenant_id = c.tenant_id
       AND qp.source_name IS NOT NULL
     LIMIT 1),
    -- Prioridade 4: origem de raw_data
    (c.raw_data->>'origem'),
    -- Prioridade 5: source_name de raw_data
    (c.raw_data->>'source_name'),
    -- Prioridade 6: source_type do job (convertido para texto amigável)
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.qualified_prospects qp
        JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
        WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id
          AND pqj.source_type = 'upload_csv'
      ) THEN 'CSV Upload'
      WHEN EXISTS (
        SELECT 1 FROM public.qualified_prospects qp
        JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
        WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id
          AND pqj.source_type = 'upload_excel'
      ) THEN 'Excel Upload'
      WHEN EXISTS (
        SELECT 1 FROM public.qualified_prospects qp
        JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
        WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id
          AND pqj.source_type = 'google_sheets'
      ) THEN 'Google Sheets'
      WHEN EXISTS (
        SELECT 1 FROM public.qualified_prospects qp
        JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
        WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id
          AND pqj.source_type = 'api_empresas_aqui'
      ) THEN 'API Empresas Aqui'
      ELSE NULL
    END,
    -- Fallback: manter origem atual ou usar default
    c.origem,
    'Legacy' -- Default final
  ),
  source_name = COALESCE(
    -- Mesma lógica da origem
    (SELECT pqj.source_file_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = c.cnpj 
       AND qp.tenant_id = c.tenant_id
       AND pqj.source_file_name IS NOT NULL
     LIMIT 1),
    (SELECT pqj.job_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = c.cnpj 
       AND qp.tenant_id = c.tenant_id
       AND pqj.job_name IS NOT NULL
     LIMIT 1),
    (SELECT qp.source_name 
     FROM public.qualified_prospects qp
     WHERE qp.cnpj = c.cnpj 
       AND qp.tenant_id = c.tenant_id
       AND qp.source_name IS NOT NULL
     LIMIT 1),
    (c.raw_data->>'origem'),
    (c.raw_data->>'source_name'),
    c.source_name,
    c.origem
  ),
  raw_data = COALESCE(
    -- Atualizar raw_data preservando tudo e adicionando origem se não existir
    CASE 
      WHEN c.raw_data IS NULL THEN 
        jsonb_build_object(
          'origem', COALESCE(
            (SELECT pqj.source_file_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            (SELECT pqj.job_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            'Legacy'
          ),
          'source_name', COALESCE(
            (SELECT pqj.source_file_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            (SELECT pqj.job_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            'Legacy'
          )
        )
      WHEN c.raw_data->>'origem' IS NULL AND c.raw_data->>'source_name' IS NULL THEN
        c.raw_data || jsonb_build_object(
          'origem', COALESCE(
            (SELECT pqj.source_file_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            (SELECT pqj.job_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            'Legacy'
          ),
          'source_name', COALESCE(
            (SELECT pqj.source_file_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            (SELECT pqj.job_name FROM public.qualified_prospects qp
             JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
             WHERE qp.cnpj = c.cnpj AND qp.tenant_id = c.tenant_id LIMIT 1),
            'Legacy'
          )
        )
      ELSE
        c.raw_data
    END
  ),
  updated_at = now()
WHERE 
  -- Apenas empresas que ainda não têm origem ou têm origem genérica
  (c.origem IS NULL 
   OR c.origem = 'Legacy' 
   OR c.origem = 'qualification_engine'
   OR c.origem = 'upload_massa')
  -- E que têm relacionamento com qualified_prospects
  AND EXISTS (
    SELECT 1 FROM public.qualified_prospects qp
    WHERE qp.cnpj = c.cnpj 
      AND qp.tenant_id = c.tenant_id
  );

-- 2. Atualizar empresas que vieram de icp_analysis_results (quarentena)
-- Buscar origem do raw_analysis ou raw_data
UPDATE public.companies c
SET 
  origem = COALESCE(
    -- Prioridade 1: origem de icp_analysis_results
    (SELECT iar.origem 
     FROM public.icp_analysis_results iar
     WHERE iar.cnpj = c.cnpj 
       AND iar.tenant_id = c.tenant_id
       AND iar.origem IS NOT NULL
     LIMIT 1),
    -- Prioridade 2: origem de raw_analysis
    (SELECT iar.raw_analysis->>'origem'
     FROM public.icp_analysis_results iar
     WHERE iar.cnpj = c.cnpj 
       AND iar.tenant_id = c.tenant_id
       AND iar.raw_analysis->>'origem' IS NOT NULL
     LIMIT 1),
    -- Prioridade 3: source_name de raw_analysis
    (SELECT iar.raw_analysis->>'source_name'
     FROM public.icp_analysis_results iar
     WHERE iar.cnpj = c.cnpj 
       AND iar.tenant_id = c.tenant_id
       AND iar.raw_analysis->>'source_name' IS NOT NULL
     LIMIT 1),
    -- Prioridade 4: origem de raw_data
    (SELECT iar.raw_data->>'origem'
     FROM public.icp_analysis_results iar
     WHERE iar.cnpj = c.cnpj 
       AND iar.tenant_id = c.tenant_id
       AND iar.raw_data->>'origem' IS NOT NULL
     LIMIT 1),
    -- Fallback: manter origem atual
    c.origem,
    'Legacy'
  ),
  source_name = COALESCE(
    (SELECT iar.raw_analysis->>'source_name'
     FROM public.icp_analysis_results iar
     WHERE iar.cnpj = c.cnpj 
       AND iar.tenant_id = c.tenant_id
       AND iar.raw_analysis->>'source_name' IS NOT NULL
     LIMIT 1),
    (SELECT iar.raw_data->>'source_name'
     FROM public.icp_analysis_results iar
     WHERE iar.cnpj = c.cnpj 
       AND iar.tenant_id = c.tenant_id
       AND iar.raw_data->>'source_name' IS NOT NULL
     LIMIT 1),
    c.source_name,
    c.origem
  ),
  updated_at = now()
WHERE 
  -- Apenas empresas que ainda não têm origem ou têm origem genérica
  (c.origem IS NULL 
   OR c.origem = 'Legacy' 
   OR c.origem = 'qualification_engine'
   OR c.origem = 'upload_massa')
  -- E que têm relacionamento com icp_analysis_results
  AND EXISTS (
    SELECT 1 FROM public.icp_analysis_results iar
    WHERE iar.cnpj = c.cnpj 
      AND iar.tenant_id = c.tenant_id
  )
  -- E que NÃO foram atualizadas no UPDATE anterior (para evitar conflito)
  AND NOT EXISTS (
    SELECT 1 FROM public.qualified_prospects qp
    WHERE qp.cnpj = c.cnpj 
      AND qp.tenant_id = c.tenant_id
  );

-- 3. Atualizar icp_analysis_results que não têm origem
-- Buscar origem de companies ou raw_data
UPDATE public.icp_analysis_results iar
SET 
  origem = COALESCE(
    -- Prioridade 1: origem de companies
    (SELECT c.origem 
     FROM public.companies c
     WHERE c.cnpj = iar.cnpj 
       AND c.tenant_id = iar.tenant_id
       AND c.origem IS NOT NULL
     LIMIT 1),
    -- Prioridade 2: origem de raw_data
    (iar.raw_data->>'origem'),
    -- Prioridade 3: source_name de raw_data
    (iar.raw_data->>'source_name'),
    -- Prioridade 4: origem de raw_analysis
    (iar.raw_analysis->>'origem'),
    -- Prioridade 5: source_name de raw_analysis
    (iar.raw_analysis->>'source_name'),
    -- Fallback
    iar.origem,
    'upload_massa'
  ),
  raw_analysis = COALESCE(
    -- Atualizar raw_analysis preservando tudo e adicionando origem se não existir
    CASE 
      WHEN iar.raw_analysis IS NULL THEN 
        jsonb_build_object(
          'origem', COALESCE(
            (SELECT c.origem FROM public.companies c
             WHERE c.cnpj = iar.cnpj AND c.tenant_id = iar.tenant_id LIMIT 1),
            (iar.raw_data->>'origem'),
            'upload_massa'
          ),
          'source_name', COALESCE(
            (SELECT c.origem FROM public.companies c
             WHERE c.cnpj = iar.cnpj AND c.tenant_id = iar.tenant_id LIMIT 1),
            (iar.raw_data->>'source_name'),
            'upload_massa'
          )
        )
      WHEN iar.raw_analysis->>'origem' IS NULL AND iar.raw_analysis->>'source_name' IS NULL THEN
        iar.raw_analysis || jsonb_build_object(
          'origem', COALESCE(
            (SELECT c.origem FROM public.companies c
             WHERE c.cnpj = iar.cnpj AND c.tenant_id = iar.tenant_id LIMIT 1),
            (iar.raw_data->>'origem'),
            'upload_massa'
          ),
          'source_name', COALESCE(
            (SELECT c.origem FROM public.companies c
             WHERE c.cnpj = iar.cnpj AND c.tenant_id = iar.tenant_id LIMIT 1),
            (iar.raw_data->>'source_name'),
            'upload_massa'
          )
        )
      ELSE
        iar.raw_analysis
    END
  ),
  updated_at = now()
WHERE 
  -- Apenas registros que não têm origem ou têm origem genérica
  (iar.origem IS NULL 
   OR iar.origem = 'upload_massa'
   OR iar.origem = 'icp_individual');

-- 4. Log de resultado
DO $$
DECLARE
  v_companies_updated integer;
  v_icp_updated integer;
BEGIN
  GET DIAGNOSTICS v_companies_updated = ROW_COUNT;
  
  SELECT COUNT(*) INTO v_icp_updated
  FROM public.icp_analysis_results
  WHERE origem IS NOT NULL 
    AND origem != 'upload_massa'
    AND origem != 'icp_individual';
  
  RAISE NOTICE '✅ Empresas atualizadas: %', v_companies_updated;
  RAISE NOTICE '✅ Registros ICP com origem: %', v_icp_updated;
END $$;

