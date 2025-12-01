-- ==================== MOTOR DE QUALIFICAÇÃO AUTOMÁTICA ====================
-- Tabelas para configuração de pesos, resultados e auditoria

-- 1. Configuração de pesos por tenant
CREATE TABLE IF NOT EXISTS public.qualification_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Pesos (soma deve ser ~100)
  weight_cnae INTEGER DEFAULT 25 CHECK (weight_cnae >= 0 AND weight_cnae <= 50),
  weight_capital_social INTEGER DEFAULT 20 CHECK (weight_capital_social >= 0 AND weight_capital_social <= 50),
  weight_porte INTEGER DEFAULT 20 CHECK (weight_porte >= 0 AND weight_porte <= 50),
  weight_localizacao INTEGER DEFAULT 15 CHECK (weight_localizacao >= 0 AND weight_localizacao <= 50),
  weight_situacao INTEGER DEFAULT 10 CHECK (weight_situacao >= 0 AND weight_situacao <= 50),
  weight_setor INTEGER DEFAULT 10 CHECK (weight_setor >= 0 AND weight_setor <= 50),
  
  -- Thresholds
  threshold_hot INTEGER DEFAULT 70 CHECK (threshold_hot >= 50 AND threshold_hot <= 100),
  threshold_warm INTEGER DEFAULT 40 CHECK (threshold_warm >= 20 AND threshold_warm <= 80),
  
  -- Comportamento automático
  auto_approve_hot BOOLEAN DEFAULT TRUE,
  auto_discard_cold BOOLEAN DEFAULT FALSE,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Uma config por tenant
  UNIQUE(tenant_id)
);

-- 2. Tabela de leads em nurturing (COLD com potencial)
CREATE TABLE IF NOT EXISTS public.leads_nurturing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  cnpj VARCHAR(20) NOT NULL,
  razao_social VARCHAR(500),
  nome_fantasia VARCHAR(500),
  
  icp_score INTEGER DEFAULT 0,
  qualification_data JSONB DEFAULT '{}'::jsonb,
  
  -- Nurturing status
  nurturing_stage VARCHAR(50) DEFAULT 'cold',
  last_contact_at TIMESTAMPTZ,
  next_contact_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  
  -- Requalificação
  requalified_at TIMESTAMPTZ,
  promoted_to_quarantine BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cnpj, tenant_id)
);

-- 3. Tabela de leads descartados (para auditoria)
CREATE TABLE IF NOT EXISTS public.leads_discarded (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  cnpj VARCHAR(20) NOT NULL,
  razao_social VARCHAR(500),
  
  icp_score INTEGER DEFAULT 0,
  discard_reason TEXT,
  
  -- Possibilidade de reativar
  reactivated BOOLEAN DEFAULT FALSE,
  reactivated_at TIMESTAMPTZ,
  reactivated_reason TEXT,
  
  discarded_at TIMESTAMPTZ DEFAULT NOW(),
  discarded_by UUID REFERENCES auth.users(id),
  
  UNIQUE(cnpj, tenant_id)
);

-- 4. Adicionar campos na leads_quarantine (se não existirem)
DO $$ 
BEGIN
  -- ICP Score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_quarantine' AND column_name = 'icp_score') THEN
    ALTER TABLE public.leads_quarantine ADD COLUMN icp_score INTEGER DEFAULT 0;
  END IF;
  
  -- ICP ID
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_quarantine' AND column_name = 'icp_id') THEN
    ALTER TABLE public.leads_quarantine ADD COLUMN icp_id UUID;
  END IF;
  
  -- ICP Name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_quarantine' AND column_name = 'icp_name') THEN
    ALTER TABLE public.leads_quarantine ADD COLUMN icp_name VARCHAR(255);
  END IF;
  
  -- Temperatura
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_quarantine' AND column_name = 'temperatura') THEN
    ALTER TABLE public.leads_quarantine ADD COLUMN temperatura VARCHAR(20) DEFAULT 'warm';
  END IF;
  
  -- Qualification data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_quarantine' AND column_name = 'qualification_data') THEN
    ALTER TABLE public.leads_quarantine ADD COLUMN qualification_data JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Tenant ID (se não existir)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_quarantine' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.leads_quarantine ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
  END IF;
END $$;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_qualification_config_tenant ON public.qualification_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_nurturing_tenant ON public.leads_nurturing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_nurturing_cnpj ON public.leads_nurturing(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_nurturing_stage ON public.leads_nurturing(nurturing_stage);
CREATE INDEX IF NOT EXISTS idx_leads_discarded_tenant ON public.leads_discarded(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_discarded_cnpj ON public.leads_discarded(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_quarantine_icp ON public.leads_quarantine(icp_id);
CREATE INDEX IF NOT EXISTS idx_leads_quarantine_temp ON public.leads_quarantine(temperatura);
CREATE INDEX IF NOT EXISTS idx_leads_quarantine_score ON public.leads_quarantine(icp_score);

-- 6. RLS
ALTER TABLE public.qualification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_nurturing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_discarded ENABLE ROW LEVEL SECURITY;

-- Policies qualification_config
CREATE POLICY "Users can view their tenant config" ON public.qualification_config
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their tenant config" ON public.qualification_config
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their tenant config" ON public.qualification_config
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policies leads_nurturing
CREATE POLICY "Users can view their tenant nurturing" ON public.leads_nurturing
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant nurturing" ON public.leads_nurturing
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policies leads_discarded
CREATE POLICY "Users can view their tenant discarded" ON public.leads_discarded
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant discarded" ON public.leads_discarded
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_qualification_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qualification_config_updated ON public.qualification_config;
CREATE TRIGGER qualification_config_updated
  BEFORE UPDATE ON public.qualification_config
  FOR EACH ROW EXECUTE FUNCTION update_qualification_config_timestamp();

-- 8. Comentários
COMMENT ON TABLE public.qualification_config IS 'Configuração de pesos e thresholds do motor de qualificação por tenant';
COMMENT ON TABLE public.leads_nurturing IS 'Leads COLD com potencial para requalificação futura';
COMMENT ON TABLE public.leads_discarded IS 'Leads descartados (auditoria e possível reativação)';

