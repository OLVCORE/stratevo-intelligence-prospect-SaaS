-- ============================================
-- MIGRAÇÃO: Garantir colunas em decision_makers
-- ============================================
-- Execute este SQL diretamente no SQL Editor do Supabase
-- Vá em: Database > SQL Editor > New Query > Cole este código > Run

-- Adicionar colunas de localização (se não existirem)
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS city TEXT NULL,
  ADD COLUMN IF NOT EXISTS state TEXT NULL,
  ADD COLUMN IF NOT EXISTS country TEXT NULL;

-- Adicionar colunas do Apollo (se não existirem)
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS headline TEXT NULL,
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT NULL;

-- Adicionar apollo_person_id se não existir
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS apollo_person_id TEXT NULL;

-- Criar índice único se não existir (apenas se a coluna não tiver constraint UNIQUE)
DO $$ 
BEGIN
  -- Verificar se já existe constraint UNIQUE
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'decision_makers_apollo_person_id_key'
  ) THEN
    -- Criar índice único parcial (apenas para valores não-nulos)
    CREATE UNIQUE INDEX IF NOT EXISTS decision_makers_apollo_person_id_key 
      ON public.decision_makers(apollo_person_id) 
      WHERE apollo_person_id IS NOT NULL;
  END IF;
END $$;

-- Garantir que data_sources existe e é JSONB
DO $$ 
BEGIN
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

-- Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('city', 'state', 'country', 'photo_url', 'headline', 'apollo_organization_id', 'apollo_person_id', 'data_sources', 'raw_apollo_data')
ORDER BY column_name;

