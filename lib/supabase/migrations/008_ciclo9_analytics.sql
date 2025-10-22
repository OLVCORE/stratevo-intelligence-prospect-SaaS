-- CICLO 9: Analytics 360 & Telemetria
-- Execute no Supabase SQL Editor

-- 1) Funil por janela (company_id + date_range)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_funnel_daily
AS
SELECT
  c.id as company_id,
  date_trunc('day', e.created_at) as d,
  sum( CASE WHEN e.operation IN ('search','smart-search') THEN 1 ELSE 0 END ) as searched,
  sum( CASE WHEN e.operation IN ('digital_enrich','tech_enrich') THEN 1 ELSE 0 END ) as enriched,
  sum( CASE WHEN e.operation = 'decision_enrich' THEN 1 ELSE 0 END ) as decisioned,
  sum( CASE WHEN e.operation = 'message_send' THEN 1 ELSE 0 END ) as contacted,
  sum( CASE WHEN e.operation = 'reply_inbound' THEN 1 ELSE 0 END ) as replied,
  sum( CASE WHEN e.operation = 'meeting' THEN 1 ELSE 0 END ) as meeting
FROM public.provider_logs e
JOIN public.companies c ON c.id = COALESCE(e.company_id, c.id)
GROUP BY 1,2
WITH NO DATA;

CREATE INDEX IF NOT EXISTS mv_funnel_daily_idx ON public.mv_funnel_daily(company_id, d);

-- 2) Performance de playbooks por step/variant (consolidação diária)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_playbooks_daily
AS
SELECT
  r.playbook_id,
  date_trunc('day', ev.created_at) as d,
  ev.step_index,
  COALESCE(ev.variant,'A') as variant,
  count(*) FILTER (WHERE ev.action='send') as sends,
  count(*) FILTER (WHERE ev.action='reply') as replies,
  count(*) FILTER (WHERE ev.action='error') as errors,
  avg(NULLIF(ev.latency_ms,0)) as avg_ms
FROM public.run_events ev
JOIN public.runs r ON r.id = ev.run_id
GROUP BY 1,2,3,4
WITH NO DATA;

CREATE INDEX IF NOT EXISTS mv_playbooks_daily_idx ON public.mv_playbooks_daily(playbook_id, d, step_index, variant);

-- 3) Heatmap horário × dia útil (envios e respostas)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_heatmap
AS
SELECT
  date_part('dow', ev.created_at)::int as dow, -- 0 domingo ... 6 sábado
  date_part('hour', ev.created_at)::int as hh,
  count(*) FILTER (WHERE ev.action='send') as sends,
  count(*) FILTER (WHERE ev.action='reply') as replies
FROM public.run_events ev
GROUP BY 1,2
WITH NO DATA;

CREATE INDEX IF NOT EXISTS mv_heatmap_idx ON public.mv_heatmap(dow, hh);

-- 4) Eficiência por persona (label na lead ou pessoa)
-- Adiciona coluna persona se não existir
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS persona TEXT;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_persona_efficiency
AS
SELECT
  COALESCE(l.persona, 'unknown') as persona,
  count(DISTINCT r.id) as runs,
  count(*) FILTER (WHERE ev.action='send') as sends,
  count(*) FILTER (WHERE ev.action='reply') as replies,
  count(*) FILTER (WHERE ev.action='meeting') as meetings
FROM public.runs r
JOIN public.leads l ON l.id = r.lead_id
LEFT JOIN public.run_events ev ON ev.run_id = r.id
GROUP BY 1
WITH NO DATA;

CREATE INDEX IF NOT EXISTS mv_persona_eff_idx ON public.mv_persona_efficiency(persona);

-- Helper: função de refresh incremental simples
CREATE OR REPLACE FUNCTION public.refresh_ciclo9_materialized()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_funnel_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_playbooks_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_heatmap;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_persona_efficiency;
END $$;

-- Primeira carga (execute manualmente após criar as views):
-- REFRESH MATERIALIZED VIEW public.mv_funnel_daily;
-- REFRESH MATERIALIZED VIEW public.mv_playbooks_daily;
-- REFRESH MATERIALIZED VIEW public.mv_heatmap;
-- REFRESH MATERIALIZED VIEW public.mv_persona_efficiency;

