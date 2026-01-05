-- ============================================
-- SOLUÇÃO FINAL - REINICIAR PROJETO SUPABASE
-- ============================================
-- Este script remove TODAS as referências problemáticas
-- MAS o cache do PostgREST só será limpo completamente
-- quando você REINICIAR o projeto Supabase
-- Execute este SQL no Supabase SQL Editor

-- ============================================
-- ETAPA 1: REMOVER COLUNAS PROBLEMÁTICAS
-- ============================================
DO $$ 
BEGIN
  -- Remover source (singular) - migração 20251026012553
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN source CASCADE;
    RAISE NOTICE '✅ Coluna source (singular) removida - migração 20251026012553';
  ELSE
    RAISE NOTICE '✅ Coluna source (singular) não existe';
  END IF;
  
  -- Remover data_source (singular)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN data_source CASCADE;
    RAISE NOTICE '✅ Coluna data_source (singular) removida';
  ELSE
    RAISE NOTICE '✅ Coluna data_source (singular) não existe';
  END IF;
END $$;

-- Garantir data_sources (plural)
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
    RAISE NOTICE '✅ Coluna data_sources (plural) criada';
  ELSE
    RAISE NOTICE '✅ Coluna data_sources (plural) já existe';
  END IF;
END $$;

-- ============================================
-- ETAPA 2: REMOVER TODAS AS FUNÇÕES ANTIGAS
-- ============================================
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_direct(TEXT);

-- ============================================
-- ETAPA 3: CRIAR FUNÇÃO DEFINITIVA
-- ============================================
-- ✅ RECEBE TEXT e converte internamente (bypass total PostgREST)
CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
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
  sql_dynamic TEXT;
BEGIN
  -- Converter TEXT para JSONB internamente (bypass PostgREST validation)
  BEGIN
    decisores_data := decisores_data_text::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid JSON: %', SQLERRM;
  END;
  
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    sql_dynamic := format('
      INSERT INTO public.decision_makers (
        company_id, apollo_organization_id, apollo_person_id, name, title,
        email, linkedin_url, seniority, data_sources, photo_url,
        city, state, country, headline, raw_apollo_data
      ) VALUES (
        %L::UUID, %L, %L, %L, %L, %L, %L, %L, %L::JSONB, %L, %L, %L, %L, %L, %L::JSONB
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
      RETURNING id;
    ',
      COALESCE(decisor->>'company_id', ''),
      COALESCE(NULLIF(decisor->>'apollo_organization_id', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'apollo_person_id', 'null'), NULL),
      COALESCE(decisor->>'name', ''),
      COALESCE(NULLIF(decisor->>'title', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'email', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'linkedin_url', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'seniority', 'null'), NULL),
      COALESCE(
        CASE 
          WHEN decisor->'data_sources' IS NOT NULL THEN (decisor->'data_sources')::TEXT
          ELSE '["apollo"]'
        END,
        '["apollo"]'
      )::JSONB,
      COALESCE(NULLIF(decisor->>'photo_url', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'city', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'state', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'country', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'headline', 'null'), NULL),
      COALESCE((decisor->'raw_apollo_data')::TEXT, '{}')
    );
    
    EXECUTE sql_dynamic INTO inserted_id;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- ============================================
-- ETAPA 4: VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'RESULTADO_FINAL' as etapa,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

SELECT 
  'FUNCAO_VERIFICADA' as etapa,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '⚠️ IMPORTANTE: O cache do PostgREST só será limpo completamente quando você REINICIAR o projeto Supabase';
  RAISE NOTICE '🚀 PRÓXIMO PASSO:';
  RAISE NOTICE '   1. Acesse: https://supabase.com/dashboard';
  RAISE NOTICE '   2. Vá em: Settings → General';
  RAISE NOTICE '   3. Clique em: Restart Project';
  RAISE NOTICE '   4. Aguarde 2-3 minutos';
  RAISE NOTICE '   5. Tente buscar decisores novamente';
END $$;

