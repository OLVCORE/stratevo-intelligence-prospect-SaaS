-- =====================================================
-- 🧪 TESTE DE INSERÇÃO MANUAL
-- =====================================================
-- Testa se a inserção funciona diretamente no banco
-- Se funcionar, o problema é na Edge Function
-- Se falhar, o problema é RLS ou constraints
-- =====================================================

-- 1. TESTE DE INSERÇÃO SIMPLES (usando nome - português)
INSERT INTO tenant_products (
  tenant_id,
  nome,
  categoria,
  extraido_de,
  confianca_extracao
) VALUES (
  '4a542a72-b8d9-4b05-a96d-dba7e2da4761',
  'TESTE PRODUTO MANUAL - ' || NOW()::text,
  'TESTE',
  'manual',
  0.9
)
RETURNING id, nome, created_at;

-- NOTA: Se der erro de product_name, execute primeiro CORRIGIR_COLUNAS_PRODUCT_NAME_SEGURO.sql

-- 2. VERIFICAR SE FOI INSERIDO
SELECT 
  '✅ PRODUTO INSERIDO' as status,
  id,
  nome,
  categoria,
  created_at
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
  AND nome LIKE 'TESTE PRODUTO MANUAL%'
ORDER BY created_at DESC
LIMIT 1;

-- 3. LIMPAR TESTE (opcional - descomente para limpar)
-- DELETE FROM tenant_products 
-- WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'
--   AND nome LIKE 'TESTE PRODUTO MANUAL%';

