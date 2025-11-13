-- ============================================================================
-- ATUALIZAR TODAS AS EMPRESAS QUE TÊM DECISORES
-- ============================================================================

-- PASSO 1: Adicionar decision_makers no raw_data de TODAS
UPDATE public.companies c
SET raw_data = jsonb_set(
  COALESCE(c.raw_data, '{}'::jsonb),
  '{decision_makers}',
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', dm.full_name,
        'title', dm.position,
        'linkedin_url', dm.linkedin_url,
        'email', dm.email,
        'photo_url', dm.photo_url
      ) ORDER BY 
        CASE 
          -- Presidente/CEO
          WHEN LOWER(dm.position) LIKE '%presidente%' OR LOWER(dm.position) LIKE '%ceo%' THEN 1
          -- Diretor
          WHEN LOWER(dm.position) LIKE '%diretor%' OR LOWER(dm.position) LIKE '%director%' THEN 10
          -- Superintendente
          WHEN LOWER(dm.position) LIKE '%superintendente%' THEN 20
          -- VP
          WHEN LOWER(dm.position) LIKE '%vice%' OR LOWER(dm.position) LIKE '%vp%' THEN 25
          -- Gerente
          WHEN LOWER(dm.position) LIKE '%gerente%' OR LOWER(dm.position) LIKE '%manager%' THEN 30
          -- Coordenador
          WHEN LOWER(dm.position) LIKE '%coordenador%' THEN 40
          -- Outros
          ELSE 99
        END,
        dm.full_name
    )
    FROM decision_makers dm
    WHERE dm.company_id = c.id
  )
)
WHERE EXISTS (
  SELECT 1 FROM decision_makers dm WHERE dm.company_id = c.id
);

-- PASSO 2: Atualizar linkedin_url de TODAS que têm no raw_data
UPDATE public.companies
SET linkedin_url = raw_data->'apollo_organization'->>'linkedin_url'
WHERE raw_data->'apollo_organization'->>'linkedin_url' IS NOT NULL
  AND linkedin_url IS NULL;

-- PASSO 3: Atualizar apollo_id de TODAS que têm no raw_data
UPDATE public.companies
SET apollo_id = raw_data->'apollo_organization'->>'id'
WHERE raw_data->'apollo_organization'->>'id' IS NOT NULL
  AND apollo_id IS NULL;

-- PASSO 4: Atualizar description de TODAS que têm no raw_data
UPDATE public.companies
SET description = CONCAT(
  raw_data->'apollo_organization'->>'name',
  ' - ',
  raw_data->'apollo_organization'->>'industry'
)
WHERE raw_data->'apollo_organization'->>'industry' IS NOT NULL
  AND description IS NULL;

-- VERIFICAR RESULTADO
SELECT 
  COUNT(*) FILTER (WHERE apollo_id IS NOT NULL) as com_apollo,
  COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL) as com_linkedin,
  COUNT(*) FILTER (WHERE description IS NOT NULL) as com_description,
  COUNT(*) FILTER (WHERE jsonb_array_length(raw_data->'decision_makers') > 0) as com_decisores,
  COUNT(*) as total
FROM public.companies;

