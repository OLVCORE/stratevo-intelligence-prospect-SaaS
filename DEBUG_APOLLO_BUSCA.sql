-- 🔍 DEBUG: Verificar dados da OLV INTERNACIONAL para Apollo
-- Executar no SQL Editor do Supabase

SELECT 
  id,
  name,
  company_name,
  cnpj,
  
  -- ✅ CAMPOS PARA BUSCA APOLLO:
  cep,
  (raw_data->>'cep') as raw_cep,
  (raw_data->'receita_federal'->>'cep') as receita_cep,
  
  fantasia,
  (raw_data->>'nome_fantasia') as raw_fantasia,
  (raw_data->'receita_federal'->>'fantasia') as receita_fantasia,
  
  city,
  (raw_data->>'municipio') as raw_municipio,
  (raw_data->'receita_federal'->>'municipio') as receita_municipio,
  
  state,
  (raw_data->>'uf') as raw_uf,
  (raw_data->'receita_federal'->>'uf') as receita_uf,
  
  domain,
  website,
  
  apollo_id,
  apollo_organization_id

FROM companies
WHERE name ILIKE '%OLV INTERNACIONAL%'
OR company_name ILIKE '%OLV INTERNACIONAL%'
OR cnpj = '14.853.935/0001-53';

