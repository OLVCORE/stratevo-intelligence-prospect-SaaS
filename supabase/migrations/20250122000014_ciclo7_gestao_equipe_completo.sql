-- ============================================================================
-- CICLO 7: GESTÃO DE EQUIPE AVANÇADA - COMPLETO
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Metas, KPIs, Gamificação e Coaching completo
-- ============================================================================

-- ============================================
-- 1. TABELA DE METAS (GOALS) - Multi-tenant
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goals') THEN
    CREATE TABLE public.goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Tipo de meta
      goal_type TEXT NOT NULL CHECK (goal_type IN ('individual', 'team', 'company')),
      metric TEXT NOT NULL CHECK (metric IN ('leads_converted', 'revenue', 'proposals_sent', 'calls_made', 'meetings_scheduled', 'deals_won', 'custom')),
      
      -- Período
      period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      
      -- Valores
      target_value NUMERIC(15,2) NOT NULL DEFAULT 0,
      current_value NUMERIC(15,2) NOT NULL DEFAULT 0,
      
      -- Atribuição
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      role_filter TEXT[], -- Para metas por role (ex: ['vendedor', 'gerente'])
      team_id UUID, -- Para metas de equipe específica
      
      -- Status
      status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived', 'cancelled')),
      progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
      
      -- Metadata
      title TEXT,
      description TEXT,
      notes TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_goals_tenant_id ON public.goals(tenant_id);
    CREATE INDEX idx_goals_user_id ON public.goals(user_id);
    CREATE INDEX idx_goals_status ON public.goals(status);
    CREATE INDEX idx_goals_period ON public.goals(period_start, period_end);
    CREATE INDEX idx_goals_metric ON public.goals(metric);
    
    ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view goals from their tenant"
      ON public.goals FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can create goals in their tenant"
      ON public.goals FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can update goals in their tenant"
      ON public.goals FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can delete goals in their tenant"
      ON public.goals FOR DELETE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 2. TABELA DE ATIVIDADES DE PONTOS (POINT ACTIVITIES)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'point_activities') THEN
    CREATE TABLE public.point_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Tipo de atividade
      activity_type TEXT NOT NULL CHECK (activity_type IN (
        'lead_converted', 'proposal_sent', 'meeting_scheduled', 'task_completed',
        'deal_won', 'call_made', 'email_sent', 'whatsapp_sent', 'custom'
      )),
      
      -- Pontos
      points INTEGER NOT NULL DEFAULT 0,
      
      -- Relacionamentos
      lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
      deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
      activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
      
      -- Metadata
      description TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_point_activities_tenant_id ON public.point_activities(tenant_id);
    CREATE INDEX idx_point_activities_user_id ON public.point_activities(user_id);
    CREATE INDEX idx_point_activities_type ON public.point_activities(activity_type);
    CREATE INDEX idx_point_activities_created_at ON public.point_activities(created_at DESC);
    
    ALTER TABLE public.point_activities ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view point activities from their tenant"
      ON public.point_activities FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "System can insert point activities"
      ON public.point_activities FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 3. TABELA DE INSIGHTS DE COACHING (COACHING INSIGHTS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaching_insights') THEN
    CREATE TABLE public.coaching_insights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Tipo de insight
      insight_type TEXT NOT NULL CHECK (insight_type IN ('suggestion', 'warning', 'congratulation', 'improvement', 'best_practice')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      
      -- Conteúdo
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_items JSONB DEFAULT '[]'::jsonb,
      related_metrics JSONB DEFAULT '{}'::jsonb,
      
      -- Relacionamentos
      deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
      call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE SET NULL,
      activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
      
      -- Status
      is_read BOOLEAN DEFAULT FALSE,
      is_applied BOOLEAN DEFAULT FALSE,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ,
      applied_at TIMESTAMPTZ
    );
    
    CREATE INDEX idx_coaching_insights_tenant_id ON public.coaching_insights(tenant_id);
    CREATE INDEX idx_coaching_insights_user_id ON public.coaching_insights(user_id);
    CREATE INDEX idx_coaching_insights_type ON public.coaching_insights(insight_type);
    CREATE INDEX idx_coaching_insights_unread ON public.coaching_insights(user_id, is_read) WHERE is_read = FALSE;
    
    ALTER TABLE public.coaching_insights ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own coaching insights"
      ON public.coaching_insights FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
    
    CREATE POLICY "Users can update their own coaching insights"
      ON public.coaching_insights FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid())
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()) AND user_id = auth.uid());
    
    CREATE POLICY "System can create coaching insights"
      ON public.coaching_insights FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 4. FUNÇÃO: ATUALIZAR PONTOS AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.update_gamification_points()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_points INTEGER;
BEGIN
  -- Obter tenant_id
  SELECT get_current_tenant_id() INTO v_tenant_id;
  
  -- Obter pontos baseado no tipo de atividade
  v_points := CASE
    WHEN NEW.activity_type = 'lead_converted' THEN 50
    WHEN NEW.activity_type = 'proposal_sent' THEN 25
    WHEN NEW.activity_type = 'meeting_scheduled' THEN 15
    WHEN NEW.activity_type = 'task_completed' THEN 10
    WHEN NEW.activity_type = 'deal_won' THEN 100
    WHEN NEW.activity_type = 'call_made' THEN 5
    WHEN NEW.activity_type = 'email_sent' THEN 2
    WHEN NEW.activity_type = 'whatsapp_sent' THEN 3
    ELSE NEW.points
  END;
  
  -- Atualizar ou inserir registro de gamificação
  INSERT INTO public.gamification (tenant_id, user_id, total_points, level, last_activity_at)
  VALUES (v_tenant_id, NEW.user_id, v_points, 1, NOW())
  ON CONFLICT (tenant_id, user_id)
  DO UPDATE SET
    total_points = gamification.total_points + v_points,
    level = FLOOR((gamification.total_points + v_points) / 100) + 1,
    last_activity_at = NOW(),
    updated_at = NOW();
  
  -- Atualizar pontos na atividade
  NEW.points := v_points;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar pontos automaticamente
DROP TRIGGER IF EXISTS trigger_update_gamification_points ON public.point_activities;
CREATE TRIGGER trigger_update_gamification_points
  BEFORE INSERT ON public.point_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_points();

-- ============================================
-- 5. FUNÇÃO: ATUALIZAR PROGRESSO DE METAS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal public.goals;
  v_current_value NUMERIC;
BEGIN
  -- Buscar metas ativas relacionadas a esta atividade
  FOR v_goal IN
    SELECT * FROM public.goals
    WHERE status = 'active'
      AND tenant_id = (SELECT get_current_tenant_id())
      AND (
        (user_id = NEW.user_id AND goal_type = 'individual') OR
        (role_filter && ARRAY(SELECT role FROM public.user_roles WHERE user_id = NEW.user_id) AND goal_type = 'team')
      )
      AND NOW()::DATE BETWEEN period_start AND period_end
  LOOP
    -- Calcular valor atual baseado na métrica
    CASE v_goal.metric
      WHEN 'leads_converted' THEN
        SELECT COUNT(*)::NUMERIC INTO v_current_value
        FROM public.leads
        WHERE tenant_id = v_goal.tenant_id
          AND user_id = v_goal.user_id
          AND status = 'ganho'
          AND updated_at::DATE BETWEEN v_goal.period_start AND v_goal.period_end;
      
      WHEN 'revenue' THEN
        SELECT COALESCE(SUM(value), 0) INTO v_current_value
        FROM public.deals
        WHERE tenant_id = v_goal.tenant_id
          AND user_id = v_goal.user_id
          AND stage = 'ganho'
          AND updated_at::DATE BETWEEN v_goal.period_start AND v_goal.period_end;
      
      WHEN 'proposals_sent' THEN
        SELECT COUNT(*)::NUMERIC INTO v_current_value
        FROM public.proposals
        WHERE tenant_id = v_goal.tenant_id
          AND user_id = v_goal.user_id
          AND created_at::DATE BETWEEN v_goal.period_start AND v_goal.period_end;
      
      WHEN 'calls_made' THEN
        SELECT COUNT(*)::NUMERIC INTO v_current_value
        FROM public.activities
        WHERE tenant_id = v_goal.tenant_id
          AND user_id = v_goal.user_id
          AND type = 'call'
          AND created_at::DATE BETWEEN v_goal.period_start AND v_goal.period_end;
      
      WHEN 'meetings_scheduled' THEN
        SELECT COUNT(*)::NUMERIC INTO v_current_value
        FROM public.appointments
        WHERE tenant_id = v_goal.tenant_id
          AND user_id = v_goal.user_id
          AND created_at::DATE BETWEEN v_goal.period_start AND v_goal.period_end;
      
      WHEN 'deals_won' THEN
        SELECT COUNT(*)::NUMERIC INTO v_current_value
        FROM public.deals
        WHERE tenant_id = v_goal.tenant_id
          AND user_id = v_goal.user_id
          AND stage = 'ganho'
          AND updated_at::DATE BETWEEN v_goal.period_start AND v_goal.period_end;
    END CASE;
    
    -- Atualizar progresso
    UPDATE public.goals
    SET
      current_value = v_current_value,
      progress_percentage = LEAST((v_current_value / NULLIF(v_goal.target_value, 0)) * 100, 100),
      status = CASE
        WHEN v_current_value >= v_goal.target_value THEN 'completed'
        ELSE 'active'
      END,
      updated_at = NOW()
    WHERE id = v_goal.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para atualizar progresso de metas
DROP TRIGGER IF EXISTS trigger_update_goal_progress_leads ON public.leads;
CREATE TRIGGER trigger_update_goal_progress_leads
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_goal_progress();

DROP TRIGGER IF EXISTS trigger_update_goal_progress_deals ON public.deals;
CREATE TRIGGER trigger_update_goal_progress_deals
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION public.update_goal_progress();

DROP TRIGGER IF EXISTS trigger_update_goal_progress_proposals ON public.proposals;
CREATE TRIGGER trigger_update_goal_progress_proposals
  AFTER INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress();

DROP TRIGGER IF EXISTS trigger_update_goal_progress_activities ON public.activities;
CREATE TRIGGER trigger_update_goal_progress_activities
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress();

DROP TRIGGER IF EXISTS trigger_update_goal_progress_appointments ON public.appointments;
CREATE TRIGGER trigger_update_goal_progress_appointments
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress();

-- ============================================
-- 6. FUNÇÃO: GERAR INSIGHTS DE COACHING AUTOMÁTICOS
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_coaching_insights()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_insight_title TEXT;
  v_insight_message TEXT;
  v_insight_type TEXT;
BEGIN
  -- Obter tenant_id e user_id
  SELECT get_current_tenant_id() INTO v_tenant_id;
  v_user_id := NEW.user_id;
  
  -- Gerar insights baseados em diferentes condições
  -- Exemplo: Se deal foi perdido, gerar insight de melhoria
  IF TG_TABLE_NAME = 'deals' AND NEW.stage = 'perdido' AND OLD.stage != 'perdido' THEN
    v_insight_title := 'Oportunidade Perdida - Análise';
    v_insight_message := 'Uma oportunidade foi marcada como perdida. Revise o histórico de interações e identifique pontos de melhoria.';
    v_insight_type := 'improvement';
    
    INSERT INTO public.coaching_insights (
      tenant_id, user_id, insight_type, priority, title, message, deal_id
    ) VALUES (
      v_tenant_id, v_user_id, v_insight_type, 'high', v_insight_title, v_insight_message, NEW.id
    );
  END IF;
  
  -- Exemplo: Se lead foi convertido, gerar insight de congratulação
  IF TG_TABLE_NAME = 'leads' AND NEW.status = 'ganho' AND OLD.status != 'ganho' THEN
    v_insight_title := 'Parabéns! Lead Convertido';
    v_insight_message := 'Você converteu um lead com sucesso! Continue mantendo esse padrão de excelência.';
    v_insight_type := 'congratulation';
    
    INSERT INTO public.coaching_insights (
      tenant_id, user_id, insight_type, priority, title, message, deal_id
    ) VALUES (
      v_tenant_id, v_user_id, v_insight_type, 'low', v_insight_title, v_insight_message, NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para gerar insights
DROP TRIGGER IF EXISTS trigger_generate_coaching_insights_deals ON public.deals;
CREATE TRIGGER trigger_generate_coaching_insights_deals
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION public.generate_coaching_insights();

DROP TRIGGER IF EXISTS trigger_generate_coaching_insights_leads ON public.leads;
CREATE TRIGGER trigger_generate_coaching_insights_leads
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.generate_coaching_insights();

-- ============================================
-- 7. TRIGGERS PARA updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goals_updated_at ON public.goals;
CREATE TRIGGER trigger_update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goals_updated_at();

-- ============================================
-- 8. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 9. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.goals IS 'Metas individuais, de equipe e da empresa para acompanhamento de KPIs';
COMMENT ON TABLE public.point_activities IS 'Atividades que geram pontos no sistema de gamificação';
COMMENT ON TABLE public.coaching_insights IS 'Insights automáticos de coaching gerados pelo sistema';
COMMENT ON FUNCTION public.update_gamification_points() IS 'Atualiza automaticamente os pontos de gamificação quando uma atividade é registrada';
COMMENT ON FUNCTION public.update_goal_progress() IS 'Atualiza automaticamente o progresso das metas baseado em atividades';
COMMENT ON FUNCTION public.generate_coaching_insights() IS 'Gera insights automáticos de coaching baseados em eventos do CRM';






