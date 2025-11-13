-- Atualizar descrições usando dados REAIS do Apollo
UPDATE public.companies
SET description = 
  CASE 
    WHEN raw_data->'apollo_organization'->>'name' IS NOT NULL 
    THEN CONCAT(
      raw_data->'apollo_organization'->>'industry',
      ' company with ',
      raw_data->'apollo_organization'->>'estimated_num_employees',
      ' employees'
    )
    ELSE NULL
  END
WHERE raw_data->'apollo_organization' IS NOT NULL
  AND description IS NULL;

-- VERIFICAR
SELECT 
  name,
  description,
  raw_data->'apollo_organization'->>'industry' as industry_apollo
FROM companies
WHERE apollo_id IS NOT NULL
LIMIT 5;

