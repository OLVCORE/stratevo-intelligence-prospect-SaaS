-- BATCH 3: SDR & Decisores - Suporte a Multi-Tenancy
-- Execute no Supabase SQL Editor

-- Preferências de privacidade por tenant (LGPD-safe)
CREATE TABLE IF NOT EXISTS public.privacy_prefs (
  tenant_id UUID PRIMARY KEY,
  store_message_body BOOLEAN NOT NULL DEFAULT FALSE,
  retention_days INT NOT NULL DEFAULT 365,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mapeamento de endereços/identidades de canal -> tenant (para webhooks)
CREATE TABLE IF NOT EXISTS public.inbound_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  identity TEXT NOT NULL, -- ex: "inbound@olv.com.br" ou "whatsapp:+5511..."
  description TEXT,
  UNIQUE (channel, identity)
);

CREATE INDEX IF NOT EXISTS inbound_identities_tenant_idx ON public.inbound_identities(tenant_id, channel);

-- Chaves/segredos por tenant para validação de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_secrets (
  tenant_id UUID PRIMARY KEY,
  email_secret TEXT,
  wa_secret TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices úteis para consultas SDR
CREATE INDEX IF NOT EXISTS messages_tenant_created_idx ON public.messages(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_tenant_company_idx ON public.leads(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS threads_tenant_lead_idx ON public.threads(tenant_id, lead_id, updated_at DESC);

-- Ajustar referências (se as tabelas tiverem nomes diferentes, adapte):
-- Se threads → conversations, ajuste acima

-- Trigger updated_at para privacy_prefs e webhook_secrets
DROP TRIGGER IF EXISTS trg_privacy_prefs_updated_at ON public.privacy_prefs;
CREATE TRIGGER trg_privacy_prefs_updated_at
BEFORE UPDATE ON public.privacy_prefs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_webhook_secrets_updated_at ON public.webhook_secrets;
CREATE TRIGGER trg_webhook_secrets_updated_at
BEFORE UPDATE ON public.webhook_secrets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

