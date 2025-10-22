-- CICLO 3: Enriquecimento Digital + Tech Stack
-- Execute no Supabase SQL Editor

-- Digital Signals (presença digital, homepage, social, news)
CREATE TABLE IF NOT EXISTS public.digital_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  type TEXT CHECK (type IN ('homepage','social','news')) DEFAULT 'homepage',
  source TEXT NOT NULL,            -- 'direct_fetch' | 'serper' | 'cse' | etc.
  latency_ms INT,
  confidence INT CHECK (confidence BETWEEN 0 AND 100) DEFAULT 70,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digital_signals_company ON public.digital_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_digital_signals_type ON public.digital_signals(type);

-- Tech Signals (tecnologias detectadas)
CREATE TABLE IF NOT EXISTS public.tech_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tech_name TEXT NOT NULL,         -- ex: 'Next.js', 'WordPress', 'GA', 'Hotjar'
  category TEXT,                   -- 'framework','cms','analytics','ads','forms','ui'
  evidence JSONB NOT NULL,         -- { "pattern":"<script src=...>", "url":"...", "header":"server: cloudflare" }
  source TEXT NOT NULL,            -- 'heuristic' | 'builtwith' | 'similartech'
  latency_ms INT,
  confidence INT CHECK (confidence BETWEEN 0 AND 100) DEFAULT 60,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_signals_company ON public.tech_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_tech_signals_tech_name ON public.tech_signals(tech_name);

-- Provider Logs (telemetria por chamada)
CREATE TABLE IF NOT EXISTS public.provider_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,          -- 'direct_fetch'|'serper'|'cse'|'builtwith'|'similartech'
  operation TEXT NOT NULL,         -- 'digital'|'tech'
  status TEXT NOT NULL,            -- 'ok'|'error'
  latency_ms INT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_logs_company ON public.provider_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_provider_logs_provider ON public.provider_logs(provider);
CREATE INDEX IF NOT EXISTS idx_provider_logs_operation ON public.provider_logs(operation);

