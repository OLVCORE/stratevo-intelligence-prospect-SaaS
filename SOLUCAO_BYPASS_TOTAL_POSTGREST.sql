-- ============================================
-- SOLUÇÃO: Bypass TOTAL do PostgREST
-- ============================================
-- Esta função executa SQL direto SEM validação do PostgREST
-- Execute este SQL no Supabase SQL Editor

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_direct(TEXT);

-- Criar função que executa SQL direto (bypass TOTAL do PostgREST)
-- Esta função NÃO passa pelo PostgREST, executa SQL diretamente no PostgreSQL
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
  sql_dynamic TEXT;
BEGIN
  -- Converter TEXT para JSONB internamente
  decisores_data := decisores_data_text::JSONB;
  
  -- Iterar sobre cada decisor no array JSONB
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- ✅ USAR SQL DINÂMICO para bypass TOTAL do PostgREST
    -- Construir SQL dinamicamente - PostgREST NÃO valida isso
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

-- Criar função alias para compatibilidade
CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
  decisores_data_text TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simplesmente chamar a função direta
  RETURN QUERY
  SELECT * FROM public.insert_decision_makers_direct(decisores_data_text);
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_direct(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_direct(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_direct(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- Comentários
COMMENT ON FUNCTION public.insert_decision_makers_direct IS 
'Insere decisores usando SQL dinâmico - bypass TOTAL do PostgREST. Usa apenas data_sources (plural, JSONB).';

COMMENT ON FUNCTION public.insert_decision_makers_batch IS 
'Alias para insert_decision_makers_direct - compatibilidade com código existente.';

-- Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('insert_decision_makers_batch', 'insert_decision_makers_direct')
ORDER BY routine_name;

