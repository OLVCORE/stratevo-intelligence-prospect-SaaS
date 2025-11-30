-- Corrigir as últimas funções sem search_path

DROP FUNCTION IF EXISTS public.create_event_block_on_confirm() CASCADE;
CREATE OR REPLACE FUNCTION public.create_event_block_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_blocks (date, reason, block_type, is_full_day)
  VALUES (NEW.event_date, 'Evento: ' || NEW.event_type, 'evento', true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_event_block_on_confirm_trigger
  AFTER INSERT OR UPDATE ON public.confirmed_events
  FOR EACH ROW
  WHEN (NEW.status = 'confirmado')
  EXECUTE FUNCTION public.create_event_block_on_confirm();

DROP FUNCTION IF EXISTS public.notify_admins_new_lead() CASCADE;
CREATE OR REPLACE FUNCTION public.notify_admins_new_lead()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER notify_admins_new_lead_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_lead();