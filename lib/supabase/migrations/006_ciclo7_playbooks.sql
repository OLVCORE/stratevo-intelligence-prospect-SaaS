-- CICLO 7: Playbooks & Sequencer com A/B Testing
-- Execute no Supabase SQL Editor

-- Playbooks (metadados)
CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  persona TEXT,
  goal TEXT,
  version INT NOT NULL DEFAULT 1,
  status TEXT CHECK (status IN ('draft','active','inactive')) DEFAULT 'draft',
  owner TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbooks_status ON public.playbooks(status);

-- Trigger updated_at para playbooks
DROP TRIGGER IF EXISTS trg_playbooks_updated_at ON public.playbooks;
CREATE TRIGGER trg_playbooks_updated_at
BEFORE UPDATE ON public.playbooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Passos do playbook (ordenados)
CREATE TABLE IF NOT EXISTS public.playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  channel TEXT CHECK (channel IN ('email','whatsapp')) NOT NULL,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  delay_days INT NOT NULL DEFAULT 0,
  business_hours BOOLEAN DEFAULT true,
  exit_on_reply BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbook_steps_playbook ON public.playbook_steps(playbook_id);

-- Variantes A/B por step
CREATE TABLE IF NOT EXISTS public.playbook_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.playbook_steps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- A | B | C...
  weight INT NOT NULL CHECK (weight BETWEEN 0 AND 100) DEFAULT 50,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  hypothesis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbook_variants_step ON public.playbook_variants(step_id);

-- Bindings (restrições de aplicação)
CREATE TABLE IF NOT EXISTS public.playbook_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  key TEXT NOT NULL,            -- ex: 'persona','industry','size'
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playbook_bindings_playbook ON public.playbook_bindings(playbook_id);

-- Runs (instâncias de execução por lead)
CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE RESTRICT,
  step_index INT NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('active','paused','stopped','finished')) DEFAULT 'active',
  next_due_at TIMESTAMPTZ,
  variant_map JSONB,            -- { "step_1": "A", "step_2": "B" ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_lead ON public.runs(lead_id);
CREATE INDEX IF NOT EXISTS idx_runs_playbook ON public.runs(playbook_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.runs(status);

-- Trigger updated_at para runs
DROP TRIGGER IF EXISTS trg_runs_updated_at ON public.runs;
CREATE TRIGGER trg_runs_updated_at
BEFORE UPDATE ON public.runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Eventos do run (telemetria por passo)
CREATE TABLE IF NOT EXISTS public.run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  variant TEXT,
  action TEXT NOT NULL,         -- 'send'|'reply'|'skip'|'stop'|'error'
  channel TEXT,
  provider TEXT,
  provider_msg_id TEXT,
  latency_ms INT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_run_events_run ON public.run_events(run_id);
CREATE INDEX IF NOT EXISTS idx_run_events_action ON public.run_events(action);

-- Resultados A/B (consolidação por variante)
CREATE TABLE IF NOT EXISTS public.ab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  variant TEXT NOT NULL,
  sends INT DEFAULT 0,
  opens INT DEFAULT 0,
  replies INT DEFAULT 0,
  meetings INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_results_playbook ON public.ab_results(playbook_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ab_results_unique ON public.ab_results(playbook_id, step_index, variant);

