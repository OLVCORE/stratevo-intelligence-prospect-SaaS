-- ============================================
-- Garantir que todas as colunas necessárias existam em decision_makers
-- ============================================
-- Esta migração garante que todas as colunas usadas pela função enrich-apollo-decisores existam
-- É idempotente e segura para executar múltiplas vezes

-- Adicionar colunas de localização (se não existirem)
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS city TEXT NULL,
  ADD COLUMN IF NOT EXISTS state TEXT NULL,
  ADD COLUMN IF NOT EXISTS country TEXT NULL;

-- Adicionar colunas do Apollo (se não existirem)
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS headline TEXT NULL,
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS apollo_person_id TEXT UNIQUE;

-- Garantir que data_sources existe e é JSONB
DO $$ 
BEGIN
  -- Verificar se a coluna existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'decision_makers' 
    AND column_name = 'data_sources'
  ) THEN
    ALTER TABLE public.decision_makers
      ADD COLUMN data_sources JSONB DEFAULT '[]'::JSONB;
  END IF;
END $$;

-- Garantir que raw_apollo_data existe
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS raw_apollo_data JSONB NULL;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_decision_makers_city ON public.decision_makers(city);
CREATE INDEX IF NOT EXISTS idx_decision_makers_state ON public.decision_makers(state);
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_org_id ON public.decision_makers(apollo_organization_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_person_id ON public.decision_makers(apollo_person_id);

-- Comentários para documentação
COMMENT ON COLUMN public.decision_makers.city IS 'Cidade do decisor';
COMMENT ON COLUMN public.decision_makers.state IS 'Estado do decisor';
COMMENT ON COLUMN public.decision_makers.country IS 'País do decisor';
COMMENT ON COLUMN public.decision_makers.photo_url IS 'URL da foto do decisor';
COMMENT ON COLUMN public.decision_makers.headline IS 'LinkedIn headline do decisor';
COMMENT ON COLUMN public.decision_makers.apollo_organization_id IS 'ID da organização no Apollo.io';
COMMENT ON COLUMN public.decision_makers.apollo_person_id IS 'ID da pessoa no Apollo.io';
COMMENT ON COLUMN public.decision_makers.data_sources IS 'Array de fontes de dados (ex: ["apollo", "linkedin"])';
COMMENT ON COLUMN public.decision_makers.raw_apollo_data IS 'Dados completos do Apollo.io em formato JSON';

