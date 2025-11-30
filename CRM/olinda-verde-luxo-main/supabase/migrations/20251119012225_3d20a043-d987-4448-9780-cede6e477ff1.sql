-- Fix security warning for generate_proposal_number function
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get current year
  SELECT EXTRACT(YEAR FROM NOW())::TEXT INTO new_number;
  
  -- Count proposals this year
  SELECT COUNT(*) INTO counter
  FROM public.proposals
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: YEAR-XXXX (e.g., 2025-0001)
  new_number := new_number || '-' || LPAD((counter + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;