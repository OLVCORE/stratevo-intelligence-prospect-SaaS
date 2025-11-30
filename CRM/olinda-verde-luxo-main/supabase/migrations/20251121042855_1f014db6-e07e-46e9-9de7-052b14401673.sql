-- Atualizar RLS policy para proposal_versions permitir updates de serviço
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view proposal versions" ON public.proposal_versions;
DROP POLICY IF EXISTS "Users can create proposal versions" ON public.proposal_versions;

CREATE POLICY "Users can view proposal versions"
  ON public.proposal_versions FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'sales'::app_role) OR
      has_role(auth.uid(), 'gerencia'::app_role) OR
      has_role(auth.uid(), 'direcao'::app_role)
    )
  );

CREATE POLICY "Users can create proposal versions"
  ON public.proposal_versions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'sales'::app_role)
    )
  );

-- Permitir que trigger de sistema crie versões
CREATE POLICY "System can create versions"
  ON public.proposal_versions FOR INSERT
  WITH CHECK (true);