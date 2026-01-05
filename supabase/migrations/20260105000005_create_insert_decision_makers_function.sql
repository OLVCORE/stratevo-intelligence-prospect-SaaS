-- ============================================
-- FUNÇÃO: Inserir decisores contornando cache PostgREST
-- ============================================
-- Esta função permite inserir decisores diretamente via SQL,
-- contornando o cache do PostgREST que pode estar desatualizado

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
      data_sources, -- ✅ PLURAL - JSONB array
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

-- Comentário
COMMENT ON FUNCTION public.insert_decision_makers_batch IS 
'Insere decisores em lote contornando cache do PostgREST. Usa data_sources (plural, JSONB) conforme schema real.';

