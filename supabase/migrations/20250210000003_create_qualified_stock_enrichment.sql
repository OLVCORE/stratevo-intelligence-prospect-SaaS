-- ==========================================
-- Criar tabela qualified_stock_enrichment
-- Armazena dados de enriquecimento das empresas qualificadas
-- ==========================================

CREATE TABLE IF NOT EXISTS public.qualified_stock_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES public.qualified_prospects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  fantasia TEXT,
  cnae_principal TEXT,
  cnae_tipo TEXT CHECK (cnae_tipo IN ('MANUFATURA', 'COMERCIO', 'SERVICOS', 'AGRO', 'OUTROS')),
  data_quality TEXT CHECK (data_quality IN ('COMPLETO', 'PARCIAL', 'RUIM')),
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  grade TEXT CHECK (grade IN ('A+', 'A', 'B', 'C', 'D')),
  origem TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índice único para evitar duplicatas
  UNIQUE(stock_id, cnpj)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_qualified_stock_enrichment_stock_id ON public.qualified_stock_enrichment(stock_id);
CREATE INDEX IF NOT EXISTS idx_qualified_stock_enrichment_cnpj ON public.qualified_stock_enrichment(cnpj);
CREATE INDEX IF NOT EXISTS idx_qualified_stock_enrichment_tenant_id ON public.qualified_stock_enrichment(tenant_id);

-- RLS Policies
ALTER TABLE public.qualified_stock_enrichment ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver enriquecimentos do seu tenant
CREATE POLICY "Users can view enrichments from their tenant" ON public.qualified_stock_enrichment
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem inserir/atualizar enriquecimentos do seu tenant
CREATE POLICY "Users can manage enrichments from their tenant" ON public.qualified_stock_enrichment
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_qualified_stock_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_qualified_stock_enrichment_updated_at
  BEFORE UPDATE ON public.qualified_stock_enrichment
  FOR EACH ROW
  EXECUTE FUNCTION update_qualified_stock_enrichment_updated_at();

