-- =============================================
-- STRATEVO CRM - Migração Multi-Tenant Completa
-- Replica 100% do Olinda com suporte multi-tenant
-- =============================================

-- 1. Criar ENUM para roles dos tenant users
DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'manager', 'sales', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Criar tabela TENANTS (empresas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  business_model TEXT NOT NULL DEFAULT 'generic',
  crm_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela TENANT_USERS (relacionamento users <-> tenants)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 6. Criar função para pegar tenant_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$;

-- 7. Criar função para verificar role do usuário no tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id UUID, _user_id UUID, _role tenant_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id = _tenant_id
      AND user_id = _user_id
      AND role = _role
      AND is_active = true
  );
END;
$$;

-- 8. RLS Policies para TENANTS
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
CREATE POLICY "Users can view their tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Owners can update tenants" ON public.tenants;
CREATE POLICY "Owners can update tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND role = 'owner'
      AND is_active = true
  )
);

-- 9. RLS Policies para TENANT_USERS
DROP POLICY IF EXISTS "Users can view tenant members" ON public.tenant_users;
CREATE POLICY "Users can view tenant members"
ON public.tenant_users FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
CREATE POLICY "Admins can manage tenant users"
ON public.tenant_users FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
  )
);

-- 10. Adicionar tenant_id às tabelas existentes
DO $$ 
BEGIN
  -- LEADS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.leads ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_leads_tenant_id ON public.leads(tenant_id);
  END IF;

  -- DEALS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'deals' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.deals ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_deals_tenant_id ON public.deals(tenant_id);
  END IF;

  -- PROPOSALS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'proposals' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.proposals ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_proposals_tenant_id ON public.proposals(tenant_id);
  END IF;

  -- APPOINTMENTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.appointments ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_appointments_tenant_id ON public.appointments(tenant_id);
  END IF;

  -- ACTIVITIES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'activities' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.activities ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_activities_tenant_id ON public.activities(tenant_id);
  END IF;

  -- AUTOMATION_RULES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'automation_rules' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.automation_rules ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_automation_rules_tenant_id ON public.automation_rules(tenant_id);
  END IF;

  -- EMAIL_TEMPLATES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.email_templates ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_email_templates_tenant_id ON public.email_templates(tenant_id);
  END IF;

  -- CONFIRMED_EVENTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'confirmed_events' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.confirmed_events ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_confirmed_events_tenant_id ON public.confirmed_events(tenant_id);
  END IF;

  -- EVENT_BLOCKS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'event_blocks' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.event_blocks ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_event_blocks_tenant_id ON public.event_blocks(tenant_id);
  END IF;

  -- GOALS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'goals' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.goals ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    CREATE INDEX idx_goals_tenant_id ON public.goals(tenant_id);
  END IF;
END $$;

-- 11. Atualizar RLS policies existentes para incluir tenant_id
-- LEADS
DROP POLICY IF EXISTS "Users can view tenant leads" ON public.leads;
CREATE POLICY "Users can view tenant leads"
ON public.leads FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can insert tenant leads" ON public.leads;
CREATE POLICY "Users can insert tenant leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_current_tenant_id()
);

DROP POLICY IF EXISTS "Users can update tenant leads" ON public.leads;
CREATE POLICY "Users can update tenant leads"
ON public.leads FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
);

-- DEALS
DROP POLICY IF EXISTS "Users can view tenant deals" ON public.deals;
CREATE POLICY "Users can view tenant deals"
ON public.deals FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
);

-- PROPOSALS
DROP POLICY IF EXISTS "Users can view tenant proposals" ON public.proposals;
CREATE POLICY "Users can view tenant proposals"
ON public.proposals FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Users can view tenant appointments" ON public.appointments;
CREATE POLICY "Users can view tenant appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_current_tenant_id()
);

-- 12. Criar trigger para auto-preencher tenant_id
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar trigger nas tabelas principais
DROP TRIGGER IF EXISTS set_tenant_id_leads ON public.leads;
CREATE TRIGGER set_tenant_id_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_deals ON public.deals;
CREATE TRIGGER set_tenant_id_deals
  BEFORE INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_proposals ON public.proposals;
CREATE TRIGGER set_tenant_id_proposals
  BEFORE INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id();