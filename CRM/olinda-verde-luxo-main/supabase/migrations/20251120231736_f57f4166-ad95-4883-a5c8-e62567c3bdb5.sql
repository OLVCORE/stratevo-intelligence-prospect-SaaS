-- Criar tabela de regras de automação
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'status_change', 'stage_change', 'priority_change', 'days_inactive'
  trigger_condition JSONB NOT NULL, -- {"from": "novo", "to": "qualificado"} ou {"status": "qualificado"}
  is_active BOOLEAN DEFAULT true,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"type": "send_email", "template_id": "xxx"}, {"type": "create_task", "title": "xxx"}]
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver regras"
  ON public.automation_rules FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar regras"
  ON public.automation_rules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar regras"
  ON public.automation_rules FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar regras"
  ON public.automation_rules FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de logs de automação
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  trigger_data JSONB,
  actions_executed JSONB,
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial'
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver logs"
  ON public.automation_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de lembretes automáticos
CREATE TABLE IF NOT EXISTS public.automated_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL, -- 'followup_inactive', 'proposal_expiring', 'task_overdue'
  trigger_days INTEGER NOT NULL, -- dias para trigger
  is_active BOOLEAN DEFAULT true,
  action_type TEXT NOT NULL, -- 'notification', 'email', 'task'
  action_config JSONB, -- configuração da ação
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.automated_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar lembretes"
  ON public.automated_reminders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger atualizado para processar automações
CREATE OR REPLACE FUNCTION public.process_lead_automations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_condition JSONB;
  v_action JSONB;
  v_should_execute BOOLEAN;
BEGIN
  -- Processar cada regra ativa
  FOR v_rule IN 
    SELECT * FROM public.automation_rules 
    WHERE is_active = true
  LOOP
    v_should_execute := false;
    v_condition := v_rule.trigger_condition;
    
    -- Verificar tipo de trigger
    CASE v_rule.trigger_type
      WHEN 'status_change' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          IF (v_condition->>'from' IS NULL OR OLD.status = v_condition->>'from') 
             AND (v_condition->>'to' IS NULL OR NEW.status = v_condition->>'to') THEN
            v_should_execute := true;
          END IF;
        END IF;
        
      WHEN 'priority_change' THEN
        IF OLD.priority IS DISTINCT FROM NEW.priority THEN
          IF (v_condition->>'from' IS NULL OR OLD.priority = v_condition->>'from') 
             AND (v_condition->>'to' IS NULL OR NEW.priority = v_condition->>'to') THEN
            v_should_execute := true;
          END IF;
        END IF;
        
      WHEN 'assigned_change' THEN
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
          v_should_execute := true;
        END IF;
    END CASE;
    
    -- Executar ações se a condição for atendida
    IF v_should_execute THEN
      -- Processar cada ação
      FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
      LOOP
        -- Criar notificação
        IF v_action->>'type' = 'notification' THEN
          INSERT INTO public.notifications (
            user_id, 
            title, 
            message, 
            type, 
            entity_type, 
            entity_id
          )
          VALUES (
            COALESCE(NEW.assigned_to, (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1)),
            v_action->>'title',
            v_action->>'message',
            'automation',
            'leads',
            NEW.id
          );
        END IF;
        
        -- Criar tarefa
        IF v_action->>'type' = 'create_task' THEN
          INSERT INTO public.activities (
            lead_id,
            type,
            subject,
            description,
            due_date,
            created_by
          )
          VALUES (
            NEW.id,
            COALESCE(v_action->>'task_type', 'task'),
            v_action->>'title',
            v_action->>'description',
            CASE 
              WHEN v_action->>'due_days' IS NOT NULL 
              THEN now() + (v_action->>'due_days')::integer * interval '1 day'
              ELSE now() + interval '1 day'
            END,
            auth.uid()
          );
        END IF;
      END LOOP;
      
      -- Log da automação executada
      INSERT INTO public.automation_logs (
        rule_id,
        lead_id,
        trigger_data,
        actions_executed,
        status
      )
      VALUES (
        v_rule.id,
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'old_priority', OLD.priority,
          'new_priority', NEW.priority
        ),
        v_rule.actions,
        'success'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Criar/atualizar trigger no leads
DROP TRIGGER IF EXISTS trigger_lead_automations ON public.leads;
CREATE TRIGGER trigger_lead_automations
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.process_lead_automations();

-- Inserir regras de automação padrão
INSERT INTO public.automation_rules (name, description, trigger_type, trigger_condition, actions) VALUES
(
  'Lead Qualificado - Criar Tarefa',
  'Quando lead for qualificado, criar tarefa de follow-up',
  'status_change',
  '{"to": "qualificado"}'::jsonb,
  '[
    {
      "type": "create_task",
      "title": "Follow-up com lead qualificado",
      "description": "Entrar em contato para agendar visita",
      "task_type": "call",
      "due_days": "1"
    },
    {
      "type": "notification",
      "title": "Lead Qualificado!",
      "message": "Um novo lead foi qualificado e precisa de follow-up"
    }
  ]'::jsonb
),
(
  'Lead Fechado - Notificar Equipe',
  'Notificar toda equipe quando lead for fechado',
  'status_change',
  '{"to": "fechado"}'::jsonb,
  '[
    {
      "type": "notification",
      "title": "🎉 Lead Fechado!",
      "message": "Parabéns! Um novo cliente foi conquistado"
    },
    {
      "type": "create_task",
      "title": "Preparar contrato",
      "description": "Preparar e enviar contrato para assinatura",
      "task_type": "task",
      "due_days": "1"
    }
  ]'::jsonb
),
(
  'Lead Perdido - Criar Tarefa Reengajamento',
  'Criar tarefa para tentar reengajar lead perdido em 30 dias',
  'status_change',
  '{"to": "perdido"}'::jsonb,
  '[
    {
      "type": "create_task",
      "title": "Tentar reengajar lead",
      "description": "Entrar em contato novamente para verificar interesse",
      "task_type": "call",
      "due_days": "30"
    }
  ]'::jsonb
);

-- Trigger para updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_automated_reminders_updated_at
  BEFORE UPDATE ON public.automated_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();