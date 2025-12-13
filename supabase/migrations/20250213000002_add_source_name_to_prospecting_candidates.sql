-- ==========================================
-- ✅ ADICIONAR source_name em prospecting_candidates
-- ==========================================
-- Permite rastrear o nome da fonte (ex: "Plastico - 50") para aparecer na coluna "Origem"

ALTER TABLE public.prospecting_candidates
ADD COLUMN IF NOT EXISTS source_name TEXT;

-- Comentário
COMMENT ON COLUMN public.prospecting_candidates.source_name IS 'Nome da fonte de importação (ex: "Plastico - 50", "Prospecção Q1 2025") - Aparece na coluna "Origem"';

-- Índice para queries por fonte
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_source_name 
ON public.prospecting_candidates(source_name)
WHERE source_name IS NOT NULL;

