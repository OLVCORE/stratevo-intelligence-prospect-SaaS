-- =============================================================================
-- Aplicar manualmente no Supabase (SQL Editor) se db push falhar com duplicate key.
-- Este script aplica apenas as duas migrations do Data Enrich e as registra.
-- =============================================================================

-- 1) Migration 20260128190001: decision_makers (colunas Data Enrich)
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS email_verification_source TEXT;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS linkedin_profile_id TEXT;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS connection_degree INTEGER;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS mutual_connections INTEGER;

COMMENT ON COLUMN public.decision_makers.email_verification_source IS 'Fonte da verificação do email (ex: apollo, hunter)';
COMMENT ON COLUMN public.decision_makers.phone_verified IS 'Indica se o telefone foi verificado';
COMMENT ON COLUMN public.decision_makers.linkedin_profile_id IS 'ID do perfil LinkedIn';
COMMENT ON COLUMN public.decision_makers.location IS 'Localização textual do contato';
COMMENT ON COLUMN public.decision_makers.connection_degree IS 'Grau de conexão LinkedIn (1, 2, 3)';
COMMENT ON COLUMN public.decision_makers.mutual_connections IS 'Número de conexões em comum';

-- 2) Migration 20260128190002: companies (data_enrich_raw e colunas)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS data_enrich_raw JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS founding_year INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN public.companies.data_enrich_raw IS 'Dados raw do Data Enrich (get-company): apollo, linkedin, lusha, enrichment_status, etc.';
COMMENT ON COLUMN public.companies.founding_year IS 'Ano de fundação da empresa';
COMMENT ON COLUMN public.companies.logo_url IS 'URL do logo da empresa';

-- 3) Registrar no schema_migrations (evita que o CLI tente reaplicar)
-- Se der erro de coluna "statements", rode só os INSERTs com (version, name) e ignore "statements".
-- statements: use ARRAY[]::text[] se a coluna for text[]; se não existir, use só (version, name) no INSERT.
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260128190001', '20260128190001_decision_makers_data_enrich_columns.sql', ARRAY[]::text[]),
  ('20260128190002', '20260128190002_companies_data_enrich_raw.sql', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;
