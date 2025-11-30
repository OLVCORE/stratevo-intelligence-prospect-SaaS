-- ============================================================================
-- MIGRATION: CRM Completo - Réplica do Olinda (Multi-Tenant)
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Cria todas as tabelas do CRM do Olinda adaptadas para multi-tenant
-- ============================================================================

-- ============================================
-- ENUM: APP_ROLE (Roles do Olinda)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'admin',
      'direcao',
      'gerencia',
      'gestor',
      'sales',
      'sdr',
      'vendedor',
      'viewer'
    );
  END IF;
END $$;

-- ============================================
-- TABELA: USER_ROLES (Padrão Olinda)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FUNÇÃO: HAS_ROLE (Padrão Olinda)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- ============================================
-- PROPOSAL_ITEMS (Itens de Propostas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Item
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  
  -- Ordem
  order_index INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_items_tenant_id ON public.proposal_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal_id ON public.proposal_items(proposal_id);

ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposal items from their tenant"
  ON public.proposal_items FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage proposal items in their tenant"
  ON public.proposal_items FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- PROPOSAL_VERSIONS (Versões de Propostas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Versão
  version_number INTEGER NOT NULL,
  changes_summary TEXT,
  items_snapshot JSONB NOT NULL,
  total_price NUMERIC NOT NULL,
  
  -- Criador
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_tenant_id ON public.proposal_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);

ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposal versions from their tenant"
  ON public.proposal_versions FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- APPOINTMENTS (Agendamentos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID REFERENCES public.deals(id),
  
  -- Agendamento
  title TEXT NOT NULL,
  description TEXT,
  appointment_type TEXT NOT NULL, -- meeting, demo, consultation, visit, call
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Localização
  location TEXT,
  location_type TEXT, -- physical, online, phone
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  -- Participantes
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(tenant_id, scheduled_date);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments from their tenant"
  ON public.appointments FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage appointments in their tenant"
  ON public.appointments FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- CONFIRMED_OPPORTUNITIES (Abstração de confirmed_events)
-- ============================================
CREATE TABLE IF NOT EXISTS public.confirmed_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  proposal_id UUID REFERENCES public.proposals(id),
  
  -- Oportunidade
  opportunity_type TEXT NOT NULL, -- project, service, product, license, etc
  title TEXT NOT NULL,
  description TEXT,
  
  -- Datas
  start_date DATE NOT NULL,
  end_date DATE,
  delivery_date DATE,
  
  -- Valores
  total_value NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT DEFAULT 'active', -- active, completed, cancelled, on_hold
  scope_quantity INTEGER, -- quantidade genérica (convidados, unidades, etc)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confirmed_opportunities_tenant_id ON public.confirmed_opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_opportunities_lead_id ON public.confirmed_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_opportunities_status ON public.confirmed_opportunities(tenant_id, status);

ALTER TABLE public.confirmed_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view confirmed opportunities from their tenant"
  ON public.confirmed_opportunities FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage confirmed opportunities in their tenant"
  ON public.confirmed_opportunities FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- AUTOMATION_LOGS (Logs de Automações)
-- ============================================
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  
  -- Execução
  trigger_type TEXT NOT NULL,
  trigger_data JSONB,
  actions_executed JSONB NOT NULL,
  execution_status TEXT DEFAULT 'success', -- success, failed, partial
  error_message TEXT,
  
  -- Contexto
  entity_type TEXT, -- lead, deal, proposal, etc
  entity_id UUID,
  
  -- Timestamp
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_tenant_id ON public.automation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(automation_rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON public.automation_logs(tenant_id, executed_at DESC);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automation logs from their tenant"
  ON public.automation_logs FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- EMAIL_HISTORY (Histórico de Emails)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID REFERENCES public.deals(id),
  
  -- Email
  template_id UUID REFERENCES public.email_templates(id),
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, failed
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_reason TEXT,
  
  -- Metadata
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_history_tenant_id ON public.email_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_history_lead_id ON public.email_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON public.email_history(tenant_id, sent_at DESC);

ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email history from their tenant"
  ON public.email_history FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- NOTIFICATIONS (Notificações)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notificação
  type TEXT NOT NULL, -- lead_assigned, deal_stage_change, task_due, etc
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

-- ============================================
-- GAMIFICATION (Gamificação)
-- ============================================
CREATE TABLE IF NOT EXISTS public.gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pontuação
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT[] DEFAULT '{}',
  
  -- Estatísticas
  leads_created INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  proposals_sent INTEGER DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gamification_tenant_id ON public.gamification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON public.gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points ON public.gamification(tenant_id, total_points DESC);

ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gamification from their tenant"
  ON public.gamification FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- POINT_ACTIVITIES (Atividades de Pontos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.point_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Atividade
  activity_type TEXT NOT NULL, -- lead_created, deal_closed, proposal_sent, etc
  points INTEGER NOT NULL,
  description TEXT,
  
  -- Relacionamento
  entity_type TEXT, -- lead, deal, proposal, etc
  entity_id UUID,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_activities_tenant_id ON public.point_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_activities_user_id ON public.point_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_point_activities_created_at ON public.point_activities(tenant_id, created_at DESC);

ALTER TABLE public.point_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view point activities from their tenant"
  ON public.point_activities FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- LEAD_CONTACTS (Contatos de Leads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Contato
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_decision_maker BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_contacts_tenant_id ON public.lead_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead_id ON public.lead_contacts(lead_id);

ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead contacts from their tenant"
  ON public.lead_contacts FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage lead contacts in their tenant"
  ON public.lead_contacts FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- LEAD_FILES (Arquivos de Leads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Arquivo
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_files_tenant_id ON public.lead_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_files_lead_id ON public.lead_files(lead_id);

ALTER TABLE public.lead_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead files from their tenant"
  ON public.lead_files FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage lead files in their tenant"
  ON public.lead_files FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- LEAD_HISTORY (Histórico de Leads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Mudança
  change_type TEXT NOT NULL, -- status_change, field_update, assignment, etc
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_data JSONB,
  
  -- Usuário
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_history_tenant_id ON public.lead_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON public.lead_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_changed_at ON public.lead_history(tenant_id, changed_at DESC);

ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead history from their tenant"
  ON public.lead_history FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- LEAD_DUPLICATES (Duplicatas de Leads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  original_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  duplicate_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Detecção
  similarity_score NUMERIC,
  matched_fields TEXT[],
  detected_at TIMESTAMPTZ DEFAULT now(),
  
  -- Resolução
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_action TEXT, -- merged, ignored, kept_separate
  
  UNIQUE(tenant_id, original_lead_id, duplicate_lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_duplicates_tenant_id ON public.lead_duplicates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_original ON public.lead_duplicates(original_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_duplicate ON public.lead_duplicates(duplicate_lead_id);

ALTER TABLE public.lead_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead duplicates from their tenant"
  ON public.lead_duplicates FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- AI_LEAD_ANALYSIS (Análise IA de Leads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_lead_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Análise
  predicted_probability NUMERIC,
  predicted_close_date DATE,
  recommended_actions JSONB,
  score_version TEXT,
  analysis_data JSONB,
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_lead_analysis_tenant_id ON public.ai_lead_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_lead_analysis_lead_id ON public.ai_lead_analysis(lead_id);

ALTER TABLE public.ai_lead_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI lead analysis from their tenant"
  ON public.ai_lead_analysis FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- AI_INSIGHTS (Insights de IA)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Insight
  insight_type TEXT NOT NULL, -- trend, prediction, recommendation, etc
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  insight_data JSONB,
  
  -- Relacionamento
  entity_type TEXT, -- lead, deal, pipeline, etc
  entity_id UUID,
  
  -- Status
  priority TEXT DEFAULT 'medium', -- low, medium, high
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant_id ON public.ai_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights(tenant_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON public.ai_insights(tenant_id, created_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI insights from their tenant"
  ON public.ai_insights FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- AI_PREDICTIONS_HISTORY (Histórico de Predições)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_predictions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID REFERENCES public.deals(id),
  
  -- Predição
  prediction_type TEXT NOT NULL, -- close_probability, churn_risk, upsell_opportunity, etc
  predicted_value NUMERIC,
  predicted_date DATE,
  confidence_score NUMERIC,
  prediction_data JSONB,
  
  -- Resultado
  actual_value NUMERIC,
  actual_date DATE,
  accuracy_score NUMERIC,
  
  -- Timestamp
  predicted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_history_tenant_id ON public.ai_predictions_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_history_lead_id ON public.ai_predictions_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_history_deal_id ON public.ai_predictions_history(deal_id);

ALTER TABLE public.ai_predictions_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI predictions history from their tenant"
  ON public.ai_predictions_history FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- CONVERSATION_SENTIMENT (Sentimento de Conversas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID REFERENCES public.deals(id),
  
  -- Sentimento
  sentiment_score NUMERIC, -- -1 a 1
  sentiment_label TEXT, -- positive, neutral, negative
  confidence NUMERIC,
  
  -- Contexto
  conversation_source TEXT, -- email, call, chat, etc
  conversation_id UUID,
  analyzed_text TEXT,
  
  -- Timestamp
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_tenant_id ON public.conversation_sentiment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sentiment_lead_id ON public.conversation_sentiment(lead_id);

ALTER TABLE public.conversation_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation sentiment from their tenant"
  ON public.conversation_sentiment FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- CALENDAR_INTEGRATIONS (Integrações de Calendário)
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Integração
  provider TEXT NOT NULL, -- google, outlook, apple, etc
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_tenant_id ON public.calendar_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON public.calendar_integrations(user_id);

ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar integrations"
  ON public.calendar_integrations FOR SELECT
  USING (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage their own calendar integrations"
  ON public.calendar_integrations FOR ALL
  USING (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

-- ============================================
-- SYNCED_CALENDAR_EVENTS (Eventos Sincronizados)
-- ============================================
CREATE TABLE IF NOT EXISTS public.synced_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  calendar_integration_id UUID NOT NULL REFERENCES public.calendar_integrations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  
  -- Evento
  provider_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Status
  sync_status TEXT DEFAULT 'synced', -- synced, pending, failed
  last_sync_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, calendar_integration_id, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_synced_calendar_events_tenant_id ON public.synced_calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synced_calendar_events_appointment_id ON public.synced_calendar_events(appointment_id);

ALTER TABLE public.synced_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view synced calendar events from their tenant"
  ON public.synced_calendar_events FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- PAYMENT_TRANSACTIONS (Transações de Pagamento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  confirmed_opportunity_id UUID REFERENCES public.confirmed_opportunities(id),
  proposal_id UUID REFERENCES public.proposals(id),
  
  -- Transação
  transaction_type TEXT NOT NULL, -- payment, refund, partial_payment
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT, -- credit_card, bank_transfer, pix, etc
  payment_provider TEXT, -- stripe, mercado_pago, etc
  provider_transaction_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id ON public.payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_opportunity_id ON public.payment_transactions(confirmed_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(tenant_id, status);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment transactions from their tenant"
  ON public.payment_transactions FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Admins can manage payment transactions"
  ON public.payment_transactions FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    AND public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- PAYMENT_SUBSCRIPTIONS (Assinaturas de Pagamento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  confirmed_opportunity_id UUID REFERENCES public.confirmed_opportunities(id),
  
  -- Assinatura
  subscription_type TEXT NOT NULL, -- monthly, quarterly, annual, etc
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  billing_cycle_start DATE NOT NULL,
  billing_cycle_end DATE,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, cancelled, paused, expired
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_tenant_id ON public.payment_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_status ON public.payment_subscriptions(tenant_id, status);

ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment subscriptions from their tenant"
  ON public.payment_subscriptions FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE TRIGGER update_proposal_items_updated_at
  BEFORE UPDATE ON public.proposal_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_confirmed_opportunities_updated_at
  BEFORE UPDATE ON public.confirmed_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_contacts_updated_at
  BEFORE UPDATE ON public.lead_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_subscriptions_updated_at
  BEFORE UPDATE ON public.payment_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.proposal_items IS 'Itens individuais de propostas comerciais';
COMMENT ON TABLE public.proposal_versions IS 'Histórico de versões de propostas';
COMMENT ON TABLE public.appointments IS 'Agendamentos e reuniões com leads/deals';
COMMENT ON TABLE public.confirmed_opportunities IS 'Oportunidades confirmadas (abstração de eventos)';
COMMENT ON TABLE public.automation_logs IS 'Logs de execução de regras de automação';
COMMENT ON TABLE public.email_history IS 'Histórico de emails enviados';
COMMENT ON TABLE public.notifications IS 'Notificações do sistema para usuários';
COMMENT ON TABLE public.gamification IS 'Sistema de gamificação e pontuação';
COMMENT ON TABLE public.point_activities IS 'Atividades que geram pontos';
COMMENT ON TABLE public.lead_contacts IS 'Contatos adicionais de leads';
COMMENT ON TABLE public.lead_files IS 'Arquivos anexados a leads';
COMMENT ON TABLE public.lead_history IS 'Histórico de mudanças em leads';
COMMENT ON TABLE public.lead_duplicates IS 'Detecção de leads duplicados';
COMMENT ON TABLE public.ai_lead_analysis IS 'Análises de IA para leads';
COMMENT ON TABLE public.ai_insights IS 'Insights gerados por IA';
COMMENT ON TABLE public.ai_predictions_history IS 'Histórico de predições de IA';
COMMENT ON TABLE public.conversation_sentiment IS 'Análise de sentimento de conversas';
COMMENT ON TABLE public.calendar_integrations IS 'Integrações com calendários externos';
COMMENT ON TABLE public.synced_calendar_events IS 'Eventos sincronizados de calendários';
COMMENT ON TABLE public.payment_transactions IS 'Transações de pagamento';
COMMENT ON TABLE public.payment_subscriptions IS 'Assinaturas de pagamento recorrente';


