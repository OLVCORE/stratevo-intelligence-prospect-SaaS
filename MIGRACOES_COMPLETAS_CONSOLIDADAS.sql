-- ============================================================================
-- MIGRATIONS COMPLETAS DO PROJETO ANTERIOR - CONSOLIDADAS
-- ============================================================================
-- Data: 2025-11-19 01:08:41
-- Projeto Origem: olv-intelligent-prospecting
-- Projeto Destino: stratevo-intelligence-prospect-SaaS
-- Supabase: vkdvezuivlovzqxmnohk
-- Schema: public
-- ============================================================================
-- INSTRUÃ‡Ã•ES:
-- 1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
-- 2. Cole TODO este script
-- 3. Clique em "Run" ou pressione Ctrl+Enter
-- 4. Aguarde a execuÃ§Ã£o (pode levar 3-5 minutos devido ao volume)
-- ============================================================================
-- ATENÃ‡ÃƒO: Este script contÃ©m TODAS as tabelas, funÃ§Ãµes, triggers e policies
-- do projeto anterior. Execute com cuidado em ambiente de produÃ§Ã£o.
-- ============================================================================

SET search_path = public;


-- ============================================================================
-- MIGRATION: 20241201000000_create_filter_presets.sql
-- ============================================================================

-- Criar tabela para presets de filtros
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_created_at ON filter_presets(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios presets
CREATE POLICY "Users can view their own presets"
  ON filter_presets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem criar seus próprios presets
CREATE POLICY "Users can create their own presets"
  ON filter_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seus próprios presets
CREATE POLICY "Users can update their own presets"
  ON filter_presets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seus próprios presets
CREATE POLICY "Users can delete their own presets"
  ON filter_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_filter_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_filter_presets_updated_at();



-- ============================================================================
-- MIGRATION: 20250106000000_enterprise_report_system.sql
-- ============================================================================

-- =====================================================
-- ENTERPRISE REPORT SYSTEM - COMPLETE ARCHITECTURE
-- Inspired by Salesforce/HubSpot/ZoomInfo
-- =====================================================

-- 1. REPORT STATE (controla estado atual do relatório)
CREATE TABLE IF NOT EXISTS report_state (
  report_id UUID PRIMARY KEY REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  current_step VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft/processing/completed/failed
  steps_completed TEXT[] DEFAULT '{}',
  total_steps INT DEFAULT 9,
  progress_percent INT DEFAULT 0,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_state_status ON report_state(status);
CREATE INDEX idx_report_state_updated ON report_state(updated_at DESC);

-- 2. JOB QUEUE (fila de processamento)
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- discovery/competitors/clients/decisores/etc
  priority INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/running/completed/failed
  input_data JSONB,
  output_data JSONB,
  error TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status ON job_queue(status, priority DESC, scheduled_at);
CREATE INDEX idx_job_queue_report ON job_queue(report_id);

-- 3. API CALLS LOG (rastreamento completo de custos)
CREATE TABLE IF NOT EXISTS api_calls_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_queue(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- serper/hunter/apollo/openai/jina
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_body JSONB,
  response_body JSONB,
  status_code INT,
  cost_usd DECIMAL(10,6),
  duration_ms INT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_calls_report ON api_calls_log(report_id);
CREATE INDEX idx_api_calls_provider ON api_calls_log(provider, created_at DESC);
CREATE INDEX idx_api_calls_cost ON api_calls_log(cost_usd DESC);

-- 4. REPORT EVENTS (event sourcing - histórico completo)
CREATE TABLE IF NOT EXISTS report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- created/step_started/step_completed/error/retry
  event_data JSONB,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_events_report ON report_events(report_id, created_at DESC);
CREATE INDEX idx_report_events_type ON report_events(event_type);

-- 5. STEP REGISTRY (define todas as etapas possíveis)
CREATE TABLE IF NOT EXISTS step_registry (
  step_key VARCHAR(50) PRIMARY KEY,
  step_name VARCHAR(100) NOT NULL,
  step_order INT NOT NULL,
  estimated_duration_seconds INT,
  requires_steps TEXT[] DEFAULT '{}',
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Popular steps padrão
INSERT INTO step_registry (step_key, step_name, step_order, estimated_duration_seconds, is_required) VALUES
  ('discovery', 'Keywords & SEO Discovery', 1, 30, true),
  ('totvs', 'Verificação TOTVS', 2, 20, true),
  ('competitors', 'Análise de Competidores', 3, 40, false),
  ('similar', 'Empresas Similares', 4, 35, false),
  ('clients', 'Descoberta de Clientes', 5, 45, false),
  ('decisores', 'Decisores e Contatos', 6, 50, false),
  ('analysis_360', 'Análise 360°', 7, 25, false),
  ('products', 'Produtos Recomendados', 8, 15, false),
  ('executive', 'Sumário Executivo', 9, 10, true)
ON CONFLICT (step_key) DO NOTHING;

-- 6. FUNCTION: Create report with initial state
CREATE OR REPLACE FUNCTION create_report_with_state(
  p_company_id UUID,
  p_company_name TEXT,
  p_cnpj TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  -- Inserir relatório
  INSERT INTO stc_verification_history (
    company_id,
    company_name,
    cnpj,
    status,
    confidence,
    triple_matches,
    double_matches,
    single_matches,
    total_score,
    evidences,
    sources_consulted,
    queries_executed,
    full_report
  ) VALUES (
    p_company_id,
    p_company_name,
    p_cnpj,
    'draft',
    '0%',
    0, 0, 0, 0,
    '[]'::jsonb,
    0, 0,
    jsonb_build_object(
      '__meta', jsonb_build_object(
        'created_at', NOW(),
        'status', 'draft',
        'company_name', p_company_name,
        'cnpj', p_cnpj
      ),
      '__status', jsonb_build_object(
        'keywords', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'totvs', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'competitors', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'similar', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'clients', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'decisores', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'analysis_360', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'products', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'executive', jsonb_build_object('status', 'draft', 'updated_at', NULL)
      )
    )
  )
  RETURNING id INTO v_report_id;

  -- Inserir estado inicial
  INSERT INTO report_state (
    report_id,
    status,
    current_step,
    steps_completed,
    progress_percent
  ) VALUES (
    v_report_id,
    'draft',
    NULL,
    '{}',
    0
  );

  -- Logar evento
  INSERT INTO report_events (report_id, event_type, event_data) VALUES (
    v_report_id,
    'created',
    jsonb_build_object('company_name', p_company_name, 'cnpj', p_cnpj)
  );

  RETURN v_report_id;
END;
$$;

-- 7. FUNCTION: Enqueue job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_report_id UUID,
  p_job_type VARCHAR(50),
  p_input_data JSONB DEFAULT NULL,
  p_priority INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO job_queue (
    report_id,
    job_type,
    input_data,
    priority,
    status
  ) VALUES (
    p_report_id,
    p_job_type,
    p_input_data,
    p_priority,
    'pending'
  )
  RETURNING id INTO v_job_id;

  -- Logar evento
  INSERT INTO report_events (report_id, event_type, event_data) VALUES (
    p_report_id,
    'job_queued',
    jsonb_build_object('job_id', v_job_id, 'job_type', p_job_type)
  );

  RETURN v_job_id;
END;
$$;

-- 8. FUNCTION: Update report progress
CREATE OR REPLACE FUNCTION update_report_progress(
  p_report_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count INT;
  v_total_count INT;
  v_progress INT;
BEGIN
  -- Contar steps completados
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*)
  INTO v_completed_count, v_total_count
  FROM job_queue
  WHERE report_id = p_report_id;

  -- Calcular progresso
  v_progress := CASE 
    WHEN v_total_count > 0 THEN (v_completed_count * 100 / v_total_count)
    ELSE 0
  END;

  -- Atualizar report_state
  UPDATE report_state
  SET 
    progress_percent = v_progress,
    updated_at = NOW()
  WHERE report_id = p_report_id;
END;
$$;

-- 9. FUNCTION: Log API call
CREATE OR REPLACE FUNCTION log_api_call(
  p_report_id UUID,
  p_job_id UUID,
  p_provider VARCHAR(50),
  p_endpoint VARCHAR(255),
  p_status_code INT,
  p_cost_usd DECIMAL DEFAULT 0,
  p_duration_ms INT DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_request_body JSONB DEFAULT NULL,
  p_response_body JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO api_calls_log (
    report_id,
    job_id,
    provider,
    endpoint,
    request_body,
    response_body,
    status_code,
    cost_usd,
    duration_ms,
    success,
    error_message
  ) VALUES (
    p_report_id,
    p_job_id,
    p_provider,
    p_endpoint,
    p_request_body,
    p_response_body,
    p_status_code,
    p_cost_usd,
    p_duration_ms,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 10. VIEW: Report dashboard (para monitoramento)
CREATE OR REPLACE VIEW report_dashboard AS
SELECT 
  r.id AS report_id,
  r.company_name,
  r.cnpj,
  r.status AS report_status,
  rs.status AS state_status,
  rs.current_step,
  rs.progress_percent,
  rs.steps_completed,
  rs.started_at,
  rs.completed_at,
  EXTRACT(EPOCH FROM (COALESCE(rs.completed_at, NOW()) - rs.started_at)) AS duration_seconds,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id) AS total_jobs,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id AND status = 'completed') AS completed_jobs,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id AND status = 'failed') AS failed_jobs,
  (SELECT SUM(cost_usd) FROM api_calls_log WHERE report_id = r.id) AS total_cost_usd,
  (SELECT COUNT(*) FROM api_calls_log WHERE report_id = r.id) AS total_api_calls,
  r.created_at,
  r.updated_at
FROM stc_verification_history r
LEFT JOIN report_state rs ON rs.report_id = r.id
ORDER BY r.created_at DESC;

-- 11. TRIGGER: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_report_state_updated_at
  BEFORE UPDATE ON report_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. RLS Policies (Row Level Security)
ALTER TABLE report_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_events ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
CREATE POLICY "Admin full access on report_state" ON report_state FOR ALL USING (true);
CREATE POLICY "Admin full access on job_queue" ON job_queue FOR ALL USING (true);
CREATE POLICY "Admin full access on api_calls_log" ON api_calls_log FOR ALL USING (true);
CREATE POLICY "Admin full access on report_events" ON report_events FOR ALL USING (true);

-- 13. Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_history_company ON stc_verification_history(company_name);
CREATE INDEX IF NOT EXISTS idx_stc_history_created ON stc_verification_history(created_at DESC);

COMMENT ON TABLE report_state IS 'Estado atual de cada relatório (fonte única de verdade)';
COMMENT ON TABLE job_queue IS 'Fila de processamento assíncrono (backend workers)';
COMMENT ON TABLE api_calls_log IS 'Log completo de todas chamadas externas (auditoria e custos)';
COMMENT ON TABLE report_events IS 'Event sourcing - histórico completo de tudo que aconteceu';
COMMENT ON TABLE step_registry IS 'Define todas as etapas possíveis do relatório';



-- ============================================================================
-- MIGRATION: 20250108_create_sdr_pipeline_stages.sql
-- ============================================================================

-- Create sdr_pipeline_stages table
CREATE TABLE IF NOT EXISTS sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  probability_default INTEGER NOT NULL DEFAULT 50,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default stages
INSERT INTO sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Discovery', 'discovery', 1, '#3b82f6', 10, FALSE, FALSE),
  ('Qualification', 'qualification', 2, '#8b5cf6', 30, FALSE, FALSE),
  ('Proposal', 'proposal', 3, '#f59e0b', 50, FALSE, FALSE),
  ('Negotiation', 'negotiation', 4, '#10b981', 70, FALSE, FALSE),
  ('Closed Won', 'won', 5, '#22c55e', 100, TRUE, TRUE),
  ('Closed Lost', 'lost', 6, '#ef4444', 0, TRUE, FALSE);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sdr_pipeline_stages_order ON sdr_pipeline_stages(order_index);

-- Enable RLS
ALTER TABLE sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all authenticated users to read)
CREATE POLICY "Allow authenticated users to read stages"
  ON sdr_pipeline_stages FOR SELECT
  TO authenticated
  USING (true);



-- ============================================================================
-- MIGRATION: 20250115000000_init_multi_tenant.sql
-- ============================================================================

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



-- ============================================================================
-- MIGRATION: 20251020195558_3a57d7dd-4cda-4737-bcb0-f097a394ccb9.sql
-- ============================================================================

-- Tabela de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de decisores
CREATE TABLE public.decision_makers (
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

-- Tabela de sinais de compra
CREATE TABLE public.buying_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  description TEXT,
  source TEXT,
  confidence_score NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de maturidade digital
CREATE TABLE public.digital_maturity (
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

-- Tabela de histórico de buscas
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_companies_domain ON public.companies(domain);
CREATE INDEX idx_decision_makers_company ON public.decision_makers(company_id);
CREATE INDEX idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX idx_buying_signals_company ON public.buying_signals(company_id);
CREATE INDEX idx_digital_maturity_company ON public.digital_maturity(company_id);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas (todos podem ler e inserir)
CREATE POLICY "Public read access on companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Public insert access on companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on companies" ON public.companies FOR UPDATE USING (true);

CREATE POLICY "Public read access on decision_makers" ON public.decision_makers FOR SELECT USING (true);
CREATE POLICY "Public insert access on decision_makers" ON public.decision_makers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on decision_makers" ON public.decision_makers FOR UPDATE USING (true);

CREATE POLICY "Public read access on buying_signals" ON public.buying_signals FOR SELECT USING (true);
CREATE POLICY "Public insert access on buying_signals" ON public.buying_signals FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access on digital_maturity" ON public.digital_maturity FOR SELECT USING (true);
CREATE POLICY "Public insert access on digital_maturity" ON public.digital_maturity FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on digital_maturity" ON public.digital_maturity FOR UPDATE USING (true);

CREATE POLICY "Public read access on search_history" ON public.search_history FOR SELECT USING (true);
CREATE POLICY "Public insert access on search_history" ON public.search_history FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_makers_updated_at
BEFORE UPDATE ON public.decision_makers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_digital_maturity_updated_at
BEFORE UPDATE ON public.digital_maturity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251020211817_49e32a68-5a1c-4e84-9e82-695fead2dd7c.sql
-- ============================================================================

-- Enable RLS on all tables (they already have policies but let's ensure it's enabled)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Drop all existing public policies
DROP POLICY IF EXISTS "Public read access on companies" ON public.companies;
DROP POLICY IF EXISTS "Public insert access on companies" ON public.companies;
DROP POLICY IF EXISTS "Public update access on companies" ON public.companies;

DROP POLICY IF EXISTS "Public read access on decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Public insert access on decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Public update access on decision_makers" ON public.decision_makers;

DROP POLICY IF EXISTS "Public read access on buying_signals" ON public.buying_signals;
DROP POLICY IF EXISTS "Public insert access on buying_signals" ON public.buying_signals;

DROP POLICY IF EXISTS "Public read access on digital_maturity" ON public.digital_maturity;
DROP POLICY IF EXISTS "Public insert access on digital_maturity" ON public.digital_maturity;
DROP POLICY IF EXISTS "Public update access on digital_maturity" ON public.digital_maturity;

DROP POLICY IF EXISTS "Public read access on search_history" ON public.search_history;
DROP POLICY IF EXISTS "Public insert access on search_history" ON public.search_history;

-- Create new authenticated-only policies for companies
CREATE POLICY "Authenticated users can read companies"
ON public.companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role can manage companies"
ON public.companies FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for decision_makers
CREATE POLICY "Authenticated users can read decision_makers"
ON public.decision_makers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert decision_makers"
ON public.decision_makers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update decision_makers"
ON public.decision_makers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage decision_makers"
ON public.decision_makers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for buying_signals
CREATE POLICY "Authenticated users can read buying_signals"
ON public.buying_signals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage buying_signals"
ON public.buying_signals FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for digital_maturity
CREATE POLICY "Authenticated users can read digital_maturity"
ON public.digital_maturity FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage digital_maturity"
ON public.digital_maturity FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create new authenticated-only policies for search_history
CREATE POLICY "Authenticated users can read search_history"
ON public.search_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage search_history"
ON public.search_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251021013311_39762bd9-4cd7-446b-ad71-c13a8fed66ad.sql
-- ============================================================================

-- Tabela para armazenar Canvas Colaborativos
CREATE TABLE public.canvas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Novo Canvas',
  content jsonb NOT NULL DEFAULT '{"blocks": []}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_edited_by uuid,
  is_template boolean DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[]
);

-- Índices para performance
CREATE INDEX idx_canvas_company_id ON public.canvas(company_id);
CREATE INDEX idx_canvas_created_at ON public.canvas(created_at DESC);
CREATE INDEX idx_canvas_tags ON public.canvas USING GIN(tags);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_canvas_updated_at
  BEFORE UPDATE ON public.canvas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.canvas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can read canvas"
  ON public.canvas FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create canvas"
  ON public.canvas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update canvas"
  ON public.canvas FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete canvas"
  ON public.canvas FOR DELETE
  USING (true);

-- Habilitar Realtime para colaboração em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas;

-- ============================================================================
-- MIGRATION: 20251021014713_391159c4-be3c-464a-b01f-9a675fedfab3.sql
-- ============================================================================

-- Expandir canvas para ser o núcleo de inteligência
-- Adicionar tabela de comentários, tarefas e insights

-- Tabela de comentários e interações no canvas
CREATE TABLE IF NOT EXISTS public.canvas_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid REFERENCES public.canvas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('comment', 'insight', 'risk', 'hypothesis', 'task')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  assigned_to uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_canvas_comments_canvas_id ON public.canvas_comments(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_type ON public.canvas_comments(type);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_status ON public.canvas_comments(status);

-- Trigger para updated_at
CREATE TRIGGER update_canvas_comments_updated_at
  BEFORE UPDATE ON public.canvas_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para canvas_comments
ALTER TABLE public.canvas_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read canvas_comments"
  ON public.canvas_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create canvas_comments"
  ON public.canvas_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update canvas_comments"
  ON public.canvas_comments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete canvas_comments"
  ON public.canvas_comments FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de versões do canvas (para versionamento)
CREATE TABLE IF NOT EXISTS public.canvas_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid REFERENCES public.canvas(id) ON DELETE CASCADE NOT NULL,
  content jsonb NOT NULL,
  version_number integer NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  change_summary text
);

CREATE INDEX IF NOT EXISTS idx_canvas_versions_canvas_id ON public.canvas_versions(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_versions_created_at ON public.canvas_versions(created_at DESC);

ALTER TABLE public.canvas_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read canvas_versions"
  ON public.canvas_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage canvas_versions"
  ON public.canvas_versions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Habilitar Realtime para comentários
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_comments;

-- ============================================================================
-- MIGRATION: 20251021030035_7c15ecb6-ca5e-4490-acce-59f390aedd18.sql
-- ============================================================================

-- ============================================
-- FASE 4: AUTENTICAÇÃO E SEGURANÇA
-- Implementação completa de auth, profiles e roles
-- ============================================

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');

-- 2. Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar tabela de roles (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Enable RLS em profiles e user_roles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Criar função security definer para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Função para criar perfil automaticamente ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Inserir role padrão (user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 7. Trigger para executar handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES - USER_ROLES
-- ============================================

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins podem ver todas as roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem inserir/atualizar/deletar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ATUALIZAR RLS POLICIES - COMPANIES
-- ============================================

-- Manter policies existentes mas adicionar verificação de auth
DROP POLICY IF EXISTS "Authenticated users can read companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;

CREATE POLICY "Authenticated users can read companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- ATUALIZAR RLS POLICIES - DECISION_MAKERS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Authenticated users can insert decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Authenticated users can update decision_makers" ON public.decision_makers;

CREATE POLICY "Authenticated users can read decision_makers"
ON public.decision_makers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert decision_makers"
ON public.decision_makers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update decision_makers"
ON public.decision_makers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- ATUALIZAR RLS POLICIES - CANVAS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can read canvas" ON public.canvas;
DROP POLICY IF EXISTS "Authenticated users can create canvas" ON public.canvas;
DROP POLICY IF EXISTS "Authenticated users can update canvas" ON public.canvas;
DROP POLICY IF EXISTS "Authenticated users can delete canvas" ON public.canvas;

CREATE POLICY "Authenticated users can read canvas"
ON public.canvas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create canvas"
ON public.canvas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update canvas"
ON public.canvas
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete canvas"
ON public.canvas
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ============================================================================
-- MIGRATION: 20251021033200_6cc45310-6558-409a-9f5f-5da79e7d13b7.sql
-- ============================================================================

-- ✅ FASE 5.2: Otimização de Queries - Adicionar Indexes

-- Indexes para companies
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_digital_maturity_score ON public.companies(digital_maturity_score DESC);

-- Indexes para decision_makers
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX IF NOT EXISTS idx_decision_makers_verified_email ON public.decision_makers(verified_email);
CREATE INDEX IF NOT EXISTS idx_decision_makers_seniority ON public.decision_makers(seniority);

-- Indexes para canvas
CREATE INDEX IF NOT EXISTS idx_canvas_company_id ON public.canvas(company_id);
CREATE INDEX IF NOT EXISTS idx_canvas_created_by ON public.canvas(created_by);
CREATE INDEX IF NOT EXISTS idx_canvas_updated_at ON public.canvas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_tags ON public.canvas USING GIN(tags);

-- Indexes para canvas_comments
CREATE INDEX IF NOT EXISTS idx_canvas_comments_canvas_id ON public.canvas_comments(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_user_id ON public.canvas_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_status ON public.canvas_comments(status);
CREATE INDEX IF NOT EXISTS idx_canvas_comments_type ON public.canvas_comments(type);

-- Indexes para buying_signals
CREATE INDEX IF NOT EXISTS idx_buying_signals_company_id ON public.buying_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_buying_signals_signal_type ON public.buying_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_buying_signals_detected_at ON public.buying_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_buying_signals_confidence_score ON public.buying_signals(confidence_score DESC);

-- Indexes para digital_maturity
CREATE INDEX IF NOT EXISTS idx_digital_maturity_company_id ON public.digital_maturity(company_id);
CREATE INDEX IF NOT EXISTS idx_digital_maturity_overall_score ON public.digital_maturity(overall_score DESC);

-- Indexes para search_history
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- Indexes para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_companies_industry_maturity ON public.companies(industry, digital_maturity_score DESC);
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_verified ON public.decision_makers(company_id, verified_email);

-- ============================================================================
-- MIGRATION: 20251021133724_dd9e118a-0188-4188-af63-befd03869f73.sql
-- ============================================================================

-- ✅ Tabela de presença digital (redes sociais, web)
CREATE TABLE IF NOT EXISTS public.digital_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  linkedin_data JSONB,
  instagram_data JSONB,
  facebook_data JSONB,
  twitter_data JSONB,
  youtube_data JSONB,
  website_metrics JSONB,
  overall_score NUMERIC,
  social_score NUMERIC,
  web_score NUMERIC,
  engagement_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de dados jurídicos
CREATE TABLE IF NOT EXISTS public.legal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  jusbrasil_data JSONB,
  ceis_data JSONB,
  cnep_data JSONB,
  total_processes INTEGER DEFAULT 0,
  active_processes INTEGER DEFAULT 0,
  risk_level TEXT,
  legal_health_score NUMERIC,
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de dados financeiros
CREATE TABLE IF NOT EXISTS public.financial_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  credit_score NUMERIC,
  serasa_data JSONB,
  scpc_data JSONB,
  financial_indicators JSONB,
  risk_classification TEXT,
  payment_history JSONB,
  debt_indicators JSONB,
  predictive_risk_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de reputação e avaliações
CREATE TABLE IF NOT EXISTS public.reputation_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  reclame_aqui_data JSONB,
  google_reviews_data JSONB,
  trustpilot_data JSONB,
  overall_rating NUMERIC,
  total_reviews INTEGER DEFAULT 0,
  sentiment_score NUMERIC,
  reputation_score NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de menções na mídia
CREATE TABLE IF NOT EXISTS public.news_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  sentiment TEXT,
  sentiment_score NUMERIC,
  content_summary TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de riscos identificados
CREATE TABLE IF NOT EXISTS public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  risk_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de insights gerados pela IA
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  confidence_score NUMERIC,
  generated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Tabela de pitches gerados
CREATE TABLE IF NOT EXISTS public.pitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  pitch_type TEXT NOT NULL,
  content TEXT NOT NULL,
  target_persona TEXT,
  confidence_score NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ✅ Enable RLS em todas as tabelas
ALTER TABLE public.digital_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

-- ✅ Políticas RLS para digital_presence
CREATE POLICY "Authenticated users can read digital_presence"
  ON public.digital_presence FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage digital_presence"
  ON public.digital_presence FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para legal_data
CREATE POLICY "Authenticated users can read legal_data"
  ON public.legal_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage legal_data"
  ON public.legal_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para financial_data
CREATE POLICY "Authenticated users can read financial_data"
  ON public.financial_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage financial_data"
  ON public.financial_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para reputation_data
CREATE POLICY "Authenticated users can read reputation_data"
  ON public.reputation_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage reputation_data"
  ON public.reputation_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para news_mentions
CREATE POLICY "Authenticated users can read news_mentions"
  ON public.news_mentions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage news_mentions"
  ON public.news_mentions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para risks
CREATE POLICY "Authenticated users can read risks"
  ON public.risks FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage risks"
  ON public.risks FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para insights
CREATE POLICY "Authenticated users can read insights"
  ON public.insights FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage insights"
  ON public.insights FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Políticas RLS para pitches
CREATE POLICY "Authenticated users can read pitches"
  ON public.pitches FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage pitches"
  ON public.pitches FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Índices para performance
CREATE INDEX IF NOT EXISTS idx_digital_presence_company ON public.digital_presence(company_id);
CREATE INDEX IF NOT EXISTS idx_legal_data_company ON public.legal_data(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_company ON public.financial_data(company_id);
CREATE INDEX IF NOT EXISTS idx_reputation_data_company ON public.reputation_data(company_id);
CREATE INDEX IF NOT EXISTS idx_news_mentions_company ON public.news_mentions(company_id);
CREATE INDEX IF NOT EXISTS idx_risks_company ON public.risks(company_id);
CREATE INDEX IF NOT EXISTS idx_insights_company ON public.insights(company_id);
CREATE INDEX IF NOT EXISTS idx_pitches_company ON public.pitches(company_id);

-- ============================================================================
-- MIGRATION: 20251021215021_3596971f-74eb-44ec-b4fc-80a06dc722ac.sql
-- ============================================================================

-- =====================================================
-- MÓDULO SDR - Schema Completo
-- =====================================================

-- Contatos (pessoa física ou ponto de contato)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  channel JSONB DEFAULT '{"whatsapp": false, "email": false}'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- Conversas (thread)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  status TEXT CHECK (status IN ('open','pending','closed','archived')) DEFAULT 'open',
  assigned_to UUID,
  priority TEXT CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sla_due_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_sla ON public.conversations(sla_due_at);

-- Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('in','out')) NOT NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  from_id TEXT,
  to_id TEXT,
  body TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  provider_message_id TEXT,
  status TEXT CHECK (status IN ('sent','delivered','read','failed')) DEFAULT 'sent',
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_provider ON public.messages(provider_message_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_unique ON public.messages(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Regras de filas/roteamento
CREATE TABLE IF NOT EXISTS public.sdr_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  assign_to UUID,
  priority TEXT CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
  sla_minutes INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates
CREATE TABLE IF NOT EXISTS public.sdr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequências
CREATE TABLE IF NOT EXISTS public.sdr_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sdr_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.sdr_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  day_offset INT NOT NULL DEFAULT 0,
  channel TEXT CHECK (channel IN ('whatsapp','email')) NOT NULL,
  template_id UUID REFERENCES public.sdr_templates(id) ON DELETE SET NULL,
  stop_on_reply BOOLEAN DEFAULT true,
  skip_weekends BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON public.sdr_sequence_steps(sequence_id, step_order);

-- Execuções de sequência (inscrições)
CREATE TABLE IF NOT EXISTS public.sdr_sequence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.sdr_sequences(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_step INT DEFAULT 0,
  status TEXT CHECK (status IN ('running','paused','completed','stopped')) DEFAULT 'running',
  last_sent_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequence_runs_next_due ON public.sdr_sequence_runs(next_due_at) WHERE status = 'running';

-- Tarefas
CREATE TABLE IF NOT EXISTS public.sdr_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo','doing','done')) DEFAULT 'todo',
  due_date DATE,
  assigned_to UUID,
  reminders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.sdr_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.sdr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.sdr_tasks(company_id);

-- Auditoria leve
CREATE TABLE IF NOT EXISTS public.sdr_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.sdr_audit(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.sdr_audit(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sdr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON public.sdr_routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.sdr_templates
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON public.sdr_sequences
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequence_runs_updated_at BEFORE UPDATE ON public.sdr_sequence_runs
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.sdr_tasks
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_sequence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_audit ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write (para POC)
CREATE POLICY "Authenticated users can manage contacts" ON public.contacts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage conversations" ON public.conversations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage messages" ON public.messages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage routing_rules" ON public.sdr_routing_rules
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage templates" ON public.sdr_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sequences" ON public.sdr_sequences
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sequence_steps" ON public.sdr_sequence_steps
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sequence_runs" ON public.sdr_sequence_runs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tasks" ON public.sdr_tasks
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read audit" ON public.sdr_audit
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role pode tudo (para webhooks)
CREATE POLICY "Service role can manage contacts" ON public.contacts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage conversations" ON public.conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage messages" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251021215302_7557da07-da25-41f1-8aa6-6908e93c61ef.sql
-- ============================================================================

-- Fix security warning: set search_path on function with CASCADE
DROP FUNCTION IF EXISTS update_sdr_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_sdr_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all triggers
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON public.sdr_routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.sdr_templates
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON public.sdr_sequences
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_sequence_runs_updated_at BEFORE UPDATE ON public.sdr_sequence_runs
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.sdr_tasks
  FOR EACH ROW EXECUTE FUNCTION update_sdr_updated_at();

-- ============================================================================
-- MIGRATION: 20251021222752_a21ddc58-c658-4f84-8e14-e23efc444c8a.sql
-- ============================================================================

-- Tabela de configurações de integrações
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'telegram')),
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, channel, provider)
);

-- Índices para performance
CREATE INDEX idx_integration_configs_user_id ON public.integration_configs(user_id);
CREATE INDEX idx_integration_configs_status ON public.integration_configs(status);
CREATE INDEX idx_integration_configs_channel ON public.integration_configs(channel);

-- RLS policies
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
  ON public.integration_configs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de webhooks recebidos (para debugging)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  provider TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook logs"
  ON public.webhook_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar campos de metadata nas messages
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS webhook_id UUID REFERENCES public.webhook_logs(id);

-- Realtime para messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ============================================================================
-- MIGRATION: 20251021224732_c09fffbd-b2f1-4501-bdbf-04ffdf8728ef.sql
-- ============================================================================

-- Update sdr_tasks to support Kanban workflow
-- Add in_progress status and ensure all transitions work

-- First, update any existing 'todo' tasks that might need the new status
-- (this is safe to run even if no data exists yet)

-- Add check constraint to allow the new status
ALTER TABLE sdr_tasks DROP CONSTRAINT IF EXISTS sdr_tasks_status_check;

-- Recreate with new status
ALTER TABLE sdr_tasks ADD CONSTRAINT sdr_tasks_status_check 
  CHECK (status IN ('todo', 'in_progress', 'done'));

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_status ON sdr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_due_date ON sdr_tasks(due_date) WHERE status != 'done';

-- Update conversations status to support pipeline stages
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;

ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'open', 'pending', 'closed', 'archived'));

-- Create indexes for pipeline queries
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_company_status ON conversations(company_id, status);


-- ============================================================================
-- MIGRATION: 20251021224839_2c412d3e-475e-4df1-a390-69486156b172.sql
-- ============================================================================

-- Update sdr_tasks to support Kanban workflow
-- Add in_progress status and ensure all transitions work

-- First, update any existing 'todo' tasks that might need the new status
-- (this is safe to run even if no data exists yet)

-- Add check constraint to allow the new status
ALTER TABLE sdr_tasks DROP CONSTRAINT IF EXISTS sdr_tasks_status_check;

-- Recreate with new status
ALTER TABLE sdr_tasks ADD CONSTRAINT sdr_tasks_status_check 
  CHECK (status IN ('todo', 'in_progress', 'done'));

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_status ON sdr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_due_date ON sdr_tasks(due_date) WHERE status != 'done';

-- Update conversations status to support pipeline stages
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;

ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'open', 'pending', 'closed', 'archived'));

-- Create indexes for pipeline queries
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_company_status ON conversations(company_id, status);


-- ============================================================================
-- MIGRATION: 20251021234040_e6743747-c37c-4105-b2a2-181eb5284b50.sql
-- ============================================================================

-- Adicionar coluna avatar_url na tabela profiles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Criar bucket de avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para avatars: qualquer usuário autenticado pode ver
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Avatar images are publicly accessible'
    ) THEN
        CREATE POLICY "Avatar images are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;
END $$;

-- RLS para avatars: usuários podem fazer upload de seus próprios avatares
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own avatar'
    ) THEN
        CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'avatars' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- RLS para avatars: usuários podem atualizar seus próprios avatares
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own avatar'
    ) THEN
        CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'avatars' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- RLS para avatars: usuários podem deletar seus próprios avatares
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own avatar'
    ) THEN
        CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'avatars' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- ============================================================================
-- MIGRATION: 20251021234719_740de50e-d9a9-42a9-99d6-0f5867b44895.sql
-- ============================================================================

-- Adicionar campos de contato e redes sociais ao perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- ============================================================================
-- MIGRATION: 20251022040705_7110b441-33dc-431c-a50c-34e55f8fc1d8.sql
-- ============================================================================

-- Enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule IMAP polling every 5 minutes
select cron.schedule(
  'imap_poll_every_5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/email-imap-poll',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================================================
-- MIGRATION: 20251022060844_41d6140b-47e2-4422-9b8d-3da13b5084e0.sql
-- ============================================================================

-- ============================================
-- CANVAS MODULE - ESTRUTURA COMPLETA (SEM DUPLICATAS)
-- ============================================

-- 1. Expandir canvas com novos campos
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS owners UUID[] DEFAULT ARRAY[]::UUID[];
ALTER TABLE public.canvas ADD COLUMN IF NOT EXISTS template TEXT;

-- Adicionar constraint se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'canvas_status_check') THEN
    ALTER TABLE public.canvas ADD CONSTRAINT canvas_status_check CHECK (status IN ('active', 'archived', 'template'));
  END IF;
END $$;

-- 2. Criar tabela de blocos individuais
CREATE TABLE IF NOT EXISTS public.canvas_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'insight', 'decision', 'task', 'reference', 'attachment', 'timeline')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_blocks_canvas_id ON public.canvas_blocks(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_blocks_order ON public.canvas_blocks(canvas_id, order_index);

-- 3. Criar tabela de links com outros módulos
CREATE TABLE IF NOT EXISTS public.canvas_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('playbook', 'sequence_run', 'task', 'report', 'insight', 'company')),
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_links_canvas_id ON public.canvas_links(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_links_target ON public.canvas_links(target_type, target_id);

-- 4. Criar tabela de permissões
CREATE TABLE IF NOT EXISTS public.canvas_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(canvas_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_canvas_permissions_canvas_user ON public.canvas_permissions(canvas_id, user_id);

-- 5. Criar tabela de atividades (timeline/audit)
CREATE TABLE IF NOT EXISTS public.canvas_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES public.canvas(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.canvas_blocks(id) ON DELETE SET NULL,
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'commented', 'version_created', 'linked', 'promoted')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_activity_canvas_id ON public.canvas_activity(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_activity_created_at ON public.canvas_activity(canvas_id, created_at DESC);

-- 6. RLS para canvas_blocks
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can read canvas_blocks') THEN
    CREATE POLICY "Authenticated users can read canvas_blocks" ON public.canvas_blocks FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can create canvas_blocks') THEN
    CREATE POLICY "Authenticated users can create canvas_blocks" ON public.canvas_blocks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can update canvas_blocks') THEN
    CREATE POLICY "Authenticated users can update canvas_blocks" ON public.canvas_blocks FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_blocks' AND policyname = 'Authenticated users can delete canvas_blocks') THEN
    CREATE POLICY "Authenticated users can delete canvas_blocks" ON public.canvas_blocks FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 7. RLS para canvas_links
ALTER TABLE public.canvas_links ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_links' AND policyname = 'Authenticated users can manage canvas_links') THEN
    CREATE POLICY "Authenticated users can manage canvas_links" ON public.canvas_links FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 8. RLS para canvas_permissions
ALTER TABLE public.canvas_permissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_permissions' AND policyname = 'Authenticated users can read canvas_permissions') THEN
    CREATE POLICY "Authenticated users can read canvas_permissions" ON public.canvas_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_permissions' AND policyname = 'Authenticated users can manage their permissions') THEN
    CREATE POLICY "Authenticated users can manage their permissions" ON public.canvas_permissions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 9. RLS para canvas_activity
ALTER TABLE public.canvas_activity ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_activity' AND policyname = 'Authenticated users can read canvas_activity') THEN
    CREATE POLICY "Authenticated users can read canvas_activity" ON public.canvas_activity FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_activity' AND policyname = 'Service role can manage canvas_activity') THEN
    CREATE POLICY "Service role can manage canvas_activity" ON public.canvas_activity FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10. Trigger para updated_at em canvas_blocks
CREATE OR REPLACE FUNCTION update_canvas_block_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_canvas_blocks_updated_at ON public.canvas_blocks;
CREATE TRIGGER trigger_canvas_blocks_updated_at
  BEFORE UPDATE ON public.canvas_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_block_updated_at();

-- 11. Função para criar snapshot de versão
CREATE OR REPLACE FUNCTION create_canvas_version(
  p_canvas_id UUID,
  p_tag TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
  v_snapshot JSONB;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM canvas_versions
  WHERE canvas_id = p_canvas_id;
  
  SELECT jsonb_build_object(
    'canvas', row_to_json(c.*),
    'blocks', COALESCE((SELECT jsonb_agg(row_to_json(b.*) ORDER BY b.order_index) FROM canvas_blocks b WHERE b.canvas_id = p_canvas_id), '[]'::jsonb),
    'comments', COALESCE((SELECT jsonb_agg(row_to_json(cm.*) ORDER BY cm.created_at DESC) FROM canvas_comments cm WHERE cm.canvas_id = p_canvas_id), '[]'::jsonb)
  )
  INTO v_snapshot
  FROM canvas c
  WHERE c.id = p_canvas_id;
  
  INSERT INTO canvas_versions (canvas_id, version_number, snapshot, tag, description, created_by)
  VALUES (p_canvas_id, v_version_number, v_snapshot, p_tag, p_description, auth.uid())
  RETURNING id INTO v_version_id;
  
  INSERT INTO canvas_activity (canvas_id, user_id, action_type, description, metadata)
  VALUES (p_canvas_id, auth.uid(), 'version_created', 'Versão ' || v_version_number || ' criada' || COALESCE(': ' || p_tag, ''), jsonb_build_object('version_id', v_version_id, 'version_number', v_version_number, 'tag', p_tag));
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para promover decisão para tarefa SDR
CREATE OR REPLACE FUNCTION promote_canvas_decision(
  p_block_id UUID,
  p_target_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_block RECORD;
  v_task_id UUID;
  v_canvas_id UUID;
BEGIN
  SELECT cb.*, c.company_id, c.id as canvas_id
  INTO v_block
  FROM canvas_blocks cb
  JOIN canvas c ON c.id = cb.canvas_id
  WHERE cb.id = p_block_id AND cb.type = 'decision';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bloco de decisão não encontrado';
  END IF;
  
  v_canvas_id := v_block.canvas_id;
  
  IF p_target_type = 'sdr_task' THEN
    INSERT INTO sdr_tasks (title, description, company_id, status, due_date, assigned_to)
    VALUES (v_block.content->>'title', v_block.content->>'why', v_block.company_id, 'todo', COALESCE((v_block.content->>'due_at')::date, (now() + interval '7 days')::date), (v_block.content->>'owner')::uuid)
    RETURNING id INTO v_task_id;
    
    INSERT INTO canvas_links (canvas_id, target_type, target_id, metadata, created_by)
    VALUES (v_canvas_id, 'task', v_task_id, jsonb_build_object('promoted_from_block', p_block_id), auth.uid());
    
    INSERT INTO canvas_activity (canvas_id, block_id, user_id, action_type, description, metadata)
    VALUES (v_canvas_id, p_block_id, auth.uid(), 'promoted', 'Decisão promovida para tarefa SDR', jsonb_build_object('task_id', v_task_id, 'target_type', 'sdr_task'));
    
    RETURN v_task_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Habilitar realtime
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_blocks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_activity;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_links;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- MIGRATION: 20251022173131_93964f64-f3c1-4dc2-a9f6-6661577dea07.sql
-- ============================================================================

-- Tabela para armazenar interações da IA para aprendizado contínuo (RAG dinâmico)
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON public.ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_question ON public.ai_interactions USING gin(to_tsvector('portuguese', question));
CREATE INDEX IF NOT EXISTS idx_ai_interactions_answer ON public.ai_interactions USING gin(to_tsvector('portuguese', answer));

-- RLS policies (público para leitura, mas apenas sistema pode escrever)
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler interações da IA"
  ON public.ai_interactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Sistema pode inserir interações"
  ON public.ai_interactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_interactions_updated_at
  BEFORE UPDATE ON public.ai_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_interactions_updated_at();

-- Comentários
COMMENT ON TABLE public.ai_interactions IS 'Armazena interações com a IA para aprendizado contínuo e melhoria do RAG';
COMMENT ON COLUMN public.ai_interactions.question IS 'Pergunta feita pelo usuário';
COMMENT ON COLUMN public.ai_interactions.answer IS 'Resposta gerada pela IA';
COMMENT ON COLUMN public.ai_interactions.metadata IS 'Metadados adicionais (contexto, empresa relacionada, etc.)';


-- ============================================================================
-- MIGRATION: 20251024005719_01c7b878-7d35-4276-8f0a-cc98ff3a43b3.sql
-- ============================================================================

-- Company previews to persist non-committed search results
CREATE TABLE IF NOT EXISTS public.company_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  query TEXT,
  cnpj TEXT,
  name TEXT,
  website TEXT,
  domain TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.company_previews ENABLE ROW LEVEL SECURITY;

-- Basic policies: authenticated users can read/insert/update previews
CREATE POLICY "Authenticated users can read company_previews"
ON public.company_previews
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert company_previews"
ON public.company_previews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update company_previews"
ON public.company_previews
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger to maintain updated_at
CREATE TRIGGER update_company_previews_updated_at
BEFORE UPDATE ON public.company_previews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_company_previews_created_at ON public.company_previews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_previews_cnpj ON public.company_previews (cnpj);
CREATE INDEX IF NOT EXISTS idx_company_previews_name ON public.company_previews (lower(name));


-- ============================================================================
-- MIGRATION: 20251024024728_2078df45-82a1-4de2-96b9-0b6863d57eca.sql
-- ============================================================================

-- =====================================================
-- MIGRAÇÃO ESTRATÉGICA: GOVERNANÇA E TRANSFORMAÇÃO
-- De "buying_signals/fit" para "governance_signals/gaps"
-- =====================================================

-- 1. Renomear tabela (mantém dados existentes)
ALTER TABLE buying_signals RENAME TO governance_signals;

-- 2. Adicionar novos campos estratégicos
ALTER TABLE governance_signals 
ADD COLUMN IF NOT EXISTS governance_gap_score INTEGER CHECK (governance_gap_score >= 0 AND governance_gap_score <= 100),
ADD COLUMN IF NOT EXISTS transformation_priority TEXT CHECK (transformation_priority IN ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO')),
ADD COLUMN IF NOT EXISTS organizational_maturity_level TEXT CHECK (organizational_maturity_level IN ('INICIAL', 'ESTRUTURANDO', 'GERENCIADO', 'OTIMIZADO', 'INOVADOR')),
ADD COLUMN IF NOT EXISTS requires_consulting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gap_category TEXT CHECK (gap_category IN ('PROCESSOS', 'TECNOLOGIA', 'PESSOAS', 'GOVERNANCA', 'COMPLIANCE', 'SEGURANCA'));

-- 3. Atualizar signal_types existentes para nova nomenclatura
-- Manter compatibilidade backwards temporária
UPDATE governance_signals 
SET signal_type = 'governance_gap_analysis'
WHERE signal_type = 'totvs_fit_analysis';

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_governance_gap_score ON governance_signals(governance_gap_score DESC);
CREATE INDEX IF NOT EXISTS idx_transformation_priority ON governance_signals(transformation_priority);
CREATE INDEX IF NOT EXISTS idx_requires_consulting ON governance_signals(requires_consulting) WHERE requires_consulting = true;

-- 5. Comentários explicativos
COMMENT ON TABLE governance_signals IS 'Sinais de gaps de governança e oportunidades de transformação organizacional para PMEs';
COMMENT ON COLUMN governance_signals.governance_gap_score IS 'Score de 0-100 indicando gravidade dos gaps (quanto maior, mais gaps críticos)';
COMMENT ON COLUMN governance_signals.transformation_priority IS 'Prioridade de intervenção para transformação organizacional';
COMMENT ON COLUMN governance_signals.requires_consulting IS 'Indica se a empresa precisa de consultoria estratégica imediata';

-- ============================================================================
-- MIGRATION: 20251024031810_5fb5cbc0-f41e-4aa5-b9d5-1048616c2d83.sql
-- ============================================================================

-- ✅ MIGRATION: Sistema Completo de Account Strategy & Personas

-- 1️⃣ BUYER PERSONAS (Biblioteca de Personas)
CREATE TABLE buyer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'CEO', 'CFO', 'CTO', 'Gerente TI', etc.
  seniority TEXT NOT NULL, -- 'C-Level', 'Diretoria', 'Gerência', 'Coordenação'
  department TEXT, -- 'Financeiro', 'TI', 'Operações', etc.
  
  -- Características comportamentais
  communication_style TEXT, -- 'Direto', 'Analítico', 'Relacionamento', 'Visionário'
  decision_factors JSONB DEFAULT '[]'::jsonb, -- ['ROI', 'Segurança', 'Inovação']
  pain_points JSONB DEFAULT '[]'::jsonb, -- Dores específicas
  motivators JSONB DEFAULT '[]'::jsonb, -- O que motiva essa persona
  objections JSONB DEFAULT '[]'::jsonb, -- Objeções típicas
  
  -- Canais e abordagem
  preferred_channels JSONB DEFAULT '[]'::jsonb, -- ['email', 'whatsapp', 'linkedin']
  best_approach TEXT, -- Estratégia de abordagem recomendada
  meeting_style TEXT, -- Como essa persona prefere reuniões
  
  -- Conteúdo de apoio
  key_messages JSONB DEFAULT '[]'::jsonb, -- Mensagens-chave para essa persona
  content_preferences TEXT[], -- Tipos de conteúdo que ressoam
  
  -- Metadados
  is_default BOOLEAN DEFAULT false, -- Personas padrão do sistema
  custom_data JSONB DEFAULT '{}'::jsonb, -- Campos customizados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ ACCOUNT STRATEGIES (Estratégias por Empresa)
CREATE TABLE account_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES buyer_personas(id),
  decision_maker_id UUID REFERENCES decision_makers(id),
  
  -- Status e controle
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'won', 'lost'
  current_stage TEXT DEFAULT 'cold_outreach', -- Etapa atual do relacionamento
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  
  -- Estratégia gerada pela IA
  value_proposition TEXT, -- Proposta de valor personalizada
  approach_strategy TEXT, -- Estratégia de abordagem
  expected_timeline TEXT, -- Timeline esperado (ex: '3-6 meses')
  
  -- Gaps e oportunidades
  identified_gaps JSONB DEFAULT '[]'::jsonb, -- Gaps identificados na empresa
  recommended_products JSONB DEFAULT '[]'::jsonb, -- Produtos TOTVS recomendados
  transformation_roadmap JSONB DEFAULT '{}'::jsonb, -- Roadmap de transformação
  
  -- ROI e business case
  projected_roi NUMERIC, -- ROI projetado em %
  investment_required NUMERIC, -- Investimento necessário
  payback_period TEXT, -- Período de retorno
  annual_value NUMERIC, -- Valor anual estimado
  
  -- Stakeholders e relacionamento
  stakeholder_map JSONB DEFAULT '[]'::jsonb, -- Mapa de stakeholders
  relationship_score INTEGER DEFAULT 0, -- Score de relacionamento (0-100)
  engagement_level TEXT DEFAULT 'cold', -- 'cold', 'warm', 'hot', 'champion'
  
  -- Tracking
  last_touchpoint_at TIMESTAMPTZ,
  next_action_due TIMESTAMPTZ,
  
  -- IA gerada
  ai_insights JSONB DEFAULT '{}'::jsonb, -- Insights gerados pela IA
  ai_recommendations JSONB DEFAULT '[]'::jsonb, -- Recomendações da IA
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ ACCOUNT TOUCHPOINTS (Histórico de Interações)
CREATE TABLE account_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_strategy_id UUID REFERENCES account_strategies(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tipo de touchpoint
  stage TEXT NOT NULL, -- 'cold_outreach', 'first_meeting', 'diagnosis', 'proposal', 'negotiation', 'closing'
  touchpoint_type TEXT NOT NULL, -- 'email', 'whatsapp', 'call', 'meeting', 'proposal', 'demo'
  channel TEXT, -- Canal utilizado
  
  -- Conteúdo
  subject TEXT, -- Assunto (para emails)
  content TEXT, -- Conteúdo/notas da interação
  outcome TEXT, -- Resultado da interação
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  
  -- Métricas
  response_received BOOLEAN DEFAULT false,
  response_time_hours INTEGER, -- Tempo de resposta em horas
  meeting_duration_minutes INTEGER, -- Duração de reunião
  
  -- Próximos passos
  next_steps TEXT, -- Próximos passos acordados
  next_action_owner UUID REFERENCES auth.users(id), -- Responsável
  next_action_due TIMESTAMPTZ, -- Prazo
  
  -- Anexos e recursos
  attachments JSONB DEFAULT '[]'::jsonb, -- Arquivos anexados
  related_tasks JSONB DEFAULT '[]'::jsonb, -- Tasks relacionadas
  
  -- Tracking
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4️⃣ BUSINESS CASES (Propostas Comerciais Geradas)
CREATE TABLE business_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_strategy_id UUID REFERENCES account_strategies(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Versão e status
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
  
  -- Análise situacional
  current_situation TEXT, -- Situação atual da empresa
  identified_problems JSONB DEFAULT '[]'::jsonb, -- Problemas identificados
  business_impact TEXT, -- Impacto nos negócios
  
  -- Solução proposta
  proposed_solution TEXT, -- Solução completa proposta
  implementation_phases JSONB DEFAULT '[]'::jsonb, -- Fases de implementação
  products_included JSONB DEFAULT '[]'::jsonb, -- Produtos incluídos
  
  -- Financeiro
  investment_breakdown JSONB DEFAULT '{}'::jsonb, -- Detalhamento do investimento
  roi_calculation JSONB DEFAULT '{}'::jsonb, -- Cálculo detalhado de ROI
  payment_terms TEXT, -- Condições de pagamento
  
  -- Benefícios e riscos
  expected_benefits JSONB DEFAULT '[]'::jsonb, -- Benefícios esperados
  risk_mitigation JSONB DEFAULT '[]'::jsonb, -- Mitigação de riscos
  success_metrics JSONB DEFAULT '[]'::jsonb, -- Métricas de sucesso
  
  -- Case studies e provas sociais
  similar_cases JSONB DEFAULT '[]'::jsonb, -- Casos similares
  testimonials JSONB DEFAULT '[]'::jsonb, -- Depoimentos
  
  -- Documentos gerados
  proposal_url TEXT, -- URL do documento gerado
  presentation_url TEXT, -- URL da apresentação
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5️⃣ INDEXES para Performance
CREATE INDEX idx_account_strategies_company ON account_strategies(company_id);
CREATE INDEX idx_account_strategies_status ON account_strategies(status);
CREATE INDEX idx_account_strategies_stage ON account_strategies(current_stage);
CREATE INDEX idx_touchpoints_strategy ON account_touchpoints(account_strategy_id);
CREATE INDEX idx_touchpoints_completed ON account_touchpoints(completed_at);
CREATE INDEX idx_business_cases_strategy ON business_cases(account_strategy_id);
CREATE INDEX idx_business_cases_status ON business_cases(status);

-- 6️⃣ TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buyer_personas_updated_at
  BEFORE UPDATE ON buyer_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_strategies_updated_at
  BEFORE UPDATE ON account_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_cases_updated_at
  BEFORE UPDATE ON business_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7️⃣ RLS POLICIES
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cases ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (authenticated users)
CREATE POLICY "Authenticated users can manage buyer_personas"
  ON buyer_personas FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage account_strategies"
  ON account_strategies FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage account_touchpoints"
  ON account_touchpoints FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage business_cases"
  ON business_cases FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8️⃣ PERSONAS PADRÃO (Seed Data)
INSERT INTO buyer_personas (name, role, seniority, department, communication_style, decision_factors, pain_points, motivators, objections, preferred_channels, is_default) VALUES
('CEO Visionário', 'CEO', 'C-Level', 'Executivo', 'Direto e Estratégico', 
 '["ROI", "Crescimento", "Competitividade", "Inovação"]'::jsonb,
 '["Crescimento estagnado", "Falta de controle estratégico", "Concorrência agressiva"]'::jsonb,
 '["Liderar mercado", "Transformação digital", "Legacy empresarial"]'::jsonb,
 '["Custo elevado", "Tempo de implementação", "Resistência da equipe"]'::jsonb,
 '["email", "reunião presencial"]'::jsonb,
 true),

('CFO Analítico', 'CFO', 'C-Level', 'Financeiro', 'Analítico e Data-Driven', 
 '["ROI", "Redução de custos", "Compliance", "Previsibilidade"]'::jsonb,
 '["Falta de controle financeiro", "Processos manuais", "Erros contábeis"]'::jsonb,
 '["Eficiência operacional", "Controle total", "Redução de riscos"]'::jsonb,
 '["Payback longo", "Risco financeiro", "Custo oculto"]'::jsonb,
 '["email", "apresentação com dados"]'::jsonb,
 true),

('CTO Inovador', 'CTO', 'C-Level', 'Tecnologia', 'Técnico e Visionário', 
 '["Tecnologia", "Escalabilidade", "Segurança", "Integração"]'::jsonb,
 '["Infraestrutura legada", "Falta de integração", "Vulnerabilidades"]'::jsonb,
 '["Stack moderno", "Automação", "Inovação contínua"]'::jsonb,
 '["Complexidade técnica", "Vendor lock-in", "Suporte inadequado"]'::jsonb,
 '["email", "demo técnica", "linkedin"]'::jsonb,
 true),

('Gerente TI Operacional', 'Gerente TI', 'Gerência', 'Tecnologia', 'Prático e Solucionador', 
 '["Facilidade de uso", "Suporte", "Implementação rápida", "Treinamento"]'::jsonb,
 '["Equipe sobrecarregada", "Sistemas instáveis", "Falta de suporte"]'::jsonb,
 '["Simplificar operação", "Ter mais tempo", "Reduzir chamados"]'::jsonb,
 '["Curva de aprendizado", "Falta de recursos", "Resistência da equipe"]'::jsonb,
 '["whatsapp", "email", "call"]'::jsonb,
 true);

-- ✅ MIGRATION COMPLETA: Sistema de Account Strategy & Personas criado!

-- ============================================================================
-- MIGRATION: 20251024040801_af7b7681-9b4f-467f-8dfb-944aa683e4d8.sql
-- ============================================================================

-- Tabela de Metas (Goals)
CREATE TABLE IF NOT EXISTS public.sales_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'semestral', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metas por tipo
  proposals_target INTEGER NOT NULL DEFAULT 0,
  sales_target INTEGER NOT NULL DEFAULT 0,
  revenue_target NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Metas por produto (JSONB com estrutura flexível)
  product_targets JSONB DEFAULT '[]'::jsonb,
  
  -- Resultados atuais
  proposals_achieved INTEGER NOT NULL DEFAULT 0,
  sales_achieved INTEGER NOT NULL DEFAULT 0,
  revenue_achieved NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Status e progresso
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_goals_period ON public.sales_goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_goals_type ON public.sales_goals(period_type);
CREATE INDEX IF NOT EXISTS idx_sales_goals_status ON public.sales_goals(status);

-- RLS Policies
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sales_goals"
  ON public.sales_goals
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tabela de Atividades/Logs de Ocorrências
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  
  -- Relacionamentos
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  decision_maker_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  
  -- Tipo e detalhes da atividade
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'meeting', 'email', 'whatsapp', 'linkedin', 
    'demo', 'proposal', 'follow_up', 'note', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Informações de contato
  contact_person TEXT,
  contact_role TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Resultado e próximos passos
  outcome TEXT,
  next_steps TEXT,
  next_action_date DATE,
  
  -- Metadata
  duration_minutes INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_activities_company ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_creator ON public.activities(created_by);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage activities"
  ON public.activities
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_goals_updated_at
  BEFORE UPDATE ON public.sales_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251024134301_7c025b71-53d1-4522-8f03-d32d671c4097.sql
-- ============================================================================

-- ====================================
-- FASE 2: CPQ & PRICING INTELLIGENCE
-- ====================================

-- Tabela de regras de precificação
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('discount', 'volume', 'bundle', 'seasonal', 'competitive')),
  conditions JSONB NOT NULL DEFAULT '{}',
  action JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  min_quantity INTEGER,
  max_quantity INTEGER,
  product_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  customer_segments TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de histórico de cotações
CREATE TABLE IF NOT EXISTS public.quote_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'negotiating')),
  
  -- Produtos e configuração
  products JSONB NOT NULL DEFAULT '[]',
  total_list_price NUMERIC(15,2) DEFAULT 0,
  total_discounts NUMERIC(15,2) DEFAULT 0,
  total_final_price NUMERIC(15,2) NOT NULL,
  
  -- Pricing intelligence
  suggested_price NUMERIC(15,2),
  win_probability NUMERIC(3,2),
  competitive_position TEXT CHECK (competitive_position IN ('aggressive', 'competitive', 'premium', 'high_risk')),
  
  -- Timeline
  valid_until TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Aprovação
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  applied_rules JSONB DEFAULT '[]',
  negotiation_history JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configuração de produtos TOTVS
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO', 'INTERMEDIÁRIO', 'AVANÇADO', 'ESPECIALIZADO')),
  description TEXT,
  
  -- Precificação
  base_price NUMERIC(15,2) NOT NULL,
  cost NUMERIC(15,2),
  min_price NUMERIC(15,2),
  
  -- Configurações
  is_configurable BOOLEAN DEFAULT false,
  config_options JSONB DEFAULT '{}',
  
  -- Dependências e bundles
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  recommended_with UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Limites
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  
  -- Status
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules(active, priority);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_valid ON public.pricing_rules(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_quote_history_company ON public.quote_history(company_id);
CREATE INDEX IF NOT EXISTS idx_quote_history_status ON public.quote_history(status);
CREATE INDEX IF NOT EXISTS idx_quote_history_created ON public.quote_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON public.product_catalog(active);

-- RLS Policies
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage pricing rules
CREATE POLICY "Authenticated users can manage pricing_rules"
  ON public.pricing_rules FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can manage quotes
CREATE POLICY "Authenticated users can manage quote_history"
  ON public.quote_history FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can read product catalog
CREATE POLICY "Authenticated users can read product_catalog"
  ON public.product_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage product catalog
CREATE POLICY "Admins can manage product_catalog"
  ON public.product_catalog FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_history_updated_at
  BEFORE UPDATE ON public.quote_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_catalog_updated_at
  BEFORE UPDATE ON public.product_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir produtos TOTVS no catálogo
INSERT INTO public.product_catalog (sku, name, category, description, base_price, min_price, is_configurable, config_options) VALUES
  ('TOTVS-PROTHEUS-BASIC', 'TOTVS Protheus Básico', 'BÁSICO', 'ERP essencial para gestão financeira e contábil', 15000.00, 12000.00, true, '{"modules": ["financeiro", "contabil"], "users": 10}'),
  ('TOTVS-PROTHEUS-STD', 'TOTVS Protheus Standard', 'INTERMEDIÁRIO', 'ERP completo com gestão de estoque e produção', 35000.00, 28000.00, true, '{"modules": ["financeiro", "contabil", "estoque", "compras"], "users": 25}'),
  ('TOTVS-PROTHEUS-ADV', 'TOTVS Protheus Advanced', 'AVANÇADO', 'ERP avançado com BI e analytics integrados', 75000.00, 60000.00, true, '{"modules": ["all"], "users": 50, "analytics": true}'),
  ('TOTVS-FLUIG', 'TOTVS Fluig', 'INTERMEDIÁRIO', 'Plataforma de gestão de processos e documentos', 25000.00, 20000.00, true, '{"workflows": 50, "users": 100}'),
  ('TOTVS-RM', 'TOTVS RM', 'AVANÇADO', 'Gestão de recursos humanos completa', 45000.00, 36000.00, true, '{"modules": ["folha", "ponto", "recrutamento"], "employees": 500}'),
  ('TOTVS-DATASUL', 'TOTVS Datasul', 'ESPECIALIZADO', 'ERP para manufatura e indústria', 95000.00, 76000.00, true, '{"modules": ["producao", "pcp", "qualidade"], "plants": 5}');

-- Inserir regras de precificação básicas
INSERT INTO public.pricing_rules (name, rule_type, conditions, action, priority, active) VALUES
  ('Desconto por Volume - 10%', 'volume', '{"min_quantity": 10, "max_quantity": 49}', '{"discount_type": "percentage", "value": 10}', 100, true),
  ('Desconto por Volume - 15%', 'volume', '{"min_quantity": 50, "max_quantity": 99}', '{"discount_type": "percentage", "value": 15}', 110, true),
  ('Desconto por Volume - 20%', 'volume', '{"min_quantity": 100}', '{"discount_type": "percentage", "value": 20}', 120, true),
  ('Bundle Protheus + Fluig', 'bundle', '{"products": ["TOTVS-PROTHEUS-STD", "TOTVS-FLUIG"]}', '{"discount_type": "percentage", "value": 12}', 200, true),
  ('Desconto Enterprise', 'competitive', '{"customer_segments": ["enterprise"]}', '{"discount_type": "percentage", "value": 8, "max_discount": 15000}', 50, true);

-- ============================================================================
-- MIGRATION: 20251024140733_3a9fb500-b8be-4c7b-97d6-9696aac3a237.sql
-- ============================================================================

-- Corrigir search_path nas funções criadas na migration anterior
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- MIGRATION: 20251024141455_093a7f5f-eab8-470d-b84e-a88f26f4a182.sql
-- ============================================================================

-- ====================================
-- FASE 3: CENÁRIOS & PROPOSAL BUILDER
-- ====================================

-- Tabela de análise de cenários
CREATE TABLE IF NOT EXISTS public.scenario_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quote_history(id) ON DELETE SET NULL,
  
  -- Cenários
  best_case JSONB NOT NULL DEFAULT '{}',
  expected_case JSONB NOT NULL DEFAULT '{}',
  worst_case JSONB NOT NULL DEFAULT '{}',
  
  -- Análise de sensibilidade
  sensitivity_analysis JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  assumptions JSONB DEFAULT '[]',
  
  -- Métricas comparativas
  probability_best NUMERIC(3,2) DEFAULT 0.20,
  probability_expected NUMERIC(3,2) DEFAULT 0.60,
  probability_worst NUMERIC(3,2) DEFAULT 0.20,
  
  -- Recomendação
  recommended_scenario TEXT DEFAULT 'expected',
  confidence_level NUMERIC(3,2) DEFAULT 0.75,
  key_insights JSONB DEFAULT '[]',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de propostas visuais
CREATE TABLE IF NOT EXISTS public.visual_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quote_history(id) ON DELETE SET NULL,
  scenario_id UUID REFERENCES public.scenario_analysis(id) ON DELETE SET NULL,
  
  -- Informações básicas
  title TEXT NOT NULL,
  proposal_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'sent', 'accepted', 'rejected')),
  
  -- Conteúdo estruturado
  sections JSONB NOT NULL DEFAULT '[]',
  template_id TEXT DEFAULT 'standard',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#f59e0b',
  
  -- Arquivos gerados
  pdf_url TEXT,
  presentation_url TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- E-signature
  requires_signature BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by_name TEXT,
  signed_by_email TEXT,
  signature_ip TEXT,
  
  -- Validade
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de competidores
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('ERP', 'CRM', 'BPM', 'HCM', 'BI', 'Outros')),
  
  -- Informações
  website TEXT,
  description TEXT,
  
  -- Posicionamento
  market_position TEXT CHECK (market_position IN ('leader', 'challenger', 'nicher', 'follower')),
  target_market TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  pricing_model TEXT,
  avg_deal_size NUMERIC(15,2),
  
  -- Strengths & Weaknesses
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  
  -- TOTVS comparison
  totvs_advantages JSONB DEFAULT '[]',
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de battle cards (análise competitiva)
CREATE TABLE IF NOT EXISTS public.battle_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE NOT NULL,
  totvs_product_sku TEXT NOT NULL,
  
  -- Comparação
  feature_comparison JSONB NOT NULL DEFAULT '{}',
  pricing_comparison JSONB NOT NULL DEFAULT '{}',
  
  -- Estratégia
  win_strategy TEXT,
  objection_handling JSONB DEFAULT '[]',
  proof_points JSONB DEFAULT '[]',
  
  -- Cases de sucesso
  win_stories JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scenario_analysis_company ON public.scenario_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_scenario_analysis_strategy ON public.scenario_analysis(account_strategy_id);
CREATE INDEX IF NOT EXISTS idx_visual_proposals_company ON public.visual_proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_visual_proposals_status ON public.visual_proposals(status);
CREATE INDEX IF NOT EXISTS idx_visual_proposals_created ON public.visual_proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitors_category ON public.competitors(category);
CREATE INDEX IF NOT EXISTS idx_battle_cards_competitor ON public.battle_cards(competitor_id);

-- RLS Policies
ALTER TABLE public.scenario_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage scenario_analysis"
  ON public.scenario_analysis FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage visual_proposals"
  ON public.visual_proposals FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read competitors"
  ON public.competitors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read battle_cards"
  ON public.battle_cards FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_scenario_analysis_updated_at
  BEFORE UPDATE ON public.scenario_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visual_proposals_updated_at
  BEFORE UPDATE ON public.visual_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battle_cards_updated_at
  BEFORE UPDATE ON public.battle_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir competidores principais
INSERT INTO public.competitors (name, category, market_position, description, strengths, weaknesses, totvs_advantages) VALUES
  (
    'SAP',
    'ERP',
    'leader',
    'Líder global em ERP empresarial',
    '["Marca forte", "Escala global", "Integração completa"]',
    '["Complexidade", "Custo elevado", "Implementação demorada"]',
    '["Custo menor", "Implementação mais rápida", "Suporte local superior", "Flexibilidade"]'
  ),
  (
    'Oracle',
    'ERP',
    'leader',
    'Plataforma integrada de aplicações empresariais',
    '["Cloud nativo", "Database integrado", "Portfolio amplo"]',
    '["Custo de licenciamento", "Vendor lock-in", "Complexidade"]',
    '["Melhor custo-benefício", "Menor dependência de vendor", "Suporte em português"]'
  ),
  (
    'Microsoft Dynamics',
    'ERP',
    'challenger',
    'Suite de gestão empresarial Microsoft',
    '["Integração com Office", "Cloud Azure", "Marca Microsoft"]',
    '["Customização limitada", "Menos módulos específicos para Brasil"]',
    '["Melhor adequação fiscal brasileira", "Módulos específicos locais", "Preço competitivo"]'
  ),
  (
    'Salesforce',
    'CRM',
    'leader',
    'Plataforma líder em CRM cloud',
    '["Melhor CRM", "Ecosistema AppExchange", "Inovação"]',
    '["Custo por usuário alto", "Não é ERP completo"]',
    '["Solução integrada ERP+CRM", "Custo total menor", "Gestão unificada"]'
  );


-- ============================================================================
-- MIGRATION: 20251024142756_450d83ad-d7e5-41b6-a896-50299ba2cb37.sql
-- ============================================================================

-- ====================================
-- MÓDULOS 7 & 8: COMPETITIVO + VALUE TRACKING
-- ====================================

-- Tabela de análise Win/Loss
CREATE TABLE IF NOT EXISTS public.win_loss_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quote_history(id) ON DELETE SET NULL,
  
  -- Resultado
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'ongoing')),
  deal_value NUMERIC(15,2),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Competição
  competitors_faced TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_competitor TEXT,
  
  -- Análise
  win_reasons JSONB DEFAULT '[]',
  loss_reasons JSONB DEFAULT '[]',
  key_differentiators JSONB DEFAULT '[]',
  
  -- Feedback
  customer_feedback TEXT,
  internal_notes TEXT,
  
  -- Categorização
  deal_stage_lost TEXT,
  competitive_intensity TEXT CHECK (competitive_intensity IN ('low', 'medium', 'high', 'extreme')),
  
  -- Lições aprendidas
  lessons_learned JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de rastreamento de valor
CREATE TABLE IF NOT EXISTS public.value_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  
  -- Baseline (valores prometidos)
  promised_roi NUMERIC(5,2) NOT NULL,
  promised_payback_months INTEGER NOT NULL,
  promised_annual_savings NUMERIC(15,2) NOT NULL,
  promised_efficiency_gain NUMERIC(5,2) DEFAULT 0,
  promised_revenue_growth NUMERIC(5,2) DEFAULT 0,
  baseline_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Realizações (valores entregues)
  realized_roi NUMERIC(5,2) DEFAULT 0,
  realized_payback_months INTEGER,
  realized_annual_savings NUMERIC(15,2) DEFAULT 0,
  realized_efficiency_gain NUMERIC(5,2) DEFAULT 0,
  realized_revenue_growth NUMERIC(5,2) DEFAULT 0,
  last_measured_at TIMESTAMP WITH TIME ZONE,
  
  -- Marcos de progresso
  milestones JSONB DEFAULT '[]',
  
  -- Análise de desvios
  variance_analysis JSONB DEFAULT '{}',
  risk_flags JSONB DEFAULT '[]',
  
  -- Status
  tracking_status TEXT DEFAULT 'active' CHECK (tracking_status IN ('active', 'paused', 'completed', 'cancelled')),
  health_score NUMERIC(3,2) DEFAULT 1.0,
  
  -- Próxima revisão
  next_review_date DATE,
  review_frequency TEXT DEFAULT 'quarterly' CHECK (review_frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de marcos de valor
CREATE TABLE IF NOT EXISTS public.value_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_tracking_id UUID REFERENCES public.value_tracking(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações do marco
  milestone_name TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  
  -- Valor esperado
  expected_value NUMERIC(15,2),
  actual_value NUMERIC(15,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'at_risk')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Responsável
  owner_id UUID REFERENCES auth.users(id),
  
  -- Notas
  notes TEXT,
  blockers JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_win_loss_company ON public.win_loss_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_win_loss_outcome ON public.win_loss_analysis(outcome);
CREATE INDEX IF NOT EXISTS idx_win_loss_closed ON public.win_loss_analysis(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_value_tracking_company ON public.value_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_value_tracking_status ON public.value_tracking(tracking_status);
CREATE INDEX IF NOT EXISTS idx_value_milestones_tracking ON public.value_milestones(value_tracking_id);

-- RLS Policies
ALTER TABLE public.win_loss_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage win_loss_analysis"
  ON public.win_loss_analysis FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage value_tracking"
  ON public.value_tracking FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage value_milestones"
  ON public.value_milestones FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_win_loss_analysis_updated_at
  BEFORE UPDATE ON public.win_loss_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_tracking_updated_at
  BEFORE UPDATE ON public.value_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_milestones_updated_at
  BEFORE UPDATE ON public.value_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir battle cards para produtos TOTVS vs competidores
INSERT INTO public.battle_cards (competitor_id, totvs_product_sku, feature_comparison, pricing_comparison, win_strategy, objection_handling, proof_points) 
SELECT 
  c.id,
  'TOTVS-PROTHEUS-STD',
  '{"totvs": ["Módulos fiscais brasileiros nativos", "Customização simplificada", "Suporte local 24/7"], "competitor": ["Módulos genéricos", "Customização complexa", "Suporte internacional"]}'::jsonb,
  '{"totvs_price": "35000-50000", "competitor_price": "80000-150000", "totvs_advantage": "Até 60% mais econômico"}'::jsonb,
  CASE 
    WHEN c.name = 'SAP' THEN 'Enfatizar agilidade de implementação (3-6 meses vs 12-18 meses SAP) e custo total até 60% menor. Foco em empresas médias que não precisam da complexidade SAP.'
    WHEN c.name = 'Oracle' THEN 'Destacar independência de vendor lock-in, maior flexibilidade de customização e conhecimento profundo do mercado brasileiro. TCO significativamente menor.'
    WHEN c.name = 'Microsoft Dynamics' THEN 'Vantagem competitiva em módulos fiscais brasileiros e integrações específicas para o mercado local. Melhor relação custo-benefício para médias empresas.'
    ELSE 'Solução completa ERP integrada vs soluções pontuais'
  END,
  '[
    {"objection": "SAP é líder de mercado", "response": "SAP é excelente para grandes corporações multinacionais, mas TOTVS é líder no Brasil para empresas médias, com 40% de market share. Implementação 3x mais rápida e custo 60% menor."},
    {"objection": "Já usamos Microsoft", "response": "A integração Office é valiosa, mas TOTVS oferece módulos fiscais brasileiros muito superiores e suporte local dedicado. Economia de 40% no TCO total."}
  ]'::jsonb,
  '[
    {"type": "case_study", "title": "Empresa Similar - Setor X", "result": "ROI de 180% em 18 meses"},
    {"type": "metric", "title": "40% Market Share Brasil", "source": "IDC 2024"},
    {"type": "testimonial", "title": "Cliente Referência", "quote": "Implementação 4 meses vs 14 meses do anterior"}
  ]'::jsonb
FROM public.competitors c
WHERE c.active = true;


-- ============================================================================
-- MIGRATION: 20251024152159_fa4ec311-6c5a-438b-9550-927e0c190186.sql
-- ============================================================================

-- Adicionar colunas para enriquecimento manual nos competitors
ALTER TABLE competitors 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS catalog_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar storage bucket para documentos competitivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('competitive-docs', 'competitive-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para competitive-docs bucket
CREATE POLICY "Authenticated users can view competitive docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload competitive docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update competitive docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete competitive docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'competitive-docs' AND auth.uid() IS NOT NULL);

-- Criar tabela para diagnósticos de SDR
CREATE TABLE IF NOT EXISTS sdr_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  sdr_user_id UUID,
  diagnostic_file_path TEXT NOT NULL,
  diagnostic_summary JSONB DEFAULT '{}'::jsonb,
  technologies_found JSONB DEFAULT '[]'::jsonb,
  gaps_identified JSONB DEFAULT '[]'::jsonb,
  recommended_products JSONB DEFAULT '[]'::jsonb,
  competitive_analysis JSONB DEFAULT '{}'::jsonb,
  ai_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies para sdr_diagnostics
ALTER TABLE sdr_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read diagnostics"
ON sdr_diagnostics FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert diagnostics"
ON sdr_diagnostics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update diagnostics"
ON sdr_diagnostics FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Permitir INSERT/UPDATE em competitors para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can read competitors" ON competitors;
CREATE POLICY "Authenticated users can manage competitors"
ON competitors FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sdr_diagnostics_company ON sdr_diagnostics(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_diagnostics_created ON sdr_diagnostics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitors_active ON competitors(active) WHERE active = true;

-- ============================================================================
-- MIGRATION: 20251024160440_459f2c66-8b28-44db-9343-236af3318005.sql
-- ============================================================================

-- Tabela para configuração de sincronização automática com Google Sheets
CREATE TABLE IF NOT EXISTS public.google_sheets_sync_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_url TEXT NOT NULL,
  sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS para sync_config
ALTER TABLE public.google_sheets_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sua própria config"
  ON public.google_sheets_sync_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir sua própria config"
  ON public.google_sheets_sync_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria config"
  ON public.google_sheets_sync_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar sua própria config"
  ON public.google_sheets_sync_config FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_google_sheets_sync_config_updated_at
  BEFORE UPDATE ON public.google_sheets_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para melhorar performance
CREATE INDEX idx_google_sheets_sync_config_user_id ON public.google_sheets_sync_config(user_id);
CREATE INDEX idx_google_sheets_sync_config_active ON public.google_sheets_sync_config(is_active) WHERE is_active = true;

-- ============================================================================
-- MIGRATION: 20251024164552_9aee8358-bfef-48a3-8575-01cfc2cb9baf.sql
-- ============================================================================

-- Create call_recordings table
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  recording_sid TEXT,
  recording_url TEXT,
  transcription TEXT,
  transcription_sid TEXT,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create message_templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  channel TEXT NOT NULL, -- email, whatsapp, sms
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_recordings
CREATE POLICY "Authenticated users can manage call_recordings"
  ON public.call_recordings
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for message_templates
CREATE POLICY "Authenticated users can manage message_templates"
  ON public.message_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_call_recordings_company ON public.call_recordings(company_id);
CREATE INDEX idx_call_recordings_contact ON public.call_recordings(contact_id);
CREATE INDEX idx_call_recordings_created_at ON public.call_recordings(created_at DESC);
CREATE INDEX idx_message_templates_category ON public.message_templates(category);
CREATE INDEX idx_message_templates_channel ON public.message_templates(channel);

-- Trigger for updated_at
CREATE TRIGGER update_call_recordings_updated_at
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251024175414_b1b06d38-089d-4557-a816-896dac7c1156.sql
-- ============================================================================

-- Inserir templates de exemplo (versão corrigida)
DO $$
BEGIN
  -- Template 1: Cold Outreach Email
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Cold Outreach - Email') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'Cold Outreach - Email',
      'cold_outreach',
      'email',
      'Oportunidade de otimização para {{company_name}}',
      'Olá {{contact_name}},

Vi que a {{company_name}} atua no segmento de {{segment}} e identifiquei uma oportunidade interessante de otimização.

Empresas similares à {{company_name}} conseguiram reduzir custos em até 30% com nossa solução.

Que tal agendar 15 minutos esta semana para explorar como podemos ajudar?

Atenciosamente,
{{sender_name}}',
      '["company_name", "contact_name", "segment", "sender_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;

  -- Template 2: Follow-up Email
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Follow-up após reunião') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'Follow-up após reunião',
      'follow_up',
      'email',
      'Próximos passos - {{company_name}}',
      'Olá {{contact_name}},

Foi ótimo conversar com você hoje sobre as necessidades da {{company_name}}.

Conforme combinado, seguem os próximos passos:
{{next_steps}}

Fico à disposição para qualquer dúvida.

Atenciosamente,
{{sender_name}}',
      '["company_name", "contact_name", "next_steps", "sender_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;

  -- Template 3: WhatsApp
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'WhatsApp - Proposta Enviada') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'WhatsApp - Proposta Enviada',
      'follow_up',
      'whatsapp',
      NULL,
      'Oi {{contact_name}}! 👋

Acabei de enviar a proposta para {{company_name}} por email.

Quando puder dar uma olhada, me avisa! Qualquer dúvida, estou aqui. 📊',
      '["company_name", "contact_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;

  -- Template 4: Negociação Email
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Negociação - Proposta Customizada') THEN
    INSERT INTO public.message_templates (name, category, channel, subject, body, variables, created_by)
    VALUES (
      'Negociação - Proposta Customizada',
      'negotiation',
      'email',
      'Proposta Especial para {{company_name}}',
      'Olá {{contact_name}},

Após nossa conversa, preparei uma proposta especial considerando as necessidades específicas da {{company_name}}.

Principais benefícios:
{{key_benefits}}

Investimento: {{investment_value}}
Condições: {{payment_terms}}

Essa proposta é válida até {{validity_date}}.

Quando podemos agendar para revisar juntos?

Atenciosamente,
{{sender_name}}',
      '["company_name", "contact_name", "key_benefits", "investment_value", "payment_terms", "validity_date", "sender_name"]'::jsonb,
      (SELECT id FROM auth.users LIMIT 1)
    );
  END IF;
END $$;

-- ============================================================================
-- MIGRATION: 20251024180938_850ce395-4af6-46b5-93a1-247f26482878.sql
-- ============================================================================

-- Tabela de oportunidades SDR (pipeline real)
CREATE TABLE IF NOT EXISTS public.sdr_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  canvas_id UUID REFERENCES public.canvas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value NUMERIC NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
  won_date TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.sdr_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage opportunities"
  ON public.sdr_opportunities FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_sdr_opportunities_company ON public.sdr_opportunities(company_id);
CREATE INDEX idx_sdr_opportunities_stage ON public.sdr_opportunities(stage);
CREATE INDEX idx_sdr_opportunities_assigned ON public.sdr_opportunities(assigned_to);
CREATE INDEX idx_sdr_opportunities_created ON public.sdr_opportunities(created_at);

-- Trigger updated_at
CREATE TRIGGER update_sdr_opportunities_updated_at
  BEFORE UPDATE ON public.sdr_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir oportunidades a partir das conversas existentes
INSERT INTO public.sdr_opportunities (
  company_id,
  contact_id,
  conversation_id,
  title,
  stage,
  value,
  probability,
  next_action_date
)
SELECT 
  c.company_id,
  c.contact_id,
  c.id,
  COALESCE(comp.name || ' - Oportunidade', 'Nova Oportunidade'),
  CASE 
    WHEN c.status = 'open' THEN 'contacted'
    WHEN c.status = 'pending' THEN 'qualified'
    WHEN c.status = 'closed' THEN 'won'
    ELSE 'new'
  END,
  CASE 
    WHEN c.priority = 'high' THEN 120000
    WHEN c.priority = 'medium' THEN 75000
    ELSE 30000
  END,
  CASE 
    WHEN c.status = 'open' THEN 40
    WHEN c.status = 'pending' THEN 60
    WHEN c.status = 'closed' THEN 100
    ELSE 20
  END,
  NOW() + INTERVAL '7 days'
FROM public.conversations c
LEFT JOIN public.companies comp ON c.company_id = comp.id
WHERE c.company_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION: 20251024182024_5ee61c7e-61b6-4f8d-aa2a-8e3a51205530.sql
-- ============================================================================

-- Habilitar realtime para sdr_opportunities
ALTER TABLE public.sdr_opportunities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sdr_opportunities;

-- ============================================================================
-- MIGRATION: 20251024185115_ddeed647-e085-4af7-9378-ef9451d066eb.sql
-- ============================================================================

-- Create executive_reports table to persist generated reports
CREATE TABLE public.executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('company','maturity','fit')),
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure one report per company per type
CREATE UNIQUE INDEX executive_reports_company_type_idx
  ON public.executive_reports(company_id, report_type);

-- Enable RLS
ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read executive_reports"
  ON public.executive_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert executive_reports"
  ON public.executive_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update executive_reports"
  ON public.executive_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Timestamp trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_executive_reports_updated_at
BEFORE UPDATE ON public.executive_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251024191008_6bd29868-c6e3-4147-8655-8816bb504e14.sql
-- ============================================================================

-- ============================================================
-- SISTEMA DE RASTREABILIDADE E VERSIONAMENTO ROBUSTO
-- Inspirado em Econodata, Uplexis e outras plataformas enterprise
-- ============================================================

-- 1. ANALYSIS RUNS: Rastreia cada execução de enriquecimento
CREATE TABLE public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('full_360', 'incremental', 'scheduled', 'manual')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Métricas de qualidade
  sources_attempted JSONB DEFAULT '[]'::jsonb, -- Lista de fontes tentadas
  sources_succeeded JSONB DEFAULT '[]'::jsonb, -- Fontes que funcionaram
  sources_failed JSONB DEFAULT '[]'::jsonb,    -- Fontes que falharam
  
  -- Dados agregados do run
  data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
  fields_enriched INTEGER DEFAULT 0,
  fields_total INTEGER DEFAULT 0,
  
  -- Logs e erros
  error_log JSONB,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_runs_company ON public.analysis_runs(company_id);
CREATE INDEX idx_analysis_runs_status ON public.analysis_runs(status);
CREATE INDEX idx_analysis_runs_started ON public.analysis_runs(started_at DESC);

-- 2. ANALYSIS ARTIFACTS: Armazena resultado de cada etapa/fonte
CREATE TABLE public.analysis_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'receita_federal', 'web_scraping', 'social_media', 'tech_stack',
    'legal_data', 'financial_data', 'decision_makers', 'ai_insights'
  )),
  
  source_name TEXT NOT NULL, -- Ex: 'ReceitaWS', 'Google Search', 'LinkedIn'
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  
  -- Dados coletados
  raw_data JSONB NOT NULL,
  normalized_data JSONB, -- Dados normalizados para schema padrão
  
  -- Metadados de qualidade
  data_checksum TEXT, -- Hash para detectar mudanças
  fields_count INTEGER,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- Rastreabilidade
  execution_time_ms INTEGER,
  api_call_cost DECIMAL(10,6), -- Custo estimado da chamada
  error_details TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifacts_run ON public.analysis_artifacts(run_id);
CREATE INDEX idx_artifacts_company ON public.analysis_artifacts(company_id);
CREATE INDEX idx_artifacts_type ON public.analysis_artifacts(artifact_type);

-- 3. VERSIONAMENTO DE RELATÓRIOS: Nunca perde histórico
CREATE TABLE public.executive_reports_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.executive_reports(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
  
  version_number INTEGER NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('company','maturity','fit')),
  content JSONB NOT NULL,
  
  -- Metadados da versão
  change_summary TEXT,
  fields_changed JSONB, -- Lista de campos que mudaram desde versão anterior
  quality_improvement DECIMAL(5,2), -- % de melhoria em relação à versão anterior
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_versions_report ON public.executive_reports_versions(report_id);
CREATE INDEX idx_report_versions_company ON public.executive_reports_versions(company_id);
CREATE UNIQUE INDEX idx_report_versions_unique ON public.executive_reports_versions(company_id, report_type, version_number);

-- 4. COMPANY SNAPSHOTS: Estado da empresa em cada momento
CREATE TABLE public.company_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  
  -- Snapshot completo dos dados
  company_data JSONB NOT NULL,
  digital_presence_data JSONB,
  decision_makers_data JSONB,
  governance_signals_data JSONB,
  
  -- Hash para detectar mudanças
  data_hash TEXT NOT NULL,
  
  -- Indicadores de staleness
  data_freshness_score INTEGER CHECK (data_freshness_score BETWEEN 0 AND 100),
  days_since_last_update INTEGER,
  
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_company ON public.company_snapshots(company_id);
CREATE INDEX idx_snapshots_run ON public.company_snapshots(run_id);
CREATE INDEX idx_snapshots_date ON public.company_snapshots(snapshot_date DESC);

-- 5. RLS POLICIES para todas as tabelas
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_reports_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: usuários autenticados podem ler tudo
CREATE POLICY "Authenticated users can read analysis_runs"
  ON public.analysis_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert analysis_runs"
  ON public.analysis_runs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update analysis_runs"
  ON public.analysis_runs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read artifacts"
  ON public.analysis_artifacts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert artifacts"
  ON public.analysis_artifacts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read report versions"
  ON public.executive_reports_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert report versions"
  ON public.executive_reports_versions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read snapshots"
  ON public.company_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
  ON public.company_snapshots FOR INSERT TO authenticated WITH CHECK (true);

-- 6. FUNÇÃO para auto-incrementar version_number
CREATE OR REPLACE FUNCTION public.get_next_report_version(p_company_id UUID, p_report_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.executive_reports_versions
  WHERE company_id = p_company_id AND report_type = p_report_type;
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Adicionar campo run_id em executive_reports para rastreabilidade
ALTER TABLE public.executive_reports 
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS sources_used JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- MIGRATION: 20251024191106_823effc2-2419-4e66-a8f4-be4451088f65.sql
-- ============================================================================

-- Corrigir warnings de segurança: adicionar search_path nas funções

-- 1. Corrigir update_sdr_updated_at
DROP FUNCTION IF EXISTS public.update_sdr_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_sdr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- 2. Corrigir update_canvas_block_updated_at
DROP FUNCTION IF EXISTS public.update_canvas_block_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_canvas_block_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SET search_path = public, pg_temp;

-- 3. Corrigir create_canvas_version
DROP FUNCTION IF EXISTS public.create_canvas_version(uuid, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.create_canvas_version(
  p_canvas_id uuid, 
  p_tag text DEFAULT NULL, 
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
  v_snapshot JSONB;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM canvas_versions
  WHERE canvas_id = p_canvas_id;
  
  SELECT jsonb_build_object(
    'canvas', row_to_json(c.*),
    'blocks', COALESCE((SELECT jsonb_agg(row_to_json(b.*) ORDER BY b.order_index) FROM canvas_blocks b WHERE b.canvas_id = p_canvas_id), '[]'::jsonb),
    'comments', COALESCE((SELECT jsonb_agg(row_to_json(cm.*) ORDER BY cm.created_at DESC) FROM canvas_comments cm WHERE cm.canvas_id = p_canvas_id), '[]'::jsonb)
  )
  INTO v_snapshot
  FROM canvas c
  WHERE c.id = p_canvas_id;
  
  INSERT INTO canvas_versions (canvas_id, version_number, snapshot, tag, description, created_by)
  VALUES (p_canvas_id, v_version_number, v_snapshot, p_tag, p_description, auth.uid())
  RETURNING id INTO v_version_id;
  
  INSERT INTO canvas_activity (canvas_id, user_id, action_type, description, metadata)
  VALUES (p_canvas_id, auth.uid(), 'version_created', 'Versão ' || v_version_number || ' criada' || COALESCE(': ' || p_tag, ''), jsonb_build_object('version_id', v_version_id, 'version_number', v_version_number, 'tag', p_tag));
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- 4. Corrigir promote_canvas_decision
DROP FUNCTION IF EXISTS public.promote_canvas_decision(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.promote_canvas_decision(
  p_block_id uuid, 
  p_target_type text
)
RETURNS uuid AS $$
DECLARE
  v_block RECORD;
  v_task_id UUID;
  v_canvas_id UUID;
BEGIN
  SELECT cb.*, c.company_id, c.id as canvas_id
  INTO v_block
  FROM canvas_blocks cb
  JOIN canvas c ON c.id = cb.canvas_id
  WHERE cb.id = p_block_id AND cb.type = 'decision';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bloco de decisão não encontrado';
  END IF;
  
  v_canvas_id := v_block.canvas_id;
  
  IF p_target_type = 'sdr_task' THEN
    INSERT INTO sdr_tasks (title, description, company_id, status, due_date, assigned_to)
    VALUES (v_block.content->>'title', v_block.content->>'why', v_block.company_id, 'todo', COALESCE((v_block.content->>'due_at')::date, (now() + interval '7 days')::date), (v_block.content->>'owner')::uuid)
    RETURNING id INTO v_task_id;
    
    INSERT INTO canvas_links (canvas_id, target_type, target_id, metadata, created_by)
    VALUES (v_canvas_id, 'task', v_task_id, jsonb_build_object('promoted_from_block', p_block_id), auth.uid());
    
    INSERT INTO canvas_activity (canvas_id, block_id, user_id, action_type, description, metadata)
    VALUES (v_canvas_id, p_block_id, auth.uid(), 'promoted', 'Decisão promovida para tarefa SDR', jsonb_build_object('task_id', v_task_id, 'target_type', 'sdr_task'));
    
    RETURN v_task_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- 5. Corrigir update_ai_interactions_updated_at
DROP FUNCTION IF EXISTS public.update_ai_interactions_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_ai_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SET search_path = public, pg_temp;

-- 6. Corrigir get_next_report_version (da migração anterior)
DROP FUNCTION IF EXISTS public.get_next_report_version(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.get_next_report_version(
  p_company_id UUID, 
  p_report_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.executive_reports_versions
  WHERE company_id = p_company_id AND report_type = p_report_type;
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_temp;

-- ============================================================================
-- MIGRATION: 20251024223330_8c9fed87-8f81-4ee8-9fda-1b3ed2a10c86.sql
-- ============================================================================

-- =====================================================
-- SPRINT 2: KANBAN + BITRIX24 - Estrutura de Dados
-- =====================================================

-- Tabela de Deals (Negócios/Oportunidades)
CREATE TABLE IF NOT EXISTS sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT, -- ID no Bitrix24 ou outro CRM
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Pipeline & Estágio
  pipeline_id UUID, -- Para múltiplos pipelines no futuro
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
  source TEXT, -- cold_call, inbound, referral, etc
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

-- Índices para performance
CREATE INDEX idx_sdr_deals_company ON sdr_deals(company_id);
CREATE INDEX idx_sdr_deals_contact ON sdr_deals(contact_id);
CREATE INDEX idx_sdr_deals_assigned ON sdr_deals(assigned_to);
CREATE INDEX idx_sdr_deals_stage ON sdr_deals(stage);
CREATE INDEX idx_sdr_deals_status ON sdr_deals(status);
CREATE INDEX idx_sdr_deals_external ON sdr_deals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_sdr_deals_close_date ON sdr_deals(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- Tabela de Estágios Customizáveis
CREATE TABLE IF NOT EXISTS sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE, -- lead, qualification, proposal, etc
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability_default INTEGER DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  automation_rules JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX idx_pipeline_stages_order ON sdr_pipeline_stages(order_index);

-- Inserir estágios padrão
INSERT INTO sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Lead', 'lead', 0, '#6366f1', 10, false, false),
  ('Qualificação', 'qualification', 1, '#8b5cf6', 25, false, false),
  ('Proposta', 'proposal', 2, '#ec4899', 50, false, false),
  ('Negociação', 'negotiation', 3, '#f59e0b', 75, false, false),
  ('Fechamento', 'closing', 4, '#10b981', 90, false, false),
  ('Ganho', 'won', 5, '#22c55e', 100, true, true),
  ('Perdido', 'lost', 6, '#ef4444', 0, true, false)
ON CONFLICT (key) DO NOTHING;

-- Tabela de Atividades do Deal
CREATE TABLE IF NOT EXISTS sdr_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- stage_change, note, call, email, meeting
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deal_activities_deal ON sdr_deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON sdr_deal_activities(activity_type);
CREATE INDEX idx_deal_activities_created ON sdr_deal_activities(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

-- Trigger para registrar mudanças de estágio
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

-- RLS Policies
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deal_activities ENABLE ROW LEVEL SECURITY;

-- Policies para sdr_deals
CREATE POLICY "Authenticated users can read deals"
  ON sdr_deals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deals"
  ON sdr_deals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update deals"
  ON sdr_deals FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deals"
  ON sdr_deals FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policies para pipeline_stages
CREATE POLICY "Anyone can read pipeline stages"
  ON sdr_pipeline_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pipeline stages"
  ON sdr_pipeline_stages FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Policies para deal_activities
CREATE POLICY "Authenticated users can read deal activities"
  ON sdr_deal_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deal activities"
  ON sdr_deal_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comentários para documentação
COMMENT ON TABLE sdr_deals IS 'Negócios/Oportunidades do pipeline de vendas';
COMMENT ON TABLE sdr_pipeline_stages IS 'Estágios customizáveis do pipeline';
COMMENT ON TABLE sdr_deal_activities IS 'Histórico de atividades e mudanças dos deals';


-- ============================================================================
-- MIGRATION: 20251024223428_465a3ca9-e5e3-416b-bfcf-87038ffe4c76.sql
-- ============================================================================

-- Corrigir warnings de segurança: SET search_path nas functions

-- 1. Corrigir function update_sdr_deals_updated_at
DROP FUNCTION IF EXISTS update_sdr_deals_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

-- 2. Corrigir function log_deal_stage_change
DROP FUNCTION IF EXISTS log_deal_stage_change() CASCADE;

CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

COMMENT ON FUNCTION update_sdr_deals_updated_at IS 'Atualiza automaticamente o campo updated_at nos deals';
COMMENT ON FUNCTION log_deal_stage_change IS 'Registra automaticamente mudanças de estágio nos deals';


-- ============================================================================
-- MIGRATION: 20251024223444_c8fd84db-5418-4f29-9493-24bd66c66a25.sql
-- ============================================================================

-- =====================================================
-- SPRINT 2: KANBAN + BITRIX24 - Estrutura de Dados (Corrigida)
-- =====================================================

-- Verificar e remover tabelas existentes se necessário
DROP TABLE IF EXISTS sdr_deal_activities CASCADE;
DROP TABLE IF EXISTS sdr_deals CASCADE;
DROP TABLE IF EXISTS sdr_pipeline_stages CASCADE;
DROP FUNCTION IF EXISTS update_sdr_deals_updated_at CASCADE;
DROP FUNCTION IF EXISTS log_deal_stage_change CASCADE;

-- Tabela de Deals (Negócios/Oportunidades)
CREATE TABLE sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT, -- ID no Bitrix24 ou outro CRM
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID,
  
  -- Pipeline & Estágio
  pipeline_id UUID, -- Para múltiplos pipelines no futuro
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
  source TEXT, -- cold_call, inbound, referral, etc
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

-- Índices para performance
CREATE INDEX idx_sdr_deals_company ON sdr_deals(company_id);
CREATE INDEX idx_sdr_deals_contact ON sdr_deals(contact_id);
CREATE INDEX idx_sdr_deals_assigned ON sdr_deals(assigned_to);
CREATE INDEX idx_sdr_deals_stage ON sdr_deals(stage);
CREATE INDEX idx_sdr_deals_status ON sdr_deals(status);
CREATE INDEX idx_sdr_deals_external ON sdr_deals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_sdr_deals_close_date ON sdr_deals(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- Tabela de Estágios Customizáveis
CREATE TABLE sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability_default INTEGER DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  automation_rules JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pipeline_stages_order ON sdr_pipeline_stages(order_index);

-- Inserir estágios padrão
INSERT INTO sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Lead', 'lead', 0, '#6366f1', 10, false, false),
  ('Qualificação', 'qualification', 1, '#8b5cf6', 25, false, false),
  ('Proposta', 'proposal', 2, '#ec4899', 50, false, false),
  ('Negociação', 'negotiation', 3, '#f59e0b', 75, false, false),
  ('Fechamento', 'closing', 4, '#10b981', 90, false, false),
  ('Ganho', 'won', 5, '#22c55e', 100, true, true),
  ('Perdido', 'lost', 6, '#ef4444', 0, true, false);

-- Tabela de Atividades do Deal
CREATE TABLE sdr_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deal_activities_deal ON sdr_deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON sdr_deal_activities(activity_type);
CREATE INDEX idx_deal_activities_created ON sdr_deal_activities(created_at DESC);

-- Triggers
CREATE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

CREATE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();

-- RLS Policies
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read deals"
  ON sdr_deals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deals"
  ON sdr_deals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update deals"
  ON sdr_deals FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deals"
  ON sdr_deals FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read pipeline stages"
  ON sdr_pipeline_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pipeline stages"
  ON sdr_pipeline_stages FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read deal activities"
  ON sdr_deal_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deal activities"
  ON sdr_deal_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================================
-- MIGRATION: 20251024223511_2ace36ce-e93d-4b55-ba60-a7a9c2e49a7a.sql
-- ============================================================================

-- Corrigir search_path das funções para segurança
DROP FUNCTION IF EXISTS update_sdr_deals_updated_at CASCADE;
DROP FUNCTION IF EXISTS log_deal_stage_change CASCADE;

CREATE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

CREATE FUNCTION log_deal_stage_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();


-- ============================================================================
-- MIGRATION: 20251024223702_e413313c-c2a3-43e1-afa5-289d06d2ba94.sql
-- ============================================================================

-- Corrigir search_path das funções para segurança
DROP FUNCTION IF EXISTS update_sdr_deals_updated_at CASCADE;
DROP FUNCTION IF EXISTS log_deal_stage_change CASCADE;

CREATE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

CREATE FUNCTION log_deal_stage_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_stage_change();


-- ============================================================================
-- MIGRATION: 20251025001230_ed0e7f7e-222f-45be-9dd5-f64c58bc42e6.sql
-- ============================================================================

-- FASE 5: API & Webhooks Tables

-- API Keys table
CREATE TABLE IF NOT EXISTS public.sdr_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS public.sdr_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS public.sdr_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.sdr_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  status_code INTEGER,
  success BOOLEAN,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sdr_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies - API Keys
CREATE POLICY "Users can view their own API keys" ON public.sdr_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON public.sdr_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.sdr_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.sdr_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies - Webhooks
CREATE POLICY "Users can view their own webhooks" ON public.sdr_webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks" ON public.sdr_webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks" ON public.sdr_webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks" ON public.sdr_webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies - Webhook Logs
CREATE POLICY "Users can view their webhook logs" ON public.sdr_webhook_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sdr_webhooks
      WHERE sdr_webhooks.id = webhook_id
      AND sdr_webhooks.user_id = auth.uid()
    )
  );

-- RLS Policies - Notifications
CREATE POLICY "Users can view their own notifications" ON public.sdr_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.sdr_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.sdr_notifications
  FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_sdr_api_keys_updated_at
  BEFORE UPDATE ON public.sdr_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sdr_updated_at();

CREATE TRIGGER update_sdr_webhooks_updated_at
  BEFORE UPDATE ON public.sdr_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sdr_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sdr_api_keys_user_id ON public.sdr_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_api_keys_key ON public.sdr_api_keys(key);
CREATE INDEX IF NOT EXISTS idx_sdr_webhooks_user_id ON public.sdr_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_webhooks_event_type ON public.sdr_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_sdr_webhook_logs_webhook_id ON public.sdr_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_user_id ON public.sdr_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sdr_notifications_is_read ON public.sdr_notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.sdr_notifications;

-- ============================================================================
-- MIGRATION: 20251025004357_fddc5e18-e7ff-4c38-b441-0a636e103a81.sql
-- ============================================================================

-- ========================================
-- FASE 1: Adicionar campos faltantes em sdr_deals
-- ========================================

-- Adicionar foreign keys para quote e proposal
ALTER TABLE sdr_deals 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quote_history(id),
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES visual_proposals(id),
ADD COLUMN IF NOT EXISTS assigned_sales_rep UUID REFERENCES profiles(id);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_sdr_deals_quote_id ON sdr_deals(quote_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_proposal_id ON sdr_deals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned_sales_rep ON sdr_deals(assigned_sales_rep);

-- ========================================
-- FASE 2: Criar tabela de handoffs (SDR → Vendedor)
-- ========================================

CREATE TABLE IF NOT EXISTS sdr_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  from_sdr UUID REFERENCES profiles(id),
  to_sales_rep UUID NOT NULL REFERENCES profiles(id),
  handoff_notes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  handoff_date TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies para sdr_handoffs
ALTER TABLE sdr_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read handoffs" 
ON sdr_handoffs FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create handoffs" 
ON sdr_handoffs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update handoffs" 
ON sdr_handoffs FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- FASE 3: Criar tabela de aprovações de desconto
-- ========================================

CREATE TABLE IF NOT EXISTS deal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quote_history(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  discount_requested NUMERIC(5,2) NOT NULL,
  justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_level TEXT CHECK (approval_level IN ('manager', 'director', 'vp')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- RLS policies para deal_approvals
ALTER TABLE deal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approvals" 
ON deal_approvals FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create approvals" 
ON deal_approvals FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update approvals" 
ON deal_approvals FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- FASE 4: Criar tabela de onboarding pós-venda
-- ========================================

CREATE TABLE IF NOT EXISTS customer_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES sdr_deals(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  onboarding_status TEXT DEFAULT 'scheduled' CHECK (onboarding_status IN ('scheduled', 'in_progress', 'completed', 'on_hold')),
  kickoff_date DATE,
  go_live_date DATE,
  assigned_csm UUID REFERENCES profiles(id),
  implementation_plan JSONB DEFAULT '{}'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies para customer_onboarding
ALTER TABLE customer_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage onboarding" 
ON customer_onboarding FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_customer_onboarding_updated_at
BEFORE UPDATE ON customer_onboarding
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FASE 5: Trigger de auto-criação de Deal após enrichment
-- ========================================

CREATE OR REPLACE FUNCTION auto_create_deal_after_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  v_deal_exists BOOLEAN;
  v_priority TEXT;
  v_value NUMERIC;
BEGIN
  -- Verificar se já existe deal para essa empresa
  SELECT EXISTS(
    SELECT 1 FROM sdr_deals 
    WHERE company_id = NEW.id 
    AND status IN ('open', 'won')
  ) INTO v_deal_exists;
  
  -- Se já existe deal ativo, não criar outro
  IF v_deal_exists THEN
    RETURN NEW;
  END IF;
  
  -- Se empresa foi enriquecida (tem maturity score), criar deal automaticamente
  IF NEW.digital_maturity_score IS NOT NULL AND OLD.digital_maturity_score IS NULL THEN
    
    -- Calcular prioridade baseada no score
    v_priority := CASE 
      WHEN NEW.digital_maturity_score >= 70 THEN 'high'
      WHEN NEW.digital_maturity_score >= 50 THEN 'medium'
      ELSE 'low'
    END;
    
    -- Estimar valor baseado em tamanho da empresa
    v_value := CASE 
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 500 THEN 100000
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 100 THEN 50000
      ELSE 25000
    END;
    
    -- Criar deal automaticamente
    INSERT INTO sdr_deals (
      company_id,
      title,
      stage,
      priority,
      status,
      value,
      probability,
      next_action,
      next_action_date,
      source,
      created_at
    ) VALUES (
      NEW.id,
      'Prospecção - ' || NEW.name,
      'discovery',
      v_priority,
      'open',
      v_value,
      30, -- Probabilidade inicial
      'Iniciar pesquisa e identificar decisores',
      NOW() + INTERVAL '2 days',
      'enrichment_auto',
      NOW()
    );
    
    -- Log da atividade
    INSERT INTO sdr_deal_activities (
      deal_id,
      activity_type,
      description,
      created_by
    )
    SELECT 
      id,
      'deal_created',
      'Deal criado automaticamente após enriquecimento 360°',
      auth.uid()
    FROM sdr_deals
    WHERE company_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_create_deal ON companies;
CREATE TRIGGER trigger_auto_create_deal
AFTER UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION auto_create_deal_after_enrichment();

-- ========================================
-- FASE 6: Adicionar foreign keys em visual_proposals
-- ========================================

ALTER TABLE visual_proposals
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quote_history(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visual_proposals_quote_id ON visual_proposals(quote_id);

-- ========================================
-- FASE 7: Adicionar campo deal_id em quote_history
-- ========================================

ALTER TABLE quote_history
ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES sdr_deals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_history_deal_id ON quote_history(deal_id);

-- ============================================================================
-- MIGRATION: 20251025022516_7bc705f2-f07d-439a-b8e1-574752a22f3a.sql
-- ============================================================================

-- Tabela de catálogo de serviços de consultoria OLV
CREATE TABLE IF NOT EXISTS consulting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DIAGNÓSTICO', 'OPERACIONAL', 'ESTRATÉGICO', 'TECNOLOGIA', 'COMPLIANCE', 'CAPACITAÇÃO')),
  description TEXT,
  
  -- Precificação por horas técnicas
  base_hourly_rate DECIMAL(10,2),
  min_hourly_rate DECIMAL(10,2),
  max_hourly_rate DECIMAL(10,2),
  
  -- Estimativa de horas por projeto
  estimated_hours_min INTEGER,
  estimated_hours_max INTEGER,
  
  -- Precificação por projeto fechado
  base_project_price DECIMAL(10,2),
  min_project_price DECIMAL(10,2),
  max_project_price DECIMAL(10,2),
  
  -- Modelos de precificação disponíveis
  pricing_models JSONB DEFAULT '["project", "hourly", "retainer", "performance"]'::jsonb,
  
  -- Configurações específicas
  requires_platforms JSONB DEFAULT '[]'::jsonb,
  target_sectors JSONB DEFAULT '[]'::jsonb,
  complexity_factors JSONB DEFAULT '{}'::jsonb,
  
  -- Custos adicionais típicos
  implementation_cost DECIMAL(10,2),
  training_cost DECIMAL(10,2),
  travel_daily_rate DECIMAL(10,2) DEFAULT 1500,
  
  -- Metadados
  consultant_level TEXT CHECK (consultant_level IN ('JÚNIOR', 'PLENO', 'SÊNIOR', 'ESPECIALISTA', 'TRIBUTÁRIO', 'COMPLIANCE')),
  is_configurable BOOLEAN DEFAULT true,
  dependencies TEXT[] DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] DEFAULT ARRAY[]::text[],
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de precificação de consultores por nível
CREATE TABLE IF NOT EXISTS consultant_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL UNIQUE CHECK (level IN ('JÚNIOR', 'PLENO', 'SÊNIOR', 'ESPECIALISTA', 'TRIBUTÁRIO', 'COMPLIANCE')),
  hourly_rate_min DECIMAL(10,2) NOT NULL,
  hourly_rate_max DECIMAL(10,2) NOT NULL,
  description TEXT,
  experience_years_min INTEGER,
  experience_years_max INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir taxas base de consultores
INSERT INTO consultant_rates (level, hourly_rate_min, hourly_rate_max, description, experience_years_min, experience_years_max) VALUES
('JÚNIOR', 180, 280, 'Consultor Júnior em Comex & Supply Chain', 2, 5),
('PLENO', 290, 400, 'Consultor Pleno em Comex & Supply Chain', 5, 10),
('SÊNIOR', 410, 550, 'Consultor Sênior em Comex & Supply Chain', 10, 15),
('ESPECIALISTA', 560, 750, 'Especialista/Gerente de Projeto', 15, NULL),
('TRIBUTÁRIO', 450, 650, 'Especialista Tributário/Fiscal em Comex', 10, NULL),
('COMPLIANCE', 480, 680, 'Especialista em Compliance Comex', 10, NULL);

-- Inserir serviços principais da OLV
INSERT INTO consulting_services (sku, name, category, description, consultant_level, estimated_hours_min, estimated_hours_max, base_project_price, min_project_price, max_project_price) VALUES
('OLV-DIAG-001', 'Diagnóstico Estratégico Inicial', 'DIAGNÓSTICO', 'Análise completa da maturidade organizacional e digital, assessment de processos atuais (AS-IS), mapeamento de gaps e oportunidades', 'SÊNIOR', 60, 100, 37500, 25000, 50000),
('OLV-IMP-001', 'Estruturação de Importação Exclusiva', 'OPERACIONAL', 'Modelagem completa, planejamento fiscal e operacional para importação exclusiva com estratégias diferenciadas', 'ESPECIALISTA', 150, 250, 90000, 60000, 120000),
('OLV-EXP-001', 'Otimização de Processos de Exportação', 'OPERACIONAL', 'Mapeamento, melhorias e implementação de processos otimizados de exportação', 'SÊNIOR', 120, 200, 72500, 50000, 95000),
('OLV-TRIB-001', 'Planejamento Tributário em Comex', 'ESTRATÉGICO', 'Análise tributária, sugestão de regimes especiais e implementação de redução tributária estruturada', 'TRIBUTÁRIO', 80, 150, 57500, 40000, 75000),
('OLV-SC-001', 'Implementação de Gestão de Supply Chain', 'OPERACIONAL', 'Desenho e implementação completa de nova cadeia de suprimentos integrada', 'ESPECIALISTA', 200, 400, 145000, 90000, 200000),
('OLV-COMP-001', 'Auditoria e Plano de Compliance Comex', 'COMPLIANCE', 'Revisão de conformidade regulatória e elaboração de plano de ação detalhado', 'COMPLIANCE', 100, 180, 65000, 45000, 85000),
('OLV-CAP-001', 'Capacitação Personalizada (por dia)', 'CAPACITAÇÃO', 'Treinamento in-company para equipes em Comex e Supply Chain', 'SÊNIOR', 8, 8, 4000, 3000, 5000),
('OLV-EST-001', 'Consultoria Estratégica em Comércio Exterior', 'ESTRATÉGICO', 'Orientação estratégica para expansão e otimização das operações globais', 'ESPECIALISTA', 100, 180, 95000, 60000, 130000),
('OLV-LOG-001', 'Planejamento Logístico Integrado', 'OPERACIONAL', 'Design e gestão de rotas e modais para máxima eficiência logística', 'SÊNIOR', 80, 140, 65000, 45000, 90000),
('OLV-TECH-001', 'Tecnologia Aplicada à Competitividade', 'TECNOLOGIA', 'Implementação e uso das plataformas OLV (STRATEVO, EXCELTTA, etc.) para inteligência e gestão', 'ESPECIALISTA', 120, 200, 110000, 70000, 150000);

-- RLS Policies
ALTER TABLE consulting_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read consulting_services" ON consulting_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert consulting_services" ON consulting_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update consulting_services" ON consulting_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete consulting_services" ON consulting_services FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read consultant_rates" ON consultant_rates FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_consulting_services_category ON consulting_services(category);
CREATE INDEX idx_consulting_services_active ON consulting_services(active);
CREATE INDEX idx_consultant_rates_level ON consultant_rates(level);

-- ============================================================================
-- MIGRATION: 20251025034143_d0187822-b941-4482-8983-986d601ab187.sql
-- ============================================================================

-- Tabela de configuração de sincronização Bitrix24
CREATE TABLE IF NOT EXISTS public.bitrix_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  domain TEXT,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('olv_to_bitrix', 'bitrix_to_olv', 'bidirectional')),
  auto_sync BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,
  field_mapping JSONB DEFAULT '{}'::jsonb,
  last_sync TIMESTAMPTZ,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de log de sincronizações Bitrix24
CREATE TABLE IF NOT EXISTS public.bitrix_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.bitrix_sync_config(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_sync_log ENABLE ROW LEVEL SECURITY;

-- Policies para bitrix_sync_config
CREATE POLICY "Users can view own Bitrix config"
  ON public.bitrix_sync_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Bitrix config"
  ON public.bitrix_sync_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Bitrix config"
  ON public.bitrix_sync_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Bitrix config"
  ON public.bitrix_sync_config FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para bitrix_sync_log
CREATE POLICY "Users can view own Bitrix sync logs"
  ON public.bitrix_sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bitrix_sync_config
      WHERE bitrix_sync_config.id = bitrix_sync_log.config_id
      AND bitrix_sync_config.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert Bitrix sync logs"
  ON public.bitrix_sync_log FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_bitrix_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bitrix_sync_config_updated_at
  BEFORE UPDATE ON public.bitrix_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bitrix_config_updated_at();

-- Índices para performance
CREATE INDEX idx_bitrix_config_user ON public.bitrix_sync_config(user_id);
CREATE INDEX idx_bitrix_log_config ON public.bitrix_sync_log(config_id);
CREATE INDEX idx_bitrix_log_created ON public.bitrix_sync_log(created_at DESC);

-- ============================================================================
-- MIGRATION: 20251025040511_8c781fb5-fd72-47ba-91c3-ce11ab8f75d3.sql
-- ============================================================================

-- Create table for WhatsApp and other SDR integrations configuration
CREATE TABLE IF NOT EXISTS public.sdr_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_name TEXT NOT NULL,
  provider TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_name)
);

-- Enable RLS
ALTER TABLE public.sdr_integrations ENABLE ROW LEVEL SECURITY;

-- Policies for sdr_integrations
CREATE POLICY "Users can view their own integrations"
  ON public.sdr_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations"
  ON public.sdr_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.sdr_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.sdr_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_sdr_integrations_updated_at
  BEFORE UPDATE ON public.sdr_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_sdr_integrations_user_id ON public.sdr_integrations(user_id);
CREATE INDEX idx_sdr_integrations_integration_name ON public.sdr_integrations(integration_name);

-- ============================================================================
-- MIGRATION: 20251025141447_17e52296-cd0f-4b7a-a409-def44888aff7.sql
-- ============================================================================

-- ============================================
-- FASE 1: CATÁLOGO REAL DE PRODUTOS TOTVS (CORRIGIDO)
-- ============================================

-- Dropar tabelas existentes se houver conflito
DROP TABLE IF EXISTS totvs_products CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;

-- Tabela de produtos TOTVS (catálogo real)
CREATE TABLE totvs_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO', 'INTERMEDIÁRIO', 'AVANÇADO', 'ESPECIALIZADO')),
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  min_price NUMERIC(10,2) NOT NULL,
  max_price NUMERIC(10,2),
  target_sectors JSONB DEFAULT '[]'::jsonb,
  target_company_size TEXT[] DEFAULT ARRAY[]::text[],
  min_employees INTEGER,
  max_employees INTEGER,
  is_configurable BOOLEAN DEFAULT true,
  config_options JSONB DEFAULT '{}'::jsonb,
  dependencies TEXT[] DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] DEFAULT ARRAY[]::text[],
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de regras de precificação
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('sector', 'company_size', 'volume', 'bundle', 'region')),
  conditions JSONB NOT NULL,
  discount_percentage NUMERIC(5,2),
  price_multiplier NUMERIC(5,2),
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_totvs_products_category ON totvs_products(category);
CREATE INDEX idx_totvs_products_active ON totvs_products(active);
CREATE INDEX idx_totvs_products_sku ON totvs_products(sku);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(active);

-- RLS Policies
ALTER TABLE totvs_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read totvs_products"
  ON totvs_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read pricing_rules"
  ON pricing_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Popular catálogo de produtos TOTVS (dados reais)
INSERT INTO totvs_products (sku, name, category, description, base_price, min_price, max_price, target_sectors, target_company_size, min_employees, max_employees) VALUES
('TOTVS-ERP-PROTHEUS-BASIC', 'TOTVS Protheus - Pacote Básico', 'BÁSICO', 'ERP completo com módulos essenciais: Financeiro, Contábil, Fiscal e Compras', 45000, 35000, 60000, '["Indústria", "Comércio", "Serviços"]'::jsonb, ARRAY['PEQUENA', 'MÉDIA'], 20, 200),
('TOTVS-FLUIG-BASIC', 'TOTVS Fluig - Gestão de Processos', 'BÁSICO', 'Plataforma de gestão de processos e documentos digitais', 18000, 12000, 25000, '["Todos"]'::jsonb, ARRAY['PEQUENA', 'MÉDIA', 'GRANDE'], 10, NULL),
('TOTVS-RH-BASIC', 'TOTVS RM - Gestão de RH', 'BÁSICO', 'Sistema de gestão de recursos humanos e folha de pagamento', 22000, 15000, 30000, '["Todos"]'::jsonb, ARRAY['PEQUENA', 'MÉDIA', 'GRANDE'], 20, NULL),
('TOTVS-ERP-PROTHEUS-FULL', 'TOTVS Protheus - Pacote Completo', 'INTERMEDIÁRIO', 'ERP completo com todos os módulos: Financeiro, Contábil, Fiscal, Compras, Vendas, Estoque, Produção', 85000, 70000, 120000, '["Indústria", "Comércio", "Serviços"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, 500),
('TOTVS-CRM', 'TOTVS CRM', 'INTERMEDIÁRIO', 'Gestão completa de relacionamento com clientes e pipeline de vendas', 35000, 25000, 50000, '["Comércio", "Serviços", "Tecnologia"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 30, NULL),
('TOTVS-WMS', 'TOTVS WMS - Gestão de Armazém', 'INTERMEDIÁRIO', 'Sistema de gerenciamento de armazém e logística', 42000, 30000, 60000, '["Indústria", "Comércio", "Logística"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-MES', 'TOTVS MES - Manufatura', 'INTERMEDIÁRIO', 'Sistema de execução de manufatura para controle de produção', 55000, 40000, 75000, '["Indústria"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 100, NULL),
('TOTVS-BI-ANALYTICS', 'TOTVS Analytics - Business Intelligence', 'AVANÇADO', 'Plataforma avançada de BI e analytics com dashboards executivos', 48000, 35000, 70000, '["Todos"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-AI-CAROL', 'TOTVS Carol - Plataforma de IA', 'AVANÇADO', 'Inteligência artificial para análise preditiva e automação', 65000, 50000, 95000, '["Todos"]'::jsonb, ARRAY['GRANDE'], 200, NULL),
('TOTVS-BLOCKCHAIN', 'TOTVS Blockchain', 'AVANÇADO', 'Solução blockchain para rastreabilidade e segurança de dados', 75000, 60000, 110000, '["Indústria", "Agronegócio", "Financeiro"]'::jsonb, ARRAY['GRANDE'], 500, NULL),
('TOTVS-AGRO', 'TOTVS Agro', 'ESPECIALIZADO', 'ERP especializado para agronegócio', 95000, 75000, 140000, '["Agronegócio"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-SAUDE', 'TOTVS Saúde', 'ESPECIALIZADO', 'Sistema de gestão hospitalar completo', 120000, 95000, 180000, '["Saúde"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 100, NULL),
('TOTVS-EDUCACAO', 'TOTVS Educacional', 'ESPECIALIZADO', 'Plataforma de gestão educacional', 55000, 40000, 80000, '["Educação"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL),
('TOTVS-FINANCEIRO', 'TOTVS Banking', 'ESPECIALIZADO', 'Sistema para instituições financeiras', 150000, 120000, 220000, '["Financeiro", "Bancos"]'::jsonb, ARRAY['GRANDE'], 200, NULL),
('TOTVS-VAREJO', 'TOTVS Varejo', 'ESPECIALIZADO', 'Solução completa para gestão de varejo', 68000, 50000, 95000, '["Comércio", "Varejo"]'::jsonb, ARRAY['MÉDIA', 'GRANDE'], 50, NULL);

-- Popular regras de precificação
INSERT INTO pricing_rules (name, rule_type, conditions, discount_percentage, priority) VALUES
('Desconto Agronegócio', 'sector', '{"sectors": ["Agronegócio", "Agricultura"]}'::jsonb, 5.00, 10),
('Desconto Educação', 'sector', '{"sectors": ["Educação"]}'::jsonb, 8.00, 10),
('Desconto Saúde', 'sector', '{"sectors": ["Saúde", "Hospitais"]}'::jsonb, 7.00, 10),
('Desconto Pequena Empresa', 'company_size', '{"size": "PEQUENA", "employees_max": 50}'::jsonb, 10.00, 5),
('Desconto Média Empresa', 'company_size', '{"size": "MÉDIA", "employees_min": 51, "employees_max": 200}'::jsonb, 5.00, 5),
('Bundle Básico + RH', 'bundle', '{"products": ["TOTVS-ERP-PROTHEUS-BASIC", "TOTVS-RH-BASIC"]}'::jsonb, 12.00, 15),
('Bundle Completo + CRM', 'bundle', '{"products": ["TOTVS-ERP-PROTHEUS-FULL", "TOTVS-CRM"]}'::jsonb, 15.00, 15),
('Bundle Full Stack', 'bundle', '{"min_products": 3}'::jsonb, 20.00, 20);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_totvs_products_updated_at
  BEFORE UPDATE ON totvs_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251025141547_9cc7b751-ffab-460f-b288-8f53c25a13d9.sql
-- ============================================================================

-- Corrigir search_path das funções criadas
DROP TRIGGER IF EXISTS update_totvs_products_updated_at ON totvs_products;
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;

-- A função update_updated_at_column já existe e tem o search_path correto
-- Apenas recriar os triggers

CREATE TRIGGER update_totvs_products_updated_at
  BEFORE UPDATE ON totvs_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251025143349_9ee61e21-ffaf-4deb-bddd-a2c8205dcbd2.sql
-- ============================================================================

-- Adicionar campo de submódulos aos produtos TOTVS
ALTER TABLE totvs_products ADD COLUMN IF NOT EXISTS submodules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN totvs_products.submodules IS 'Lista de submódulos/variações do produto (ex: Protheus, Datasul para ERP)';

-- Atualizar produtos existentes com submódulos
UPDATE totvs_products SET submodules = '["Protheus", "Datasul", "RM"]'::jsonb WHERE sku = 'ERP-BASICO';
UPDATE totvs_products SET submodules = '["Protheus", "Datasul", "RM", "Manufatura"]'::jsonb WHERE sku = 'ERP-INTERMEDIARIO';
UPDATE totvs_products SET submodules = '["Protheus Avançado", "Datasul Enterprise", "RM Corporativo"]'::jsonb WHERE sku = 'ERP-AVANCADO';

-- Adicionar novos produtos do catálogo TOTVS
INSERT INTO totvs_products (sku, name, category, description, base_price, min_price, target_company_size, target_sectors, is_configurable, config_options, dependencies, recommended_with, submodules, active) VALUES
('IA-CAROL', 'TOTVS Carol (IA)', 'AVANÇADO', 'Plataforma de Inteligência Artificial com assistente virtual, análise preditiva e automação inteligente', 35000, 28000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"features": ["Assistente Virtual", "Análise Preditiva", "Automação de Processos"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-AVANCADO', 'ANALYTICS-BI']::text[], '[]'::jsonb, true),

('ANALYTICS-BI', 'TOTVS Analytics (BI)', 'INTERMEDIÁRIO', 'Business Intelligence e análise de dados com dashboards personalizáveis', 25000, 20000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"features": ["Dashboards", "Relatórios Customizados", "Data Lake"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'ERP-AVANCADO']::text[], '[]'::jsonb, true),

('ASSINATURA-ELETRONICA', 'TOTVS Assinatura Eletrônica', 'BÁSICO', 'Assinatura digital de documentos com validade jurídica', 8000, 6000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, false, '{}'::jsonb, ARRAY[]::text[], ARRAY['FLUIG-ECM']::text[], '[]'::jsonb, true),

('ATENDIMENTO-CHATBOT', 'TOTVS Atendimento', 'INTERMEDIÁRIO', 'Chatbot e sistema de atendimento ao cliente com IA', 18000, 14000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Varejo", "Serviços", "E-commerce"]'::jsonb, true, '{"channels": ["WhatsApp", "Site", "App", "Facebook"]}'::jsonb, ARRAY[]::text[], ARRAY['CRM-VENDAS', 'IA-CAROL']::text[], '[]'::jsonb, true),

('CLOUD-INFRASTRUCTURE', 'TOTVS Cloud', 'BÁSICO', 'Infraestrutura em nuvem e hospedagem de sistemas TOTVS', 12000, 10000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"tiers": ["Básico", "Profissional", "Enterprise"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-BASICO', 'ERP-INTERMEDIARIO']::text[], '[]'::jsonb, true),

('CREDITO-FINANCEIRO', 'TOTVS Crédito', 'ESPECIALIZADO', 'Plataforma de análise de crédito e gestão financeira', 32000, 25000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Financeiro", "Varejo"]'::jsonb, true, '{"features": ["Score de Crédito", "Análise de Risco", "Cobrança Inteligente"]}'::jsonb, ARRAY['ERP-INTERMEDIARIO']::text[], ARRAY['ANALYTICS-BI']::text[], '[]'::jsonb, true),

('CRM-VENDAS', 'TOTVS CRM', 'INTERMEDIÁRIO', 'CRM de vendas com pipeline, automação e integrações', 22000, 18000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"features": ["Pipeline Visual", "Automação", "Mobile", "Integrações"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'MARKETING-DIGITAL']::text[], '[]'::jsonb, true),

('FLUIG-ECM', 'TOTVS Fluig', 'INTERMEDIÁRIO', 'Plataforma de gestão de processos, documentos e colaboração', 28000, 22000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"modules": ["BPM", "ECM", "Social"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'ASSINATURA-ELETRONICA']::text[], '["BPM", "ECM", "Social"]'::jsonb, true),

('IPAAS-INTEGRACAO', 'TOTVS iPaaS', 'AVANÇADO', 'Plataforma de integração entre sistemas e APIs', 30000, 24000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"connectors": 100}'::jsonb, ARRAY['ERP-INTERMEDIARIO']::text[], ARRAY['CLOUD-INFRASTRUCTURE']::text[], '[]'::jsonb, true),

('MARKETING-DIGITAL', 'TOTVS Marketing', 'INTERMEDIÁRIO', 'Automação de marketing digital e gestão de campanhas', 20000, 16000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Varejo", "E-commerce", "Serviços"]'::jsonb, true, '{"features": ["Email Marketing", "Landing Pages", "Automação", "Analytics"]}'::jsonb, ARRAY[]::text[], ARRAY['CRM-VENDAS', 'ANALYTICS-BI']::text[], '[]'::jsonb, true),

('PAGAMENTOS-DIGITAL', 'TOTVS Pagamentos', 'INTERMEDIÁRIO', 'Gateway de pagamentos e gestão de transações', 15000, 12000, ARRAY['PEQUENO', 'MÉDIO', 'GRANDE']::text[], '["Varejo", "E-commerce"]'::jsonb, true, '{"methods": ["Cartão", "PIX", "Boleto", "Parcelamento"]}'::jsonb, ARRAY[]::text[], ARRAY['ERP-INTERMEDIARIO', 'CREDITO-FINANCEIRO']::text[], '[]'::jsonb, true),

('RH-GESTAO-PESSOAS', 'TOTVS RH', 'INTERMEDIÁRIO', 'Sistema completo de gestão de recursos humanos', 24000, 19000, ARRAY['MÉDIO', 'GRANDE']::text[], '["Todos"]'::jsonb, true, '{"modules": ["Folha", "Ponto", "Benefícios", "Recrutamento", "Treinamento"]}'::jsonb, ARRAY['ERP-BASICO']::text[], ARRAY['ANALYTICS-BI']::text[], '["Folha de Pagamento", "Ponto Eletrônico", "Benefícios", "Recrutamento e Seleção", "Treinamento e Desenvolvimento"]'::jsonb, true)

ON CONFLICT (sku) DO UPDATE SET
  submodules = EXCLUDED.submodules,
  description = EXCLUDED.description,
  recommended_with = EXCLUDED.recommended_with;

-- ============================================================================
-- MIGRATION: 20251025151023_4dff3a96-a525-47e7-885e-c86480c6786c.sql
-- ============================================================================

-- Product catalog and pricing rules

-- Create product_catalog table
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO','INTERMEDIÁRIO','AVANÇADO','ESPECIALIZADO')),
  description TEXT,
  base_price NUMERIC NOT NULL,
  min_price NUMERIC NOT NULL DEFAULT 0,
  is_configurable BOOLEAN NOT NULL DEFAULT false,
  config_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  dependencies TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_product_catalog_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_catalog_updated_at ON public.product_catalog;
CREATE TRIGGER trg_product_catalog_updated_at
BEFORE UPDATE ON public.product_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_product_catalog_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON public.product_catalog (active);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog (category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_sku ON public.product_catalog (sku);

-- Enable RLS and policies
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read product_catalog"
  ON public.product_catalog FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- e.g., 'company_size', 'sector', 'campaign'
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_pricing_rules_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER trg_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_pricing_rules_updated_at();

CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules (active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON public.pricing_rules (priority DESC);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read pricing_rules"
  ON public.pricing_rules FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- MIGRATION: 20251025151132_99c7b422-388d-49f6-b8b3-14ac3921423f.sql
-- ============================================================================

-- Product catalog and pricing rules

-- Create product_catalog table
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('BÁSICO','INTERMEDIÁRIO','AVANÇADO','ESPECIALIZADO')),
  description TEXT,
  base_price NUMERIC NOT NULL,
  min_price NUMERIC NOT NULL DEFAULT 0,
  is_configurable BOOLEAN NOT NULL DEFAULT false,
  config_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  dependencies TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  recommended_with TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_product_catalog_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_catalog_updated_at ON public.product_catalog;
CREATE TRIGGER trg_product_catalog_updated_at
BEFORE UPDATE ON public.product_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_product_catalog_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON public.product_catalog (active);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog (category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_sku ON public.product_catalog (sku);

-- Enable RLS and policies
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read product_catalog"
  ON public.product_catalog FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- e.g., 'company_size', 'sector', 'campaign'
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_pricing_rules_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER trg_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_pricing_rules_updated_at();

CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules (active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON public.pricing_rules (priority DESC);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can read pricing_rules"
  ON public.pricing_rules FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- MIGRATION: 20251025151256_a6c3f2d6-566d-4dc4-8b2e-48e8263bbe80.sql
-- ============================================================================

-- Fix pricing_rules table - add name column and fix data insertion

-- Add missing name column to pricing_rules
ALTER TABLE public.pricing_rules 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Regra sem nome';

-- Now insert sample data
INSERT INTO public.product_catalog (sku, name, category, description, base_price, min_price) VALUES
-- BÁSICO
('TOT-GEST-001', 'Protheus Gestão Básica', 'BÁSICO', 'Sistema de gestão empresarial básico', 25000, 20000),
('TOT-CONT-001', 'Contabilidade Básica', 'BÁSICO', 'Módulo de contabilidade essencial', 15000, 12000),
('TOT-FISC-001', 'Fiscal Básico', 'BÁSICO', 'Controle fiscal fundamental', 18000, 14000),

-- INTERMEDIÁRIO
('TOT-ERP-001', 'Protheus ERP Standard', 'INTERMEDIÁRIO', 'Sistema ERP completo', 50000, 40000),
('TOT-CRM-001', 'CRM Salesforce Integrado', 'INTERMEDIÁRIO', 'Gestão de relacionamento', 35000, 28000),
('TOT-BI-001', 'Business Intelligence', 'INTERMEDIÁRIO', 'Análises e relatórios', 30000, 24000),

-- AVANÇADO
('TOT-AI-001', 'Carol Intelligence', 'AVANÇADO', 'Inteligência artificial empresarial', 80000, 65000),
('TOT-CLOUD-001', 'Protheus Cloud Enterprise', 'AVANÇADO', 'ERP em nuvem completo', 75000, 60000),
('TOT-FLUIG-001', 'Fluig Digital Platform', 'AVANÇADO', 'Plataforma de transformação digital', 60000, 48000),

-- ESPECIALIZADO
('TOT-SAUDE-001', 'Sistema Hospitalar', 'ESPECIALIZADO', 'Gestão hospitalar completa', 120000, 95000),
('TOT-EDUC-001', 'Gestão Educacional', 'ESPECIALIZADO', 'Sistema para instituições de ensino', 100000, 80000),
('TOT-IND-001', 'MES Manufacturing', 'ESPECIALIZADO', 'Execução de manufatura', 150000, 120000)
ON CONFLICT (sku) DO NOTHING;

-- Sample pricing rules with names
INSERT INTO public.pricing_rules (name, rule_type, conditions, discount_percentage, priority) VALUES
('Desconto Microempresa', 'company_size', '{"size": "MICRO"}', 15, 100),
('Desconto Pequena Empresa', 'company_size', '{"size": "PEQUENO"}', 10, 90),
('Desconto Média Empresa', 'company_size', '{"size": "MÉDIO"}', 5, 80),
('Desconto Grande Empresa', 'company_size', '{"size": "GRANDE"}', 0, 70),
('Desconto Tecnologia', 'sector', '{"sectors": ["tecnologia", "software"]}', 8, 60),
('Desconto Saúde/Educação', 'sector', '{"sectors": ["saúde", "educação"]}', 12, 50),
('Desconto Varejo', 'sector', '{"sectors": ["varejo", "comércio"]}', 5, 40)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION: 20251025151357_1b24d8ef-9f65-4c82-a30e-8bdcfb4f6dbe.sql
-- ============================================================================

-- Apply search_path security fix to catalog functions (no IF EXISTS on ALTER FUNCTION)

ALTER FUNCTION public.update_product_catalog_updated_at() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_pricing_rules_updated_at() SET search_path = 'public', 'pg_temp';

-- ============================================================================
-- MIGRATION: 20251025181434_fdba0ff4-6ea2-4c2e-a5bf-225c868ac40f.sql
-- ============================================================================

-- Create company_enrichment table with RLS and triggers
CREATE TABLE IF NOT EXISTS public.company_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_enrichment UNIQUE (company_id, source)
);

-- Enable RLS
ALTER TABLE public.company_enrichment ENABLE ROW LEVEL SECURITY;

-- Policies (aligned with existing project pattern)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_enrichment' AND policyname = 'Authenticated users can insert company_enrichment'
  ) THEN
    CREATE POLICY "Authenticated users can insert company_enrichment"
    ON public.company_enrichment
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_enrichment' AND policyname = 'Authenticated users can read company_enrichment'
  ) THEN
    CREATE POLICY "Authenticated users can read company_enrichment"
    ON public.company_enrichment
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_enrichment' AND policyname = 'Authenticated users can update company_enrichment'
  ) THEN
    CREATE POLICY "Authenticated users can update company_enrichment"
    ON public.company_enrichment
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_enrichment_updated_at'
  ) THEN
    CREATE TRIGGER update_company_enrichment_updated_at
    BEFORE UPDATE ON public.company_enrichment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Helpful index on source for analytics
CREATE INDEX IF NOT EXISTS idx_company_enrichment_source ON public.company_enrichment(source);
CREATE INDEX IF NOT EXISTS idx_company_enrichment_company ON public.company_enrichment(company_id);

-- ============================================================================
-- MIGRATION: 20251025185103_606063ae-f48c-4ce3-980d-bb0db07fae16.sql
-- ============================================================================

-- Adicionar coluna de status do CNPJ
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cnpj_status TEXT 
CHECK (cnpj_status IN ('ativo', 'inativo', 'inexistente', 'pendente'))
DEFAULT 'pendente';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_cnpj_status ON companies(cnpj_status);

-- Comentário explicativo
COMMENT ON COLUMN companies.cnpj_status IS 'Status de validação do CNPJ: ativo (empresa ativa na RF), inativo (empresa suspensa/baixada), inexistente (CNPJ não encontrado na RF), pendente (ainda não validado)';

-- Atualizar empresas existentes para 'pendente' (serão validadas no próximo enriquecimento)
UPDATE companies 
SET cnpj_status = 'pendente' 
WHERE cnpj_status IS NULL;

-- ============================================================================
-- MIGRATION: 20251025235936_b5209d54-046e-400b-9070-b4fd3e6e9cae.sql
-- ============================================================================

-- Fix trigger auto_create_deal_after_enrichment - remove colunas inexistentes
CREATE OR REPLACE FUNCTION public.auto_create_deal_after_enrichment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal_exists BOOLEAN;
  v_priority TEXT;
  v_value NUMERIC;
BEGIN
  -- Verificar se já existe deal para essa empresa
  SELECT EXISTS(
    SELECT 1 FROM sdr_deals 
    WHERE company_id = NEW.id 
    AND status IN ('open', 'won')
  ) INTO v_deal_exists;
  
  -- Se já existe deal ativo, não criar outro
  IF v_deal_exists THEN
    RETURN NEW;
  END IF;
  
  -- Se empresa foi enriquecida (tem maturity score), criar deal automaticamente
  IF NEW.digital_maturity_score IS NOT NULL AND OLD.digital_maturity_score IS NULL THEN
    
    -- Calcular prioridade baseada no score
    v_priority := CASE 
      WHEN NEW.digital_maturity_score >= 70 THEN 'high'
      WHEN NEW.digital_maturity_score >= 50 THEN 'medium'
      ELSE 'low'
    END;
    
    -- Estimar valor baseado em tamanho da empresa
    v_value := CASE 
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 500 THEN 100000
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 100 THEN 50000
      ELSE 25000
    END;
    
    -- Criar deal automaticamente (SEM next_action e next_action_date que não existem)
    INSERT INTO sdr_deals (
      company_id,
      title,
      stage,
      priority,
      status,
      value,
      probability,
      source,
      created_at
    ) VALUES (
      NEW.id,
      'Prospecção - ' || NEW.name,
      'discovery',
      v_priority,
      'open',
      v_value,
      30, -- Probabilidade inicial
      'enrichment_auto',
      NOW()
    );
    
    -- Log da atividade
    INSERT INTO sdr_deal_activities (
      deal_id,
      activity_type,
      description,
      created_by
    )
    SELECT 
      id,
      'deal_created',
      'Deal criado automaticamente após enriquecimento 360°',
      auth.uid()
    FROM sdr_deals
    WHERE company_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- MIGRATION: 20251026000651_e46e0929-031a-48d5-b9fe-7251acbdc1bf.sql
-- ============================================================================

-- 1) Tabela de feature flags (kill switch)
CREATE TABLE IF NOT EXISTS public.app_features (
  feature TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_features ENABLE ROW LEVEL SECURITY;

-- RLS: leitura para usuários autenticados
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='app_features' AND policyname='authenticated_can_read_app_features'
  ) THEN
    CREATE POLICY authenticated_can_read_app_features
    ON public.app_features
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- RLS: service role pode gerenciar (insert/update/delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='app_features' AND policyname='service_can_manage_app_features'
  ) THEN
    CREATE POLICY service_can_manage_app_features
    ON public.app_features
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Inserir flag auto_deal desativada por padrão
INSERT INTO public.app_features (feature, enabled)
VALUES ('auto_deal', false)
ON CONFLICT (feature) DO NOTHING;

-- 2) Atualizar função do trigger para respeitar kill switch
CREATE OR REPLACE FUNCTION public.auto_create_deal_after_enrichment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal_exists BOOLEAN;
  v_priority TEXT;
  v_value NUMERIC;
  v_auto_deal_enabled BOOLEAN;
BEGIN
  -- Kill switch: se auto_deal estiver desativado, não cria deal
  SELECT enabled INTO v_auto_deal_enabled
  FROM public.app_features
  WHERE feature = 'auto_deal';
  
  IF COALESCE(v_auto_deal_enabled, false) = false THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe deal para essa empresa
  SELECT EXISTS(
    SELECT 1 FROM public.sdr_deals 
    WHERE company_id = NEW.id 
    AND status IN ('open', 'won')
  ) INTO v_deal_exists;
  
  -- Se já existe deal ativo, não criar outro
  IF v_deal_exists THEN
    RETURN NEW;
  END IF;
  
  -- Se empresa foi enriquecida (tem maturity score), criar deal automaticamente
  IF NEW.digital_maturity_score IS NOT NULL AND OLD.digital_maturity_score IS NULL THEN
    
    -- Calcular prioridade baseada no score
    v_priority := CASE 
      WHEN NEW.digital_maturity_score >= 70 THEN 'high'
      WHEN NEW.digital_maturity_score >= 50 THEN 'medium'
      ELSE 'low'
    END;
    
    -- Estimar valor baseado em tamanho da empresa
    v_value := CASE 
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 500 THEN 100000
      WHEN NEW.employees IS NOT NULL AND NEW.employees > 100 THEN 50000
      ELSE 25000
    END;
    
    -- Criar deal automaticamente (sem colunas inexistentes)
    INSERT INTO public.sdr_deals (
      company_id,
      title,
      stage,
      priority,
      status,
      value,
      probability,
      source,
      created_at
    ) VALUES (
      NEW.id,
      'Prospecção - ' || NEW.name,
      'discovery',
      v_priority,
      'open',
      v_value,
      30,
      'enrichment_auto',
      NOW()
    );
    
    -- Log da atividade
    INSERT INTO public.sdr_deal_activities (
      deal_id,
      activity_type,
      description,
      created_by
    )
    SELECT 
      id,
      'deal_created',
      'Deal criado automaticamente após enriquecimento 360°',
      auth.uid()
    FROM public.sdr_deals
    WHERE company_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- MIGRATION: 20251026003031_e606d30d-7bb7-414d-add1-441bd6bcd495.sql
-- ============================================================================

-- Add updated_at to digital_presence and trigger to keep it current
DO $$ BEGIN
  -- Add column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'digital_presence'
      AND column_name  = 'updated_at'
  ) THEN
    ALTER TABLE public.digital_presence
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create or replace trigger to auto-update updated_at on changes
DO $$ BEGIN
  -- Drop existing trigger if any (safe if not exists)
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_digital_presence_updated_at'
  ) THEN
    DROP TRIGGER update_digital_presence_updated_at ON public.digital_presence;
  END IF;

  -- Create trigger using existing helper function
  CREATE TRIGGER update_digital_presence_updated_at
  BEFORE UPDATE ON public.digital_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- ============================================================================
-- MIGRATION: 20251026004832_fb897c73-ec64-4602-bb6e-5b4acc765fb5.sql
-- ============================================================================

-- Adicionar campo phone em decision_makers para salvar telefones do Apollo
ALTER TABLE public.decision_makers
ADD COLUMN IF NOT EXISTS phone text;

-- ============================================================================
-- MIGRATION: 20251026012553_460875cb-e758-4069-9870-e0ba5a23a156.sql
-- ============================================================================

-- Adicionar coluna source à tabela decision_makers
ALTER TABLE public.decision_makers 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.decision_makers.source IS 'Origem do decisor: apollo, phantombuster, manual, etc.';

-- ============================================================================
-- MIGRATION: 20251026170748_7fbc709e-5c89-4899-9674-7da13ffe24e7.sql
-- ============================================================================

-- Create table for per-module progressive saves of Account Strategy work
create table if not exists public.account_strategy_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid null references public.companies(id) on delete cascade,
  account_strategy_id uuid null references public.account_strategies(id) on delete cascade,
  module text not null check (module in ('roi','cpq','scenarios','proposals','competitive','value','consultoria_olv')),
  title text null,
  data jsonb not null default '{}'::jsonb,
  is_draft boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_strategy_or_company check (
    account_strategy_id is not null or company_id is not null
  )
);

-- Unique constraints per module per user per context
create unique index if not exists account_strategy_modules_unique_strategy
  on public.account_strategy_modules (user_id, account_strategy_id, module)
  where account_strategy_id is not null;

create unique index if not exists account_strategy_modules_unique_company
  on public.account_strategy_modules (user_id, company_id, module)
  where account_strategy_id is null and company_id is not null;

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger account_strategy_modules_set_updated_at
before update on public.account_strategy_modules
for each row execute function public.set_updated_at();

-- Enable RLS and policies
alter table public.account_strategy_modules enable row level security;

-- Basic owner-based policies
create policy "Users can read their module drafts" on public.account_strategy_modules
for select using (auth.uid() = user_id);

create policy "Users can insert their module drafts" on public.account_strategy_modules
for insert with check (auth.uid() = user_id);

create policy "Users can update their module drafts" on public.account_strategy_modules
for update using (auth.uid() = user_id);

create policy "Users can delete their module drafts" on public.account_strategy_modules
for delete using (auth.uid() = user_id);


-- ============================================================================
-- MIGRATION: 20251026180851_8083d370-6a9c-4d38-8d37-316929962136.sql
-- ============================================================================

-- Criar tabela para salvar drafts de módulos da estratégia de conta
CREATE TABLE IF NOT EXISTS public.account_strategy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  account_strategy_id UUID REFERENCES public.account_strategies(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('roi', 'cpq', 'scenarios', 'proposals', 'competitive', 'value', 'consultoria_olv')),
  title TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_draft BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_user ON public.account_strategy_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_company ON public.account_strategy_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_strategy ON public.account_strategy_modules(account_strategy_id);
CREATE INDEX IF NOT EXISTS idx_account_strategy_modules_module ON public.account_strategy_modules(module);

-- RLS policies
ALTER TABLE public.account_strategy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar seus próprios módulos"
  ON public.account_strategy_modules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios módulos"
  ON public.account_strategy_modules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios módulos"
  ON public.account_strategy_modules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios módulos"
  ON public.account_strategy_modules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_account_strategy_modules_updated_at
  BEFORE UPDATE ON public.account_strategy_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251026211630_7872fe64-199b-4f19-a93d-3478204ab8d9.sql
-- ============================================================================

-- Add TOTVS detection and intent signals tables

-- Add TOTVS detection fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS totvs_detection_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS totvs_detection_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS totvs_last_checked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disqualification_reason TEXT;

-- Create intent_signals table for tracking buying signals
CREATE TABLE IF NOT EXISTS public.intent_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- 'job_posting', 'news', 'growth', 'linkedin_activity', 'search_activity'
  signal_source TEXT NOT NULL, -- 'linkedin', 'google_news', 'econodata', 'apollo', 'serper'
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  signal_url TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Some signals expire (e.g., job postings after 90 days)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_intent_signals_company_id ON public.intent_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_detected_at ON public.intent_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_confidence ON public.intent_signals(confidence_score DESC);

-- Enable RLS
ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intent_signals
CREATE POLICY "Users can view intent signals for their companies"
ON public.intent_signals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = intent_signals.company_id
  )
);

CREATE POLICY "Users can insert intent signals"
ON public.intent_signals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = intent_signals.company_id
  )
);

-- Create function to calculate overall intent score for a company
CREATE OR REPLACE FUNCTION public.calculate_intent_score(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  signal_count INTEGER := 0;
BEGIN
  -- Calculate weighted average of recent signals (last 90 days)
  SELECT 
    COALESCE(SUM(confidence_score), 0),
    COUNT(*)
  INTO total_score, signal_count
  FROM public.intent_signals
  WHERE company_id = company_uuid
    AND detected_at > now() - interval '90 days'
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Return average score (max 100)
  IF signal_count > 0 THEN
    RETURN LEAST(total_score / signal_count, 100);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get hot leads (high intent score, not using TOTVS)
CREATE OR REPLACE FUNCTION public.get_hot_leads(min_intent_score INTEGER DEFAULT 70)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  intent_score INTEGER,
  totvs_score INTEGER,
  signal_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS company_id,
    c.name AS company_name,
    public.calculate_intent_score(c.id) AS intent_score,
    COALESCE(c.totvs_detection_score, 0) AS totvs_score,
    COUNT(i.id) AS signal_count
  FROM public.companies c
  LEFT JOIN public.intent_signals i ON i.company_id = c.id
    AND i.detected_at > now() - interval '90 days'
    AND (i.expires_at IS NULL OR i.expires_at > now())
  WHERE c.is_disqualified = false
    AND COALESCE(c.totvs_detection_score, 0) < 70
  GROUP BY c.id, c.name
  HAVING public.calculate_intent_score(c.id) >= min_intent_score
  ORDER BY intent_score DESC, signal_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the scoring system
COMMENT ON COLUMN public.companies.totvs_detection_score IS 'Multi-source TOTVS detection score (0-100). Sources: LinkedIn Jobs (40pts), Google Search (30pts), Website Scraping (20pts), LinkedIn Profiles (10pts). Auto-disqualify if >= 70.';
COMMENT ON TABLE public.intent_signals IS 'Buying intent signals from multiple sources. Used to identify hot leads for proactive outreach.';
COMMENT ON FUNCTION public.calculate_intent_score IS 'Calculates weighted average intent score from signals in last 90 days. Max score: 100.';
COMMENT ON FUNCTION public.get_hot_leads IS 'Returns companies with high intent score (default >=70) that do not use TOTVS (score <70).';

-- ============================================================================
-- MIGRATION: 20251026222617_9018d39c-016f-4c9d-bd2d-3d9a97070e3e.sql
-- ============================================================================

-- Tabela para tracking de empresas monitoradas
CREATE TABLE IF NOT EXISTS public.company_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_totvs_check_at TIMESTAMPTZ,
  last_intent_check_at TIMESTAMPTZ,
  last_totvs_score INTEGER,
  last_intent_score INTEGER,
  check_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_company_monitoring_active ON public.company_monitoring(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_company_monitoring_company ON public.company_monitoring(company_id);
CREATE INDEX IF NOT EXISTS idx_company_monitoring_checks ON public.company_monitoring(last_totvs_check_at, last_intent_check_at) WHERE is_active = true;

-- RLS para company_monitoring
ALTER TABLE public.company_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monitoring"
  ON public.company_monitoring FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitoring"
  ON public.company_monitoring FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring"
  ON public.company_monitoring FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitoring"
  ON public.company_monitoring FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_company_monitoring_updated_at
  BEFORE UPDATE ON public.company_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar extensões necessárias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função auxiliar para buscar empresas que precisam de verificação
CREATE OR REPLACE FUNCTION public.get_companies_for_monitoring_check()
RETURNS TABLE (
  monitoring_id UUID,
  company_id UUID,
  company_name TEXT,
  company_domain TEXT,
  company_cnpj TEXT,
  user_id UUID,
  last_totvs_score INTEGER,
  last_intent_score INTEGER,
  hours_since_last_check INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id AS monitoring_id,
    c.id AS company_id,
    c.name AS company_name,
    c.domain AS company_domain,
    c.cnpj AS company_cnpj,
    cm.user_id,
    cm.last_totvs_score,
    cm.last_intent_score,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(
      LEAST(cm.last_totvs_check_at, cm.last_intent_check_at),
      NOW() - INTERVAL '999 days'
    )))::INTEGER / 3600 AS hours_since_last_check
  FROM public.company_monitoring cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.is_active = true
    AND (
      cm.last_totvs_check_at IS NULL 
      OR cm.last_intent_check_at IS NULL
      OR (NOW() - LEAST(cm.last_totvs_check_at, cm.last_intent_check_at)) >= (cm.check_frequency_hours || ' hours')::INTERVAL
    )
  ORDER BY 
    COALESCE(cm.last_totvs_check_at, '1970-01-01'::TIMESTAMPTZ) ASC,
    COALESCE(cm.last_intent_check_at, '1970-01-01'::TIMESTAMPTZ) ASC
  LIMIT 50;
END;
$$;

-- Agendar cron job para rodar todo dia às 2h da manhã (horário de Brasília UTC-3 = 5h UTC)
-- Nota: O cron job chama a edge function que processa as empresas
SELECT cron.schedule(
  'company-monitoring-daily-check',
  '0 5 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/company-monitoring-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:=json_build_object('scheduled_run', true, 'timestamp', NOW()::text)::jsonb
    ) as request_id;
  $$
);

-- ============================================================================
-- MIGRATION: 20251026225238_050d5a61-1602-4c38-9501-fbf293ba8645.sql
-- ============================================================================

-- Otimizar função de monitoramento para 5000 empresas
-- Drop da função antiga e criação da nova com parâmetro batch_limit

DROP FUNCTION IF EXISTS public.get_companies_for_monitoring_check();

CREATE OR REPLACE FUNCTION public.get_companies_for_monitoring_check(batch_limit INTEGER DEFAULT 500)
RETURNS TABLE(
  monitoring_id uuid,
  company_id uuid,
  company_name text,
  company_domain text,
  company_cnpj text,
  user_id uuid,
  last_totvs_score integer,
  last_intent_score integer,
  hours_since_last_check integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id AS monitoring_id,
    c.id AS company_id,
    c.name AS company_name,
    c.domain AS company_domain,
    c.cnpj AS company_cnpj,
    cm.user_id,
    cm.last_totvs_score,
    cm.last_intent_score,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(
      LEAST(cm.last_totvs_check_at, cm.last_intent_check_at),
      NOW() - INTERVAL '999 days'
    )))::INTEGER / 3600 AS hours_since_last_check
  FROM public.company_monitoring cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.is_active = true
    AND (
      cm.last_totvs_check_at IS NULL 
      OR cm.last_intent_check_at IS NULL
      OR (NOW() - LEAST(cm.last_totvs_check_at, cm.last_intent_check_at)) >= (cm.check_frequency_hours || ' hours')::INTERVAL
    )
  ORDER BY 
    CASE WHEN cm.last_totvs_check_at IS NULL OR cm.last_intent_check_at IS NULL THEN 0 ELSE 1 END,
    COALESCE(cm.last_intent_score, 0) DESC,
    COALESCE(cm.last_totvs_check_at, '1970-01-01'::TIMESTAMPTZ) ASC,
    COALESCE(cm.last_intent_check_at, '1970-01-01'::TIMESTAMPTZ) ASC
  LIMIT batch_limit;
END;
$$;

-- Índices para performance com 5000+ empresas
CREATE INDEX IF NOT EXISTS idx_company_monitoring_active_priority 
ON public.company_monitoring(is_active, last_intent_score DESC, last_totvs_check_at ASC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_monitoring_check_times 
ON public.company_monitoring(last_totvs_check_at, last_intent_check_at) 
WHERE is_active = true;

-- ============================================================================
-- MIGRATION: 20251026225430_be058473-7698-43ec-a67d-feb20bd43fbe.sql
-- ============================================================================

-- Remover versão antiga da função sem parâmetros
DROP FUNCTION IF EXISTS public.get_companies_for_monitoring_check();

-- Criar nova versão otimizada para 5000 empresas com parâmetro batch_limit
CREATE OR REPLACE FUNCTION public.get_companies_for_monitoring_check(batch_limit INTEGER DEFAULT 500)
RETURNS TABLE(
  monitoring_id uuid,
  company_id uuid,
  company_name text,
  company_domain text,
  company_cnpj text,
  user_id uuid,
  last_totvs_score integer,
  last_intent_score integer,
  hours_since_last_check integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id AS monitoring_id,
    c.id AS company_id,
    c.name AS company_name,
    c.domain AS company_domain,
    c.cnpj AS company_cnpj,
    cm.user_id,
    cm.last_totvs_score,
    cm.last_intent_score,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(
      LEAST(cm.last_totvs_check_at, cm.last_intent_check_at),
      NOW() - INTERVAL '999 days'
    )))::INTEGER / 3600 AS hours_since_last_check
  FROM public.company_monitoring cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.is_active = true
    AND (
      -- Nunca verificadas (prioridade máxima)
      cm.last_totvs_check_at IS NULL 
      OR cm.last_intent_check_at IS NULL
      -- Ou já passou o tempo da frequência configurada
      OR (NOW() - LEAST(cm.last_totvs_check_at, cm.last_intent_check_at)) >= (cm.check_frequency_hours || ' hours')::INTERVAL
    )
  ORDER BY 
    -- Prioridade 1: Empresas nunca verificadas
    CASE WHEN cm.last_totvs_check_at IS NULL OR cm.last_intent_check_at IS NULL THEN 0 ELSE 1 END,
    -- Prioridade 2: Empresas com alto score de intenção (hot leads)
    COALESCE(cm.last_intent_score, 0) DESC,
    -- Prioridade 3: Tempo desde última verificação (mais antigas primeiro)
    COALESCE(cm.last_totvs_check_at, '1970-01-01'::TIMESTAMPTZ) ASC,
    COALESCE(cm.last_intent_check_at, '1970-01-01'::TIMESTAMPTZ) ASC
  LIMIT batch_limit;
END;
$$;

-- Adicionar índices para performance com 5000+ empresas
CREATE INDEX IF NOT EXISTS idx_company_monitoring_active_priority 
ON public.company_monitoring(is_active, last_intent_score DESC, last_totvs_check_at ASC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_monitoring_check_times 
ON public.company_monitoring(last_totvs_check_at, last_intent_check_at) 
WHERE is_active = true;

COMMENT ON FUNCTION public.get_companies_for_monitoring_check IS 'Retorna empresas para verificação com priorização inteligente: 1) Nunca verificadas, 2) Alto score de intenção, 3) Mais antigas. Suporta até 5000+ empresas com performance otimizada.';

-- ============================================================================
-- MIGRATION: 20251027020145_8ea307e9-196b-48d8-9007-801ffcc88785.sql
-- ============================================================================

-- Tabela de Battle Cards específicos por empresa
CREATE TABLE IF NOT EXISTS public.company_battle_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Competidor detectado
  competitor_name TEXT NOT NULL,
  competitor_type TEXT CHECK (competitor_type IN ('erp', 'legacy', 'spreadsheet', 'other')),
  detection_confidence INTEGER CHECK (detection_confidence >= 0 AND detection_confidence <= 100),
  
  -- Estratégia e insights
  win_strategy TEXT NOT NULL,
  objection_handling JSONB DEFAULT '[]'::jsonb,
  proof_points JSONB DEFAULT '[]'::jsonb,
  totvs_advantages TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Contexto usado na geração
  context_snapshot JSONB,
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_battle_cards_company ON public.company_battle_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_company_battle_cards_generated ON public.company_battle_cards(generated_at DESC);

-- RLS
ALTER TABLE public.company_battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage company_battle_cards"
  ON public.company_battle_cards FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_company_battle_cards_updated_at
  BEFORE UPDATE ON public.company_battle_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251027035500_a52f7be5-11b3-485c-938d-06683381547a.sql
-- ============================================================================

-- FASE 1: OTIMIZAÇÃO SDR - ESSENCIAL
-- Feature flags + índices básicos + função auxiliar

-- 1. ATIVAR FEATURE FLAGS
INSERT INTO public.app_features (feature, enabled, updated_at)
VALUES 
  ('auto_deal', true, now()),
  ('sdr_sequences_auto_run', true, now()),
  ('sdr_workspace_minis', true, now()),
  ('sdr_ai_forecasting', true, now())
ON CONFLICT (feature) 
DO UPDATE SET enabled = true, updated_at = now();

-- 2. ÍNDICES BÁSICOS (apenas colunas garantidas)
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_created_at ON public.sdr_deals(created_at DESC);

-- 3. FUNÇÃO AUXILIAR
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER AS $func$
DECLARE
  v_score INTEGER := 70;
  v_deal RECORD;
BEGIN
  SELECT * INTO v_deal FROM public.sdr_deals WHERE id = deal_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_deal.probability > 70 AND v_deal.value > 100000 THEN v_score := v_score + 20; END IF;
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION: 20251027035723_0f67d23c-5baa-4a9b-85b1-836bfc78675e.sql
-- ============================================================================

-- ========================================
-- FASE 1: CORREÇÃO CRÍTICA SDR (Schema Correto)
-- ========================================

-- PARTE 1: Migração de dados
INSERT INTO public.sdr_deals (
  id, company_id, contact_id, assigned_to, title, stage, value, probability,
  status, priority, source, description, expected_close_date, lost_reason,
  won_date, last_activity_at, created_at, updated_at
)
SELECT 
  o.id, o.company_id, o.contact_id, o.assigned_to, o.title, o.stage, 
  COALESCE(o.value, 0), COALESCE(o.probability, 50),
  'open' as status,
  'medium' as priority,
  'migration' as source,
  COALESCE(o.next_action, o.metadata::text) as description,
  o.expected_close_date, o.lost_reason, o.won_date,
  o.updated_at as last_activity_at,
  o.created_at, o.updated_at
FROM public.sdr_opportunities o
WHERE NOT EXISTS (SELECT 1 FROM public.sdr_deals d WHERE d.id = o.id)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.sdr_opportunities IS 'DEPRECATED - Use sdr_deals';

-- PARTE 2: Feature flags
INSERT INTO public.app_features (feature, enabled, updated_at)
VALUES 
  ('auto_deal', true, now()),
  ('sdr_sequences_auto_run', true, now()),
  ('sdr_workspace_minis', true, now())
ON CONFLICT (feature) DO UPDATE SET enabled = true, updated_at = now();

-- PARTE 3: Índices
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_automation ON public.sdr_deals(status, last_activity_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_sdr_sequence_runs_status ON public.sdr_sequence_runs(status);

-- PARTE 4: Função health score
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 70;
  v_days_stale INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(last_activity_at, created_at)))
  INTO v_days_stale FROM public.sdr_deals WHERE id = deal_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_days_stale > 14 THEN RETURN 40;
  ELSIF v_days_stale > 7 THEN RETURN 55; END IF;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION: 20251027035748_8cf56c9a-4f92-4500-bd69-5094d0acb9c6.sql
-- ============================================================================

-- ========================================
-- FASE 1: CORREÇÃO CRÍTICA SDR (Schema Correto)
-- ========================================

-- PARTE 1: Migração de dados
INSERT INTO public.sdr_deals (
  id, company_id, contact_id, assigned_to, title, stage, value, probability,
  status, priority, source, description, expected_close_date, lost_reason,
  won_date, last_activity_at, created_at, updated_at
)
SELECT 
  o.id, o.company_id, o.contact_id, o.assigned_to, o.title, o.stage, 
  COALESCE(o.value, 0), COALESCE(o.probability, 50),
  'open' as status,
  'medium' as priority,
  'migration' as source,
  COALESCE(o.next_action, o.metadata::text) as description,
  o.expected_close_date, o.lost_reason, o.won_date,
  o.updated_at as last_activity_at,
  o.created_at, o.updated_at
FROM public.sdr_opportunities o
WHERE NOT EXISTS (SELECT 1 FROM public.sdr_deals d WHERE d.id = o.id)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.sdr_opportunities IS 'DEPRECATED - Use sdr_deals';

-- PARTE 2: Feature flags
INSERT INTO public.app_features (feature, enabled, updated_at)
VALUES 
  ('auto_deal', true, now()),
  ('sdr_sequences_auto_run', true, now()),
  ('sdr_workspace_minis', true, now())
ON CONFLICT (feature) DO UPDATE SET enabled = true, updated_at = now();

-- PARTE 3: Índices
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_automation ON public.sdr_deals(status, last_activity_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_sdr_sequence_runs_status ON public.sdr_sequence_runs(status);

-- PARTE 4: Função health score
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 70;
  v_days_stale INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(last_activity_at, created_at)))
  INTO v_days_stale FROM public.sdr_deals WHERE id = deal_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_days_stale > 14 THEN RETURN 40;
  ELSIF v_days_stale > 7 THEN RETURN 55; END IF;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION: 20251027035813_9bf4a031-8967-4d20-9fd4-883bef94baef.sql
-- ============================================================================

-- Correção de segurança: adicionar search_path à função criada
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_score INTEGER := 70;
  v_days_stale INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(last_activity_at, created_at)))
  INTO v_days_stale FROM public.sdr_deals WHERE id = deal_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_days_stale > 14 THEN RETURN 40;
  ELSIF v_days_stale > 7 THEN RETURN 55; END IF;
  RETURN v_score;
END;
$$;

-- ============================================================================
-- MIGRATION: 20251027040009_316d874e-b849-4527-92c1-a0bee30c8c35.sql
-- ============================================================================

-- Correção de segurança: search_path nas funções
CREATE OR REPLACE FUNCTION public.calculate_deal_health_score(deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 70;
  v_days_stale INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(last_activity_at, created_at)))
  INTO v_days_stale FROM public.sdr_deals WHERE id = deal_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_days_stale > 14 THEN RETURN 40;
  ELSIF v_days_stale > 7 THEN RETURN 55; END IF;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp';

-- ============================================================================
-- MIGRATION: 20251027041404_eb293062-19ce-491e-b5a0-4729442ed512.sql
-- ============================================================================

-- Create sdr_workflows table for custom workflow automation
CREATE TABLE IF NOT EXISTS public.sdr_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sdr_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own workflows
CREATE POLICY "Users can view own workflows"
  ON public.sdr_workflows
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own workflows"
  ON public.sdr_workflows
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own workflows"
  ON public.sdr_workflows
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own workflows"
  ON public.sdr_workflows
  FOR DELETE
  USING (auth.uid() = created_by);

-- Indexes for performance
CREATE INDEX idx_sdr_workflows_created_by ON public.sdr_workflows(created_by);
CREATE INDEX idx_sdr_workflows_trigger_type ON public.sdr_workflows(trigger_type);
CREATE INDEX idx_sdr_workflows_is_active ON public.sdr_workflows(is_active);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_sdr_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sdr_workflows_updated_at
  BEFORE UPDATE ON public.sdr_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sdr_workflows_updated_at();

-- ============================================================================
-- MIGRATION: 20251027041450_dc7cfe94-2340-491f-abb1-a466b21e1d30.sql
-- ============================================================================

-- Fix search_path security warning for update_sdr_workflows_updated_at function
CREATE OR REPLACE FUNCTION public.update_sdr_workflows_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- MIGRATION: 20251027041934_0fe946fa-acb2-4daf-a89c-85f99d624e43.sql
-- ============================================================================

-- ============================================
-- LEAD SCORING AUTOMÁTICO - Sistema Completo
-- ============================================

-- 1. Adicionar campo lead_score nas empresas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
ADD COLUMN IF NOT EXISTS lead_score_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Adicionar campo lead_score nos deals
ALTER TABLE public.sdr_deals 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_lead_score ON public.companies(lead_score DESC) WHERE lead_score > 0;
CREATE INDEX IF NOT EXISTS idx_sdr_deals_lead_score ON public.sdr_deals(lead_score DESC) WHERE lead_score > 0;

-- 4. Função para calcular engajamento de uma empresa
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activities_count INTEGER;
  v_touchpoints_count INTEGER;
  v_conversations_count INTEGER;
  v_recent_activity_days INTEGER;
  v_score INTEGER := 0;
BEGIN
  -- Contar atividades dos últimos 90 dias
  SELECT COUNT(*) INTO v_activities_count
  FROM public.activities
  WHERE company_id = p_company_id
    AND activity_date > now() - interval '90 days';
  
  -- Contar touchpoints dos últimos 90 dias
  SELECT COUNT(*) INTO v_touchpoints_count
  FROM public.account_touchpoints
  WHERE company_id = p_company_id
    AND completed_at > now() - interval '90 days';
  
  -- Contar conversas ativas
  SELECT COUNT(*) INTO v_conversations_count
  FROM public.conversations
  WHERE company_id = p_company_id
    AND status IN ('open', 'pending')
    AND updated_at > now() - interval '30 days';
  
  -- Dias desde última atividade
  SELECT EXTRACT(DAY FROM (now() - MAX(GREATEST(
    COALESCE(a.activity_date, '1970-01-01'::timestamptz),
    COALESCE(t.completed_at, '1970-01-01'::timestamptz),
    COALESCE(c.updated_at, '1970-01-01'::timestamptz)
  ))))::INTEGER
  INTO v_recent_activity_days
  FROM public.companies comp
  LEFT JOIN public.activities a ON a.company_id = comp.id
  LEFT JOIN public.account_touchpoints t ON t.company_id = comp.id
  LEFT JOIN public.conversations c ON c.company_id = comp.id
  WHERE comp.id = p_company_id;
  
  -- Calcular score (0-100)
  v_score := LEAST(100, 
    (v_activities_count * 5) + 
    (v_touchpoints_count * 8) + 
    (v_conversations_count * 15) +
    CASE 
      WHEN v_recent_activity_days IS NULL OR v_recent_activity_days > 90 THEN 0
      WHEN v_recent_activity_days <= 7 THEN 30
      WHEN v_recent_activity_days <= 30 THEN 20
      WHEN v_recent_activity_days <= 60 THEN 10
      ELSE 5
    END
  );
  
  RETURN v_score;
END;
$$;

-- 5. Função para calcular score de tamanho/receita
CREATE OR REPLACE FUNCTION public.calculate_size_score(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employees INTEGER;
  v_revenue TEXT;
  v_score INTEGER := 0;
BEGIN
  SELECT employees, revenue INTO v_employees, v_revenue
  FROM public.companies
  WHERE id = p_company_id;
  
  -- Score baseado em número de funcionários (0-60 pontos)
  IF v_employees IS NOT NULL THEN
    v_score := CASE 
      WHEN v_employees >= 1000 THEN 60
      WHEN v_employees >= 500 THEN 50
      WHEN v_employees >= 200 THEN 40
      WHEN v_employees >= 100 THEN 30
      WHEN v_employees >= 50 THEN 20
      ELSE 10
    END;
  END IF;
  
  -- Bonus por receita declarada (0-40 pontos)
  IF v_revenue IS NOT NULL AND v_revenue != '' THEN
    v_score := v_score + CASE 
      WHEN v_revenue ILIKE '%bilhão%' OR v_revenue ILIKE '%billion%' THEN 40
      WHEN v_revenue ILIKE '%milhão%' OR v_revenue ILIKE '%million%' THEN 30
      WHEN v_revenue ILIKE '%mil%' OR v_revenue ILIKE '%thousand%' THEN 20
      ELSE 15
    END;
  END IF;
  
  RETURN LEAST(100, v_score);
END;
$$;

-- 6. FUNÇÃO PRINCIPAL: Calcular Lead Score Completo
CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_company_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_maturity_score INTEGER := 0;
  v_intent_score INTEGER := 0;
  v_totvs_fit_score INTEGER := 0;
  v_engagement_score INTEGER := 0;
  v_size_score INTEGER := 0;
  v_final_score INTEGER;
BEGIN
  -- 1. Maturidade Digital (0-100) - Peso 25%
  SELECT COALESCE(digital_maturity_score::INTEGER, 0)
  INTO v_maturity_score
  FROM public.companies
  WHERE id = p_company_id;
  
  -- 2. Sinais de Intenção (0-100) - Peso 30%
  SELECT COALESCE(public.calculate_intent_score(p_company_id), 0)
  INTO v_intent_score;
  
  -- 3. Fit com TOTVS (0-100) - Peso 20%
  SELECT COALESCE(totvs_detection_score, 0)
  INTO v_totvs_fit_score
  FROM public.companies
  WHERE id = p_company_id;
  
  -- 4. Engajamento (0-100) - Peso 15%
  v_engagement_score := public.calculate_engagement_score(p_company_id);
  
  -- 5. Tamanho/Receita (0-100) - Peso 10%
  v_size_score := public.calculate_size_score(p_company_id);
  
  -- Calcular score final ponderado
  v_final_score := ROUND(
    (v_maturity_score * 0.25) +
    (v_intent_score * 0.30) +
    (v_totvs_fit_score * 0.20) +
    (v_engagement_score * 0.15) +
    (v_size_score * 0.10)
  )::INTEGER;
  
  -- Atualizar score na empresa
  UPDATE public.companies
  SET 
    lead_score = v_final_score,
    lead_score_updated_at = now()
  WHERE id = p_company_id;
  
  -- Atualizar score em deals ativos dessa empresa
  UPDATE public.sdr_deals
  SET lead_score = v_final_score
  WHERE company_id = p_company_id
    AND status = 'open';
  
  RETURN v_final_score;
END;
$$;

-- 7. Trigger: Recalcular score quando empresa for atualizada
CREATE OR REPLACE FUNCTION public.auto_recalculate_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_score INTEGER;
BEGIN
  -- Recalcular apenas se campos relevantes mudaram
  IF (
    NEW.digital_maturity_score IS DISTINCT FROM OLD.digital_maturity_score OR
    NEW.totvs_detection_score IS DISTINCT FROM OLD.totvs_detection_score OR
    NEW.employees IS DISTINCT FROM OLD.employees OR
    NEW.revenue IS DISTINCT FROM OLD.revenue
  ) THEN
    v_new_score := public.calculate_lead_score(NEW.id);
    
    -- Se virou hot lead (score > 75), criar notificação
    IF v_new_score >= 75 AND COALESCE(OLD.lead_score, 0) < 75 THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata,
        created_at
      )
      SELECT 
        auth.uid(),
        'hot_lead',
        '🔥 Hot Lead Detectado!',
        'A empresa ' || NEW.name || ' atingiu score de ' || v_new_score || ' pontos.',
        jsonb_build_object(
          'company_id', NEW.id,
          'company_name', NEW.name,
          'lead_score', v_new_score,
          'previous_score', COALESCE(OLD.lead_score, 0)
        ),
        now()
      WHERE auth.uid() IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_recalculate_lead_score
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_recalculate_lead_score();

-- 8. Trigger: Recalcular quando houver nova atividade
CREATE OR REPLACE FUNCTION public.recalc_score_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_lead_score(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_recalc_score_on_activity
  AFTER INSERT OR UPDATE ON public.activities
  FOR EACH ROW
  WHEN (NEW.company_id IS NOT NULL)
  EXECUTE FUNCTION public.recalc_score_on_activity();

CREATE TRIGGER trigger_recalc_score_on_touchpoint
  AFTER INSERT OR UPDATE ON public.account_touchpoints
  FOR EACH ROW
  WHEN (NEW.company_id IS NOT NULL)
  EXECUTE FUNCTION public.recalc_score_on_activity();

-- 9. Trigger: Atualizar prioridade do deal baseado no score
CREATE OR REPLACE FUNCTION public.auto_update_deal_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_score >= 75 THEN
    NEW.priority := 'high';
  ELSIF NEW.lead_score >= 50 THEN
    NEW.priority := 'medium';
  ELSE
    NEW.priority := 'low';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_update_deal_priority
  BEFORE INSERT OR UPDATE OF lead_score ON public.sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_deal_priority();

-- 10. Função utilitária: Recalcular scores de todas empresas (batch)
CREATE OR REPLACE FUNCTION public.recalculate_all_lead_scores(batch_size INTEGER DEFAULT 100)
RETURNS TABLE(
  company_id UUID,
  company_name TEXT,
  old_score INTEGER,
  new_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH companies_to_update AS (
    SELECT 
      c.id,
      c.name,
      COALESCE(c.lead_score, 0) as old_score
    FROM public.companies c
    WHERE c.is_disqualified = false
    ORDER BY c.updated_at DESC
    LIMIT batch_size
  )
  SELECT 
    ctu.id,
    ctu.name,
    ctu.old_score,
    public.calculate_lead_score(ctu.id) as new_score
  FROM companies_to_update ctu;
END;
$$;

-- ============================================================================
-- MIGRATION: 20251027142513_75740447-7bc7-4c1b-952a-5145a53466e9.sql
-- ============================================================================

-- Tabela de controle de uso de APIs premium
CREATE TABLE IF NOT EXISTS public.enrichment_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_enrichment_usage_source ON public.enrichment_usage(source);
CREATE INDEX IF NOT EXISTS idx_enrichment_usage_created_at ON public.enrichment_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_enrichment_usage_company ON public.enrichment_usage(company_id);

-- RLS
ALTER TABLE public.enrichment_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read enrichment_usage"
ON public.enrichment_usage FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage enrichment_usage"
ON public.enrichment_usage FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tabela de normalização de fontes (mapeamento de campos)
CREATE TABLE IF NOT EXISTS public.enrichment_field_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transformation_rule JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_field_mapping_source ON public.enrichment_field_mapping(source_name);
CREATE INDEX IF NOT EXISTS idx_field_mapping_active ON public.enrichment_field_mapping(active);

-- RLS
ALTER TABLE public.enrichment_field_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read field_mapping"
ON public.enrichment_field_mapping FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage field_mapping"
ON public.enrichment_field_mapping FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Inserir mapeamentos padrão para EmpresaQui
INSERT INTO public.enrichment_field_mapping (source_name, source_field, target_field, priority) VALUES
('empresaqui', 'cnpj', 'cnpj', 100),
('empresaqui', 'razao_social', 'name', 100),
('empresaqui', 'nome_fantasia', 'trade_name', 90),
('empresaqui', 'website', 'website', 80),
('empresaqui', 'telefones[0]', 'phone', 85),
('empresaqui', 'emails[0]', 'email', 85),
('empresaqui', 'porte', 'size', 70),
('empresaqui', 'capital_social', 'share_capital', 75),
('empresaqui', 'funcionarios_presumido', 'employees_count', 80),
('empresaqui', 'faturamento_presumido', 'estimated_revenue', 80);

-- Inserir mapeamentos para Apollo
INSERT INTO public.enrichment_field_mapping (source_name, source_field, target_field, priority) VALUES
('apollo', 'name', 'name', 95),
('apollo', 'primary_domain', 'domain', 95),
('apollo', 'website_url', 'website', 90),
('apollo', 'industry', 'industry', 85),
('apollo', 'estimated_num_employees', 'employees_count', 85),
('apollo', 'linkedin_url', 'linkedin_url', 90),
('apollo', 'technologies', 'technologies', 80);

-- Inserir mapeamentos para Econodata
INSERT INTO public.enrichment_field_mapping (source_name, source_field, target_field, priority) VALUES
('econodata', 'cnpj', 'cnpj', 100),
('econodata', 'razao_social', 'name', 95),
('econodata', 'melhor_telefone', 'phone', 95),
('econodata', 'melhor_celular', 'mobile_phone', 95),
('econodata', 'melhor_site', 'website', 95),
('econodata', 'email_validados', 'email', 95),
('econodata', 'tecnologias', 'technologies', 90),
('econodata', 'funcionarios_presumido', 'employees_count', 95),
('econodata', 'faturamento_presumido', 'estimated_revenue', 95);

-- ============================================================================
-- MIGRATION: 20251027154506_61cfa165-dc6b-4cc3-94d4-20efb74e8bab.sql
-- ============================================================================

-- Adicionar campos completos do Apollo na tabela companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS apollo_id text,
ADD COLUMN IF NOT EXISTS market_segments text[],
ADD COLUMN IF NOT EXISTS sic_codes text[],
ADD COLUMN IF NOT EXISTS naics_codes text[],
ADD COLUMN IF NOT EXISTS funding_total numeric,
ADD COLUMN IF NOT EXISTS funding_rounds jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_funding_round_date date,
ADD COLUMN IF NOT EXISTS last_funding_round_amount numeric,
ADD COLUMN IF NOT EXISTS investors jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_postings_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_postings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS buying_intent_score integer,
ADD COLUMN IF NOT EXISTS buying_intent_signals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_visitors_count integer,
ADD COLUMN IF NOT EXISTS website_visitors_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS account_score integer,
ADD COLUMN IF NOT EXISTS apollo_signals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS apollo_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS apollo_last_enriched_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS employee_count_from_apollo integer,
ADD COLUMN IF NOT EXISTS revenue_range_from_apollo text,
ADD COLUMN IF NOT EXISTS phone_numbers text[],
ADD COLUMN IF NOT EXISTS social_urls jsonb DEFAULT '{}'::jsonb;

-- Criar índices para otimização de busca
CREATE INDEX IF NOT EXISTS idx_companies_apollo_id ON companies(apollo_id);
CREATE INDEX IF NOT EXISTS idx_companies_market_segments ON companies USING GIN(market_segments);
CREATE INDEX IF NOT EXISTS idx_companies_sic_codes ON companies USING GIN(sic_codes);
CREATE INDEX IF NOT EXISTS idx_companies_buying_intent_score ON companies(buying_intent_score);
CREATE INDEX IF NOT EXISTS idx_companies_account_score ON companies(account_score);

-- Expandir tabela decision_makers com campos do Apollo People
ALTER TABLE decision_makers
ADD COLUMN IF NOT EXISTS apollo_person_id text,
ADD COLUMN IF NOT EXISTS email_status text,
ADD COLUMN IF NOT EXISTS email_verification_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS contact_accuracy_score integer,
ADD COLUMN IF NOT EXISTS seniority_level text,
ADD COLUMN IF NOT EXISTS departments text[],
ADD COLUMN IF NOT EXISTS persona_tags text[],
ADD COLUMN IF NOT EXISTS apollo_person_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS direct_phone text,
ADD COLUMN IF NOT EXISTS mobile_phone text,
ADD COLUMN IF NOT EXISTS work_direct_phone text,
ADD COLUMN IF NOT EXISTS extrapolated_email_confidence numeric,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS intent_strength text,
ADD COLUMN IF NOT EXISTS show_intent boolean DEFAULT false;

-- Criar índices para decision_makers
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_id ON decision_makers(apollo_person_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email_status ON decision_makers(email_status);
CREATE INDEX IF NOT EXISTS idx_decision_makers_seniority ON decision_makers(seniority_level);
CREATE INDEX IF NOT EXISTS idx_decision_makers_accuracy ON decision_makers(contact_accuracy_score);

-- Comentários para documentação
COMMENT ON COLUMN companies.market_segments IS 'Market segments from Apollo (e.g., SMB, Mid-Market, Enterprise)';
COMMENT ON COLUMN companies.sic_codes IS 'Standard Industrial Classification codes from Apollo';
COMMENT ON COLUMN companies.naics_codes IS 'North American Industry Classification System codes from Apollo';
COMMENT ON COLUMN companies.buying_intent_signals IS 'Buying intent signals detected by Apollo';
COMMENT ON COLUMN companies.apollo_signals IS 'Various signals from Apollo (hiring, funding, tech adoption, etc)';
COMMENT ON COLUMN decision_makers.email_status IS 'Email verification status from Apollo (verified, guessed, unavailable, etc)';
COMMENT ON COLUMN decision_makers.contact_accuracy_score IS 'Apollo contact accuracy score (0-100)';
COMMENT ON COLUMN decision_makers.seniority_level IS 'Seniority level from Apollo (C-Level, VP, Director, Manager, etc)';

-- ============================================================================
-- MIGRATION: 20251028014902_c081a3ed-6541-4b9d-8475-cdec0866b50e.sql
-- ============================================================================

-- Migration: Adicionar colunas Apollo completas em decision_makers
-- SEGURO: Todas as colunas são NULLABLE, não quebra dados existentes
-- FOCO: Apenas Apollo/decisores, nenhuma outra tabela é tocada

ALTER TABLE public.decision_makers
ADD COLUMN IF NOT EXISTS headline TEXT NULL,
ADD COLUMN IF NOT EXISTS city TEXT NULL,
ADD COLUMN IF NOT EXISTS state TEXT NULL,
ADD COLUMN IF NOT EXISTS country TEXT NULL,
ADD COLUMN IF NOT EXISTS functions TEXT[] NULL,
ADD COLUMN IF NOT EXISTS subdepartments TEXT[] NULL,
ADD COLUMN IF NOT EXISTS education JSONB NULL,
ADD COLUMN IF NOT EXISTS organization_data JSONB NULL,
ADD COLUMN IF NOT EXISTS apollo_last_enriched_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS revealed_for_current_team BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS twitter_url TEXT NULL,
ADD COLUMN IF NOT EXISTS facebook_url TEXT NULL,
ADD COLUMN IF NOT EXISTS github_url TEXT NULL;

-- Índices para performance (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_decision_makers_headline ON public.decision_makers USING gin(to_tsvector('portuguese', COALESCE(headline, '')));
CREATE INDEX IF NOT EXISTS idx_decision_makers_city ON public.decision_makers(city);
CREATE INDEX IF NOT EXISTS idx_decision_makers_state ON public.decision_makers(state);
CREATE INDEX IF NOT EXISTS idx_decision_makers_functions ON public.decision_makers USING gin(functions);
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_enriched ON public.decision_makers(apollo_last_enriched_at DESC);

-- Comentários de documentação
COMMENT ON COLUMN public.decision_makers.headline IS 'LinkedIn headline do decisor';
COMMENT ON COLUMN public.decision_makers.city IS 'Cidade do decisor';
COMMENT ON COLUMN public.decision_makers.state IS 'Estado do decisor';
COMMENT ON COLUMN public.decision_makers.country IS 'País do decisor';
COMMENT ON COLUMN public.decision_makers.functions IS 'Funções/áreas do decisor (Finance, Sales, etc)';
COMMENT ON COLUMN public.decision_makers.subdepartments IS 'Sub-departamentos do decisor';
COMMENT ON COLUMN public.decision_makers.education IS 'Histórico educacional do decisor (escolas, graduações)';
COMMENT ON COLUMN public.decision_makers.organization_data IS 'Dados da organização atual do decisor';
COMMENT ON COLUMN public.decision_makers.apollo_last_enriched_at IS 'Última vez que foi enriquecido pelo Apollo';
COMMENT ON COLUMN public.decision_makers.revealed_for_current_team IS 'Lead revelado para o time no Apollo';
COMMENT ON COLUMN public.decision_makers.twitter_url IS 'Perfil do Twitter do decisor';
COMMENT ON COLUMN public.decision_makers.facebook_url IS 'Perfil do Facebook do decisor';
COMMENT ON COLUMN public.decision_makers.github_url IS 'Perfil do GitHub do decisor';

-- ============================================================================
-- MIGRATION: 20251028014933_85a31bae-f7f3-4729-bd57-ff3e21d553bc.sql
-- ============================================================================

-- ETAPA 2: Migração de dados de apollo_person_metadata para colunas dedicadas
-- SEGURO: Apenas cópia de dados, não deleta nada, usa COALESCE para não sobrescrever

UPDATE public.decision_makers
SET 
  headline = COALESCE(headline, apollo_person_metadata->>'headline'),
  city = COALESCE(city, apollo_person_metadata->>'city'),
  state = COALESCE(state, apollo_person_metadata->>'state'),
  country = COALESCE(country, apollo_person_metadata->>'country'),
  twitter_url = COALESCE(twitter_url, apollo_person_metadata->>'twitter_url'),
  facebook_url = COALESCE(facebook_url, apollo_person_metadata->>'facebook_url'),
  github_url = COALESCE(github_url, apollo_person_metadata->>'github_url'),
  organization_data = COALESCE(
    organization_data,
    jsonb_build_object(
      'organization_name', apollo_person_metadata->>'organization_name',
      'organization_id', apollo_person_metadata->>'organization_id'
    )
  )
WHERE apollo_person_metadata IS NOT NULL
  AND apollo_person_metadata != '{}'::jsonb;

-- ============================================================================
-- MIGRATION: 20251028215147_80ff7f85-c0a7-410e-a04c-c2eba612c8ad.sql
-- ============================================================================

-- ============================================
-- CICLO 3: Estrutura de Banco de Dados (DROP E RECREATE)
-- ============================================

-- Drop existing table and recreate from scratch
DROP TABLE IF EXISTS public.decision_makers CASCADE;

-- 1. Criar tabela decision_makers (42+ campos conforme especificação)
CREATE TABLE public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificadores
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  apollo_person_id TEXT UNIQUE,
  apollo_organization_id TEXT,
  
  -- Dados pessoais
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  seniority TEXT,
  departments JSONB DEFAULT '[]'::JSONB,
  
  -- Contatos
  email TEXT,
  email_status TEXT,
  phone TEXT,
  mobile_phone TEXT,
  
  -- Links (canônicos e obrigatórios)
  linkedin_url TEXT,
  apollo_person_url TEXT,
  
  -- Localização
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Scores e métricas
  recommendations_score INTEGER,
  people_auto_score_label TEXT,
  people_auto_score_value INTEGER,
  
  -- Vínculo com empresa
  is_current_at_company BOOLEAN DEFAULT true,
  is_decision_maker BOOLEAN DEFAULT true,
  tenure_start_date DATE,
  tenure_months INTEGER,
  
  -- Dados profissionais
  employment_history JSONB DEFAULT '[]'::JSONB,
  education JSONB DEFAULT '[]'::JSONB,
  
  -- Contexto da empresa
  company_name TEXT,
  company_employees INTEGER,
  company_industries JSONB DEFAULT '[]'::JSONB,
  company_keywords JSONB DEFAULT '[]'::JSONB,
  
  -- Metadados
  raw_apollo_data JSONB,
  raw_linkedin_data JSONB,
  data_sources JSONB DEFAULT '[]'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_enriched_at TIMESTAMPTZ,
  
  -- Validação e auditoria
  validation_status TEXT DEFAULT 'valid',
  rejection_reason TEXT,
  
  -- Constraints
  CONSTRAINT valid_email_status CHECK (email_status IN ('verified', 'unavailable', 'personal', NULL)),
  CONSTRAINT valid_seniority CHECK (seniority IN ('C-Level', 'VP', 'Director', 'Head', 'Manager', 'Senior', 'Entry', NULL))
);

-- Índices para performance
CREATE INDEX idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX idx_decision_makers_apollo_person_id ON public.decision_makers(apollo_person_id);
CREATE INDEX idx_decision_makers_linkedin_url ON public.decision_makers(linkedin_url);
CREATE INDEX idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX idx_decision_makers_seniority ON public.decision_makers(seniority);
CREATE INDEX idx_decision_makers_recommendations_score ON public.decision_makers(recommendations_score DESC);

-- Trigger para updated_at
CREATE TRIGGER update_decision_makers_updated_at
  BEFORE UPDATE ON public.decision_makers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read decision_makers"
  ON public.decision_makers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert decision_makers"
  ON public.decision_makers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update decision_makers"
  ON public.decision_makers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage decision_makers"
  ON public.decision_makers FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Adicionar campos do CICLO 3 na tabela companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT,
  ADD COLUMN IF NOT EXISTS similar_companies JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS technologies_full JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS employee_trends JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS website_visitors JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS company_insights JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS news JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS job_postings JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS founding_year INTEGER,
  ADD COLUMN IF NOT EXISTS apollo_score JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS suggested_leads JSONB DEFAULT '[]'::JSONB;

-- Índice para apollo_organization_id
CREATE INDEX IF NOT EXISTS idx_companies_apollo_organization_id ON public.companies(apollo_organization_id);

-- ============================================================================
-- MIGRATION: 20251028215327_62414f17-6968-49f8-84f2-207fd20b2ff8.sql
-- ============================================================================

-- ============================================
-- CICLO 3: Estrutura de Banco de Dados (IDEMPOTENTE)
-- ============================================

-- Criar tabela decision_makers apenas se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decision_makers') THEN
    CREATE TABLE public.decision_makers (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      apollo_person_id TEXT UNIQUE,
      apollo_organization_id TEXT,
      name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      title TEXT,
      seniority TEXT,
      departments JSONB DEFAULT '[]'::JSONB,
      email TEXT,
      email_status TEXT,
      phone TEXT,
      mobile_phone TEXT,
      linkedin_url TEXT,
      apollo_person_url TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      recommendations_score INTEGER,
      people_auto_score_label TEXT,
      people_auto_score_value INTEGER,
      is_current_at_company BOOLEAN DEFAULT true,
      is_decision_maker BOOLEAN DEFAULT true,
      tenure_start_date DATE,
      tenure_months INTEGER,
      employment_history JSONB DEFAULT '[]'::JSONB,
      education JSONB DEFAULT '[]'::JSONB,
      company_name TEXT,
      company_employees INTEGER,
      company_industries JSONB DEFAULT '[]'::JSONB,
      company_keywords JSONB DEFAULT '[]'::JSONB,
      raw_apollo_data JSONB,
      raw_linkedin_data JSONB,
      data_sources JSONB DEFAULT '[]'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_enriched_at TIMESTAMPTZ,
      validation_status TEXT DEFAULT 'valid',
      rejection_reason TEXT,
      CONSTRAINT valid_email_status CHECK (email_status IN ('verified', 'unavailable', 'personal', NULL)),
      CONSTRAINT valid_seniority CHECK (seniority IN ('C-Level', 'VP', 'Director', 'Head', 'Manager', 'Senior', 'Entry', NULL))
    );
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_apollo_person_id ON public.decision_makers(apollo_person_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_linkedin_url ON public.decision_makers(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email ON public.decision_makers(email);
CREATE INDEX IF NOT EXISTS idx_decision_makers_seniority ON public.decision_makers(seniority);
CREATE INDEX IF NOT EXISTS idx_decision_makers_recommendations_score ON public.decision_makers(recommendations_score DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_decision_makers_updated_at ON public.decision_makers;
CREATE TRIGGER update_decision_makers_updated_at
  BEFORE UPDATE ON public.decision_makers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can read decision_makers"
  ON public.decision_makers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can insert decision_makers"
  ON public.decision_makers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can update decision_makers"
  ON public.decision_makers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service role can manage decision_makers" ON public.decision_makers;
CREATE POLICY "Service role can manage decision_makers"
  ON public.decision_makers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar campos na companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT,
  ADD COLUMN IF NOT EXISTS similar_companies JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS technologies_full JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS employee_trends JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS website_visitors JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS company_insights JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS news JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS job_postings JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS founding_year INTEGER,
  ADD COLUMN IF NOT EXISTS apollo_score JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS suggested_leads JSONB DEFAULT '[]'::JSONB;

CREATE INDEX IF NOT EXISTS idx_companies_apollo_organization_id ON public.companies(apollo_organization_id);

-- ============================================================================
-- MIGRATION: 20251029012310_d50404fb-ec76-466b-9b9e-dc1019353db0.sql
-- ============================================================================

-- COMPANIES: garantir colunas mapeáveis
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS apollo_organization_id text,
    ADD COLUMN IF NOT EXISTS linkedin_company_id text,
    ADD COLUMN IF NOT EXISTS sub_industry text,
    ADD COLUMN IF NOT EXISTS employee_count_range text,
    ADD COLUMN IF NOT EXISTS headquarters_city text,
    ADD COLUMN IF NOT EXISTS headquarters_state text,
    ADD COLUMN IF NOT EXISTS headquarters_country text,
    ADD COLUMN IF NOT EXISTS revenue_range text,
    ADD COLUMN IF NOT EXISTS apollo_url text,
    ADD COLUMN IF NOT EXISTS last_apollo_sync_at timestamptz;

CREATE INDEX IF NOT EXISTS ix_companies_apollo_org ON public.companies (apollo_organization_id);

-- PEOPLE (42 campos principais)
CREATE TABLE IF NOT EXISTS public.people (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    apollo_person_id text,
    linkedin_profile_id text,
    linkedin_url text,
    first_name text,
    last_name text,
    full_name text,
    job_title text,
    seniority text,
    department text,
    email_primary text,
    email_hash text,
    email_status text,
    phones jsonb,
    city text,
    state text,
    country text,
    timezone text,
    languages jsonb,
    skills jsonb,
    headline text,
    current_company_apollo_id text,
    current_company_linkedin_id text,
    started_at date,
    ended_at date,
    last_seen_at timestamptz,
    last_updated_at timestamptz,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_apollo ON public.people (apollo_person_id) WHERE apollo_person_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_linkedin ON public.people (linkedin_profile_id) WHERE linkedin_profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_emailhash ON public.people (email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_people_fullname ON public.people (full_name);

-- Vínculo COMPANY ↔ PERSON
CREATE TABLE IF NOT EXISTS public.company_people (
    company_id uuid NOT NULL,
    person_id uuid NOT NULL,
    apollo_organization_id text,
    department text,
    seniority text,
    location_city text,
    location_state text,
    location_country text,
    title_at_company text,
    is_current boolean DEFAULT true,
    confidence numeric,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, person_id)
);
CREATE INDEX IF NOT EXISTS ix_company_people_company ON public.company_people (company_id);

-- SIMILARES
CREATE TABLE IF NOT EXISTS public.similar_companies (
    company_id uuid NOT NULL,
    similar_company_external_id text NOT NULL,
    similar_name text,
    location text,
    employees_min int,
    employees_max int,
    similarity_score numeric,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, similar_company_external_id)
);

-- NEWS
CREATE TABLE IF NOT EXISTS public.company_news (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id uuid NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    portal text,
    published_at timestamptz,
    score numeric,
    why text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_company_news_company ON public.company_news (company_id);

-- JOBS
CREATE TABLE IF NOT EXISTS public.company_jobs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id uuid NOT NULL,
    title text,
    location text,
    url text,
    portal text,
    posted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_company_jobs_company ON public.company_jobs (company_id);

-- TECHNOLOGIES
CREATE TABLE IF NOT EXISTS public.company_technologies (
    company_id uuid NOT NULL,
    technology text NOT NULL,
    category text,
    source text DEFAULT 'apollo',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, technology)
);

-- INSIGHTS
CREATE TABLE IF NOT EXISTS public.company_insights (
    company_id uuid PRIMARY KEY,
    auto_score numeric,
    drivers jsonb,
    updated_at timestamptz
);

-- AUDITORIA
CREATE TABLE IF NOT EXISTS public.company_updates (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id uuid NOT NULL,
    request_id uuid NOT NULL,
    company_id uuid NOT NULL,
    organization_id text NOT NULL,
    modes text[] NOT NULL,
    updated_fields text[] NOT NULL,
    updated_count int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_company_updates_company ON public.company_updates (company_id);

-- RLS Policies para as novas tabelas
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para leitura autenticada
CREATE POLICY "Authenticated users can read people" ON public.people FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_people" ON public.company_people FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read similar_companies" ON public.similar_companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_news" ON public.company_news FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_jobs" ON public.company_jobs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_technologies" ON public.company_technologies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_insights" ON public.company_insights FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read company_updates" ON public.company_updates FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role pode inserir/atualizar (usado pela Edge Function)
CREATE POLICY "Service role can manage people" ON public.people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_people" ON public.company_people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage similar_companies" ON public.similar_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_news" ON public.company_news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_jobs" ON public.company_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_technologies" ON public.company_technologies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_insights" ON public.company_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage company_updates" ON public.company_updates FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251029014915_20cc8b81-721b-4469-9918-2905a9e5e62c.sql
-- ============================================================================

-- Adicionar foreign keys para permitir joins do Supabase
ALTER TABLE public.company_people
    ADD CONSTRAINT fk_company_people_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_company_people_person 
    FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;

ALTER TABLE public.similar_companies
    ADD CONSTRAINT fk_similar_companies_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_news
    ADD CONSTRAINT fk_company_news_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_jobs
    ADD CONSTRAINT fk_company_jobs_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_technologies
    ADD CONSTRAINT fk_company_technologies_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_insights
    ADD CONSTRAINT fk_company_insights_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.company_updates
    ADD CONSTRAINT fk_company_updates_company 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================================================
-- MIGRATION: 20251029022359_34a83eda-339b-4922-8bde-e706aeaa367e.sql
-- ============================================================================

-- Adicionar constraints UNIQUE na tabela people para permitir upserts
ALTER TABLE public.people
  ADD CONSTRAINT people_apollo_person_id_key UNIQUE (apollo_person_id),
  ADD CONSTRAINT people_linkedin_profile_id_key UNIQUE (linkedin_profile_id),
  ADD CONSTRAINT people_email_hash_key UNIQUE (email_hash);

-- ============================================================================
-- MIGRATION: 20251029030549_48e20291-1c14-4c49-b462-65c6fa10d485.sql
-- ============================================================================

-- Políticas RLS para permitir leitura de people e company_people

-- People: permitir leitura para usuários autenticados
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_people_if_linked" ON public.people;
CREATE POLICY "read_people_authenticated"
ON public.people
FOR SELECT
TO authenticated
USING (true);

-- Company People: permitir leitura para usuários autenticados
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_company_people_auth" ON public.company_people;
CREATE POLICY "read_company_people_authenticated"
ON public.company_people
FOR SELECT
TO authenticated
USING (true);

-- Similar Companies: permitir leitura para usuários autenticados
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_similar_companies_authenticated"
ON public.similar_companies
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- MIGRATION: 20251029032424_e022685a-e7b1-4c04-8018-242b80135f3b.sql
-- ============================================================================

-- ========================================
-- RLS Policies para People, Similar e Company People
-- ========================================

-- Habilitar RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;

-- Permitir leitura autenticada de pessoas vinculadas
DROP POLICY IF EXISTS "read_people_authenticated" ON public.people;
CREATE POLICY "read_people_authenticated"
ON public.people
FOR SELECT
TO authenticated
USING (true);

-- Permitir leitura de vínculos empresa-pessoa
DROP POLICY IF EXISTS "read_company_people_authenticated" ON public.company_people;
CREATE POLICY "read_company_people_authenticated"
ON public.company_people
FOR SELECT
TO authenticated
USING (true);

-- Permitir leitura de empresas similares
DROP POLICY IF EXISTS "read_similar_companies_authenticated" ON public.similar_companies;
CREATE POLICY "read_similar_companies_authenticated"
ON public.similar_companies
FOR SELECT
TO authenticated
USING (true);

-- Permitir service role gerenciar tudo (para enrich-apollo)
CREATE POLICY "service_can_manage_people"
ON public.people
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_can_manage_company_people"
ON public.company_people
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_can_manage_similar"
ON public.similar_companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251029033549_3bd1f225-99a7-4e25-9ada-431bb6ef09b2.sql
-- ============================================================================


-- =====================================================================
-- MICROCICLO 1: FUNDAÇÃO - Índices + RLS + Governança + Auditoria
-- =====================================================================

-- ========================================
-- 1.1) ÍNDICES ÚNICOS (previne 500 no upsert)
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_apollo 
ON public.people (apollo_person_id) 
WHERE apollo_person_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_linkedin 
ON public.people (linkedin_profile_id) 
WHERE linkedin_profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_emailhash 
ON public.people (email_hash) 
WHERE email_hash IS NOT NULL;

-- ========================================
-- 1.2) GOVERNANÇA - Meta por campo + Auditoria
-- ========================================
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS field_meta JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.company_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    source TEXT NOT NULL,
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_log_company 
ON public.company_change_log(company_id, changed_at DESC);

-- Publicar no Realtime para toasts reativos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'company_change_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.company_change_log;
    END IF;
END $$;

-- ========================================
-- 1.3) TABELA DE AUDITORIA DE UPDATES
-- ========================================
CREATE TABLE IF NOT EXISTS public.company_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL,
    request_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    modes TEXT[] NOT NULL,
    updated_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_updates_company 
ON public.company_updates(company_id, created_at DESC);

-- ========================================
-- 1.4) RLS - Políticas de escrita para service_role
-- ========================================

-- company_change_log: service role pode inserir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_change_log' 
        AND policyname = 'service_can_insert_change_log'
    ) THEN
        CREATE POLICY service_can_insert_change_log
        ON public.company_change_log FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- company_updates: service role pode inserir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_updates' 
        AND policyname = 'service_can_insert_updates'
    ) THEN
        CREATE POLICY service_can_insert_updates
        ON public.company_updates FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- company_change_log: authenticated podem ler
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_change_log' 
        AND policyname = 'auth_can_read_change_log'
    ) THEN
        CREATE POLICY auth_can_read_change_log
        ON public.company_change_log FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- company_updates: authenticated podem ler
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_updates' 
        AND policyname = 'auth_can_read_updates'
    ) THEN
        CREATE POLICY auth_can_read_updates
        ON public.company_updates FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;


-- ============================================================================
-- MIGRATION: 20251029033613_d273a1a2-0b59-49f4-bba1-c73d1766b3c7.sql
-- ============================================================================


-- =====================================================================
-- MICROCICLO 1: FUNDAÇÃO - Índices + RLS + Governança + Auditoria
-- =====================================================================

-- ========================================
-- 1.1) ÍNDICES ÚNICOS (previne 500 no upsert)
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS ux_people_apollo 
ON public.people (apollo_person_id) 
WHERE apollo_person_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_linkedin 
ON public.people (linkedin_profile_id) 
WHERE linkedin_profile_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_emailhash 
ON public.people (email_hash) 
WHERE email_hash IS NOT NULL;

-- ========================================
-- 1.2) GOVERNANÇA - Meta por campo + Auditoria
-- ========================================
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS field_meta JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.company_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    source TEXT NOT NULL,
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_log_company 
ON public.company_change_log(company_id, changed_at DESC);

-- Publicar no Realtime para toasts reativos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'company_change_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.company_change_log;
    END IF;
END $$;

-- ========================================
-- 1.3) TABELA DE AUDITORIA DE UPDATES
-- ========================================
CREATE TABLE IF NOT EXISTS public.company_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL,
    request_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    modes TEXT[] NOT NULL,
    updated_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_updates_company 
ON public.company_updates(company_id, created_at DESC);

-- ========================================
-- 1.4) RLS - Políticas de escrita para service_role
-- ========================================

-- company_change_log: service role pode inserir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_change_log' 
        AND policyname = 'service_can_insert_change_log'
    ) THEN
        CREATE POLICY service_can_insert_change_log
        ON public.company_change_log FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- company_updates: service role pode inserir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_updates' 
        AND policyname = 'service_can_insert_updates'
    ) THEN
        CREATE POLICY service_can_insert_updates
        ON public.company_updates FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- company_change_log: authenticated podem ler
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_change_log' 
        AND policyname = 'auth_can_read_change_log'
    ) THEN
        CREATE POLICY auth_can_read_change_log
        ON public.company_change_log FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- company_updates: authenticated podem ler
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_updates' 
        AND policyname = 'auth_can_read_updates'
    ) THEN
        CREATE POLICY auth_can_read_updates
        ON public.company_updates FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;


-- ============================================================================
-- MIGRATION: 20251029033656_a0b49f67-628a-4a05-a50a-ed8f255c4026.sql
-- ============================================================================


-- Habilitar RLS nas novas tabelas
ALTER TABLE public.company_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- MIGRATION: 20251029034817_f2b6feb0-fae3-4138-973c-909e925611d2.sql
-- ============================================================================

-- Adicionar coluna para rastrear último enriquecimento automático
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS apollo_last_enriched_at TIMESTAMPTZ;

-- Criar índice para otimizar busca de empresas a enriquecer
CREATE INDEX IF NOT EXISTS idx_companies_auto_enrich 
ON public.companies(apollo_organization_id, apollo_last_enriched_at)
WHERE apollo_organization_id IS NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN public.companies.apollo_last_enriched_at IS 'Timestamp do último enriquecimento automático via Apollo';


-- ============================================================================
-- MIGRATION: 20251029041438_0af0a2e2-fa86-4bed-b65c-311c5b51d0a3.sql
-- ============================================================================

-- ========================================
-- SISTEMA DE CONTROLE DE CRÉDITOS APOLLO
-- ========================================

-- 1) Índices únicos para prevenir duplicatas
create unique index if not exists ux_people_apollo 
on public.people (apollo_person_id) 
where apollo_person_id is not null;

create unique index if not exists ux_people_linkedin 
on public.people (linkedin_profile_id) 
where linkedin_profile_id is not null;

create unique index if not exists ux_people_emailhash 
on public.people (email_hash) 
where email_hash is not null;

-- 2) Configuração de créditos Apollo
create table if not exists public.apollo_credit_config (
    id uuid primary key default gen_random_uuid(),
    plan_type text not null default 'trial',
    total_credits int not null default 1000,
    used_credits int not null default 0,
    reset_date timestamptz not null default (now() + interval '14 days'),
    alert_threshold int not null default 200,
    block_threshold int not null default 50,
    trial_ends_at timestamptz not null default (now() + interval '14 days'),
    updated_at timestamptz not null default now()
);

-- Inserir config inicial
insert into public.apollo_credit_config (plan_type, total_credits, used_credits)
values ('trial', 1000, 0)
on conflict (id) do nothing;

-- 3) Histórico de uso de créditos
create table if not exists public.apollo_credit_usage (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) on delete cascade,
    company_name text,
    organization_id text not null,
    modes text[] not null,
    estimated_credits int not null,
    actual_credits int,
    status text not null,
    error_code text,
    error_message text,
    requested_by uuid references auth.users(id),
    requested_at timestamptz not null default now(),
    completed_at timestamptz
);

create index if not exists idx_credit_usage_company 
on public.apollo_credit_usage(company_id, requested_at desc);

create index if not exists idx_credit_usage_status 
on public.apollo_credit_usage(status, requested_at desc);

-- 4) RLS para créditos
alter table public.apollo_credit_config enable row level security;

drop policy if exists "auth_can_read_credit_config" on public.apollo_credit_config;
create policy "auth_can_read_credit_config"
on public.apollo_credit_config for select to authenticated using (true);

drop policy if exists "service_can_manage_credit_config" on public.apollo_credit_config;
create policy "service_can_manage_credit_config"
on public.apollo_credit_config for all using (true) with check (true);

alter table public.apollo_credit_usage enable row level security;

drop policy if exists "auth_can_read_credit_usage" on public.apollo_credit_usage;
create policy "auth_can_read_credit_usage"
on public.apollo_credit_usage for select to authenticated using (true);

drop policy if exists "service_can_insert_credit_usage" on public.apollo_credit_usage;
create policy "service_can_insert_credit_usage"
on public.apollo_credit_usage for insert with check (true);

-- 5) Função para incrementar créditos
create or replace function public.increment_apollo_credits(credits_consumed int)
returns void
language plpgsql
security definer
as $$
begin
    update public.apollo_credit_config
    set 
        used_credits = used_credits + credits_consumed,
        updated_at = now()
    where id = (select id from public.apollo_credit_config limit 1);
end;
$$;

-- ============================================================================
-- MIGRATION: 20251029062208_73ff4aaa-78b1-42a4-901a-c41982618fea.sql
-- ============================================================================

-- Verificar e criar tabela de roles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        create table public.user_roles (
            id uuid primary key default gen_random_uuid(),
            user_id uuid references auth.users(id) on delete cascade not null,
            role app_role not null,
            unique (user_id, role)
        );
        
        alter table public.user_roles enable row level security;
    END IF;
END $$;

-- Criar ou substituir função de verificação de role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Drop policies existentes se houver
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Recriar policies
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- MIGRATION: 20251029073018_dfdcad06-45a2-4663-a624-28508c88e1d8.sql
-- ============================================================================

-- ========================================
-- TABELA: Detecção de Uso TOTVS
-- ========================================
create table if not exists public.totvs_usage_detection (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    company_name text not null,
    score int not null,
    status text not null,
    evidences jsonb not null default '[]'::jsonb,
    sources_checked int not null default 5,
    checked_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_totvs_detection_company 
on public.totvs_usage_detection(company_id, checked_at desc);

-- ========================================
-- TABELA: Sinais de Intenção de Compra
-- ========================================
create table if not exists public.intent_signals_detection (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    company_name text not null,
    score int not null,
    signals jsonb not null default '[]'::jsonb,
    sources_checked int not null default 4,
    checked_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_intent_detection_company 
on public.intent_signals_detection(company_id, checked_at desc);

-- ========================================
-- RLS (Row Level Security)
-- ========================================
alter table public.totvs_usage_detection enable row level security;

drop policy if exists "read_totvs_detection_auth" on public.totvs_usage_detection;
create policy "read_totvs_detection_auth"
on public.totvs_usage_detection for select to authenticated using (true);

drop policy if exists "insert_totvs_detection_service" on public.totvs_usage_detection;
create policy "insert_totvs_detection_service"
on public.totvs_usage_detection for insert with check (true);

alter table public.intent_signals_detection enable row level security;

drop policy if exists "read_intent_detection_auth" on public.intent_signals_detection;
create policy "read_intent_detection_auth"
on public.intent_signals_detection for select to authenticated using (true);

drop policy if exists "insert_intent_detection_service" on public.intent_signals_detection;
create policy "insert_intent_detection_service"
on public.intent_signals_detection for insert with check (true);

-- ============================================================================
-- MIGRATION: 20251029075521_237990c5-1889-4c50-a806-10cecbc43619.sql
-- ============================================================================

-- ========================================
-- EXPANDIR TABELAS EXISTENTES + CRIAR NOVAS
-- ========================================

-- Expandir totvs_usage_detection
ALTER TABLE public.totvs_usage_detection 
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS platforms_scanned text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS disqualification_reason text,
ADD COLUMN IF NOT EXISTS confidence text;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_totvs_detection_region ON public.totvs_usage_detection(region, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_totvs_detection_sector ON public.totvs_usage_detection(sector, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_totvs_detection_status ON public.totvs_usage_detection(status, checked_at DESC);

-- Expandir intent_signals_detection
ALTER TABLE public.intent_signals_detection 
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS platforms_scanned text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS temperature text,
ADD COLUMN IF NOT EXISTS confidence text;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_intent_detection_region ON public.intent_signals_detection(region, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_detection_sector ON public.intent_signals_detection(sector, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_detection_temperature ON public.intent_signals_detection(temperature, checked_at DESC);

-- ========================================
-- NOVA TABELA: Vagas Detectadas
-- ========================================
CREATE TABLE IF NOT EXISTS public.job_postings_detected (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  platform text NOT NULL,
  job_title text NOT NULL,
  job_description text,
  job_url text NOT NULL,
  required_skills text[],
  totvs_products_mentioned text[],
  location text,
  posted_at timestamptz,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company ON public.job_postings_detected(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_platform ON public.job_postings_detected(platform, detected_at DESC);

-- RLS
ALTER TABLE public.job_postings_detected ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_job_postings_auth" ON public.job_postings_detected;
CREATE POLICY "read_job_postings_auth" ON public.job_postings_detected 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_job_postings_service" ON public.job_postings_detected;
CREATE POLICY "insert_job_postings_service" ON public.job_postings_detected 
  FOR INSERT WITH CHECK (true);

-- ========================================
-- NOVA TABELA: Documentos Financeiros
-- ========================================
CREATE TABLE IF NOT EXISTS public.financial_docs_detected (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  doc_type text NOT NULL,
  doc_url text NOT NULL,
  totvs_mentioned boolean NOT NULL DEFAULT false,
  totvs_as_creditor boolean NOT NULL DEFAULT false,
  excerpt text,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_docs_company ON public.financial_docs_detected(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_docs_totvs_creditor ON public.financial_docs_detected(totvs_as_creditor, detected_at DESC);

-- RLS
ALTER TABLE public.financial_docs_detected ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_financial_docs_auth" ON public.financial_docs_detected;
CREATE POLICY "read_financial_docs_auth" ON public.financial_docs_detected 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_financial_docs_service" ON public.financial_docs_detected;
CREATE POLICY "insert_financial_docs_service" ON public.financial_docs_detected 
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251029082024_cf2247da-57bb-4598-9aea-7b1c6fe093d7.sql
-- ============================================================================

-- ========================================
-- TABELA: Batch Jobs (Lotes de Análise)
-- ========================================
create table if not exists public.icp_batch_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  source text not null,
  status text not null default 'pending',
  total_companies int not null default 0,
  processed_companies int not null default 0,
  qualified_companies int not null default 0,
  disqualified_companies int not null default 0,
  errors int not null default 0,
  region text,
  sector text,
  niche text,
  file_url text,
  report_url text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_batch_jobs_user on public.icp_batch_jobs(user_id, created_at desc);
create index if not exists idx_batch_jobs_status on public.icp_batch_jobs(status, created_at desc);
create index if not exists idx_batch_jobs_niche on public.icp_batch_jobs(niche, created_at desc);

-- ========================================
-- TABELA: Batch Companies (Empresas do Lote)
-- ========================================
create table if not exists public.icp_batch_companies (
  id uuid primary key default gen_random_uuid(),
  batch_job_id uuid not null references public.icp_batch_jobs(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  company_name text not null,
  cnpj text,
  domain text,
  region text,
  sector text,
  niche text,
  status text not null default 'pending',
  totvs_score int,
  totvs_status text,
  totvs_disqualification_reason text,
  totvs_evidences jsonb default '[]'::jsonb,
  totvs_methodology jsonb default '{}'::jsonb,
  intent_score int,
  intent_confidence text,
  intent_signals jsonb default '[]'::jsonb,
  intent_methodology jsonb default '{}'::jsonb,
  platforms_scanned text[] default array[]::text[],
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_batch_companies_job on public.icp_batch_companies(batch_job_id, created_at desc);
create index if not exists idx_batch_companies_niche on public.icp_batch_companies(niche, created_at desc);

-- ========================================
-- TABELA: Similar Companies (Empresas Similares)
-- ========================================
create table if not exists public.similar_companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  similar_company_external_id text not null,
  similar_name text not null,
  location text,
  employees_min int,
  employees_max int,
  similarity_score decimal(5,2),
  source text not null default 'apollo',
  created_at timestamptz not null default now()
);

create index if not exists idx_similar_companies_company on public.similar_companies(company_id, similarity_score desc);

-- ========================================
-- TABELA: Nichos (Segmentação Detalhada)
-- ========================================
create table if not exists public.niches (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  niche_name text not null,
  description text,
  keywords text[] not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_niches_sector_name on public.niches(sector, niche_name);

-- Inserir nichos padrão (Agro)
insert into public.niches (sector, niche_name, description, keywords) values
  ('Agro', 'Cultivo de Grãos', 'Cultivo de soja, milho, trigo, etc.', array['soja', 'milho', 'trigo', 'grãos', 'cultivo', 'plantio']),
  ('Agro', 'Maquinário Agrícola', 'Venda e manutenção de tratores, colheitadeiras, etc.', array['trator', 'colheitadeira', 'maquinário', 'equipamento agrícola', 'implementos']),
  ('Agro', 'Insumos Agrícolas', 'Sementes, adubos, fertilizantes, defensivos', array['sementes', 'adubo', 'fertilizante', 'defensivo', 'agrotóxico', 'insumo']),
  ('Agro', 'Pecuária', 'Criação de gado, suínos, aves, etc.', array['gado', 'pecuária', 'bovino', 'suíno', 'avicultura', 'criação']),
  ('Agro', 'Agroindústria', 'Processamento de produtos agrícolas', array['agroindústria', 'processamento', 'beneficiamento', 'industrialização']),
  ('Agro', 'Distribuição Agrícola', 'Distribuição de produtos agrícolas', array['distribuição', 'logística agrícola', 'armazenagem', 'cooperativa'])
on conflict do nothing;

-- ========================================
-- RLS POLICIES
-- ========================================
alter table public.icp_batch_jobs enable row level security;
alter table public.icp_batch_companies enable row level security;
alter table public.similar_companies enable row level security;
alter table public.niches enable row level security;

drop policy if exists "users_read_own_batch_jobs" on public.icp_batch_jobs;
create policy "users_read_own_batch_jobs" on public.icp_batch_jobs 
  for all to authenticated using (auth.uid() = user_id);

drop policy if exists "users_read_batch_companies" on public.icp_batch_companies;
create policy "users_read_batch_companies" on public.icp_batch_companies 
  for select to authenticated using (
    exists (
      select 1 from public.icp_batch_jobs
      where icp_batch_jobs.id = icp_batch_companies.batch_job_id
      and icp_batch_jobs.user_id = auth.uid()
    )
  );

drop policy if exists "users_read_similar_companies" on public.similar_companies;
create policy "users_read_similar_companies" on public.similar_companies 
  for select to authenticated using (true);

drop policy if exists "service_manage_similar_companies" on public.similar_companies;
create policy "service_manage_similar_companies" on public.similar_companies 
  for all to authenticated using (true);

drop policy if exists "users_read_niches" on public.niches;
create policy "users_read_niches" on public.niches 
  for select to authenticated using (true);

-- Adicionar coluna methodology nas tabelas de detecção existentes
alter table public.totvs_usage_detection 
  add column if not exists methodology jsonb default '{}'::jsonb;

alter table public.intent_signals_detection 
  add column if not exists methodology jsonb default '{}'::jsonb;

-- ============================================================================
-- MIGRATION: 20251029085259_40947217-8f94-4301-a526-74285c7d5637.sql
-- ============================================================================

-- ========================================
-- TABELA: Setores (12 setores principais)
-- ========================================
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL UNIQUE,
    sector_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sectors_read_all" ON public.sectors FOR SELECT TO authenticated USING (true);

-- Inserir setores
INSERT INTO public.sectors (sector_code, sector_name, description) VALUES
('agro', 'Agro', 'Agronegócio, pecuária, agroindústria'),
('construcao', 'Construção', 'Construção civil, infraestrutura, materiais'),
('distribuicao', 'Distribuição', 'Atacado, distribuição, logística comercial'),
('educacional', 'Educacional', 'Escolas, universidades, edtechs'),
('financial_services', 'Financial Services', 'Bancos, fintechs, seguradoras'),
('hotelaria', 'Hotelaria e Turismo', 'Hotéis, agências, turismo'),
('juridico', 'Jurídico', 'Escritórios, legaltechs, compliance'),
('logistica', 'Logística', 'Transporte, armazenagem, 3PL'),
('manufatura', 'Manufatura', 'Indústria de transformação'),
('servicos', 'Prestadores de Serviços', 'Consultorias, TI, facilities'),
('saude', 'Saúde', 'Hospitais, clínicas, healthtechs'),
('varejo', 'Varejo', 'Comércio varejista, e-commerce')
ON CONFLICT (sector_code) DO NOTHING;

-- ========================================
-- RECRIAR TABELA: Nichos (70+ nichos detalhados)
-- ========================================
DROP TABLE IF EXISTS public.niches CASCADE;

CREATE TABLE public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL REFERENCES public.sectors(sector_code),
    niche_code TEXT NOT NULL UNIQUE,
    niche_name TEXT NOT NULL,
    description TEXT,
    cnaes TEXT[],
    ncms TEXT[],
    keywords TEXT[] NOT NULL,
    totvs_products TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_niches_code ON public.niches(niche_code);
CREATE INDEX idx_niches_sector ON public.niches(sector_code);

-- Habilitar RLS
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "niches_read_all" ON public.niches FOR SELECT TO authenticated USING (true);

-- ========================================
-- INSERIR NICHOS (70+ nichos)
-- ========================================

-- AGRO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('agro', 'agro_cooperativas', 'Cooperativas Agrícolas', 'Cooperativas de produtores rurais', ARRAY['0161-0/01', '0161-0/02'], ARRAY[]::TEXT[], ARRAY['cooperativa agrícola', 'cooperativa rural', 'produtores associados'], ARRAY['Protheus', 'RM TOTVS']),
('agro', 'agro_agroindustrias', 'Agroindústrias', 'Processamento de produtos agrícolas', ARRAY['1031-7/00', '1033-3/01'], ARRAY[]::TEXT[], ARRAY['agroindústria', 'processamento agrícola', 'beneficiamento'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_fazendas', 'Produtores Rurais e Fazendas', 'Cultivo de grãos, frutas, hortaliças', ARRAY['0111-3/01', '0111-3/02'], ARRAY[]::TEXT[], ARRAY['fazenda', 'produtor rural', 'cultivo', 'plantio'], ARRAY['Protheus Agro']),
('agro', 'agro_trading', 'Trading de Grãos', 'Comercialização de commodities agrícolas', ARRAY['4623-1/01'], ARRAY['1001', '1005', '1201'], ARRAY['trading agrícola', 'commodities', 'exportação grãos'], ARRAY['Protheus', 'TOTVS Gestão']),
('agro', 'agro_usinas', 'Usinas de Açúcar e Etanol', 'Produção de açúcar, etanol, bioenergia', ARRAY['1071-6/00', '1931-4/00'], ARRAY[]::TEXT[], ARRAY['usina', 'açúcar', 'etanol', 'bioenergia'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_fertilizantes', 'Indústrias de Fertilizantes', 'Fabricação de adubos e fertilizantes', ARRAY['2013-4/00'], ARRAY[]::TEXT[], ARRAY['fertilizante', 'adubo', 'NPK', 'insumo agrícola'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_maquinario', 'Fabricantes de Maquinário Agrícola', 'Tratores, colheitadeiras, implementos', ARRAY['2831-9/00', '2833-5/00'], ARRAY[]::TEXT[], ARRAY['trator', 'colheitadeira', 'maquinário agrícola', 'implemento'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_distribuidores_insumos', 'Distribuidores de Insumos', 'Distribuição de sementes, defensivos, adubos', ARRAY['4683-4/00'], ARRAY[]::TEXT[], ARRAY['distribuidor insumos', 'sementes', 'defensivos', 'agrotóxico'], ARRAY['Protheus', 'TOTVS Gestão']),
('agro', 'agro_agritechs', 'Agritechs', 'Startups de agricultura digital', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['agritech', 'agricultura digital', 'agricultura de precisão'], ARRAY['Fluig', 'TOTVS Gestão']),
('agro', 'agro_pecuaria', 'Pecuária de Corte e Leite', 'Criação de gado, suínos, aves', ARRAY['0151-2/01', '0155-5/01'], ARRAY[]::TEXT[], ARRAY['pecuária', 'gado', 'bovino', 'suíno', 'avicultura'], ARRAY['Protheus Agro']);

-- CONSTRUÇÃO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('construcao', 'construcao_construtoras', 'Construtoras e Incorporadoras', 'Construção de edifícios, obras civis', ARRAY['4120-4/00', '4110-7/00'], ARRAY[]::TEXT[], ARRAY['construtora', 'incorporadora', 'construção civil'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_loteadoras', 'Loteadoras e Urbanizadoras', 'Loteamento, urbanização, infraestrutura', ARRAY['4211-1/01'], ARRAY[]::TEXT[], ARRAY['loteadora', 'urbanização', 'loteamento'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_infraestrutura', 'Obras de Infraestrutura', 'Rodovias, pontes, saneamento', ARRAY['4211-1/02', '4222-7/01'], ARRAY[]::TEXT[], ARRAY['infraestrutura', 'rodovia', 'ponte', 'saneamento'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_engenharia', 'Engenharia Civil e Consultiva', 'Projetos, consultoria, fiscalização', ARRAY['7112-0/00'], ARRAY[]::TEXT[], ARRAY['engenharia civil', 'projeto estrutural', 'consultoria obras'], ARRAY['Fluig', 'TOTVS Gestão']),
('construcao', 'construcao_materiais', 'Indústria de Materiais de Construção', 'Cimento, cerâmica, argamassa', ARRAY['2330-3/01', '2349-4/01'], ARRAY[]::TEXT[], ARRAY['materiais construção', 'cimento', 'cerâmica', 'argamassa'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_serralheria', 'Serralherias e Marcenarias Industriais', 'Esquadrias, móveis planejados', ARRAY['2512-8/00', '3101-2/00'], ARRAY[]::TEXT[], ARRAY['serralheria', 'marcenaria', 'esquadrias', 'móveis planejados'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_manutencao', 'Empresas de Manutenção Predial', 'Manutenção, conservação, facilities', ARRAY['8121-4/00'], ARRAY[]::TEXT[], ARRAY['manutenção predial', 'conservação', 'facilities'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_premoldados', 'Fabricantes de Pré-Moldados', 'Estruturas pré-fabricadas, concreto', ARRAY['2330-3/05'], ARRAY[]::TEXT[], ARRAY['pré-moldado', 'pré-fabricado', 'concreto'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_arquitetura', 'Arquitetura e Design de Interiores', 'Projetos arquitetônicos, design', ARRAY['7111-1/00'], ARRAY[]::TEXT[], ARRAY['arquitetura', 'design interiores', 'projeto arquitetônico'], ARRAY['Fluig', 'TOTVS Gestão']),
('construcao', 'construcao_obras_publicas', 'Obras Públicas e Licitações', 'Construção para governo, licitações', ARRAY['4120-4/00'], ARRAY[]::TEXT[], ARRAY['obras públicas', 'licitação', 'governo'], ARRAY['Protheus', 'TOTVS Gestão']);

-- DISTRIBUIÇÃO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('distribuicao', 'dist_alimentos', 'Distribuidores de Alimentos e Bebidas', 'Atacado de alimentos, bebidas', ARRAY['4631-1/00', '4632-0/01'], ARRAY[]::TEXT[], ARRAY['distribuidor alimentos', 'atacado bebidas', 'food service'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_farmaceuticos', 'Distribuidores Farmacêuticos', 'Atacado de medicamentos', ARRAY['4644-3/01'], ARRAY[]::TEXT[], ARRAY['distribuidor farmacêutico', 'atacado medicamentos', 'pharma'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_autopecas', 'Distribuidores de Autopeças', 'Atacado de peças automotivas', ARRAY['4530-7/01'], ARRAY[]::TEXT[], ARRAY['distribuidor autopeças', 'atacado automotivo', 'peças veículos'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_eletricos', 'Atacadistas de Materiais Elétricos', 'Distribuição de materiais elétricos', ARRAY['4661-3/00'], ARRAY[]::TEXT[], ARRAY['atacado elétrico', 'materiais elétricos', 'distribuidor elétrica'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_cosmeticos', 'Distribuidores de Cosméticos', 'Atacado de cosméticos, perfumaria', ARRAY['4645-1/01'], ARRAY[]::TEXT[], ARRAY['distribuidor cosméticos', 'atacado perfumaria', 'beauty'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_hospitalares', 'Equipamentos Hospitalares', 'Distribuição de equipamentos médicos', ARRAY['4664-8/00'], ARRAY[]::TEXT[], ARRAY['equipamento hospitalar', 'distribuidor médico', 'material cirúrgico'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_tecnologia', 'Distribuição de Tecnologia e TI', 'Atacado de hardware, software', ARRAY['4651-6/01'], ARRAY[]::TEXT[], ARRAY['distribuidor TI', 'atacado tecnologia', 'hardware'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_eletrodomesticos', 'Eletrodomésticos e Utilidades', 'Atacado de eletrodomésticos', ARRAY['4649-4/01'], ARRAY[]::TEXT[], ARRAY['atacado eletrodomésticos', 'linha branca', 'utilidades domésticas'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_epis', 'Distribuidores de EPIs e Segurança', 'Equipamentos de proteção individual', ARRAY['4649-4/99'], ARRAY[]::TEXT[], ARRAY['distribuidor EPI', 'equipamento segurança', 'proteção individual'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'dist_logistica', 'Logística e Cross Docking', 'Centros de distribuição, cross docking', ARRAY['5250-8/05'], ARRAY[]::TEXT[], ARRAY['cross docking', 'centro distribuição', 'CD'], ARRAY['Protheus', 'TOTVS Gestão']);

-- EDUCACIONAL (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('educacional', 'edu_escolas', 'Escolas Particulares e Redes de Ensino', 'Ensino fundamental, médio', ARRAY['8513-9/00'], ARRAY[]::TEXT[], ARRAY['escola particular', 'rede ensino', 'colégio'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_faculdades', 'Faculdades e Universidades', 'Ensino superior', ARRAY['8532-5/00'], ARRAY[]::TEXT[], ARRAY['faculdade', 'universidade', 'ensino superior'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_tecnicas', 'Escolas Técnicas e Profissionalizantes', 'Cursos técnicos, profissionalizantes', ARRAY['8541-4/00'], ARRAY[]::TEXT[], ARRAY['escola técnica', 'profissionalizante', 'SENAI', 'SENAC'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_edtechs', 'Edtechs', 'Startups de educação digital', ARRAY['8599-6/04'], ARRAY[]::TEXT[], ARRAY['edtech', 'educação digital', 'plataforma ensino'], ARRAY['Fluig', 'TOTVS Gestão']),
('educacional', 'edu_idiomas', 'Escolas de Idiomas', 'Cursos de inglês, espanhol, etc.', ARRAY['8593-7/00'], ARRAY[]::TEXT[], ARRAY['escola idiomas', 'curso inglês', 'language school'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_corporativo', 'Instituições de Ensino Corporativo', 'Treinamento empresarial', ARRAY['8599-6/03'], ARRAY[]::TEXT[], ARRAY['ensino corporativo', 'treinamento empresarial', 'universidade corporativa'], ARRAY['RM TOTVS', 'Fluig']),
('educacional', 'edu_ead', 'Plataformas EAD', 'Ensino a distância', ARRAY['8599-6/04'], ARRAY[]::TEXT[], ARRAY['EAD', 'ensino distância', 'plataforma online'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_treinamento', 'Centros de Treinamento Profissional', 'Capacitação técnica', ARRAY['8599-6/03'], ARRAY[]::TEXT[], ARRAY['centro treinamento', 'capacitação profissional'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_mba', 'Cursos de Especialização e MBA', 'Pós-graduação, MBA', ARRAY['8542-2/00'], ARRAY[]::TEXT[], ARRAY['MBA', 'pós-graduação', 'especialização'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'edu_gestoras', 'Gestoras de Ensino Público e ONGs', 'Gestão educacional, ONGs', ARRAY['8412-4/00'], ARRAY[]::TEXT[], ARRAY['gestão educacional', 'ONG educação'], ARRAY['RM TOTVS', 'TOTVS Educacional']);

-- FINANCIAL SERVICES (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('financial_services', 'fin_bancos_digitais', 'Bancos Digitais', 'Bancos 100% digitais', ARRAY['6422-1/00'], ARRAY[]::TEXT[], ARRAY['banco digital', 'neobank', 'fintech bancária'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_cooperativas', 'Cooperativas de Crédito', 'Cooperativas financeiras', ARRAY['6421-2/00'], ARRAY[]::TEXT[], ARRAY['cooperativa crédito', 'Sicoob', 'Sicredi'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_fintechs', 'Fintechs', 'Startups de serviços financeiros', ARRAY['6499-9/99'], ARRAY[]::TEXT[], ARRAY['fintech', 'pagamento digital', 'crédito digital'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_seguradoras', 'Seguradoras', 'Seguros gerais, vida, saúde', ARRAY['6512-0/00'], ARRAY[]::TEXT[], ARRAY['seguradora', 'seguro', 'corretora seguros'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_corretoras', 'Corretoras de Investimentos', 'Corretoras de valores', ARRAY['6612-6/02'], ARRAY[]::TEXT[], ARRAY['corretora investimentos', 'corretora valores', 'XP', 'BTG'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_consultorias', 'Consultorias Financeiras', 'Consultoria de investimentos', ARRAY['6619-3/04'], ARRAY[]::TEXT[], ARRAY['consultoria financeira', 'planejamento financeiro'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_pagamentos', 'Meios de Pagamento / Gateways', 'Processamento de pagamentos', ARRAY['6619-3/02'], ARRAY[]::TEXT[], ARRAY['gateway pagamento', 'adquirente', 'processadora'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_factoring', 'Factoring / FIDC', 'Fomento mercantil, fundos', ARRAY['6499-9/01'], ARRAY[]::TEXT[], ARRAY['factoring', 'FIDC', 'fomento mercantil'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_credito_pme', 'Plataformas de Crédito PME', 'Crédito para pequenas empresas', ARRAY['6499-9/99'], ARRAY[]::TEXT[], ARRAY['crédito PME', 'empréstimo empresarial'], ARRAY['Protheus', 'TOTVS Gestão']),
('financial_services', 'fin_bureaus', 'Bureaus de Crédito e Cobrança', 'Análise de crédito, cobrança', ARRAY['8291-1/00'], ARRAY[]::TEXT[], ARRAY['bureau crédito', 'cobrança', 'score crédito'], ARRAY['Protheus', 'TOTVS Gestão']);

-- HOTELARIA E TURISMO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('hotelaria', 'hotel_hoteis', 'Hotéis e Pousadas', 'Hospedagem', ARRAY['5510-8/01'], ARRAY[]::TEXT[], ARRAY['hotel', 'pousada', 'hospedagem'], ARRAY['Protheus', 'TOTVS Hotelaria']),
('hotelaria', 'hotel_resorts', 'Resorts e Spas', 'Resorts, spas, lazer', ARRAY['5510-8/02'], ARRAY[]::TEXT[], ARRAY['resort', 'spa', 'hotel fazenda'], ARRAY['Protheus', 'TOTVS Hotelaria']),
('hotelaria', 'hotel_agencias', 'Agências de Viagens', 'Agências de turismo', ARRAY['7911-2/00'], ARRAY[]::TEXT[], ARRAY['agência viagens', 'turismo', 'operadora'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_operadoras', 'Operadoras de Turismo', 'Operadoras turísticas', ARRAY['7912-1/00'], ARRAY[]::TEXT[], ARRAY['operadora turismo', 'pacotes viagem'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_eventos', 'Eventos e Feiras Corporativas', 'Organização de eventos', ARRAY['8230-0/01'], ARRAY[]::TEXT[], ARRAY['eventos corporativos', 'feira', 'congresso'], ARRAY['Fluig', 'TOTVS Gestão']),
('hotelaria', 'hotel_parques', 'Parques Temáticos', 'Parques de diversão', ARRAY['9321-2/00'], ARRAY[]::TEXT[], ARRAY['parque temático', 'parque diversão'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_locadoras', 'Locadoras de Veículos', 'Aluguel de carros', ARRAY['7711-0/00'], ARRAY[]::TEXT[], ARRAY['locadora veículos', 'aluguel carros', 'rent a car'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_ota', 'Plataformas OTA (Online Travel Agency)', 'Plataformas de reserva online', ARRAY['7990-2/00'], ARRAY[]::TEXT[], ARRAY['OTA', 'booking', 'reserva online'], ARRAY['Protheus', 'TOTVS Gestão']),
('hotelaria', 'hotel_franquias', 'Franquias de Hospedagem', 'Redes de hotéis franqueados', ARRAY['5510-8/01'], ARRAY[]::TEXT[], ARRAY['franquia hotel', 'rede hoteleira'], ARRAY['Protheus', 'TOTVS Hotelaria']),
('hotelaria', 'hotel_condominios', 'Condomínios e Multipropriedades', 'Timeshare, condomínios turísticos', ARRAY['6810-2/02'], ARRAY[]::TEXT[], ARRAY['multipropriedade', 'timeshare', 'condomínio turístico'], ARRAY['Protheus', 'TOTVS Gestão']);

-- JURÍDICO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('juridico', 'jur_escritorios', 'Escritórios de Advocacia', 'Advocacia geral', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['escritório advocacia', 'advogado', 'jurídico'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_corporativo', 'Departamentos Jurídicos Corporativos', 'Jurídico interno de empresas', ARRAY['6911-7/02'], ARRAY[]::TEXT[], ARRAY['jurídico corporativo', 'departamento legal'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_legaltechs', 'Legaltechs', 'Startups de tecnologia jurídica', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['legaltech', 'tecnologia jurídica', 'automação jurídica'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_cartorios', 'Tabelionatos e Cartórios', 'Serviços notariais', ARRAY['6911-7/03'], ARRAY[]::TEXT[], ARRAY['cartório', 'tabelionato', 'notário'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_compliance', 'Consultorias de Compliance', 'Compliance, governança', ARRAY['7020-4/00'], ARRAY[]::TEXT[], ARRAY['compliance', 'governança corporativa', 'LGPD'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_cobranca', 'Empresas de Cobrança Jurídica', 'Cobrança judicial', ARRAY['8291-1/00'], ARRAY[]::TEXT[], ARRAY['cobrança jurídica', 'recuperação crédito'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_arbitragem', 'Arbitragem e Mediação', 'Resolução de conflitos', ARRAY['6911-7/04'], ARRAY[]::TEXT[], ARRAY['arbitragem', 'mediação', 'conciliação'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_patentes', 'Escritórios de Patentes e Marcas', 'Propriedade intelectual', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['patente', 'marca', 'propriedade intelectual'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_processos', 'Gestão de Processos e Contratos', 'Gestão documental jurídica', ARRAY['8219-9/01'], ARRAY[]::TEXT[], ARRAY['gestão processos', 'contratos', 'documental'], ARRAY['Fluig', 'TOTVS Gestão']),
('juridico', 'jur_due_diligence', 'Serviços de Due Diligence', 'Auditoria jurídica', ARRAY['6920-6/01'], ARRAY[]::TEXT[], ARRAY['due diligence', 'auditoria jurídica'], ARRAY['Fluig', 'TOTVS Gestão']);

-- LOGÍSTICA (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('logistica', 'log_transportadoras', 'Transportadoras', 'Transporte rodoviário de cargas', ARRAY['4930-2/01'], ARRAY[]::TEXT[], ARRAY['transportadora', 'transporte carga', 'frete'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_3pl', 'Operadores Logísticos (3PL / 4PL)', 'Operadores logísticos', ARRAY['5250-8/05'], ARRAY[]::TEXT[], ARRAY['3PL', '4PL', 'operador logístico'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_armazens', 'Armazéns e Centros de Distribuição', 'Armazenagem', ARRAY['5211-7/01'], ARRAY[]::TEXT[], ARRAY['armazém', 'CD', 'centro distribuição'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_courier', 'Courier e Entregas Rápidas', 'Entregas expressas', ARRAY['5320-2/02'], ARRAY[]::TEXT[], ARRAY['courier', 'entrega rápida', 'motoboy'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_logtechs', 'Logtechs', 'Startups de logística digital', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['logtech', 'logística digital', 'TMS'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_multimodal', 'Transporte Rodoviário, Aéreo, Marítimo', 'Transporte multimodal', ARRAY['4930-2/02', '5111-1/00', '5091-2/01'], ARRAY[]::TEXT[], ARRAY['transporte aéreo', 'transporte marítimo', 'multimodal'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_rastreamento', 'Empresas de Rastreamento e Telemetria', 'Rastreamento de frotas', ARRAY['8020-0/00'], ARRAY[]::TEXT[], ARRAY['rastreamento', 'telemetria', 'monitoramento frota'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_frota', 'Gestão de Frota e Manutenção', 'Gestão de frotas', ARRAY['4520-0/01'], ARRAY[]::TEXT[], ARRAY['gestão frota', 'manutenção veículos'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_despachantes', 'Despachantes Aduaneiros', 'Despacho aduaneiro', ARRAY['5229-0/02'], ARRAY[]::TEXT[], ARRAY['despachante aduaneiro', 'desembaraço', 'importação'], ARRAY['Protheus', 'TOTVS Gestão']),
('logistica', 'log_comex', 'Comércio Exterior e Freight Forwarding', 'Agentes de carga', ARRAY['5229-0/01'], ARRAY[]::TEXT[], ARRAY['freight forwarder', 'comércio exterior', 'agente carga'], ARRAY['Protheus', 'TOTVS Gestão']);

-- MANUFATURA (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('manufatura', 'man_metalurgica', 'Indústria Metalúrgica', 'Siderurgia, metalurgia', ARRAY['2441-5/01', '2451-2/00'], ARRAY[]::TEXT[], ARRAY['metalúrgica', 'siderurgia', 'fundição'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_plastica', 'Indústria Plástica', 'Transformação de plásticos', ARRAY['2221-8/00', '2229-3/01'], ARRAY[]::TEXT[], ARRAY['indústria plástica', 'transformação plástico', 'injeção plástico'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_textil', 'Indústria Têxtil e Confecção', 'Têxtil, vestuário', ARRAY['1311-1/00', '1412-6/01'], ARRAY[]::TEXT[], ARRAY['indústria têxtil', 'confecção', 'vestuário'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_quimica', 'Indústria Química', 'Química, petroquímica', ARRAY['2011-8/00', '2013-4/00'], ARRAY[]::TEXT[], ARRAY['indústria química', 'petroquímica', 'resina'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_automotiva', 'Indústria Automotiva', 'Montadoras, autopeças', ARRAY['2910-7/01', '2945-0/00'], ARRAY[]::TEXT[], ARRAY['indústria automotiva', 'montadora', 'autopeças'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_eletroeletronicos', 'Eletroeletrônicos', 'Eletrônicos, eletrodomésticos', ARRAY['2610-8/00', '2751-8/00'], ARRAY[]::TEXT[], ARRAY['indústria eletrônica', 'eletrodomésticos', 'linha branca'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_moveis', 'Móveis e Decoração', 'Indústria moveleira', ARRAY['3101-2/00'], ARRAY[]::TEXT[], ARRAY['indústria móveis', 'moveleira', 'marcenaria'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_alimenticia', 'Indústria Alimentícia', 'Alimentos, bebidas', ARRAY['1011-2/01', '1121-6/00'], ARRAY[]::TEXT[], ARRAY['indústria alimentícia', 'alimentos', 'bebidas'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_papel', 'Papel e Celulose', 'Indústria de papel', ARRAY['1710-9/00'], ARRAY[]::TEXT[], ARRAY['papel celulose', 'indústria papel'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'man_farmaceutica', 'Indústria Farmacêutica e Cosmética', 'Medicamentos, cosméticos', ARRAY['2121-1/01', '2063-1/00'], ARRAY[]::TEXT[], ARRAY['indústria farmacêutica', 'cosméticos', 'medicamentos'], ARRAY['Protheus', 'TOTVS Manufatura']);

-- PRESTADORES DE SERVIÇOS (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('servicos', 'serv_contabilidade', 'Contabilidade e Auditoria', 'Escritórios contábeis', ARRAY['6920-6/01'], ARRAY[]::TEXT[], ARRAY['contabilidade', 'auditoria', 'contador'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_marketing', 'Marketing e Publicidade', 'Agências de marketing', ARRAY['7311-4/00'], ARRAY[]::TEXT[], ARRAY['agência marketing', 'publicidade', 'propaganda'], ARRAY['Fluig', 'TOTVS Gestão']),
('servicos', 'serv_ti', 'TI e Desenvolvimento de Software', 'Desenvolvimento, TI', ARRAY['6201-5/00', '6202-3/00'], ARRAY[]::TEXT[], ARRAY['desenvolvimento software', 'TI', 'programação'], ARRAY['Fluig', 'TOTVS Gestão']),
('servicos', 'serv_facilities', 'Facilities e Limpeza Corporativa', 'Limpeza, conservação', ARRAY['8121-4/00'], ARRAY[]::TEXT[], ARRAY['facilities', 'limpeza corporativa', 'conservação'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_seguranca', 'Segurança Patrimonial', 'Vigilância, segurança', ARRAY['8011-1/01'], ARRAY[]::TEXT[], ARRAY['segurança patrimonial', 'vigilância', 'portaria'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_consultorias', 'Consultorias Empresariais', 'Consultoria de gestão', ARRAY['7020-4/00'], ARRAY[]::TEXT[], ARRAY['consultoria empresarial', 'gestão', 'estratégia'], ARRAY['Fluig', 'TOTVS Gestão']),
('servicos', 'serv_rh', 'Recursos Humanos e Recrutamento', 'RH, recrutamento', ARRAY['7810-8/00'], ARRAY[]::TEXT[], ARRAY['recursos humanos', 'recrutamento', 'headhunter'], ARRAY['RM TOTVS', 'TOTVS Gestão']),
('servicos', 'serv_manutencao', 'Manutenção e Serviços Técnicos', 'Manutenção técnica', ARRAY['3314-7/01'], ARRAY[]::TEXT[], ARRAY['manutenção técnica', 'assistência técnica'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_veterinarias', 'Clínicas Veterinárias', 'Veterinária, petshops', ARRAY['7500-1/00'], ARRAY[]::TEXT[], ARRAY['clínica veterinária', 'veterinário', 'pet'], ARRAY['Protheus', 'TOTVS Gestão']),
('servicos', 'serv_coworkings', 'Coworkings e Hubs de Inovação', 'Espaços compartilhados', ARRAY['6810-2/01'], ARRAY[]::TEXT[], ARRAY['coworking', 'hub inovação', 'espaço compartilhado'], ARRAY['Fluig', 'TOTVS Gestão']);

-- SAÚDE (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('saude', 'saude_hospitais', 'Hospitais e Clínicas', 'Hospitais, clínicas médicas', ARRAY['8610-1/01', '8630-5/01'], ARRAY[]::TEXT[], ARRAY['hospital', 'clínica médica', 'pronto socorro'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_laboratorios', 'Laboratórios de Análises', 'Laboratórios clínicos', ARRAY['8640-2/01'], ARRAY[]::TEXT[], ARRAY['laboratório análises', 'exames', 'diagnóstico'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_homecare', 'Home Care', 'Atendimento domiciliar', ARRAY['8690-9/01'], ARRAY[]::TEXT[], ARRAY['home care', 'atendimento domiciliar'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_farmacias', 'Farmácias e Drogarias', 'Varejo farmacêutico', ARRAY['4771-7/01'], ARRAY[]::TEXT[], ARRAY['farmácia', 'drogaria', 'varejo farmacêutico'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_planos', 'Planos de Saúde e Operadoras', 'Operadoras de saúde', ARRAY['6550-2/00'], ARRAY[]::TEXT[], ARRAY['plano saúde', 'operadora saúde', 'convênio'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_odontologicas', 'Clínicas Odontológicas', 'Odontologia', ARRAY['8630-5/02'], ARRAY[]::TEXT[], ARRAY['clínica odontológica', 'dentista', 'ortodontia'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_estetica', 'Clínicas de Estética e Dermatologia', 'Estética, dermatologia', ARRAY['8630-5/03'], ARRAY[]::TEXT[], ARRAY['clínica estética', 'dermatologia', 'estética'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_distribuidores', 'Distribuidores de Produtos Médicos', 'Distribuição médica', ARRAY['4664-8/00'], ARRAY[]::TEXT[], ARRAY['distribuidor médico', 'produtos médicos'], ARRAY['Protheus', 'TOTVS Gestão']),
('saude', 'saude_healthtechs', 'Healthtechs', 'Startups de saúde digital', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['healthtech', 'saúde digital', 'telemedicina'], ARRAY['Fluig', 'TOTVS Gestão']),
('saude', 'saude_diagnostico', 'Centros de Diagnóstico por Imagem', 'Radiologia, tomografia', ARRAY['8640-2/02'], ARRAY[]::TEXT[], ARRAY['diagnóstico imagem', 'radiologia', 'tomografia'], ARRAY['Protheus', 'TOTVS Gestão']);

-- VAREJO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('varejo', 'varejo_supermercados', 'Supermercados e Minimercados', 'Varejo alimentar', ARRAY['4711-3/01', '4712-1/00'], ARRAY[]::TEXT[], ARRAY['supermercado', 'minimercado', 'varejo alimentar'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_departamento', 'Lojas de Departamento', 'Varejo multimarcas', ARRAY['4713-0/01'], ARRAY[]::TEXT[], ARRAY['loja departamento', 'magazine'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_moda', 'Moda e Vestuário', 'Varejo de roupas', ARRAY['4781-4/00'], ARRAY[]::TEXT[], ARRAY['loja roupas', 'moda', 'vestuário'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_farmacias_varejo', 'Farmácias e Perfumarias', 'Varejo farmacêutico', ARRAY['4771-7/01'], ARRAY[]::TEXT[], ARRAY['farmácia', 'perfumaria', 'drogaria'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_ecommerce', 'E-commerce e Marketplaces', 'Comércio eletrônico', ARRAY['4789-0/05'], ARRAY[]::TEXT[], ARRAY['e-commerce', 'marketplace', 'loja virtual'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_moveis_varejo', 'Lojas de Móveis e Eletros', 'Varejo de móveis', ARRAY['4754-7/01'], ARRAY[]::TEXT[], ARRAY['loja móveis', 'eletrodomésticos'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_tecnologia_varejo', 'Varejo de Tecnologia', 'Lojas de eletrônicos', ARRAY['4751-2/01'], ARRAY[]::TEXT[], ARRAY['loja tecnologia', 'eletrônicos', 'informática'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_alimentacao', 'Alimentação Fora do Lar (Bares e Restaurantes)', 'Food service', ARRAY['5611-2/01', '5620-1/01'], ARRAY[]::TEXT[], ARRAY['restaurante', 'bar', 'food service'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_franquias', 'Franquias e Redes de Lojas', 'Redes franqueadas', ARRAY['4789-0/99'], ARRAY[]::TEXT[], ARRAY['franquia', 'rede lojas'], ARRAY['Protheus', 'TOTVS Gestão']),
('varejo', 'varejo_petshops', 'Petshops e Acessórios', 'Varejo pet', ARRAY['4789-0/08'], ARRAY[]::TEXT[], ARRAY['petshop', 'pet', 'animais'], ARRAY['Protheus', 'TOTVS Gestão']);

-- ========================================
-- TABELA: Auditoria ICP
-- ========================================
CREATE TABLE IF NOT EXISTS public.icp_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_company_id UUID,
    action TEXT NOT NULL,
    reason TEXT,
    evidence_url TEXT,
    evidence_snippet TEXT,
    validation_rules_applied JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_batch_company ON public.icp_audit_log(batch_company_id, created_at DESC);

ALTER TABLE public.icp_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_read_all" ON public.icp_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_can_insert_audit_log" ON public.icp_audit_log FOR INSERT WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251029085958_b8ef3a5b-bfbc-4296-9ee3-39781fe5e9e3.sql
-- ============================================================================

-- Adicionar campo methodology à tabela totvs_usage_detection
ALTER TABLE public.totvs_usage_detection 
ADD COLUMN IF NOT EXISTS methodology jsonb DEFAULT '{}'::jsonb;

-- ============================================================================
-- MIGRATION: 20251029090600_77ed278d-7a3c-4da9-be8a-9cd7b6f3e5a9.sql
-- ============================================================================

-- ========================================
-- TABELA: Empresas Sugeridas (Descoberta)
-- ========================================
CREATE TABLE IF NOT EXISTS public.suggested_companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discovery_batch_id uuid,
    company_name text NOT NULL,
    cnpj text,
    cnpj_validated boolean DEFAULT false,
    domain text,
    linkedin_url text,
    state text,
    city text,
    sector_code text REFERENCES public.sectors(sector_code),
    niche_code text REFERENCES public.niches(niche_code),
    
    -- Dados de enriquecimento
    apollo_data jsonb,
    linkedin_data jsonb,
    receita_ws_data jsonb,
    
    -- Origem da sugestão
    source text NOT NULL,
    source_company_id uuid REFERENCES public.companies(id),
    similarity_score numeric(3,2),
    similarity_reasons text[],
    
    -- Status
    status text NOT NULL DEFAULT 'pending',
    added_to_bank_at timestamptz,
    company_id uuid REFERENCES public.companies(id),
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_user 
ON public.suggested_companies(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_status 
ON public.suggested_companies(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_niche 
ON public.suggested_companies(niche_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggested_companies_source 
ON public.suggested_companies(source, created_at DESC);

-- ========================================
-- TABELA: Lotes de Descoberta
-- ========================================
CREATE TABLE IF NOT EXISTS public.discovery_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    
    -- Critérios de busca
    sector_code text REFERENCES public.sectors(sector_code),
    niche_code text REFERENCES public.niches(niche_code),
    state text,
    city text,
    min_employees int,
    max_employees int,
    search_mode text NOT NULL,
    source_company_id uuid REFERENCES public.companies(id),
    
    -- Resultados
    total_found int NOT NULL DEFAULT 0,
    validated int NOT NULL DEFAULT 0,
    added_to_bank int NOT NULL DEFAULT 0,
    rejected int NOT NULL DEFAULT 0,
    
    status text NOT NULL DEFAULT 'pending',
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_batches_user 
ON public.discovery_batches(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_batches_status 
ON public.discovery_batches(status, created_at DESC);

-- ========================================
-- RLS (Row Level Security)
-- ========================================
ALTER TABLE public.suggested_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_read_own_suggestions"
ON public.suggested_companies FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_insert_own_suggestions"
ON public.suggested_companies FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_update_own_suggestions"
ON public.suggested_companies FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_suggestions" ON public.suggested_companies;
CREATE POLICY "users_delete_own_suggestions"
ON public.suggested_companies FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

ALTER TABLE public.discovery_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_discovery" ON public.discovery_batches;
CREATE POLICY "users_read_own_discovery"
ON public.discovery_batches FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_discovery" ON public.discovery_batches;
CREATE POLICY "users_insert_own_discovery"
ON public.discovery_batches FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_discovery" ON public.discovery_batches;
CREATE POLICY "users_update_own_discovery"
ON public.discovery_batches FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Service role pode gerenciar tudo
DROP POLICY IF EXISTS "service_manage_suggested" ON public.suggested_companies;
CREATE POLICY "service_manage_suggested"
ON public.suggested_companies FOR ALL 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_manage_discovery" ON public.discovery_batches;
CREATE POLICY "service_manage_discovery"
ON public.discovery_batches FOR ALL 
USING (true)
WITH CHECK (true);

-- ============================================================================
-- MIGRATION: 20251029093346_4fb13495-9d49-4f58-96f7-064876c576ec.sql
-- ============================================================================

-- ============================================
-- SPRINT 1: TRIGGER EVENTS & BUYING SIGNALS
-- ============================================

-- Tabela de sinais de compra detectados
CREATE TABLE IF NOT EXISTS public.buying_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'funding_round',
    'leadership_change', 
    'expansion',
    'technology_adoption',
    'partnership',
    'market_entry',
    'digital_transformation',
    'linkedin_activity',
    'job_posting',
    'competitor_mention',
    'negative_review'
  )),
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_url TEXT,
  source_type TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'contacted', 'closed', 'ignored')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_buying_signals_company ON public.buying_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_buying_signals_type ON public.buying_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_buying_signals_status ON public.buying_signals(status);
CREATE INDEX IF NOT EXISTS idx_buying_signals_detected ON public.buying_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_buying_signals_priority ON public.buying_signals(priority);

-- RLS Policies
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all buying signals"
  ON public.buying_signals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert buying signals"
  ON public.buying_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update buying signals"
  ON public.buying_signals FOR UPDATE
  USING (true);

-- Tabela de oportunidades de competitive displacement
CREATE TABLE IF NOT EXISTS public.displacement_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_type TEXT,
  displacement_reason TEXT NOT NULL,
  evidence TEXT,
  opportunity_score DECIMAL(3,2) CHECK (opportunity_score >= 0 AND opportunity_score <= 1),
  estimated_revenue DECIMAL(15,2),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'won', 'lost', 'ignored')),
  assigned_to UUID REFERENCES auth.users(id),
  next_action TEXT,
  next_action_date DATE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_displacement_company ON public.displacement_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_displacement_competitor ON public.displacement_opportunities(competitor_name);
CREATE INDEX IF NOT EXISTS idx_displacement_status ON public.displacement_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_displacement_score ON public.displacement_opportunities(opportunity_score DESC);

-- RLS Policies
ALTER TABLE public.displacement_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all displacement opportunities"
  ON public.displacement_opportunities FOR SELECT
  USING (true);

CREATE POLICY "Users can insert displacement opportunities"
  ON public.displacement_opportunities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update displacement opportunities"
  ON public.displacement_opportunities FOR UPDATE
  USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_buying_signals_updated_at
  BEFORE UPDATE ON public.buying_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_displacement_opportunities_updated_at
  BEFORE UPDATE ON public.displacement_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View para dashboard de sinais (agregado)
CREATE OR REPLACE VIEW public.buying_signals_summary AS
SELECT 
  company_id,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE status = 'new') as new_signals,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_signals,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_signals,
  AVG(confidence_score) as avg_confidence,
  MAX(detected_at) as last_signal_date,
  json_agg(DISTINCT signal_type) as signal_types
FROM public.buying_signals
GROUP BY company_id;

-- ============================================================================
-- MIGRATION: 20251029095502_7a20b88e-c1e6-4ef6-a181-2c866bc6ffb3.sql
-- ============================================================================

-- ============================================
-- DADOS GEOGRÁFICOS COMPLETOS DO BRASIL
-- ============================================

-- Tabela de Estados (27 UFs)
CREATE TABLE IF NOT EXISTS public.br_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Mesorregiões
CREATE TABLE IF NOT EXISTS public.br_mesoregions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL REFERENCES public.br_states(state_code),
  mesoregion_code TEXT NOT NULL UNIQUE,
  mesoregion_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Microrregiões
CREATE TABLE IF NOT EXISTS public.br_microregions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesoregion_code TEXT NOT NULL REFERENCES public.br_mesoregions(mesoregion_code),
  microregion_code TEXT NOT NULL UNIQUE,
  microregion_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Municípios (5570 municípios)
CREATE TABLE IF NOT EXISTS public.br_municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  municipality_code TEXT NOT NULL UNIQUE,
  municipality_name TEXT NOT NULL,
  state_code TEXT NOT NULL REFERENCES public.br_states(state_code),
  microregion_code TEXT REFERENCES public.br_microregions(microregion_code),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_br_mesoregions_state ON public.br_mesoregions(state_code);
CREATE INDEX IF NOT EXISTS idx_br_microregions_meso ON public.br_microregions(mesoregion_code);
CREATE INDEX IF NOT EXISTS idx_br_municipalities_state ON public.br_municipalities(state_code);
CREATE INDEX IF NOT EXISTS idx_br_municipalities_micro ON public.br_municipalities(microregion_code);
CREATE INDEX IF NOT EXISTS idx_br_municipalities_name ON public.br_municipalities(municipality_name);

-- RLS Policies (dados públicos de geografia)
ALTER TABLE public.br_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.br_mesoregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.br_microregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.br_municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geographic data is public" ON public.br_states FOR SELECT USING (true);
CREATE POLICY "Geographic data is public" ON public.br_mesoregions FOR SELECT USING (true);
CREATE POLICY "Geographic data is public" ON public.br_microregions FOR SELECT USING (true);
CREATE POLICY "Geographic data is public" ON public.br_municipalities FOR SELECT USING (true);

-- ============================================
-- CONFIGURAÇÃO DE MONITORAMENTO AUTOMÁTICO
-- ============================================

CREATE TABLE IF NOT EXISTS public.intelligence_monitoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Filtros Geográficos
  target_regions TEXT[] DEFAULT ARRAY['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
  target_states TEXT[],
  target_mesoregions TEXT[],
  target_microregions TEXT[],
  target_municipalities TEXT[],
  
  -- Filtros de Negócio
  target_sectors TEXT[],
  target_niches TEXT[],
  min_employees INTEGER DEFAULT 10,
  max_employees INTEGER DEFAULT 10000,
  min_revenue DECIMAL(15,2),
  max_revenue DECIMAL(15,2),
  
  -- Configurações de Monitoramento
  is_active BOOLEAN DEFAULT true,
  check_frequency_hours INTEGER DEFAULT 24 CHECK (check_frequency_hours >= 1),
  
  -- Keywords
  keywords_whitelist TEXT[],
  keywords_blacklist TEXT[],
  
  -- Sinais de Interesse
  monitor_funding BOOLEAN DEFAULT true,
  monitor_leadership_changes BOOLEAN DEFAULT true,
  monitor_expansion BOOLEAN DEFAULT true,
  monitor_tech_adoption BOOLEAN DEFAULT true,
  monitor_partnerships BOOLEAN DEFAULT true,
  monitor_market_entry BOOLEAN DEFAULT true,
  monitor_digital_transformation BOOLEAN DEFAULT true,
  monitor_competitor_mentions BOOLEAN DEFAULT true,
  
  -- Displacement Tracking
  competitor_names TEXT[] DEFAULT ARRAY['SAP', 'Oracle', 'Microsoft Dynamics', 'Salesforce', 'Senior', 'Linx', 'Omie', 'Bling'],
  
  -- Timestamps
  last_check_at TIMESTAMP WITH TIME ZONE,
  next_check_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_intelligence_config_user ON public.intelligence_monitoring_config(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_config_active ON public.intelligence_monitoring_config(is_active);
CREATE INDEX IF NOT EXISTS idx_intelligence_config_next_check ON public.intelligence_monitoring_config(next_check_at);

ALTER TABLE public.intelligence_monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own config"
  ON public.intelligence_monitoring_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
  ON public.intelligence_monitoring_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
  ON public.intelligence_monitoring_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_intelligence_monitoring_config_updated_at
  BEFORE UPDATE ON public.intelligence_monitoring_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERIR DADOS DOS 27 ESTADOS
-- ============================================

INSERT INTO public.br_states (state_code, state_name, region) VALUES
  -- Norte
  ('AC', 'Acre', 'Norte'),
  ('AP', 'Amapá', 'Norte'),
  ('AM', 'Amazonas', 'Norte'),
  ('PA', 'Pará', 'Norte'),
  ('RO', 'Rondônia', 'Norte'),
  ('RR', 'Roraima', 'Norte'),
  ('TO', 'Tocantins', 'Norte'),
  
  -- Nordeste
  ('AL', 'Alagoas', 'Nordeste'),
  ('BA', 'Bahia', 'Nordeste'),
  ('CE', 'Ceará', 'Nordeste'),
  ('MA', 'Maranhão', 'Nordeste'),
  ('PB', 'Paraíba', 'Nordeste'),
  ('PE', 'Pernambuco', 'Nordeste'),
  ('PI', 'Piauí', 'Nordeste'),
  ('RN', 'Rio Grande do Norte', 'Nordeste'),
  ('SE', 'Sergipe', 'Nordeste'),
  
  -- Centro-Oeste
  ('DF', 'Distrito Federal', 'Centro-Oeste'),
  ('GO', 'Goiás', 'Centro-Oeste'),
  ('MT', 'Mato Grosso', 'Centro-Oeste'),
  ('MS', 'Mato Grosso do Sul', 'Centro-Oeste'),
  
  -- Sudeste
  ('ES', 'Espírito Santo', 'Sudeste'),
  ('MG', 'Minas Gerais', 'Sudeste'),
  ('RJ', 'Rio de Janeiro', 'Sudeste'),
  ('SP', 'São Paulo', 'Sudeste'),
  
  -- Sul
  ('PR', 'Paraná', 'Sul'),
  ('RS', 'Rio Grande do Sul', 'Sul'),
  ('SC', 'Santa Catarina', 'Sul')
ON CONFLICT (state_code) DO NOTHING;

-- ============================================================================
-- MIGRATION: 20251029095701_b620885d-f7ca-4750-9cd3-16b44cf30195.sql
-- ============================================================================

-- ============================================
-- CRON JOB PARA MONITORAMENTO AUTOMÁTICO
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução automática da edge function a cada 6 horas
SELECT cron.schedule(
  'auto-intelligence-monitor-job',
  '0 */6 * * *', -- A cada 6 horas
  $$
  SELECT net.http_post(
    url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/auto-intelligence-monitor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================================================
-- MIGRATION: 20251029100737_e2172868-ddde-48f3-ad30-3e22016bb6de.sql
-- ============================================================================

-- ============================================
-- HABILITAR REALTIME PARA MONITORAMENTO
-- ============================================

-- Habilitar realtime para intelligence_monitoring_config
ALTER TABLE public.intelligence_monitoring_config REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_monitoring_config;

-- Habilitar realtime para buying_signals (detectar novos sinais em tempo real)
ALTER TABLE public.buying_signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buying_signals;

-- Habilitar realtime para displacement_opportunities
ALTER TABLE public.displacement_opportunities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.displacement_opportunities;

-- ============================================================================
-- MIGRATION: 20251029102231_848daae2-c763-4f76-89b4-9924f8c862a5.sql
-- ============================================================================

-- ⚙️ ATIVAR EXTENSÕES NECESSÁRIAS PARA CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 🔧 AGENDAR AUTO-INTELLIGENCE-MONITOR PARA RODAR A CADA 1 HORA (24/7)
SELECT cron.schedule(
  'auto-intelligence-monitor-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/auto-intelligence-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:=concat('{"triggered_by": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- ============================================================================
-- MIGRATION: 20251029102302_5c39bcf0-b48e-4c98-b92f-26845b83be54.sql
-- ============================================================================

-- ⚙️ ATIVAR EXTENSÕES NECESSÁRIAS PARA CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 🔧 AGENDAR AUTO-INTELLIGENCE-MONITOR PARA RODAR A CADA 1 HORA (24/7)
SELECT cron.schedule(
  'auto-intelligence-monitor-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/auto-intelligence-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:=concat('{"triggered_by": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- ============================================================================
-- MIGRATION: 20251029102328_c7727357-d4be-440e-bd1b-7d952a965881.sql
-- ============================================================================

-- ⚙️ ATIVAR EXTENSÕES NECESSÁRIAS PARA CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 🔧 AGENDAR AUTO-INTELLIGENCE-MONITOR PARA RODAR A CADA 1 HORA (24/7)
-- Remove agendamento antigo se existir
SELECT cron.unschedule('auto-intelligence-monitor-hourly');

-- Criar novo agendamento (a cada 1 hora)
SELECT cron.schedule(
  'auto-intelligence-monitor-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://ioaxzpwlurpduanzkfrt.supabase.co/functions/v1/auto-intelligence-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g"}'::jsonb,
        body:=concat('{"triggered_by": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- ✅ Verificar agendamentos ativos
SELECT * FROM cron.job;

-- ============================================================================
-- MIGRATION: 20251029134455_eded7455-9b90-4ab2-a2ad-956c4648c67b.sql
-- ============================================================================

-- Add schedule_name to monitoring config
ALTER TABLE public.intelligence_monitoring_config
ADD COLUMN IF NOT EXISTS schedule_name TEXT;

-- Optional: simple index if we will search by name often
CREATE INDEX IF NOT EXISTS idx_monitoring_config_schedule_name ON public.intelligence_monitoring_config (schedule_name);


-- ============================================================================
-- MIGRATION: 20251029140709_108129f5-f522-461d-b442-4e6cb7779c29.sql
-- ============================================================================

-- Adicionar colunas para monitoramento específico e nicho customizado (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intelligence_monitoring_config' AND column_name = 'custom_niche') THEN
    ALTER TABLE intelligence_monitoring_config ADD COLUMN custom_niche TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intelligence_monitoring_config' AND column_name = 'target_cities') THEN
    ALTER TABLE intelligence_monitoring_config ADD COLUMN target_cities TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intelligence_monitoring_config' AND column_name = 'target_niches') THEN
    ALTER TABLE intelligence_monitoring_config ADD COLUMN target_niches TEXT[];
  END IF;
END $$;

-- Criar índice para busca de nicho customizado
CREATE INDEX IF NOT EXISTS idx_monitoring_config_custom_niche 
ON intelligence_monitoring_config(custom_niche) WHERE custom_niche IS NOT NULL;

-- ============================================================================
-- MIGRATION: 20251029150559_bdb77afd-5401-40d0-b3b5-015e8dacaaba.sql
-- ============================================================================

-- Permitir múltiplos monitoramentos por usuário
-- 1) Remover unicidade antiga (user_id)
ALTER TABLE public.intelligence_monitoring_config
  DROP CONSTRAINT IF EXISTS intelligence_monitoring_config_user_id_key;

-- 2) Garantir unicidade por (user_id, schedule_name) para evitar nomes duplicados por usuário
-- Observação: schedule_name pode ser NULL; NULLs são distintos em Postgres
ALTER TABLE public.intelligence_monitoring_config
  ADD CONSTRAINT intelligence_monitoring_config_user_name_unique
  UNIQUE (user_id, schedule_name);

-- Índice auxiliar opcional já existe para schedule_name; manter como está


-- ============================================================================
-- MIGRATION: 20251029154648_f3b07e95-d3eb-4a89-9844-6af62bfcaf36.sql
-- ============================================================================

-- ============================================
-- DIA 1: ARQUITETURA DE DADOS - FUNDAÇÃO SÓLIDA
-- ============================================

-- 1. TABELA: leads_sources (Fontes de Captura)
CREATE TABLE IF NOT EXISTS public.leads_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  source_name TEXT NOT NULL UNIQUE CHECK (source_name IN (
    'upload_manual',
    'empresas_aqui',
    'linkedin_sales_navigator',
    'apollo_io',
    'google_search',
    'indicacao_website',
    'indicacao_parceiro',
    'lookalike_ai',
    'web_scraping_custom',
    'api_integration'
  )),
  
  -- Configuração
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- 1-10 (10 = maior prioridade)
  
  -- Credenciais (encriptadas)
  api_credentials JSONB,
  
  -- Configurações específicas
  config JSONB,
  
  -- Estatísticas
  total_captured INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_sources_active ON public.leads_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_sources_priority ON public.leads_sources(priority DESC);

-- RLS
ALTER TABLE public.leads_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all sources" ON public.leads_sources;
CREATE POLICY "Users can view all sources"
  ON public.leads_sources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify sources" ON public.leads_sources;
CREATE POLICY "Only admins can modify sources"
  ON public.leads_sources FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- 2. TABELA: leads_quarantine (Quarentena Inteligente)
CREATE TABLE IF NOT EXISTS public.leads_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados Básicos
  name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  
  -- Origem
  source_id UUID REFERENCES public.leads_sources(id),
  source_metadata JSONB, -- Dados brutos da fonte
  
  -- Classificação Inicial
  sector TEXT,
  niche TEXT,
  state TEXT,
  city TEXT,
  region TEXT CHECK (region IN ('Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul')),
  
  -- Porte
  employees INTEGER,
  revenue DECIMAL(15,2),
  company_size TEXT CHECK (company_size IN ('micro', 'pequena', 'media', 'grande')),
  
  -- Validações Automáticas
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending',      -- Aguardando validação
    'validating',   -- Em processo de validação
    'approved',     -- Aprovado para qualificação ICP
    'rejected',     -- Rejeitado (fora do ICP)
    'duplicate',    -- Duplicado
    'invalid_data'  -- Dados inválidos
  )),
  
  -- Scores de Validação
  cnpj_valid BOOLEAN DEFAULT false,
  cnpj_status TEXT, -- 'ativa', 'suspensa', 'baixada'
  website_active BOOLEAN DEFAULT false,
  website_ssl BOOLEAN DEFAULT false,
  has_linkedin BOOLEAN DEFAULT false,
  has_email BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  
  -- Score Automático (0-100)
  auto_score INTEGER DEFAULT 0,
  validation_score INTEGER DEFAULT 0,
  data_quality_score INTEGER DEFAULT 0,
  
  -- Enriquecimento Automático
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN (
    'pending',
    'in_progress',
    'completed',
    'failed'
  )),
  enriched_data JSONB, -- Dados enriquecidos (Apollo, LinkedIn, etc)
  
  -- Detecção de Tecnologias
  technologies_detected JSONB, -- [{"name": "SAP", "confidence": 0.8}]
  has_totvs BOOLEAN,
  totvs_products JSONB,
  competitor_erp TEXT,
  
  -- Sinais de Intenção
  buying_signals JSONB, -- [{"signal": "hiring_erp_analyst", "date": "2024-01-15"}]
  intent_score INTEGER DEFAULT 0,
  
  -- Timestamps
  captured_at TIMESTAMPTZ DEFAULT now(),
  validated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Auditoria
  validated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT,
  
  -- Controle
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_cnpj_in_quarantine UNIQUE(cnpj),
  CONSTRAINT check_score_range CHECK (auto_score >= 0 AND auto_score <= 100)
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_quarantine_status ON public.leads_quarantine(validation_status);
CREATE INDEX IF NOT EXISTS idx_quarantine_source ON public.leads_quarantine(source_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_captured ON public.leads_quarantine(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_cnpj ON public.leads_quarantine(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quarantine_score ON public.leads_quarantine(auto_score DESC);
CREATE INDEX IF NOT EXISTS idx_quarantine_sector_state ON public.leads_quarantine(sector, state);

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_quarantine_enriched_data ON public.leads_quarantine USING GIN (enriched_data);
CREATE INDEX IF NOT EXISTS idx_quarantine_technologies ON public.leads_quarantine USING GIN (technologies_detected);

-- RLS
ALTER TABLE public.leads_quarantine ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can view all quarantine leads"
  ON public.leads_quarantine FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can insert quarantine leads"
  ON public.leads_quarantine FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update quarantine leads" ON public.leads_quarantine;
CREATE POLICY "Users can update quarantine leads"
  ON public.leads_quarantine FOR UPDATE
  USING (true);

-- 3. Atualizar tabela companies existente com novas colunas
ALTER TABLE public.companies
-- Origem
ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES public.leads_sources(id),
ADD COLUMN IF NOT EXISTS quarantine_id UUID REFERENCES public.leads_quarantine(id),

-- Scores ICP
ADD COLUMN IF NOT EXISTS icp_score INTEGER DEFAULT 0 CHECK (icp_score >= 0 AND icp_score <= 100),
ADD COLUMN IF NOT EXISTS icp_score_breakdown JSONB, -- {"sector": 30, "size": 25, "region": 20, ...}
ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold')),

-- Jornada de Vendas
ADD COLUMN IF NOT EXISTS journey_stage TEXT DEFAULT 'new' CHECK (journey_stage IN (
  'new',                -- Recém qualificado
  'sdr_assigned',       -- Atribuído a SDR
  'researching',        -- SDR pesquisando
  'outreach_planned',   -- Abordagem planejada
  'first_contact',      -- Primeiro contato feito
  'follow_up',          -- Follow-up em andamento
  'meeting_scheduled',  -- Reunião agendada
  'meeting_done',       -- Reunião realizada
  'demo_scheduled',     -- Demo agendada
  'demo_done',          -- Demo realizada
  'proposal_preparing', -- Preparando proposta
  'proposal_sent',      -- Proposta enviada
  'negotiating',        -- Em negociação
  'contract_sent',      -- Contrato enviado
  'closed_won',         -- Fechado (ganho)
  'closed_lost',        -- Fechado (perdido)
  'nurturing',          -- Em nutrição (cold leads)
  'on_hold'             -- Em espera
)),

-- Atribuição
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,

-- Datas Importantes
ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS demo_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,

-- Próximas Ações
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS next_action_owner UUID REFERENCES auth.users(id),

-- Proposta Comercial
ADD COLUMN IF NOT EXISTS estimated_deal_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS proposed_products JSONB, -- ["TOTVS Protheus", "TOTVS Fluig"]
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS payment_terms TEXT,

-- Motivo de Perda (se closed_lost)
ADD COLUMN IF NOT EXISTS loss_reason TEXT CHECK (loss_reason IN (
  'price',
  'competitor',
  'timing',
  'no_budget',
  'no_decision',
  'not_interested',
  'other'
)),
ADD COLUMN IF NOT EXISTS loss_details TEXT,
ADD COLUMN IF NOT EXISTS competitor_won TEXT,

-- Histórico de Interações (contador)
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_emails INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_meetings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_whatsapp INTEGER DEFAULT 0;

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_companies_temperature ON public.companies(temperature);
CREATE INDEX IF NOT EXISTS idx_companies_journey ON public.companies(journey_stage);
CREATE INDEX IF NOT EXISTS idx_companies_icp_score ON public.companies(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_assigned ON public.companies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_companies_next_action_date ON public.companies(next_action_date);
CREATE INDEX IF NOT EXISTS idx_companies_source ON public.companies(lead_source_id);

-- 4. TABELA: interactions (Histórico de Interações)
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Tipo de Interação
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'call',
    'email',
    'whatsapp',
    'linkedin_message',
    'meeting',
    'demo',
    'proposal_sent',
    'contract_sent',
    'note',
    'task',
    'status_change'
  )),
  
  -- Detalhes
  subject TEXT,
  description TEXT,
  outcome TEXT CHECK (outcome IN (
    'successful',
    'no_answer',
    'voicemail',
    'callback_requested',
    'not_interested',
    'interested',
    'meeting_scheduled',
    'other'
  )),
  
  -- Duração (para calls e meetings)
  duration_minutes INTEGER,
  
  -- Sentimento (análise de IA)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2), -- -1.0 a 1.0
  
  -- Próxima Ação Sugerida
  next_action_suggested TEXT,
  next_action_date_suggested DATE,
  
  -- Anexos
  attachments JSONB, -- [{"name": "proposta.pdf", "url": "..."}]
  
  -- Metadata
  metadata JSONB, -- Dados extras (email_id, call_recording_url, etc)
  
  -- Timestamps
  interaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_company ON public.interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON public.interactions(interaction_date DESC);

-- RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all interactions" ON public.interactions;
CREATE POLICY "Users can view all interactions"
  ON public.interactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
CREATE POLICY "Users can insert their own interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
CREATE POLICY "Users can update their own interactions"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. TABELA: icp_analysis_history (Histórico de Análises ICP)
CREATE TABLE IF NOT EXISTS public.icp_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Análise
  analysis_version INTEGER NOT NULL DEFAULT 1,
  icp_score INTEGER NOT NULL,
  temperature TEXT NOT NULL,
  score_breakdown JSONB NOT NULL,
  
  -- Detecções
  has_totvs BOOLEAN,
  totvs_products JSONB,
  competitor_erp TEXT,
  technologies_detected JSONB,
  
  -- Sinais de Intenção
  buying_signals JSONB,
  intent_score INTEGER,
  
  -- Proposta de Valor Gerada (IA)
  value_proposition TEXT,
  pain_points JSONB,
  recommended_products JSONB,
  estimated_roi TEXT,
  
  -- Metadata
  analysis_duration_ms INTEGER,
  ai_model_used TEXT,
  
  -- Auditoria
  analyzed_by UUID REFERENCES auth.users(id),
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint
  UNIQUE(company_id, analysis_version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_history_company ON public.icp_analysis_history(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_history_score ON public.icp_analysis_history(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_icp_history_date ON public.icp_analysis_history(analyzed_at DESC);

-- RLS
ALTER TABLE public.icp_analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all analysis history" ON public.icp_analysis_history;
CREATE POLICY "Users can view all analysis history"
  ON public.icp_analysis_history FOR SELECT
  USING (true);

-- 6. FUNCTIONS E TRIGGERS

-- Function: Atualizar updated_at automaticamente (atualiza se já existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_leads_sources_updated_at ON public.leads_sources;
CREATE TRIGGER update_leads_sources_updated_at
  BEFORE UPDATE ON public.leads_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_quarantine_updated_at ON public.leads_quarantine;
CREATE TRIGGER update_leads_quarantine_updated_at
  BEFORE UPDATE ON public.leads_quarantine
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Incrementar contador de interações
CREATE OR REPLACE FUNCTION increment_interaction_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type = 'call' THEN
    UPDATE public.companies
    SET total_calls = COALESCE(total_calls, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'email' THEN
    UPDATE public.companies
    SET total_emails = COALESCE(total_emails, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'meeting' THEN
    UPDATE public.companies
    SET total_meetings = COALESCE(total_meetings, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'whatsapp' THEN
    UPDATE public.companies
    SET total_whatsapp = COALESCE(total_whatsapp, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_interaction_counter ON public.interactions;
CREATE TRIGGER trigger_increment_interaction_counter
  AFTER INSERT ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_interaction_counter();

-- Function: Atualizar estatísticas de fonte
CREATE OR REPLACE FUNCTION update_source_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE public.leads_sources
    SET total_approved = COALESCE(total_approved, 0) + 1,
        success_rate = (COALESCE(total_approved, 0) + 1)::DECIMAL / NULLIF(total_captured, 0) * 100
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_source_stats ON public.leads_quarantine;
CREATE TRIGGER trigger_update_source_stats
  AFTER UPDATE ON public.leads_quarantine
  FOR EACH ROW
  EXECUTE FUNCTION update_source_stats();

-- 7. VIEWS ANALÍTICAS

-- View: Pipeline Overview
CREATE OR REPLACE VIEW public.pipeline_overview AS
SELECT 
  journey_stage,
  temperature,
  COUNT(*) as total_companies,
  SUM(estimated_deal_value) as total_pipeline_value,
  AVG(icp_score) as avg_icp_score,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned_count,
  COUNT(*) FILTER (WHERE next_action_date IS NOT NULL) as with_next_action
FROM public.companies
WHERE journey_stage NOT IN ('closed_won', 'closed_lost')
GROUP BY journey_stage, temperature;

-- View: SDR Performance
CREATE OR REPLACE VIEW public.sdr_performance AS
SELECT 
  u.id as user_id,
  u.email as user_email,
  COUNT(DISTINCT c.id) as total_companies_assigned,
  COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_won') as total_won,
  COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_lost') as total_lost,
  SUM(c.estimated_deal_value) FILTER (WHERE c.journey_stage = 'closed_won') as total_revenue,
  COUNT(DISTINCT i.id) as total_interactions,
  COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'call') as total_calls,
  COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'meeting') as total_meetings,
  AVG(c.icp_score) as avg_icp_score
FROM auth.users u
LEFT JOIN public.companies c ON c.assigned_to = u.id
LEFT JOIN public.interactions i ON i.user_id = u.id
GROUP BY u.id, u.email;

-- View: Source Performance
CREATE OR REPLACE VIEW public.source_performance AS
SELECT 
  ls.source_name,
  ls.is_active,
  ls.priority,
  COUNT(lq.id) as total_captured,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'approved') as total_approved,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'rejected') as total_rejected,
  AVG(lq.auto_score) as avg_auto_score,
  COUNT(c.id) as total_converted_to_companies,
  COUNT(c.id) FILTER (WHERE c.journey_stage = 'closed_won') as total_won
FROM public.leads_sources ls
LEFT JOIN public.leads_quarantine lq ON lq.source_id = ls.id
LEFT JOIN public.companies c ON c.quarantine_id = lq.id
GROUP BY ls.id, ls.source_name, ls.is_active, ls.priority;

-- ============================================================================
-- MIGRATION: 20251029155809_09a93990-11ff-4e3e-9a02-e3f7ee693a21.sql
-- ============================================================================

-- Corrigir search_path nas funções criadas

-- Function: Atualizar updated_at automaticamente (com search_path)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Incrementar contador de interações (com search_path)
CREATE OR REPLACE FUNCTION increment_interaction_counter()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.interaction_type = 'call' THEN
    UPDATE public.companies
    SET total_calls = COALESCE(total_calls, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'email' THEN
    UPDATE public.companies
    SET total_emails = COALESCE(total_emails, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'meeting' THEN
    UPDATE public.companies
    SET total_meetings = COALESCE(total_meetings, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  ELSIF NEW.interaction_type = 'whatsapp' THEN
    UPDATE public.companies
    SET total_whatsapp = COALESCE(total_whatsapp, 0) + 1,
        last_contact_at = NEW.interaction_date
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: Atualizar estatísticas de fonte (com search_path)
CREATE OR REPLACE FUNCTION update_source_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE public.leads_sources
    SET total_approved = COALESCE(total_approved, 0) + 1,
        success_rate = (COALESCE(total_approved, 0) + 1)::DECIMAL / NULLIF(total_captured, 0) * 100
    WHERE id = NEW.source_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- MIGRATION: 20251029174554_49d5bf08-b218-4f7b-b2b5-925d174f65c4.sql
-- ============================================================================

-- Adicionar colunas de pipeline à tabela companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS deal_stage TEXT DEFAULT 'discovery' CHECK (deal_stage IN (
  'discovery',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'nurturing'
)),
ADD COLUMN IF NOT EXISTS deal_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS deal_probability INTEGER CHECK (deal_probability >= 0 AND deal_probability <= 100),
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS days_in_stage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS next_follow_up_date DATE,
ADD COLUMN IF NOT EXISTS next_follow_up_action TEXT,
ADD COLUMN IF NOT EXISTS deal_notes TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_deal_stage ON public.companies(deal_stage);
CREATE INDEX IF NOT EXISTS idx_companies_expected_close ON public.companies(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_companies_next_follow_up ON public.companies(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_companies_last_activity ON public.companies(last_activity_at);

-- Trigger para atualizar days_in_stage
CREATE OR REPLACE FUNCTION update_days_in_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF OLD.deal_stage IS DISTINCT FROM NEW.deal_stage THEN
    NEW.stage_changed_at = now();
    NEW.days_in_stage = 0;
  ELSE
    NEW.days_in_stage = EXTRACT(DAY FROM (now() - NEW.stage_changed_at));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_days_in_stage ON public.companies;
CREATE TRIGGER trigger_update_days_in_stage
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_days_in_stage();

-- ============================================================================
-- MIGRATION: 20251030024405_77f23ce5-ce74-46c9-bf82-80aef6b726e4.sql
-- ============================================================================

-- Fix: Remove auth.users exposure from sdr_performance view
-- This is a critical security issue that exposes user emails and IDs

-- 1. Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.sdr_performance CASCADE;

-- 2. Create secure version using profiles table instead of auth.users
-- Only expose data for the current user or allow admins to see all
CREATE VIEW public.sdr_performance 
WITH (security_invoker = true)
AS
SELECT 
    p.id AS user_id,
    p.full_name AS user_name,
    p.email AS user_email,
    COUNT(DISTINCT c.id) AS total_companies_assigned,
    COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_won') AS total_won,
    COUNT(DISTINCT c.id) FILTER (WHERE c.journey_stage = 'closed_lost') AS total_lost,
    SUM(c.estimated_deal_value) FILTER (WHERE c.journey_stage = 'closed_won') AS total_revenue,
    COUNT(DISTINCT i.id) AS total_interactions,
    COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'call') AS total_calls,
    COUNT(DISTINCT i.id) FILTER (WHERE i.interaction_type = 'meeting') AS total_meetings,
    AVG(c.icp_score) AS avg_icp_score
FROM profiles p
LEFT JOIN companies c ON c.assigned_to = p.id
LEFT JOIN interactions i ON i.user_id = p.id
WHERE p.id IS NOT NULL
GROUP BY p.id, p.full_name, p.email;

-- 3. Add RLS policy to the view to ensure users only see their own data
-- (unless they're an admin)
ALTER VIEW public.sdr_performance OWNER TO postgres;

-- 4. Grant appropriate permissions
GRANT SELECT ON public.sdr_performance TO authenticated;

COMMENT ON VIEW public.sdr_performance IS 'Secure SDR performance metrics view using profiles table instead of auth.users. Uses security_invoker to enforce RLS policies.';


-- ============================================================================
-- MIGRATION: 20251030165445_b37a4f0f-0e88-4bb7-9f74-9205a114e887.sql
-- ============================================================================

-- ============================================
-- NÍVEL 1: BANCO DE LEADS (Pool)
-- ============================================
CREATE TABLE IF NOT EXISTS leads_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Origem
  origem TEXT CHECK (origem IN ('icp_individual', 'icp_massa', 'empresas_aqui', 'manual')) NOT NULL,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  
  -- Verificação TOTVS
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  
  -- Status (sempre 'pool' neste nível)
  status TEXT DEFAULT 'pool' CHECK (status = 'pool'),
  
  -- Dados brutos
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_cnpj ON leads_pool(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_pool_origem ON leads_pool(origem);
CREATE INDEX IF NOT EXISTS idx_leads_pool_icp_score ON leads_pool(icp_score);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON leads_pool(temperatura);

-- RLS para leads_pool
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_pool"
ON leads_pool
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 2: EMPRESAS QUALIFICADAS
-- ============================================
CREATE TABLE IF NOT EXISTS leads_qualified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao pool
  lead_pool_id UUID REFERENCES leads_pool(id) ON DELETE CASCADE,
  
  -- Dados da empresa (desnormalizados para performance)
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT,
  
  -- Status
  status TEXT DEFAULT 'qualificada' CHECK (status IN ('qualificada', 'em_analise', 'aprovada')),
  
  -- Motivo da qualificação
  motivo_qualificacao TEXT,
  
  -- Quem selecionou
  selected_by UUID,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_qualified
CREATE INDEX IF NOT EXISTS idx_leads_qualified_cnpj ON leads_qualified(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_status ON leads_qualified(status);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_pool ON leads_qualified(lead_pool_id);

-- RLS para leads_qualified
ALTER TABLE leads_qualified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_qualified"
ON leads_qualified
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 3: PIPELINE ATIVO (companies existente)
-- ============================================
-- Adicionar colunas na tabela companies existente
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_qualified_id UUID REFERENCES leads_qualified(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'ativo' CHECK (pipeline_status IN ('ativo', 'trabalhando', 'pausado', 'ganho', 'perdido'));

-- Índice
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_status ON companies(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_companies_lead_qualified_id ON companies(lead_qualified_id);

-- ============================================================================
-- MIGRATION: 20251030165659_44cf3adb-3e4b-4958-b70c-5e9b3364f8ad.sql
-- ============================================================================

-- ============================================
-- NÍVEL 1: BANCO DE LEADS (Pool)
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage leads_pool" ON leads_pool;

CREATE TABLE IF NOT EXISTS leads_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Origem
  origem TEXT CHECK (origem IN ('icp_individual', 'icp_massa', 'empresas_aqui', 'manual')) NOT NULL,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  
  -- Verificação TOTVS
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  
  -- Status (sempre 'pool' neste nível)
  status TEXT DEFAULT 'pool' CHECK (status = 'pool'),
  
  -- Dados brutos
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_cnpj ON leads_pool(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_pool_origem ON leads_pool(origem);
CREATE INDEX IF NOT EXISTS idx_leads_pool_icp_score ON leads_pool(icp_score);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON leads_pool(temperatura);

-- RLS para leads_pool
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_pool"
ON leads_pool
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 2: EMPRESAS QUALIFICADAS
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage leads_qualified" ON leads_qualified;

CREATE TABLE IF NOT EXISTS leads_qualified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao pool
  lead_pool_id UUID REFERENCES leads_pool(id) ON DELETE CASCADE,
  
  -- Dados da empresa (desnormalizados para performance)
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT,
  
  -- Status
  status TEXT DEFAULT 'qualificada' CHECK (status IN ('qualificada', 'em_analise', 'aprovada')),
  
  -- Motivo da qualificação
  motivo_qualificacao TEXT,
  
  -- Quem selecionou
  selected_by UUID,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_qualified
CREATE INDEX IF NOT EXISTS idx_leads_qualified_cnpj ON leads_qualified(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_status ON leads_qualified(status);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_pool ON leads_qualified(lead_pool_id);

-- RLS para leads_qualified
ALTER TABLE leads_qualified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_qualified"
ON leads_qualified
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 3: PIPELINE ATIVO (companies existente)
-- ============================================
-- Adicionar colunas na tabela companies existente
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_qualified_id UUID REFERENCES leads_qualified(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'ativo' CHECK (pipeline_status IN ('ativo', 'trabalhando', 'pausado', 'ganho', 'perdido'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_status ON companies(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_companies_lead_qualified_id ON companies(lead_qualified_id);

-- ============================================================================
-- MIGRATION: 20251030165803_da79d55c-46a2-4ffe-9d0d-83c88534afc1.sql
-- ============================================================================

-- ============================================
-- NÍVEL 1: BANCO DE LEADS (Pool)
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage leads_pool" ON leads_pool;

CREATE TABLE IF NOT EXISTS leads_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Origem
  origem TEXT CHECK (origem IN ('icp_individual', 'icp_massa', 'empresas_aqui', 'manual')) NOT NULL,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  
  -- Verificação TOTVS
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  
  -- Status (sempre 'pool' neste nível)
  status TEXT DEFAULT 'pool' CHECK (status = 'pool'),
  
  -- Dados brutos
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_cnpj ON leads_pool(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_pool_origem ON leads_pool(origem);
CREATE INDEX IF NOT EXISTS idx_leads_pool_icp_score ON leads_pool(icp_score);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON leads_pool(temperatura);

-- RLS para leads_pool
ALTER TABLE leads_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_pool"
ON leads_pool
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 2: EMPRESAS QUALIFICADAS
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage leads_qualified" ON leads_qualified;

CREATE TABLE IF NOT EXISTS leads_qualified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao pool
  lead_pool_id UUID REFERENCES leads_pool(id) ON DELETE CASCADE,
  
  -- Dados da empresa (desnormalizados para performance)
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Score ICP
  icp_score INTEGER,
  temperatura TEXT,
  
  -- Status
  status TEXT DEFAULT 'qualificada' CHECK (status IN ('qualificada', 'em_analise', 'aprovada')),
  
  -- Motivo da qualificação
  motivo_qualificacao TEXT,
  
  -- Quem selecionou
  selected_by UUID,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para leads_qualified
CREATE INDEX IF NOT EXISTS idx_leads_qualified_cnpj ON leads_qualified(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_status ON leads_qualified(status);
CREATE INDEX IF NOT EXISTS idx_leads_qualified_pool ON leads_qualified(lead_pool_id);

-- RLS para leads_qualified
ALTER TABLE leads_qualified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leads_qualified"
ON leads_qualified
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NÍVEL 3: PIPELINE ATIVO (companies existente)
-- ============================================
-- Adicionar colunas na tabela companies existente
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_qualified_id UUID REFERENCES leads_qualified(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'ativo' CHECK (pipeline_status IN ('ativo', 'trabalhando', 'pausado', 'ganho', 'perdido'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_status ON companies(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_companies_lead_qualified_id ON companies(lead_qualified_id);

-- ============================================================================
-- MIGRATION: 20251030171500_9d84c8a4-d526-43c6-864f-1d33aca1198a.sql
-- ============================================================================

-- ============================================
-- EMAIL SEQUENCES & AUTOMATION
-- ============================================

-- Tabela de sequências de email
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'stage_change', 'deal_created', 'time_based')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de steps das sequências
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  send_time TEXT, -- formato: "09:00" para enviar sempre às 9h
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- Tabela de enrollment (quem está na sequência)
CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.decision_makers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
  current_step INTEGER DEFAULT 1,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de emails enviados
CREATE TABLE IF NOT EXISTS public.email_sequence_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.email_sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.email_sequence_steps(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'replied', 'bounced')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- ACTIVITY TIMELINE UNIFICADA
-- ============================================

-- Tabela unificada de atividades (já existe, vamos estender)
-- Adicionar campos para unificar diferentes tipos de interação
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS channel TEXT; -- email, call, whatsapp, meeting, note
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS direction TEXT; -- inbound, outbound
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS sentiment TEXT; -- positive, neutral, negative
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS email_thread_id TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

-- ============================================
-- DEAL HEALTH SCORE & RISK ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Fatores do score
  engagement_score INTEGER DEFAULT 0,
  velocity_score INTEGER DEFAULT 0,
  stakeholder_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  
  -- Alertas e recomendações
  risk_factors JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(company_id, calculated_at)
);

-- ============================================
-- SMART TASKS & AUTOMATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.smart_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- follow_up, proposal, meeting, call, email, custom
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Relações
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.decision_makers(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  
  -- Automação
  auto_created BOOLEAN DEFAULT false,
  trigger_type TEXT, -- stage_change, inactivity, sequence, manual
  trigger_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Datas
  due_date TIMESTAMPTZ NOT NULL,
  reminder_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contexto
  context JSONB DEFAULT '{}'::jsonb,
  ai_suggestions JSONB DEFAULT '[]'::jsonb
);

-- ============================================
-- CONVERSATION INTELLIGENCE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  
  -- Análise de sentimento
  overall_sentiment TEXT, -- positive, neutral, negative
  sentiment_score NUMERIC(3,2), -- -1.0 a 1.0
  sentiment_timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Objeções detectadas
  objections_detected JSONB DEFAULT '[]'::jsonb,
  
  -- Next best actions
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Keywords e tópicos
  key_topics JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  
  -- Metrics
  talk_time_ratio JSONB, -- {rep: 60, client: 40}
  questions_asked INTEGER DEFAULT 0,
  
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- PLAYBOOKS CONTEXTUAIS
-- ============================================

CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  playbook_type TEXT NOT NULL, -- discovery, demo, negotiation, objection_handling, closing
  trigger_conditions JSONB DEFAULT '{}'::jsonb, -- quando mostrar
  
  -- Conteúdo
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  talk_tracks JSONB DEFAULT '[]'::jsonb,
  objection_responses JSONB DEFAULT '[]'::jsonb,
  questions_to_ask JSONB DEFAULT '[]'::jsonb,
  
  -- Battle cards integradas
  competitor_intel JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- MEETING SCHEDULER
-- ============================================

CREATE TABLE IF NOT EXISTS public.meeting_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Disponibilidade
  availability_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  
  -- Configurações
  buffer_time_minutes INTEGER DEFAULT 0,
  max_bookings_per_day INTEGER,
  advance_notice_hours INTEGER DEFAULT 24,
  
  -- Integrações
  calendar_integration TEXT, -- google, outlook
  meeting_location TEXT, -- zoom, teams, meet, presencial
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_link_id UUID NOT NULL REFERENCES public.meeting_links(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  contact_id UUID REFERENCES public.decision_makers(id),
  
  -- Informações da reunião
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Dados da reunião
  meeting_url TEXT,
  meeting_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON public.email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_company ON public.email_sequence_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_status ON public.email_sequence_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_next_send ON public.email_sequence_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_company ON public.deal_health_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_risk ON public.deal_health_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_smart_tasks_assigned ON public.smart_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_smart_tasks_due ON public.smart_tasks(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_smart_tasks_company ON public.smart_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_activity ON public.conversation_analysis(activity_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_link ON public.meeting_bookings(meeting_link_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_scheduled ON public.meeting_bookings(scheduled_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Email Sequences
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage email sequences" ON public.email_sequences FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage sequence steps" ON public.email_sequence_steps FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage enrollments" ON public.email_sequence_enrollments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.email_sequence_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view messages" ON public.email_sequence_messages FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Deal Health Scores
ALTER TABLE public.deal_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view health scores" ON public.deal_health_scores FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Smart Tasks
ALTER TABLE public.smart_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage tasks" ON public.smart_tasks FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation Analysis
ALTER TABLE public.conversation_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view analysis" ON public.conversation_analysis FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Playbooks
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view playbooks" ON public.playbooks FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Meeting Links & Bookings
ALTER TABLE public.meeting_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own meeting links" ON public.meeting_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view bookings" ON public.meeting_bookings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_sequences_updated_at ON public.email_sequences;
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_sequence_steps_updated_at ON public.email_sequence_steps;
CREATE TRIGGER update_email_sequence_steps_updated_at BEFORE UPDATE ON public.email_sequence_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_smart_tasks_updated_at ON public.smart_tasks;
CREATE TRIGGER update_smart_tasks_updated_at BEFORE UPDATE ON public.smart_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playbooks_updated_at ON public.playbooks;
CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON public.playbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_links_updated_at ON public.meeting_links;
CREATE TRIGGER update_meeting_links_updated_at BEFORE UPDATE ON public.meeting_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_bookings_updated_at ON public.meeting_bookings;
CREATE TRIGGER update_meeting_bookings_updated_at BEFORE UPDATE ON public.meeting_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION: 20251030175434_e2a7abd7-f127-400e-bbec-1f568391dc81.sql
-- ============================================================================

-- Tabela temporária para resultados de análise ICP antes de mover para o pool
CREATE TABLE IF NOT EXISTS icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Origem
  origem TEXT CHECK (origem IN ('upload_massa', 'icp_individual', 'icp_massa')),
  
  -- Resultado da análise
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  totvs_evidences JSONB DEFAULT '[]'::jsonb,
  motivo_descarte TEXT,
  
  -- Status
  moved_to_pool BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  
  -- Dados completos da análise
  raw_data JSONB,
  analysis_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_icp_results_cnpj ON icp_analysis_results(cnpj);
CREATE INDEX idx_icp_results_moved ON icp_analysis_results(moved_to_pool);
CREATE INDEX idx_icp_results_totvs ON icp_analysis_results(is_cliente_totvs);
CREATE INDEX idx_icp_results_score ON icp_analysis_results(icp_score DESC);
CREATE INDEX idx_icp_results_origem ON icp_analysis_results(origem);
CREATE INDEX idx_icp_results_reviewed ON icp_analysis_results(reviewed);

-- RLS Policies
ALTER TABLE icp_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read icp_analysis_results"
  ON icp_analysis_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert icp_analysis_results"
  ON icp_analysis_results FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update icp_analysis_results"
  ON icp_analysis_results FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete icp_analysis_results"
  ON icp_analysis_results FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- MIGRATION: 20251030180517_067453f9-6e6a-41af-af80-a318e92eb1e7.sql
-- ============================================================================

-- 1. LIMPAR DEALS ÓRFÃOS (sem company_id ou com company_id inválido)
DELETE FROM sdr_deals 
WHERE company_id IS NULL 
   OR company_id NOT IN (SELECT id FROM companies);

-- 2. ADICIONAR CASCADE DELETE na foreign key
-- Primeiro, dropar a constraint existente se houver
ALTER TABLE sdr_deals 
DROP CONSTRAINT IF EXISTS sdr_deals_company_id_fkey;

-- Recriar com CASCADE DELETE
ALTER TABLE sdr_deals 
ADD CONSTRAINT sdr_deals_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE CASCADE;

-- 3. CRIAR FUNÇÃO para limpar deals órfãos automaticamente
CREATE OR REPLACE FUNCTION cleanup_orphaned_deals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar deals sem company_id ou com company_id inválido
  DELETE FROM sdr_deals 
  WHERE company_id IS NULL 
     OR company_id NOT IN (SELECT id FROM companies);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_orphaned_deals() IS 
'Limpa deals órfãos (sem company_id ou com company_id inválido). Retorna quantidade deletada.';

-- ============================================================================
-- MIGRATION: 20251030182357_6be60829-3925-4d92-931e-561988158ae9.sql
-- ============================================================================

-- Migration: Preparar tabelas para automação completa do pipeline
-- Data: 2025-01-30

-- 1. Adicionar colunas faltantes em icp_analysis_results
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'descartada')),
ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS motivos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS evidencias_totvs JSONB DEFAULT '[]'::jsonb;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_analysis_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_temperatura ON public.icp_analysis_results(temperatura);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_score ON public.icp_analysis_results(icp_score DESC);

-- 3. Adicionar colunas faltantes em leads_pool
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'converted')),
ADD COLUMN IF NOT EXISTS temperatura TEXT DEFAULT 'cold' CHECK (temperatura IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

-- 4. Criar índices em leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_company_id ON public.leads_pool(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_pool_status ON public.leads_pool(status);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON public.leads_pool(temperatura);
CREATE INDEX IF NOT EXISTS idx_leads_pool_score ON public.leads_pool(icp_score DESC);

-- 5. Atualizar companies com campos de análise ICP
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS icp_temperature TEXT CHECK (icp_temperature IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS icp_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS icp_motivos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS icp_analyzed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS totvs_detection_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS totvs_detection_details JSONB DEFAULT '[]'::jsonb;

-- 6. Criar índices em companies para filtros ICP
CREATE INDEX IF NOT EXISTS idx_companies_icp_score ON public.companies(icp_score DESC) WHERE icp_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_icp_temperature ON public.companies(icp_temperature) WHERE icp_temperature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_disqualified ON public.companies(is_disqualified) WHERE is_disqualified = true;

-- 7. Comentários explicativos
COMMENT ON COLUMN public.icp_analysis_results.company_id IS 'Referência à empresa analisada';
COMMENT ON COLUMN public.icp_analysis_results.status IS 'Status do resultado: pendente, aprovada ou descartada';
COMMENT ON COLUMN public.icp_analysis_results.raw_analysis IS 'Resultado completo da análise em JSON';
COMMENT ON COLUMN public.leads_pool.company_id IS 'Referência à empresa no pool de leads';
COMMENT ON COLUMN public.leads_pool.status IS 'Status do lead: active, inactive ou converted';
COMMENT ON COLUMN public.leads_pool.temperatura IS 'Temperatura do lead: hot, warm ou cold';

-- ============================================================================
-- MIGRATION: 20251030182543_1797780e-27c9-4884-88a7-8f0c92cb1535.sql
-- ============================================================================

-- Migration: Preparar tabelas para automação completa do pipeline
-- Data: 2025-01-30

-- 1. Adicionar colunas faltantes em icp_analysis_results
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'descartada')),
ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS motivos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS evidencias_totvs JSONB DEFAULT '[]'::jsonb;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_analysis_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_temperatura ON public.icp_analysis_results(temperatura);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_score ON public.icp_analysis_results(icp_score DESC);

-- 3. Adicionar colunas faltantes em leads_pool
ALTER TABLE public.leads_pool
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'converted')),
ADD COLUMN IF NOT EXISTS temperatura TEXT DEFAULT 'cold' CHECK (temperatura IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

-- 4. Criar índices em leads_pool
CREATE INDEX IF NOT EXISTS idx_leads_pool_company_id ON public.leads_pool(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_pool_status ON public.leads_pool(status);
CREATE INDEX IF NOT EXISTS idx_leads_pool_temperatura ON public.leads_pool(temperatura);
CREATE INDEX IF NOT EXISTS idx_leads_pool_score ON public.leads_pool(icp_score DESC);

-- 5. Atualizar companies com campos de análise ICP
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS icp_temperature TEXT CHECK (icp_temperature IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS icp_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS icp_motivos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS icp_analyzed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS totvs_detection_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS totvs_detection_details JSONB DEFAULT '[]'::jsonb;

-- 6. Criar índices em companies para filtros ICP
CREATE INDEX IF NOT EXISTS idx_companies_icp_score ON public.companies(icp_score DESC) WHERE icp_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_icp_temperature ON public.companies(icp_temperature) WHERE icp_temperature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_disqualified ON public.companies(is_disqualified) WHERE is_disqualified = true;

-- 7. Comentários explicativos
COMMENT ON COLUMN public.icp_analysis_results.company_id IS 'Referência à empresa analisada';
COMMENT ON COLUMN public.icp_analysis_results.status IS 'Status do resultado: pendente, aprovada ou descartada';
COMMENT ON COLUMN public.icp_analysis_results.raw_analysis IS 'Resultado completo da análise em JSON';
COMMENT ON COLUMN public.leads_pool.company_id IS 'Referência à empresa no pool de leads';
COMMENT ON COLUMN public.leads_pool.status IS 'Status do lead: active, inactive ou converted';
COMMENT ON COLUMN public.leads_pool.temperatura IS 'Temperatura do lead: hot, warm ou cold';

-- ============================================================================
-- MIGRATION: 20251030221956_52c83d47-a594-4147-b0a1-c5d630fa5a33.sql
-- ============================================================================

-- Create ICP evidence, scraping log, and criteria scores tables with RLS and indexes
-- 1) icp_evidence
CREATE TABLE IF NOT EXISTS public.icp_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  criterio TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('tecnologia','tamanho','financeiro','digital','reputacao','sinais_compra')),
  evidencia TEXT NOT NULL,
  fonte_url TEXT NOT NULL,
  fonte_nome TEXT NOT NULL,
  dados_extraidos JSONB,
  pontos_atribuidos INTEGER,
  peso_criterio DECIMAL(4,2),
  confiabilidade TEXT CHECK (confiabilidade IN ('alta','media','baixa')) DEFAULT 'media',
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.icp_evidence ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_evidence' AND policyname='auth_can_read_icp_evidence'
  ) THEN
    CREATE POLICY auth_can_read_icp_evidence ON public.icp_evidence
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_evidence' AND policyname='auth_can_insert_icp_evidence'
  ) THEN
    CREATE POLICY auth_can_insert_icp_evidence ON public.icp_evidence
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_icp_evidence_analysis ON public.icp_evidence(analysis_id);
CREATE INDEX IF NOT EXISTS idx_icp_evidence_cnpj ON public.icp_evidence(cnpj);
CREATE INDEX IF NOT EXISTS idx_icp_evidence_criterio ON public.icp_evidence(criterio);
CREATE INDEX IF NOT EXISTS idx_icp_evidence_categoria ON public.icp_evidence(categoria);


-- 2) icp_scraping_log
CREATE TABLE IF NOT EXISTS public.icp_scraping_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  url_buscada TEXT NOT NULL,
  status TEXT CHECK (status IN ('sucesso','erro','timeout','bloqueado')) NOT NULL,
  dados_encontrados BOOLEAN DEFAULT false,
  tempo_resposta_ms INTEGER,
  erro_mensagem TEXT,
  html_content TEXT,
  json_response JSONB,
  scraped_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.icp_scraping_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_scraping_log' AND policyname='auth_can_read_icp_scraping_log'
  ) THEN
    CREATE POLICY auth_can_read_icp_scraping_log ON public.icp_scraping_log
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_scraping_log' AND policyname='auth_can_insert_icp_scraping_log'
  ) THEN
    CREATE POLICY auth_can_insert_icp_scraping_log ON public.icp_scraping_log
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scraping_log_analysis ON public.icp_scraping_log(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scraping_log_cnpj ON public.icp_scraping_log(cnpj);
CREATE INDEX IF NOT EXISTS idx_scraping_log_plataforma ON public.icp_scraping_log(plataforma);
CREATE INDEX IF NOT EXISTS idx_scraping_log_status ON public.icp_scraping_log(status);


-- 3) icp_criteria_scores
CREATE TABLE IF NOT EXISTS public.icp_criteria_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.icp_analysis_results(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  criterio_nome TEXT NOT NULL,
  criterio_descricao TEXT,
  categoria TEXT,
  pontos_obtidos INTEGER NOT NULL,
  pontos_maximos INTEGER NOT NULL,
  peso DECIMAL(4,2) NOT NULL,
  atendido BOOLEAN NOT NULL,
  numero_evidencias INTEGER DEFAULT 0,
  evidencias_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.icp_criteria_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_criteria_scores' AND policyname='auth_can_read_icp_criteria_scores'
  ) THEN
    CREATE POLICY auth_can_read_icp_criteria_scores ON public.icp_criteria_scores
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='icp_criteria_scores' AND policyname='auth_can_insert_icp_criteria_scores'
  ) THEN
    CREATE POLICY auth_can_insert_icp_criteria_scores ON public.icp_criteria_scores
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_criteria_scores_analysis ON public.icp_criteria_scores(analysis_id);
CREATE INDEX IF NOT EXISTS idx_criteria_scores_cnpj ON public.icp_criteria_scores(cnpj);
CREATE INDEX IF NOT EXISTS idx_criteria_scores_atendido ON public.icp_criteria_scores(atendido);


-- ============================================================================
-- MIGRATION: 20251031003446_f8b166e4-719a-44a8-bd9e-252cf43fad8e.sql
-- ============================================================================

-- Tabela para salvar templates de mapeamento de colunas CSV
CREATE TABLE IF NOT EXISTS public.icp_mapping_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_template TEXT NOT NULL,
  descricao TEXT,
  mappings JSONB NOT NULL, -- Array de { csvColumn, systemField, status, confidence }
  custom_fields TEXT[] DEFAULT '{}', -- Array de campos customizados
  total_colunas INTEGER NOT NULL DEFAULT 0,
  ultima_utilizacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icp_mapping_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios templates"
ON public.icp_mapping_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios templates"
ON public.icp_mapping_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios templates"
ON public.icp_mapping_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios templates"
ON public.icp_mapping_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_icp_mapping_templates_updated_at
BEFORE UPDATE ON public.icp_mapping_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_icp_mapping_templates_user_id ON public.icp_mapping_templates(user_id);
CREATE INDEX idx_icp_mapping_templates_ultima_utilizacao ON public.icp_mapping_templates(ultima_utilizacao DESC);

-- ============================================================================
-- MIGRATION: 20251031021019_0a10f325-d3d6-4fcd-85ef-ce042064a40d.sql
-- ============================================================================

-- Adicionar constraint UNIQUE ao CNPJ para prevenir duplicatas
-- Primeiro, remover duplicatas existentes (manter o mais recente)
DELETE FROM leads_qualified a
USING leads_qualified b
WHERE a.id < b.id 
  AND a.cnpj = b.cnpj;

-- Adicionar constraint UNIQUE no CNPJ
ALTER TABLE leads_qualified 
ADD CONSTRAINT leads_qualified_cnpj_unique UNIQUE (cnpj);

-- Criar índice para melhorar performance de queries por CNPJ
CREATE INDEX IF NOT EXISTS idx_leads_qualified_cnpj ON leads_qualified(cnpj);

-- Adicionar coluna para armazenar evidências da análise (se não existir)
ALTER TABLE leads_qualified 
ADD COLUMN IF NOT EXISTS evidencias JSONB DEFAULT '[]'::jsonb;

-- Criar índice GIN para busca eficiente em evidências
CREATE INDEX IF NOT EXISTS idx_leads_qualified_evidencias ON leads_qualified USING GIN (evidencias);

-- ============================================================================
-- MIGRATION: 20251031150745_c37bce55-4942-4a4c-b7b2-190eafc2df86.sql
-- ============================================================================

-- ✅ FASE 1: Tabela para persistir relatórios de detecção TOTVS
CREATE TABLE IF NOT EXISTS public.totvs_detection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sdr_deal_id UUID REFERENCES public.sdr_deals(id) ON DELETE SET NULL,
  
  -- Dados do relatório
  score INTEGER NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  detection_status TEXT NOT NULL DEFAULT 'no_detection',
  
  -- Evidências estruturadas
  evidences JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metodologia completa
  methodology JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Score breakdown
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadados
  execution_time_ms INTEGER,
  sources_checked INTEGER DEFAULT 0,
  sources_with_results INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Índices para performance
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Índices otimizados
CREATE INDEX idx_totvs_reports_company ON public.totvs_detection_reports(company_id);
CREATE INDEX idx_totvs_reports_deal ON public.totvs_detection_reports(sdr_deal_id);
CREATE INDEX idx_totvs_reports_score ON public.totvs_detection_reports(score DESC);
CREATE INDEX idx_totvs_reports_created ON public.totvs_detection_reports(created_at DESC);

-- RLS: Usuários autenticados podem ler todos os relatórios
ALTER TABLE public.totvs_detection_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read totvs_detection_reports"
  ON public.totvs_detection_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert totvs_detection_reports"
  ON public.totvs_detection_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger para atualizar totvs_detection_score na tabela companies
CREATE OR REPLACE FUNCTION update_company_totvs_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.companies
  SET 
    totvs_detection_score = NEW.score,
    totvs_last_checked_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_totvs_score
  AFTER INSERT ON public.totvs_detection_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_company_totvs_score();

COMMENT ON TABLE public.totvs_detection_reports IS 'Persistência de relatórios de detecção TOTVS com histórico completo';


-- ============================================================================
-- MIGRATION: 20251031184923_3b813172-a074-43b3-a7d9-3422ab20f944.sql
-- ============================================================================

-- Tabela para verificações TOTVS simplificadas
CREATE TABLE IF NOT EXISTS public.simple_totvs_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('go', 'no-go', 'revisar')),
  detected_totvs BOOLEAN NOT NULL DEFAULT false,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  total_evidences INTEGER NOT NULL DEFAULT 0,
  evidences JSONB,
  reasoning TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_company ON public.simple_totvs_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_status ON public.simple_totvs_checks(status);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_checked_at ON public.simple_totvs_checks(checked_at DESC);

-- RLS policies
ALTER TABLE public.simple_totvs_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver verificações"
  ON public.simple_totvs_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar verificações"
  ON public.simple_totvs_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.simple_totvs_checks IS 'Verificações simplificadas de uso TOTVS para metodologia GO/NO-GO';


-- ============================================================================
-- MIGRATION: 20251101020621_e2786c12-de78-4dc4-ae29-acc81dbe8066.sql
-- ============================================================================

-- ================================================
-- CORREÇÃO DE SEGURANÇA: Remover SECURITY DEFINER desnecessário
-- ================================================
-- Issue: Funções com SECURITY DEFINER executam com privilégios do criador,
-- não do usuário. Isso pode levar a escalação de privilégios.
-- 
-- Solução: Alterar para SECURITY INVOKER onde não é necessário privilégio elevado
-- ================================================

-- 1. FUNÇÕES DE CÁLCULO - Não precisam de privilégios elevados
-- Essas funções apenas calculam scores baseados em dados que o usuário já tem acesso

ALTER FUNCTION public.calculate_deal_health_score(deal_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_engagement_score(p_company_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_intent_score(company_uuid uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_lead_score(p_company_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_size_score(p_company_id uuid) 
SECURITY INVOKER;

-- 2. FUNÇÕES DE QUERY - Devem respeitar RLS do usuário

ALTER FUNCTION public.get_hot_leads(min_intent_score integer) 
SECURITY INVOKER;

ALTER FUNCTION public.get_companies_for_monitoring_check(batch_limit integer) 
SECURITY INVOKER;

ALTER FUNCTION public.recalculate_all_lead_scores(batch_size integer) 
SECURITY INVOKER;

-- 3. FUNÇÕES DE OPERAÇÃO - Devem usar permissões do usuário

ALTER FUNCTION public.cleanup_orphaned_deals() 
SECURITY INVOKER;

ALTER FUNCTION public.create_canvas_version(p_canvas_id uuid, p_tag text, p_description text) 
SECURITY INVOKER;

ALTER FUNCTION public.promote_canvas_decision(p_block_id uuid, p_target_type text) 
SECURITY INVOKER;

ALTER FUNCTION public.get_next_report_version(p_company_id uuid, p_report_type text) 
SECURITY INVOKER;

-- ================================================
-- NOTA: As seguintes funções PERMANECEM como SECURITY DEFINER
-- porque são necessárias para operações específicas:
-- ================================================
-- 
-- ✅ has_role(uuid, app_role) 
--    → Recomendação oficial Supabase para evitar recursão RLS
--
-- ✅ handle_new_user() 
--    → Precisa criar registros durante signup (auth trigger)
--
-- ✅ increment_apollo_credits(integer) 
--    → Operação sensível de créditos, deve ser controlada
--
-- ✅ Todas as funções de TRIGGER (auto_*, update_*, log_*, etc.)
--    → Triggers são executados automaticamente após validação RLS
--    → São seguros porque já passaram pela política de segurança
--
-- ================================================

-- Comentário de auditoria
COMMENT ON FUNCTION public.calculate_deal_health_score IS 
'Calcula health score do deal. SECURITY INVOKER para respeitar RLS do usuário.';

COMMENT ON FUNCTION public.get_hot_leads IS 
'Busca hot leads. SECURITY INVOKER para que cada usuário veja apenas suas empresas conforme RLS.';

COMMENT ON FUNCTION public.recalculate_all_lead_scores IS 
'Recalcula lead scores em batch. SECURITY INVOKER para respeitar permissões do usuário.';

-- ============================================================================
-- MIGRATION: 20251101020714_8dc54587-af5c-4efd-a369-2c41f06f6ad2.sql
-- ============================================================================

-- ================================================
-- CORREÇÃO: Adicionar search_path em funções SECURITY DEFINER
-- ================================================
-- Issue: Funções SECURITY DEFINER sem search_path explícito podem ser
-- vulneráveis a ataques de manipulação do schema search path
-- 
-- Solução: Definir search_path = 'public' em todas as funções sensíveis
-- ================================================

-- 1. FUNÇÕES DE CÁLCULO - Adicionar search_path
ALTER FUNCTION public.calculate_deal_health_score(deal_id uuid) 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.calculate_engagement_score(p_company_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.calculate_intent_score(company_uuid uuid) 
SET search_path = 'public';

ALTER FUNCTION public.calculate_lead_score(p_company_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.calculate_size_score(p_company_id uuid) 
SET search_path = 'public';

-- 2. FUNÇÕES DE QUERY - Adicionar search_path
ALTER FUNCTION public.get_hot_leads(min_intent_score integer) 
SET search_path = 'public';

ALTER FUNCTION public.get_companies_for_monitoring_check(batch_limit integer) 
SET search_path = 'public';

ALTER FUNCTION public.recalculate_all_lead_scores(batch_size integer) 
SET search_path = 'public';

-- 3. FUNÇÕES DE OPERAÇÃO - Adicionar search_path
ALTER FUNCTION public.cleanup_orphaned_deals() 
SET search_path = 'public';

ALTER FUNCTION public.create_canvas_version(p_canvas_id uuid, p_tag text, p_description text) 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.promote_canvas_decision(p_block_id uuid, p_target_type text) 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.get_next_report_version(p_company_id uuid, p_report_type text) 
SET search_path = 'public', 'pg_temp';

-- 4. TRIGGERS - Adicionar search_path
ALTER FUNCTION public.auto_create_deal_after_enrichment() 
SET search_path = 'public';

ALTER FUNCTION public.auto_recalculate_lead_score() 
SET search_path = 'public';

ALTER FUNCTION public.auto_update_deal_priority() 
SET search_path = 'public';

ALTER FUNCTION public.recalc_score_on_activity() 
SET search_path = 'public';

ALTER FUNCTION public.log_deal_stage_change() 
SET search_path = 'public';

ALTER FUNCTION public.increment_interaction_counter() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_days_in_stage() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_source_stats() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_sdr_deals_updated_at() 
SET search_path = 'public';

ALTER FUNCTION public.update_sdr_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_sdr_workflows_updated_at() 
SET search_path = 'public';

-- 5. OUTRAS FUNÇÕES IMPORTANTES
ALTER FUNCTION public.update_canvas_block_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_product_catalog_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_pricing_rules_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_company_totvs_score() 
SET search_path = 'public';

ALTER FUNCTION public.update_user_search_preferences_updated_at() 
SET search_path = 'public';

ALTER FUNCTION public.update_ai_interactions_updated_at() 
SET search_path = 'public', 'pg_temp';

ALTER FUNCTION public.update_bitrix_config_updated_at() 
SET search_path = 'public';

ALTER FUNCTION public.update_updated_at_column() 
SET search_path = 'public';

ALTER FUNCTION public.set_updated_at() 
SET search_path = 'public';

-- ================================================
-- NOTA: search_path já está definido corretamente em:
-- ================================================
-- 
-- ✅ has_role(uuid, app_role) 
--    → SET search_path = 'public' (já definido)
--
-- ✅ handle_new_user() 
--    → SET search_path = 'public' (já definido)
--
-- ================================================

COMMENT ON FUNCTION public.calculate_lead_score IS 
'Calcula lead score ponderado. SECURITY INVOKER + search_path para máxima segurança.';

-- ============================================================================
-- MIGRATION: 20251101020841_be0291f7-af2b-484c-bb94-9bc6d2c3de65.sql
-- ============================================================================

-- ================================================
-- CORREÇÃO DE SEGURANÇA: Remover SECURITY DEFINER desnecessário
-- ================================================
-- Issue: Funções com SECURITY DEFINER executam com privilégios do criador,
-- não do usuário. Isso pode levar a escalação de privilégios.
-- 
-- Solução: Alterar para SECURITY INVOKER onde não é necessário privilégio elevado
-- ================================================

-- 1. FUNÇÕES DE CÁLCULO - Não precisam de privilégios elevados
-- Essas funções apenas calculam scores baseados em dados que o usuário já tem acesso

ALTER FUNCTION public.calculate_deal_health_score(deal_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_engagement_score(p_company_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_intent_score(company_uuid uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_lead_score(p_company_id uuid) 
SECURITY INVOKER;

ALTER FUNCTION public.calculate_size_score(p_company_id uuid) 
SECURITY INVOKER;

-- 2. FUNÇÕES DE QUERY - Devem respeitar RLS do usuário

ALTER FUNCTION public.get_hot_leads(min_intent_score integer) 
SECURITY INVOKER;

ALTER FUNCTION public.get_companies_for_monitoring_check(batch_limit integer) 
SECURITY INVOKER;

ALTER FUNCTION public.recalculate_all_lead_scores(batch_size integer) 
SECURITY INVOKER;

-- 3. FUNÇÕES DE OPERAÇÃO - Devem usar permissões do usuário

ALTER FUNCTION public.cleanup_orphaned_deals() 
SECURITY INVOKER;

ALTER FUNCTION public.create_canvas_version(p_canvas_id uuid, p_tag text, p_description text) 
SECURITY INVOKER;

ALTER FUNCTION public.promote_canvas_decision(p_block_id uuid, p_target_type text) 
SECURITY INVOKER;

ALTER FUNCTION public.get_next_report_version(p_company_id uuid, p_report_type text) 
SECURITY INVOKER;

-- ================================================
-- NOTA: As seguintes funções PERMANECEM como SECURITY DEFINER
-- porque são necessárias para operações específicas:
-- ================================================
-- 
-- ✅ has_role(uuid, app_role) 
--    → Recomendação oficial Supabase para evitar recursão RLS
--
-- ✅ handle_new_user() 
--    → Precisa criar registros durante signup (auth trigger)
--
-- ✅ increment_apollo_credits(integer) 
--    → Operação sensível de créditos, deve ser controlada
--
-- ✅ Todas as funções de TRIGGER (auto_*, update_*, log_*, etc.)
--    → Triggers são executados automaticamente após validação RLS
--    → São seguros porque já passaram pela política de segurança
--
-- ================================================

-- Comentário de auditoria
COMMENT ON FUNCTION public.calculate_deal_health_score IS 
'Calcula health score do deal. SECURITY INVOKER para respeitar RLS do usuário.';

COMMENT ON FUNCTION public.get_hot_leads IS 
'Busca hot leads. SECURITY INVOKER para que cada usuário veja apenas suas empresas conforme RLS.';

COMMENT ON FUNCTION public.recalculate_all_lead_scores IS 
'Recalcula lead scores em batch. SECURITY INVOKER para respeitar permissões do usuário.';

-- ============================================================================
-- MIGRATION: 20251101022347_14be8e1e-2116-47ba-ae2f-16e25825c2cb.sql
-- ============================================================================

-- Fix Security Definer Views
-- These views need to use security_invoker = true to enforce RLS policies of the querying user
-- rather than the view creator

-- 1. Fix buying_signals_summary view
DROP VIEW IF EXISTS public.buying_signals_summary CASCADE;

CREATE VIEW public.buying_signals_summary
WITH (security_invoker = true)
AS
SELECT 
  company_id,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE status = 'new') as new_signals,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_signals,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_signals,
  AVG(confidence_score) as avg_confidence,
  MAX(detected_at) as last_signal_date,
  json_agg(DISTINCT signal_type) as signal_types
FROM public.buying_signals
GROUP BY company_id;

-- 2. Fix pipeline_overview view
DROP VIEW IF EXISTS public.pipeline_overview CASCADE;

CREATE VIEW public.pipeline_overview
WITH (security_invoker = true)
AS
SELECT 
  journey_stage,
  temperature,
  COUNT(*) as total_companies,
  SUM(estimated_deal_value) as total_pipeline_value,
  AVG(icp_score) as avg_icp_score,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned_count,
  COUNT(*) FILTER (WHERE next_action_date IS NOT NULL) as with_next_action
FROM public.companies
WHERE journey_stage NOT IN ('closed_won', 'closed_lost')
GROUP BY journey_stage, temperature;

-- 3. Fix source_performance view
DROP VIEW IF EXISTS public.source_performance CASCADE;

CREATE VIEW public.source_performance
WITH (security_invoker = true)
AS
SELECT 
  ls.source_name,
  ls.is_active,
  ls.priority,
  COUNT(lq.id) as total_captured,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'approved') as total_approved,
  COUNT(lq.id) FILTER (WHERE lq.validation_status = 'rejected') as total_rejected,
  AVG(lq.auto_score) as avg_auto_score,
  COUNT(c.id) as total_converted_to_companies,
  COUNT(c.id) FILTER (WHERE c.journey_stage = 'closed_won') as total_won
FROM public.leads_sources ls
LEFT JOIN public.leads_quarantine lq ON lq.source_id = ls.id
LEFT JOIN public.companies c ON c.quarantine_id = lq.id
GROUP BY ls.id, ls.source_name, ls.is_active, ls.priority;

-- ============================================================================
-- MIGRATION: 20251101023724_73823481-8348-4e65-b61d-9de3c3aab24a.sql
-- ============================================================================

-- FASE 1 & 2: Corrigir estrutura de dados e adicionar engine de score ICP

-- 1. Adicionar coluna setor se não existir
ALTER TABLE icp_analysis_results ADD COLUMN IF NOT EXISTS setor TEXT;

-- 2. Função para extrair dados da Receita Federal automaticamente
CREATE OR REPLACE FUNCTION extract_receita_federal_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Extrair dados de raw_analysis.receita_federal.data
  IF NEW.raw_analysis IS NOT NULL AND 
     NEW.raw_analysis->'receita_federal' IS NOT NULL AND
     NEW.raw_analysis->'receita_federal'->'data' IS NOT NULL THEN
    
    -- Dados de localização
    NEW.uf = COALESCE(NEW.uf, NEW.raw_analysis->'receita_federal'->'data'->>'uf');
    NEW.municipio = COALESCE(NEW.municipio, NEW.raw_analysis->'receita_federal'->'data'->>'municipio');
    NEW.porte = COALESCE(NEW.porte, NEW.raw_analysis->'receita_federal'->'data'->>'porte');
    
    -- Dados de contato
    NEW.email = COALESCE(NEW.email, NEW.raw_analysis->'receita_federal'->'data'->>'email');
    NEW.telefone = COALESCE(NEW.telefone, NEW.raw_analysis->'receita_federal'->'data'->>'telefone');
    
    -- CNAE e setor (pegar do array atividade_principal)
    IF NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal' IS NOT NULL THEN
      NEW.cnae_principal = COALESCE(
        NEW.cnae_principal, 
        NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal'->0->>'code'
      );
      NEW.setor = COALESCE(
        NEW.setor,
        NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal'->0->>'text'
      );
    END IF;
    
    -- Website/domain
    IF NEW.website IS NULL AND NEW.raw_analysis->'receita_federal'->'data'->>'fantasia' IS NOT NULL THEN
      NEW.website = NEW.raw_analysis->'receita_federal'->'data'->>'fantasia';
    END IF;
    
    -- Nome fantasia
    IF NEW.nome_fantasia IS NULL AND NEW.raw_analysis->'receita_federal'->'data'->>'fantasia' IS NOT NULL THEN
      NEW.nome_fantasia = NEW.raw_analysis->'receita_federal'->'data'->>'fantasia';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para extração automática (sem WHEN condition que refere OLD em INSERT)
DROP TRIGGER IF EXISTS trigger_extract_receita_data ON icp_analysis_results;
CREATE TRIGGER trigger_extract_receita_data
  BEFORE INSERT OR UPDATE ON icp_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION extract_receita_federal_data();

-- 4. Função para calcular Score ICP na quarentena
CREATE OR REPLACE FUNCTION calculate_icp_score_quarantine(p_analysis_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INTEGER := 0;
  v_porte_score INTEGER := 0;
  v_setor_score INTEGER := 0;
  v_localizacao_score INTEGER := 0;
  v_totvs_score INTEGER := 0;
  v_dados_score INTEGER := 0;
  
  v_record RECORD;
BEGIN
  -- Buscar dados do registro
  SELECT * INTO v_record
  FROM icp_analysis_results
  WHERE id = p_analysis_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- 1. Score de Porte (0-30 pontos)
  IF v_record.porte IS NOT NULL THEN
    CASE 
      WHEN v_record.porte ILIKE '%GRANDE%' OR v_record.porte ILIKE '%DEMAIS%' THEN 
        v_porte_score := 30;
      WHEN v_record.porte ILIKE '%MEDIO%' OR v_record.porte ILIKE '%MÉDIO%' THEN 
        v_porte_score := 20;
      WHEN v_record.porte ILIKE '%PEQUENO%' THEN 
        v_porte_score := 10;
      ELSE 
        v_porte_score := 5;
    END CASE;
  END IF;
  
  -- 2. Score de Setor (0-25 pontos) - Setores prioritários
  IF v_record.setor IS NOT NULL OR v_record.cnae_principal IS NOT NULL THEN
    -- Indústria, tecnologia, serviços corporativos = alta prioridade
    IF v_record.setor ILIKE '%INDUSTRIA%' OR 
       v_record.setor ILIKE '%INDÚSTRIA%' OR
       v_record.setor ILIKE '%MANUFATURA%' OR
       v_record.setor ILIKE '%TECNOLOGIA%' OR
       v_record.setor ILIKE '%SOFTWARE%' OR
       v_record.setor ILIKE '%LOGISTICA%' OR
       v_record.setor ILIKE '%LOGÍSTICA%' THEN
      v_setor_score := 25;
    -- Comércio, varejo = média prioridade  
    ELSIF v_record.setor ILIKE '%COMERCIO%' OR 
          v_record.setor ILIKE '%COMÉRCIO%' OR
          v_record.setor ILIKE '%VAREJO%' THEN
      v_setor_score := 15;
    -- Outros setores
    ELSE
      v_setor_score := 10;
    END IF;
  END IF;
  
  -- 3. Score de Localização (0-15 pontos) - Estados prioritários
  IF v_record.uf IS NOT NULL THEN
    CASE v_record.uf
      WHEN 'SP' THEN v_localizacao_score := 15;
      WHEN 'RJ', 'MG', 'PR', 'RS', 'SC' THEN v_localizacao_score := 12;
      WHEN 'BA', 'PE', 'CE', 'GO', 'DF' THEN v_localizacao_score := 8;
      ELSE v_localizacao_score := 5;
    END CASE;
  END IF;
  
  -- 4. Score TOTVS (0-10 pontos)
  -- Se NÃO é cliente TOTVS = mais pontos (prospect válido)
  IF v_record.is_cliente_totvs = false THEN
    v_totvs_score := 10;
  ELSIF v_record.is_cliente_totvs IS NULL THEN
    v_totvs_score := 5; -- Ainda não verificado
  ELSE
    v_totvs_score := 0; -- Já é cliente
  END IF;
  
  -- 5. Score de Dados Completos (0-20 pontos)
  v_dados_score := 0;
  
  IF v_record.raw_analysis IS NOT NULL THEN
    -- Receita Federal completa
    IF v_record.raw_analysis->'receita_federal' IS NOT NULL THEN
      v_dados_score := v_dados_score + 5;
    END IF;
    
    -- Apollo/Enriquecimento 360
    IF v_record.raw_analysis->'apollo' IS NOT NULL OR 
       v_record.raw_analysis->'enrichment_360' IS NOT NULL THEN
      v_dados_score := v_dados_score + 5;
    END IF;
    
    -- Website identificado
    IF v_record.website IS NOT NULL AND v_record.website != '' THEN
      v_dados_score := v_dados_score + 5;
    END IF;
    
    -- Email e telefone
    IF v_record.email IS NOT NULL OR v_record.telefone IS NOT NULL THEN
      v_dados_score := v_dados_score + 5;
    END IF;
  END IF;
  
  -- Calcular score final (máximo 100)
  v_score := LEAST(
    v_porte_score + v_setor_score + v_localizacao_score + v_totvs_score + v_dados_score,
    100
  );
  
  -- Atualizar score e temperatura
  UPDATE icp_analysis_results
  SET 
    icp_score = v_score,
    temperatura = CASE
      WHEN v_score >= 75 THEN 'hot'
      WHEN v_score >= 50 THEN 'warm'
      ELSE 'cold'
    END
  WHERE id = p_analysis_id;
  
  RETURN v_score;
END;
$$;

-- 5. Atualizar registros existentes para extrair dados
UPDATE icp_analysis_results
SET updated_at = NOW()
WHERE raw_analysis->'receita_federal' IS NOT NULL
  AND status = 'pendente';

-- 6. Recalcular scores para todos os registros pendentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id FROM icp_analysis_results 
    WHERE status = 'pendente' 
    ORDER BY created_at DESC
  LOOP
    PERFORM calculate_icp_score_quarantine(r.id);
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION: 20251101025618_18de7108-cff9-452f-9d7a-67d8d662932e.sql
-- ============================================================================

-- Add cnpj_status column to icp_analysis_results
ALTER TABLE public.icp_analysis_results ADD COLUMN IF NOT EXISTS cnpj_status TEXT;

-- Update extract_receita_federal_data function to extract and store cnpj_status
CREATE OR REPLACE FUNCTION public.extract_receita_federal_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Extract setor (CNAE principal description)
  IF NEW.raw_analysis->'receita_federal'->'data'->'cnae_fiscal'->>'descricao' IS NOT NULL THEN
    NEW.setor := NEW.raw_analysis->'receita_federal'->'data'->'cnae_fiscal'->>'descricao';
  END IF;

  -- Extract UF
  IF NEW.raw_analysis->'receita_federal'->'data'->>'uf' IS NOT NULL THEN
    NEW.uf := NEW.raw_analysis->'receita_federal'->'data'->>'uf';
  END IF;

  -- Extract município
  IF NEW.raw_analysis->'receita_federal'->'data'->>'municipio' IS NOT NULL THEN
    NEW.municipio := NEW.raw_analysis->'receita_federal'->'data'->>'municipio';
  END IF;

  -- CRITICAL: Extract CNPJ status (situacao) and map to our status values
  IF NEW.raw_analysis->'receita_federal'->'data'->>'situacao' IS NOT NULL THEN
    DECLARE
      v_situacao TEXT := LOWER(TRIM(NEW.raw_analysis->'receita_federal'->'data'->>'situacao'));
    BEGIN
      NEW.cnpj_status := CASE
        WHEN v_situacao LIKE '%ativa%' OR v_situacao = 'ativa' THEN 'ativa'
        WHEN v_situacao LIKE '%inapta%' OR v_situacao LIKE '%suspensa%' OR v_situacao = 'inapta' OR v_situacao = 'suspensa' THEN 'inativo'
        WHEN v_situacao LIKE '%baixada%' OR v_situacao = 'baixada' THEN 'inexistente'
        ELSE 'pendente'
      END;
    END;
  ELSE
    -- If no situacao is available, set as pendente
    NEW.cnpj_status := 'pendente';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update existing records with CNPJ status based on raw_analysis
UPDATE public.icp_analysis_results
SET cnpj_status = CASE
  WHEN LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%ativa%' 
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'ativa' THEN 'ativa'
  WHEN LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%inapta%' 
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%suspensa%'
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'inapta'
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'suspensa' THEN 'inativo'
  WHEN LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) LIKE '%baixada%'
    OR LOWER(TRIM(raw_analysis->'receita_federal'->'data'->>'situacao')) = 'baixada' THEN 'inexistente'
  ELSE 'pendente'
END
WHERE raw_analysis->'receita_federal'->'data'->>'situacao' IS NOT NULL;

-- ============================================================================
-- MIGRATION: 20251101031432_5657a1dc-0935-49e2-9c49-cb54d05aa72f.sql
-- ============================================================================

-- Deduplicate and enforce unique CNPJ in quarantine and companies

-- 1) Remove duplicated CNPJs in icp_analysis_results (keep most recent by id)
WITH ranked AS (
  SELECT id, cnpj, ROW_NUMBER() OVER (PARTITION BY cnpj ORDER BY id DESC) AS rn
  FROM public.icp_analysis_results
  WHERE cnpj IS NOT NULL
)
DELETE FROM public.icp_analysis_results i
USING ranked r
WHERE i.id = r.id AND r.rn > 1;

-- 2) Ensure unique constraint on icp_analysis_results.cnpj
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'icp_analysis_results_cnpj_unique'
  ) THEN
    ALTER TABLE public.icp_analysis_results
    ADD CONSTRAINT icp_analysis_results_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;

-- 3) Ensure unique constraint on companies.cnpj (optional but recommended)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_cnpj_unique'
  ) THEN
    ALTER TABLE public.companies
    ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;

-- ============================================================================
-- MIGRATION: 20251101044250_ba6aad50-6862-4a3b-a436-f662a4197cc8.sql
-- ============================================================================

-- Adicionar colunas STC em icp_analysis_results para armazenar resultados na QUARENTENA
ALTER TABLE public.icp_analysis_results 
ADD COLUMN IF NOT EXISTS totvs_check_status TEXT CHECK (totvs_check_status IN ('go', 'no-go', 'revisar')),
ADD COLUMN IF NOT EXISTS totvs_check_confidence TEXT CHECK (totvs_check_confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS totvs_check_evidences JSONB DEFAULT '{"vagas": [], "noticias": [], "docs_oficiais": []}'::jsonb,
ADD COLUMN IF NOT EXISTS totvs_check_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS totvs_check_total_weight INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS totvs_check_reasoning TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_totvs_check_status 
  ON public.icp_analysis_results(totvs_check_status);

CREATE INDEX IF NOT EXISTS idx_icp_totvs_check_date 
  ON public.icp_analysis_results(totvs_check_date DESC);

-- Comentários para documentação
COMMENT ON COLUMN public.icp_analysis_results.totvs_check_status IS 'Resultado do Simple TOTVS Check: go (sem TOTVS), no-go (usa TOTVS), revisar (incerto)';
COMMENT ON COLUMN public.icp_analysis_results.totvs_check_evidences IS 'Evidências categorizadas encontradas pelo STC';
COMMENT ON COLUMN public.icp_analysis_results.totvs_check_total_weight IS 'Peso total das evidências (40-100+ pontos)';

-- ============================================================================
-- MIGRATION: 20251101055304_9b6e0e7c-43b6-473d-9c26-c2a77d6706f0.sql
-- ============================================================================

-- ========================================
-- FASE 1: Limpeza de Cache Corrupto
-- Adiciona logic_version para invalidar verificações antigas
-- ========================================

-- Adicionar coluna logic_version em simple_totvs_checks
ALTER TABLE simple_totvs_checks 
ADD COLUMN IF NOT EXISTS logic_version INTEGER DEFAULT 1;

-- Adicionar coluna logic_version em icp_analysis_results
ALTER TABLE icp_analysis_results 
ADD COLUMN IF NOT EXISTS logic_version INTEGER DEFAULT 1;

-- Marcar todas as verificações existentes como versão 1 (antiga/inválida)
UPDATE simple_totvs_checks 
SET logic_version = 1 
WHERE logic_version IS NULL;

UPDATE icp_analysis_results 
SET logic_version = 1 
WHERE logic_version IS NULL AND totvs_check_status IS NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_simple_totvs_checks_logic_version 
ON simple_totvs_checks(logic_version);

CREATE INDEX IF NOT EXISTS idx_icp_analysis_logic_version 
ON icp_analysis_results(logic_version);

-- Comentários para documentação
COMMENT ON COLUMN simple_totvs_checks.logic_version IS 'Versão da lógica de decisão: 1=antiga (inválida), 2=nova (unificada V2)';
COMMENT ON COLUMN icp_analysis_results.logic_version IS 'Versão da lógica de decisão: 1=antiga (inválida), 2=nova (unificada V2)';

-- ============================================================================
-- MIGRATION: 20251101203611_17e6c6a3-6eb0-4b0c-9ec0-2a66c1234314.sql
-- ============================================================================

-- FASE 1: Corrigir estrutura da tabela simple_totvs_checks
-- Adicionar campos faltantes que a edge function precisa salvar
ALTER TABLE public.simple_totvs_checks
  ADD COLUMN IF NOT EXISTS triple_matches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS double_matches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_weight INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT;

-- Criar índices para performance nas buscas
CREATE INDEX IF NOT EXISTS idx_simple_totvs_triple 
  ON simple_totvs_checks(triple_matches DESC);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_double 
  ON simple_totvs_checks(double_matches DESC);
CREATE INDEX IF NOT EXISTS idx_simple_totvs_company 
  ON simple_totvs_checks(company_name);

-- Limpar cache antigo (mais de 7 dias) para forçar novas verificações
DELETE FROM simple_totvs_checks 
WHERE checked_at < NOW() - INTERVAL '7 days';

-- ============================================================================
-- MIGRATION: 20251102000501_0fc5c297-0246-4d17-b562-5b9b35566a15.sql
-- ============================================================================

-- Tabela para memória do STC Agent (RAG)
CREATE TABLE IF NOT EXISTS stc_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  mode TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_memory_company ON stc_agent_memory(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_memory_created ON stc_agent_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stc_memory_mode ON stc_agent_memory(mode);

-- RLS (Row Level Security)
ALTER TABLE stc_agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON stc_agent_memory
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comentários
COMMENT ON TABLE stc_agent_memory IS 'Memória do STC Agent para aprendizado contínuo (RAG)';
COMMENT ON COLUMN stc_agent_memory.company_id IS 'ID da empresa analisada';
COMMENT ON COLUMN stc_agent_memory.question IS 'Pergunta feita pelo usuário';
COMMENT ON COLUMN stc_agent_memory.answer IS 'Resposta do agente';
COMMENT ON COLUMN stc_agent_memory.metadata IS 'Dados estruturados da análise (JSON)';

-- ============================================================================
-- MIGRATION: 20251102011123_34dc2809-6978-46e1-9757-bf84e19d51cc.sql
-- ============================================================================

-- Tabela para histórico de verificações STC
CREATE TABLE IF NOT EXISTS stc_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  status TEXT NOT NULL,
  confidence TEXT NOT NULL,
  triple_matches INTEGER DEFAULT 0,
  double_matches INTEGER DEFAULT 0,
  single_matches INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  evidences JSONB DEFAULT '[]'::jsonb,
  sources_consulted INTEGER DEFAULT 0,
  queries_executed INTEGER DEFAULT 0,
  verification_duration_ms INTEGER,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX IF NOT EXISTS idx_stc_history_created ON stc_verification_history(created_at DESC);

ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações STC realizadas';

-- Tabela de empresas descartadas
CREATE TABLE IF NOT EXISTS discarded_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  discard_reason_id TEXT NOT NULL,
  discard_reason_label TEXT NOT NULL,
  discard_reason_description TEXT,
  discard_category TEXT NOT NULL,
  stc_status TEXT,
  stc_confidence TEXT,
  stc_triple_matches INTEGER DEFAULT 0,
  stc_double_matches INTEGER DEFAULT 0,
  stc_total_score INTEGER DEFAULT 0,
  discarded_by UUID REFERENCES auth.users(id),
  discarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  original_icp_score INTEGER,
  original_icp_temperature TEXT
);

CREATE INDEX IF NOT EXISTS idx_discarded_company ON discarded_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_discarded_reason ON discarded_companies(discard_reason_id);
CREATE INDEX IF NOT EXISTS idx_discarded_category ON discarded_companies(discard_category);
CREATE INDEX IF NOT EXISTS idx_discarded_date ON discarded_companies(discarded_at DESC);

ALTER TABLE discarded_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to manage discarded" 
ON discarded_companies FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

COMMENT ON TABLE discarded_companies IS 'Histórico completo de empresas descartadas com motivos e analytics';

-- ============================================================================
-- MIGRATION: 20251102041835_d9c7179d-2001-4999-a7c4-143e617852e3.sql
-- ============================================================================

-- Adicionar colunas para rastreamento de descoberta e enriquecimento
ALTER TABLE suggested_companies 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS discovered_from_company_id UUID REFERENCES suggested_companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS similarity_score INTEGER DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 100),
ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_suggested_companies_source ON suggested_companies(source);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_discovered_from ON suggested_companies(discovered_from_company_id);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_enrichment_status ON suggested_companies(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_suggested_companies_similarity_score ON suggested_companies(similarity_score DESC);

-- Comentários para documentação
COMMENT ON COLUMN suggested_companies.source IS 'Origem da empresa: manual, similar_company_discovery, web_search, etc';
COMMENT ON COLUMN suggested_companies.discovered_from_company_id IS 'ID da empresa que originou esta descoberta';
COMMENT ON COLUMN suggested_companies.similarity_score IS 'Score de similaridade (0-100) em relação à empresa origem';
COMMENT ON COLUMN suggested_companies.enrichment_status IS 'Status do processo de enriquecimento: pending, in_progress, completed, failed';
COMMENT ON COLUMN suggested_companies.discovered_at IS 'Data/hora em que a empresa foi descoberta';

-- ============================================================================
-- MIGRATION: 20251102072139_497f51fd-f1ab-4e03-8ad6-aaf806806ad6.sql
-- ============================================================================

-- Tabela para armazenar histórico de conversas do STC Agent
CREATE TABLE IF NOT EXISTS public.stc_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.suggested_companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_conversations_company_id ON public.stc_agent_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_stc_conversations_created_at ON public.stc_agent_conversations(created_at);

-- RLS Policies (todos podem ver e criar conversas de qualquer empresa por enquanto)
ALTER TABLE public.stc_agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de conversas"
  ON public.stc_agent_conversations
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de conversas"
  ON public.stc_agent_conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de conversas"
  ON public.stc_agent_conversations
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_stc_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stc_conversations_updated_at
  BEFORE UPDATE ON public.stc_agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stc_conversations_updated_at();

-- Comentários
COMMENT ON TABLE public.stc_agent_conversations IS 'Histórico de conversas do STC Agent por empresa';
COMMENT ON COLUMN public.stc_agent_conversations.company_id IS 'ID da empresa relacionada à conversa';
COMMENT ON COLUMN public.stc_agent_conversations.role IS 'Quem enviou a mensagem: user ou agent';
COMMENT ON COLUMN public.stc_agent_conversations.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN public.stc_agent_conversations.data IS 'Dados estruturados retornados pelo agente (evidências, decisores, etc)';
COMMENT ON COLUMN public.stc_agent_conversations.metadata IS 'Metadados adicionais (tokens, custo, etc)';

-- ============================================================================
-- MIGRATION: 20251103035940_60ff280d-f24b-4381-af4a-6004acad33ea.sql
-- ============================================================================

-- Tabela para armazenar matches STC de concorrentes
CREATE TABLE IF NOT EXISTS public.competitor_stc_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('double_match', 'triple_match')),
  confidence DECIMAL(3,2) NOT NULL,
  evidence TEXT,
  source_url TEXT,
  source_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_competitor_stc_company ON public.competitor_stc_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_competitor_stc_match_type ON public.competitor_stc_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_competitor_stc_confidence ON public.competitor_stc_matches(confidence DESC);

-- RLS
ALTER TABLE public.competitor_stc_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitor STC matches"
  ON public.competitor_stc_matches
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage competitor STC matches"
  ON public.competitor_stc_matches
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION: 20251103042100_8bb3bf76-c852-4486-8b21-fcbcda748da0.sql
-- ============================================================================

-- Adicionar campo para salvar relatório completo
ALTER TABLE stc_verification_history 
ADD COLUMN IF NOT EXISTS full_report JSONB DEFAULT '{}'::jsonb;

-- Adicionar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_stc_history_company_created 
ON stc_verification_history(company_id, created_at DESC);

COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório TOTVS completo com todas evidências para reabertura sem nova consulta';

-- ============================================================================
-- MIGRATION: 20251107000000_fix_stc_schema.sql
-- ============================================================================

-- FIX: Garantir que stc_verification_history tem TODAS as colunas necessárias
-- PROBLEMA: PGRST204 - Schema cache não encontrava confidence/double_matches

-- Remover coluna confidence se existir (para recriar com constraint correto)
ALTER TABLE stc_verification_history 
DROP COLUMN IF EXISTS confidence CASCADE;

-- Adicionar confidence com valor padrão
ALTER TABLE stc_verification_history 
ADD COLUMN confidence TEXT DEFAULT 'medium';

-- Garantir que double_matches existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stc_verification_history' 
        AND column_name = 'double_matches'
    ) THEN
        ALTER TABLE stc_verification_history 
        ADD COLUMN double_matches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Garantir que triple_matches existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stc_verification_history' 
        AND column_name = 'triple_matches'
    ) THEN
        ALTER TABLE stc_verification_history 
        ADD COLUMN triple_matches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Garantir que single_matches existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stc_verification_history' 
        AND column_name = 'single_matches'
    ) THEN
        ALTER TABLE stc_verification_history 
        ADD COLUMN single_matches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN stc_verification_history.confidence IS 'Nível de confiança da verificação (high/medium/low)';
COMMENT ON COLUMN stc_verification_history.double_matches IS 'Número de matches duplos (Empresa + TOTVS)';
COMMENT ON COLUMN stc_verification_history.triple_matches IS 'Número de matches triplos (Empresa + TOTVS + Produto)';



-- ============================================================================
-- MIGRATION: 20251107000001_rebuild_stc_schema.sql
-- ============================================================================

-- ========================================
-- MIGRATION: REBUILD stc_verification_history SCHEMA
-- PROBLEMA: PGRST204 - Múltiplas colunas não encontradas no cache
-- SOLUÇÃO: Recriar tabela com TODAS as colunas necessárias
-- ========================================

-- PASSO 1: Backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS stc_verification_history_backup AS 
SELECT * FROM stc_verification_history WHERE false;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM stc_verification_history LIMIT 1) THEN
        INSERT INTO stc_verification_history_backup 
        SELECT * FROM stc_verification_history;
        
        RAISE NOTICE 'Backup criado com % registros', 
            (SELECT COUNT(*) FROM stc_verification_history_backup);
    END IF;
END $$;

-- PASSO 2: Drop e Recreate (garantir schema limpo)
DROP TABLE IF EXISTS stc_verification_history CASCADE;

-- PASSO 3: Criar tabela com TODAS as colunas necessárias
CREATE TABLE stc_verification_history (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
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

-- PASSO 4: Criar índices para performance
CREATE INDEX idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX idx_stc_history_created ON stc_verification_history(created_at DESC);
CREATE INDEX idx_stc_history_company_created ON stc_verification_history(company_id, created_at DESC);
CREATE INDEX idx_stc_history_full_report ON stc_verification_history USING GIN (full_report);

-- PASSO 5: Configurar RLS
ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to view stc history" ON stc_verification_history;
DROP POLICY IF EXISTS "Allow authenticated to insert stc history" ON stc_verification_history;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated to update stc history" 
ON stc_verification_history FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- PASSO 6: Adicionar comentários para documentação
COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações STC (TOTVS Check) realizadas';
COMMENT ON COLUMN stc_verification_history.status IS 'Status da verificação: go (prospect), no-go (já cliente), revisar (incerto)';
COMMENT ON COLUMN stc_verification_history.confidence IS 'Nível de confiança: high, medium, low';
COMMENT ON COLUMN stc_verification_history.triple_matches IS 'Matches com Empresa + TOTVS + Produto';
COMMENT ON COLUMN stc_verification_history.double_matches IS 'Matches com Empresa + TOTVS';
COMMENT ON COLUMN stc_verification_history.single_matches IS 'Matches apenas com Empresa ou TOTVS';
COMMENT ON COLUMN stc_verification_history.evidences IS 'Array de evidências encontradas (snippets, URLs)';
COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório completo com detection + decisors + digital para reabertura sem consumir créditos';

-- PASSO 7: Restaurar dados do backup (se houver)
DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM stc_verification_history_backup;
    
    IF backup_count > 0 THEN
        INSERT INTO stc_verification_history (
            id, company_id, company_name, cnpj, status, confidence,
            triple_matches, double_matches, single_matches, total_score,
            evidences, full_report, sources_consulted, queries_executed,
            verification_duration_ms, verified_by, created_at
        )
        SELECT 
            id, company_id, company_name, cnpj, 
            COALESCE(status, 'unknown'),
            COALESCE(confidence, 'medium'),
            COALESCE(triple_matches, 0),
            COALESCE(double_matches, 0),
            COALESCE(single_matches, 0),
            COALESCE(total_score, 0),
            COALESCE(evidences, '[]'::jsonb),
            COALESCE(full_report, '{}'::jsonb),
            COALESCE(sources_consulted, 0),
            COALESCE(queries_executed, 0),
            verification_duration_ms,
            verified_by,
            created_at
        FROM stc_verification_history_backup;
        
        RAISE NOTICE 'Dados restaurados: % registros', backup_count;
    END IF;
END $$;

-- PASSO 8: Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- PASSO 9: Validar estrutura final
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'stc_verification_history';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE 'Tabela: stc_verification_history';
    RAISE NOTICE 'Colunas: %', col_count;
    RAISE NOTICE '========================================';
END $$;

-- PASSO 10: Mostrar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stc_verification_history'
ORDER BY ordinal_position;



-- ============================================================================
-- MIGRATION: 20251111120000_plaud_FINAL.sql
-- ============================================================================

-- =====================================================
-- PLAUD NOTEPIN INTEGRATION - FINAL VERSION
-- =====================================================
-- FIXED: Uses sdr_deals (not sales_deals) + auth.users
-- Project: STRATEVO (qtcwetabhhkhvomcrqgm)
-- =====================================================

-- 0. ADD MISSING COLUMN TO sdr_deals
ALTER TABLE public.sdr_deals
  ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;

-- 1. CALL RECORDINGS TABLE
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata
  plaud_recording_id TEXT UNIQUE,
  recording_url TEXT,
  recording_date TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Transcript
  transcript TEXT,
  summary TEXT,
  language TEXT DEFAULT 'pt-BR',
  
  -- Speakers
  speakers JSONB DEFAULT '[]'::jsonb,
  
  -- AI Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(3,2),
  confidence_level NUMERIC(3,2),
  
  -- Extracted Insights
  key_topics TEXT[],
  action_items JSONB DEFAULT '[]'::jsonb,
  objections_raised JSONB DEFAULT '[]'::jsonb,
  opportunities_detected JSONB DEFAULT '[]'::jsonb,
  
  -- Relationships (CORRECTED: sdr_deals + auth.users)
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.sdr_deals(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Coaching Metrics
  talk_time_ratio NUMERIC(3,2),
  questions_asked INTEGER,
  objection_handling_score NUMERIC(3,2),
  closing_attempts INTEGER,
  
  -- Win/Loss Signals
  buying_signals TEXT[],
  risk_signals TEXT[],
  
  -- Processing Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_recordings_company ON public.call_recordings(company_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_deal ON public.call_recordings(deal_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_recorded_by ON public.call_recordings(recorded_by);
CREATE INDEX IF NOT EXISTS idx_call_recordings_date ON public.call_recordings(recording_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_sentiment ON public.call_recordings(sentiment);
CREATE INDEX IF NOT EXISTS idx_call_recordings_plaud_id ON public.call_recordings(plaud_recording_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_transcript_fts ON public.call_recordings USING gin(to_tsvector('portuguese', COALESCE(transcript, '')));

-- 2. CALL ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  total_calls INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  avg_call_duration_minutes NUMERIC(10,2),
  
  positive_calls INTEGER DEFAULT 0,
  neutral_calls INTEGER DEFAULT 0,
  negative_calls INTEGER DEFAULT 0,
  avg_sentiment_score NUMERIC(3,2),
  
  avg_talk_time_ratio NUMERIC(3,2),
  avg_questions_asked NUMERIC(5,2),
  avg_objection_handling_score NUMERIC(3,2),
  total_closing_attempts INTEGER DEFAULT 0,
  
  deals_closed INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  
  top_strengths TEXT[],
  areas_for_improvement TEXT[],
  best_practices_identified TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_call_analytics_user ON public.call_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_period ON public.call_analytics(period_start, period_end);

-- 3. PLAUD WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS public.plaud_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event TEXT,
  payload JSONB,
  processing_status TEXT DEFAULT 'received' CHECK (processing_status IN ('received', 'success', 'error')),
  error_message TEXT,
  call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaud_webhook_logs_status ON public.plaud_webhook_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_plaud_webhook_logs_created ON public.plaud_webhook_logs(created_at DESC);

-- 4. SALES COACHING RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.sales_coaching_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE CASCADE,
  
  recommendation_type TEXT CHECK (recommendation_type IN (
    'talk_time', 'discovery_questions', 'objection_handling', 
    'closing_technique', 'active_listening', 'value_proposition'
  )),
  
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  timestamp_in_call INTEGER,
  transcript_excerpt TEXT,
  
  suggested_improvement TEXT,
  learning_resources JSONB DEFAULT '[]'::jsonb,
  
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_user ON public.sales_coaching_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_call ON public.sales_coaching_recommendations(call_recording_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_type ON public.sales_coaching_recommendations(recommendation_type);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaud_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_coaching_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own call recordings" ON public.call_recordings;
CREATE POLICY "Users can view own call recordings"
  ON public.call_recordings FOR SELECT
  USING (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own call recordings" ON public.call_recordings;
CREATE POLICY "Users can insert own call recordings"
  ON public.call_recordings FOR INSERT
  WITH CHECK (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own call recordings" ON public.call_recordings;
CREATE POLICY "Users can update own call recordings"
  ON public.call_recordings FOR UPDATE
  USING (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can view own analytics" ON public.call_analytics;
CREATE POLICY "Users can view own analytics"
  ON public.call_analytics FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own coaching recommendations" ON public.sales_coaching_recommendations;
CREATE POLICY "Users can view own coaching recommendations"
  ON public.sales_coaching_recommendations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own coaching recommendations" ON public.sales_coaching_recommendations;
CREATE POLICY "Users can update own coaching recommendations"
  ON public.sales_coaching_recommendations FOR UPDATE
  USING (user_id = auth.uid());

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_call_recordings_timestamp ON public.call_recordings;
CREATE TRIGGER update_call_recordings_timestamp
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_call_recordings_updated_at();

-- 7. Auto-create tasks from action items
CREATE OR REPLACE FUNCTION auto_create_tasks_from_call()
RETURNS TRIGGER AS $$
DECLARE
  action_item JSONB;
BEGIN
  IF NEW.action_items IS NOT NULL AND jsonb_array_length(NEW.action_items) > 0 THEN
    FOR action_item IN SELECT * FROM jsonb_array_elements(NEW.action_items)
    LOOP
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_tasks') THEN
        INSERT INTO public.smart_tasks (
          title,
          description,
          deal_id,
          assigned_to,
          due_date,
          priority,
          ai_suggested,
          ai_reasoning,
          created_by
        ) VALUES (
          action_item->>'task',
          'Action item extracted from call: ' || COALESCE(NEW.summary, 'Call recording'),
          NEW.deal_id,
          NEW.recorded_by,
          COALESCE((action_item->>'due_date')::TIMESTAMPTZ, NOW() + INTERVAL '3 days'),
          COALESCE(action_item->>'priority', 'medium'),
          TRUE,
          'Automatically extracted from call recording',
          NEW.recorded_by
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_tasks_from_call ON public.call_recordings;
CREATE TRIGGER trigger_auto_create_tasks_from_call
  AFTER INSERT OR UPDATE OF action_items ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tasks_from_call();

-- 8. Update deal from sentiment (CORRECTED: sdr_deals + sdr_deal_activities)
CREATE OR REPLACE FUNCTION update_deal_from_call_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL AND NEW.sentiment IS NOT NULL THEN
    -- Update sdr_deals
    UPDATE public.sdr_deals
    SET 
      last_contact_date = NEW.recording_date,
      updated_at = NOW()
    WHERE id = NEW.deal_id;
    
    -- Negative sentiment alert
    IF NEW.sentiment = 'negative' AND NEW.sentiment_score < -0.5 THEN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sdr_deal_activities') THEN
        INSERT INTO public.sdr_deal_activities (
          deal_id,
          activity_type,
          description,
          new_value,
          created_by
        ) VALUES (
          NEW.deal_id,
          'alert',
          'Call com sentimento negativo detectado',
          jsonb_build_object(
            'call_recording_id', NEW.id,
            'sentiment_score', NEW.sentiment_score,
            'risk_signals', NEW.risk_signals
          ),
          NEW.recorded_by
        );
      END IF;
    END IF;
    
    -- Positive sentiment priority boost
    IF NEW.sentiment = 'positive' AND NEW.sentiment_score > 0.7 AND array_length(NEW.buying_signals, 1) > 2 THEN
      UPDATE public.sdr_deals
      SET priority = 'high'
      WHERE id = NEW.deal_id AND priority != 'urgent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deal_from_call_sentiment ON public.call_recordings;
CREATE TRIGGER trigger_update_deal_from_call_sentiment
  AFTER INSERT OR UPDATE OF sentiment, sentiment_score ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_from_call_sentiment();

-- 9. VIEW: Call Performance Summary (CORRECTED: auth.users)
CREATE OR REPLACE VIEW public.call_performance_summary AS
SELECT 
  u.id AS user_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS user_name,
  COUNT(cr.id) AS total_calls,
  ROUND(AVG(cr.duration_seconds / 60.0), 2) AS avg_duration_minutes,
  ROUND(AVG(cr.sentiment_score), 2) AS avg_sentiment,
  ROUND(AVG(cr.talk_time_ratio), 2) AS avg_talk_ratio,
  ROUND(AVG(cr.questions_asked), 2) AS avg_questions,
  ROUND(AVG(cr.objection_handling_score), 2) AS avg_objection_handling,
  COUNT(CASE WHEN cr.sentiment = 'positive' THEN 1 END) AS positive_calls,
  COUNT(CASE WHEN cr.sentiment = 'negative' THEN 1 END) AS negative_calls,
  COUNT(CASE WHEN array_length(cr.buying_signals, 1) > 0 THEN 1 END) AS calls_with_buying_signals
FROM auth.users u
LEFT JOIN public.call_recordings cr ON cr.recorded_by = u.id AND cr.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.raw_user_meta_data;

-- 10. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON public.call_recordings TO authenticated;
GRANT SELECT ON public.call_analytics TO authenticated;
GRANT SELECT, UPDATE ON public.sales_coaching_recommendations TO authenticated;
GRANT SELECT ON public.call_performance_summary TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- Apply in: qtcwetabhhkhvomcrqgm (STRATEVO project)
-- =====================================================



-- ============================================================================
-- MIGRATION: 20251111120000_plaud_integration.sql
-- ============================================================================

-- =====================================================
-- PLAUD NOTEPIN INTEGRATION - COMPLETE SCHEMA
-- =====================================================
-- Created: 2025-11-11
-- Purpose: Store call recordings, transcripts, AI analysis
-- =====================================================

-- 1. CALL RECORDINGS TABLE
CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata
  plaud_recording_id TEXT UNIQUE,
  recording_url TEXT,
  recording_date TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Transcript
  transcript TEXT,
  summary TEXT,
  language TEXT DEFAULT 'pt-BR',
  
  -- Speakers
  speakers JSONB DEFAULT '[]'::jsonb,
  -- [{ "name": "João Silva", "duration_seconds": 120, "speech_segments": [...] }]
  
  -- AI Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
  confidence_level NUMERIC(3,2), -- 0.00 to 1.00
  
  -- Extracted Insights
  key_topics TEXT[], -- ["pricing", "delivery", "objections"]
  action_items JSONB DEFAULT '[]'::jsonb,
  -- [{ "task": "Send proposal", "assignee": "João", "due_date": "2025-11-15", "priority": "high" }]
  
  objections_raised JSONB DEFAULT '[]'::jsonb,
  -- [{ "objection": "Price too high", "response": "Explained ROI", "resolved": true }]
  
  opportunities_detected JSONB DEFAULT '[]'::jsonb,
  -- [{ "type": "cross_sell", "product": "TOTVS Protheus", "confidence": 0.85 }]
  
  -- Relationships
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES sdr_deals(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Coaching Metrics
  talk_time_ratio NUMERIC(3,2), -- % of time seller talked (ideal: 0.30-0.40)
  questions_asked INTEGER, -- Number of discovery questions
  objection_handling_score NUMERIC(3,2), -- 0.00 to 1.00
  closing_attempts INTEGER,
  
  -- Win/Loss Signals
  buying_signals TEXT[], -- ["asked about timeline", "mentioned budget", "wanted to see demo"]
  risk_signals TEXT[], -- ["hesitant", "need to talk to team", "not urgent"]
  
  -- Processing Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_call_recordings_company ON call_recordings(company_id);
CREATE INDEX idx_call_recordings_deal ON call_recordings(deal_id);
CREATE INDEX idx_call_recordings_recorded_by ON call_recordings(recorded_by);
CREATE INDEX idx_call_recordings_date ON call_recordings(recording_date DESC);
CREATE INDEX idx_call_recordings_sentiment ON call_recordings(sentiment);
CREATE INDEX idx_call_recordings_plaud_id ON call_recordings(plaud_recording_id);

-- Full-text search on transcripts
CREATE INDEX idx_call_recordings_transcript_fts ON call_recordings USING gin(to_tsvector('portuguese', transcript));

-- 2. CALL ANALYTICS AGGREGATED TABLE (for fast dashboard queries)
CREATE TABLE IF NOT EXISTS call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Volume Metrics
  total_calls INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  avg_call_duration_minutes NUMERIC(10,2),
  
  -- Sentiment Metrics
  positive_calls INTEGER DEFAULT 0,
  neutral_calls INTEGER DEFAULT 0,
  negative_calls INTEGER DEFAULT 0,
  avg_sentiment_score NUMERIC(3,2),
  
  -- Performance Metrics
  avg_talk_time_ratio NUMERIC(3,2),
  avg_questions_asked NUMERIC(5,2),
  avg_objection_handling_score NUMERIC(3,2),
  total_closing_attempts INTEGER DEFAULT 0,
  
  -- Outcomes
  deals_closed INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  
  -- Coaching Insights
  top_strengths TEXT[],
  areas_for_improvement TEXT[],
  best_practices_identified TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX idx_call_analytics_user ON call_analytics(user_id);
CREATE INDEX idx_call_analytics_period ON call_analytics(period_start, period_end);

-- 3. PLAUD WEBHOOK LOGS (for debugging)
CREATE TABLE IF NOT EXISTS plaud_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event TEXT,
  payload JSONB,
  processing_status TEXT DEFAULT 'received' CHECK (processing_status IN ('received', 'success', 'error')),
  error_message TEXT,
  call_recording_id UUID REFERENCES call_recordings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plaud_webhook_logs_status ON plaud_webhook_logs(processing_status);
CREATE INDEX idx_plaud_webhook_logs_created ON plaud_webhook_logs(created_at DESC);

-- 4. SALES COACHING RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS sales_coaching_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  call_recording_id UUID REFERENCES call_recordings(id) ON DELETE CASCADE,
  
  recommendation_type TEXT CHECK (recommendation_type IN (
    'talk_time', 'discovery_questions', 'objection_handling', 
    'closing_technique', 'active_listening', 'value_proposition'
  )),
  
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Specific Examples from Call
  timestamp_in_call INTEGER, -- seconds into the call
  transcript_excerpt TEXT,
  
  -- Action Items
  suggested_improvement TEXT,
  learning_resources JSONB DEFAULT '[]'::jsonb,
  -- [{ "type": "video", "title": "How to Handle Price Objections", "url": "..." }]
  
  -- Tracking
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_recommendations_user ON sales_coaching_recommendations(user_id);
CREATE INDEX idx_coaching_recommendations_call ON sales_coaching_recommendations(call_recording_id);
CREATE INDEX idx_coaching_recommendations_type ON sales_coaching_recommendations(recommendation_type);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaud_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_coaching_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own recordings
CREATE POLICY "Users can view own call recordings"
  ON call_recordings FOR SELECT
  USING (recorded_by = auth.uid());

CREATE POLICY "Users can insert own call recordings"
  ON call_recordings FOR INSERT
  WITH CHECK (recorded_by = auth.uid());

CREATE POLICY "Users can update own call recordings"
  ON call_recordings FOR UPDATE
  USING (recorded_by = auth.uid());

-- Analytics: Users see their own data
CREATE POLICY "Users can view own analytics"
  ON call_analytics FOR SELECT
  USING (user_id = auth.uid());

-- Webhook logs: Accessible via service role only
CREATE POLICY "Service role can access webhook logs"
  ON plaud_webhook_logs FOR ALL
  USING (auth.uid() IS NULL); -- Service role bypass

-- Coaching: Users see their own recommendations
CREATE POLICY "Users can view own coaching recommendations"
  ON sales_coaching_recommendations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own coaching recommendations"
  ON sales_coaching_recommendations FOR UPDATE
  USING (user_id = auth.uid());

-- 6. TRIGGERS FOR AUTOMATIC UPDATES
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_call_recordings_timestamp
  BEFORE UPDATE ON call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_call_recordings_updated_at();

-- 7. FUNCTION: Auto-create tasks from action items
CREATE OR REPLACE FUNCTION auto_create_tasks_from_call()
RETURNS TRIGGER AS $$
DECLARE
  action_item JSONB;
BEGIN
  -- Only process when action_items are added/updated
  IF NEW.action_items IS NOT NULL AND jsonb_array_length(NEW.action_items) > 0 THEN
    FOR action_item IN SELECT * FROM jsonb_array_elements(NEW.action_items)
    LOOP
      INSERT INTO smart_tasks (
        title,
        description,
        deal_id,
        assigned_to,
        due_date,
        priority,
        ai_suggested,
        ai_reasoning,
        created_by
      ) VALUES (
        action_item->>'task',
        'Action item extracted from call: ' || COALESCE(NEW.summary, 'Call recording'),
        NEW.deal_id,
        NEW.recorded_by,
        COALESCE((action_item->>'due_date')::TIMESTAMPTZ, NOW() + INTERVAL '3 days'),
        COALESCE(action_item->>'priority', 'medium'),
        TRUE,
        'Automatically extracted from call recording on ' || NEW.recording_date::DATE,
        NEW.recorded_by
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_tasks_from_call
  AFTER INSERT OR UPDATE OF action_items ON call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tasks_from_call();

-- 8. FUNCTION: Update deal based on call sentiment
CREATE OR REPLACE FUNCTION update_deal_from_call_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL AND NEW.sentiment IS NOT NULL THEN
    -- Update deal's last_contact_date
    UPDATE sdr_deals
    SET 
      last_contact_date = NEW.recording_date,
      updated_at = NOW()
    WHERE id = NEW.deal_id;
    
    -- If highly negative sentiment, add a note
    IF NEW.sentiment = 'negative' AND NEW.sentiment_score < -0.5 THEN
      INSERT INTO sales_deal_activities (
        deal_id,
        activity_type,
        description,
        new_value
      ) VALUES (
        NEW.deal_id,
        'alert',
        '🚨 Call com sentimento negativo detectado',
        jsonb_build_object(
          'call_recording_id', NEW.id,
          'sentiment_score', NEW.sentiment_score,
          'risk_signals', NEW.risk_signals
        )
      );
    END IF;
    
    -- If highly positive sentiment with buying signals, increase priority
    IF NEW.sentiment = 'positive' AND NEW.sentiment_score > 0.7 AND array_length(NEW.buying_signals, 1) > 2 THEN
      UPDATE sdr_deals
      SET priority = 'high'
      WHERE id = NEW.deal_id AND priority != 'urgent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deal_from_call_sentiment
  AFTER INSERT OR UPDATE OF sentiment, sentiment_score ON call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_from_call_sentiment();

-- 9. VIEW: Call Performance Summary
CREATE OR REPLACE VIEW call_performance_summary AS
SELECT 
  u.id AS user_id,
  u.full_name AS user_name,
  COUNT(cr.id) AS total_calls,
  ROUND(AVG(cr.duration_seconds / 60.0), 2) AS avg_duration_minutes,
  ROUND(AVG(cr.sentiment_score), 2) AS avg_sentiment,
  ROUND(AVG(cr.talk_time_ratio), 2) AS avg_talk_ratio,
  ROUND(AVG(cr.questions_asked), 2) AS avg_questions,
  ROUND(AVG(cr.objection_handling_score), 2) AS avg_objection_handling,
  COUNT(CASE WHEN cr.sentiment = 'positive' THEN 1 END) AS positive_calls,
  COUNT(CASE WHEN cr.sentiment = 'negative' THEN 1 END) AS negative_calls,
  COUNT(CASE WHEN array_length(cr.buying_signals, 1) > 0 THEN 1 END) AS calls_with_buying_signals
FROM users u
LEFT JOIN call_recordings cr ON cr.recorded_by = u.id
WHERE cr.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name;

-- 10. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON call_recordings TO authenticated;
GRANT SELECT ON call_analytics TO authenticated;
GRANT SELECT, UPDATE ON sales_coaching_recommendations TO authenticated;
GRANT SELECT ON call_performance_summary TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next Steps:
-- 1. Deploy Edge Function: plaud-webhook-receiver
-- 2. Configure Plaud webhook URL
-- 3. Test with sample recording
-- =====================================================



-- ============================================================================
-- MIGRATION: 20251111120000_plaud_integration_FIXED.sql
-- ============================================================================

-- =====================================================
-- PLAUD NOTEPIN INTEGRATION - COMPLETE SCHEMA (FIXED)
-- =====================================================
-- Created: 2025-11-11
-- Purpose: Store call recordings, transcripts, AI analysis
-- FIX: Changed sdr_deals to sales_deals + added schema qualifiers
-- =====================================================

-- 0. ADD MISSING COLUMN TO sales_deals (if needed)
ALTER TABLE public.sales_deals
  ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;

-- 1. CALL RECORDINGS TABLE
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata
  plaud_recording_id TEXT UNIQUE,
  recording_url TEXT,
  recording_date TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Transcript
  transcript TEXT,
  summary TEXT,
  language TEXT DEFAULT 'pt-BR',
  
  -- Speakers
  speakers JSONB DEFAULT '[]'::jsonb,
  -- [{ "name": "João Silva", "duration_seconds": 120, "speech_segments": [...] }]
  
  -- AI Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
  confidence_level NUMERIC(3,2), -- 0.00 to 1.00
  
  -- Extracted Insights
  key_topics TEXT[], -- ["pricing", "delivery", "objections"]
  action_items JSONB DEFAULT '[]'::jsonb,
  -- [{ "task": "Send proposal", "assignee": "João", "due_date": "2025-11-15", "priority": "high" }]
  
  objections_raised JSONB DEFAULT '[]'::jsonb,
  -- [{ "objection": "Price too high", "response": "Explained ROI", "resolved": true }]
  
  opportunities_detected JSONB DEFAULT '[]'::jsonb,
  -- [{ "type": "cross_sell", "product": "TOTVS Protheus", "confidence": 0.85 }]
  
  -- Relationships (FIXED: sdr_deals → sales_deals, added schema)
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.sales_deals(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Coaching Metrics
  talk_time_ratio NUMERIC(3,2), -- % of time seller talked (ideal: 0.30-0.40)
  questions_asked INTEGER, -- Number of discovery questions
  objection_handling_score NUMERIC(3,2), -- 0.00 to 1.00
  closing_attempts INTEGER,
  
  -- Win/Loss Signals
  buying_signals TEXT[], -- ["asked about timeline", "mentioned budget", "wanted to see demo"]
  risk_signals TEXT[], -- ["hesitant", "need to talk to team", "not urgent"]
  
  -- Processing Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_company ON public.call_recordings(company_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_deal ON public.call_recordings(deal_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_recorded_by ON public.call_recordings(recorded_by);
CREATE INDEX IF NOT EXISTS idx_call_recordings_date ON public.call_recordings(recording_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_sentiment ON public.call_recordings(sentiment);
CREATE INDEX IF NOT EXISTS idx_call_recordings_plaud_id ON public.call_recordings(plaud_recording_id);

-- Full-text search on transcripts
CREATE INDEX IF NOT EXISTS idx_call_recordings_transcript_fts ON public.call_recordings USING gin(to_tsvector('portuguese', transcript));

-- 2. CALL ANALYTICS AGGREGATED TABLE
CREATE TABLE IF NOT EXISTS public.call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Volume Metrics
  total_calls INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  avg_call_duration_minutes NUMERIC(10,2),
  
  -- Sentiment Metrics
  positive_calls INTEGER DEFAULT 0,
  neutral_calls INTEGER DEFAULT 0,
  negative_calls INTEGER DEFAULT 0,
  avg_sentiment_score NUMERIC(3,2),
  
  -- Performance Metrics
  avg_talk_time_ratio NUMERIC(3,2),
  avg_questions_asked NUMERIC(5,2),
  avg_objection_handling_score NUMERIC(3,2),
  total_closing_attempts INTEGER DEFAULT 0,
  
  -- Outcomes
  deals_closed INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  
  -- Coaching Insights
  top_strengths TEXT[],
  areas_for_improvement TEXT[],
  best_practices_identified TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_call_analytics_user ON public.call_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_period ON public.call_analytics(period_start, period_end);

-- 3. PLAUD WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS public.plaud_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event TEXT,
  payload JSONB,
  processing_status TEXT DEFAULT 'received' CHECK (processing_status IN ('received', 'success', 'error')),
  error_message TEXT,
  call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaud_webhook_logs_status ON public.plaud_webhook_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_plaud_webhook_logs_created ON public.plaud_webhook_logs(created_at DESC);

-- 4. SALES COACHING RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.sales_coaching_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE CASCADE,
  
  recommendation_type TEXT CHECK (recommendation_type IN (
    'talk_time', 'discovery_questions', 'objection_handling', 
    'closing_technique', 'active_listening', 'value_proposition'
  )),
  
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Specific Examples from Call
  timestamp_in_call INTEGER, -- seconds into the call
  transcript_excerpt TEXT,
  
  -- Action Items
  suggested_improvement TEXT,
  learning_resources JSONB DEFAULT '[]'::jsonb,
  -- [{ "type": "video", "title": "How to Handle Price Objections", "url": "..." }]
  
  -- Tracking
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_user ON public.sales_coaching_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_call ON public.sales_coaching_recommendations(call_recording_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_type ON public.sales_coaching_recommendations(recommendation_type);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaud_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_coaching_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own recordings
DROP POLICY IF EXISTS "Users can view own call recordings" ON public.call_recordings;
CREATE POLICY "Users can view own call recordings"
  ON public.call_recordings FOR SELECT
  USING (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own call recordings" ON public.call_recordings;
CREATE POLICY "Users can insert own call recordings"
  ON public.call_recordings FOR INSERT
  WITH CHECK (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own call recordings" ON public.call_recordings;
CREATE POLICY "Users can update own call recordings"
  ON public.call_recordings FOR UPDATE
  USING (recorded_by = auth.uid());

-- Analytics: Users see their own data
DROP POLICY IF EXISTS "Users can view own analytics" ON public.call_analytics;
CREATE POLICY "Users can view own analytics"
  ON public.call_analytics FOR SELECT
  USING (user_id = auth.uid());

-- Webhook logs: No RLS needed (service role only)

-- Coaching: Users see their own recommendations
DROP POLICY IF EXISTS "Users can view own coaching recommendations" ON public.sales_coaching_recommendations;
CREATE POLICY "Users can view own coaching recommendations"
  ON public.sales_coaching_recommendations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own coaching recommendations" ON public.sales_coaching_recommendations;
CREATE POLICY "Users can update own coaching recommendations"
  ON public.sales_coaching_recommendations FOR UPDATE
  USING (user_id = auth.uid());

-- 6. TRIGGERS FOR AUTOMATIC UPDATES
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_call_recordings_timestamp ON public.call_recordings;
CREATE TRIGGER update_call_recordings_timestamp
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_call_recordings_updated_at();

-- 7. FUNCTION: Auto-create tasks from action items
CREATE OR REPLACE FUNCTION auto_create_tasks_from_call()
RETURNS TRIGGER AS $$
DECLARE
  action_item JSONB;
BEGIN
  -- Only process when action_items are added/updated
  IF NEW.action_items IS NOT NULL AND jsonb_array_length(NEW.action_items) > 0 THEN
    FOR action_item IN SELECT * FROM jsonb_array_elements(NEW.action_items)
    LOOP
      -- Check if smart_tasks table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_tasks') THEN
        INSERT INTO public.smart_tasks (
          title,
          description,
          deal_id,
          assigned_to,
          due_date,
          priority,
          ai_suggested,
          ai_reasoning,
          created_by
        ) VALUES (
          action_item->>'task',
          'Action item extracted from call: ' || COALESCE(NEW.summary, 'Call recording'),
          NEW.deal_id,
          NEW.recorded_by,
          COALESCE((action_item->>'due_date')::TIMESTAMPTZ, NOW() + INTERVAL '3 days'),
          COALESCE(action_item->>'priority', 'medium'),
          TRUE,
          'Automatically extracted from call recording on ' || NEW.recording_date::DATE,
          NEW.recorded_by
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_tasks_from_call ON public.call_recordings;
CREATE TRIGGER trigger_auto_create_tasks_from_call
  AFTER INSERT OR UPDATE OF action_items ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tasks_from_call();

-- 8. FUNCTION: Update deal based on call sentiment (FIXED: sdr_deals → sales_deals)
CREATE OR REPLACE FUNCTION update_deal_from_call_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL AND NEW.sentiment IS NOT NULL THEN
    -- Update deal's last_contact_date
    UPDATE public.sales_deals
    SET 
      last_contact_date = NEW.recording_date,
      updated_at = NOW()
    WHERE id = NEW.deal_id;
    
    -- If highly negative sentiment, add a note
    IF NEW.sentiment = 'negative' AND NEW.sentiment_score < -0.5 THEN
      -- Check if sales_deal_activities exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_deal_activities') THEN
        INSERT INTO public.sales_deal_activities (
          deal_id,
          activity_type,
          description,
          new_value
        ) VALUES (
          NEW.deal_id,
          'alert',
          'Call com sentimento negativo detectado',
          jsonb_build_object(
            'call_recording_id', NEW.id,
            'sentiment_score', NEW.sentiment_score,
            'risk_signals', NEW.risk_signals
          )
        );
      END IF;
    END IF;
    
    -- If highly positive sentiment with buying signals, increase priority
    IF NEW.sentiment = 'positive' AND NEW.sentiment_score > 0.7 AND array_length(NEW.buying_signals, 1) > 2 THEN
      UPDATE public.sales_deals
      SET priority = 'high'
      WHERE id = NEW.deal_id AND priority != 'urgent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deal_from_call_sentiment ON public.call_recordings;
CREATE TRIGGER trigger_update_deal_from_call_sentiment
  AFTER INSERT OR UPDATE OF sentiment, sentiment_score ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_from_call_sentiment();

-- 9. VIEW: Call Performance Summary
CREATE OR REPLACE VIEW public.call_performance_summary AS
SELECT 
  u.id AS user_id,
  u.full_name AS user_name,
  COUNT(cr.id) AS total_calls,
  ROUND(AVG(cr.duration_seconds / 60.0), 2) AS avg_duration_minutes,
  ROUND(AVG(cr.sentiment_score), 2) AS avg_sentiment,
  ROUND(AVG(cr.talk_time_ratio), 2) AS avg_talk_ratio,
  ROUND(AVG(cr.questions_asked), 2) AS avg_questions,
  ROUND(AVG(cr.objection_handling_score), 2) AS avg_objection_handling,
  COUNT(CASE WHEN cr.sentiment = 'positive' THEN 1 END) AS positive_calls,
  COUNT(CASE WHEN cr.sentiment = 'negative' THEN 1 END) AS negative_calls,
  COUNT(CASE WHEN array_length(cr.buying_signals, 1) > 0 THEN 1 END) AS calls_with_buying_signals
FROM public.users u
LEFT JOIN public.call_recordings cr ON cr.recorded_by = u.id AND cr.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name;

-- 10. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON public.call_recordings TO authenticated;
GRANT SELECT ON public.call_analytics TO authenticated;
GRANT SELECT, UPDATE ON public.sales_coaching_recommendations TO authenticated;
GRANT SELECT ON public.call_performance_summary TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next Steps:
-- 1. Deploy Edge Function: plaud-webhook-receiver
-- 2. Test with sample recording
-- =====================================================



-- ============================================================================
-- RESUMO DA MIGRAÃ‡ÃƒO
-- ============================================================================
-- Migrations processadas: 148
-- Tabelas criadas: ~198
-- FunÃ§Ãµes criadas: ~104
-- Triggers criados: ~113
-- Policies criadas: ~406
-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
