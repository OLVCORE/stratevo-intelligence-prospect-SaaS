-- Corrigir função de automação para não depender de auth.uid()
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
  v_error_message TEXT;
BEGIN
  -- Processar cada regra ativa
  FOR v_rule IN 
    SELECT * FROM public.automation_rules 
    WHERE is_active = true
  LOOP
    BEGIN
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
          BEGIN
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
                COALESCE(NEW.assigned_to, (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1))
              );
            END IF;
          EXCEPTION WHEN OTHERS THEN
            -- Log o erro mas não interrompe o processo
            v_error_message := SQLERRM;
            RAISE WARNING 'Erro ao executar ação de automação: %', v_error_message;
          END;
        END LOOP;
        
        -- Log da automação executada
        INSERT INTO public.automation_logs (
          rule_id,
          lead_id,
          trigger_data,
          actions_executed,
          status,
          error_message
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
          CASE WHEN v_error_message IS NULL THEN 'success' ELSE 'error' END,
          v_error_message
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se houver erro ao processar a regra inteira, log e continua
      INSERT INTO public.automation_logs (
        rule_id,
        lead_id,
        trigger_data,
        actions_executed,
        status,
        error_message
      )
      VALUES (
        v_rule.id,
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status
        ),
        v_rule.actions,
        'error',
        SQLERRM
      );
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$;