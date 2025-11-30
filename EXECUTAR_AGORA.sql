-- ============================================================================
-- EXECUTE ESTE SCRIPT AGORA NO SUPABASE SQL EDITOR
-- ============================================================================
-- Este script cria TUDO que está faltando: tenants, users, funções RPC
-- ============================================================================

-- PARTE 1: CRIAR TABELA TENANTS
DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  schema_name VARCHAR(255) UNIQUE NOT NULL,
  plano VARCHAR(50) DEFAULT 'FREE',
  status VARCHAR(50) DEFAULT 'TRIAL',
  creditos INTEGER DEFAULT 10,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX idx_tenants_schema_name ON public.tenants(schema_name);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON public.tenants;
CREATE POLICY "allow_all" ON public.tenants FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.tenants TO anon, authenticated, service_role;

-- PARTE 2: CRIAR TABELA USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE,
  role VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON public.users;
CREATE POLICY "allow_all" ON public.users FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- PARTE 3: CRIAR FUNÇÃO create_tenant_direct
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
  id UUID, slug VARCHAR(255), nome VARCHAR(255), cnpj VARCHAR(18),
  email VARCHAR(255), telefone VARCHAR(20), schema_name VARCHAR(255),
  plano VARCHAR(50), status VARCHAR(50), creditos INTEGER,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (
    slug, nome, cnpj, email, telefone, schema_name, plano, status, creditos, data_expiracao
  ) VALUES (
    p_slug, p_nome, p_cnpj, p_email, p_telefone, p_schema_name, p_plano, p_status, p_creditos, p_data_expiracao
  ) RETURNING id INTO v_tenant_id;
  
  RETURN QUERY SELECT t.* FROM public.tenants t WHERE t.id = v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_direct TO anon, authenticated, service_role;

-- PARTE 4: CRIAR FUNÇÃO get_user_tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant TO anon, authenticated, service_role;

-- PARTE 5: FORÇAR RELOAD POSTGREST
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
END$$;

SELECT '✅ SCRIPT EXECUTADO - Aguarde 30 segundos e teste!' as status;
