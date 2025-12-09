-- ==========================================
-- Adicionar campo nome_fantasia em prospecting_candidates
-- ==========================================
-- Permite armazenar nome fantasia separadamente da razão social

ALTER TABLE public.prospecting_candidates
ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;

-- Comentário
COMMENT ON COLUMN public.prospecting_candidates.nome_fantasia IS 'Nome fantasia da empresa (diferente da razão social)';

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_nome_fantasia 
ON public.prospecting_candidates(nome_fantasia)
WHERE nome_fantasia IS NOT NULL;

