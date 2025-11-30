-- ===================================
-- FASE 1: BLOQUEIOS DE CALENDÁRIO
-- ===================================

-- Tabela de bloqueios de datas
CREATE TABLE IF NOT EXISTS public.event_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('evento', 'manutencao', 'indisponivel')),
  is_full_day BOOLEAN DEFAULT true,
  time_slots_blocked JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para event_blocks
ALTER TABLE public.event_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver bloqueios"
ON public.event_blocks FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins podem criar bloqueios"
ON public.event_blocks FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar bloqueios"
ON public.event_blocks FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar bloqueios"
ON public.event_blocks FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- FASE 2: TIPOS DE AGENDAMENTO
-- ===================================

-- Adicionar campos em appointments para tipos
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'visita' 
CHECK (appointment_type IN ('visita', 'degustacao', 'reuniao_fechamento', 'planejamento')),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS confirmed_by UUID;

-- ===================================
-- FASE 4: EVENTOS CONFIRMADOS
-- ===================================

CREATE TABLE IF NOT EXISTS public.confirmed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  guest_count INTEGER,
  status TEXT NOT NULL DEFAULT 'confirmado' 
    CHECK (status IN ('confirmado', 'em_planejamento', 'em_andamento', 'concluido', 'cancelado')),
  total_value NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pendente'
    CHECK (payment_status IN ('pendente', 'parcial', 'pago', 'atrasado')),
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  checklist JSONB DEFAULT '[]'::jsonb,
  suppliers JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para confirmed_events
ALTER TABLE public.confirmed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver eventos confirmados"
ON public.confirmed_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem criar eventos confirmados"
ON public.confirmed_events FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem atualizar eventos confirmados"
ON public.confirmed_events FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins podem deletar eventos confirmados"
ON public.confirmed_events FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- FASE 4: PAGAMENTOS
-- ===================================

CREATE TABLE IF NOT EXISTS public.event_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.confirmed_events(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  payment_type TEXT CHECK (payment_type IN ('entrada', 'parcela', 'saldo')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para event_payments
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver pagamentos"
ON public.event_payments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

CREATE POLICY "Admins/Sales podem criar pagamentos"
ON public.event_payments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role));

-- ===================================
-- FASE 6: NOTIFICAÇÕES
-- ===================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead', 'appointment', 'proposal', 'payment', 'event', 'system')),
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notificações"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas notificações"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ===================================
-- TRIGGERS
-- ===================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_event_blocks_updated_at
  BEFORE UPDATE ON public.event_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_confirmed_events_updated_at
  BEFORE UPDATE ON public.confirmed_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger para criar bloqueio quando evento é confirmado
CREATE OR REPLACE FUNCTION create_event_block_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_blocks (date, reason, block_type, is_full_day)
  VALUES (NEW.event_date, 'Evento: ' || NEW.event_type, 'evento', true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_block_on_event_confirm
  AFTER INSERT ON public.confirmed_events
  FOR EACH ROW
  WHEN (NEW.status = 'confirmado')
  EXECUTE FUNCTION create_event_block_on_confirm();

-- Trigger para notificar novo lead
CREATE OR REPLACE FUNCTION notify_admins_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    VALUES (
      admin_user_id,
      'Novo Lead Recebido',
      'Lead de ' || NEW.name || ' para evento: ' || NEW.event_type,
      'lead',
      'leads',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_lead();