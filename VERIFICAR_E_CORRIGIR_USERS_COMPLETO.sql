-- ============================================================================
-- VERIFICAÇÃO E CORREÇÃO COMPLETA: Tabela users e função get_user_tenant
-- ============================================================================
-- Execute este script para garantir que tudo está criado corretamente
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICAÇÃO
-- ============================================================================

-- 1. Verificar se a tabela users existe
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE '❌ Tabela users NÃO existe - será criada';
  ELSE
    RAISE NOTICE '✅ Tabela users existe';
  END IF;
END $$;

-- 2. Verificar se a função get_user_tenant existe
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_user_tenant'
  ) INTO function_exists;
  
  IF NOT function_exists THEN
    RAISE NOTICE '❌ Função get_user_tenant NÃO existe - será criada';
  ELSE
    RAISE NOTICE '✅ Função get_user_tenant existe';
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: CRIAR TABELA USERS (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar TEXT,
  
  -- Multi-tenant (NULL durante onboarding, preenchido após criar tenant)
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  
  -- Autenticação Supabase Auth
  auth_user_id UUID UNIQUE, -- Referência ao auth.users do Supabase
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PARTE 3: CRIAR ÍNDICES (idempotente)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================================
-- PARTE 4: CRIAR FUNÇÃO get_user_tenant (substituir se existir)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- PARTE 5: GARANTIR PERMISSÕES DA FUNÇÃO
-- ============================================================================

-- Revogar todas as permissões primeiro
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM anon;
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM authenticated;

-- Conceder permissões específicas
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon;

-- ============================================================================
-- PARTE 6: HABILITAR RLS NA TABELA USERS
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 7: CRIAR POLÍTICAS RLS (idempotente)
-- ============================================================================

-- Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can delete own record" ON public.users;

-- Criar políticas novas
CREATE POLICY "Users can view own record"
  ON public.users
  FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ============================================================================
-- PARTE 8: VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  function_exists BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Verificar tabela
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) INTO table_exists;

  -- Verificar função
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_user_tenant'
  ) INTO function_exists;

  -- Verificar RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relname = 'users';

  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users';

  -- Log de resultados
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO FINAL:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabela users existe: %', table_exists;
  RAISE NOTICE 'Função get_user_tenant existe: %', function_exists;
  RAISE NOTICE 'RLS habilitado: %', rls_enabled;
  RAISE NOTICE 'Número de políticas RLS: %', policy_count;
  RAISE NOTICE '========================================';
  
  IF table_exists AND function_exists AND rls_enabled AND policy_count >= 3 THEN
    RAISE NOTICE '✅ TUDO CONFIGURADO CORRETAMENTE!';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS CONFIGURAÇÕES ESTÃO FALTANDO';
  END IF;
END $$;

-- ============================================================================
-- PARTE 9: TESTE DA FUNÇÃO (se houver usuário autenticado)
-- ============================================================================

-- Este teste só funciona se você estiver autenticado
DO $$
DECLARE
  test_result UUID;
BEGIN
  -- Tentar executar a função
  BEGIN
    SELECT public.get_user_tenant() INTO test_result;
    RAISE NOTICE 'Teste da função: get_user_tenant() = %', test_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Não foi possível testar a função (usuário não autenticado ou erro): %', SQLERRM;
  END;
END $$;

