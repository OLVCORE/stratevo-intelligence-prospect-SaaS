-- ==========================================
-- Adicionar campo match_breakdown em qualified_prospects
-- ==========================================
-- Armazena detalhamento dos critérios de matching usados na qualificação

ALTER TABLE public.qualified_prospects
ADD COLUMN IF NOT EXISTS match_breakdown jsonb;

-- Comentário
COMMENT ON COLUMN public.qualified_prospects.match_breakdown IS 
'Detalhamento dos critérios de matching: array de objetos com criteria, label, weight, matched, score';

-- Índice GIN para queries eficientes em match_breakdown
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_match_breakdown 
ON public.qualified_prospects USING GIN (match_breakdown)
WHERE match_breakdown IS NOT NULL;

