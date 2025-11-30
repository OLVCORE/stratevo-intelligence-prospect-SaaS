-- Tabela de metas (goals)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  team_id UUID,
  goal_type TEXT NOT NULL, -- 'individual', 'team'
  metric TEXT NOT NULL, -- 'leads_converted', 'revenue', 'proposals_sent', etc
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de gamificação (gamification)
CREATE TABLE IF NOT EXISTS public.gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de atividades de pontos (point_activities)
CREATE TABLE IF NOT EXISTS public.point_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de coaching insights
CREATE TABLE IF NOT EXISTS public.coaching_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  insight_type TEXT NOT NULL, -- 'suggestion', 'warning', 'congratulation'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  action_items JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_period ON public.goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON public.gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_point_activities_user_id ON public.point_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_insights_user_id ON public.coaching_insights(user_id);

-- Habilitar RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para goals
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all goals"
  ON public.goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'direcao', 'gerencia', 'gestor')
    )
  );

CREATE POLICY "Admins can insert goals"
  ON public.goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'direcao', 'gerencia', 'gestor')
    )
  );

CREATE POLICY "Admins can update goals"
  ON public.goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'direcao', 'gerencia', 'gestor')
    )
  );

-- Políticas RLS para gamification
CREATE POLICY "Users can view their own gamification"
  ON public.gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all gamification for leaderboard"
  ON public.gamification FOR SELECT
  USING (true);

CREATE POLICY "System can update gamification"
  ON public.gamification FOR ALL
  USING (true);

-- Políticas RLS para point_activities
CREATE POLICY "Users can view their own point activities"
  ON public.point_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert point activities"
  ON public.point_activities FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para coaching_insights
CREATE POLICY "Users can view their own insights"
  ON public.coaching_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.coaching_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights"
  ON public.coaching_insights FOR INSERT
  WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para updated_at em goals
CREATE TRIGGER update_goals_updated_at_trigger
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- Função para calcular progresso de meta
CREATE OR REPLACE FUNCTION calculate_goal_progress(goal_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  goal_record RECORD;
  progress NUMERIC;
BEGIN
  SELECT * INTO goal_record FROM public.goals WHERE id = goal_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  progress := (goal_record.current_value / NULLIF(goal_record.target_value, 0)) * 100;
  RETURN COALESCE(progress, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para adicionar pontos
CREATE OR REPLACE FUNCTION add_points(
  p_user_id UUID,
  p_activity_type TEXT,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_gamification RECORD;
  v_new_level INTEGER;
BEGIN
  -- Buscar ou criar gamification record
  SELECT * INTO v_gamification
  FROM public.gamification
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.gamification (user_id, points, level)
    VALUES (p_user_id, p_points, 1)
    RETURNING * INTO v_gamification;
  ELSE
    -- Atualizar pontos
    UPDATE public.gamification
    SET 
      points = points + p_points,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_gamification;
  END IF;
  
  -- Calcular novo nível (100 pontos por nível)
  v_new_level := FLOOR(v_gamification.points / 100) + 1;
  
  IF v_new_level > v_gamification.level THEN
    UPDATE public.gamification
    SET level = v_new_level
    WHERE user_id = p_user_id;
  END IF;
  
  -- Registrar atividade
  INSERT INTO public.point_activities (user_id, activity_type, points_earned, description)
  VALUES (p_user_id, p_activity_type, p_points, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para dar pontos quando lead é convertido
CREATE OR REPLACE FUNCTION award_points_on_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'fechado' AND NEW.status = 'fechado' THEN
    PERFORM add_points(
      COALESCE(NEW.assigned_to, auth.uid()),
      'lead_converted',
      50,
      'Lead convertido: ' || NEW.name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER award_points_lead_conversion
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_lead_conversion();

-- Trigger para dar pontos quando proposta é enviada
CREATE OR REPLACE FUNCTION award_points_on_proposal_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'enviada' AND NEW.status = 'enviada' THEN
    PERFORM add_points(
      auth.uid(),
      'proposal_sent',
      20,
      'Proposta enviada'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER award_points_proposal_sent
  AFTER UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_proposal_sent();