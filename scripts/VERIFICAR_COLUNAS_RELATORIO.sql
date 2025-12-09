-- 🔍 SCRIPT PARA VERIFICAR SE AS COLUNAS DE MARKDOWN EXISTEM
-- Execute este script no Supabase SQL Editor para verificar se as colunas foram criadas

-- 1. Verificar se as colunas existem na tabela icp_reports
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'icp_reports'
  AND column_name IN ('full_report_markdown', 'executive_summary_markdown')
ORDER BY column_name;

-- 2. Se as colunas NÃO existirem, execute a migration:
-- ALTER TABLE public.icp_reports
--   ADD COLUMN IF NOT EXISTS full_report_markdown TEXT,
--   ADD COLUMN IF NOT EXISTS executive_summary_markdown TEXT;

-- 3. Verificar se há relatórios com dados nas colunas novas
SELECT 
  id,
  icp_profile_metadata_id,
  report_type,
  status,
  generated_at,
  CASE 
    WHEN full_report_markdown IS NOT NULL THEN LENGTH(full_report_markdown)
    ELSE 0
  END as full_report_length,
  CASE 
    WHEN executive_summary_markdown IS NOT NULL THEN LENGTH(executive_summary_markdown)
    ELSE 0
  END as executive_summary_length,
  CASE 
    WHEN full_report_markdown IS NOT NULL THEN LEFT(full_report_markdown, 100)
    ELSE NULL
  END as full_report_preview,
  CASE 
    WHEN executive_summary_markdown IS NOT NULL THEN LEFT(executive_summary_markdown, 100)
    ELSE NULL
  END as executive_summary_preview
FROM public.icp_reports
ORDER BY generated_at DESC
LIMIT 10;

-- 4. Verificar se os dados estão em report_data (fallback)
SELECT 
  id,
  icp_profile_metadata_id,
  report_type,
  status,
  CASE 
    WHEN report_data->>'fullReportMarkdown' IS NOT NULL THEN LENGTH(report_data->>'fullReportMarkdown')
    ELSE 0
  END as full_report_in_data_length,
  CASE 
    WHEN report_data->>'executiveSummaryMarkdown' IS NOT NULL THEN LENGTH(report_data->>'executiveSummaryMarkdown')
    ELSE 0
  END as executive_summary_in_data_length,
  CASE 
    WHEN report_data->>'fullReportMarkdown' IS NOT NULL THEN LEFT(report_data->>'fullReportMarkdown', 100)
    ELSE NULL
  END as full_report_in_data_preview,
  CASE 
    WHEN report_data->>'executiveSummaryMarkdown' IS NOT NULL THEN LEFT(report_data->>'executiveSummaryMarkdown', 100)
    ELSE NULL
  END as executive_summary_in_data_preview
FROM public.icp_reports
ORDER BY generated_at DESC
LIMIT 10;





