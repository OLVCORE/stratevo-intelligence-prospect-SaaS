-- ============================================================================
-- MIGRATION: CRM + SDR Integration - Handoff Automático
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Integração fluida entre SDR e CRM com handoff automático
-- ============================================================================

-- ============================================
-- FUNÇÃO: HANDOFF_TO_CRM
-- ============================================================================
-- Quando deal avança para 'qualified', automaticamente:
-- 1. Cria registro no CRM (tabela deals)
-- 2. Preserva histórico do SDR
-- 3. Notifica equipe CRM
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handoff_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tenant_id UUID;
  v_crm_deal_id UUID;
BEGIN
  -- Verificar se deal foi qualificado
  IF NEW.deal_stage = 'qualified' AND (OLD.deal_stage IS NULL OR OLD.deal_stage != 'qualified') THEN
    
    -- Buscar tenant_id da company
    SELECT tenant_id INTO v_tenant_id
    FROM public.companies
    WHERE id = NEW.company_id
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
      -- Se não tiver tenant_id, tentar buscar de outra forma
      -- Por enquanto, apenas logar
      RAISE NOTICE 'Tenant não encontrado para company_id: %', NEW.company_id;
      RETURN NEW;
    END IF;

    -- Criar deal no CRM (tabela deals)
    INSERT INTO public.deals (
      tenant_id,
      company_id,
      contact_id,
      title,
      description,
      value,
      stage,
      probability,
      priority,
      assigned_to,
      source,
      status,
      expected_close_date,
      business_data,
      created_at,
      updated_at
    )
    VALUES (
      v_tenant_id,
      NEW.company_id,
      NEW.contact_id,
      COALESCE(NEW.deal_title, NEW.title, 'Deal Qualificado'),
      NEW.description,
      COALESCE(NEW.deal_value, NEW.value, 0),
      'proposta', -- Primeiro estágio do CRM
      NEW.probability,
      NEW.priority,
      NEW.assigned_sdr, -- Manter responsável inicialmente
      COALESCE(NEW.source, 'sdr_handoff'),
      'open',
      NEW.expected_close_date,
      jsonb_build_object(
        'sdr_deal_id', NEW.id,
        'sdr_stage', NEW.deal_stage,
        'handoff_date', now(),
        'sdr_history', jsonb_build_object(
          'created_at', NEW.created_at,
          'last_activity', NEW.last_activity_at,
          'source', NEW.source
        )
      ),
      now(),
      now()
    )
    RETURNING id INTO v_crm_deal_id;

    -- Atualizar sdr_deal com referência ao CRM
    UPDATE public.sdr_deals
    SET 
      business_data = COALESCE(business_data, '{}'::jsonb) || jsonb_build_object('crm_deal_id', v_crm_deal_id),
      updated_at = now()
    WHERE id = NEW.id;

    -- Criar atividade no CRM registrando handoff
    INSERT INTO public.activities (
      tenant_id,
      deal_id,
      type,
      subject,
      description,
      created_by
    )
    VALUES (
      v_tenant_id,
      v_crm_deal_id,
      'note',
      'Handoff do SDR',
      format('Deal qualificado pelo SDR e transferido para CRM. Deal SDR: %s', NEW.id),
      NEW.assigned_sdr
    );

    RAISE NOTICE 'Deal % handoff para CRM: %', NEW.id, v_crm_deal_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: AUTO_HANDOFF_TO_CRM
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_auto_handoff_to_crm' 
    AND tgrelid = 'public.sdr_deals'::regclass
  ) THEN
    CREATE TRIGGER trigger_auto_handoff_to_crm
    AFTER UPDATE OF deal_stage ON public.sdr_deals
    FOR EACH ROW
    WHEN (NEW.deal_stage = 'qualified' AND (OLD.deal_stage IS NULL OR OLD.deal_stage != 'qualified'))
    EXECUTE FUNCTION public.handoff_to_crm();
  END IF;
END $$;

-- ============================================
-- VIEW: DEALS_UNIFICADOS (SDR + CRM)
-- ============================================================================
-- View que une deals do SDR e CRM para visibilidade completa
-- ============================================================================

CREATE OR REPLACE VIEW public.unified_deals AS
SELECT 
  'sdr' as source,
  sd.id,
  sd.company_id,
  sd.contact_id,
  COALESCE(sd.deal_title, sd.title) as title,
  sd.description,
  COALESCE(sd.deal_value, sd.value) as value,
  sd.deal_stage as stage,
  sd.probability,
  sd.priority,
  sd.assigned_sdr as assigned_to,
  sd.source,
  sd.status,
  sd.expected_close_date,
  sd.created_at,
  sd.updated_at,
  sd.business_data->>'crm_deal_id' as crm_deal_id,
  c.tenant_id
FROM public.sdr_deals sd
LEFT JOIN public.companies c ON c.id = sd.company_id
WHERE sd.deal_stage IN ('discovery', 'contact', 'qualified')

UNION ALL

SELECT 
  'crm' as source,
  cd.id,
  cd.company_id,
  cd.contact_id,
  cd.title,
  cd.description,
  cd.value,
  cd.stage,
  cd.probability,
  cd.priority,
  cd.assigned_to,
  cd.source,
  cd.status,
  cd.expected_close_date,
  cd.created_at,
  cd.updated_at,
  NULL as crm_deal_id,
  cd.tenant_id
FROM public.deals cd
WHERE cd.stage IN ('proposta', 'negociacao', 'ganho', 'perdido');

-- ============================================
-- FUNÇÃO: GET_DEAL_HISTORY (Histórico Completo)
-- ============================================================================
-- Retorna histórico completo de um deal (SDR + CRM)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_deal_history(p_deal_id UUID, p_source TEXT DEFAULT 'crm')
RETURNS TABLE (
  id UUID,
  source TEXT,
  stage TEXT,
  activity_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_sdr_deal_id UUID;
  v_crm_deal_id UUID;
BEGIN
  -- Se for CRM deal, buscar SDR deal relacionado
  IF p_source = 'crm' THEN
    SELECT business_data->>'sdr_deal_id' INTO v_sdr_deal_id
    FROM public.deals
    WHERE id = p_deal_id;
    
    v_crm_deal_id := p_deal_id;
  ELSE
    -- Se for SDR deal, buscar CRM deal relacionado
    SELECT business_data->>'crm_deal_id' INTO v_crm_deal_id
    FROM public.sdr_deals
    WHERE id = p_deal_id;
    
    v_sdr_deal_id := p_deal_id;
  END IF;

  -- Retornar atividades do SDR
  IF v_sdr_deal_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      sa.id,
      'sdr'::TEXT,
      sd.deal_stage,
      sa.activity_type,
      sa.description,
      sa.created_at,
      sa.user_id
    FROM public.sdr_deal_activities sa
    JOIN public.sdr_deals sd ON sd.id = sa.deal_id
    WHERE sa.deal_id = v_sdr_deal_id
    ORDER BY sa.created_at ASC;
  END IF;

  -- Retornar atividades do CRM
  IF v_crm_deal_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      a.id,
      'crm'::TEXT,
      d.stage,
      a.type,
      a.description,
      a.created_at,
      a.created_by
    FROM public.activities a
    JOIN public.deals d ON d.id = a.deal_id
    WHERE a.deal_id = v_crm_deal_id
    ORDER BY a.created_at ASC;
  END IF;
END;
$$;

-- ============================================
-- RLS PARA VIEW
-- ============================================================================
ALTER VIEW public.unified_deals OWNER TO postgres;

-- Comentários
COMMENT ON FUNCTION public.handoff_to_crm() IS 'Handoff automático de deals qualificados do SDR para CRM';
COMMENT ON FUNCTION public.get_deal_history(UUID, TEXT) IS 'Retorna histórico completo de um deal (SDR + CRM)';
COMMENT ON VIEW public.unified_deals IS 'View unificada de deals do SDR e CRM para visibilidade completa';

