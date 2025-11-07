-- ========================================
-- 🚨 EXECUTAR NO SUPABASE SQL EDITOR
-- ========================================
-- COPIE E COLE TODO ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Dashboard → SQL Editor → New Query → Cole aqui → RUN
-- ========================================

-- PASSO 1: Verificar estrutura ATUAL da tabela
SELECT 
    '=== ESTRUTURA ATUAL ===' AS info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stc_verification_history'
ORDER BY ordinal_position;

-- PASSO 2: Contar registros existentes
SELECT 
    '=== REGISTROS EXISTENTES ===' AS info,
    COUNT(*) AS total_registros,
    COUNT(DISTINCT company_id) AS empresas_unicas,
    COUNT(CASE WHEN status = 'go' THEN 1 END) AS go_count,
    COUNT(CASE WHEN status = 'no-go' THEN 1 END) AS no_go_count
FROM stc_verification_history;

-- PASSO 3: Backup completo (SEGURANÇA)
CREATE TABLE IF NOT EXISTS stc_verification_history_backup_20251107 AS 
SELECT * FROM stc_verification_history;

SELECT '=== BACKUP CRIADO ===' AS info, COUNT(*) AS registros_backup 
FROM stc_verification_history_backup_20251107;

-- PASSO 4: Drop e Recreate com schema correto
DROP TABLE IF EXISTS stc_verification_history CASCADE;

CREATE TABLE stc_verification_history (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    
    -- Resultados da verificação
    status TEXT NOT NULL,
    confidence TEXT DEFAULT 'medium',
    
    -- Métricas de matches
    triple_matches INTEGER DEFAULT 0,
    double_matches INTEGER DEFAULT 0,
    single_matches INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    
    -- Evidências e dados brutos
    evidences JSONB DEFAULT '[]'::jsonb,
    full_report JSONB DEFAULT '{}'::jsonb,
    
    -- Metadados de execução
    sources_consulted INTEGER DEFAULT 0,
    queries_executed INTEGER DEFAULT 0,
    verification_duration_ms INTEGER,
    
    -- Auditoria
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 5: Criar índices
CREATE INDEX idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX idx_stc_history_created ON stc_verification_history(created_at DESC);
CREATE INDEX idx_stc_history_company_created ON stc_verification_history(company_id, created_at DESC);
CREATE INDEX idx_stc_history_full_report ON stc_verification_history USING GIN (full_report);

-- PASSO 6: RLS Policies
ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated to update stc history" 
ON stc_verification_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- PASSO 7: Comentários
COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações STC (TOTVS Check)';
COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório completo com detection + decisors + digital';

-- PASSO 8: Restaurar dados do backup
INSERT INTO stc_verification_history (
    id, company_id, company_name, cnpj, status, confidence,
    triple_matches, double_matches, single_matches, total_score,
    evidences, full_report, sources_consulted, queries_executed,
    verification_duration_ms, verified_by, created_at
)
SELECT 
    id, company_id, company_name, cnpj,
    COALESCE(status, 'unknown'),
    COALESCE(confidence, 'medium'),
    COALESCE(triple_matches, 0),
    COALESCE(double_matches, 0),
    COALESCE(single_matches, 0),
    COALESCE(total_score, 0),
    COALESCE(evidences, '[]'::jsonb),
    COALESCE(full_report, '{}'::jsonb),
    COALESCE(sources_consulted, 0),
    COALESCE(queries_executed, 0),
    verification_duration_ms,
    verified_by,
    created_at
FROM stc_verification_history_backup_20251107;

-- PASSO 9: Forçar reload do schema cache
NOTIFY pgrst, 'reload schema';

-- PASSO 10: VALIDAÇÃO FINAL
SELECT '=== NOVA ESTRUTURA ===' AS info, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stc_verification_history'
ORDER BY ordinal_position;

SELECT '=== DADOS RESTAURADOS ===' AS info, COUNT(*) AS registros 
FROM stc_verification_history;

SELECT '=== ✅ MIGRATION CONCLUÍDA COM SUCESSO! ===' AS resultado;

