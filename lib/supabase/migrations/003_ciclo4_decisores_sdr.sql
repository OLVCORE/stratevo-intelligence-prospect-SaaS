-- CICLO 4: Decisores + Base SDR OLV
-- Execute no Supabase SQL Editor

-- Pessoas (Decisores)
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  seniority TEXT,                  -- ex: C-level, Director, Manager
  location TEXT,
  source TEXT NOT NULL,            -- 'apollo'|'hunter'|'phantom'|'manual'
  source_url TEXT,
  confidence INT CHECK (confidence BETWEEN 0 AND 100) DEFAULT 60,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_company ON public.people(company_id);
CREATE INDEX IF NOT EXISTS idx_people_full_name ON public.people(full_name);

-- Trigger updated_at para people
DROP TRIGGER IF EXISTS trg_people_updated_at ON public.people;
CREATE TRIGGER trg_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contatos (e-mail/telefone) vinculados à pessoa
CREATE TABLE IF NOT EXISTS public.person_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email','phone','whatsapp','linkedin')) NOT NULL,
  value TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  source TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_person_contacts_person ON public.person_contacts(person_id);
CREATE INDEX IF NOT EXISTS idx_person_contacts_type ON public.person_contacts(type);

-- Funil SDR (base para Spotter-like)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'new',  -- new|research|attempted|connected|qualified|won|lost
  owner TEXT,                         -- e-mail do SDR OLV
  source TEXT,                        -- 'inbound'|'outbound'|'referral'|...
  notes TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_person ON public.leads(person_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner);

-- Trigger updated_at para leads
DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Log de envios (e-mail/WhatsApp) - LGPD-safe (não armazena corpo sensível)
CREATE TABLE IF NOT EXISTS public.outbound_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email','whatsapp')) NOT NULL,
  to_address TEXT NOT NULL,                   -- e-mail ou phone/whatsapp
  subject TEXT,
  status TEXT NOT NULL,                       -- queued|sent|failed
  provider TEXT,                              -- smtp|whatsapp-gw|phantom
  latency_ms INT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_logs_lead ON public.outbound_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_outbound_logs_channel ON public.outbound_logs(channel);
CREATE INDEX IF NOT EXISTS idx_outbound_logs_status ON public.outbound_logs(status);

