-- CICLO 8: Relatórios & Export (PDF/CSV)
-- Execute no Supabase SQL Editor

-- Auditoria de ações (gerar, exportar, enviar)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT,                           -- e-mail do usuário/SDR
  action TEXT NOT NULL,                 -- 'report_create' | 'report_send' | 'csv_export'
  entity TEXT,                          -- 'company' | 'report' | 'csv'
  entity_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_log(created_at DESC);

-- Agendamentos de relatório
CREATE TABLE IF NOT EXISTS public.report_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,               -- 'inteligencia360'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled'|'running'|'sent'|'failed'
  scheduled_for TIMESTAMPTZ NOT NULL,   -- horário desejado (UTC)
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_jobs_company ON public.report_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_report_jobs_status ON public.report_jobs(status);
CREATE INDEX IF NOT EXISTS idx_report_jobs_scheduled_for ON public.report_jobs(scheduled_for);

-- Trigger updated_at para report_jobs
DROP TRIGGER IF EXISTS trg_report_jobs_updated_at ON public.report_jobs;
CREATE TRIGGER trg_report_jobs_updated_at
BEFORE UPDATE ON public.report_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

