-- Ajustar RLS para permitir que qualquer usuário autenticado crie leads
DROP POLICY IF EXISTS "Admins/Sales podem criar leads" ON public.leads;

CREATE POLICY "Usuarios autenticados podem criar leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);