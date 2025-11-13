-- Ver raw_data de 5 empresas com apollo
SELECT 
  name,
  jsonb_pretty(raw_data) as raw_data_formatado
FROM companies
WHERE raw_data IS NOT NULL
  AND (
    raw_data ? 'apollo_organization'
    OR raw_data ? 'apollo'
  )
LIMIT 5;

