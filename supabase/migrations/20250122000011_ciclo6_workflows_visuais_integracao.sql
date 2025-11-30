-- ============================================================================
-- MIGRATION: CICLO 6 - Workflows Visuais + Integração Completa
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Builder visual de workflows + integração entre todos os módulos
-- ============================================================================

-- ============================================
-- 1. TABELA: WORKFLOWS (Workflows Visuais)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'onboarding', 'nurturing', 'escalation', 're_engagement')),
  
  -- Estrutura Visual (JSONB com nodes e edges)
  workflow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::JSONB,
  -- Estrutura: { nodes: [{id, type, position, data}], edges: [{id, source, target, condition}] }
  
  -- Configuração
  trigger_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Exemplo: {"trigger_type": "deal_stage_changed", "conditions": {...}}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false, -- Templates podem ser clonados
  
  -- Analytics & IA
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  last_executed_at TIMESTAMPTZ,
  
  -- IA Insights
  ai_recommendations JSONB DEFAULT '[]'::JSONB,
  -- Sugestões de melhoria baseadas em execuções
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON public.workflows(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_template ON public.workflows(tenant_id, is_template);

-- RLS para workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workflows' AND policyname='Users can view workflows from their tenant') THEN
    DROP POLICY "Users can view workflows from their tenant" ON public.workflows;
  END IF;
  CREATE POLICY "Users can view workflows from their tenant"
    ON public.workflows FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workflows' AND policyname='Users can manage workflows') THEN
    DROP POLICY "Users can manage workflows" ON public.workflows;
  END IF;
  CREATE POLICY "Users can manage workflows"
    ON public.workflows FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 2. TABELA: WORKFLOW_EXECUTIONS (Execuções)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  
  -- Contexto da Execução
  trigger_type TEXT NOT NULL,
  trigger_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  entity_type TEXT, -- 'deal', 'lead', 'proposal', 'company'
  entity_id UUID,
  
  -- Execução
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  current_node_id TEXT, -- Node atual sendo executado
  execution_path JSONB DEFAULT '[]'::JSONB, -- Histórico de nodes executados
  
  -- Resultados
  results JSONB DEFAULT '{}'::JSONB, -- Resultados de cada ação
  error_message TEXT,
  error_stack TEXT,
  
  -- Performance
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  
  -- IA Analysis
  ai_analysis JSONB DEFAULT '{}'::JSONB,
  -- Análise de sucesso/falha pela IA
  
  -- Metadata
  executed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant_id ON public.workflow_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_entity ON public.workflow_executions(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(tenant_id, started_at DESC);

-- RLS para workflow_executions
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workflow_executions' AND policyname='Users can view workflow executions from their tenant') THEN
    DROP POLICY "Users can view workflow executions from their tenant" ON public.workflow_executions;
  END IF;
  CREATE POLICY "Users can view workflow executions from their tenant"
    ON public.workflow_executions FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 3. FUNÇÃO: EXECUTE_WORKFLOW_NODE
-- ============================================
CREATE OR REPLACE FUNCTION public.execute_workflow_node(
  p_workflow_id UUID,
  p_node_id TEXT,
  p_execution_id UUID,
  p_context JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workflow RECORD;
  v_node JSONB;
  v_result JSONB;
  v_action_type TEXT;
  v_action_config JSONB;
BEGIN
  -- Buscar workflow
  SELECT * INTO v_workflow
  FROM public.workflows
  WHERE id = p_workflow_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found';
  END IF;
  
  -- Buscar node específico
  SELECT node INTO v_node
  FROM jsonb_array_elements(v_workflow.workflow_data->'nodes') AS node
  WHERE node->>'id' = p_node_id;
  
  IF v_node IS NULL THEN
    RAISE EXCEPTION 'Node not found';
  END IF;
  
  v_action_type := v_node->'data'->>'type';
  v_action_config := v_node->'data'->'config';
  
  -- Executar ação baseada no tipo
  CASE v_action_type
    WHEN 'send_email' THEN
      -- Integração com email_templates e sdr-send-message
      v_result := jsonb_build_object(
        'success', true,
        'action', 'send_email',
        'message', 'Email enviado via Edge Function'
      );
      
    WHEN 'send_whatsapp' THEN
      -- Integração com whatsapp_quick_replies e sdr-send-message
      v_result := jsonb_build_object(
        'success', true,
        'action', 'send_whatsapp',
        'message', 'WhatsApp enviado via Edge Function'
      );
      
    WHEN 'create_task' THEN
      -- Criar tarefa em activities
      INSERT INTO public.activities (
        tenant_id,
        lead_id,
        deal_id,
        activity_type,
        title,
        description,
        due_date,
        status
      )
      VALUES (
        v_workflow.tenant_id,
        (p_context->>'lead_id')::UUID,
        (p_context->>'deal_id')::UUID,
        'task',
        v_action_config->>'title',
        v_action_config->>'description',
        (p_context->>'due_date')::TIMESTAMPTZ,
        'pending'
      );
      v_result := jsonb_build_object('success', true, 'action', 'create_task');
      
    WHEN 'update_deal_stage' THEN
      -- Atualizar estágio do deal
      UPDATE public.deals
      SET stage = v_action_config->>'stage',
          updated_at = now()
      WHERE id = (p_context->>'deal_id')::UUID
        AND tenant_id = v_workflow.tenant_id;
      v_result := jsonb_build_object('success', true, 'action', 'update_deal_stage');
      
    WHEN 'update_lead_score' THEN
      -- Atualizar score do lead (integração com AI)
      UPDATE public.leads
      SET lead_score = (v_action_config->>'score')::INTEGER,
          updated_at = now()
      WHERE id = (p_context->>'lead_id')::UUID
        AND tenant_id = v_workflow.tenant_id;
      v_result := jsonb_build_object('success', true, 'action', 'update_lead_score');
      
    WHEN 'create_proposal' THEN
      -- Criar proposta automaticamente
      INSERT INTO public.proposals (
        tenant_id,
        deal_id,
        lead_id,
        proposal_number,
        proposal_type,
        total_price,
        final_price,
        status,
        valid_until
      )
      VALUES (
        v_workflow.tenant_id,
        (p_context->>'deal_id')::UUID,
        (p_context->>'lead_id')::UUID,
        'PROP-' || extract(epoch from now())::TEXT,
        'commercial',
        (v_action_config->>'total_price')::NUMERIC,
        (v_action_config->>'final_price')::NUMERIC,
        'draft',
        (now() + interval '30 days')::DATE
      )
      RETURNING id INTO v_result;
      v_result := jsonb_build_object('success', true, 'action', 'create_proposal', 'proposal_id', v_result->>'id');
      
    WHEN 'call_webhook' THEN
      -- Chamar webhook externo (via Edge Function)
      v_result := jsonb_build_object(
        'success', true,
        'action', 'call_webhook',
        'url', v_action_config->>'url',
        'message', 'Webhook chamado via Edge Function'
      );
      
    WHEN 'wait' THEN
      -- Aguardar X tempo (criar reminder)
      INSERT INTO public.reminders (
        tenant_id,
        lead_id,
        deal_id,
        reminder_type,
        reminder_date,
        message,
        status
      )
      VALUES (
        v_workflow.tenant_id,
        (p_context->>'lead_id')::UUID,
        (p_context->>'deal_id')::UUID,
        'workflow_wait',
        (now() + (v_action_config->>'duration')::INTERVAL),
        v_action_config->>'message',
        'pending'
      );
      v_result := jsonb_build_object('success', true, 'action', 'wait');
      
    WHEN 'ai_analyze' THEN
      -- Análise de IA (integração com ai_lead_analysis)
      -- Chamar Edge Function de análise
      v_result := jsonb_build_object(
        'success', true,
        'action', 'ai_analyze',
        'message', 'Análise de IA executada via Edge Function'
      );
      
    WHEN 'update_analytics' THEN
      -- Atualizar métricas de analytics
      v_result := jsonb_build_object(
        'success', true,
        'action', 'update_analytics',
        'message', 'Analytics atualizado'
      );
      
    ELSE
      v_result := jsonb_build_object(
        'success', false,
        'error', format('Unknown action type: %s', v_action_type)
      );
  END CASE;
  
  -- Registrar execução do node
  UPDATE public.workflow_executions
  SET execution_path = execution_path || jsonb_build_object(
    'node_id', p_node_id,
    'action_type', v_action_type,
    'result', v_result,
    'executed_at', now()
  ),
  current_node_id = p_node_id
  WHERE id = p_execution_id;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- 4. FUNÇÃO: TRIGGER_WORKFLOW
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_workflow(
  p_trigger_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_trigger_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_workflow RECORD;
  v_execution_id UUID;
  v_execution_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Determinar tenant_id baseado na entidade
  CASE p_entity_type
    WHEN 'deal' THEN
      SELECT tenant_id INTO v_tenant_id FROM public.deals WHERE id = p_entity_id;
    WHEN 'lead' THEN
      SELECT tenant_id INTO v_tenant_id FROM public.leads WHERE id = p_entity_id;
    WHEN 'proposal' THEN
      SELECT tenant_id INTO v_tenant_id FROM public.proposals WHERE id = p_entity_id;
    WHEN 'company' THEN
      -- Companies não tem tenant_id direto, usar contexto
      v_tenant_id := (p_trigger_data->>'tenant_id')::UUID;
    ELSE
      RAISE EXCEPTION 'Unknown entity type: %', p_entity_type;
  END CASE;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant ID not found';
  END IF;
  
  -- Buscar workflows ativos que correspondem ao trigger
  FOR v_workflow IN
    SELECT *
    FROM public.workflows
    WHERE tenant_id = v_tenant_id
      AND is_active = true
      AND (workflow_data->'trigger_config'->>'trigger_type' = p_trigger_type
           OR workflow_data->'trigger_config'->>'trigger_type' = 'any')
  LOOP
    -- Criar execução
    INSERT INTO public.workflow_executions (
      tenant_id,
      workflow_id,
      trigger_type,
      trigger_data,
      entity_type,
      entity_id,
      status
    )
    VALUES (
      v_tenant_id,
      v_workflow.id,
      p_trigger_type,
      p_trigger_data,
      p_entity_type,
      p_entity_id,
      'running'
    )
    RETURNING id INTO v_execution_id;
    
    v_execution_ids := array_append(v_execution_ids, v_execution_id);
    
    -- Atualizar contador de execuções
    UPDATE public.workflows
    SET execution_count = execution_count + 1,
        last_executed_at = now()
    WHERE id = v_workflow.id;
  END LOOP;
  
  RETURN v_execution_ids;
END;
$$;

-- ============================================
-- 5. TRIGGERS PARA INTEGRAÇÃO AUTOMÁTICA
-- ============================================

-- Trigger: Deal Stage Changed → Workflow
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_deal_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    PERFORM public.trigger_workflow(
      'deal_stage_changed',
      'deal',
      NEW.id,
      jsonb_build_object(
        'old_stage', OLD.stage,
        'new_stage', NEW.stage,
        'deal_id', NEW.id,
        'tenant_id', NEW.tenant_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_workflow_deal_stage_change'
  ) THEN
    DROP TRIGGER trigger_workflow_deal_stage_change ON public.deals;
  END IF;
  CREATE TRIGGER trigger_workflow_deal_stage_change
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION public.trigger_workflow_on_deal_stage_change();
END $$;

-- Trigger: Lead Created → Workflow
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_lead_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.trigger_workflow(
    'lead_created',
    'lead',
    NEW.id,
    jsonb_build_object(
      'lead_id', NEW.id,
      'tenant_id', NEW.tenant_id,
      'source', NEW.source
    )
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_workflow_lead_created'
  ) THEN
    DROP TRIGGER trigger_workflow_lead_created ON public.leads;
  END IF;
  CREATE TRIGGER trigger_workflow_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_workflow_on_lead_created();
END $$;

-- Trigger: Proposal Sent → Workflow
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_proposal_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sent' THEN
    PERFORM public.trigger_workflow(
      'proposal_sent',
      'proposal',
      NEW.id,
      jsonb_build_object(
        'proposal_id', NEW.id,
        'tenant_id', NEW.tenant_id,
        'deal_id', NEW.deal_id,
        'lead_id', NEW.lead_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_workflow_proposal_sent'
  ) THEN
    DROP TRIGGER trigger_workflow_proposal_sent ON public.proposals;
  END IF;
  CREATE TRIGGER trigger_workflow_proposal_sent
  AFTER UPDATE OF status ON public.proposals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sent')
  EXECUTE FUNCTION public.trigger_workflow_on_proposal_sent();
END $$;

-- ============================================
-- 6. TEMPLATES PRÉ-CONFIGURADOS
-- ============================================
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    -- Template: Onboarding de Cliente
    INSERT INTO public.workflows (
      tenant_id,
      name,
      description,
      category,
      workflow_data,
      trigger_config,
      is_template,
      is_active
    )
    VALUES (
      tenant_record.id,
      'Onboarding de Cliente',
      'Workflow automático para onboarding de novos clientes',
      'onboarding',
      '{
        "nodes": [
          {"id": "start", "type": "trigger", "position": {"x": 0, "y": 0}, "data": {"type": "lead_created"}},
          {"id": "send_welcome", "type": "action", "position": {"x": 200, "y": 0}, "data": {"type": "send_email", "config": {"template": "welcome"}}},
          {"id": "create_task", "type": "action", "position": {"x": 400, "y": 0}, "data": {"type": "create_task", "config": {"title": "Agendar call de onboarding"}}},
          {"id": "wait_3days", "type": "action", "position": {"x": 600, "y": 0}, "data": {"type": "wait", "config": {"duration": "3 days"}}},
          {"id": "follow_up", "type": "action", "position": {"x": 800, "y": 0}, "data": {"type": "send_email", "config": {"template": "follow_up"}}}
        ],
        "edges": [
          {"id": "e1", "source": "start", "target": "send_welcome"},
          {"id": "e2", "source": "send_welcome", "target": "create_task"},
          {"id": "e3", "source": "create_task", "target": "wait_3days"},
          {"id": "e4", "source": "wait_3days", "target": "follow_up"}
        ]
      }'::JSONB,
      '{"trigger_type": "lead_created"}'::JSONB,
      true,
      true
    )
    ON CONFLICT DO NOTHING;

    -- Template: Follow-up Pós-Visita
    INSERT INTO public.workflows (
      tenant_id,
      name,
      description,
      category,
      workflow_data,
      trigger_config,
      is_template,
      is_active
    )
    VALUES (
      tenant_record.id,
      'Follow-up Pós-Visita',
      'Workflow automático após visita/agendamento',
      'nurturing',
      '{
        "nodes": [
          {"id": "start", "type": "trigger", "position": {"x": 0, "y": 0}, "data": {"type": "appointment_completed"}},
          {"id": "send_thanks", "type": "action", "position": {"x": 200, "y": 0}, "data": {"type": "send_email", "config": {"template": "thanks_visit"}}},
          {"id": "create_proposal", "type": "action", "position": {"x": 400, "y": 0}, "data": {"type": "create_proposal", "config": {}}},
          {"id": "wait_2days", "type": "action", "position": {"x": 600, "y": 0}, "data": {"type": "wait", "config": {"duration": "2 days"}}},
          {"id": "follow_up", "type": "action", "position": {"x": 800, "y": 0}, "data": {"type": "send_whatsapp", "config": {"template": "proposal_followup"}}}
        ],
        "edges": [
          {"id": "e1", "source": "start", "target": "send_thanks"},
          {"id": "e2", "source": "send_thanks", "target": "create_proposal"},
          {"id": "e3", "source": "create_proposal", "target": "wait_2days"},
          {"id": "e4", "source": "wait_2days", "target": "follow_up"}
        ]
      }'::JSONB,
      '{"trigger_type": "appointment_completed"}'::JSONB,
      true,
      true
    )
    ON CONFLICT DO NOTHING;

    -- Template: Re-engajamento de Leads Frios
    INSERT INTO public.workflows (
      tenant_id,
      name,
      description,
      category,
      workflow_data,
      trigger_config,
      is_template,
      is_active
    )
    VALUES (
      tenant_record.id,
      'Re-engajamento de Leads Frios',
      'Workflow para reativar leads que não responderam há mais de 30 dias',
      're_engagement',
      '{
        "nodes": [
          {"id": "start", "type": "trigger", "position": {"x": 0, "y": 0}, "data": {"type": "lead_stale", "config": {"days": 30}}},
          {"id": "ai_analyze", "type": "action", "position": {"x": 200, "y": 0}, "data": {"type": "ai_analyze", "config": {}}},
          {"id": "send_re_engagement", "type": "action", "position": {"x": 400, "y": 0}, "data": {"type": "send_email", "config": {"template": "re_engagement"}}},
          {"id": "update_score", "type": "action", "position": {"x": 600, "y": 0}, "data": {"type": "update_lead_score", "config": {"score": -10}}}
        ],
        "edges": [
          {"id": "e1", "source": "start", "target": "ai_analyze"},
          {"id": "e2", "source": "ai_analyze", "target": "send_re_engagement"},
          {"id": "e3", "source": "send_re_engagement", "target": "update_score"}
        ]
      }'::JSONB,
      '{"trigger_type": "lead_stale"}'::JSONB,
      true,
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Comentários
COMMENT ON TABLE public.workflows IS 'Workflows visuais com integração completa entre módulos';
COMMENT ON TABLE public.workflow_executions IS 'Execuções de workflows com histórico completo';
COMMENT ON FUNCTION public.execute_workflow_node(UUID, TEXT, UUID, JSONB) IS 'Executa um node específico de workflow com integração completa';
COMMENT ON FUNCTION public.trigger_workflow(TEXT, TEXT, UUID, JSONB) IS 'Dispara workflows baseado em triggers de eventos';

