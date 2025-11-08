-- ========================================
-- ADICIONAR TODOS OS CAMPOS FALTANTES NA TABELA sdr_deals
-- ========================================
-- Baseado na análise de TODO o código que usa sdr_deals
-- ========================================

-- 1. CAMPOS DE RELACIONAMENTO
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS lead_qualified_id UUID;

-- 2. CAMPOS DE STATUS E TRACKING
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS lead_score NUMERIC DEFAULT 0;
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS won_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS lost_date TIMESTAMP WITH TIME ZONE;

-- 3. CAMPOS DE METADADOS
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- 4. GARANTIR QUE notes EXISTE (alguns códigos usam)
ALTER TABLE sdr_deals ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. CRIAR ÍNDICES (SE NÃO EXISTIREM)
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company_id ON sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_deal_stage ON sdr_deals(deal_stage);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_priority ON sdr_deals(priority);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_assigned_sdr ON sdr_deals(assigned_sdr);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_created_at ON sdr_deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_contact_id ON sdr_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_source ON sdr_deals(source);

-- 6. TRIGGER PARA ATUALIZAR updated_at (SE NÃO EXISTIR)
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

-- 7. VERIFICAR SCHEMA FINAL
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- ========================================
-- EXECUTAR NO SUPABASE SQL EDITOR AGORA
-- ========================================

