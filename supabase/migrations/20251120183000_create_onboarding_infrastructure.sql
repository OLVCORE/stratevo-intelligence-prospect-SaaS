-- ============================================================================
-- MIGRATION: Criar tabelas e relacionamentos base do Onboarding + ICP
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  schema_name VARCHAR(255) UNIQUE NOT NULL,
  plano VARCHAR(50) DEFAULT 'FREE' CHECK (plano IN ('FREE','STARTER','GROWTH','ENTERPRISE')),
  status VARCHAR(50) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL','ACTIVE','SUSPENDED','CANCELED')),
  creditos INTEGER DEFAULT 10,
  data_expiracao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER','ADMIN','USER','VIEWER')),
  auth_user_id UUID UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  granted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18),
  ie VARCHAR(30),
  im VARCHAR(30),
  regime TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  step1_data JSONB,
  step2_data JSONB,
  step3_data JSONB,
  step4_data JSONB,
  step5_data JSONB,
  icp_recommendation JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','analyzed','completed')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tenant ON public.onboarding_sessions(tenant_id);
ALTER TABLE public.onboarding_sessions
  ADD CONSTRAINT onboarding_sessions_user_tenant_key UNIQUE (user_id, tenant_id);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public.tenants_read" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "public.users_read" ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "public.users_write" ON public.users FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "public.onboarding_sessions_authenticated" 
  ON public.onboarding_sessions FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT SELECT ON public.tenants TO authenticated, anon, service_role;
GRANT SELECT ON public.users TO authenticated, anon, service_role;
GRANT SELECT ON public.onboarding_sessions TO authenticated, anon, service_role;
GRANT SELECT ON public.user_roles TO authenticated, anon, service_role;
GRANT SELECT ON public.legal_data TO authenticated, anon, service_role;

COMMENT ON TABLE public.tenants IS 'Tenants raiz da plataforma';
COMMENT ON TABLE public.users IS 'Usuários da plataforma com tenant';
COMMENT ON TABLE public.onboarding_sessions IS 'Sessões de onboarding usadas pela IA';
COMMENT ON TABLE public.legal_data IS 'Dados legais default para cada tenant';

-- Reload do cache PostgREST após criar as tabelas
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.5);
  END LOOP;
END $$;

