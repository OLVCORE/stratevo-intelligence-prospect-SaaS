-- =====================================================
-- LINKEDIN INTEGRATION TABLES FOR STRATEVO
-- =====================================================

-- 1. Contas LinkedIn conectadas
CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados do perfil LinkedIn
  linkedin_profile_id TEXT NOT NULL,
  linkedin_profile_url TEXT NOT NULL,
  linkedin_name TEXT NOT NULL,
  linkedin_headline TEXT,
  linkedin_avatar_url TEXT,
  
  -- Cookies de autenticação (ENCRIPTADOS)
  li_at_cookie TEXT NOT NULL,  -- Cookie principal
  jsessionid_cookie TEXT,       -- Cookie de sessão
  
  -- Status e limites
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'disconnected')),
  daily_invites_sent INTEGER DEFAULT 0,
  daily_invites_limit INTEGER DEFAULT 25,
  daily_messages_sent INTEGER DEFAULT 0,
  daily_messages_limit INTEGER DEFAULT 50,
  last_activity_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  cookies_expire_at TIMESTAMPTZ,
  
  -- Configurações
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  min_delay_seconds INTEGER DEFAULT 30,
  max_delay_seconds INTEGER DEFAULT 120,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, linkedin_profile_id)
);

-- 2. Campanhas de prospecção
CREATE TABLE IF NOT EXISTS public.linkedin_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  linkedin_account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE CASCADE,
  
  -- Dados da campanha
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  
  -- Configurações de busca
  search_url TEXT,  -- URL de busca do LinkedIn Sales Navigator ou regular
  connection_degree TEXT[] DEFAULT ARRAY['2nd', '3rd'],  -- Graus de conexão
  
  -- Mensagem de convite
  invite_message_template TEXT,  -- Suporta variáveis: {{firstName}}, {{company}}, etc.
  
  -- Limites da campanha
  max_invites_per_day INTEGER DEFAULT 20,
  max_total_invites INTEGER DEFAULT 500,
  
  -- Estatísticas
  total_leads_imported INTEGER DEFAULT 0,
  total_invites_sent INTEGER DEFAULT 0,
  total_invites_accepted INTEGER DEFAULT 0,
  total_invites_declined INTEGER DEFAULT 0,
  
  -- Agendamento
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- 3. Leads importados do LinkedIn
CREATE TABLE IF NOT EXISTS public.linkedin_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.linkedin_campaigns(id) ON DELETE SET NULL,
  crm_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,  -- Link com CRM
  
  -- Dados do perfil LinkedIn
  linkedin_profile_id TEXT NOT NULL,
  linkedin_profile_url TEXT NOT NULL,
  linkedin_public_id TEXT,  -- vanity URL
  
  -- Informações pessoais
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT NOT NULL,
  headline TEXT,
  location TEXT,
  avatar_url TEXT,
  
  -- Informações profissionais
  company_name TEXT,
  company_linkedin_url TEXT,
  job_title TEXT,
  industry TEXT,
  
  -- Conexão
  connection_degree TEXT,  -- '1st', '2nd', '3rd', 'Out of Network'
  shared_connections INTEGER DEFAULT 0,
  
  -- Status do convite
  invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN (
    'pending',      -- Aguardando envio
    'queued',       -- Na fila para envio
    'sent',         -- Convite enviado
    'accepted',     -- Convite aceito
    'declined',     -- Convite recusado/expirado
    'withdrawn',    -- Convite retirado
    'error'         -- Erro no envio
  )),
  invite_sent_at TIMESTAMPTZ,
  invite_accepted_at TIMESTAMPTZ,
  invite_message TEXT,
  invite_error TEXT,
  
  -- Metadata
  imported_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB,  -- Dados brutos do LinkedIn para debug
  
  UNIQUE(tenant_id, linkedin_profile_id)
);

-- 4. Fila de ações automatizadas
CREATE TABLE IF NOT EXISTS public.linkedin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  linkedin_account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE CASCADE,
  linkedin_lead_id UUID REFERENCES public.linkedin_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.linkedin_campaigns(id) ON DELETE SET NULL,
  
  -- Tipo de ação
  action_type TEXT NOT NULL CHECK (action_type IN ('invite', 'message', 'follow', 'view_profile')),
  
  -- Status da execução
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Dados da ação
  payload JSONB NOT NULL,  -- Mensagem, etc.
  
  -- Agendamento
  scheduled_for TIMESTAMPTZ NOT NULL,
  priority INTEGER DEFAULT 5,  -- 1-10, menor = mais prioritário
  
  -- Resultado
  executed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Histórico de sincronização
CREATE TABLE IF NOT EXISTS public.linkedin_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  linkedin_account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL CHECK (sync_type IN ('invites', 'connections', 'messages', 'profile')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  items_processed INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  details JSONB
);

-- =====================================================
-- INDEXES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_tenant ON public.linkedin_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_status ON public.linkedin_accounts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_campaigns_tenant ON public.linkedin_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_campaigns_status ON public.linkedin_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_tenant ON public.linkedin_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_campaign ON public.linkedin_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_invite_status ON public.linkedin_leads(invite_status);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_profile_id ON public.linkedin_leads(linkedin_profile_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_scheduled ON public.linkedin_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_account ON public.linkedin_queue(linkedin_account_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para linkedin_accounts
DROP POLICY IF EXISTS "Tenant users can view their LinkedIn accounts" ON public.linkedin_accounts;
CREATE POLICY "Tenant users can view their LinkedIn accounts"
ON public.linkedin_accounts FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Tenant users can insert their LinkedIn accounts" ON public.linkedin_accounts;
CREATE POLICY "Tenant users can insert their LinkedIn accounts"
ON public.linkedin_accounts FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Tenant users can update their LinkedIn accounts" ON public.linkedin_accounts;
CREATE POLICY "Tenant users can update their LinkedIn accounts"
ON public.linkedin_accounts FOR UPDATE TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Tenant users can delete their LinkedIn accounts" ON public.linkedin_accounts;
CREATE POLICY "Tenant users can delete their LinkedIn accounts"
ON public.linkedin_accounts FOR DELETE TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role full access linkedin_accounts" ON public.linkedin_accounts;
CREATE POLICY "Service role full access linkedin_accounts"
ON public.linkedin_accounts FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Políticas para linkedin_campaigns
DROP POLICY IF EXISTS "Tenant users can manage their campaigns" ON public.linkedin_campaigns;
CREATE POLICY "Tenant users can manage their campaigns"
ON public.linkedin_campaigns FOR ALL TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role full access linkedin_campaigns" ON public.linkedin_campaigns;
CREATE POLICY "Service role full access linkedin_campaigns"
ON public.linkedin_campaigns FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Políticas para linkedin_leads
DROP POLICY IF EXISTS "Tenant users can manage their LinkedIn leads" ON public.linkedin_leads;
CREATE POLICY "Tenant users can manage their LinkedIn leads"
ON public.linkedin_leads FOR ALL TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role full access linkedin_leads" ON public.linkedin_leads;
CREATE POLICY "Service role full access linkedin_leads"
ON public.linkedin_leads FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Políticas para linkedin_queue
DROP POLICY IF EXISTS "Tenant users can view their queue" ON public.linkedin_queue;
CREATE POLICY "Tenant users can view their queue"
ON public.linkedin_queue FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role full access linkedin_queue" ON public.linkedin_queue;
CREATE POLICY "Service role full access linkedin_queue"
ON public.linkedin_queue FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Políticas para linkedin_sync_logs
DROP POLICY IF EXISTS "Tenant users can view their sync logs" ON public.linkedin_sync_logs;
CREATE POLICY "Tenant users can view their sync logs"
ON public.linkedin_sync_logs FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Service role full access linkedin_sync_logs" ON public.linkedin_sync_logs;
CREATE POLICY "Service role full access linkedin_sync_logs"
ON public.linkedin_sync_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linkedin_accounts_updated_at
  BEFORE UPDATE ON public.linkedin_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_campaigns_updated_at
  BEFORE UPDATE ON public.linkedin_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_leads_updated_at
  BEFORE UPDATE ON public.linkedin_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para setar tenant_id automaticamente
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_linkedin_accounts_tenant_id
  BEFORE INSERT ON public.linkedin_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER set_linkedin_campaigns_tenant_id
  BEFORE INSERT ON public.linkedin_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER set_linkedin_leads_tenant_id
  BEFORE INSERT ON public.linkedin_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER set_linkedin_queue_tenant_id
  BEFORE INSERT ON public.linkedin_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER set_linkedin_sync_logs_tenant_id
  BEFORE INSERT ON public.linkedin_sync_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para resetar contadores diários
CREATE OR REPLACE FUNCTION public.reset_linkedin_daily_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.linkedin_accounts
  SET 
    daily_invites_sent = 0,
    daily_messages_sent = 0,
    updated_at = now()
  WHERE daily_invites_sent > 0 OR daily_messages_sent > 0;
END;
$$;

-- Função para verificar se pode enviar convite
CREATE OR REPLACE FUNCTION public.can_send_linkedin_invite(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account RECORD;
  v_current_hour INTEGER;
BEGIN
  SELECT * INTO v_account FROM public.linkedin_accounts WHERE id = p_account_id;
  
  IF NOT FOUND OR v_account.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar limite diário
  IF v_account.daily_invites_sent >= v_account.daily_invites_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar horário de trabalho
  v_current_hour := EXTRACT(HOUR FROM now() AT TIME ZONE COALESCE(v_account.timezone, 'America/Sao_Paulo'));
  IF v_current_hour < EXTRACT(HOUR FROM v_account.working_hours_start) OR
     v_current_hour >= EXTRACT(HOUR FROM v_account.working_hours_end) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Função para incrementar contador de convites
CREATE OR REPLACE FUNCTION public.increment_linkedin_invite_counter(p_account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.linkedin_accounts
  SET 
    daily_invites_sent = daily_invites_sent + 1,
    last_activity_at = now(),
    updated_at = now()
  WHERE id = p_account_id;
END;
$$;

