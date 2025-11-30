-- ============================================================================
-- FIX: Criar tabela users e função get_user_tenant se não existirem
-- ============================================================================
-- Execute este script no Supabase SQL Editor para corrigir o erro de login
-- ============================================================================

-- 1. Criar tabela users se não existir
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

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 3. Criar função get_user_tenant() se não existir
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

-- 4. Garantir permissões
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon;

-- 5. Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS se não existirem
DO $$ 
BEGIN
  -- Política: Usuários podem ver seu próprio registro
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own record'
  ) THEN
    CREATE POLICY "Users can view own record"
      ON public.users
      FOR SELECT
      USING (auth_user_id = auth.uid());
  END IF;

  -- Política: Usuários podem inserir seu próprio registro
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert own record'
  ) THEN
    CREATE POLICY "Users can insert own record"
      ON public.users
      FOR INSERT
      WITH CHECK (auth_user_id = auth.uid());
  END IF;

  -- Política: Usuários podem atualizar seu próprio registro
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own record'
  ) THEN
    CREATE POLICY "Users can update own record"
      ON public.users
      FOR UPDATE
      USING (auth_user_id = auth.uid())
      WITH CHECK (auth_user_id = auth.uid());
  END IF;
END $$;

-- 7. Verificar se tudo foi criado
DO $$
DECLARE
  table_exists BOOLEAN;
  function_exists BOOLEAN;
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

  -- Log
  RAISE NOTICE 'Tabela users existe: %', table_exists;
  RAISE NOTICE 'Função get_user_tenant existe: %', function_exists;
END $$;

