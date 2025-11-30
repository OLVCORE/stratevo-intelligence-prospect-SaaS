-- Migration: Critérios de Análise Adicionais para ICP
-- Permite configurar quais análises adicionais devem ser incluídas na geração do ICP

CREATE TABLE IF NOT EXISTS public.icp_analysis_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_profile_metadata_id UUID NOT NULL REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Critérios básicos (sempre incluídos)
  include_macroeconomic BOOLEAN DEFAULT true,
  include_sector_analysis BOOLEAN DEFAULT true,
  include_cnae_analysis BOOLEAN DEFAULT true,
  include_foreign_trade BOOLEAN DEFAULT false,
  include_statistical_analysis BOOLEAN DEFAULT true,
  include_competitive_analysis BOOLEAN DEFAULT true,
  include_market_trends BOOLEAN DEFAULT true,
  include_predictions BOOLEAN DEFAULT true,
  
  -- Critérios adicionais configuráveis
  custom_criteria JSONB DEFAULT '[]'::jsonb, -- [{name: string, enabled: boolean, description: string}]
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Um conjunto de critérios por ICP
  UNIQUE(icp_profile_metadata_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_analysis_criteria_icp ON public.icp_analysis_criteria(icp_profile_metadata_id);
CREATE INDEX IF NOT EXISTS idx_icp_analysis_criteria_tenant ON public.icp_analysis_criteria(tenant_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_icp_analysis_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_icp_analysis_criteria_updated_at ON public.icp_analysis_criteria;
CREATE TRIGGER trigger_update_icp_analysis_criteria_updated_at
  BEFORE UPDATE ON public.icp_analysis_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_icp_analysis_criteria_updated_at();

-- RLS Policies
ALTER TABLE public.icp_analysis_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ICP analysis criteria from their tenant"
  ON public.icp_analysis_criteria
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ICP analysis criteria in their tenant"
  ON public.icp_analysis_criteria
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ICP analysis criteria from their tenant"
  ON public.icp_analysis_criteria
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Tabela para armazenar relatórios gerados
CREATE TABLE IF NOT EXISTS public.icp_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_profile_metadata_id UUID NOT NULL REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Tipo de relatório
  report_type TEXT NOT NULL CHECK (report_type IN ('completo', 'resumo')),
  
  -- Dados do relatório
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dados completos do relatório
  pdf_url TEXT, -- URL do PDF gerado (armazenado no Supabase Storage)
  pdf_preview_url TEXT, -- URL de preview do PDF
  
  -- Metadados
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_reports_icp ON public.icp_reports(icp_profile_metadata_id);
CREATE INDEX IF NOT EXISTS idx_icp_reports_tenant ON public.icp_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_reports_type ON public.icp_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_icp_reports_status ON public.icp_reports(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_icp_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_icp_reports_updated_at ON public.icp_reports;
CREATE TRIGGER trigger_update_icp_reports_updated_at
  BEFORE UPDATE ON public.icp_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_icp_reports_updated_at();

-- RLS Policies
ALTER TABLE public.icp_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ICP reports from their tenant"
  ON public.icp_reports
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ICP reports in their tenant"
  ON public.icp_reports
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ICP reports from their tenant"
  ON public.icp_reports
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

