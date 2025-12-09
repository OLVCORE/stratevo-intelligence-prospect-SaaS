-- =====================================================
-- ADD MARKDOWN COLUMNS TO icp_reports TABLE
-- =====================================================
-- Created: 2025-02-06
-- Purpose: Add dedicated columns for executiveSummaryMarkdown and fullReportMarkdown
-- =====================================================

-- Adicionar colunas para os novos campos de markdown
-- Usando snake_case para compatibilidade com PostgREST
ALTER TABLE public.icp_reports
ADD COLUMN IF NOT EXISTS full_report_markdown TEXT;

ALTER TABLE public.icp_reports
ADD COLUMN IF NOT EXISTS executive_summary_markdown TEXT;

-- Adicionar índices para buscas rápidas (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_icp_reports_full_markdown 
ON public.icp_reports(icp_profile_metadata_id) 
WHERE full_report_markdown IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_icp_reports_summary_markdown 
ON public.icp_reports(icp_profile_metadata_id) 
WHERE executive_summary_markdown IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.icp_reports.full_report_markdown IS 'Relatório estratégico completo em Markdown (STRATEVO ONE - Universal)';
COMMENT ON COLUMN public.icp_reports.executive_summary_markdown IS 'Resumo executivo hierarquizado em Markdown (STRATEVO ONE - Universal)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Após executar esta migration:
-- 1. A Edge Function deve salvar diretamente nessas colunas
-- 2. O frontend deve ler dessas colunas (com fallback para report_data)
-- 3. Regenerar os relatórios para popular as novas colunas
-- =====================================================

