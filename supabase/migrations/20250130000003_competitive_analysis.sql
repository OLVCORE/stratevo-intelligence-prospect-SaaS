-- Tabela para armazenar análises competitivas
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  icp_id UUID REFERENCES public.icp_profiles_metadata(id) ON DELETE SET NULL,
  
  -- Dados dos concorrentes analisados
  competitor_data JSONB DEFAULT '[]'::jsonb,
  
  -- Análises geradas
  ceo_analysis TEXT,
  swot_analysis JSONB DEFAULT '{}'::jsonb,
  market_share_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para um registro por tenant
  CONSTRAINT unique_competitive_analysis_per_tenant UNIQUE (tenant_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_competitive_analysis_tenant ON public.competitive_analysis(tenant_id);

-- RLS
ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their tenant competitive analysis"
  ON public.competitive_analysis FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their tenant competitive analysis"
  ON public.competitive_analysis FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their tenant competitive analysis"
  ON public.competitive_analysis FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_competitive_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_competitive_analysis_updated_at ON public.competitive_analysis;
CREATE TRIGGER trigger_competitive_analysis_updated_at
  BEFORE UPDATE ON public.competitive_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_competitive_analysis_updated_at();

