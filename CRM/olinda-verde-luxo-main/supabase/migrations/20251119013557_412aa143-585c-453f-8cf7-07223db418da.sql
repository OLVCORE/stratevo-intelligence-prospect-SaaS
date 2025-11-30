-- Criar tabela de deals/negócios do CRM
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'discovery',
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  actual_close_date DATE,
  lost_reason TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de atividades/interações
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- call, email, meeting, note, task
  subject TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de itens de proposta (locação, bufê, bar, etc)
CREATE TABLE IF NOT EXISTS public.proposal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- venue, catering, bar, decoration, sound, lighting, other
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar campos ao deals
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Adicionar campos às propostas para melhor controle
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;

-- Policies para deals
CREATE POLICY "Admins/Sales can view deals" ON public.deals
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales can create deals" ON public.deals
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales can update deals" ON public.deals
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins can delete deals" ON public.deals
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para activities
CREATE POLICY "Admins/Sales can view activities" ON public.activities
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales can create activities" ON public.activities
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales can update activities" ON public.activities
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins can delete activities" ON public.activities
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para proposal_items
CREATE POLICY "Admins/Sales can view items" ON public.proposal_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales can create items" ON public.proposal_items
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales can update items" ON public.proposal_items
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins can delete items" ON public.proposal_items
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();