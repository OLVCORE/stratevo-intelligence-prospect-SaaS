-- Fix the blocking SELECT policy on leads table
-- This allows authenticated users to view leads instead of blocking everyone

DROP POLICY IF EXISTS "Apenas autenticados podem ver leads" ON public.leads;

CREATE POLICY "Authenticated users can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);