-- ============================================
-- SOLUÇÃO DEFINITIVA: Inserção Direta (contorna PostgREST)
-- ============================================
-- Esta função usa SQL dinâmico para contornar completamente
-- a validação do schema pelo PostgREST
-- Execute este SQL no Supabase SQL Editor

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);

-- Criar função que usa SQL dinâmico (contorna validação do PostgREST)
CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
  decisores_data JSONB
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decisor JSONB;
  inserted_id UUID;
BEGIN
  -- Iterar sobre cada decisor no array JSONB
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- ✅ USAR INSERT DIRETO (não SQL dinâmico, mas contorna validação do PostgREST)
    -- Inserir ou atualizar decisor
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
    
    -- Retornar ID inserido
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(JSONB) TO service_role;

-- Comentário
COMMENT ON FUNCTION public.insert_decision_makers_batch IS 
'Insere decisores em lote contornando validação do PostgREST. Usa data_sources (plural, JSONB) conforme schema real.';

-- Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';
