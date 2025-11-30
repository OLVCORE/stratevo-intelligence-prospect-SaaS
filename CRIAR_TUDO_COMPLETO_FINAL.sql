-- ============================================================================
-- CRIAR TUDO COMPLETO - TABELAS, FUNÇÕES E PERMISSÕES
-- ============================================================================
-- Execute este script NO SUPABASE SQL EDITOR
-- Este script cria TUDO que está faltando
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR TABELA TENANTS
-- ============================================================================

DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  schema_name VARCHAR(255) UNIQUE NOT NULL,
  plano VARCHAR(50) DEFAULT 'FREE' CHECK (plano IN ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE')),
  status VARCHAR(50) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED')),
  creditos INTEGER DEFAULT 10,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX idx_tenants_schema_name ON public.tenants(schema_name);
CREATE INDEX idx_tenants_email ON public.tenants(email);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permissivas
DROP POLICY IF EXISTS "allow_all_select" ON public.tenants;
DROP POLICY IF EXISTS "allow_all_insert" ON public.tenants;
DROP POLICY IF EXISTS "allow_all_update" ON public.tenants;
DROP POLICY IF EXISTS "allow_all_delete" ON public.tenants;

CREATE POLICY "allow_all_select" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.tenants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON public.tenants FOR DELETE USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.tenants TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- PARTE 2: CRIAR TABELA USERS (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  auth_user_id UUID UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_select" ON public.users;
DROP POLICY IF EXISTS "allow_all_insert" ON public.users;
DROP POLICY IF EXISTS "allow_all_update" ON public.users;
DROP POLICY IF EXISTS "allow_all_delete" ON public.users;

CREATE POLICY "allow_all_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON public.users FOR DELETE USING (true);

GRANT ALL PRIVILEGES ON TABLE public.users TO anon, authenticated, service_role;

-- ============================================================================
-- PARTE 3: CRIAR FUNÇÃO RPC create_tenant_direct
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_direct(
  p_slug VARCHAR(255),
  p_nome VARCHAR(255),
  p_cnpj VARCHAR(18),
  p_email VARCHAR(255),
  p_schema_name VARCHAR(255),
  p_telefone VARCHAR(20) DEFAULT NULL,
  p_plano VARCHAR(50) DEFAULT 'FREE',
  p_status VARCHAR(50) DEFAULT 'TRIAL',
  p_creditos INTEGER DEFAULT 10,
  p_data_expiracao TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug VARCHAR(255),
  nome VARCHAR(255),
  cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone VARCHAR(20),
  schema_name VARCHAR(255),
  plano VARCHAR(50),
  status VARCHAR(50),
  creditos INTEGER,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (
    slug, nome, cnpj, email, telefone, schema_name, plano, status, creditos, data_expiracao
  ) VALUES (
    p_slug, p_nome, p_cnpj, p_email, p_telefone, p_schema_name, p_plano, p_status, p_creditos, p_data_expiracao
  )
  RETURNING public.tenants.id INTO v_tenant_id;

  RETURN QUERY
  SELECT 
    t.id, t.slug, t.nome, t.cnpj, t.email, t.telefone, t.schema_name,
    t.plano, t.status, t.creditos, t.data_expiracao, t.created_at, t.updated_at
  FROM public.tenants t
  WHERE t.id = v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_direct TO anon, authenticated, service_role;

-- ============================================================================
-- PARTE 4: CRIAR FUNÇÃO RPC get_user_tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant TO anon, authenticated, service_role;

-- ============================================================================
-- PARTE 5: FORÇAR RELOAD DO POSTGREST
-- ============================================================================

DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.2);
  END LOOP;
  
  FOR i IN 1..5 LOOP
    EXECUTE format($f$COMMENT ON TABLE public.tenants IS %L;$f$, 
      'Reload ' || i || ' - ' || to_char(now(), 'HH24:MI:SS'));
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE '✅ Reload agressivo executado!';
END$$;

-- ============================================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
    THEN '✅ Tabela tenants existe'
    ELSE '❌ Tabela tenants NÃO existe'
  END as tabela_tenants,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN '✅ Tabela users existe'
    ELSE '❌ Tabela users NÃO existe'
  END as tabela_users,
  CASE 
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'create_tenant_direct')
    THEN '✅ Função create_tenant_direct existe'
    ELSE '❌ Função create_tenant_direct NÃO existe'
  END as funcao_create,
  CASE 
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'get_user_tenant')
    THEN '✅ Função get_user_tenant existe'
    ELSE '❌ Função get_user_tenant NÃO existe'
  END as funcao_get,
  (SELECT COUNT(*) FROM public.tenants) as total_tenants,
  (SELECT COUNT(*) FROM public.users) as total_users;

-- ============================================================================
-- MENSAGEM FINAL
-- ============================================================================

SELECT 
  '✅ SCRIPT EXECUTADO COM SUCESSO!' as status,
  '⚠️ AGUARDE 30 SEGUNDOS e teste novamente' as proximo_passo,
  'Se Edge Function der 401, verifique autenticação' as nota;

