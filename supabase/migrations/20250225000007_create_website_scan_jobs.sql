-- Migration: Criar tabela para rastreamento de jobs de extração de produtos
-- Permite processamento em etapas e continuidade entre execuções

CREATE TABLE IF NOT EXISTS public.website_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  website_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, scanning, completed, failed
  pages_discovered JSONB DEFAULT '[]'::jsonb, -- Array de URLs encontradas
  pages_scanned JSONB DEFAULT '[]'::jsonb, -- Array de URLs já processadas
  products_found INTEGER DEFAULT 0,
  products_inserted INTEGER DEFAULT 0,
  current_batch INTEGER DEFAULT 0,
  total_batches INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Dados adicionais (sitemap encontrado, etc)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT website_scan_jobs_status_check CHECK (status IN ('pending', 'scanning', 'completed', 'failed'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_tenant_id ON public.website_scan_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_status ON public.website_scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_website_url ON public.website_scan_jobs(website_url);
CREATE INDEX IF NOT EXISTS idx_website_scan_jobs_created_at ON public.website_scan_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE public.website_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas jobs do seu tenant
CREATE POLICY "Users can view their tenant's scan jobs"
  ON public.website_scan_jobs
  FOR SELECT
  USING (tenant_id = ANY(SELECT public.get_user_tenant_ids()));

-- Policy: Service role pode fazer tudo (para Edge Functions)
CREATE POLICY "Service role can manage all scan jobs"
  ON public.website_scan_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.website_scan_jobs IS 'Rastreamento de jobs de extração de produtos de websites em etapas';
COMMENT ON COLUMN public.website_scan_jobs.pages_discovered IS 'Array de URLs descobertas (sitemap, SERPER, crawling)';
COMMENT ON COLUMN public.website_scan_jobs.pages_scanned IS 'Array de URLs já processadas pela IA';
COMMENT ON COLUMN public.website_scan_jobs.metadata IS 'Metadados adicionais (sitemap encontrado, total de páginas, etc)';
