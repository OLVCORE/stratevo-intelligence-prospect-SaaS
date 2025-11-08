-- ============================================================================
-- MIGRATION COMPLETA: Criar todas as tabelas faltando do Sales Workspace
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. CRIAR TABELA sdr_pipeline_stages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  probability_default INTEGER NOT NULL DEFAULT 50,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir stages padrão
INSERT INTO sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Discovery', 'discovery', 1, '#3b82f6', 10, FALSE, FALSE),
  ('Qualification', 'qualification', 2, '#8b5cf6', 30, FALSE, FALSE),
  ('Proposal', 'proposal', 3, '#f59e0b', 50, FALSE, FALSE),
  ('Negotiation', 'negotiation', 4, '#10b981', 70, FALSE, FALSE),
  ('Closed Won', 'won', 5, '#22c55e', 100, TRUE, TRUE),
  ('Closed Lost', 'lost', 6, '#ef4444', 0, TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_sdr_pipeline_stages_order ON sdr_pipeline_stages(order_index);

-- Habilitar RLS
ALTER TABLE sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Criar policy
DROP POLICY IF EXISTS "Allow authenticated users to read stages" ON sdr_pipeline_stages;
CREATE POLICY "Allow authenticated users to read stages"
  ON sdr_pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

-- 2. CRIAR TABELA sdr_deals (se não existir)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  stage TEXT NOT NULL DEFAULT 'discovery',
  value NUMERIC(15,2) NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  expected_close_date DATE,
  closed_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_stage ON sdr_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_status ON sdr_deals(status);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned ON sdr_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_created ON sdr_deals(created_at);

-- Habilitar RLS
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;

-- Criar policies
DROP POLICY IF EXISTS "Users can view all deals" ON sdr_deals;
CREATE POLICY "Users can view all deals"
  ON sdr_deals FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert deals" ON sdr_deals;
CREATE POLICY "Users can insert deals"
  ON sdr_deals FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update deals" ON sdr_deals;
CREATE POLICY "Users can update deals"
  ON sdr_deals FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can delete deals" ON sdr_deals;
CREATE POLICY "Users can delete deals"
  ON sdr_deals FOR DELETE
  TO authenticated
  USING (true);

-- 3. CRIAR TABELA deal_health_scores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES sdr_deals(id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  factors JSONB,
  recommendations JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_to UUID REFERENCES auth.users(id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_deal ON deal_health_scores(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_risk ON deal_health_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_assigned ON deal_health_scores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deal_health_scores_calculated ON deal_health_scores(calculated_at);

-- Habilitar RLS
ALTER TABLE deal_health_scores ENABLE ROW LEVEL SECURITY;

-- Criar policy
DROP POLICY IF EXISTS "Users can view health scores" ON deal_health_scores;
CREATE POLICY "Users can view health scores"
  ON deal_health_scores FOR SELECT
  TO authenticated
  USING (true);

-- 4. CRIAR TABELA sdr_deal_activities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sdr_deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES sdr_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sdr_deal_activities_deal ON sdr_deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deal_activities_created ON sdr_deal_activities(created_at);

-- Habilitar RLS
ALTER TABLE sdr_deal_activities ENABLE ROW LEVEL SECURITY;

-- Criar policy
DROP POLICY IF EXISTS "Users can view activities" ON sdr_deal_activities;
CREATE POLICY "Users can view activities"
  ON sdr_deal_activities FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert activities" ON sdr_deal_activities;
CREATE POLICY "Users can insert activities"
  ON sdr_deal_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificar se tudo foi criado corretamente:
SELECT 
  'sdr_pipeline_stages' as table_name, 
  COUNT(*) as rows 
FROM sdr_pipeline_stages
UNION ALL
SELECT 'sdr_deals', COUNT(*) FROM sdr_deals
UNION ALL
SELECT 'deal_health_scores', COUNT(*) FROM deal_health_scores
UNION ALL
SELECT 'sdr_deal_activities', COUNT(*) FROM sdr_deal_activities;

