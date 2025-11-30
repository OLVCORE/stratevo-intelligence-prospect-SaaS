-- ============================================================================
-- MIGRATIONS ESSENCIAIS - PLATAFORMA MULTI-TENANT SAAS
-- ============================================================================
-- Data: 2025-01-19
-- Projeto: stratevo-intelligence-prospect-SaaS
-- Supabase: vkdvezuivlovzqxmnohk
-- Schema: public
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
-- 2. Cole TODO este script
-- 3. Clique em "Run" ou pressione Ctrl+Enter
-- 4. Aguarde a execução (pode levar 1-2 minutos)
-- ============================================================================
-- Este script contém APENAS tabelas essenciais, sem duplicatas, na ordem correta
-- ============================================================================

SET search_path = public;

-- ============================================================================
-- VERIFICAÇÃO INICIAL: Remover índices problemáticos se existirem
-- ============================================================================
-- Remover índices que podem falhar se colunas não existirem
DROP INDEX IF EXISTS public.idx_companies_apollo_org;
DROP INDEX IF EXISTS public.idx_decision_makers_company;
DROP INDEX IF EXISTS public.idx_icp_analysis_company;
DROP INDEX IF EXISTS public.idx_stc_verification_company;
DROP INDEX IF EXISTS public.idx_stc_agent_company;
DROP INDEX IF EXISTS public.idx_simple_totvs_company;
DROP INDEX IF EXISTS public.idx_sdr_deals_company;
DROP INDEX IF EXISTS public.idx_digital_maturity_company;
DROP INDEX IF EXISTS public.idx_digital_presence_company;
DROP INDEX IF EXISTS public.idx_insights_company;
DROP INDEX IF EXISTS public.idx_company_technologies_company;
DROP INDEX IF EXISTS public.idx_company_news_company;
DROP INDEX IF EXISTS public.idx_company_jobs_company;
DROP INDEX IF EXISTS public.idx_discarded_companies_company;
DROP INDEX IF EXISTS public.idx_leads_pool_company;
DROP INDEX IF EXISTS public.idx_suggested_companies_company;
DROP INDEX IF EXISTS public.idx_similar_companies_company;
DROP INDEX IF EXISTS public.idx_contacts_company;
DROP INDEX IF EXISTS public.idx_conversations_company;
DROP INDEX IF EXISTS public.idx_account_strategies_company;

-- ============================================================================
-- PARTE 1: TABELAS MULTI-TENANT (Core da Plataforma)
-- ============================================================================

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
  auth_user_id UUID UNIQUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  
  plano VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  
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
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id UUID,
  
  metadados JSONB,
  
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Onboarding Data (Perfil do Tenant)
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Step 1: Dados Básicos
  dados_basicos JSONB,
  
  -- Step 2: Atividades CNAEs
  atividades_cnaes JSONB,
  
  -- Step 3: Perfil Cliente Ideal (ICP Profile)
  perfil_cliente_ideal JSONB,
  
  -- Step 4: Situação Atual
  situacao_atual JSONB,
  
  -- Step 5: Histórico e Enriquecimento
  historico_enriquecimento JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices Multi-Tenant
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_tenant ON public.onboarding_data(tenant_id);

-- ============================================================================
-- PARTE 2: TABELAS CORE (Empresas e Decisores)
-- ============================================================================

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  cnpj TEXT UNIQUE,
  domain TEXT,
  website TEXT,
  industry TEXT,
  employees INTEGER,
  revenue TEXT,
  location JSONB,
  linkedin_url TEXT,
  technologies TEXT[],
  digital_maturity_score NUMERIC,
  raw_data JSONB,
  
  -- Multi-tenant: cada empresa pertence a um tenant
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas Apollo.io se não existirem (para compatibilidade com tabelas existentes)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_company_id TEXT,
  ADD COLUMN IF NOT EXISTS sub_industry TEXT,
  ADD COLUMN IF NOT EXISTS employee_count_range TEXT,
  ADD COLUMN IF NOT EXISTS headquarters_city TEXT,
  ADD COLUMN IF NOT EXISTS headquarters_state TEXT,
  ADD COLUMN IF NOT EXISTS headquarters_country TEXT,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS apollo_url TEXT,
  ADD COLUMN IF NOT EXISTS last_apollo_sync_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Índice para tenant_id (crítico para performance RLS)
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON public.companies(tenant_id) WHERE tenant_id IS NOT NULL;

-- Tabela de Decisores
CREATE TABLE IF NOT EXISTS public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin_url TEXT,
  department TEXT,
  seniority TEXT,
  verified_email BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar company_id em decision_makers se não existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'decision_makers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'decision_makers' AND column_name = 'company_id') THEN
      ALTER TABLE public.decision_makers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices Core
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_apollo_org ON public.companies(apollo_organization_id) WHERE apollo_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decision_makers_company ON public.decision_makers(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decision_makers_email ON public.decision_makers(email);

-- ============================================================================
-- PARTE 3: TABELAS ICP/STC (Análises e Verificações)
-- ============================================================================

-- Tabela de Análises ICP
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Dados da empresa (denormalizados para performance)
  razao_social TEXT,
  cnpj TEXT,
  domain TEXT,
  
  -- Score e Status
  icp_score INTEGER,
  temperatura TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'descartada')),
  
  -- Análise completa
  analysis_data JSONB,
  raw_analysis JSONB,
  
  -- Metadados
  analyzed_at TIMESTAMP WITH TIME ZONE,
  analyzed_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Histórico STC (Simple TOTVS Check)
CREATE TABLE IF NOT EXISTS public.stc_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  
  -- Resultados da verificação
  status TEXT NOT NULL,
  confidence TEXT DEFAULT 'medium',
  
  -- Métricas de matches
  triple_matches INTEGER DEFAULT 0,
  double_matches INTEGER DEFAULT 0,
  single_matches INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  
  -- Evidências e dados brutos
  evidences JSONB DEFAULT '[]'::jsonb,
  full_report JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados de execução
  sources_consulted INTEGER DEFAULT 0,
  queries_executed INTEGER DEFAULT 0,
  verification_duration_ms INTEGER,
  
  -- Auditoria
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conversas STC Agent
CREATE TABLE IF NOT EXISTS public.stc_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  conversation_data JSONB NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Simple TOTVS Checks
CREATE TABLE IF NOT EXISTS public.simple_totvs_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  
  check_result TEXT CHECK (check_result IN ('GO', 'NO-GO', 'REVISAR')),
  confidence_score INTEGER DEFAULT 0,
  
  evidences JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Matches Competitivos STC
CREATE TABLE IF NOT EXISTS public.competitor_stc_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  competitor_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  match_score INTEGER,
  match_reasons JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar company_id em tabelas ICP/STC se não existir (compatibilidade com tabelas existentes)
DO $$ 
BEGIN
  -- Adicionar company_id se tabela existir mas coluna não
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_analysis_results') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'icp_analysis_results' AND column_name = 'company_id') THEN
      ALTER TABLE public.icp_analysis_results ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stc_verification_history') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stc_verification_history' AND column_name = 'company_id') THEN
      ALTER TABLE public.stc_verification_history ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stc_agent_conversations') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stc_agent_conversations' AND column_name = 'company_id') THEN
      ALTER TABLE public.stc_agent_conversations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'simple_totvs_checks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'simple_totvs_checks' AND column_name = 'company_id') THEN
      ALTER TABLE public.simple_totvs_checks ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices ICP/STC
CREATE INDEX IF NOT EXISTS idx_icp_analysis_company ON public.icp_analysis_results(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_icp_analysis_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_cnpj ON public.icp_analysis_results(cnpj);
CREATE INDEX IF NOT EXISTS idx_stc_verification_company ON public.stc_verification_history(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stc_verification_status ON public.stc_verification_history(status);
CREATE INDEX IF NOT EXISTS idx_stc_verified_by ON public.stc_verification_history(verified_by) WHERE verified_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stc_agent_company ON public.stc_agent_conversations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stc_agent_conversations_user ON public.stc_agent_conversations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_simple_totvs_company ON public.simple_totvs_checks(company_id) WHERE company_id IS NOT NULL;

-- ============================================================================
-- PARTE 4: TABELAS SDR/PIPELINE (Vendas)
-- ============================================================================

-- Tabela de Pipeline Stages
CREATE TABLE IF NOT EXISTS public.sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Deals (Negócios/Oportunidades)
CREATE TABLE IF NOT EXISTS public.sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  assigned_to UUID,
  
  -- Pipeline & Estágio
  pipeline_id UUID,
  stage TEXT NOT NULL DEFAULT 'lead',
  stage_order INTEGER DEFAULT 0,
  
  -- Valores
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  lost_reason TEXT,
  won_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  source TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Sync Bitrix24
  bitrix24_synced_at TIMESTAMP WITH TIME ZONE,
  bitrix24_data JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Atividades de Deal
CREATE TABLE IF NOT EXISTS public.sdr_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.sdr_deals(id) ON DELETE CASCADE,
  user_id UUID,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'stage_change', 'status_change')),
  title TEXT NOT NULL,
  description TEXT,
  
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Notificações SDR
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deal_id UUID REFERENCES public.sdr_deals(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('deal_assigned', 'deal_stage_changed', 'deal_won', 'deal_lost', 'activity_created', 'reminder')),
  title TEXT NOT NULL,
  message TEXT,
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar company_id em tabelas SDR se não existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sdr_deals') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sdr_deals' AND column_name = 'company_id') THEN
      ALTER TABLE public.sdr_deals ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Índices SDR
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON public.sdr_deals(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned ON public.sdr_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sdr_deal_activities_deal ON public.sdr_deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_read ON public.sdr_notifications(read);

-- ============================================================================
-- PARTE 5: TABELAS DE INTELIGÊNCIA (Digital, Insights, Technologies)
-- ============================================================================

-- Tabela de Maturidade Digital
CREATE TABLE IF NOT EXISTS public.digital_maturity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  infrastructure_score NUMERIC,
  systems_score NUMERIC,
  processes_score NUMERIC,
  security_score NUMERIC,
  innovation_score NUMERIC,
  overall_score NUMERIC,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Presença Digital
CREATE TABLE IF NOT EXISTS public.digital_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  website_url TEXT,
  website_score INTEGER,
  linkedin_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  twitter_url TEXT,
  traffic_estimate INTEGER,
  seo_score INTEGER,
  social_media_score INTEGER,
  presence_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Insights
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence_score NUMERIC,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Tecnologias da Empresa
CREATE TABLE IF NOT EXISTS public.company_technologies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  technology_name TEXT NOT NULL,
  category TEXT,
  detection_method TEXT,
  confidence_score NUMERIC,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Notícias da Empresa
CREATE TABLE IF NOT EXISTS public.company_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  source TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  sentiment TEXT,
  summary TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Vagas da Empresa
CREATE TABLE IF NOT EXISTS public.company_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Insights da Empresa
CREATE TABLE IF NOT EXISTS public.company_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence_score NUMERIC,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Atualizações da Empresa
CREATE TABLE IF NOT EXISTS public.company_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  detected_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar company_id em tabelas Intelligence se não existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'digital_maturity') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'digital_maturity' AND column_name = 'company_id') THEN
      ALTER TABLE public.digital_maturity ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'digital_presence') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'digital_presence' AND column_name = 'company_id') THEN
      ALTER TABLE public.digital_presence ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insights') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'insights' AND column_name = 'company_id') THEN
      ALTER TABLE public.insights ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_technologies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_technologies' AND column_name = 'company_id') THEN
      ALTER TABLE public.company_technologies ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_news') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_news' AND column_name = 'company_id') THEN
      ALTER TABLE public.company_news ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_jobs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_jobs' AND column_name = 'company_id') THEN
      ALTER TABLE public.company_jobs ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_insights') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_insights' AND column_name = 'company_id') THEN
      ALTER TABLE public.company_insights ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_updates') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_updates' AND column_name = 'company_id') THEN
      ALTER TABLE public.company_updates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices Intelligence
CREATE INDEX IF NOT EXISTS idx_digital_maturity_company ON public.digital_maturity(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_digital_presence_company ON public.digital_presence(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insights_company ON public.insights(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_technologies_company ON public.company_technologies(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_news_company ON public.company_news(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_jobs_company ON public.company_jobs(company_id) WHERE company_id IS NOT NULL;

-- ============================================================================
-- PARTE 6: TABELAS DE LEADS E DESCOBERTA
-- ============================================================================

-- Tabela de Empresas Descartadas
CREATE TABLE IF NOT EXISTS public.discarded_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  cnpj TEXT,
  company_name TEXT,
  reason TEXT,
  discarded_by UUID,
  discarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pool de Leads
CREATE TABLE IF NOT EXISTS public.leads_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  icp_analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'qualified', 'converted', 'removed')),
  priority TEXT DEFAULT 'medium',
  source TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID
);

-- Tabela de Empresas Sugeridas
CREATE TABLE IF NOT EXISTS public.suggested_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  suggestion_reason TEXT,
  match_score NUMERIC,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Empresas Similares
CREATE TABLE IF NOT EXISTS public.similar_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  similar_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  similarity_score NUMERIC,
  similarity_reasons JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, similar_company_id)
);

-- Adicionar company_id em tabelas Leads se não existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'discarded_companies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'discarded_companies' AND column_name = 'company_id') THEN
      ALTER TABLE public.discarded_companies ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads_pool') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads_pool' AND column_name = 'company_id') THEN
      ALTER TABLE public.leads_pool ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suggested_companies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suggested_companies' AND column_name = 'company_id') THEN
      ALTER TABLE public.suggested_companies ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'similar_companies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'similar_companies' AND column_name = 'company_id') THEN
      ALTER TABLE public.similar_companies ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'similar_companies' AND column_name = 'similar_company_id') THEN
      ALTER TABLE public.similar_companies ADD COLUMN similar_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices Leads
CREATE INDEX IF NOT EXISTS idx_discarded_companies_company ON public.discarded_companies(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_pool_company ON public.leads_pool(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_pool_status ON public.leads_pool(status);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_company ON public.suggested_companies(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_similar_companies_company ON public.similar_companies(company_id) WHERE company_id IS NOT NULL;

-- ============================================================================
-- PARTE 7: TABELAS DE COMUNICAÇÃO (Contacts, Conversations, Messages)
-- ============================================================================

-- Tabela de Contatos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  decision_maker_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'qualified', 'unqualified')),
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  subject TEXT,
  channel TEXT CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'phone', 'other')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  sender_id UUID,
  sender_type TEXT CHECK (sender_type IN ('user', 'contact', 'system')),
  recipient_id UUID,
  
  subject TEXT,
  body TEXT NOT NULL,
  body_html TEXT,
  
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar company_id em tabelas Comunicação se não existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'company_id') THEN
      ALTER TABLE public.contacts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'company_id') THEN
      ALTER TABLE public.conversations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices Comunicação
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- ============================================================================
-- PARTE 8: TABELAS AUXILIARES (Configurações, Catálogos)
-- ============================================================================

-- Tabela de Presets de Filtros
CREATE TABLE IF NOT EXISTS public.filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Catálogo de Produtos
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sku TEXT UNIQUE,
  price NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Estratégias de Conta
CREATE TABLE IF NOT EXISTS public.account_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar company_id em account_strategies se não existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'account_strategies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_strategies' AND column_name = 'company_id') THEN
      ALTER TABLE public.account_strategies ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices Auxiliares
CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON public.filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_user ON public.filter_presets(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_strategies_company ON public.account_strategies(company_id) WHERE company_id IS NOT NULL;

-- ============================================================================
-- PARTE 9: FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função genérica para updated_at (hardened - verifica se coluna existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = TG_TABLE_SCHEMA
        AND table_name = TG_TABLE_NAME
        AND column_name = 'updated_at'
    ) THEN
      NEW.updated_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper para obter tenant_id do usuário atual (para RLS)
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Permissões para função helper
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO authenticated;

-- Função para criar schema do tenant
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
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
  
  -- Índices
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_icp_score ON %I.empresas(icp_score)', schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_status ON %I.empresas(status)', schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON %I.empresas(cnpj)', schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_decisores_empresa ON %I.decisores(empresa_id)', schema_name);
  
  -- RLS
  EXECUTE format('ALTER TABLE %I.empresas ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.decisores ENABLE ROW LEVEL SECURITY', schema_name);
  EXECUTE format('ALTER TABLE %I.icp_profile ENABLE ROW LEVEL SECURITY', schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-criar schema ao inserir tenant
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

-- Triggers para updated_at (idempotentes - drop antes de criar)
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON public.companies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decision_makers_updated_at ON public.decision_makers;
CREATE TRIGGER update_decision_makers_updated_at 
  BEFORE UPDATE ON public.decision_makers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_icp_analysis_results_updated_at ON public.icp_analysis_results;
CREATE TRIGGER update_icp_analysis_results_updated_at 
  BEFORE UPDATE ON public.icp_analysis_results 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sdr_deals_updated_at ON public.sdr_deals;
CREATE TRIGGER update_sdr_deals_updated_at 
  BEFORE UPDATE ON public.sdr_deals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_data_updated_at ON public.onboarding_data;
CREATE TRIGGER update_onboarding_data_updated_at 
  BEFORE UPDATE ON public.onboarding_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PARTE 10: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stc_verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stc_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_totvs_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discarded_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_strategies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES RLS MULTI-TENANT (IDEMPOTENTES)
-- ============================================================================

-- Helper: Tenant members can read tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants'
      AND policyname='Tenant members can read tenant'
  ) THEN
    CREATE POLICY "Tenant members can read tenant"
    ON public.tenants
    FOR SELECT
    TO authenticated
    USING (id = get_user_tenant());
  END IF;
END $$;

-- Helper: Tenant members can read users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users'
      AND policyname='Tenant members can read users'
  ) THEN
    CREATE POLICY "Tenant members can read users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_user_tenant());
  END IF;
END $$;

-- Helper: Tenant members can read subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions'
      AND policyname='Tenant members can read subscriptions'
  ) THEN
    CREATE POLICY "Tenant members can read subscriptions"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_user_tenant());
  END IF;
END $$;

-- Helper: Tenant members can read audit_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs'
      AND policyname='Tenant members can read audit_logs'
  ) THEN
    CREATE POLICY "Tenant members can read audit_logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_user_tenant());
  END IF;
END $$;

-- Helper: Tenant members manage onboarding_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_data'
      AND policyname='Tenant members manage onboarding_data'
  ) THEN
    CREATE POLICY "Tenant members manage onboarding_data"
    ON public.onboarding_data
    FOR ALL
    TO authenticated
    USING (tenant_id = get_user_tenant())
    WITH CHECK (tenant_id = get_user_tenant());
  END IF;
END $$;

-- Companies: Multi-tenant policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies'
      AND policyname='Tenant can read companies'
  ) THEN
    CREATE POLICY "Tenant can read companies"
    ON public.companies
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_user_tenant());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies'
      AND policyname='Tenant can write companies'
  ) THEN
    CREATE POLICY "Tenant can write companies"
    ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = get_user_tenant());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies'
      AND policyname='Tenant can update companies'
  ) THEN
    CREATE POLICY "Tenant can update companies"
    ON public.companies
    FOR UPDATE
    TO authenticated
    USING (tenant_id = get_user_tenant())
    WITH CHECK (tenant_id = get_user_tenant());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies'
      AND policyname='Tenant can delete companies'
  ) THEN
    CREATE POLICY "Tenant can delete companies"
    ON public.companies
    FOR DELETE
    TO authenticated
    USING (tenant_id = get_user_tenant());
  END IF;
END $$;

-- Decision makers: Multi-tenant via company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='decision_makers'
      AND policyname='Tenant can manage decision_makers'
  ) THEN
    CREATE POLICY "Tenant can manage decision_makers"
    ON public.decision_makers
    FOR ALL
    TO authenticated
    USING (
      company_id IN (
        SELECT c.id FROM public.companies c
        WHERE c.tenant_id = get_user_tenant()
      )
    )
    WITH CHECK (
      company_id IN (
        SELECT c.id FROM public.companies c
        WHERE c.tenant_id = get_user_tenant()
      )
    );
  END IF;
END $$;

-- ICP analysis results: Multi-tenant via company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_analysis_results'
      AND policyname='Tenant can manage icp_analysis_results'
  ) THEN
    CREATE POLICY "Tenant can manage icp_analysis_results"
    ON public.icp_analysis_results
    FOR ALL
    TO authenticated
    USING (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    )
    WITH CHECK (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    );
  END IF;
END $$;

-- STC verification history: Multi-tenant via company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stc_verification_history'
      AND policyname='Tenant can manage stc_verification_history'
  ) THEN
    CREATE POLICY "Tenant can manage stc_verification_history"
    ON public.stc_verification_history
    FOR ALL
    TO authenticated
    USING (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    )
    WITH CHECK (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    );
  END IF;
END $$;

-- STC agent conversations: Multi-tenant via company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stc_agent_conversations'
      AND policyname='Tenant can manage stc_agent_conversations'
  ) THEN
    CREATE POLICY "Tenant can manage stc_agent_conversations"
    ON public.stc_agent_conversations
    FOR ALL
    TO authenticated
    USING (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    )
    WITH CHECK (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    );
  END IF;
END $$;

-- Simple TOTVS checks: Multi-tenant via company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='simple_totvs_checks'
      AND policyname='Tenant can manage simple_totvs_checks'
  ) THEN
    CREATE POLICY "Tenant can manage simple_totvs_checks"
    ON public.simple_totvs_checks
    FOR ALL
    TO authenticated
    USING (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    )
    WITH CHECK (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    );
  END IF;
END $$;

-- SDR deals: Multi-tenant via company (permite NULL company_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sdr_deals'
      AND policyname='Tenant can manage sdr_deals'
  ) THEN
    CREATE POLICY "Tenant can manage sdr_deals"
    ON public.sdr_deals
    FOR ALL
    TO authenticated
    USING (
      company_id IS NULL OR company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    )
    WITH CHECK (
      company_id IS NULL OR company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    );
  END IF;
END $$;

-- SDR deal activities: Multi-tenant via deal -> company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sdr_deal_activities'
      AND policyname='Tenant can manage sdr_deal_activities'
  ) THEN
    CREATE POLICY "Tenant can manage sdr_deal_activities"
    ON public.sdr_deal_activities
    FOR ALL
    TO authenticated
    USING (
      deal_id IN (
        SELECT d.id
        FROM public.sdr_deals d
        LEFT JOIN public.companies c ON c.id = d.company_id
        WHERE d.company_id IS NULL OR c.tenant_id = get_user_tenant()
      )
    )
    WITH CHECK (
      deal_id IN (
        SELECT d.id
        FROM public.sdr_deals d
        LEFT JOIN public.companies c ON c.id = d.company_id
        WHERE d.company_id IS NULL OR c.tenant_id = get_user_tenant()
      )
    );
  END IF;
END $$;

-- SDR notifications: Multi-tenant via deal or user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sdr_notifications'
      AND policyname='Tenant can read sdr_notifications'
  ) THEN
    CREATE POLICY "Tenant can read sdr_notifications"
    ON public.sdr_notifications
    FOR SELECT
    TO authenticated
    USING (
      deal_id IN (
        SELECT d.id
        FROM public.sdr_deals d
        LEFT JOIN public.companies c ON c.id = d.company_id
        WHERE d.company_id IS NULL OR c.tenant_id = get_user_tenant()
      )
      OR user_id = auth.uid()
    );
  END IF;
END $$;

-- Intelligence tables: Multi-tenant via company (batch)
DO $$
BEGIN
  -- digital_maturity
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='digital_maturity'
      AND policyname='Tenant can manage digital_maturity'
  ) THEN
    CREATE POLICY "Tenant can manage digital_maturity"
    ON public.digital_maturity
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- digital_presence
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='digital_presence'
      AND policyname='Tenant can manage digital_presence'
  ) THEN
    CREATE POLICY "Tenant can manage digital_presence"
    ON public.digital_presence
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- insights
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insights'
      AND policyname='Tenant can manage insights'
  ) THEN
    CREATE POLICY "Tenant can manage insights"
    ON public.insights
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- company_technologies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_technologies'
      AND policyname='Tenant can manage company_technologies'
  ) THEN
    CREATE POLICY "Tenant can manage company_technologies"
    ON public.company_technologies
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- company_news
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_news'
      AND policyname='Tenant can manage company_news'
  ) THEN
    CREATE POLICY "Tenant can manage company_news"
    ON public.company_news
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- company_jobs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_jobs'
      AND policyname='Tenant can manage company_jobs'
  ) THEN
    CREATE POLICY "Tenant can manage company_jobs"
    ON public.company_jobs
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- company_insights
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_insights'
      AND policyname='Tenant can manage company_insights'
  ) THEN
    CREATE POLICY "Tenant can manage company_insights"
    ON public.company_insights
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- company_updates
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_updates'
      AND policyname='Tenant can manage company_updates'
  ) THEN
    CREATE POLICY "Tenant can manage company_updates"
    ON public.company_updates
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;
END $$;

-- Leads/discovery tables: Multi-tenant via company
DO $$
BEGIN
  -- discarded_companies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discarded_companies'
      AND policyname='Tenant can manage discarded_companies'
  ) THEN
    CREATE POLICY "Tenant can manage discarded_companies"
    ON public.discarded_companies
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- leads_pool
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads_pool'
      AND policyname='Tenant can manage leads_pool'
  ) THEN
    CREATE POLICY "Tenant can manage leads_pool"
    ON public.leads_pool
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- suggested_companies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='suggested_companies'
      AND policyname='Tenant can manage suggested_companies'
  ) THEN
    CREATE POLICY "Tenant can manage suggested_companies"
    ON public.suggested_companies
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- similar_companies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='similar_companies'
      AND policyname='Tenant can manage similar_companies'
  ) THEN
    CREATE POLICY "Tenant can manage similar_companies"
    ON public.similar_companies
    FOR ALL
    TO authenticated
    USING (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
      AND similar_company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    )
    WITH CHECK (
      company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
      AND similar_company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant())
    );
  END IF;
END $$;

-- Contacts, conversations, messages: Multi-tenant via company
DO $$
BEGIN
  -- contacts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts'
      AND policyname='Tenant can manage contacts'
  ) THEN
    CREATE POLICY "Tenant can manage contacts"
    ON public.contacts
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations'
      AND policyname='Tenant can manage conversations'
  ) THEN
    CREATE POLICY "Tenant can manage conversations"
    ON public.conversations
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;

  -- messages (via conversation -> company)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages'
      AND policyname='Tenant can manage messages'
  ) THEN
    CREATE POLICY "Tenant can manage messages"
    ON public.messages
    FOR ALL
    TO authenticated
    USING (
      conversation_id IN (
        SELECT conv.id
        FROM public.conversations conv
        JOIN public.companies c ON c.id = conv.company_id
        WHERE c.tenant_id = get_user_tenant()
      )
    )
    WITH CHECK (
      conversation_id IN (
        SELECT conv.id
        FROM public.conversations conv
        JOIN public.companies c ON c.id = conv.company_id
        WHERE c.tenant_id = get_user_tenant()
      )
    );
  END IF;
END $$;

-- Filter presets: Per-user (not tenant-scoped)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='filter_presets'
      AND policyname='User owns filter_presets'
  ) THEN
    CREATE POLICY "User owns filter_presets"
    ON public.filter_presets
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Account strategies: Multi-tenant via company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='account_strategies'
      AND policyname='Tenant can manage account_strategies'
  ) THEN
    CREATE POLICY "Tenant can manage account_strategies"
    ON public.account_strategies
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()))
    WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE tenant_id = get_user_tenant()));
  END IF;
END $$;

-- ============================================================================
-- RESUMO
-- ============================================================================
-- Total de tabelas criadas: 35
-- - Multi-Tenant: 5 tabelas
-- - Core: 2 tabelas
-- - ICP/STC: 5 tabelas
-- - SDR/Pipeline: 4 tabelas
-- - Intelligence: 7 tabelas
-- - Leads: 4 tabelas
-- - Comunicação: 3 tabelas
-- - Auxiliares: 3 tabelas
-- - Funções: 3 funções
-- - Triggers: 6 triggers
-- - RLS Policies: Implementadas
-- ============================================================================

