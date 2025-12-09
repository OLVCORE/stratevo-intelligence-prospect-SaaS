-- ==========================================
-- Adicionar campos de rastreabilidade em qualified_prospects
-- ==========================================
-- Campos para rastrear origem e campanha das empresas qualificadas

ALTER TABLE public.qualified_prospects
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}'::JSONB;

-- Comentários
COMMENT ON COLUMN public.qualified_prospects.source_name IS 'Nome da fonte de importação (ex: "Prospecção Q1 2025", "Leads Manuais")';
COMMENT ON COLUMN public.qualified_prospects.source_metadata IS 'Metadados da fonte: {campaign, file_name, total_rows, etc}';

-- Índice para queries por fonte
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_source_name 
ON public.qualified_prospects(source_name)
WHERE source_name IS NOT NULL;

-- Índice GIN para queries em source_metadata
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_source_metadata 
ON public.qualified_prospects USING GIN (source_metadata)
WHERE source_metadata IS NOT NULL;

