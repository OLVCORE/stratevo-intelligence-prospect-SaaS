-- ============================================================================
-- MIGRATION: Multi-Tenancy Schema-Based Architecture
-- ============================================================================
-- Data: 2025-01-15
-- Descrição: Implementa arquitetura multi-tenant com isolamento por schemas PostgreSQL
-- ============================================================================

-- ==========================================
-- SCHEMA PUBLIC - Metadados da Plataforma
-- ==========================================

-- Tabela de Tenants (Clientes da plataforma SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  
  -- Schema PostgreSQL dedicado
  schema_name VARCHAR(255) UNIQUE NOT NULL,
  
  -- Subscription
  plano VARCHAR(50) DEFAULT 'FREE' CHECK (plano IN ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE')),
  status VARCHAR(50) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED')),
  creditos INTEGER DEFAULT 10,
  
  -- Datas
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar TEXT,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  
  -- Autenticação Supabase Auth
  auth_user_id UUID UNIQUE, -- Referência ao auth.users do Supabase
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Stripe (ou outro gateway)
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  
  plano VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due
  
  periodo_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  periodo_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  
  cancelado_em TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- "EMPRESA_CRIADA", "BUSCA_EXECUTADA", etc.
  entity VARCHAR(100) NOT NULL, -- "EMPRESA", "DECISOR", etc.
  entity_id UUID,
  
  metadados JSONB,
  
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON public.tenants(cnpj);

-- ==========================================
-- FUNÇÃO: Criar Schema para Novo Tenant
-- ==========================================

CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Criar schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Tabela: empresas
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.empresas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cnpj VARCHAR(18) UNIQUE NOT NULL,
      razao_social VARCHAR(255) NOT NULL,
      nome_fantasia VARCHAR(255),
      cnae_principal VARCHAR(10) NOT NULL,
      cnae_descricao TEXT,
      setor VARCHAR(100) NOT NULL,
      porte VARCHAR(50) NOT NULL,
      estado VARCHAR(2) NOT NULL,
      cidade VARCHAR(100) NOT NULL,
      endereco TEXT,
      cep VARCHAR(10),
      website TEXT,
      telefone VARCHAR(20),
      email VARCHAR(255),
      faturamento_estimado DECIMAL(15,2),
      qtd_funcionarios INTEGER,
      icp_score INTEGER,
      icp_nivel VARCHAR(50),
      icp_confianca INTEGER,
      status VARCHAR(50) DEFAULT ''NOVO'',
      prioridade VARCHAR(50) DEFAULT ''MEDIA'',
      origem VARCHAR(50) DEFAULT ''UPLOAD_CSV'',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Índices empresas
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_icp_score ON %I.empresas(icp_score)', schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_status ON %I.empresas(status)', schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_prioridade ON %I.empresas(prioridade)', schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON %I.empresas(cnpj)', schema_name);
  
  -- Tabela: decisores
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.decisores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id UUID NOT NULL REFERENCES %I.empresas(id) ON DELETE CASCADE,
      nome VARCHAR(255) NOT NULL,
      cargo VARCHAR(255) NOT NULL,
      nivel VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      telefone VARCHAR(20),
      linkedin_url TEXT,
      fonte VARCHAR(100) NOT NULL,
      confianca INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_decisores_empresa ON %I.decisores(empresa_id)', schema_name);
  
  -- Tabela: digital_analysis
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.digital_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id UUID UNIQUE NOT NULL REFERENCES %I.empresas(id) ON DELETE CASCADE,
      tem_site BOOLEAN DEFAULT FALSE,
      site_url TEXT,
      site_score INTEGER,
      linkedin_url TEXT,
      facebook_url TEXT,
      instagram_url TEXT,
      youtube_url TEXT,
      trafego_estimado INTEGER,
      seo_score INTEGER,
      tecnologias JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  -- Tabela: competitor_analysis
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.competitor_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id UUID UNIQUE NOT NULL REFERENCES %I.empresas(id) ON DELETE CASCADE,
      sistemas_detectados JSONB NOT NULL,
      stack_resumo TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  -- Tabela: icp_analysis
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.icp_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id UUID UNIQUE NOT NULL REFERENCES %I.empresas(id) ON DELETE CASCADE,
      score_total INTEGER NOT NULL,
      nivel VARCHAR(50) NOT NULL,
      confianca INTEGER NOT NULL,
      scores JSONB NOT NULL,
      match_reasons JSONB NOT NULL,
      mismatch_reasons JSONB NOT NULL,
      proximos_passos JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  -- Tabela: icp_profile (configuração do tenant)
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.icp_profile (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setores_alvo JSONB NOT NULL,
      cnaes_alvo JSONB NOT NULL,
      porte_alvo JSONB NOT NULL,
      estados_alvo JSONB NOT NULL,
      regioes_alvo JSONB NOT NULL,
      faturamento_min DECIMAL(15,2),
      faturamento_max DECIMAL(15,2),
      funcionarios_min INTEGER,
      funcionarios_max INTEGER,
      caracteristicas_buscar JSONB NOT NULL,
      score_weights JSONB NOT NULL,
      clientes_historico JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Habilitar RLS nos schemas do tenant
  EXECUTE format('ALTER TABLE %I.empresas ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.decisores ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.digital_analysis ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.competitor_analysis ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.icp_analysis ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.icp_profile ENABLE ROW LEVEL SECURITY', schema_name);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER: Auto-criar schema ao inserir tenant
-- ==========================================

CREATE OR REPLACE FUNCTION auto_create_tenant_schema()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_tenant_schema(NEW.schema_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_tenant_schema ON public.tenants;
CREATE TRIGGER trigger_create_tenant_schema
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION auto_create_tenant_schema();

-- ==========================================
-- ROW LEVEL SECURITY - Schema Public
-- ==========================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem seu próprio tenant
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Política: Usuários só veem usuários do mesmo tenant
CREATE POLICY "Users can view same tenant users" ON public.users
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Política: Usuários só veem subscriptions do próprio tenant
CREATE POLICY "Users can view own tenant subscription" ON public.subscriptions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Política: Usuários só veem audit logs do próprio tenant
CREATE POLICY "Users can view own tenant audit logs" ON public.audit_logs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- ==========================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ==========================================

COMMENT ON TABLE public.tenants IS 'Clientes da plataforma SaaS - cada tenant tem schema dedicado';
COMMENT ON TABLE public.users IS 'Usuários multi-tenant - vinculados a um tenant específico';
COMMENT ON TABLE public.subscriptions IS 'Assinaturas e planos dos tenants';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria por tenant';
COMMENT ON FUNCTION create_tenant_schema IS 'Cria schema PostgreSQL dedicado para novo tenant';
COMMENT ON FUNCTION auto_create_tenant_schema IS 'Trigger que cria schema automaticamente ao inserir tenant';

