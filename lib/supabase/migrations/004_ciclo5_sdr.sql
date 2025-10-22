-- CICLO 5: SDR OLV (Inbox + Envio E-mail/WhatsApp + Templates)
-- Execute no Supabase SQL Editor

-- Threads (por lead, canal)
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email','whatsapp')) NOT NULL,
  external_id TEXT,          -- id de thread/conversa no provedor
  subject TEXT,              -- p/ email
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_lead ON public.threads(lead_id);
CREATE INDEX IF NOT EXISTS idx_threads_channel ON public.threads(channel);

-- Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('outbound','inbound')) NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  body TEXT,                  -- LGPD: pode ser NULL se optar por não armazenar o corpo
  attachments JSONB,
  provider TEXT,              -- smtp|twilio|...
  provider_msg_id TEXT,
  status TEXT,                -- queued|sent|delivered|failed|read
  latency_ms INT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON public.messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);

-- Templates (mensagens parametrizadas)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT CHECK (channel IN ('email','whatsapp')) NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,               -- apenas p/ email
  body_md TEXT NOT NULL,      -- markdown com placeholders {{company.name}}, {{person.first_name}}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_channel ON public.message_templates(channel);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON public.message_templates(is_active);

-- Preferências de retenção LGPD (se necessário)
CREATE TABLE IF NOT EXISTS public.privacy_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  store_message_body BOOLEAN DEFAULT false, -- se false, guarda só metadados
  retention_days INT DEFAULT 365,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_prefs_company ON public.privacy_prefs(company_id);

-- Inserir templates padrão (exemplo)
INSERT INTO public.message_templates (channel, name, subject, body_md, is_active)
VALUES
  ('email', 'Apresentação OLV', 'Apresentação - {{company.name}}', 
   'Olá {{person.first_name}},\n\nSou da OLV e gostaria de apresentar nossas soluções para {{company.name}}.\n\nPodemos agendar uma conversa?\n\nAtenciosamente,\nEquipe OLV', 
   true),
  ('whatsapp', 'Primeiro Contato', null, 
   'Olá {{person.first_name}}! Sou da OLV. Vi que você trabalha na {{company.name}} e gostaria de trocar uma ideia sobre nossas soluções. Você tem alguns minutos?', 
   true)
ON CONFLICT DO NOTHING;

