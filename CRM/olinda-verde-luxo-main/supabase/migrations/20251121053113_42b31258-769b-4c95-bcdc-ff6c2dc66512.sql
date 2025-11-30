-- Adicionar coluna para armazenar role quando meta é atribuída por função
ALTER TABLE public.goals
ADD COLUMN role_filter text;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.goals.role_filter IS 'Quando goal_type=individual e atribuído por role, armazena o nome da role (vendedor, sdr, etc)';

-- Policy para vendedores/SDRs verem metas atribuídas à sua role
CREATE POLICY "Vendedores/SDRs podem ver suas metas por role"
ON public.goals
FOR SELECT
USING (
  role_filter IN (
    SELECT role::text 
    FROM user_roles 
    WHERE user_id = auth.uid()
  )
);