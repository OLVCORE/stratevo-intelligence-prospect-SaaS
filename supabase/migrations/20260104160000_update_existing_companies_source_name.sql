-- ==========================================
-- ATUALIZAR source_name DE EMPRESAS EXISTENTES
-- ==========================================
-- Extrai source_name de raw_data para empresas que ainda não têm source_name preenchido

-- 0. CRIAR COLUNA source_name SE NÃO EXISTIR
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS source_name TEXT;

-- 1. ATUALIZAR companies.source_name a partir de qualified_prospects (ORIGEM PRINCIPAL)
-- ✅ TRANSFERIR source_name DE qualified_prospects PARA companies (vital para rastreabilidade)
UPDATE public.companies c
SET 
  source_name = COALESCE(
    -- Se source_name já existe e NÃO é batch ID, mantém
    CASE 
      WHEN c.source_name IS NOT NULL 
           AND c.source_name NOT LIKE 'batch-%' 
           AND c.source_name NOT LIKE '%batch-%' 
      THEN c.source_name
      ELSE NULL
    END,
    -- ✅ PRIORIDADE 1: Buscar de qualified_prospects (ORIGEM PRINCIPAL)
    (SELECT qp.source_name 
     FROM public.qualified_prospects qp
     WHERE qp.cnpj = c.cnpj
       AND qp.tenant_id = c.tenant_id
       AND qp.source_name IS NOT NULL
       AND qp.source_name NOT LIKE 'batch-%'
       AND qp.source_name NOT LIKE '%batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- ✅ PRIORIDADE 2: Buscar source_file_name do job relacionado
    (SELECT pqj.source_file_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = c.cnpj
       AND qp.tenant_id = c.tenant_id
       AND pqj.source_file_name IS NOT NULL
       AND pqj.source_file_name NOT LIKE 'batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- ✅ PRIORIDADE 3: Buscar job_name do job relacionado
    (SELECT pqj.job_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = c.cnpj
       AND qp.tenant_id = c.tenant_id
       AND pqj.job_name IS NOT NULL
       AND pqj.job_name NOT LIKE 'batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- Prioridade 4: raw_data > outros campos
    c.raw_data->>'source_name',
    c.raw_data->>'origem',
    c.raw_data->>'origem_original',
    c.raw_data->>'source_file_name',
    c.raw_data->>'source',
    c.raw_data->>'import_batch_name',
    c.raw_data->>'batch_name',
    -- Fallback se nada for encontrado
    CASE 
      WHEN c.raw_data->>'source' IS NOT NULL THEN 'Importação em lote'
      ELSE NULL
    END
  ),
  updated_at = NOW()
WHERE 
  -- Atualiza quando source_name é NULL ou é um batch ID
  (c.source_name IS NULL 
   OR c.source_name LIKE 'batch-%' 
   OR c.source_name LIKE '%batch-%')
  AND (
    -- Tem relacionamento com qualified_prospects
    EXISTS (
      SELECT 1 FROM public.qualified_prospects qp
      WHERE qp.cnpj = c.cnpj
        AND qp.tenant_id = c.tenant_id
    )
    -- OU tem dados em raw_data
    OR c.raw_data->>'source_name' IS NOT NULL 
    OR c.raw_data->>'origem' IS NOT NULL
    OR c.raw_data->>'origem_original' IS NOT NULL
    OR c.raw_data->>'source_file_name' IS NOT NULL
    OR c.raw_data->>'source' IS NOT NULL
    OR c.raw_data->>'import_batch_name' IS NOT NULL
    OR c.raw_data->>'batch_name' IS NOT NULL
  );

-- 2. CRIAR COLUNA source_name EM icp_analysis_results SE NÃO EXISTIR
ALTER TABLE public.icp_analysis_results
ADD COLUMN IF NOT EXISTS source_name TEXT;

-- 3. ATUALIZAR icp_analysis_results.source_name a partir de qualified_prospects (ORIGEM PRINCIPAL)
-- ✅ TRANSFERIR source_name DE qualified_prospects PARA icp_analysis_results
UPDATE public.icp_analysis_results iar
SET 
  source_name = COALESCE(
    iar.source_name, -- Se já tem, mantém
    -- ✅ PRIORIDADE 1: Buscar de qualified_prospects (ORIGEM PRINCIPAL)
    (SELECT qp.source_name 
     FROM public.qualified_prospects qp
     WHERE qp.cnpj = iar.cnpj
       AND qp.tenant_id = iar.tenant_id
       AND qp.source_name IS NOT NULL
       AND qp.source_name NOT LIKE 'batch-%'
       AND qp.source_name NOT LIKE '%batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- ✅ PRIORIDADE 2: Buscar source_file_name do job relacionado
    (SELECT pqj.source_file_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = iar.cnpj
       AND qp.tenant_id = iar.tenant_id
       AND pqj.source_file_name IS NOT NULL
       AND pqj.source_file_name NOT LIKE 'batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- ✅ PRIORIDADE 3: Buscar job_name do job relacionado
    (SELECT pqj.job_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = iar.cnpj
       AND qp.tenant_id = iar.tenant_id
       AND pqj.job_name IS NOT NULL
       AND pqj.job_name NOT LIKE 'batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- Prioridade 4: raw_analysis > raw_data
    iar.raw_analysis->>'source_name',
    iar.raw_analysis->>'origem_original',
    iar.raw_analysis->>'source_file_name',
    iar.raw_data->>'source_name',
    iar.raw_data->>'origem'
  ),
  updated_at = NOW()
WHERE 
  (iar.source_name IS NULL 
   OR iar.source_name LIKE 'batch-%' 
   OR iar.source_name LIKE '%batch-%')
  AND (
    -- Tem relacionamento com qualified_prospects
    EXISTS (
      SELECT 1 FROM public.qualified_prospects qp
      WHERE qp.cnpj = iar.cnpj
        AND qp.tenant_id = iar.tenant_id
    )
    -- OU tem dados em raw_analysis ou raw_data
    OR iar.raw_analysis->>'source_name' IS NOT NULL 
    OR iar.raw_analysis->>'origem_original' IS NOT NULL
    OR iar.raw_analysis->>'source_file_name' IS NOT NULL
    OR iar.raw_data->>'source_name' IS NOT NULL
    OR iar.raw_data->>'origem' IS NOT NULL
  );

-- 4. ATUALIZAR qualified_prospects.source_name a partir de job ou enrichment_data
UPDATE public.qualified_prospects qp
SET 
  source_name = COALESCE(
    qp.source_name, -- Se já tem, mantém
    -- Tenta buscar do job relacionado
    (SELECT source_file_name FROM public.prospect_qualification_jobs WHERE id = qp.job_id),
    (SELECT job_name FROM public.prospect_qualification_jobs WHERE id = qp.job_id),
    -- Tenta buscar de enrichment_data
    qp.enrichment_data->>'source_name',
    qp.enrichment_data->>'origem',
    -- Fallback
    'Motor de Qualificação'
  ),
  updated_at = NOW()
WHERE 
  qp.source_name IS NULL 
  AND (
    qp.job_id IS NOT NULL 
    OR qp.enrichment_data->>'source_name' IS NOT NULL
    OR qp.enrichment_data->>'origem' IS NOT NULL
  );

-- 4. CRIAR COLUNA source_name EM leads_quarantine SE NÃO EXISTIR
ALTER TABLE public.leads_quarantine
ADD COLUMN IF NOT EXISTS source_name TEXT;

-- 5. ATUALIZAR leads_quarantine.source_name a partir de qualified_prospects (ORIGEM PRINCIPAL)
-- ✅ TRANSFERIR source_name DE qualified_prospects PARA leads_quarantine
UPDATE public.leads_quarantine lq
SET 
  source_name = COALESCE(
    lq.source_name, -- Se já tem, mantém
    -- ✅ PRIORIDADE 1: Buscar de qualified_prospects (ORIGEM PRINCIPAL)
    (SELECT qp.source_name 
     FROM public.qualified_prospects qp
     WHERE qp.cnpj = lq.cnpj
       AND qp.source_name IS NOT NULL
       AND qp.source_name NOT LIKE 'batch-%'
       AND qp.source_name NOT LIKE '%batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- ✅ PRIORIDADE 2: Buscar source_file_name do job relacionado
    (SELECT pqj.source_file_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = lq.cnpj
       AND pqj.source_file_name IS NOT NULL
       AND pqj.source_file_name NOT LIKE 'batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- ✅ PRIORIDADE 3: Buscar job_name do job relacionado
    (SELECT pqj.job_name 
     FROM public.qualified_prospects qp
     JOIN public.prospect_qualification_jobs pqj ON qp.job_id = pqj.id
     WHERE qp.cnpj = lq.cnpj
       AND pqj.job_name IS NOT NULL
       AND pqj.job_name NOT LIKE 'batch-%'
     ORDER BY qp.created_at DESC
     LIMIT 1),
    -- Prioridade 4: source_metadata > enriched_data
    lq.source_metadata->>'source_name',
    lq.source_metadata->>'origem_original',
    lq.source_metadata->>'source_file_name',
    lq.enriched_data->>'source_name',
    lq.enriched_data->>'origem'
  ),
  updated_at = NOW()
WHERE 
  (lq.source_name IS NULL 
   OR lq.source_name LIKE 'batch-%' 
   OR lq.source_name LIKE '%batch-%')
  AND (
    -- Tem relacionamento com qualified_prospects
    EXISTS (
      SELECT 1 FROM public.qualified_prospects qp
      WHERE qp.cnpj = lq.cnpj
    )
    -- OU tem dados em source_metadata ou enriched_data
    OR lq.source_metadata->>'source_name' IS NOT NULL 
    OR lq.source_metadata->>'origem_original' IS NOT NULL
    OR lq.source_metadata->>'source_file_name' IS NOT NULL
    OR lq.enriched_data->>'source_name' IS NOT NULL
    OR lq.enriched_data->>'origem' IS NOT NULL
  );

-- 6. COMENTÁRIOS
COMMENT ON COLUMN public.companies.source_name IS 'Nome da fonte de origem da empresa (ex: "Fab.B Capital - Sudeste", "Prospecção Q1 2025")';
COMMENT ON COLUMN public.icp_analysis_results.source_name IS 'Nome da fonte de origem da análise (ex: "Fab.B Capital - Sudeste", "Prospecção Q1 2025")';
COMMENT ON COLUMN public.qualified_prospects.source_name IS 'Nome da fonte de origem do prospect (ex: "Fab.B Capital - Sudeste", "Prospecção Q1 2025")';
COMMENT ON COLUMN public.leads_quarantine.source_name IS 'Nome da fonte de origem do lead em quarentena (ex: "Fab.B Capital - Sudeste", "Prospecção Q1 2025")';

