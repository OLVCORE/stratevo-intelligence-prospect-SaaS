-- ============================================================================
-- CRM INTERNO - Tabelas core (world-class architecture)
-- ============================================================================
-- Integrado ao schema existente: companies, decision_makers, auth.users.
-- Nomes crm_* para coexistir com leads/deals/sdr_deals atuais.
-- FKs: company_profiles → companies; users → auth.users.
-- ============================================================================

-- 1. PIPELINES
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  pipeline_name TEXT NOT NULL,
  pipeline_description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'BRL',
  allowed_user_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_pipelines_tenant ON public.crm_pipelines(tenant_id);

-- 2. ESTÁGIOS DO PIPELINE
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_description TEXT,
  stage_order INTEGER NOT NULL,
  win_probability_default DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  auto_actions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_order ON public.crm_pipeline_stages(pipeline_id, stage_order);

-- 3. LEADS CRM (integrado a companies e decision_makers)
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  decision_maker_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id),
  lead_name TEXT NOT NULL,
  lead_type TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  lead_source TEXT,
  lead_quality TEXT,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  conversion_probability DECIMAL(5,2),
  score_breakdown JSONB,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  industry TEXT,
  company_size TEXT,
  annual_revenue BIGINT,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  total_interactions INTEGER DEFAULT 0,
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_emails_clicked INTEGER DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  total_meetings INTEGER DEFAULT 0,
  enrichment_status TEXT,
  enrichment_last_run_at TIMESTAMPTZ,
  data_confidence DECIMAL(3,2),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON public.crm_leads(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON public.crm_leads(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_company ON public.crm_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON public.crm_leads(next_follow_up_at) WHERE deleted_at IS NULL AND next_follow_up_at IS NOT NULL;

-- 4. DEALS CRM
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  pipeline_stage_id UUID REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
  deal_name TEXT NOT NULL,
  deal_description TEXT,
  deal_value DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  expected_revenue DECIMAL(15,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  final_value DECIMAL(15,2),
  win_probability DECIMAL(5,2),
  weighted_value DECIMAL(15,2),
  status TEXT NOT NULL DEFAULT 'open',
  lost_reason TEXT,
  lost_reason_details TEXT,
  expected_close_date DATE,
  actual_close_date DATE,
  first_contact_date DATE,
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  days_in_current_stage INTEGER DEFAULT 0,
  stage_history JSONB,
  products JSONB,
  competitors TEXT[],
  competitive_advantage TEXT,
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  tags TEXT[],
  deal_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON public.crm_deals(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(pipeline_stage_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON public.crm_deals(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant ON public.crm_deals(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON public.crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_close_date ON public.crm_deals(expected_close_date) WHERE deleted_at IS NULL;

-- 5. ATIVIDADES (entidade polimórfica: lead, deal, contact, company)
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_subtype TEXT,
  subject TEXT,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  participants JSONB,
  metadata JSONB,
  outcome TEXT,
  sentiment TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_entity ON public.crm_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON public.crm_activities(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON public.crm_activities(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_activities_created ON public.crm_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_tenant ON public.crm_activities(tenant_id);

-- 6. TAREFAS
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  due_time TIME,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  remind_before_minutes INTEGER,
  reminded_at TIMESTAMPTZ,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned ON public.crm_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON public.crm_tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead ON public.crm_tasks(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal ON public.crm_tasks(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_tasks_tenant ON public.crm_tasks(tenant_id);

-- RLS (habilitar; políticas básicas por tenant onde aplicável)
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir authenticated (detalhamento por tenant pode ser adicionado depois)
DROP POLICY IF EXISTS "Authenticated read crm_pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Authenticated insert crm_pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Authenticated update crm_pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Authenticated delete crm_pipelines" ON public.crm_pipelines;
CREATE POLICY "Authenticated read crm_pipelines" ON public.crm_pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert crm_pipelines" ON public.crm_pipelines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update crm_pipelines" ON public.crm_pipelines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete crm_pipelines" ON public.crm_pipelines FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read crm_pipeline_stages" ON public.crm_pipeline_stages;
DROP POLICY IF EXISTS "Authenticated insert crm_pipeline_stages" ON public.crm_pipeline_stages;
DROP POLICY IF EXISTS "Authenticated update crm_pipeline_stages" ON public.crm_pipeline_stages;
DROP POLICY IF EXISTS "Authenticated delete crm_pipeline_stages" ON public.crm_pipeline_stages;
CREATE POLICY "Authenticated read crm_pipeline_stages" ON public.crm_pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert crm_pipeline_stages" ON public.crm_pipeline_stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update crm_pipeline_stages" ON public.crm_pipeline_stages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete crm_pipeline_stages" ON public.crm_pipeline_stages FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Authenticated insert crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Authenticated update crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Authenticated delete crm_leads" ON public.crm_leads;
CREATE POLICY "Authenticated read crm_leads" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert crm_leads" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update crm_leads" ON public.crm_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete crm_leads" ON public.crm_leads FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Authenticated insert crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Authenticated update crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Authenticated delete crm_deals" ON public.crm_deals;
CREATE POLICY "Authenticated read crm_deals" ON public.crm_deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert crm_deals" ON public.crm_deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update crm_deals" ON public.crm_deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete crm_deals" ON public.crm_deals FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Authenticated insert crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Authenticated update crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Authenticated delete crm_activities" ON public.crm_activities;
CREATE POLICY "Authenticated read crm_activities" ON public.crm_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert crm_activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update crm_activities" ON public.crm_activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete crm_activities" ON public.crm_activities FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Authenticated insert crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Authenticated update crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Authenticated delete crm_tasks" ON public.crm_tasks;
CREATE POLICY "Authenticated read crm_tasks" ON public.crm_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert crm_tasks" ON public.crm_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update crm_tasks" ON public.crm_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete crm_tasks" ON public.crm_tasks FOR DELETE TO authenticated USING (true);

COMMENT ON TABLE public.crm_pipelines IS 'CRM interno: pipelines de vendas (world-class)';
COMMENT ON TABLE public.crm_pipeline_stages IS 'CRM interno: estágios por pipeline';
COMMENT ON TABLE public.crm_leads IS 'CRM interno: leads integrados a companies e decision_makers';
COMMENT ON TABLE public.crm_deals IS 'CRM interno: oportunidades/deals por pipeline';
COMMENT ON TABLE public.crm_activities IS 'CRM interno: atividades (email, call, meeting, note)';
COMMENT ON TABLE public.crm_tasks IS 'CRM interno: tarefas e follow-ups';
