-- CICLO 1: Schema de Empresas com campos corretos
-- Execute no Supabase SQL Editor

-- Empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  trade_name TEXT,
  cnpj TEXT UNIQUE,
  website TEXT,
  domain TEXT,
  capital_social NUMERIC(16,2),
  size TEXT,
  status TEXT,
  founded_at DATE,
  location JSONB,
  financial JSONB,
  raw JSONB,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies (cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies (domain);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

