-- Tabela para armazenar tokens de calendários externos
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Tabela para eventos sincronizados
CREATE TABLE IF NOT EXISTS public.synced_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.calendar_integrations(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(integration_id, external_event_id)
);

-- Tabela para transações de pagamento
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.confirmed_events(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'cash')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  pix_qr_code TEXT,
  pix_code TEXT,
  pix_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para assinaturas recorrentes
CREATE TABLE IF NOT EXISTS public.payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user ON public.calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_integration ON public.synced_calendar_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_appointment ON public.synced_calendar_events(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_event ON public.payment_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_lead ON public.payment_subscriptions(lead_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_calendar_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_integration_updated_at();

CREATE TRIGGER update_synced_calendar_events_updated_at
  BEFORE UPDATE ON public.synced_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payment_subscriptions_updated_at
  BEFORE UPDATE ON public.payment_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para calendar_integrations
CREATE POLICY "Usuários podem ver suas próprias integrações"
  ON public.calendar_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias integrações"
  ON public.calendar_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias integrações"
  ON public.calendar_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias integrações"
  ON public.calendar_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para synced_calendar_events
CREATE POLICY "Usuários podem ver eventos de suas integrações"
  ON public.synced_calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_integrations ci
      WHERE ci.id = integration_id AND ci.user_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar eventos sincronizados"
  ON public.synced_calendar_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para payment_transactions
CREATE POLICY "Admins podem ver todas transações"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia')
    )
  );

CREATE POLICY "Vendedores podem ver transações de seus leads"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar transações"
  ON public.payment_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para payment_subscriptions
CREATE POLICY "Admins podem ver todas assinaturas"
  ON public.payment_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia')
    )
  );

CREATE POLICY "Vendedores podem ver assinaturas de seus leads"
  ON public.payment_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar assinaturas"
  ON public.payment_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);