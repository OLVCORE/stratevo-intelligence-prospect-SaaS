-- ============================================================================
-- ✅ VERIFICAÇÃO FINAL: Confirmar que o tenant foi deletado corretamente
-- ============================================================================

-- 1. Verificar se o tenant AINDA está na tabela tenants (deve retornar 0 linhas)
SELECT 
  id, 
  nome, 
  cnpj,
  created_at,
  '❌ AINDA EXISTE EM TENANTS!' as status
FROM tenants 
WHERE cnpj = '67867580000190'
   OR id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';

-- 2. Verificar se está na lixeira (deleted_tenants) - deve retornar 1 linha
SELECT 
  id,
  original_tenant_id,
  nome, 
  cnpj, 
  deleted_at,
  deleted_by,
  permanently_deleted,
  '✅ ESTÁ NA LIXEIRA' as status
FROM deleted_tenants 
WHERE cnpj = '67867580000190'
   OR original_tenant_id = 'ab404d3b-0d2e-4196-bc69-784bdd35cec4';

-- 3. Verificação completa: Status do CNPJ
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM tenants WHERE cnpj = '67867580000190') 
    THEN '❌ AINDA EXISTE EM TENANTS - PROBLEMA!'
    ELSE '✅ NÃO EXISTE EM TENANTS - OK!'
  END as status_tenants,
  CASE 
    WHEN EXISTS (SELECT 1 FROM deleted_tenants WHERE cnpj = '67867580000190' AND permanently_deleted = FALSE) 
    THEN '✅ ESTÁ NA LIXEIRA - OK!'
    ELSE '⚠️ NÃO ESTÁ NA LIXEIRA'
  END as status_lixeira,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM tenants WHERE cnpj = '67867580000190')
     AND EXISTS (SELECT 1 FROM deleted_tenants WHERE cnpj = '67867580000190' AND permanently_deleted = FALSE)
    THEN '✅ DELEÇÃO CONCLUÍDA COM SUCESSO!'
    ELSE '❌ DELEÇÃO NÃO CONCLUÍDA'
  END as resultado_final;

