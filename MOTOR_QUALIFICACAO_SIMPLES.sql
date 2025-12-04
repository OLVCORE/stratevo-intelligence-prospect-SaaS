-- ==========================================
-- MOTOR DE QUALIFICAÇÃO - VERSÃO SIMPLIFICADA
-- SEM DEPENDÊNCIAS DE OUTRAS TABELAS
-- ==========================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ==========================================

-- 1. Tabela de Jobs de Qualificação
CREATE TABLE IF NOT EXISTS prospect_qualification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  icp_id uuid, -- Opcional
  
  -- Metadados do job
  job_name text NOT NULL,
  source_type text NOT NULL,
  source_file_name text,
  
  -- Estatísticas
  total_cnpjs integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  enriched_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  
  -- Qualificação
  grade_a_plus integer NOT NULL DEFAULT 0,
  grade_a integer NOT NULL DEFAULT 0,
  grade_b integer NOT NULL DEFAULT 0,
  grade_c integer NOT NULL DEFAULT 0,
  grade_d integer NOT NULL DEFAULT 0,
  
  -- Status
  status text NOT NULL DEFAULT 'pending',
  progress_percentage numeric(5,2) DEFAULT 0.00,
  error_message text,
  config jsonb,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela de Prospects Qualificados
CREATE TABLE IF NOT EXISTS qualified_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_id uuid REFERENCES prospect_qualification_jobs(id) ON DELETE CASCADE,
  icp_id uuid,
  
  -- Dados básicos
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
  
  -- Dados empresariais
  setor text,
  capital_social numeric,
  cnae_principal text,
  cnae_descricao text,
  situacao_cnpj text,
  porte text,
  data_abertura date,
  
  -- Digital
  website text,
  produtos jsonb,
  produtos_count integer DEFAULT 0,
  
  -- SCORES
  fit_score numeric(5,2) NOT NULL,
  grade text NOT NULL,
  product_similarity_score numeric(5,2) DEFAULT 0,
  sector_fit_score numeric(5,2) DEFAULT 0,
  capital_fit_score numeric(5,2) DEFAULT 0,
  geo_fit_score numeric(5,2) DEFAULT 0,
  maturity_score numeric(5,2) DEFAULT 0,
  
  -- Análise
  fit_reasons jsonb,
  compatible_products jsonb,
  risk_flags jsonb,
  
  -- Pipeline
  pipeline_status text DEFAULT 'new',
  approved_at timestamptz,
  discarded_at timestamptz,
  discard_reason text,
  
  -- Metadados
  enrichment_data jsonb,
  ai_analysis jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, cnpj)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_qualification_jobs_tenant ON prospect_qualification_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qualification_jobs_status ON prospect_qualification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_tenant ON qualified_prospects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_job ON qualified_prospects(job_id);
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_grade ON qualified_prospects(grade);
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_fit_score ON qualified_prospects(fit_score DESC);

-- 4. Função para atualizar estatísticas
CREATE OR REPLACE FUNCTION update_job_statistics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE prospect_qualification_jobs
  SET
    processed_count = (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id),
    grade_a_plus = (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id AND grade = 'A+'),
    grade_a = (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id AND grade = 'A'),
    grade_b = (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id AND grade = 'B'),
    grade_c = (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id AND grade = 'C'),
    grade_d = (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id AND grade = 'D'),
    progress_percentage = (
      (SELECT COUNT(*) FROM qualified_prospects WHERE job_id = NEW.job_id)::numeric / 
      NULLIF(total_cnpjs, 0) * 100
    ),
    updated_at = now()
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_job_stats ON qualified_prospects;
CREATE TRIGGER trigger_update_job_stats
  AFTER INSERT OR UPDATE ON qualified_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_job_statistics();

-- 5. Permissões
GRANT SELECT, INSERT, UPDATE ON prospect_qualification_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON qualified_prospects TO authenticated;

-- ==========================================
-- ✅ PRONTO! EXECUTE E TESTE
-- ==========================================

-- Ver jobs:
-- SELECT * FROM prospect_qualification_jobs;

-- Ver prospects:
-- SELECT * FROM qualified_prospects;

