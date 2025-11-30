-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Gerencia/Direcao podem ver leads ativos" ON public.leads;
DROP POLICY IF EXISTS "SDR/Vendedor podem criar leads" ON public.leads;
DROP POLICY IF EXISTS "SDR/Vendedor podem ver leads ativos" ON public.leads;
DROP POLICY IF EXISTS "Gestor pode ver leads ativos" ON public.leads;
DROP POLICY IF EXISTS "Vendedor pode atualizar seus leads" ON public.leads;

-- Políticas para Direção e Gerência (acesso total como Admin/Sales)
CREATE POLICY "Gerencia/Direcao podem ver leads ativos" 
ON public.leads 
FOR SELECT 
USING (
  (has_role(auth.uid(), 'gerencia') OR has_role(auth.uid(), 'direcao')) 
  AND deleted_at IS NULL
);

CREATE POLICY "Gerencia/Direcao podem atualizar leads" 
ON public.leads 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'gerencia') OR has_role(auth.uid(), 'direcao')) 
  AND deleted_at IS NULL
);

-- Políticas para Gestor (visualização e gerenciamento)
CREATE POLICY "Gestor pode ver leads ativos" 
ON public.leads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'gestor') 
  AND deleted_at IS NULL
);

CREATE POLICY "Gestor pode atualizar leads" 
ON public.leads 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'gestor') 
  AND deleted_at IS NULL
);

-- Políticas para SDR e Vendedor (criação e visualização própria)
CREATE POLICY "SDR/Vendedor podem criar leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'sdr') OR 
  has_role(auth.uid(), 'vendedor')
);

CREATE POLICY "SDR/Vendedor podem ver leads ativos" 
ON public.leads 
FOR SELECT 
USING (
  (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'vendedor')) 
  AND deleted_at IS NULL
);

CREATE POLICY "Vendedor pode atualizar leads" 
ON public.leads 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'sdr') OR has_role(auth.uid(), 'vendedor')) 
  AND deleted_at IS NULL
);