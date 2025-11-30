-- Tabela para log de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_identifier_endpoint ON public.rate_limit_log(identifier, endpoint, timestamp);

-- Limpar logs antigos automaticamente (> 1 hora)
CREATE OR REPLACE FUNCTION public.clean_old_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE timestamp < now() - interval '1 hour';
END;
$$;

-- Tabela para subscriptions de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  events text[] NOT NULL,
  secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela para logs de webhooks enviados
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event text NOT NULL,
  status text NOT NULL,
  http_status integer,
  error_message text,
  attempt integer DEFAULT 1,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_event ON public.webhook_logs(event);
CREATE INDEX idx_webhook_logs_sent_at ON public.webhook_logs(sent_at);

-- RLS Policies
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Rate limit log: apenas sistema pode inserir, admins podem ver
CREATE POLICY "System can insert rate limit logs"
ON public.rate_limit_log FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view rate limit logs"
ON public.rate_limit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Webhooks: admins podem gerenciar
CREATE POLICY "Admins can manage webhooks"
ON public.webhook_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));