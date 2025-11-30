-- ============================================================================
-- MIGRATIONS PRINCIPAIS DO PROJETO ANTERIOR
-- Aplicar no schema PUBLIC do novo banco Supabase
-- ============================================================================
-- Data: 2025-01-19
-- Projeto: stratevo-intelligence-prospect-SaaS
-- Supabase: vkdvezuivlovzqxmnohk
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
-- 2. Cole TODO este script
-- 3. Clique em "Run" ou pressione Ctrl+Enter
-- 4. Aguarde a execução (pode levar 1-2 minutos)
-- ============================================================================

-- ============================================================================
-- 1. TABELA: companies (Empresas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  domain TEXT,
  website TEXT,
  industry TEXT,
  employees INTEGER,
  revenue TEXT,
  location JSONB,
  linkedin_url TEXT,
  technologies TEXT[],
  digital_maturity_score NUMERIC,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices companies
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- ============================================================================
-- 2. TABELA: decision_makers (Decisores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin_url TEXT,
  department TEXT,
  seniority TEXT,
  verified_email BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices decision_makers
CREATE INDEX IF NOT EXISTS idx_decision_makers_company ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_decision_makers_email ON public.decision_makers(email);

-- ============================================================================
-- 3. TABELA: icp_analysis_results (Análises ICP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da empresa
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  uf TEXT,
  municipio TEXT,
  porte TEXT,
  cnae_principal TEXT,
  website TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Relacionamento com companies (opcional)
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Origem
  origem TEXT CHECK (origem IN ('upload_massa', 'icp_individual', 'icp_massa')),
  
  -- Resultado da análise
  icp_score INTEGER,
  temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold')),
  is_cliente_totvs BOOLEAN DEFAULT false,
  totvs_check_date TIMESTAMPTZ,
  totvs_evidences JSONB DEFAULT '[]'::jsonb,
  motivo_descarte TEXT,
  
  -- Status
  status TEXT DEFAULT 'pendente', -- pendente, approved, rejected
  moved_to_pool BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  
  -- Dados completos da análise
  raw_data JSONB,
  analysis_data JSONB,
  full_report JSONB,
  
  -- Metadados
  batch_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices icp_analysis_results
CREATE INDEX IF NOT EXISTS idx_icp_results_cnpj ON public.icp_analysis_results(cnpj);
CREATE INDEX IF NOT EXISTS idx_icp_results_company_id ON public.icp_analysis_results(company_id);
CREATE INDEX IF NOT EXISTS idx_icp_results_user_id ON public.icp_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_icp_results_status ON public.icp_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_icp_results_score ON public.icp_analysis_results(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_icp_results_moved ON public.icp_analysis_results(moved_to_pool);
CREATE INDEX IF NOT EXISTS idx_icp_results_totvs ON public.icp_analysis_results(is_cliente_totvs);
CREATE INDEX IF NOT EXISTS idx_icp_results_origem ON public.icp_analysis_results(origem);
CREATE INDEX IF NOT EXISTS idx_icp_results_batch_id ON public.icp_analysis_results(batch_id);

-- ============================================================================
-- 4. TABELA: sdr_deals (Deals do Pipeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID,
  assigned_to UUID,
  
  -- Pipeline & Estágio
  pipeline_id UUID,
  stage TEXT NOT NULL DEFAULT 'lead',
  stage_order INTEGER DEFAULT 0,
  
  -- Valores
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  lost_reason TEXT,
  won_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  source TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Sync Bitrix24
  bitrix24_synced_at TIMESTAMP WITH TIME ZONE,
  bitrix24_data JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices sdr_deals
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_contact ON public.sdr_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned ON public.sdr_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON public.sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON public.sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_external ON public.sdr_deals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sdr_deals_close_date ON public.sdr_deals(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- ============================================================================
-- 5. TABELA: sdr_pipeline_stages (Estágios do Pipeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#6366f1',
  probability_default INTEGER DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_won BOOLEAN DEFAULT FALSE,
  automation_rules JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.sdr_pipeline_stages(order_index);

-- Inserir estágios padrão
INSERT INTO public.sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Lead', 'lead', 0, '#6366f1', 10, false, false),
  ('Qualificação', 'qualification', 1, '#8b5cf6', 25, false, false),
  ('Proposta', 'proposal', 2, '#ec4899', 50, false, false),
  ('Negociação', 'negotiation', 3, '#f59e0b', 75, false, false),
  ('Fechamento', 'closing', 4, '#10b981', 90, false, false),
  ('Ganho', 'won', 5, '#22c55e', 100, true, true),
  ('Perdido', 'lost', 6, '#ef4444', 0, true, false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 6. TABELA: sdr_deal_activities (Atividades dos Deals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sdr_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.sdr_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON public.sdr_deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_type ON public.sdr_deal_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created ON public.sdr_deal_activities(created_at DESC);

-- ============================================================================
-- 7. TABELA: buying_signals (Sinais de Compra)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.buying_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  description TEXT,
  source TEXT,
  confidence_score NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buying_signals_company ON public.buying_signals(company_id);

-- ============================================================================
-- 8. TABELA: digital_maturity (Maturidade Digital)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.digital_maturity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  infrastructure_score NUMERIC,
  systems_score NUMERIC,
  processes_score NUMERIC,
  security_score NUMERIC,
  innovation_score NUMERIC,
  overall_score NUMERIC,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_maturity_company ON public.digital_maturity(company_id);

-- ============================================================================
-- 9. TABELA: search_history (Histórico de Buscas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. TABELA: discarded_companies (Empresas Descartadas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.discarded_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL,
  company_name TEXT,
  razao_social TEXT,
  reason TEXT,
  discarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discarded_companies_cnpj ON public.discarded_companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_discarded_companies_user ON public.discarded_companies(user_id);

-- ============================================================================
-- 11. TABELA: similar_companies (Empresas Similares)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.similar_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  similar_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  similarity_score NUMERIC,
  similarity_reasons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_similar_companies_company ON public.similar_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_similar_companies_similar ON public.similar_companies(similar_company_id);

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_decision_makers_updated_at ON public.decision_makers;
CREATE TRIGGER update_decision_makers_updated_at
BEFORE UPDATE ON public.decision_makers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_digital_maturity_updated_at ON public.digital_maturity;
CREATE TRIGGER update_digital_maturity_updated_at
BEFORE UPDATE ON public.digital_maturity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_icp_analysis_updated_at ON public.icp_analysis_results;
CREATE TRIGGER update_icp_analysis_updated_at
BEFORE UPDATE ON public.icp_analysis_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sdr_deals_updated_at ON public.sdr_deals;
CREATE OR REPLACE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON public.sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

-- Função para log de mudanças de estágio
CREATE OR REPLACE FUNCTION public.log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.sdr_deal_activities (deal_id, activity_type, description, old_value, new_value, created_by)
    VALUES (
      NEW.id,
      'stage_change',
      'Estágio alterado de ' || OLD.stage || ' para ' || NEW.stage,
      jsonb_build_object('stage', OLD.stage),
      jsonb_build_object('stage', NEW.stage),
      auth.uid()
    );
    
    NEW.last_activity_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_deal_stage_change ON public.sdr_deals;
CREATE TRIGGER trigger_log_deal_stage_change
  BEFORE UPDATE ON public.sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deal_stage_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buying_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discarded_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_companies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS (Permitir acesso autenticado)
-- ============================================================================

-- Companies
DROP POLICY IF EXISTS "Authenticated users can read companies" ON public.companies;
CREATE POLICY "Authenticated users can read companies"
  ON public.companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
CREATE POLICY "Authenticated users can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
CREATE POLICY "Authenticated users can update companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete companies" ON public.companies;
CREATE POLICY "Authenticated users can delete companies"
  ON public.companies FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Decision Makers
DROP POLICY IF EXISTS "Authenticated users can read decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can read decision_makers"
  ON public.decision_makers FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can insert decision_makers"
  ON public.decision_makers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can update decision_makers"
  ON public.decision_makers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete decision_makers" ON public.decision_makers;
CREATE POLICY "Authenticated users can delete decision_makers"
  ON public.decision_makers FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ICP Analysis Results
DROP POLICY IF EXISTS "Authenticated users can read icp_analysis_results" ON public.icp_analysis_results;
CREATE POLICY "Authenticated users can read icp_analysis_results"
  ON public.icp_analysis_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert icp_analysis_results" ON public.icp_analysis_results;
CREATE POLICY "Authenticated users can insert icp_analysis_results"
  ON public.icp_analysis_results FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update icp_analysis_results" ON public.icp_analysis_results;
CREATE POLICY "Authenticated users can update icp_analysis_results"
  ON public.icp_analysis_results FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete icp_analysis_results" ON public.icp_analysis_results;
CREATE POLICY "Authenticated users can delete icp_analysis_results"
  ON public.icp_analysis_results FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- SDR Deals
DROP POLICY IF EXISTS "Authenticated users can read deals" ON public.sdr_deals;
CREATE POLICY "Authenticated users can read deals"
  ON public.sdr_deals FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert deals" ON public.sdr_deals;
CREATE POLICY "Authenticated users can insert deals"
  ON public.sdr_deals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update deals" ON public.sdr_deals;
CREATE POLICY "Authenticated users can update deals"
  ON public.sdr_deals FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete deals" ON public.sdr_deals;
CREATE POLICY "Authenticated users can delete deals"
  ON public.sdr_deals FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Pipeline Stages
DROP POLICY IF EXISTS "Anyone can read pipeline stages" ON public.sdr_pipeline_stages;
CREATE POLICY "Anyone can read pipeline stages"
  ON public.sdr_pipeline_stages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage pipeline stages" ON public.sdr_pipeline_stages;
CREATE POLICY "Admins can manage pipeline stages"
  ON public.sdr_pipeline_stages FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Deal Activities
DROP POLICY IF EXISTS "Authenticated users can read deal activities" ON public.sdr_deal_activities;
CREATE POLICY "Authenticated users can read deal activities"
  ON public.sdr_deal_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert deal activities" ON public.sdr_deal_activities;
CREATE POLICY "Authenticated users can insert deal activities"
  ON public.sdr_deal_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Buying Signals
DROP POLICY IF EXISTS "Authenticated users can read buying_signals" ON public.buying_signals;
CREATE POLICY "Authenticated users can read buying_signals"
  ON public.buying_signals FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert buying_signals" ON public.buying_signals;
CREATE POLICY "Authenticated users can insert buying_signals"
  ON public.buying_signals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Digital Maturity
DROP POLICY IF EXISTS "Authenticated users can read digital_maturity" ON public.digital_maturity;
CREATE POLICY "Authenticated users can read digital_maturity"
  ON public.digital_maturity FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert digital_maturity" ON public.digital_maturity;
CREATE POLICY "Authenticated users can insert digital_maturity"
  ON public.digital_maturity FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update digital_maturity" ON public.digital_maturity;
CREATE POLICY "Authenticated users can update digital_maturity"
  ON public.digital_maturity FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Search History
DROP POLICY IF EXISTS "Authenticated users can read search_history" ON public.search_history;
CREATE POLICY "Authenticated users can read search_history"
  ON public.search_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert search_history" ON public.search_history;
CREATE POLICY "Authenticated users can insert search_history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Discarded Companies
DROP POLICY IF EXISTS "Authenticated users can read discarded_companies" ON public.discarded_companies;
CREATE POLICY "Authenticated users can read discarded_companies"
  ON public.discarded_companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert discarded_companies" ON public.discarded_companies;
CREATE POLICY "Authenticated users can insert discarded_companies"
  ON public.discarded_companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Similar Companies
DROP POLICY IF EXISTS "Authenticated users can read similar_companies" ON public.similar_companies;
CREATE POLICY "Authenticated users can read similar_companies"
  ON public.similar_companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert similar_companies" ON public.similar_companies;
CREATE POLICY "Authenticated users can insert similar_companies"
  ON public.similar_companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- ✅ Tabelas criadas:
--   1. companies
--   2. decision_makers
--   3. icp_analysis_results
--   4. sdr_deals
--   5. sdr_pipeline_stages
--   6. sdr_deal_activities
--   7. buying_signals
--   8. digital_maturity
--   9. search_history
--   10. discarded_companies
--   11. similar_companies
-- ============================================================================

