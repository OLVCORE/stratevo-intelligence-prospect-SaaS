-- ==========================================
-- Adicionar coluna company_id em qualified_prospects
-- ==========================================
-- Permite vincular qualificado à empresa criada no banco oficial

ALTER TABLE public.qualified_prospects
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_company_id 
ON public.qualified_prospects(company_id) 
WHERE company_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN public.qualified_prospects.company_id IS 
'FK para companies - preenchido quando prospect é promovido para o banco oficial';

