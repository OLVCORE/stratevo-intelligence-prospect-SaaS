-- Data Enrich → companies: coluna para armazenar payload raw do get-company (auditoria e sync).

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS data_enrich_raw JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS founding_year INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN public.companies.data_enrich_raw IS 'Dados raw do Data Enrich (get-company): apollo, linkedin, lusha, enrichment_status, etc.';
COMMENT ON COLUMN public.companies.founding_year IS 'Ano de fundação da empresa';
COMMENT ON COLUMN public.companies.logo_url IS 'URL do logo da empresa';
