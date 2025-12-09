-- Migration: Tabela para Candidatos de Prospecção Externa (MC9 V2.1)
-- Armazena empresas importadas de fontes externas (Empresas Aqui, Apollo, etc.)
-- para processamento posterior via MC6/MC8/MC9

CREATE TABLE IF NOT EXISTS public.prospecting_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- ICP alvo
  icp_id UUID NOT NULL REFERENCES public.icp_profiles_metadata(id) ON DELETE CASCADE,
  
  -- Origem dos dados
  source TEXT NOT NULL CHECK (source IN ('EMPRESAS_AQUI', 'APOLLO', 'PHANTOMBUSTER', 'GOOGLE_SHEETS', 'MANUAL')),
  source_batch_id TEXT NOT NULL, -- ID do lote/importação
  
  -- Dados da empresa
  company_name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  sector TEXT,
  uf TEXT,
  city TEXT,
  country TEXT DEFAULT 'Brasil',
  
  -- Dados de contato
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  
  -- Notas/observações
  notes TEXT,
  
  -- Status de processamento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_tenant ON public.prospecting_candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_icp ON public.prospecting_candidates(icp_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_source ON public.prospecting_candidates(source);
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_batch ON public.prospecting_candidates(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_cnpj ON public.prospecting_candidates(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_status ON public.prospecting_candidates(status);
CREATE INDEX IF NOT EXISTS idx_prospecting_candidates_created ON public.prospecting_candidates(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_prospecting_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prospecting_candidates_updated_at ON public.prospecting_candidates;
CREATE TRIGGER trigger_update_prospecting_candidates_updated_at
  BEFORE UPDATE ON public.prospecting_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_prospecting_candidates_updated_at();

-- RLS Policies
ALTER TABLE public.prospecting_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prospecting candidates from their tenant"
  ON public.prospecting_candidates
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create prospecting candidates in their tenant"
  ON public.prospecting_candidates
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update prospecting candidates from their tenant"
  ON public.prospecting_candidates
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete prospecting candidates from their tenant"
  ON public.prospecting_candidates
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.prospecting_candidates IS 'Candidatos de prospecção externa importados via CSV (MC9 V2.1)';
COMMENT ON COLUMN public.prospecting_candidates.source IS 'Origem dos dados: EMPRESAS_AQUI, APOLLO, PHANTOMBUSTER, GOOGLE_SHEETS, MANUAL';
COMMENT ON COLUMN public.prospecting_candidates.source_batch_id IS 'ID do lote de importação para rastreabilidade';
COMMENT ON COLUMN public.prospecting_candidates.status IS 'Status: pending (aguardando processamento), processing (em processamento), processed (processado), failed (falhou)';

