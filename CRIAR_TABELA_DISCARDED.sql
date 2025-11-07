-- ========================================
-- CRIAR TABELA discarded_companies
-- ========================================
-- COPIE E COLE NO SUPABASE SQL EDITOR
-- ========================================

CREATE TABLE IF NOT EXISTS discarded_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  discard_reason_id TEXT NOT NULL,
  discard_reason_label TEXT NOT NULL,
  discard_reason_description TEXT,
  discard_category TEXT NOT NULL,
  stc_status TEXT,
  stc_confidence TEXT,
  stc_triple_matches INTEGER DEFAULT 0,
  stc_double_matches INTEGER DEFAULT 0,
  stc_total_score INTEGER DEFAULT 0,
  discarded_by UUID,
  discarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  original_icp_score INTEGER,
  original_icp_temperature TEXT
);

CREATE INDEX IF NOT EXISTS idx_discarded_company ON discarded_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_discarded_reason ON discarded_companies(discard_reason_id);
CREATE INDEX IF NOT EXISTS idx_discarded_category ON discarded_companies(discard_category);
CREATE INDEX IF NOT EXISTS idx_discarded_date ON discarded_companies(discarded_at DESC);

ALTER TABLE discarded_companies ENABLE ROW LEVEL SECURITY;

-- Policy idempotente (verifica se existe antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'discarded_companies'
      AND policyname = 'Allow authenticated to manage discarded'
  ) THEN
    CREATE POLICY "Allow authenticated to manage discarded"
      ON discarded_companies FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

COMMENT ON TABLE discarded_companies IS 'Histórico de empresas descartadas (arquivo morto)';

SELECT '=== ✅ TABELA discarded_companies CRIADA! ===' AS resultado;

