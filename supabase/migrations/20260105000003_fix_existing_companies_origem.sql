-- ==========================================
-- FIX: Atualizar origem de empresas existentes que estão com "Legacy" ou NULL
-- ==========================================
-- Problema: Empresas promovidas anteriormente não têm origem preenchida
-- Solução: Buscar origem de raw_data ou qualified_prospects e atualizar
-- ==========================================

-- 1. PRIMEIRO: Atualizar a partir de qualified_prospects (ORIGEM MAIS CONFIÁVEL)
UPDATE public.companies c
SET 
  origem = COALESCE(
    c.origem, -- Manter se já tiver valor válido (não Legacy)
    qp.source_name,
    pj.source_file_name,
    pj.job_name,
    CASE pj.source_type
      WHEN 'upload_csv' THEN 'CSV Upload'
      WHEN 'upload_excel' THEN 'Excel Upload'
      WHEN 'google_sheets' THEN 'Google Sheets'
      WHEN 'api_empresas_aqui' THEN 'API Empresas Aqui'
      ELSE 'Motor de Qualificação'
    END
  ),
  source_name = COALESCE(
    c.source_name, -- Manter se já tiver valor válido (não batch)
    qp.source_name,
    pj.source_file_name,
    pj.job_name,
    c.origem, -- Usar origem se source_name estiver vazio
    CASE pj.source_type
      WHEN 'upload_csv' THEN 'CSV Upload'
      WHEN 'upload_excel' THEN 'Excel Upload'
      WHEN 'google_sheets' THEN 'Google Sheets'
      WHEN 'api_empresas_aqui' THEN 'API Empresas Aqui'
      ELSE 'Motor de Qualificação'
    END
  ),
  updated_at = now()
FROM public.qualified_prospects qp
LEFT JOIN public.prospect_qualification_jobs pj ON qp.job_id = pj.id
WHERE 
  c.cnpj = qp.cnpj
  AND c.tenant_id = qp.tenant_id
  AND (c.origem IS NULL OR c.origem = '' OR c.origem = 'Legacy')
  AND (
    qp.source_name IS NOT NULL OR
    pj.source_file_name IS NOT NULL OR
    pj.job_name IS NOT NULL
  );

-- 2. SEGUNDO: Atualizar empresas que têm origem NULL ou 'Legacy', buscando de raw_data
UPDATE public.companies
SET 
  origem = COALESCE(
    origem, -- Manter se já tiver valor válido
    NULLIF((raw_data->>'origem')::text, 'Legacy'),
    NULLIF((raw_data->>'source_name')::text, 'Legacy'),
    NULLIF((raw_data->>'source_file_name')::text, ''),
    NULLIF((raw_data->>'job_name')::text, ''),
    NULLIF((raw_data->>'source_file_name')::text, '')
  ),
  source_name = COALESCE(
    source_name, -- Manter se já tiver valor válido
    NULLIF((raw_data->>'source_name')::text, 'Legacy'),
    NULLIF((raw_data->>'origem')::text, 'Legacy'),
    NULLIF((raw_data->>'source_file_name')::text, ''),
    NULLIF((raw_data->>'job_name')::text, ''),
    origem -- Usar origem se source_name estiver vazio
  ),
  updated_at = now()
WHERE 
  (origem IS NULL OR origem = '' OR origem = 'Legacy')
  AND raw_data IS NOT NULL
  AND (
    (raw_data->>'origem') IS NOT NULL OR
    (raw_data->>'source_name') IS NOT NULL OR
    (raw_data->>'source_file_name') IS NOT NULL OR
    (raw_data->>'job_name') IS NOT NULL
  )
  AND (
    NULLIF((raw_data->>'origem')::text, 'Legacy') IS NOT NULL OR
    NULLIF((raw_data->>'source_name')::text, 'Legacy') IS NOT NULL OR
    (raw_data->>'source_file_name') IS NOT NULL OR
    (raw_data->>'job_name') IS NOT NULL
  );

-- 3. TERCEIRO: Atualizar empresas que têm source_name como batch ID, buscando de raw_data
UPDATE public.companies
SET 
  origem = COALESCE(
    origem, -- Manter se já tiver valor válido
    NULLIF((raw_data->>'origem')::text, 'Legacy'),
    NULLIF((raw_data->>'source_name')::text, 'Legacy'),
    NULLIF((raw_data->>'source_file_name')::text, ''),
    NULLIF((raw_data->>'job_name')::text, '')
  ),
  source_name = COALESCE(
    NULLIF((raw_data->>'source_name')::text, 'Legacy'),
    NULLIF((raw_data->>'origem')::text, 'Legacy'),
    NULLIF((raw_data->>'source_file_name')::text, ''),
    NULLIF((raw_data->>'job_name')::text, ''),
    origem -- Usar origem se source_name estiver vazio
  ),
  updated_at = now()
WHERE 
  (source_name LIKE 'batch-%' OR source_name IS NULL OR source_name = '')
  AND raw_data IS NOT NULL
  AND (
    NULLIF((raw_data->>'origem')::text, 'Legacy') IS NOT NULL OR
    NULLIF((raw_data->>'source_name')::text, 'Legacy') IS NOT NULL OR
    (raw_data->>'source_file_name') IS NOT NULL OR
    (raw_data->>'job_name') IS NOT NULL
  );

-- Log de resultado
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM public.companies
  WHERE updated_at > now() - INTERVAL '1 minute';
  
  RAISE NOTICE '✅ Empresas atualizadas: %', v_updated_count;
END $$;

-- Comentário
COMMENT ON COLUMN public.companies.origem IS 'Origem da empresa: nome do arquivo de upload, job_name ou tipo de origem. Atualizado automaticamente de raw_data ou qualified_prospects.';
COMMENT ON COLUMN public.companies.source_name IS 'Nome da fonte de origem da empresa. Atualizado automaticamente de raw_data ou qualified_prospects.';

