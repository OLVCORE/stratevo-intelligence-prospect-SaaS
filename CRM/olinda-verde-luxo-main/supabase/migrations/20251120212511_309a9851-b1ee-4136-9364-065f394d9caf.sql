-- Criar tabela de configuração de distribuição
CREATE TABLE IF NOT EXISTS public.lead_distribution_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  distribution_method text DEFAULT 'round_robin', -- round_robin, manual, load_balanced
  eligible_roles text[] DEFAULT ARRAY['vendedor', 'sales']::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS para config
ALTER TABLE public.lead_distribution_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver config de distribuição"
ON public.lead_distribution_config FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem criar config de distribuição"
ON public.lead_distribution_config FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar config de distribuição"
ON public.lead_distribution_config FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Inserir configuração padrão
INSERT INTO public.lead_distribution_config (is_active, distribution_method, eligible_roles)
VALUES (false, 'round_robin', ARRAY['vendedor', 'sales']::text[])
ON CONFLICT DO NOTHING;

-- Função para obter próximo vendedor (round-robin)
CREATE OR REPLACE FUNCTION public.get_next_sales_rep()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_user_id uuid;
  v_eligible_users uuid[];
  v_last_assigned_index int;
  v_lead_counts jsonb;
BEGIN
  -- Verificar se distribuição automática está ativa
  SELECT * INTO v_config
  FROM public.lead_distribution_config
  WHERE is_active = true
  LIMIT 1;
  
  IF NOT FOUND OR v_config.is_active = false THEN
    RETURN NULL;
  END IF;
  
  -- Obter usuários elegíveis com base nas roles
  SELECT array_agg(DISTINCT ur.user_id ORDER BY ur.user_id)
  INTO v_eligible_users
  FROM public.user_roles ur
  WHERE ur.role = ANY(v_config.eligible_roles::app_role[]);
  
  IF v_eligible_users IS NULL OR array_length(v_eligible_users, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Round-robin: encontrar quem tem menos leads atribuídos
  IF v_config.distribution_method = 'round_robin' THEN
    SELECT user_id INTO v_user_id
    FROM (
      SELECT 
        u.user_id,
        COUNT(l.id) as lead_count
      FROM unnest(v_eligible_users) AS u(user_id)
      LEFT JOIN public.leads l ON l.assigned_to = u.user_id AND l.deleted_at IS NULL
      GROUP BY u.user_id
      ORDER BY lead_count ASC, u.user_id ASC
      LIMIT 1
    ) subq;
  ELSE
    -- Fallback para round-robin se método não reconhecido
    SELECT user_id INTO v_user_id
    FROM unnest(v_eligible_users) AS u(user_id)
    LIMIT 1;
  END IF;
  
  RETURN v_user_id;
END;
$$;

-- Trigger para atribuição automática de leads
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assigned_to uuid;
BEGIN
  -- Apenas auto-assign se não foi manualmente atribuído
  IF NEW.assigned_to IS NULL THEN
    SELECT public.get_next_sales_rep() INTO v_assigned_to;
    
    IF v_assigned_to IS NOT NULL THEN
      NEW.assigned_to := v_assigned_to;
      
      -- Criar notificação para o vendedor
      INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
      VALUES (
        v_assigned_to,
        'Novo Lead Atribuído',
        'Lead de ' || NEW.name || ' foi atribuído para você',
        'lead_assigned',
        'leads',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger (DROP se existir)
DROP TRIGGER IF EXISTS trigger_auto_assign_lead ON public.leads;

CREATE TRIGGER trigger_auto_assign_lead
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_lead();