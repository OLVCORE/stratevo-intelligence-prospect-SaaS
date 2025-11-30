-- ============================================================================
-- MIGRATION: Fix Missing Tables and Columns
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Garante que todas as tabelas e colunas necessárias existem
-- ============================================================================

-- ============================================
-- 1. GARANTIR QUE deleted_at EXISTE EM leads
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- ============================================
-- 2. GARANTIR QUE email_tracking EXISTE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_tracking'
  ) THEN
    CREATE TABLE public.email_tracking (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      message_id UUID,
      lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
      deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
      tracking_token TEXT UNIQUE NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT,
      sent_at TIMESTAMPTZ DEFAULT now(),
      opened_at TIMESTAMPTZ,
      first_opened_at TIMESTAMPTZ,
      opened_count INTEGER DEFAULT 0,
      clicked_at TIMESTAMPTZ,
      first_clicked_at TIMESTAMPTZ,
      clicked_count INTEGER DEFAULT 0,
      clicked_links JSONB DEFAULT '[]'::JSONB,
      user_agent TEXT,
      ip_address TEXT,
      location JSONB,
      delivery_status TEXT DEFAULT 'sent',
      bounce_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_email_tracking_tenant_id ON public.email_tracking(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON public.email_tracking(tracking_token);
    CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON public.email_tracking(tenant_id, sent_at DESC);

    ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view email tracking from their tenant" ON public.email_tracking;
    CREATE POLICY "Users can view email tracking from their tenant"
      ON public.email_tracking FOR SELECT
      USING (
        tenant_id IN (
          SELECT tenant_id FROM public.tenant_users
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can insert email tracking for their tenant" ON public.email_tracking;
    CREATE POLICY "Users can insert email tracking for their tenant"
      ON public.email_tracking FOR INSERT
      WITH CHECK (
        tenant_id IN (
          SELECT tenant_id FROM public.tenant_users
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- 3. GARANTIR QUE automation_logs EXISTE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'automation_logs'
  ) THEN
    CREATE TABLE public.automation_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      automation_rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
      trigger_type TEXT NOT NULL,
      trigger_data JSONB DEFAULT '{}'::JSONB,
      action_type TEXT NOT NULL,
      action_config JSONB DEFAULT '{}'::JSONB,
      status TEXT DEFAULT 'pending',
      executed_at TIMESTAMPTZ,
      error_message TEXT,
      result_data JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_automation_logs_tenant_id ON public.automation_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(automation_rule_id);
    CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON public.automation_logs(tenant_id, executed_at DESC);

    ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view automation logs from their tenant" ON public.automation_logs;
    CREATE POLICY "Users can view automation logs from their tenant"
      ON public.automation_logs FOR SELECT
      USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- ============================================
-- 4. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';






