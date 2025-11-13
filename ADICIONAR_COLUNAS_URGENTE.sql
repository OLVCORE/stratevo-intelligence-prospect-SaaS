-- ============================================================================
-- URGENTE: ADICIONAR COLUNAS FALTANTES NA TABELA COMPANIES
-- ============================================================================

-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR AGORA!

-- 1. Adicionar colunas que faltam
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_apollo_id 
ON public.companies(apollo_id);

CREATE INDEX IF NOT EXISTS idx_companies_linkedin_url 
ON public.companies(linkedin_url);

CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
ON public.companies(enrichment_source);

-- 3. Comentários (documentação)
COMMENT ON COLUMN public.companies.apollo_id IS 
  'Apollo.io Organization ID';

COMMENT ON COLUMN public.companies.description IS 
  'Descrição da empresa (Apollo, LinkedIn ou manual)';

COMMENT ON COLUMN public.companies.linkedin_url IS 
  'URL do LinkedIn da empresa';

COMMENT ON COLUMN public.companies.enrichment_source IS 
  'Origem do enriquecimento: NULL (não enriquecido), auto (automático), manual (validado)';

COMMENT ON COLUMN public.companies.enriched_at IS 
  'Data/hora do último enriquecimento';

-- 4. MIGRAR DADOS EXISTENTES de raw_data para colunas diretas
UPDATE public.companies
SET 
  apollo_id = raw_data->'apollo_organization'->>'id',
  linkedin_url = COALESCE(
    linkedin_url,
    raw_data->'apollo_organization'->>'linkedin_url',
    raw_data->>'linkedin_url',
    raw_data->'digital_presence'->>'linkedin'
  ),
  description = COALESCE(
    description,
    raw_data->'apollo_organization'->>'short_description',
    raw_data->'apollo_organization'->>'description'
  )
WHERE raw_data IS NOT NULL
  AND (
    raw_data->'apollo_organization' IS NOT NULL
    OR raw_data->>'linkedin_url' IS NOT NULL
    OR raw_data->'digital_presence' IS NOT NULL
  );

-- 5. Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE apollo_id IS NOT NULL) as com_apollo,
  COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL) as com_linkedin,
  COUNT(*) FILTER (WHERE description IS NOT NULL) as com_description,
  COUNT(*) as total
FROM public.companies;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Agora as colunas existem e dados migrados de raw_data para campos diretos!
-- ============================================================================

