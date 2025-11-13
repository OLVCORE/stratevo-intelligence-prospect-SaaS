-- Migrar descrições que estão em outros lugares
UPDATE public.companies
SET description = COALESCE(
  raw_data->'apollo_organization'->>'short_description',
  raw_data->'apollo'->>'short_description',
  raw_data->'apollo_organization'->>'description',
  raw_data->'apollo'->>'description',
  raw_data->>'description',
  raw_data->>'notes'
)
WHERE description IS NULL
  AND raw_data IS NOT NULL;

-- Verificar
SELECT COUNT(*) FROM companies WHERE description IS NOT NULL;

