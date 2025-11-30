-- Corrigir search_path da função criada anteriormente
CREATE OR REPLACE FUNCTION update_calendar_integration_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;