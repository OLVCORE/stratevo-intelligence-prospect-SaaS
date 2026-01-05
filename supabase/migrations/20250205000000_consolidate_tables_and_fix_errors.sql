-- ==========================================
-- CONSOLIDAÇÃO DE TABELAS + CORREÇÕES
-- ==========================================
-- 1. Adicionar campo purchase_intent_analysis em qualified_prospects
-- 2. Adicionar prospect_status em companies
-- 3. Criar views para compatibilidade
-- ==========================================

-- 1. ADICIONAR purchase_intent_analysis em qualified_prospects
ALTER TABLE qualified_prospects 
  ADD COLUMN IF NOT EXISTS purchase_intent_analysis jsonb;

-- 2. ADICIONAR prospect_status em companies (consolidação)
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS prospect_status text DEFAULT 'new' 
  CHECK (prospect_status IN ('new', 'qualified', 'in_quarantine', 'approved', 'pipeline', 'closed'));

-- 3. CRIAR VIEWS PARA COMPATIBILIDADE (transição gradual)
CREATE OR REPLACE VIEW v_qualified_stock AS 
  SELECT 
    c.*,
    c.id as qualified_prospect_id,
    c.name as razao_social,
    c.name as nome_fantasia,
    c.industry as setor,
    c.location->>'city' as cidade,
    c.location->>'state' as estado,
    c.location->>'cep' as cep,
    c.digital_maturity_score as fit_score,
    CASE 
      WHEN c.digital_maturity_score >= 90 THEN 'A+'
      WHEN c.digital_maturity_score >= 80 THEN 'A'
      WHEN c.digital_maturity_score >= 70 THEN 'B'
      WHEN c.digital_maturity_score >= 60 THEN 'C'
      ELSE 'D'
    END as grade,
    'new' as pipeline_status
  FROM companies c
  WHERE c.prospect_status = 'qualified';

CREATE OR REPLACE VIEW v_quarantine AS 
  SELECT 
    c.*,
    c.id as icp_analysis_id,
    c.name as razao_social,
    c.name as nome_fantasia,
    c.industry as sector,
    c.location->>'city' as city,
    c.location->>'state' as state,
    c.raw_data->>'icp_score' as icp_score,
    c.raw_data->>'temperatura' as temperatura
  FROM companies c
  WHERE c.prospect_status = 'in_quarantine';

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_companies_prospect_status ON companies(prospect_status);
CREATE INDEX IF NOT EXISTS idx_qualified_prospects_purchase_intent ON qualified_prospects USING gin(purchase_intent_analysis);

-- 5. COMENTÁRIOS
COMMENT ON COLUMN companies.prospect_status IS 'Status do prospect no pipeline: new, qualified, in_quarantine, approved, pipeline, closed';
COMMENT ON COLUMN qualified_prospects.purchase_intent_analysis IS 'Análise completa de intenção de compra (JSON)';

