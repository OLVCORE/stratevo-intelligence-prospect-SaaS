-- ============================================================================
-- MIGRATION: CRM Automations Infrastructure - CICLO 2
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Infraestrutura completa para automações básicas do CRM
-- ============================================================================

-- ============================================
-- REMINDERS (Lembretes Agendados)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL, -- follow_up, proposal_expiry, task_overdue, custom, stage_change
  reminder_date TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  
  -- Ações
  action_type TEXT NOT NULL, -- create_task, send_email, send_notification, send_whatsapp
  action_config JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, sent, cancelled, failed
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_tenant_id ON public.reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON public.reminders(tenant_id, reminder_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminders_lead_id ON public.reminders(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_deal_id ON public.reminders(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_proposal_id ON public.reminders(proposal_id) WHERE proposal_id IS NOT NULL;

-- RLS para reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reminders' AND policyname='Users can view reminders from their tenant') THEN
    DROP POLICY "Users can view reminders from their tenant" ON public.reminders;
  END IF;
END $$;
CREATE POLICY "Users can view reminders from their tenant"
  ON public.reminders FOR SELECT
  USING (tenant_id = get_current_tenant_id());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reminders' AND policyname='Users can manage reminders in their tenant') THEN
    DROP POLICY "Users can manage reminders in their tenant" ON public.reminders;
  END IF;
END $$;
CREATE POLICY "Users can manage reminders in their tenant"
  ON public.reminders FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_reminders_updated_at'
      AND c.relname = 'reminders'
  ) THEN
    CREATE TRIGGER update_reminders_updated_at
      BEFORE UPDATE ON public.reminders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- WHATSAPP QUICK REPLIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT, -- greeting, follow_up, proposal, closing, support
  
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_tenant_id ON public.whatsapp_quick_replies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_category ON public.whatsapp_quick_replies(tenant_id, category) WHERE is_active = true;

-- RLS para whatsapp_quick_replies
ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_quick_replies' AND policyname='Users can view quick replies from their tenant') THEN
    DROP POLICY "Users can view quick replies from their tenant" ON public.whatsapp_quick_replies;
  END IF;
END $$;
CREATE POLICY "Users can view quick replies from their tenant"
  ON public.whatsapp_quick_replies FOR SELECT
  USING (tenant_id = get_current_tenant_id());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_quick_replies' AND policyname='Users can manage quick replies in their tenant') THEN
    DROP POLICY "Users can manage quick replies in their tenant" ON public.whatsapp_quick_replies;
  END IF;
END $$;
CREATE POLICY "Users can manage quick replies in their tenant"
  ON public.whatsapp_quick_replies FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'update_whatsapp_quick_replies_updated_at'
      AND c.relname = 'whatsapp_quick_replies'
  ) THEN
    CREATE TRIGGER update_whatsapp_quick_replies_updated_at
      BEFORE UPDATE ON public.whatsapp_quick_replies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- TRIGGERS PARA MUDANÇAS DE ESTÁGIO
-- ============================================

-- Função para notificar mudança de estágio de lead
CREATE OR REPLACE FUNCTION public.notify_lead_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notificar apenas se o estágio realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Inserir evento na fila de automações (via tabela de eventos)
    INSERT INTO public.automation_events (
      tenant_id,
      event_type,
      entity_type,
      entity_id,
      event_data
    ) VALUES (
      NEW.tenant_id,
      'stage_change',
      'lead',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'lead_id', NEW.id,
        'lead_name', NEW.name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Tabela de eventos de automação (fila)
CREATE TABLE IF NOT EXISTS public.automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- stage_change, field_update, time_based, webhook
  entity_type TEXT NOT NULL, -- lead, deal, proposal, activity
  entity_id UUID NOT NULL,
  
  event_data JSONB DEFAULT '{}'::JSONB,
  
  -- Processamento
  status TEXT DEFAULT 'pending', -- pending, processing, processed, failed
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_tenant_id ON public.automation_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_status ON public.automation_events(tenant_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_automation_events_entity ON public.automation_events(entity_type, entity_id);

-- RLS para automation_events
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='automation_events' AND policyname='Users can view automation events from their tenant') THEN
    DROP POLICY "Users can view automation events from their tenant" ON public.automation_events;
  END IF;
END $$;
CREATE POLICY "Users can view automation events from their tenant"
  ON public.automation_events FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Trigger para leads
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trigger_notify_lead_stage_change'
      AND c.relname = 'leads'
  ) THEN
    DROP TRIGGER trigger_notify_lead_stage_change ON public.leads;
  END IF;
END $$;
CREATE TRIGGER trigger_notify_lead_stage_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_lead_stage_change();

-- Função para notificar mudança de estágio de deal
CREATE OR REPLACE FUNCTION public.notify_deal_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.automation_events (
      tenant_id,
      event_type,
      entity_type,
      entity_id,
      event_data
    ) VALUES (
      NEW.tenant_id,
      'stage_change',
      'deal',
      NEW.id,
      jsonb_build_object(
        'old_stage', OLD.stage,
        'new_stage', NEW.stage,
        'deal_id', NEW.id,
        'deal_title', NEW.title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para deals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'trigger_notify_deal_stage_change'
      AND c.relname = 'deals'
  ) THEN
    DROP TRIGGER trigger_notify_deal_stage_change ON public.deals;
  END IF;
END $$;
CREATE TRIGGER trigger_notify_deal_stage_change
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION public.notify_deal_stage_change();

-- ============================================
-- TEMPLATES DE EMAIL PRÉ-CONFIGURADOS
-- ============================================

-- Template: Bem-vindo - Novo Lead
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id, nome FROM public.tenants LOOP
    INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
    VALUES (
      tenant_record.id,
      'Bem-vindo - Novo Lead',
      'Bem-vindo, {{lead.name}}!',
      'Olá {{lead.name}},

Obrigado pelo seu interesse! Estamos felizes em ter você como nosso lead.

Em breve entraremos em contato para conversarmos sobre como podemos ajudar a {{lead.company_name}}.

Atenciosamente,
Equipe ' || COALESCE(tenant_record.nome, 'STRATEVO'),
      'welcome',
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Template: Follow-up - Após 3 dias
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id, nome FROM public.tenants LOOP
    INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
    VALUES (
      tenant_record.id,
      'Follow-up - Após 3 dias',
      'Seguindo sobre nossa conversa - {{lead.company_name}}',
      'Olá {{lead.name}},

Espero que esteja bem! Gostaria de saber se há alguma dúvida sobre nossa proposta para a {{lead.company_name}}.

Estou à disposição para conversarmos.

Atenciosamente,
{{sender.name}}',
      'follow_up',
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Template: Proposta Enviada
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id, nome FROM public.tenants LOOP
    INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
    VALUES (
      tenant_record.id,
      'Proposta Enviada',
      'Proposta Comercial - {{proposal.proposal_number}}',
      'Olá {{lead.name}},

Segue em anexo nossa proposta comercial para a {{lead.company_name}}.

Proposta: {{proposal.proposal_number}}
Valor: R$ {{proposal.final_price}}
Validade: {{proposal.valid_until}}

Aguardo seu retorno.

Atenciosamente,
{{sender.name}}',
      'proposal',
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Template: Lembrete - Proposta Vencendo
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id, nome FROM public.tenants LOOP
    INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
    VALUES (
      tenant_record.id,
      'Lembrete - Proposta Vencendo',
      'Lembrete: Proposta {{proposal.proposal_number}} vence em breve',
      'Olá {{lead.name}},

Gostaria de lembrar que nossa proposta {{proposal.proposal_number}} vence em {{days_until_expiry}} dias.

Valor: R$ {{proposal.final_price}}
Validade: {{proposal.valid_until}}

Se tiver alguma dúvida ou quiser negociar, estou à disposição.

Atenciosamente,
{{sender.name}}',
      'reminder',
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Template: Lead Qualificado
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id, nome FROM public.tenants LOOP
    INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
    VALUES (
      tenant_record.id,
      'Lead Qualificado - Notificação',
      'Parabéns! Seu lead {{lead.name}} foi qualificado',
      'Olá {{assigned_to.name}},

Ótimas notícias! O lead {{lead.name}} da empresa {{lead.company_name}} foi qualificado e está pronto para avançar no pipeline.

Próximos passos sugeridos:
- Agendar reunião de descoberta
- Enviar material de apresentação
- Preparar proposta inicial

Atenciosamente,
Sistema CRM',
      'notification',
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- WHATSAPP QUICK REPLIES PRÉ-CONFIGURADOS
-- ============================================

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    -- Greeting
    INSERT INTO public.whatsapp_quick_replies (tenant_id, name, message, category, is_active)
    VALUES (
      tenant_record.id,
      'Olá - Saudação',
      'Olá! Obrigado pelo contato. Como posso ajudar?',
      'greeting',
      true
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Follow-up
    INSERT INTO public.whatsapp_quick_replies (tenant_id, name, message, category, is_active)
    VALUES (
      tenant_record.id,
      'Seguindo - Follow-up',
      'Olá! Estou seguindo sobre nossa conversa anterior. Tem alguma dúvida?',
      'follow_up',
      true
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Proposal
    INSERT INTO public.whatsapp_quick_replies (tenant_id, name, message, category, is_active)
    VALUES (
      tenant_record.id,
      'Proposta Enviada',
      'Olá! Acabei de enviar nossa proposta por email. Pode verificar? Qualquer dúvida, estou à disposição!',
      'proposal',
      true
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Closing
    INSERT INTO public.whatsapp_quick_replies (tenant_id, name, message, category, is_active)
    VALUES (
      tenant_record.id,
      'Fechamento',
      'Perfeito! Fico feliz que tenha gostado. Vamos avançar? Posso agendar uma reunião para finalizarmos os detalhes.',
      'closing',
      true
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.reminders IS 'Lembretes agendados para automações do CRM';
COMMENT ON TABLE public.whatsapp_quick_replies IS 'Respostas rápidas pré-configuradas para WhatsApp';
COMMENT ON TABLE public.automation_events IS 'Fila de eventos para processamento de automações';
COMMENT ON FUNCTION public.notify_lead_stage_change IS 'Notifica mudanças de estágio de leads para o sistema de automações';
COMMENT ON FUNCTION public.notify_deal_stage_change IS 'Notifica mudanças de estágio de deals para o sistema de automações';

