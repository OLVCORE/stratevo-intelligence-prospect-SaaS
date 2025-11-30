-- ============================================================================
-- CICLO 8: INTEGRAÇÕES ESSENCIAIS - COMPLETO
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: API completa, Calendários externos, Pagamentos
-- ============================================================================

-- ============================================
-- 1. TABELA DE CHAVES DE API (API KEYS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys') THEN
    CREATE TABLE public.api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Identificação
      name TEXT NOT NULL,
      description TEXT,
      key_hash TEXT NOT NULL UNIQUE, -- Hash da chave para segurança
      key_prefix TEXT NOT NULL, -- Primeiros 8 caracteres para identificação
      
      -- Permissões
      permissions JSONB DEFAULT '{}'::jsonb, -- { "read": true, "write": true, "delete": false }
      scopes TEXT[] DEFAULT ARRAY[]::TEXT[], -- ["leads", "deals", "contacts"]
      
      -- Rate Limiting
      rate_limit_per_minute INTEGER DEFAULT 60,
      rate_limit_per_hour INTEGER DEFAULT 1000,
      rate_limit_per_day INTEGER DEFAULT 10000,
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      last_used_at TIMESTAMPTZ,
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_api_keys_tenant_id ON public.api_keys(tenant_id);
    CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
    CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);
    
    ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view API keys from their tenant"
      ON public.api_keys FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can create API keys in their tenant"
      ON public.api_keys FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can update API keys in their tenant"
      ON public.api_keys FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can delete API keys in their tenant"
      ON public.api_keys FOR DELETE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 2. TABELA DE WEBHOOKS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhooks') THEN
    CREATE TABLE public.webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Identificação
      name TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      
      -- Configuração
      events TEXT[] NOT NULL, -- ["lead.created", "deal.updated", "proposal.sent"]
      method TEXT DEFAULT 'POST' CHECK (method IN ('POST', 'PUT', 'PATCH')),
      headers JSONB DEFAULT '{}'::jsonb, -- Headers customizados
      secret TEXT, -- Secret para assinatura HMAC
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      retry_count INTEGER DEFAULT 3,
      timeout_seconds INTEGER DEFAULT 30,
      
      -- Estatísticas
      success_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0,
      last_triggered_at TIMESTAMPTZ,
      last_success_at TIMESTAMPTZ,
      last_failure_at TIMESTAMPTZ,
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_webhooks_tenant_id ON public.webhooks(tenant_id);
    CREATE INDEX idx_webhooks_is_active ON public.webhooks(is_active);
    CREATE INDEX idx_webhooks_events ON public.webhooks USING GIN(events);
    
    ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view webhooks from their tenant"
      ON public.webhooks FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can create webhooks in their tenant"
      ON public.webhooks FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can update webhooks in their tenant"
      ON public.webhooks FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can delete webhooks in their tenant"
      ON public.webhooks FOR DELETE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 3. TABELA DE SINCRONIZAÇÕES DE CALENDÁRIO
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_syncs') THEN
    CREATE TABLE public.calendar_syncs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Tipo de calendário
      provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical', 'caldav')),
      
      -- Credenciais (criptografadas)
      access_token_encrypted TEXT, -- Token de acesso criptografado
      refresh_token_encrypted TEXT, -- Refresh token criptografado
      calendar_id TEXT, -- ID do calendário no provedor
      calendar_name TEXT,
      
      -- Configuração
      sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('import', 'export', 'bidirectional')),
      sync_frequency_minutes INTEGER DEFAULT 15,
      sync_appointments BOOLEAN DEFAULT TRUE,
      sync_events BOOLEAN DEFAULT TRUE,
      
      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      last_sync_at TIMESTAMPTZ,
      last_sync_status TEXT, -- 'success', 'error', 'partial'
      last_sync_error TEXT,
      
      -- Estatísticas
      items_synced_count INTEGER DEFAULT 0,
      items_created_count INTEGER DEFAULT 0,
      items_updated_count INTEGER DEFAULT 0,
      items_deleted_count INTEGER DEFAULT 0,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_calendar_syncs_tenant_id ON public.calendar_syncs(tenant_id);
    CREATE INDEX idx_calendar_syncs_user_id ON public.calendar_syncs(user_id);
    CREATE INDEX idx_calendar_syncs_provider ON public.calendar_syncs(provider);
    CREATE INDEX idx_calendar_syncs_is_active ON public.calendar_syncs(is_active);
    
    ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own calendar syncs"
      ON public.calendar_syncs FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
    
    CREATE POLICY "Users can create their own calendar syncs"
      ON public.calendar_syncs FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
    
    CREATE POLICY "Users can update their own calendar syncs"
      ON public.calendar_syncs FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid())
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
    
    CREATE POLICY "Users can delete their own calendar syncs"
      ON public.calendar_syncs FOR DELETE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 4. TABELA DE TRANSAÇÕES DE PAGAMENTO
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
    CREATE TABLE public.payment_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Relacionamentos
      deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
      proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
      lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
      
      -- Valor
      amount NUMERIC(15,2) NOT NULL,
      currency TEXT DEFAULT 'BRL',
      fee_amount NUMERIC(15,2) DEFAULT 0,
      net_amount NUMERIC(15,2), -- amount - fee_amount
      
      -- Método de pagamento
      payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'cash', 'other')),
      payment_provider TEXT, -- 'stripe', 'mercadopago', 'pagseguro', etc
      
      -- Status
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
      provider_transaction_id TEXT, -- ID da transação no provedor
      provider_response JSONB DEFAULT '{}'::jsonb,
      
      -- Recorrência
      is_recurring BOOLEAN DEFAULT FALSE,
      recurring_frequency TEXT, -- 'monthly', 'quarterly', 'yearly'
      recurring_end_date DATE,
      parent_transaction_id UUID REFERENCES public.payment_transactions(id),
      
      -- PIX específico
      pix_qr_code TEXT,
      pix_expires_at TIMESTAMPTZ,
      pix_payment_code TEXT,
      
      -- Metadata
      description TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    
    CREATE INDEX idx_payment_transactions_tenant_id ON public.payment_transactions(tenant_id);
    CREATE INDEX idx_payment_transactions_deal_id ON public.payment_transactions(deal_id);
    CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
    CREATE INDEX idx_payment_transactions_provider_id ON public.payment_transactions(provider_transaction_id);
    CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);
    
    ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view payment transactions from their tenant"
      ON public.payment_transactions FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can create payment transactions in their tenant"
      ON public.payment_transactions FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can update payment transactions in their tenant"
      ON public.payment_transactions FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 5. TABELA DE LOGS DE API (API USAGE LOGS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_usage_logs') THEN
    CREATE TABLE public.api_usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
      
      -- Request
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      ip_address INET,
      user_agent TEXT,
      request_body JSONB,
      
      -- Response
      status_code INTEGER,
      response_time_ms INTEGER,
      response_body JSONB,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_api_usage_logs_tenant_id ON public.api_usage_logs(tenant_id);
    CREATE INDEX idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id);
    CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);
    CREATE INDEX idx_api_usage_logs_endpoint ON public.api_usage_logs(endpoint);
    
    ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view API usage logs from their tenant"
      ON public.api_usage_logs FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 6. TABELA DE WEBHOOK DELIVERIES (Histórico de entregas)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_deliveries') THEN
    CREATE TABLE public.webhook_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
      
      -- Evento
      event_type TEXT NOT NULL,
      event_data JSONB NOT NULL,
      
      -- Request
      url TEXT NOT NULL,
      method TEXT NOT NULL,
      headers JSONB,
      payload JSONB NOT NULL,
      
      -- Response
      status_code INTEGER,
      response_body TEXT,
      response_time_ms INTEGER,
      
      -- Status
      status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      delivered_at TIMESTAMPTZ
    );
    
    CREATE INDEX idx_webhook_deliveries_tenant_id ON public.webhook_deliveries(tenant_id);
    CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
    CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
    CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries(created_at DESC);
    
    ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view webhook deliveries from their tenant"
      ON public.webhook_deliveries FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 7. FUNÇÕES AUXILIARES
-- ============================================

-- Função para gerar chave de API
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Gerar chave aleatória de 64 caracteres
  v_key := encode(gen_random_bytes(32), 'hex');
  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para hash de chave de API
CREATE OR REPLACE FUNCTION public.hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Usar SHA256 para hash (em produção, usar bcrypt ou similar)
  RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_api_key_id UUID,
  p_period TEXT -- 'minute', 'hour', 'day'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_period_start TIMESTAMPTZ;
BEGIN
  -- Obter limite baseado no período
  SELECT 
    CASE p_period
      WHEN 'minute' THEN rate_limit_per_minute
      WHEN 'hour' THEN rate_limit_per_hour
      WHEN 'day' THEN rate_limit_per_day
    END
  INTO v_limit
  FROM public.api_keys
  WHERE id = p_api_key_id;
  
  IF v_limit IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular início do período
  v_period_start := CASE p_period
    WHEN 'minute' THEN date_trunc('minute', NOW())
    WHEN 'hour' THEN date_trunc('hour', NOW())
    WHEN 'day' THEN date_trunc('day', NOW())
  END;
  
  -- Contar requisições no período
  SELECT COUNT(*)
  INTO v_count
  FROM public.api_usage_logs
  WHERE api_key_id = p_api_key_id
    AND created_at >= v_period_start;
  
  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para disparar webhooks
CREATE OR REPLACE FUNCTION public.trigger_webhook(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS VOID AS $$
DECLARE
  v_webhook RECORD;
BEGIN
  -- Buscar webhooks ativos para o evento
  FOR v_webhook IN
    SELECT * FROM public.webhooks
    WHERE tenant_id = p_tenant_id
      AND is_active = TRUE
      AND p_event_type = ANY(events)
  LOOP
    -- Inserir delivery
    INSERT INTO public.webhook_deliveries (
      tenant_id,
      webhook_id,
      event_type,
      event_data,
      url,
      method,
      headers,
      payload,
      status
    ) VALUES (
      p_tenant_id,
      v_webhook.id,
      p_event_type,
      p_event_data,
      v_webhook.url,
      v_webhook.method,
      v_webhook.headers,
      jsonb_build_object(
        'event', p_event_type,
        'data', p_event_data,
        'timestamp', NOW()
      ),
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. TRIGGERS PARA updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integrations_updated_at();

DROP TRIGGER IF EXISTS trigger_update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER trigger_update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integrations_updated_at();

DROP TRIGGER IF EXISTS trigger_update_calendar_syncs_updated_at ON public.calendar_syncs;
CREATE TRIGGER trigger_update_calendar_syncs_updated_at
  BEFORE UPDATE ON public.calendar_syncs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integrations_updated_at();

DROP TRIGGER IF EXISTS trigger_update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER trigger_update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integrations_updated_at();

-- ============================================
-- 9. TRIGGERS PARA DISPARAR WEBHOOKS
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_webhook_on_lead_change()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'lead.created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_event_type := 'lead.status_changed';
    ELSE
      v_event_type := 'lead.updated';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'lead.deleted';
  END IF;
  
  PERFORM public.trigger_webhook(
    NEW.tenant_id,
    v_event_type,
    to_jsonb(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_webhook_leads ON public.leads;
CREATE TRIGGER trigger_webhook_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_webhook_on_lead_change();

-- ============================================
-- 10. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 11. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.api_keys IS 'Chaves de API para acesso programático ao CRM';
COMMENT ON TABLE public.webhooks IS 'Webhooks configuráveis para eventos do CRM';
COMMENT ON TABLE public.calendar_syncs IS 'Sincronizações de calendários externos (Google, Outlook, iCal)';
COMMENT ON TABLE public.payment_transactions IS 'Transações de pagamento (Stripe, PIX, etc)';
COMMENT ON TABLE public.api_usage_logs IS 'Logs de uso da API para rate limiting e auditoria';
COMMENT ON TABLE public.webhook_deliveries IS 'Histórico de entregas de webhooks';

