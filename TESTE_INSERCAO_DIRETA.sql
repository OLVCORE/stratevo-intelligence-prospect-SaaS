-- ==========================================
-- 🧪 TESTE DE INSERÇÃO DIRETA
-- ==========================================
-- Testar se conseguimos inserir um produto diretamente
-- Isso ajuda a identificar se o problema é RLS ou outra coisa
-- ==========================================

-- 1. Tentar inserir um produto de teste
-- NOTA: Execute com SERVICE_ROLE_KEY (via Supabase Dashboard ou Edge Function)
INSERT INTO tenant_products (
  tenant_id,
  nome,
  descricao,
  categoria,
  extraido_de,
  confianca_extracao
) VALUES (
  '4a542a72-b8d9-4b05-a96d-dba7e2da4761'::uuid,
  'PRODUTO TESTE - REMOVER DEPOIS',
  'Este é um produto de teste para verificar se inserção funciona',
  'Teste',
  'manual',
  1.0
)
RETURNING id, nome, created_at;

-- 2. Verificar se foi inserido
SELECT 
  '✅ VERIFICAÇÃO' as status,
  id,
  nome,
  created_at
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'::uuid
  AND nome = 'PRODUTO TESTE - REMOVER DEPOIS';

-- 3. Se funcionou, remover o produto de teste
-- DELETE FROM tenant_products 
-- WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761'::uuid
--   AND nome = 'PRODUTO TESTE - REMOVER DEPOIS';

