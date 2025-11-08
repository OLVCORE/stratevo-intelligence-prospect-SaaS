-- ========================================
-- CRIAR TABELA sdr_deals COMPLETA DE UMA VEZ
-- ========================================
-- Analisando TODO o código que usa sdr_deals
-- Criando TODOS os campos necessários
-- ========================================

-- 1. DROPAR tabela existente (SE NECESSÁRIO)
-- DROP TABLE IF EXISTS sdr_deals CASCADE;

-- 2. CRIAR TABELA COMPLETA
CREATE TABLE IF NOT EXISTS sdr_deals (
  -- IDs e Relacionamentos
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID,
  lead_qualified_id UUID,
  
  -- Informações do Deal
  deal_title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  
  -- Pipeline e Status
  deal_stage TEXT NOT NULL DEFAULT 'discovery',
  deal_value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 30,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Datas
  expected_close_date DATE,
  won_date TIMESTAMP WITH TIME ZONE,
  lost_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Atribuição e Tracking
  assigned_sdr TEXT,
  source TEXT,
  lead_score NUMERIC DEFAULT 0,
  
  -- Metadados
  raw_data JSONB
);

-- 3. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_deal_stage ON sdr_deals(deal_stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_priority ON sdr_deals(priority);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned_sdr ON sdr_deals(assigned_sdr);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_created_at ON sdr_deals(created_at DESC);

-- 4. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_sdr_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sdr_deals_updated_at ON sdr_deals;
CREATE TRIGGER trigger_update_sdr_deals_updated_at
  BEFORE UPDATE ON sdr_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_sdr_deals_updated_at();

-- 5. RLS (Row Level Security)
ALTER TABLE sdr_deals ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler
DROP POLICY IF EXISTS "Enable read access for all users" ON sdr_deals;
CREATE POLICY "Enable read access for all users" 
  ON sdr_deals FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy: Todos podem inserir
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sdr_deals;
CREATE POLICY "Enable insert for authenticated users" 
  ON sdr_deals FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy: Todos podem atualizar
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sdr_deals;
CREATE POLICY "Enable update for authenticated users" 
  ON sdr_deals FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Policy: Todos podem deletar
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sdr_deals;
CREATE POLICY "Enable delete for authenticated users" 
  ON sdr_deals FOR DELETE 
  TO authenticated 
  USING (true);

-- 6. VERIFICAR SCHEMA FINAL
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- ========================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ========================================
-- IMPORTANTE: Se a tabela já existe com dados,
-- use ALTER TABLE ao invés de CREATE TABLE
-- ========================================

