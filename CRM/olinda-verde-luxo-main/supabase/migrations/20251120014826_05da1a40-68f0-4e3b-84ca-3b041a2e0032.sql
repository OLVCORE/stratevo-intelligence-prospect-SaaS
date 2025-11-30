-- Habilitar realtime para a tabela email_history
ALTER TABLE public.email_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_history;