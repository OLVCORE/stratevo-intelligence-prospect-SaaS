-- ==========================================
-- CORREÇÃO DIRETA: Transferir source_name para companies e icp_analysis_results
-- Execute este SQL diretamente no Supabase SQL Editor
-- NOTA: A página "Quarentena ICP" usa icp_analysis_results, não leads_quarantine
-- ==========================================

-- 1. Criar colunas source_name se não existirem
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS source_name TEXT;

ALTER TABLE public.icp_analysis_results
ADD COLUMN IF NOT EXISTS source_name TEXT;

-- 2. Transferir source_name de qualified_prospects para companies
UPDATE public.companies c
SET 
  source_name = (
    SELECT qp.source_name 
    FROM public.qualified_prospects qp
    WHERE qp.cnpj = c.cnpj
      AND qp.tenant_id = c.tenant_id
      AND qp.source_name IS NOT NULL
      AND qp.source_name NOT LIKE 'batch-%'
      AND qp.source_name NOT LIKE '%batch-%'
      AND qp.source_name != 'Legacy'
    ORDER BY qp.created_at DESC
    LIMIT 1
  ),
  updated_at = NOW()
WHERE 
  (c.source_name IS NULL 
   OR c.source_name LIKE 'batch-%'
   OR c.source_name LIKE '%batch-%'
   OR c.source_name = 'Legacy')
  AND EXISTS (
    SELECT 1 FROM public.qualified_prospects qp
    WHERE qp.cnpj = c.cnpj
      AND qp.tenant_id = c.tenant_id
      AND qp.source_name IS NOT NULL
      AND qp.source_name NOT LIKE 'batch-%'
      AND qp.source_name != 'Legacy'
  );

-- 3. Transferir source_name de qualified_prospects para icp_analysis_results (Quarentena ICP)
UPDATE public.icp_analysis_results iar
SET 
  source_name = (
    SELECT qp.source_name 
    FROM public.qualified_prospects qp
    WHERE qp.cnpj = iar.cnpj
      AND qp.tenant_id = iar.tenant_id
      AND qp.source_name IS NOT NULL
      AND qp.source_name NOT LIKE 'batch-%'
      AND qp.source_name NOT LIKE '%batch-%'
      AND qp.source_name != 'Legacy'
    ORDER BY qp.created_at DESC
    LIMIT 1
  ),
  updated_at = NOW()
WHERE 
  (iar.source_name IS NULL 
   OR iar.source_name LIKE 'batch-%'
   OR iar.source_name LIKE '%batch-%'
   OR iar.source_name = 'Legacy')
  AND EXISTS (
    SELECT 1 FROM public.qualified_prospects qp
    WHERE qp.cnpj = iar.cnpj
      AND qp.tenant_id = iar.tenant_id
      AND qp.source_name IS NOT NULL
      AND qp.source_name NOT LIKE 'batch-%'
      AND qp.source_name != 'Legacy'
  );

-- 4. Verificar resultados
SELECT 'companies' as tabela,
  COUNT(*) as total,
  COUNT(source_name) FILTER (WHERE source_name IS NOT NULL AND source_name NOT LIKE 'batch-%' AND source_name != 'Legacy') as com_source_name_valido
FROM public.companies
UNION ALL
SELECT 'icp_analysis_results' as tabela,
  COUNT(*) as total,
  COUNT(source_name) FILTER (WHERE source_name IS NOT NULL AND source_name NOT LIKE 'batch-%' AND source_name != 'Legacy') as com_source_name_valido
FROM public.icp_analysis_results;

