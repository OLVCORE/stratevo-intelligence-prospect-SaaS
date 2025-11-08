-- ============================================================
-- ADICIONAR CAMPOS DE RASTREABILIDADE NA TABELA COMPANIES
-- ============================================================
-- Execução: Copiar e colar no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar campos de rastreabilidade
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS import_batch_id UUID,
ADD COLUMN IF NOT EXISTS import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_source_type ON companies(source_type);
CREATE INDEX IF NOT EXISTS idx_companies_source_name ON companies(source_name);
CREATE INDEX IF NOT EXISTS idx_companies_import_batch ON companies(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_companies_import_date ON companies(import_date);

-- 3. Comentários para documentação
COMMENT ON COLUMN companies.source_type IS 'Tipo de origem: csv, manual, api, enrichment';
COMMENT ON COLUMN companies.source_name IS 'Nome do arquivo CSV ou fonte de dados';
COMMENT ON COLUMN companies.import_batch_id IS 'ID único do lote de importação';
COMMENT ON COLUMN companies.import_date IS 'Data e hora da importação';
COMMENT ON COLUMN companies.source_metadata IS 'Metadata adicional: {file_name, upload_user, campaign, notes}';

-- 4. Atualizar empresas existentes (opcional - marcar como 'legacy')
UPDATE companies 
SET 
  source_type = 'legacy',
  source_name = 'Dados Anteriores à Implementação',
  import_date = created_at
WHERE source_type IS NULL OR source_type = 'manual';

-- ============================================================
-- ADICIONAR RASTREABILIDADE NA TABELA ICP_ANALYSIS_RESULTS
-- ============================================================

ALTER TABLE icp_analysis_results 
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS import_batch_id UUID;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_icp_source_type ON icp_analysis_results(source_type);
CREATE INDEX IF NOT EXISTS idx_icp_source_name ON icp_analysis_results(source_name);
CREATE INDEX IF NOT EXISTS idx_icp_import_batch ON icp_analysis_results(import_batch_id);

-- ============================================================
-- ADICIONAR RASTREABILIDADE NA TABELA SDR_DEALS
-- ============================================================

ALTER TABLE sdr_deals 
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS source_campaign TEXT,
ADD COLUMN IF NOT EXISTS import_batch_id UUID;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_deals_lead_source ON sdr_deals(lead_source);
CREATE INDEX IF NOT EXISTS idx_deals_source_campaign ON sdr_deals(source_campaign);

-- Comentários
COMMENT ON COLUMN sdr_deals.lead_source IS 'Origem do lead (mesmo que source_name da empresa)';
COMMENT ON COLUMN sdr_deals.source_campaign IS 'Campanha de origem';

-- ============================================================
-- VERIFICAR CAMPOS ADICIONADOS
-- ============================================================

SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name IN ('source_type', 'source_name', 'import_batch_id', 'import_date', 'source_metadata')
ORDER BY ordinal_position;

-- ============================================================
-- QUERY PARA TESTAR RASTREABILIDADE
-- ============================================================

SELECT 
  company_name,
  cnpj,
  source_type,
  source_name,
  import_date,
  source_metadata->>'campaign' as campaign,
  created_at
FROM companies
ORDER BY import_date DESC
LIMIT 10;

-- ✅ SUCESSO! Campos de rastreabilidade adicionados.
-- 📋 Próximo passo: Modificar interface de upload para capturar source_name

