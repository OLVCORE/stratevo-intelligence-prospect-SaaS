
-- Remove TODOS os triggers relacionados
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
DROP TRIGGER IF EXISTS trigger_notify_new_lead ON public.leads;

-- Agora pode remover a função com CASCADE
DROP FUNCTION IF EXISTS public.notify_new_lead() CASCADE;

-- Cria trigger correto usando apenas a função de notificação de admins
CREATE TRIGGER trigger_notify_admins_on_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_lead();
