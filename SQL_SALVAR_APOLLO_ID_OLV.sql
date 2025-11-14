-- 🎯 SALVAR APOLLO ID CORRETO DA OLV INTERNACIONAL
-- Executar no SQL Editor do Supabase

UPDATE companies
SET 
  apollo_organization_id = '636619e93cc96900010a55de',
  apollo_id = '636619e93cc96900010a55de'
WHERE 
  cnpj = '67867580000190'
  OR name ILIKE '%OLV INTERNACIONAL%';

-- ✅ Verificar se salvou:
SELECT 
  id, 
  name, 
  cnpj,
  apollo_organization_id,
  apollo_id
FROM companies
WHERE cnpj = '67867580000190';

