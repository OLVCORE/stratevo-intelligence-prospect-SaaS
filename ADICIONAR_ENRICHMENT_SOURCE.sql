-- ========================================
-- ✅ ADICIONAR CAMPO enrichment_source
-- ========================================

-- Adicionar coluna na tabela companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enrichment_source text CHECK (enrichment_source IN ('auto', 'manual'));

-- Adicionar coluna enriched_at
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

-- Comentário de documentação
COMMENT ON COLUMN public.companies.enrichment_source IS 
  'Origem do enriquecimento: NULL (não enriquecido), auto (automático via Apollo), manual (validado pelo usuário)';

COMMENT ON COLUMN public.companies.enriched_at IS 
  'Data/hora do último enriquecimento Apollo';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
ON public.companies(enrichment_source);

-- Marcar empresas que já têm apollo_organization como 'auto'
UPDATE public.companies
SET enrichment_source = 'auto'
WHERE raw_data->'apollo_organization' IS NOT NULL
  AND enrichment_source IS NULL;

-- Verificar resultados
SELECT 
  company_name,
  enrichment_source,
  enriched_at,
  raw_data->'apollo_organization'->'name' as apollo_org_name
FROM public.companies
WHERE enrichment_source IS NOT NULL
ORDER BY enriched_at DESC NULLS LAST
LIMIT 20;

