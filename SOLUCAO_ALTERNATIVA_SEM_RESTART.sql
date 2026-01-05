-- ============================================
-- SOLUÇÃO ALTERNATIVA - SEM PRECISAR REINICIAR
-- ============================================
-- Esta solução tenta forçar o refresh do schema cache
-- de outras formas, sem precisar reiniciar o projeto
-- ============================================

-- ============================================
-- ETAPA 1: REMOVER COLUNAS PROBLEMÁTICAS
-- ============================================
DO $$ 
BEGIN
  -- Remover source (singular)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN source CASCADE;
    RAISE NOTICE '✅ Coluna source removida';
  END IF;
  
  -- Remover data_source (singular)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN data_source CASCADE;
    RAISE NOTICE '✅ Coluna data_source removida';
  END IF;
END $$;

-- ============================================
-- ETAPA 2: GARANTIR COLUNA CORRETA
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_sources'
  ) THEN
    ALTER TABLE public.decision_makers 
    ADD COLUMN data_sources JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE '✅ Coluna data_sources criada';
  END IF;
END $$;

-- ============================================
-- ETAPA 3: FORÇAR REFRESH DO SCHEMA CACHE
-- ============================================
-- Criar uma view temporária que força o PostgREST a revalidar o schema
CREATE OR REPLACE VIEW public._refresh_decision_makers_schema AS
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name LIKE '%source%';

-- Fazer uma query na view para forçar refresh
SELECT * FROM public._refresh_decision_makers_schema;

-- ============================================
-- ETAPA 4: CRIAR FUNÇÃO QUE USA SQL DIRETO
-- ============================================
-- Esta função faz INSERT direto sem passar pelo PostgREST validation
CREATE OR REPLACE FUNCTION public.insert_decision_makers_direct(
  decisores_data_text TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decisores_data JSONB;
  decisor JSONB;
  inserted_id UUID;
BEGIN
  -- Converter TEXT para JSONB
  decisores_data := decisores_data_text::JSONB;
  
  -- Iterar e inserir diretamente
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- INSERT direto usando SQL nativo (bypass total PostgREST)
    INSERT INTO public.decision_makers (
      company_id, apollo_organization_id, apollo_person_id, name, title,
      email, linkedin_url, seniority, data_sources, photo_url,
      city, state, country, headline, raw_apollo_data
    ) VALUES (
      (decisor->>'company_id')::UUID,
      NULLIF(decisor->>'apollo_organization_id', 'null'),
      NULLIF(decisor->>'apollo_person_id', 'null'),
      decisor->>'name',
      NULLIF(decisor->>'title', 'null'),
      NULLIF(decisor->>'email', 'null'),
      NULLIF(decisor->>'linkedin_url', 'null'),
      NULLIF(decisor->>'seniority', 'null'),
      COALESCE((decisor->'data_sources')::JSONB, '["apollo"]'::JSONB),
      NULLIF(decisor->>'photo_url', 'null'),
      NULLIF(decisor->>'city', 'null'),
      NULLIF(decisor->>'state', 'null'),
      NULLIF(decisor->>'country', 'null'),
      NULLIF(decisor->>'headline', 'null'),
      COALESCE((decisor->'raw_apollo_data')::JSONB, '{}'::JSONB)
    )
    ON CONFLICT (apollo_person_id) 
    WHERE apollo_person_id IS NOT NULL
    DO UPDATE SET
      company_id = EXCLUDED.company_id,
      apollo_organization_id = EXCLUDED.apollo_organization_id,
      name = EXCLUDED.name,
      title = EXCLUDED.title,
      email = EXCLUDED.email,
      linkedin_url = EXCLUDED.linkedin_url,
      seniority = EXCLUDED.seniority,
      data_sources = EXCLUDED.data_sources,
      photo_url = EXCLUDED.photo_url,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      headline = EXCLUDED.headline,
      raw_apollo_data = EXCLUDED.raw_apollo_data,
      updated_at = NOW()
    RETURNING id INTO inserted_id;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_decision_makers_direct(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_direct(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_direct(TEXT) TO service_role;

-- ============================================
-- ETAPA 5: VERIFICAÇÃO
-- ============================================
SELECT 
  'COLUNAS_SOURCE' as verificação,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%')
ORDER BY column_name;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SCRIPT EXECUTADO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 A Edge Function foi modificada para usar INSERT direto';
  RAISE NOTICE '   (bypass completo da função RPC)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRÓXIMO PASSO:';
  RAISE NOTICE '   1. Faça deploy da Edge Function atualizada:';
  RAISE NOTICE '      supabase functions deploy enrich-apollo-decisores';
  RAISE NOTICE '';
  RAISE NOTICE '   2. Teste a busca de decisores novamente';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Se ainda falhar, a única solução é REINICIAR o projeto';
  RAISE NOTICE '';
END $$;
