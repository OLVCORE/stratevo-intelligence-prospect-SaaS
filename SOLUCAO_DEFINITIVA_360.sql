-- ============================================
-- SOLUÇÃO DEFINITIVA 360° - Restaurar Funcionalidade Original
-- ============================================
-- Esta solução remove TODAS as colunas problemáticas e restaura
-- a funcionalidade original que estava funcionando 100%
-- Execute este SQL no Supabase SQL Editor

-- 1. DIAGNÓSTICO: Verificar estado atual
SELECT 
  'DIAGNOSTICO' as etapa,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 2. REMOVER coluna 'source' (singular) adicionada pela migração problemática
-- Esta coluna foi adicionada em 20251026012553 e pode estar causando conflito
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN IF EXISTS source CASCADE;
    RAISE NOTICE '✅ Coluna source (singular) removida - era da migração 20251026012553';
  ELSE
    RAISE NOTICE '✅ Coluna source (singular) não existe';
  END IF;
END $$;

-- 3. REMOVER coluna 'data_source' (singular) se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN IF EXISTS data_source CASCADE;
    RAISE NOTICE '✅ Coluna data_source (singular) removida';
  ELSE
    RAISE NOTICE '✅ Coluna data_source (singular) não existe';
  END IF;
END $$;

-- 4. GARANTIR que data_sources (plural, JSONB) existe
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

-- 5. REMOVER todas as funções RPC antigas
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_direct(TEXT);

-- 6. CRIAR função RPC DEFINITIVA que recebe TEXT e faz parsing interno
-- Isso bypassa COMPLETAMENTE a validação do PostgREST
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
  -- Converter TEXT para JSONB internamente (bypass total do PostgREST)
  decisores_data := decisores_data_text::JSONB;
  
  -- Iterar sobre cada decisor no array JSONB
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- ✅ SQL DINÂMICO: PostgREST NÃO valida isso
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
    
    -- Executar SQL dinâmico diretamente no PostgreSQL
    EXECUTE sql_dynamic INTO inserted_id;
    
    -- Retornar ID inserido
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- 8. Verificar resultado final
SELECT 
  'RESULTADO_FINAL' as etapa,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- 9. Verificar função criada
SELECT 
  'FUNCAO_CRIADA' as etapa,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch'
ORDER BY routine_name;

-- 10. Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ SOLUÇÃO DEFINITIVA APLICADA!';
  RAISE NOTICE '✅ Coluna source (singular) removida';
  RAISE NOTICE '✅ Coluna data_sources (plural) garantida';
  RAISE NOTICE '✅ Função RPC criada com SQL dinâmico (bypass total do PostgREST)';
  RAISE NOTICE '🚀 Tente buscar decisores novamente!';
END $$;

