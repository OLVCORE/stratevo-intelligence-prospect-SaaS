-- Ciclo 1: Fundações Críticas - Melhorias na estrutura de Leads

-- Adicionar novos campos na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS notes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tasks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS files_count INTEGER DEFAULT 0;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_tags ON public.leads USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON public.leads(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);

-- Criar tabela para múltiplos contatos por lead
CREATE TABLE IF NOT EXISTS public.lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para lead_contacts
CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead_id ON public.lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_is_primary ON public.lead_contacts(is_primary);

-- RLS para lead_contacts
ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver contatos"
  ON public.lead_contacts FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'gestor'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role) OR
    has_role(auth.uid(), 'sdr'::app_role)
  );

CREATE POLICY "Admins/Sales podem criar contatos"
  ON public.lead_contacts FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role) OR
    has_role(auth.uid(), 'sdr'::app_role)
  );

CREATE POLICY "Admins/Sales podem atualizar contatos"
  ON public.lead_contacts FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role)
  );

CREATE POLICY "Admins podem deletar contatos"
  ON public.lead_contacts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_lead_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_lead_contacts_updated_at_trigger
  BEFORE UPDATE ON public.lead_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_contacts_updated_at();

-- Criar tabela para histórico detalhado de mudanças
CREATE TABLE IF NOT EXISTS public.lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para lead_history
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON public.lead_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_created_at ON public.lead_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_history_user_id ON public.lead_history(user_id);

-- RLS para lead_history
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver histórico"
  ON public.lead_history FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'gestor'::app_role) OR
    has_role(auth.uid(), 'vendedor'::app_role) OR
    has_role(auth.uid(), 'sdr'::app_role)
  );

CREATE POLICY "Sistema pode criar histórico"
  ON public.lead_history FOR INSERT
  WITH CHECK (true);

-- Função para registrar mudanças automaticamente
CREATE OR REPLACE FUNCTION log_lead_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_history (lead_id, user_id, action, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'status_change', 'status', OLD.status, NEW.status, 
            'Status alterado de ' || OLD.status || ' para ' || NEW.status);
  END IF;

  -- Log priority change
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.lead_history (lead_id, user_id, action, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'priority_change', 'priority', OLD.priority, NEW.priority,
            'Prioridade alterada de ' || OLD.priority || ' para ' || NEW.priority);
  END IF;

  -- Log assigned_to change
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.lead_history (lead_id, user_id, action, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'assignment_change', 'assigned_to', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT,
            'Lead reatribuído');
  END IF;

  -- Log tags change
  IF OLD.tags IS DISTINCT FROM NEW.tags THEN
    INSERT INTO public.lead_history (lead_id, user_id, action, field_name, old_value, new_value, description)
    VALUES (NEW.id, auth.uid(), 'tags_change', 'tags', array_to_string(OLD.tags, ','), array_to_string(NEW.tags, ','),
            'Tags atualizadas');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_lead_changes_trigger
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_changes();

-- Criar função para calcular lead score automaticamente
CREATE OR REPLACE FUNCTION calculate_lead_score()
RETURNS TRIGGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base score: 10 points
  score := 10;

  -- Has email: +10
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    score := score + 10;
  END IF;

  -- Has phone: +10
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    score := score + 10;
  END IF;

  -- Has event date: +15
  IF NEW.event_date IS NOT NULL THEN
    score := score + 15;
  END IF;

  -- Has company: +10
  IF NEW.company_name IS NOT NULL AND NEW.company_name != '' THEN
    score := score + 10;
  END IF;

  -- High priority: +20
  IF NEW.priority = 'urgent' THEN
    score := score + 20;
  ELSIF NEW.priority = 'high' THEN
    score := score + 15;
  END IF;

  -- Has activities: +5 per activity (max 25)
  IF NEW.tasks_count > 0 THEN
    score := score + LEAST(NEW.tasks_count * 5, 25);
  END IF;

  -- Has notes: +3 per note (max 15)
  IF NEW.notes_count > 0 THEN
    score := score + LEAST(NEW.notes_count * 3, 15);
  END IF;

  -- Source bonus
  IF NEW.source IN ('referral', 'website') THEN
    score := score + 10;
  END IF;

  NEW.lead_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_lead_score_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lead_score();

-- Atualizar scores existentes
UPDATE public.leads SET lead_score = 0 WHERE lead_score IS NULL;