-- 🔥 POPULAR DADOS APOLLO ORGANIZATION MANUALMENTE PARA CAMPO LIMPO
-- Execute no Supabase SQL Editor

UPDATE companies 
SET raw_data = jsonb_set(
  COALESCE(raw_data, '{}'::jsonb),
  '{apollo_organization}',
  jsonb_build_object(
    'name', 'Campo Limpo Reciclagem e Transformação de Plásticos',
    'industry', 'Packaging & Containers',
    'keywords', ARRAY[
      'packaging & containers manufacturing',
      'shipping',
      'logistics & supply chain'
    ]::text[],
    'estimated_num_employees', 350,
    'founded_year', 2008,
    'short_description', 'Nosso propósito é desenvolver, juntos com os clientes, embalagens sustentáveis e soluções personalizadas para atender a especificidades de diferentes linhas de produção.'
  )
),
industry = 'Packaging & Containers'
WHERE name ILIKE '%CAMPO LIMPO%RECICLAGEM%'
   OR company_name ILIKE '%CAMPO LIMPO%RECICLAGEM%';

-- Verificar
SELECT 
  id,
  name,
  industry,
  raw_data->'apollo_organization'->>'name' as apollo_name,
  raw_data->'apollo_organization'->>'industry' as apollo_industry,
  raw_data->'apollo_organization'->>'estimated_num_employees' as employees,
  raw_data->'apollo_organization'->'keywords' as keywords
FROM companies
WHERE name ILIKE '%CAMPO LIMPO%RECICLAGEM%'
   OR company_name ILIKE '%CAMPO LIMPO%RECICLAGEM%';

