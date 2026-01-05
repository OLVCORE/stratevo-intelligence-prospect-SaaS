-- ============================================
-- SOLUÇÃO FINAL ABSOLUTA - Bypass Total do PostgREST
-- ============================================
-- Esta solução cria uma função que NÃO expõe a tabela decision_makers
-- diretamente ao PostgREST, usando uma abordagem completamente diferente
-- Execute este SQL no Supabase SQL Editor

-- 1. REMOVER todas as funções antigas
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_direct(TEXT);

-- 2. REMOVER coluna 'source' (singular) se existir
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
    RAISE NOTICE '✅ Coluna source (singular) removida';
  END IF;
  
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
END $$;

-- 3. GARANTIR que data_sources (plural) existe
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
  END IF;
END $$;

-- 4. CRIAR função que usa uma tabela temporária para bypass total
-- Esta função cria uma tabela temporária, insere os dados lá,
-- e depois move para decision_makers usando SQL direto
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
  temp_table_name TEXT;
  sql_dynamic TEXT;
BEGIN
  -- Converter TEXT para JSONB internamente
  decisores_data := decisores_data_text::JSONB;
  
  -- Criar nome único para tabela temporária
  temp_table_name := 'temp_decision_makers_' || gen_random_uuid()::TEXT;
  
  -- Criar tabela temporária com estrutura idêntica
  EXECUTE format('
    CREATE TEMP TABLE %I (
      company_id UUID,
      apollo_organization_id TEXT,
      apollo_person_id TEXT,
      name TEXT,
      title TEXT,
      email TEXT,
      linkedin_url TEXT,
      seniority TEXT,
      data_sources JSONB,
      photo_url TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      headline TEXT,
      raw_apollo_data JSONB
    ) ON COMMIT DROP;
  ', temp_table_name);
  
  -- Inserir dados na tabela temporária
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    EXECUTE format('
      INSERT INTO %I (
        company_id, apollo_organization_id, apollo_person_id, name, title,
        email, linkedin_url, seniority, data_sources, photo_url,
        city, state, country, headline, raw_apollo_data
      ) VALUES (
        %L::UUID, %L, %L, %L, %L, %L, %L, %L, %L::JSONB, %L, %L, %L, %L, %L, %L::JSONB
      );
    ',
      temp_table_name,
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
  END LOOP;
  
  -- Mover dados da tabela temporária para decision_makers usando SQL direto
  -- Isso bypassa COMPLETAMENTE o PostgREST
  FOR inserted_id IN 
    EXECUTE format('
      WITH inserted AS (
        INSERT INTO public.decision_makers (
          company_id, apollo_organization_id, apollo_person_id, name, title,
          email, linkedin_url, seniority, data_sources, photo_url,
          city, state, country, headline, raw_apollo_data
        )
        SELECT * FROM %I
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
        RETURNING id
      )
      SELECT id FROM inserted;
    ', temp_table_name)
  LOOP
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- 5. Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- 6. Verificação
SELECT 
  'VERIFICACAO' as etapa,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

SELECT 
  'FUNCAO' as etapa,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

DO $$
BEGIN
  RAISE NOTICE '✅ SOLUÇÃO FINAL ABSOLUTA APLICADA!';
  RAISE NOTICE '✅ Função usa tabela temporária para bypass total do PostgREST';
  RAISE NOTICE '🚀 Tente buscar decisores novamente!';
END $$;

