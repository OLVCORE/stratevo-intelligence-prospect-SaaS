-- CICLO 10: Alertas & Watchers
-- Execute no Supabase SQL Editor

-- Tipos
CREATE TYPE public.alert_channel AS ENUM ('email','whatsapp');
CREATE TYPE public.alert_status  AS ENUM ('active','paused');
CREATE TYPE public.alert_event   AS ENUM ('company_status_change','news_spike','tech_detected','sdr_reply','delivery_error');

-- Regras de Alerta
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,                 -- multi-tenant (futuro)
  company_id UUID,                -- empresa específica (null = global)
  name TEXT NOT NULL,
  event public.alert_event NOT NULL,
  conditions JSONB,               -- parâmetros por tipo
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{type:'email',to:'...'}]
  status public.alert_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alert_rules_event_idx ON public.alert_rules(event);
CREATE INDEX IF NOT EXISTS alert_rules_company_idx ON public.alert_rules(company_id);
CREATE INDEX IF NOT EXISTS alert_rules_status_idx ON public.alert_rules(status);

-- Ocorrências de Alerta
CREATE TABLE IF NOT EXISTS public.alert_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  company_id UUID,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB,     -- dados que dispararam o alerta
  notified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS alert_occ_rule_idx ON public.alert_occurrences(rule_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS alert_occ_notified_idx ON public.alert_occurrences(notified) WHERE notified = FALSE;

-- Jobs de Digest
CREATE TABLE IF NOT EXISTS public.digest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence TEXT NOT NULL,          -- 'daily' | 'weekly'
  to_email TEXT,
  to_whatsapp TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  meta JSONB
);

CREATE INDEX IF NOT EXISTS digest_jobs_next_run_idx ON public.digest_jobs(next_run_at) WHERE status = 'scheduled';

-- Adiciona coluna lead_id em provider_logs se não existir
ALTER TABLE public.provider_logs ADD COLUMN IF NOT EXISTS lead_id UUID;

-- Função para reagendar digests
CREATE OR REPLACE FUNCTION public.digest_reschedule(job_id UUID, minutes INT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.digest_jobs 
  SET next_run_at = NOW() + make_interval(mins => minutes), 
      last_run_at = NOW() 
  WHERE id = job_id;
END $$;

-- Trigger updated_at para alert_rules
DROP TRIGGER IF EXISTS trg_alert_rules_updated_at ON public.alert_rules;
CREATE TRIGGER trg_alert_rules_updated_at
BEFORE UPDATE ON public.alert_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

