-- ============================================================================
-- DEBUG: VERIFICAR SE OS DADOS ESTÃO NO BANCO
-- ============================================================================

-- 1. Ver empresas que DEVERIAM ter links (última 10)
SELECT 
  id,
  name,
  cnpj,
  website,
  domain,
  linkedin_url,
  apollo_id,
  description,
  enrichment_source,
  enriched_at,
  (raw_data->>'decision_makers') as decision_makers_count,
  (raw_data->'apollo_organization'->>'linkedin_url') as apollo_org_linkedin,
  (raw_data->'apollo_organization'->>'short_description') as apollo_org_description
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver decisores salvos (últimos 20)
SELECT 
  dm.full_name,
  dm.position,
  dm.linkedin_url,
  dm.email,
  dm.data_source,
  c.name as company_name
FROM decision_makers dm
JOIN companies c ON c.id = dm.company_id
ORDER BY dm.created_at DESC
LIMIT 20;

-- 3. Ver empresa específica (AEROAGRICOLA CHAPADAO)
SELECT 
  id,
  name,
  cnpj,
  website,
  domain,
  linkedin_url,
  apollo_id,
  description,
  enrichment_source,
  raw_data->'apollo_organization' as apollo_org,
  raw_data->'decision_makers' as decision_makers_list
FROM companies
WHERE name ILIKE '%AEROAGRICOLA%'
   OR name ILIKE '%CHAPADAO%';

-- 4. Contar empresas COM e SEM dados
SELECT 
  COUNT(*) FILTER (WHERE website IS NOT NULL OR domain IS NOT NULL) as com_website,
  COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL) as com_linkedin,
  COUNT(*) FILTER (WHERE apollo_id IS NOT NULL) as com_apollo,
  COUNT(*) FILTER (WHERE description IS NOT NULL) as com_description,
  COUNT(*) as total
FROM companies;

-- 5. Ver raw_data de uma empresa específica (GF AUTO PECAS)
SELECT 
  name,
  raw_data
FROM companies
WHERE name ILIKE '%GF AUTO%'
LIMIT 1;

