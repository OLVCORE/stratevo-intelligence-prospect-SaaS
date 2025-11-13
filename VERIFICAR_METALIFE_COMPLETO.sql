-- ============================================================================
-- VERIFICAR O QUE TEM NA METALIFE NO BANCO DE DADOS
-- ============================================================================

-- 1️⃣ VER TODOS OS DADOS DA METALIFE
SELECT 
  id,
  company_name,
  name,
  razao_social,
  cnpj,
  domain,
  website,
  linkedin_url,
  industry,
  city,
  state,
  country,
  description,
  enrichment_source,
  enriched_at,
  raw_data
FROM public.companies
WHERE 
  company_name ILIKE '%metalife%' OR
  name ILIKE '%metalife%' OR
  razao_social ILIKE '%metalife%'
LIMIT 1;

-- 2️⃣ VER DECISORES DA METALIFE (TABELA decision_makers)
SELECT 
  dm.id,
  dm.full_name,
  dm.position,
  dm.email,
  dm.phone,
  dm.linkedin_url,
  dm.photo_url,
  dm.data_source,
  dm.created_at
FROM public.decision_makers dm
JOIN public.companies c ON c.id = dm.company_id
WHERE 
  c.company_name ILIKE '%metalife%' OR
  c.name ILIKE '%metalife%' OR
  c.razao_social ILIKE '%metalife%'
ORDER BY dm.created_at DESC;

-- 3️⃣ VER raw_data.decision_makers (se tiver)
SELECT 
  company_name,
  raw_data->'decision_makers' as decisores_em_raw_data,
  raw_data->'apollo_people' as apollo_people,
  raw_data->'apollo_organization' as apollo_org
FROM public.companies
WHERE 
  company_name ILIKE '%metalife%' OR
  name ILIKE '%metalife%' OR
  razao_social ILIKE '%metalife%'
LIMIT 1;

-- 4️⃣ CONTAR DECISORES
SELECT 
  c.company_name,
  COUNT(dm.id) as total_decisores_tabela,
  jsonb_array_length(COALESCE(c.raw_data->'decision_makers', '[]'::jsonb)) as decisores_em_raw_data
FROM public.companies c
LEFT JOIN public.decision_makers dm ON dm.company_id = c.id
WHERE 
  c.company_name ILIKE '%metalife%' OR
  c.name ILIKE '%metalife%' OR
  c.razao_social ILIKE '%metalife%'
GROUP BY c.id, c.company_name, c.raw_data;

