-- ============================================================================
-- MIGRATION: CRM Email Tracking - CICLO 3
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Sistema de tracking de emails (aberturas e cliques)
-- ============================================================================

-- ============================================
-- TABELA: EMAIL_TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Relacionamentos
  message_id UUID, -- ID da mensagem na tabela messages
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  
  -- Tracking
  tracking_token TEXT UNIQUE NOT NULL, -- Token único para pixel e links
  recipient_email TEXT NOT NULL,
  subject TEXT,
  
  -- Status
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  first_opened_at TIMESTAMPTZ,
  opened_count INTEGER DEFAULT 0,
  
  -- Cliques
  clicked_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  clicked_count INTEGER DEFAULT 0,
  clicked_links JSONB DEFAULT '[]'::JSONB, -- [{url, clicked_at, count}]
  
  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  location JSONB, -- {country, city, region}
  
  -- Status de entrega
  delivery_status TEXT DEFAULT 'sent', -- sent, delivered, bounced, failed
  bounce_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_tracking_tenant_id ON public.email_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON public.email_tracking(tracking_token);
CREATE INDEX IF NOT EXISTS idx_email_tracking_message_id ON public.email_tracking(message_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_lead_id ON public.email_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_deal_id ON public.email_tracking(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON public.email_tracking(tenant_id, sent_at DESC);

-- RLS
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_tracking' AND policyname='Users can view email tracking from their tenant') THEN
    DROP POLICY "Users can view email tracking from their tenant" ON public.email_tracking;
  END IF;
END $$;

CREATE POLICY "Users can view email tracking from their tenant"
  ON public.email_tracking FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_tracking' AND policyname='Users can insert email tracking for their tenant') THEN
    DROP POLICY "Users can insert email tracking for their tenant" ON public.email_tracking;
  END IF;
END $$;

CREATE POLICY "Users can insert email tracking for their tenant"
  ON public.email_tracking FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_email_tracking_updated_at' AND tgrelid = 'public.email_tracking'::regclass) THEN
    CREATE TRIGGER trigger_email_tracking_updated_at
    BEFORE UPDATE ON public.email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

