-- CICLO 11: Governança, Permissões & Multilocação
-- Execute no Supabase SQL Editor

-- 1) Tipos básicos
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM ('admin','manager','sdr','viewer');

-- 2) Tenants / workspaces
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_name_idx ON public.tenants(LOWER(name));

-- 3) Membros por tenant (user_id + role)
CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON public.tenant_members(user_id);

-- 4) Coluna tenant_id em tabelas de domínio
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.digital_signals ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.tech_signals ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.person_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.threads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.run_events ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.provider_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.alert_rules ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.alert_occurrences ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.maturity_scores ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.maturity_recos ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.fit_totvs ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 5) Índices compostos (tenant + chaves de consulta)
CREATE INDEX IF NOT EXISTS companies_tenant_idx ON public.companies(tenant_id, domain, cnpj);
CREATE INDEX IF NOT EXISTS leads_tenant_idx ON public.leads(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS threads_tenant_idx ON public.threads(tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS messages_tenant_idx ON public.messages(tenant_id, thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS runs_tenant_idx ON public.runs(tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS run_events_tenant_idx ON public.run_events(tenant_id, run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_logs_tenant_idx ON public.provider_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS alert_rules_tenant_idx ON public.alert_rules(tenant_id, event);
CREATE INDEX IF NOT EXISTS alert_occ_tenant_idx ON public.alert_occurrences(tenant_id, detected_at DESC);

-- 6) Helper: current_tenant() a partir de JWT claim 'tenant_id'
CREATE OR REPLACE FUNCTION public.current_tenant() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'tenant_id','')::uuid
$$;

-- 7) RLS: habilitar nas tabelas sensíveis
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_recos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_totvs ENABLE ROW LEVEL SECURITY;

-- 8) Políticas: SELECT (todos os membros do tenant)
CREATE POLICY IF NOT EXISTS sel_companies_by_tenant ON public.companies
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_leads_by_tenant ON public.leads
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_threads_by_tenant ON public.threads
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_messages_by_tenant ON public.messages
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_runs_by_tenant ON public.runs
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_digital_by_tenant ON public.digital_signals
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_tech_by_tenant ON public.tech_signals
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_people_by_tenant ON public.people
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_playbooks_by_tenant ON public.playbooks
  FOR SELECT USING (tenant_id = public.current_tenant());

CREATE POLICY IF NOT EXISTS sel_alerts_by_tenant ON public.alert_rules
  FOR SELECT USING (tenant_id = public.current_tenant());

-- 9) Políticas: INSERT/UPDATE (admin, manager, sdr conforme tabela)
-- Companies: admin/manager
CREATE POLICY IF NOT EXISTS ins_companies_by_role ON public.companies
  FOR INSERT WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager'))
  );

CREATE POLICY IF NOT EXISTS upd_companies_by_role ON public.companies
  FOR UPDATE USING (tenant_id = public.current_tenant())
  WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager'))
  );

-- Leads: admin/manager/sdr
CREATE POLICY IF NOT EXISTS ins_leads_by_role ON public.leads
  FOR INSERT WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager','sdr'))
  );

CREATE POLICY IF NOT EXISTS upd_leads_by_role ON public.leads
  FOR UPDATE USING (tenant_id = public.current_tenant())
  WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager','sdr'))
  );

-- Messages: admin/manager/sdr
CREATE POLICY IF NOT EXISTS ins_messages_by_role ON public.messages
  FOR INSERT WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager','sdr'))
  );

-- Runs: admin/manager/sdr
CREATE POLICY IF NOT EXISTS ins_runs_by_role ON public.runs
  FOR INSERT WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager','sdr'))
  );

-- Alert Rules: admin/manager
CREATE POLICY IF NOT EXISTS ins_alerts_by_role ON public.alert_rules
  FOR INSERT WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager'))
  );

CREATE POLICY IF NOT EXISTS upd_alerts_by_role ON public.alert_rules
  FOR UPDATE USING (tenant_id = public.current_tenant())
  WITH CHECK (
    tenant_id = public.current_tenant()
    AND EXISTS (SELECT 1 FROM public.tenant_members tm
                WHERE tm.tenant_id = public.current_tenant()
                  AND tm.user_id = auth.uid()
                  AND tm.role IN ('admin','manager'))
  );

-- 10) IMPORTANTE: Service Role (server) IGNORA RLS!
-- Sempre filtrar manualmente por tenant_id nas rotas server-side
-- Exemplo: supabaseAdmin.from("companies").select("*").eq("tenant_id", tenantId)

