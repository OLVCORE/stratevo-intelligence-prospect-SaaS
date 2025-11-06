-- =====================================================
-- ENTERPRISE REPORT SYSTEM - COMPLETE ARCHITECTURE
-- Inspired by Salesforce/HubSpot/ZoomInfo
-- =====================================================

-- 1. REPORT STATE (controla estado atual do relatório)
CREATE TABLE IF NOT EXISTS report_state (
  report_id UUID PRIMARY KEY REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  current_step VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft/processing/completed/failed
  steps_completed TEXT[] DEFAULT '{}',
  total_steps INT DEFAULT 9,
  progress_percent INT DEFAULT 0,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_state_status ON report_state(status);
CREATE INDEX idx_report_state_updated ON report_state(updated_at DESC);

-- 2. JOB QUEUE (fila de processamento)
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- discovery/competitors/clients/decisores/etc
  priority INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/running/completed/failed
  input_data JSONB,
  output_data JSONB,
  error TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status ON job_queue(status, priority DESC, scheduled_at);
CREATE INDEX idx_job_queue_report ON job_queue(report_id);

-- 3. API CALLS LOG (rastreamento completo de custos)
CREATE TABLE IF NOT EXISTS api_calls_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_queue(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- serper/hunter/apollo/openai/jina
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_body JSONB,
  response_body JSONB,
  status_code INT,
  cost_usd DECIMAL(10,6),
  duration_ms INT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_calls_report ON api_calls_log(report_id);
CREATE INDEX idx_api_calls_provider ON api_calls_log(provider, created_at DESC);
CREATE INDEX idx_api_calls_cost ON api_calls_log(cost_usd DESC);

-- 4. REPORT EVENTS (event sourcing - histórico completo)
CREATE TABLE IF NOT EXISTS report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES stc_verification_history(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- created/step_started/step_completed/error/retry
  event_data JSONB,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_events_report ON report_events(report_id, created_at DESC);
CREATE INDEX idx_report_events_type ON report_events(event_type);

-- 5. STEP REGISTRY (define todas as etapas possíveis)
CREATE TABLE IF NOT EXISTS step_registry (
  step_key VARCHAR(50) PRIMARY KEY,
  step_name VARCHAR(100) NOT NULL,
  step_order INT NOT NULL,
  estimated_duration_seconds INT,
  requires_steps TEXT[] DEFAULT '{}',
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Popular steps padrão
INSERT INTO step_registry (step_key, step_name, step_order, estimated_duration_seconds, is_required) VALUES
  ('discovery', 'Keywords & SEO Discovery', 1, 30, true),
  ('totvs', 'Verificação TOTVS', 2, 20, true),
  ('competitors', 'Análise de Competidores', 3, 40, false),
  ('similar', 'Empresas Similares', 4, 35, false),
  ('clients', 'Descoberta de Clientes', 5, 45, false),
  ('decisores', 'Decisores e Contatos', 6, 50, false),
  ('analysis_360', 'Análise 360°', 7, 25, false),
  ('products', 'Produtos Recomendados', 8, 15, false),
  ('executive', 'Sumário Executivo', 9, 10, true)
ON CONFLICT (step_key) DO NOTHING;

-- 6. FUNCTION: Create report with initial state
CREATE OR REPLACE FUNCTION create_report_with_state(
  p_company_id UUID,
  p_company_name TEXT,
  p_cnpj TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  -- Inserir relatório
  INSERT INTO stc_verification_history (
    company_id,
    company_name,
    cnpj,
    status,
    confidence,
    triple_matches,
    double_matches,
    single_matches,
    total_score,
    evidences,
    sources_consulted,
    queries_executed,
    full_report
  ) VALUES (
    p_company_id,
    p_company_name,
    p_cnpj,
    'draft',
    '0%',
    0, 0, 0, 0,
    '[]'::jsonb,
    0, 0,
    jsonb_build_object(
      '__meta', jsonb_build_object(
        'created_at', NOW(),
        'status', 'draft',
        'company_name', p_company_name,
        'cnpj', p_cnpj
      ),
      '__status', jsonb_build_object(
        'keywords', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'totvs', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'competitors', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'similar', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'clients', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'decisores', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'analysis_360', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'products', jsonb_build_object('status', 'draft', 'updated_at', NULL),
        'executive', jsonb_build_object('status', 'draft', 'updated_at', NULL)
      )
    )
  )
  RETURNING id INTO v_report_id;

  -- Inserir estado inicial
  INSERT INTO report_state (
    report_id,
    status,
    current_step,
    steps_completed,
    progress_percent
  ) VALUES (
    v_report_id,
    'draft',
    NULL,
    '{}',
    0
  );

  -- Logar evento
  INSERT INTO report_events (report_id, event_type, event_data) VALUES (
    v_report_id,
    'created',
    jsonb_build_object('company_name', p_company_name, 'cnpj', p_cnpj)
  );

  RETURN v_report_id;
END;
$$;

-- 7. FUNCTION: Enqueue job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_report_id UUID,
  p_job_type VARCHAR(50),
  p_input_data JSONB DEFAULT NULL,
  p_priority INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO job_queue (
    report_id,
    job_type,
    input_data,
    priority,
    status
  ) VALUES (
    p_report_id,
    p_job_type,
    p_input_data,
    p_priority,
    'pending'
  )
  RETURNING id INTO v_job_id;

  -- Logar evento
  INSERT INTO report_events (report_id, event_type, event_data) VALUES (
    p_report_id,
    'job_queued',
    jsonb_build_object('job_id', v_job_id, 'job_type', p_job_type)
  );

  RETURN v_job_id;
END;
$$;

-- 8. FUNCTION: Update report progress
CREATE OR REPLACE FUNCTION update_report_progress(
  p_report_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count INT;
  v_total_count INT;
  v_progress INT;
BEGIN
  -- Contar steps completados
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*)
  INTO v_completed_count, v_total_count
  FROM job_queue
  WHERE report_id = p_report_id;

  -- Calcular progresso
  v_progress := CASE 
    WHEN v_total_count > 0 THEN (v_completed_count * 100 / v_total_count)
    ELSE 0
  END;

  -- Atualizar report_state
  UPDATE report_state
  SET 
    progress_percent = v_progress,
    updated_at = NOW()
  WHERE report_id = p_report_id;
END;
$$;

-- 9. FUNCTION: Log API call
CREATE OR REPLACE FUNCTION log_api_call(
  p_report_id UUID,
  p_job_id UUID,
  p_provider VARCHAR(50),
  p_endpoint VARCHAR(255),
  p_status_code INT,
  p_cost_usd DECIMAL DEFAULT 0,
  p_duration_ms INT DEFAULT 0,
  p_success BOOLEAN DEFAULT true,
  p_request_body JSONB DEFAULT NULL,
  p_response_body JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO api_calls_log (
    report_id,
    job_id,
    provider,
    endpoint,
    request_body,
    response_body,
    status_code,
    cost_usd,
    duration_ms,
    success,
    error_message
  ) VALUES (
    p_report_id,
    p_job_id,
    p_provider,
    p_endpoint,
    p_request_body,
    p_response_body,
    p_status_code,
    p_cost_usd,
    p_duration_ms,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 10. VIEW: Report dashboard (para monitoramento)
CREATE OR REPLACE VIEW report_dashboard AS
SELECT 
  r.id AS report_id,
  r.company_name,
  r.cnpj,
  r.status AS report_status,
  rs.status AS state_status,
  rs.current_step,
  rs.progress_percent,
  rs.steps_completed,
  rs.started_at,
  rs.completed_at,
  EXTRACT(EPOCH FROM (COALESCE(rs.completed_at, NOW()) - rs.started_at)) AS duration_seconds,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id) AS total_jobs,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id AND status = 'completed') AS completed_jobs,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id AND status = 'failed') AS failed_jobs,
  (SELECT SUM(cost_usd) FROM api_calls_log WHERE report_id = r.id) AS total_cost_usd,
  (SELECT COUNT(*) FROM api_calls_log WHERE report_id = r.id) AS total_api_calls,
  r.created_at,
  r.updated_at
FROM stc_verification_history r
LEFT JOIN report_state rs ON rs.report_id = r.id
ORDER BY r.created_at DESC;

-- 11. TRIGGER: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_report_state_updated_at
  BEFORE UPDATE ON report_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. RLS Policies (Row Level Security)
ALTER TABLE report_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_events ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
CREATE POLICY "Admin full access on report_state" ON report_state FOR ALL USING (true);
CREATE POLICY "Admin full access on job_queue" ON job_queue FOR ALL USING (true);
CREATE POLICY "Admin full access on api_calls_log" ON api_calls_log FOR ALL USING (true);
CREATE POLICY "Admin full access on report_events" ON report_events FOR ALL USING (true);

-- 13. Índices para performance
CREATE INDEX IF NOT EXISTS idx_stc_history_company ON stc_verification_history(company_name);
CREATE INDEX IF NOT EXISTS idx_stc_history_created ON stc_verification_history(created_at DESC);

COMMENT ON TABLE report_state IS 'Estado atual de cada relatório (fonte única de verdade)';
COMMENT ON TABLE job_queue IS 'Fila de processamento assíncrono (backend workers)';
COMMENT ON TABLE api_calls_log IS 'Log completo de todas chamadas externas (auditoria e custos)';
COMMENT ON TABLE report_events IS 'Event sourcing - histórico completo de tudo que aconteceu';
COMMENT ON TABLE step_registry IS 'Define todas as etapas possíveis do relatório';

