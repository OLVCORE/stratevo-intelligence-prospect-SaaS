-- ==========================================
-- RECUPERAR TENANTS UNILUVAS E OLV INTERNACIONAL
-- Execute no Supabase SQL Editor
-- ==========================================

-- 1. VERIFICAR SE OS TENANTS EXISTEM
SELECT id, nome, cnpj, status FROM tenants 
WHERE LOWER(nome) LIKE '%uniluvas%' OR LOWER(nome) LIKE '%olv%' OR LOWER(nome) LIKE '%internacional%';

-- 2. VERIFICAR SE ESTÃO NA LIXEIRA
SELECT id, original_tenant_id, nome, cnpj, deleted_at, permanently_deleted 
FROM deleted_tenants 
WHERE (LOWER(nome) LIKE '%uniluvas%' OR LOWER(nome) LIKE '%olv%' OR LOWER(nome) LIKE '%internacional%')
  AND permanently_deleted = FALSE;

-- 3. SE ESTIVEREM NA LIXEIRA, RESTAURAR (substitua ID_DELETED_TENANT pelo ID encontrado acima)
-- SELECT public.restore_tenant('ID_DELETED_TENANT_AQUI');

-- 4. VERIFICAR RELAÇÃO users -> tenants
SELECT u.id, u.auth_user_id, u.tenant_id, t.nome, t.cnpj
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE u.auth_user_id = 'b52ce768-b0f3-4996-9d5b-0b66b33b74bb';

-- 5. SE OS TENANTS EXISTEM MAS NÃO HÁ RELAÇÃO, RECRIAR (substitua os IDs)
/*
INSERT INTO users (auth_user_id, tenant_id, created_at, updated_at)
SELECT 
  'b52ce768-b0f3-4996-9d5b-0b66b33b74bb',
  t.id,
  NOW(),
  NOW()
FROM tenants t
WHERE (LOWER(t.nome) LIKE '%uniluvas%' OR LOWER(t.nome) LIKE '%olv%' OR LOWER(t.nome) LIKE '%internacional%')
  AND NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = 'b52ce768-b0f3-4996-9d5b-0b66b33b74bb' 
    AND u.tenant_id = t.id
  );
*/

