-- Corrigir política RLS para criação de leads por usuários autenticados
CREATE POLICY "Admins/Sales podem criar leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sales'::app_role)
);

-- Habilitar realtime para activities e deals (leads já está habilitado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;

-- Criar tabela para templates de email
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS para email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver templates"
ON public.email_templates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sales'::app_role)
);

CREATE POLICY "Admins podem criar templates"
ON public.email_templates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar templates"
ON public.email_templates
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar templates"
ON public.email_templates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela para histórico de emails
CREATE TABLE public.email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'sent',
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone
);

ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver histórico de emails"
ON public.email_history FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem criar histórico"
ON public.email_history FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

-- Criar tabela para WhatsApp
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  message text NOT NULL,
  direction text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'sent',
  read_at timestamp with time zone
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver WhatsApp"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem criar WhatsApp"
ON public.whatsapp_messages FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

-- Criar tabela para chamadas
CREATE TABLE public.call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  direction text NOT NULL,
  duration integer,
  recording_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'completed'
);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver chamadas"
ON public.call_history FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem criar chamadas"
ON public.call_history FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

-- Criar tabela para arquivos
CREATE TABLE public.lead_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.lead_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver arquivos"
ON public.lead_files FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem criar arquivos"
ON public.lead_files FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem deletar arquivos"
ON public.lead_files FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

-- Índices
CREATE INDEX idx_email_history_lead_id ON public.email_history(lead_id);
CREATE INDEX idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX idx_call_history_lead_id ON public.call_history(lead_id);
CREATE INDEX idx_lead_files_lead_id ON public.lead_files(lead_id);

-- Trigger
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();