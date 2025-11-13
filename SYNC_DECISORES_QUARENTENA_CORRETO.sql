-- ============================================================================
-- SYNC DECISORES: companies → icp_analysis_results
-- ============================================================================

-- PASSO 1: Adicionar decision_makers no raw_data (não raw_analysis!)
UPDATE icp_analysis_results iar
SET raw_data = jsonb_set(
  COALESCE(iar.raw_data, '{}'::jsonb),
  '{decision_makers}',
  COALESCE(c.raw_data->'decision_makers', '[]'::jsonb)
)
FROM companies c
WHERE c.cnpj = iar.cnpj
  AND c.raw_data->'decision_makers' IS NOT NULL;

-- PASSO 2: Copiar linkedin_url
UPDATE icp_analysis_results iar
SET raw_data = jsonb_set(
  COALESCE(iar.raw_data, '{}'::jsonb),
  '{linkedin_url}',
  to_jsonb(c.linkedin_url)
)
FROM companies c
WHERE c.cnpj = iar.cnpj
  AND c.linkedin_url IS NOT NULL;

-- PASSO 3: Copiar apollo_id
UPDATE icp_analysis_results iar
SET raw_data = jsonb_set(
  COALESCE(iar.raw_data, '{}'::jsonb),
  '{apollo_id}',
  to_jsonb(c.apollo_id)
)
FROM companies c
WHERE c.cnpj = iar.cnpj
  AND c.apollo_id IS NOT NULL;

-- PASSO 4: Copiar description
UPDATE icp_analysis_results iar
SET raw_data = jsonb_set(
  COALESCE(iar.raw_data, '{}'::jsonb),
  '{description}',
  to_jsonb(c.description)
)
FROM companies c
WHERE c.cnpj = iar.cnpj
  AND c.description IS NOT NULL;

-- PASSO 5: Copiar apollo_organization
UPDATE icp_analysis_results iar
SET raw_data = jsonb_set(
  COALESCE(iar.raw_data, '{}'::jsonb),
  '{apollo_organization}',
  COALESCE(c.raw_data->'apollo_organization', '{}'::jsonb)
)
FROM companies c
WHERE c.cnpj = iar.cnpj
  AND c.raw_data->'apollo_organization' IS NOT NULL;

-- VERIFICAR RESULTADO
SELECT 
  iar.razao_social,
  jsonb_array_length(iar.raw_data->'decision_makers') as total_decisores,
  iar.raw_data->>'linkedin_url' as linkedin,
  iar.raw_data->>'apollo_id' as apollo,
  iar.raw_data->>'description' as description
FROM icp_analysis_results iar
WHERE iar.raw_data->'decision_makers' IS NOT NULL
  AND jsonb_typeof(iar.raw_data->'decision_makers') = 'array'
  AND jsonb_array_length(iar.raw_data->'decision_makers') > 0
LIMIT 10;

