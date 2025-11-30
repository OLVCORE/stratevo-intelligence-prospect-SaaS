-- Adicionar campos de qualificação na tabela leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS budget numeric,
ADD COLUMN IF NOT EXISTS timeline text,
ADD COLUMN IF NOT EXISTS decision_maker boolean DEFAULT false;

COMMENT ON COLUMN public.leads.budget IS 'Orçamento disponível do lead';
COMMENT ON COLUMN public.leads.timeline IS 'Prazo de decisão: immediate, 1-3_months, 3-6_months, 6+_months';
COMMENT ON COLUMN public.leads.decision_maker IS 'Se o contato é o tomador de decisão';

-- Atualizar função de cálculo de lead score para considerar novos campos
CREATE OR REPLACE FUNCTION public.calculate_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- NEW: Budget defined: +15
  IF NEW.budget IS NOT NULL AND NEW.budget > 0 THEN
    score := score + 15;
  END IF;

  -- NEW: Timeline urgency bonus
  IF NEW.timeline = 'immediate' THEN
    score := score + 20;
  ELSIF NEW.timeline = '1-3_months' THEN
    score := score + 15;
  ELSIF NEW.timeline = '3-6_months' THEN
    score := score + 10;
  END IF;

  -- NEW: Decision maker: +20
  IF NEW.decision_maker = true THEN
    score := score + 20;
  END IF;

  NEW.lead_score := score;
  RETURN NEW;
END;
$function$;