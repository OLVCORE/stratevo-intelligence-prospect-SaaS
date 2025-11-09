-- Criar tabelas que estão faltando

-- 1. digital_presence
CREATE TABLE IF NOT EXISTS public.digital_presence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  website text NULL,
  linkedin text NULL,
  instagram text NULL,
  facebook text NULL,
  twitter text NULL,
  youtube text NULL,
  tiktok text NULL,
  outros jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- 2. digital_maturity
CREATE TABLE IF NOT EXISTS public.digital_maturity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  maturity_score integer NULL,
  has_website boolean DEFAULT false,
  has_linkedin boolean DEFAULT false,
  has_ecommerce boolean DEFAULT false,
  has_social_media boolean DEFAULT false,
  tech_stack jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- 3. insights
CREATE TABLE IF NOT EXISTS public.insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  title text NOT NULL,
  description text NULL,
  priority text NULL, -- 'high', 'medium', 'low'
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. legal_data
CREATE TABLE IF NOT EXISTS public.legal_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  situacao_cadastral text NULL,
  processos_abertos integer DEFAULT 0,
  dividas_federais numeric(15,2) NULL,
  restricoes jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Desabilitar RLS em todas
ALTER TABLE public.digital_presence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_maturity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_data DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('digital_presence', 'digital_maturity', 'insights', 'legal_data')
  AND schemaname = 'public';

