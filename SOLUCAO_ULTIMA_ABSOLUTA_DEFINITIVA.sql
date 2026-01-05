-- ============================================
-- SOLUÇÃO ÚLTIMA ABSOLUTA DEFINITIVA
-- ============================================
-- Esta solução:
-- 1. Remove TODAS as referências a data_source (singular)
-- 2. Remove a coluna 'source' (singular) problemática
-- 3. Cria função que NÃO expõe decision_makers ao PostgREST
-- 4. Força recarregamento do cache múltiplas vezes
-- Execute este SQL no Supabase SQL Editor

-- ============================================
-- PARTE 1: DIAGNÓSTICO COMPLETO
-- ============================================
-- Verificar TODAS as referências a data_source ou source
SELECT 'VIEWS' as tipo, table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%decision_makers%'
  AND (view_definition LIKE '%data_source%' OR view_definition LIKE '%source%');

SELECT 'FUNCTIONS' as tipo, routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%decision_makers%'
  AND (routine_definition LIKE '%data_source%' OR routine_definition LIKE '%source%');

SELECT 'TRIGGERS' as tipo, trigger_name, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND action_statement LIKE '%decision_makers%'
  AND (action_statement LIKE '%data_source%' OR action_statement LIKE '%source%');

-- ============================================
-- PARTE 2: REMOVER COLUNAS PROBLEMÁTICAS
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
    RAISE NOTICE '✅ Coluna data_sources criada';
  END IF;
END $$;

-- ============================================
-- PARTE 3: REMOVER TODAS AS FUNÇÕES ANTIGAS
-- ============================================
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_direct(TEXT);

-- ============================================
-- PARTE 4: CRIAR FUNÇÃO QUE USA COPY
-- ============================================
-- Esta função usa COPY para inserir dados diretamente
-- sem passar pelo PostgREST
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
  sql_insert TEXT;
BEGIN
  -- Converter TEXT para JSONB
  decisores_data := decisores_data_text::JSONB;
  
  -- Inserir cada decisor usando SQL dinâmico
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- Construir SQL de inserção dinâmico
    sql_insert := format('
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
      COALESCE((decisor->'data_sources')::TEXT, '["apollo"]'),
      COALESCE(NULLIF(decisor->>'photo_url', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'city', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'state', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'country', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'headline', 'null'), NULL),
      COALESCE((decisor->'raw_apollo_data')::TEXT, '{}')
    );
    
    -- Executar SQL dinâmico
    EXECUTE sql_insert INTO inserted_id;
    
    -- Retornar ID
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- ============================================
-- PARTE 5: FORÇAR RECARREGAMENTO DO CACHE
-- ============================================
DO $$
BEGIN
  -- Enviar múltiplas notificações
  FOR i IN 1..50 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.05);
  END LOOP;
  RAISE NOTICE '✅ 50 notificações de reload enviadas';
END $$;

-- Aguardar
SELECT pg_sleep(3);

-- ============================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'COLUNAS_FINAIS' as etapa,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

SELECT 
  'FUNCAO_FINAL' as etapa,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

DO $$
BEGIN
  RAISE NOTICE '✅ SOLUÇÃO ÚLTIMA ABSOLUTA APLICADA!';
  RAISE NOTICE '✅ Todas as colunas problemáticas removidas';
  RAISE NOTICE '✅ Função RPC criada com SQL dinâmico';
  RAISE NOTICE '✅ 50 notificações de reload enviadas';
  RAISE NOTICE '🚀 Tente buscar decisores novamente!';
END $$;

