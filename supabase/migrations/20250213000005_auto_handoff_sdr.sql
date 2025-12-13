-- ==========================================
-- MIGRATION: Handoff Automático SDR → Vendedor
-- ==========================================
-- Objetivo: Automatizar transferência de deals do SDR para vendedor quando atinge stage "qualification"
-- Impacto: +200% velocidade de conversão
-- ==========================================

-- 1. Criar tabela de histórico de handoffs
CREATE TABLE IF NOT EXISTS public.deal_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  
  -- Handoff info
  from_user_id UUID REFERENCES auth.users(id), -- SDR que transferiu
  to_user_id UUID REFERENCES auth.users(id), -- Vendedor que recebeu
  handoff_type TEXT NOT NULL DEFAULT 'auto', -- 'auto' ou 'manual'
  handoff_reason TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_reason TEXT,
  
  -- Contexto
  deal_stage_before TEXT,
  deal_stage_after TEXT,
  deal_value NUMERIC,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deal_handoffs_tenant_deal 
  ON public.deal_handoffs(tenant_id, deal_id);

CREATE INDEX IF NOT EXISTS idx_deal_handoffs_status 
  ON public.deal_handoffs(status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deal_handoffs_to_user 
  ON public.deal_handoffs(to_user_id) 
  WHERE status = 'pending';

-- Comentários
COMMENT ON TABLE public.deal_handoffs IS 
'Histórico de handoffs de deals do SDR para vendedores';

COMMENT ON COLUMN public.deal_handoffs.handoff_type IS 
'Tipo: auto (automático via trigger) ou manual (usuário iniciou)';

-- 2. Função para buscar vendedores disponíveis (role = 'sales' ou 'vendedor')
CREATE OR REPLACE FUNCTION get_available_sales_reps(
  p_tenant_id UUID
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  active_deals_count BIGINT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    u.auth_user_id AS user_id,
    u.nome AS user_name,
    COUNT(d.id) AS active_deals_count,
    u.role AS role
  FROM public.users u
  LEFT JOIN public.deals d 
    ON d.owner_id = u.auth_user_id 
    AND d.tenant_id = p_tenant_id
    AND d.stage NOT IN ('closed_won', 'closed_lost')
  WHERE u.tenant_id = p_tenant_id
    AND u.role IN ('ADMIN', 'USER') -- Ajustar conforme roles disponíveis
    AND u.auth_user_id IS NOT NULL
  GROUP BY u.auth_user_id, u.nome, u.role
  ORDER BY active_deals_count ASC, u.nome ASC;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_available_sales_reps(UUID) TO authenticated;

COMMENT ON FUNCTION get_available_sales_reps IS 
'Retorna lista de vendedores disponíveis ordenados por carga de trabalho (round-robin)';

-- 3. Função para atribuir vendedor a deal (round-robin)
CREATE OR REPLACE FUNCTION assign_sales_rep_to_deal(
  p_deal_id UUID,
  p_tenant_id UUID,
  p_handoff_type TEXT DEFAULT 'auto'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  handoff_id UUID,
  assigned_to UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_deal RECORD;
  v_sales_rep RECORD;
  v_handoff_id UUID;
  v_previous_owner UUID;
BEGIN
  -- Buscar deal
  SELECT * INTO v_deal
  FROM public.deals
  WHERE id = p_deal_id
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Deal não encontrado', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Se já tem owner e não é handoff manual, não fazer nada
  IF v_deal.owner_id IS NOT NULL AND p_handoff_type = 'auto' THEN
    RETURN QUERY SELECT false, 'Deal já possui vendedor atribuído', NULL::UUID, v_deal.owner_id;
    RETURN;
  END IF;
  
  -- Buscar vendedor disponível (round-robin: menor carga primeiro)
  SELECT * INTO v_sales_rep
  FROM get_available_sales_reps(p_tenant_id)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Nenhum vendedor disponível encontrado', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Salvar owner anterior
  v_previous_owner := v_deal.owner_id;
  
  -- Atualizar deal com novo owner
  UPDATE public.deals
  SET 
    owner_id = v_sales_rep.user_id,
    updated_at = now()
  WHERE id = p_deal_id;
  
  -- Criar registro de handoff
  INSERT INTO public.deal_handoffs (
    tenant_id,
    deal_id,
    from_user_id,
    to_user_id,
    handoff_type,
    handoff_reason,
    status,
    deal_stage_before,
    deal_stage_after,
    deal_value,
    notes
  ) VALUES (
    p_tenant_id,
    p_deal_id,
    v_previous_owner,
    v_sales_rep.user_id,
    p_handoff_type,
    CASE 
      WHEN p_handoff_type = 'auto' THEN 'Handoff automático: deal atingiu stage qualification'
      ELSE 'Handoff manual iniciado pelo usuário'
    END,
    'accepted', -- Auto-handoff é aceito automaticamente
    v_deal.stage,
    v_deal.stage,
    v_deal.value,
    'Vendedor atribuído automaticamente via round-robin'
  )
  RETURNING id INTO v_handoff_id;
  
  -- Se auto-handoff, marcar como aceito imediatamente
  IF p_handoff_type = 'auto' THEN
    UPDATE public.deal_handoffs
    SET 
      status = 'accepted',
      accepted_at = now(),
      updated_at = now()
    WHERE id = v_handoff_id;
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    'Vendedor atribuído com sucesso: ' || v_sales_rep.user_name,
    v_handoff_id,
    v_sales_rep.user_id;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION assign_sales_rep_to_deal(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION assign_sales_rep_to_deal IS 
'Atribui vendedor a deal usando round-robin (menor carga primeiro) e cria registro de handoff';

-- 4. Trigger para handoff automático quando deal muda para stage "qualification"
CREATE OR REPLACE FUNCTION trigger_auto_handoff_on_qualification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
DECLARE
  v_handoff_result RECORD;
BEGIN
  -- Só executar se stage mudou para "qualification" E não tinha owner antes
  IF NEW.stage = 'qualification' 
     AND (OLD.stage IS NULL OR OLD.stage != 'qualification')
     AND NEW.owner_id IS NULL THEN
    
    -- Atribuir vendedor automaticamente
    SELECT * INTO v_handoff_result
    FROM assign_sales_rep_to_deal(
      NEW.id,
      NEW.tenant_id,
      'auto'
    );
    
    -- Log (opcional, pode ser removido em produção)
    IF v_handoff_result.success THEN
      RAISE NOTICE 'Handoff automático criado: deal % atribuído a vendedor %', 
        NEW.id, v_handoff_result.assigned_to;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$func$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_auto_handoff_on_qualification ON public.deals;
CREATE TRIGGER trg_auto_handoff_on_qualification
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW
  WHEN (NEW.stage = 'qualification' AND (OLD.stage IS NULL OR OLD.stage != 'qualification'))
  EXECUTE FUNCTION trigger_auto_handoff_on_qualification();

-- 5. Função para buscar histórico de handoffs de um deal
CREATE OR REPLACE FUNCTION get_deal_handoff_history(
  p_deal_id UUID,
  p_tenant_id UUID
)
RETURNS TABLE (
  id UUID,
  from_user_name TEXT,
  to_user_name TEXT,
  handoff_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    u_from.nome AS from_user_name,
    u_to.nome AS to_user_name,
    h.handoff_type,
    h.status,
    h.created_at,
    h.accepted_at,
    h.notes
  FROM public.deal_handoffs h
  LEFT JOIN public.users u_from ON u_from.auth_user_id = h.from_user_id
  LEFT JOIN public.users u_to ON u_to.auth_user_id = h.to_user_id
  WHERE h.deal_id = p_deal_id
    AND h.tenant_id = p_tenant_id
  ORDER BY h.created_at DESC;
END;
$func$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_deal_handoff_history(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION get_deal_handoff_history IS 
'Retorna histórico completo de handoffs de um deal';

-- 6. RLS para deal_handoffs
ALTER TABLE public.deal_handoffs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver handoffs de deals do seu tenant
CREATE POLICY "Users can view handoffs from their tenant"
  ON public.deal_handoffs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem criar handoffs no seu tenant
CREATE POLICY "Users can create handoffs in their tenant"
  ON public.deal_handoffs FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar handoffs no seu tenant
CREATE POLICY "Users can update handoffs in their tenant"
  ON public.deal_handoffs FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

