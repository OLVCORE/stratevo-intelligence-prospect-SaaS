-- ============================================
-- SOLUÇÃO DEFINITIVA: Remover TODAS as referências a data_source
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este script remove TODAS as colunas problemáticas e recria tudo

-- 1. Verificar TODAS as colunas relacionadas a source/data_source
SELECT 
  'ANTES' as etapa,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 2. Remover TODAS as colunas relacionadas a source (singular)
DO $$ 
BEGIN
  -- Remover data_source (singular) se existir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN IF EXISTS data_source CASCADE;
    RAISE NOTICE '✅ Coluna data_source (singular) removida';
  END IF;
  
  -- Remover source (singular) se existir (pode causar confusão)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN IF EXISTS source CASCADE;
    RAISE NOTICE '✅ Coluna source (singular) removida';
  END IF;
END $$;

-- 3. Garantir que data_sources (plural, JSONB) existe
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
    RAISE NOTICE '✅ Coluna data_sources (plural) criada';
  ELSE
    RAISE NOTICE '✅ Coluna data_sources (plural) já existe';
  END IF;
END $$;

-- 4. Verificar resultado
SELECT 
  'DEPOIS' as etapa,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 5. Recriar função RPC com SQL dinâmico (bypass completo do PostgREST)
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);

CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
  decisores_data_text TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decisores_data JSONB;
  decisor JSONB;
  inserted_id UUID;
  sql_dynamic TEXT;
BEGIN
  -- Converter TEXT para JSONB internamente
  decisores_data := decisores_data_text::JSONB;
  
  -- Iterar sobre cada decisor no array JSONB
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- ✅ USAR SQL DINÂMICO para bypass completo do PostgREST
    -- Construir SQL dinamicamente para evitar validação do PostgREST
    sql_dynamic := format('
      INSERT INTO public.decision_makers (
        company_id,
        apollo_organization_id,
        apollo_person_id,
        name,
        title,
        email,
        linkedin_url,
        seniority,
        data_sources,
        photo_url,
        city,
        state,
        country,
        headline,
        raw_apollo_data
      ) VALUES (
        %L::UUID,
        %L,
        %L,
        %L,
        %L,
        %L,
        %L,
        %L,
        %L::JSONB,
        %L,
        %L,
        %L,
        %L,
        %L,
        %L::JSONB
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
      COALESCE((decisor->'data_sources')::TEXT, '["apollo"]'),
      COALESCE(NULLIF(decisor->>'photo_url', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'city', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'state', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'country', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'headline', 'null'), NULL),
      COALESCE((decisor->'raw_apollo_data')::TEXT, '{}')
    );
    
    -- Executar SQL dinâmico
    EXECUTE sql_dynamic INTO inserted_id;
    
    -- Retornar ID inserido
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- 6. Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- 7. Forçar recarregamento do cache do PostgREST (múltiplas vezes)
DO $$
BEGIN
  FOR i IN 1..30 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
  RAISE NOTICE '✅ 30 notificações de reload enviadas ao PostgREST';
END $$;

-- 8. Aguardar alguns segundos
SELECT pg_sleep(5);

-- 9. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Processo concluído!';
  RAISE NOTICE '⚠️ IMPORTANTE: Se o erro persistir após reiniciar o projeto,';
  RAISE NOTICE '   execute DIAGNOSTICO_COMPLETO.sql para encontrar outras referências.';
END $$;

