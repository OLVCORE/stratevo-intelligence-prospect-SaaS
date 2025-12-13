-- ==========================================
-- 🔍 DIAGNÓSTICO SEGURO - SEM ALTERAÇÕES
-- ==========================================
-- Este script APENAS VERIFICA o estado atual
-- NÃO FAZ NENHUMA ALTERAÇÃO
-- ==========================================

-- 1. VERIFICAR QUAIS POLÍTICAS RLS EXISTEM
SELECT 
  '🔒 POLÍTICAS RLS ATUAIS' as secao,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_products'
ORDER BY policyname;

-- 2. VERIFICAR SE FUNÇÃO get_user_tenant_ids EXISTE
SELECT 
  '🔧 FUNÇÕES RPC' as secao,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_tenant_ids', 'insert_tenant_product')
ORDER BY routine_name;

-- 3. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  '🏗️ ESTRUTURA DA TABELA' as secao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND column_name IN ('nome', 'name', 'tenant_id', 'categoria', 'descricao')
ORDER BY ordinal_position;

-- 4. TESTAR SE SERVICE_ROLE_KEY CONSEGUE INSERIR (simulação)
-- NOTA: Isso só funciona se executado com SERVICE_ROLE_KEY
-- Se executar com usuário normal, vai mostrar erro de permissão (esperado)
SELECT 
  '🧪 TESTE DE PERMISSÃO' as secao,
  CASE 
    WHEN auth.uid() IS NULL THEN 'SERVICE_ROLE_KEY (pode inserir)'
    ELSE 'Usuário autenticado (precisa passar RLS)'
  END as tipo_acesso,
  COUNT(*) as produtos_visiveis
FROM tenant_products
WHERE tenant_id = '4a542a72-b8d9-4b05-a96d-dba7e2da4761';

