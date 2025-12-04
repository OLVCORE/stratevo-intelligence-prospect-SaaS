-- ==========================================
-- MOTOR DE QUALIFICAÇÃO DE PROSPECTS
-- Sistema de triagem inteligente com IA
-- ==========================================

-- 1. Tabela de Jobs de Qualificação
CREATE TABLE IF NOT EXISTS prospect_qualification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  icp_id uuid REFERENCES icp(id), -- ICP usado como referência
  
  -- Metadados do job
  job_name text NOT NULL, -- Nome do lote (ex: "Prospecção Indústrias SP Jan/2025")
  source_type text NOT NULL, -- 'upload_csv', 'upload_excel', 'paste_list', 'apollo_import'
  source_file_name text, -- Nome do arquivo original
  
  -- Estatísticas
  total_cnpjs integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  enriched_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  
  -- Qualificação
  grade_a_plus integer NOT NULL DEFAULT 0, -- 95-100%
  grade_a integer NOT NULL DEFAULT 0,       -- 85-94%
  grade_b integer NOT NULL DEFAULT 0,       -- 70-84%
  grade_c integer NOT NULL DEFAULT 0,       -- 60-69%
  grade_d integer NOT NULL DEFAULT 0,       -- <60%
  
  -- Status do processamento
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  progress_percentage numeric(5,2) DEFAULT 0.00,
  error_message text,
  
  -- Configurações
  config jsonb, -- Configurações de qualificação (pesos, thresholds, etc)
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela de Prospects Qualificados
CREATE TABLE IF NOT EXISTS qualified_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id uuid REFERENCES prospect_qualification_jobs(id) ON DELETE CASCADE,
  icp_id uuid REFERENCES icp(id),
  
  -- Dados básicos da empresa
  cnpj text NOT NULL,
  razao_social text,
  nome_fantasia text,
  
  -- Localização
  cidade text,
  estado text,
  cep text,
  endereco text,
  bairro text,
  numero text,
  
  -- Dados da Receita Federal
  setor text,
  capital_social numeric,
  cnae_principal text,
  cnae_descricao text,
  situacao_cnpj text,
  porte text,
  data_abertura date,
  
  -- Presença digital
  website text,
  produtos jsonb, -- Array de produtos extraídos
  produtos_count integer DEFAULT 0,
  
  -- SCORES DE QUALIFICAÇÃO
  fit_score numeric(5,2) NOT NULL, -- 0.00 a 100.00
  grade text NOT NULL, -- 'A+', 'A', 'B', 'C', 'D'
  
  -- Scores detalhados (cada um 0-100)
  product_similarity_score numeric(5,2) DEFAULT 0, -- 30% peso
  sector_fit_score numeric(5,2) DEFAULT 0,         -- 25% peso
  capital_fit_score numeric(5,2) DEFAULT 0,        -- 20% peso
  geo_fit_score numeric(5,2) DEFAULT 0,            -- 15% peso
  maturity_score numeric(5,2) DEFAULT 0,           -- 10% peso
  
  -- Razões do fit
  fit_reasons jsonb, -- Array de strings explicando o score
  compatible_products jsonb, -- Produtos que deram match
  risk_flags jsonb, -- Flags de risco/atenção
  
  -- Status no pipeline
  pipeline_status text DEFAULT 'new', -- new, approved, in_base, in_quarantine, discarded
  approved_at timestamptz,
  discarded_at timestamptz,
  discard_reason text,
  
  -- Metadados
  enrichment_data jsonb, -- Dados brutos do enriquecimento
  ai_analysis jsonb, -- Análise completa da IA
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(tenant_id, cnpj) -- Evitar duplicatas por tenant
);

-- 3. Índices para performance
CREATE INDEX idx_qualification_jobs_tenant ON prospect_qualification_jobs(tenant_id);
CREATE INDEX idx_qualification_jobs_status ON prospect_qualification_jobs(status);
CREATE INDEX idx_qualification_jobs_created ON prospect_qualification_jobs(created_at DESC);

CREATE INDEX idx_qualified_prospects_tenant ON qualified_prospects(tenant_id);
CREATE INDEX idx_qualified_prospects_job ON qualified_prospects(job_id);
CREATE INDEX idx_qualified_prospects_grade ON qualified_prospects(grade);
CREATE INDEX idx_qualified_prospects_fit_score ON qualified_prospects(fit_score DESC);
CREATE INDEX idx_qualified_prospects_pipeline_status ON qualified_prospects(pipeline_status);
CREATE INDEX idx_qualified_prospects_cnpj ON qualified_prospects(cnpj);

-- 4. Função para atualizar estatísticas do job
CREATE OR REPLACE FUNCTION update_job_statistics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar contadores do job
  UPDATE prospect_qualification_jobs
  SET
    processed_count = (
      SELECT COUNT(*) 
      FROM qualified_prospects 
      WHERE job_id = NEW.job_id
    ),
    grade_a_plus = (
      SELECT COUNT(*) 
      FROM qualified_prospects 
      WHERE job_id = NEW.job_id AND grade = 'A+'
    ),
    grade_a = (
      SELECT COUNT(*) 
      FROM qualified_prospects 
      WHERE job_id = NEW.job_id AND grade = 'A'
    ),
    grade_b = (
      SELECT COUNT(*) 
      FROM qualified_prospects 
      WHERE job_id = NEW.job_id AND grade = 'B'
    ),
    grade_c = (
      SELECT COUNT(*) 
      FROM qualified_prospects 
      WHERE job_id = NEW.job_id AND grade = 'C'
    ),
    grade_d = (
      SELECT COUNT(*) 
      FROM qualified_prospects 
      WHERE job_id = NEW.job_id AND grade = 'D'
    ),
    progress_percentage = (
      (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id)::numeric / 
      NULLIF(total_cnpjs, 0) * 100
    ),
    updated_at = now()
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar estatísticas
DROP TRIGGER IF EXISTS trigger_update_job_stats ON qualified_prospects;
CREATE TRIGGER trigger_update_job_stats
  AFTER INSERT OR UPDATE ON qualified_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_job_statistics();

-- 5. Função para aprovar prospects em massa
CREATE OR REPLACE FUNCTION approve_prospects_bulk(
  p_tenant_id uuid,
  p_job_id uuid,
  p_grades text[] -- Ex: ['A+', 'A']
)
RETURNS TABLE (
  approved_count integer,
  empresa_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approved_count integer;
  v_empresa_ids uuid[];
BEGIN
  -- Inserir prospects qualificados na tabela 'empresas'
  WITH inserted AS (
    INSERT INTO empresas (
      tenant_id,
      cnpj,
      razao_social,
      nome_fantasia,
      cidade,
      estado,
      setor,
      capital_social,
      origem,
      fit_score,
      grade,
      status
    )
    SELECT
      p_tenant_id,
      qp.cnpj,
      qp.razao_social,
      qp.nome_fantasia,
      qp.cidade,
      qp.estado,
      qp.setor,
      qp.capital_social,
      'motor_qualificacao',
      qp.fit_score,
      qp.grade,
      'pending_review' -- Vai para Quarentena
    FROM qualified_prospects qp
    WHERE qp.tenant_id = p_tenant_id
      AND qp.job_id = p_job_id
      AND qp.grade = ANY(p_grades)
      AND qp.pipeline_status = 'new'
    ON CONFLICT (tenant_id, cnpj) DO NOTHING -- Evitar duplicatas
    RETURNING id
  )
  SELECT 
    COUNT(*)::integer,
    array_agg(id)
  INTO v_approved_count, v_empresa_ids
  FROM inserted;
  
  -- Atualizar status dos prospects
  UPDATE qualified_prospects
  SET 
    pipeline_status = 'approved',
    approved_at = now()
  WHERE tenant_id = p_tenant_id
    AND job_id = p_job_id
    AND grade = ANY(p_grades);
  
  RETURN QUERY SELECT v_approved_count, v_empresa_ids;
END;
$$;

-- 6. Função para descartar prospects
CREATE OR REPLACE FUNCTION discard_prospects_bulk(
  p_tenant_id uuid,
  p_job_id uuid,
  p_grades text[], -- Ex: ['C', 'D']
  p_reason text DEFAULT 'Fit score baixo - fora do ICP'
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_discarded_count integer;
BEGIN
  UPDATE qualified_prospects
  SET 
    pipeline_status = 'discarded',
    discarded_at = now(),
    discard_reason = p_reason
  WHERE tenant_id = p_tenant_id
    AND job_id = p_job_id
    AND grade = ANY(p_grades)
    AND pipeline_status = 'new';
  
  GET DIAGNOSTICS v_discarded_count = ROW_COUNT;
  RETURN v_discarded_count;
END;
$$;

-- 7. View para dashboard de qualificação
CREATE OR REPLACE VIEW vw_qualification_dashboard AS
SELECT
  j.id as job_id,
  j.tenant_id,
  j.job_name,
  j.status,
  j.total_cnpjs,
  j.processed_count,
  j.progress_percentage,
  j.grade_a_plus,
  j.grade_a,
  j.grade_b,
  j.grade_c,
  j.grade_d,
  j.created_at,
  j.completed_at,
  -- Estatísticas agregadas
  (j.grade_a_plus + j.grade_a + j.grade_b) as qualified_count,
  (j.grade_c + j.grade_d) as rejected_count,
  -- Tempo de processamento
  EXTRACT(EPOCH FROM (COALESCE(j.completed_at, now()) - j.created_at))/60 as duration_minutes
FROM prospect_qualification_jobs j
ORDER BY j.created_at DESC;

-- 8. Permissões
GRANT SELECT, INSERT, UPDATE ON prospect_qualification_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON qualified_prospects TO authenticated;
GRANT SELECT ON vw_qualification_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION approve_prospects_bulk(uuid, uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION discard_prospects_bulk(uuid, uuid, text[], text) TO authenticated;

-- 9. RLS (Row Level Security)
ALTER TABLE prospect_qualification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualified_prospects ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem jobs do seu tenant
CREATE POLICY "Users can view their tenant jobs" ON prospect_qualification_jobs
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their tenant jobs" ON prospect_qualification_jobs
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant jobs" ON prospect_qualification_jobs
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários só veem prospects do seu tenant
CREATE POLICY "Users can view their tenant prospects" ON qualified_prospects
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their tenant prospects" ON qualified_prospects
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant prospects" ON qualified_prospects
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON TABLE prospect_qualification_jobs IS 
'Jobs de qualificação em lote de prospects.
Cada job representa um upload/processamento de CNPJs.';

COMMENT ON TABLE qualified_prospects IS 
'Prospects enriquecidos e qualificados via IA.
Apenas prospects com fit > 60% são mantidos.';

COMMENT ON FUNCTION approve_prospects_bulk IS 
'Aprova prospects em massa e move para Base de Empresas.
Exemplo: approve_prospects_bulk(tenant_id, job_id, ARRAY[''A+'', ''A''])';

COMMENT ON FUNCTION discard_prospects_bulk IS 
'Descarta prospects em massa (grades C, D).
Exemplo: discard_prospects_bulk(tenant_id, job_id, ARRAY[''C'', ''D''])';

-- ==========================================
-- SEED DATA (Exemplo)
-- ==========================================

-- Criar job de exemplo (comentado - descomentar para testar)
/*
INSERT INTO prospect_qualification_jobs (
  tenant_id,
  job_name,
  source_type,
  total_cnpjs,
  status
) VALUES (
  'SEU_TENANT_ID_AQUI',
  'Teste - Prospecção Jan/2025',
  'upload_csv',
  100,
  'pending'
);
*/

-- ==========================================
-- ✅ MIGRATION COMPLETA
-- ==========================================

