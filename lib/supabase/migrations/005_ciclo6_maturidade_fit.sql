-- CICLO 6: Maturidade + FIT TOTVS/OLV
-- Execute no Supabase SQL Editor

-- Snapshot do score por empresa (mantém histórico de execuções)
CREATE TABLE IF NOT EXISTS public.maturity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,                        -- agrupar uma execução completa
  pillar TEXT NOT NULL CHECK (pillar IN ('infra','dados','processos','sistemas','pessoas','cultura')),
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  evidence JSONB NOT NULL,                     -- [{signal, weight, source, url?, when}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maturity_scores_company ON public.maturity_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_maturity_scores_run ON public.maturity_scores(run_id);
CREATE INDEX IF NOT EXISTS idx_maturity_scores_pillar ON public.maturity_scores(pillar);

-- Recomendações por pilar
CREATE TABLE IF NOT EXISTS public.maturity_recos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,
  pillar TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  rationale TEXT,                               -- por-que (explicação resumida)
  priority TEXT CHECK (priority IN ('baixa','média','alta')) DEFAULT 'média',
  source TEXT,                                  -- 'rule'|'digital'|'tech'|etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maturity_recos_company ON public.maturity_recos(company_id);
CREATE INDEX IF NOT EXISTS idx_maturity_recos_run ON public.maturity_recos(run_id);

-- Fit TOTVS por área/linha de produto
CREATE TABLE IF NOT EXISTS public.fit_totvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  run_id UUID NOT NULL,
  area TEXT NOT NULL,                           -- 'Financeiro','RH','Indústria','Agro','Distribuição','Serviços'
  fit INT NOT NULL CHECK (fit BETWEEN 0 AND 100),
  signals JSONB NOT NULL,                       -- evidências/sinais usados
  next_steps TEXT,                              -- próximos passos sugeridos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fit_totvs_company ON public.fit_totvs(company_id);
CREATE INDEX IF NOT EXISTS idx_fit_totvs_run ON public.fit_totvs(run_id);
CREATE INDEX IF NOT EXISTS idx_fit_totvs_area ON public.fit_totvs(area);

