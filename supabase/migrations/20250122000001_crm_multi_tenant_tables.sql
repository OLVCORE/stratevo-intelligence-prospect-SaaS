-- ============================================================================
-- MIGRATION: CRM Multi-Tenant Tables
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Cria tabelas do CRM com suporte multi-tenant
-- ============================================================================

-- ============================================
-- LEADS (Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- MULTI-TENANT KEY
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Informações Básicas
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  
  -- Dados Específicos por Modelo de Negócio (JSONB Flexível)
  business_data JSONB DEFAULT '{}'::JSONB,
  -- Exemplos:
  -- Eventos: { "event_type": "casamento", "event_date": "2025-06-15", "guest_count": 200 }
  -- Comércio Exterior: { "product_category": "eletrônicos", "destination_country": "EUA", "volume": "20 containers" }
  -- Software: { "company_size": "50-200", "current_stack": ["Salesforce", "HubSpot"], "pain_points": [...] }
  
  -- Pipeline
  status TEXT DEFAULT 'novo', -- novo, qualificado, contato_inicial, proposta, negociacao, fechado, perdido
  source TEXT DEFAULT 'website',
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Scoring
  lead_score INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Qualificação
  budget NUMERIC,
  timeline TEXT,
  decision_maker BOOLEAN DEFAULT false,
  
  -- Tracking
  last_contact_date TIMESTAMPTZ,
  next_followup_date TIMESTAMPTZ,
  
  -- Contadores
  notes_count INTEGER DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(tenant_id, email);

-- RLS Multi-Tenant
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view leads from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Users can view leads from their tenant') THEN
    DROP POLICY "Users can view leads from their tenant" ON public.leads;
  END IF;
END $$;
CREATE POLICY "Users can view leads from their tenant"
  ON public.leads FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Users can create leads in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Users can create leads in their tenant') THEN
    DROP POLICY "Users can create leads in their tenant" ON public.leads;
  END IF;
END $$;
CREATE POLICY "Users can create leads in their tenant"
  ON public.leads FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Policy: Users can update leads in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Users can update leads in their tenant') THEN
    DROP POLICY "Users can update leads in their tenant" ON public.leads;
  END IF;
END $$;
CREATE POLICY "Users can update leads in their tenant"
  ON public.leads FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- Policy: Admins can delete leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Admins can delete leads') THEN
    DROP POLICY "Admins can delete leads" ON public.leads;
  END IF;
END $$;
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (
    tenant_id = get_current_tenant_id() 
    AND has_tenant_role(tenant_id, 'admin')
  );

-- ============================================
-- DEALS (Pipeline de Vendas Multi-Tenant) - Criar antes de activities
-- ============================================
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  
  -- Pipeline adaptável
  stage TEXT NOT NULL, -- discovery, qualification, proposal, negotiation, closed_won, closed_lost
  probability INTEGER DEFAULT 50,
  
  -- Datas
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Responsável
  owner_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  priority TEXT DEFAULT 'medium',
  source TEXT,
  tags TEXT[],
  lost_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna stage existe (não destrutivo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'stage'
  ) THEN
    ALTER TABLE public.deals ADD COLUMN stage TEXT;
    UPDATE public.deals SET stage = 'discovery' WHERE stage IS NULL;
    ALTER TABLE public.deals
      ALTER COLUMN stage SET DEFAULT 'discovery',
      ALTER COLUMN stage SET NOT NULL;
  ELSE
    ALTER TABLE public.deals
      ALTER COLUMN stage SET DEFAULT 'discovery';
    UPDATE public.deals SET stage = 'discovery' WHERE stage IS NULL;
    ALTER TABLE public.deals
      ALTER COLUMN stage SET NOT NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON public.deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON public.deals(lead_id);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view deals from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='deals' AND policyname='Users can view deals from their tenant') THEN
    DROP POLICY "Users can view deals from their tenant" ON public.deals;
  END IF;
END $$;
CREATE POLICY "Users can view deals from their tenant"
  ON public.deals FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Users can manage deals in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='deals' AND policyname='Users can manage deals in their tenant') THEN
    DROP POLICY "Users can manage deals in their tenant" ON public.deals;
  END IF;
END $$;
CREATE POLICY "Users can manage deals in their tenant"
  ON public.deals FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- ACTIVITIES (Tarefas/Atividades Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  
  -- Tipo de atividade adaptável
  type TEXT NOT NULL, -- call, email, meeting, task, visit, demo, proposal, follow_up, shipping_update, customs_clearance
  subject TEXT NOT NULL,
  description TEXT,
  
  -- Agendamento
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Responsável
  created_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON public.activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(tenant_id, due_date);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activities' AND policyname='Users can view activities from their tenant') THEN
    DROP POLICY "Users can view activities from their tenant" ON public.activities;
  END IF;
END $$;
CREATE POLICY "Users can view activities from their tenant"
  ON public.activities FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Users can manage activities in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activities' AND policyname='Users can manage activities in their tenant') THEN
    DROP POLICY "Users can manage activities in their tenant" ON public.activities;
  END IF;
END $$;
CREATE POLICY "Users can manage activities in their tenant"
  ON public.activities FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- PROPOSALS (Propostas Multi-Tenant e Flexíveis)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  
  -- Identificação
  proposal_number TEXT UNIQUE NOT NULL,
  
  -- Tipo adaptável por modelo de negócio
  proposal_type TEXT NOT NULL, -- commercial, event, export_quote, software_license, logistics_contract
  
  -- Valores
  total_price NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  final_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Estrutura flexível de itens
  items JSONB DEFAULT '[]'::JSONB,
  -- Exemplo Eventos: [{"category": "venue", "name": "Espaço", "price": 10000}, ...]
  -- Exemplo Software: [{"license_type": "enterprise", "users": 100, "price": 50000}, ...]
  
  -- Termos e condições adaptáveis
  terms_and_conditions TEXT,
  payment_terms JSONB,
  delivery_terms JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
  valid_until DATE NOT NULL,
  
  -- Assinatura
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  
  -- Arquivos
  pdf_url TEXT,
  
  -- Datas
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_tenant_id ON public.proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(tenant_id, status);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view proposals from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposals' AND policyname='Users can view proposals from their tenant') THEN
    DROP POLICY "Users can view proposals from their tenant" ON public.proposals;
  END IF;
END $$;
CREATE POLICY "Users can view proposals from their tenant"
  ON public.proposals FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Users can manage proposals in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposals' AND policyname='Users can manage proposals in their tenant') THEN
    DROP POLICY "Users can manage proposals in their tenant" ON public.proposals;
  END IF;
END $$;
CREATE POLICY "Users can manage proposals in their tenant"
  ON public.proposals FOR ALL
  USING (tenant_id = get_current_tenant_id());


-- ============================================
-- AUTOMATIONS (Regras de Automação Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Configuração
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- status_change, field_update, time_based, webhook
  trigger_condition JSONB NOT NULL,
  actions JSONB NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON public.automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_rules(tenant_id, is_active);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view automations from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='automation_rules' AND policyname='Users can view automations from their tenant') THEN
    DROP POLICY "Users can view automations from their tenant" ON public.automation_rules;
  END IF;
END $$;
CREATE POLICY "Users can view automations from their tenant"
  ON public.automation_rules FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Admins can manage automations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='automation_rules' AND policyname='Admins can manage automations') THEN
    DROP POLICY "Admins can manage automations" ON public.automation_rules;
  END IF;
END $$;
CREATE POLICY "Admins can manage automations"
  ON public.automation_rules FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    AND has_tenant_role(tenant_id, 'admin')
  );

-- ============================================
-- EMAIL TEMPLATES (Templates Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Template
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT, -- follow_up, proposal, welcome, shipping_notification, etc
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna category existe antes de criar índices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_templates'
      AND column_name = 'category'
  ) THEN
    ALTER TABLE public.email_templates ADD COLUMN category TEXT;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_id ON public.email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(tenant_id, category);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_templates' AND policyname='Users can view templates from their tenant') THEN
    DROP POLICY "Users can view templates from their tenant" ON public.email_templates;
  END IF;
END $$;
CREATE POLICY "Users can view templates from their tenant"
  ON public.email_templates FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Admins can manage templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_templates' AND policyname='Admins can manage templates') THEN
    DROP POLICY "Admins can manage templates" ON public.email_templates;
  END IF;
END $$;
CREATE POLICY "Admins can manage templates"
  ON public.email_templates FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    AND has_tenant_role(tenant_id, 'admin')
  );

-- ============================================
-- TRIGGERS PARA UPDATED_AT (Idempotentes)
-- ============================================
-- Trigger: update_leads_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_leads_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'leads'
  ) THEN
    DROP TRIGGER update_leads_updated_at ON public.leads;
  END IF;
END $$;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_activities_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_activities_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'activities'
  ) THEN
    DROP TRIGGER update_activities_updated_at ON public.activities;
  END IF;
END $$;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_proposals_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_proposals_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'proposals'
  ) THEN
    DROP TRIGGER update_proposals_updated_at ON public.proposals;
  END IF;
END $$;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_deals_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_deals_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'deals'
  ) THEN
    DROP TRIGGER update_deals_updated_at ON public.deals;
  END IF;
END $$;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_automation_rules_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_automation_rules_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'automation_rules'
  ) THEN
    DROP TRIGGER update_automation_rules_updated_at ON public.automation_rules;
  END IF;
END $$;
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: update_email_templates_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_email_templates_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'email_templates'
  ) THEN
    DROP TRIGGER update_email_templates_updated_at ON public.email_templates;
  END IF;
END $$;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.leads IS 'Leads do CRM com suporte multi-tenant e campos flexíveis por modelo de negócio';
COMMENT ON TABLE public.activities IS 'Atividades e tarefas relacionadas a leads e deals';
COMMENT ON TABLE public.proposals IS 'Propostas comerciais com estrutura flexível de itens';
COMMENT ON TABLE public.deals IS 'Pipeline de vendas com estágios adaptáveis por modelo de negócio';
COMMENT ON TABLE public.automation_rules IS 'Regras de automação do CRM por tenant';
COMMENT ON TABLE public.email_templates IS 'Templates de email customizáveis por tenant';

