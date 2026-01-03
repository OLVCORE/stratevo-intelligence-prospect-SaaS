-- ============================================================================
-- 🔍 QUERIES DE DIAGNÓSTICO: CNPJ Duplicado
-- ============================================================================
-- Execute estas queries no Supabase SQL Editor para diagnosticar o problema
-- ============================================================================

-- 1. Verificar se o tenant OLV Internacional ainda está na tabela tenants
SELECT 
  id, 
  nome, 
  cnpj, 
  created_at, 
  updated_at,
  'ATIVO' as status
FROM tenants 
WHERE cnpj = '67867580000190'
ORDER BY created_at DESC;

-- 2. Verificar se está em deleted_tenants (lixeira)
SELECT 
  id,
  original_tenant_id,
  nome, 
  cnpj, 
  deleted_at,
  deleted_by,
  permanently_deleted,
  'DELETADO' as status
FROM deleted_tenants 
WHERE cnpj = '67867580000190'
ORDER BY deleted_at DESC;

-- 3. Verificar TODOS os tenants (ativos e deletados) com este CNPJ
SELECT 
  'ATIVO' as tipo,
  id::text as tenant_id,
  nome, 
  cnpj, 
  created_at as data
FROM tenants 
WHERE cnpj = '67867580000190'

UNION ALL

SELECT 
  'DELETADO' as tipo,
  original_tenant_id::text as tenant_id,
  nome, 
  cnpj, 
  deleted_at as data
FROM deleted_tenants 
WHERE cnpj = '67867580000190'
  AND permanently_deleted = FALSE

ORDER BY data DESC;

-- 4. Verificar se há múltiplos tenants ativos com o mesmo CNPJ (PROBLEMA!)
SELECT 
  cnpj,
  COUNT(*) as quantidade,
  STRING_AGG(nome, ', ') as nomes,
  STRING_AGG(id::text, ', ') as ids
FROM tenants 
WHERE cnpj IS NOT NULL 
  AND cnpj != ''
GROUP BY cnpj
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 5. Verificar RLS (Row Level Security) - ver se há políticas bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tenants';

-- ============================================================================
-- 🔧 SOLUÇÕES POSSÍVEIS
-- ============================================================================

-- SOLUÇÃO 1: Se o tenant ainda está em 'tenants', deletar manualmente
-- (Substitua 'TENANT_ID_AQUI' pelo ID do tenant)
/*
DELETE FROM tenants WHERE id = 'TENANT_ID_AQUI';
*/

-- SOLUÇÃO 2: Se o tenant está em 'deleted_tenants' mas ainda aparece,
-- verificar se há cache do PostgREST/Supabase
-- (Limpar cache: aguardar alguns minutos ou reiniciar o serviço)

-- SOLUÇÃO 3: Se há múltiplos tenants com o mesmo CNPJ,
-- manter apenas um e deletar os outros
/*
-- Listar todos
SELECT id, nome, cnpj, created_at 
FROM tenants 
WHERE cnpj = '67867580000190'
ORDER BY created_at DESC;

-- Deletar os duplicados (manter apenas o mais recente)
DELETE FROM tenants 
WHERE cnpj = '67867580000190'
  AND id NOT IN (
    SELECT id FROM tenants 
    WHERE cnpj = '67867580000190'
    ORDER BY created_at DESC 
    LIMIT 1
  );
*/

