-- ========================================
-- MIGRATION: REBUILD stc_verification_history SCHEMA
-- PROBLEMA: PGRST204 - Múltiplas colunas não encontradas no cache
-- SOLUÇÃO: Recriar tabela com TODAS as colunas necessárias
-- ========================================

-- PASSO 1: Backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS stc_verification_history_backup AS 
SELECT * FROM stc_verification_history WHERE false;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM stc_verification_history LIMIT 1) THEN
        INSERT INTO stc_verification_history_backup 
        SELECT * FROM stc_verification_history;
        
        RAISE NOTICE 'Backup criado com % registros', 
            (SELECT COUNT(*) FROM stc_verification_history_backup);
    END IF;
END $$;

-- PASSO 2: Drop e Recreate (garantir schema limpo)
DROP TABLE IF EXISTS stc_verification_history CASCADE;

-- PASSO 3: Criar tabela com TODAS as colunas necessárias
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

-- PASSO 4: Criar índices para performance
CREATE INDEX idx_stc_history_company ON stc_verification_history(company_id);
CREATE INDEX idx_stc_history_status ON stc_verification_history(status);
CREATE INDEX idx_stc_history_created ON stc_verification_history(created_at DESC);
CREATE INDEX idx_stc_history_company_created ON stc_verification_history(company_id, created_at DESC);
CREATE INDEX idx_stc_history_full_report ON stc_verification_history USING GIN (full_report);

-- PASSO 5: Configurar RLS
ALTER TABLE stc_verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to view stc history" ON stc_verification_history;
DROP POLICY IF EXISTS "Allow authenticated to insert stc history" ON stc_verification_history;

CREATE POLICY "Allow authenticated to view stc history" 
ON stc_verification_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to insert stc history" 
ON stc_verification_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated to update stc history" 
ON stc_verification_history FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- PASSO 6: Adicionar comentários para documentação
COMMENT ON TABLE stc_verification_history IS 'Histórico completo de todas as verificações STC (TOTVS Check) realizadas';
COMMENT ON COLUMN stc_verification_history.status IS 'Status da verificação: go (prospect), no-go (já cliente), revisar (incerto)';
COMMENT ON COLUMN stc_verification_history.confidence IS 'Nível de confiança: high, medium, low';
COMMENT ON COLUMN stc_verification_history.triple_matches IS 'Matches com Empresa + TOTVS + Produto';
COMMENT ON COLUMN stc_verification_history.double_matches IS 'Matches com Empresa + TOTVS';
COMMENT ON COLUMN stc_verification_history.single_matches IS 'Matches apenas com Empresa ou TOTVS';
COMMENT ON COLUMN stc_verification_history.evidences IS 'Array de evidências encontradas (snippets, URLs)';
COMMENT ON COLUMN stc_verification_history.full_report IS 'Relatório completo com detection + decisors + digital para reabertura sem consumir créditos';

-- PASSO 7: Restaurar dados do backup (se houver)
DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM stc_verification_history_backup;
    
    IF backup_count > 0 THEN
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
        FROM stc_verification_history_backup;
        
        RAISE NOTICE 'Dados restaurados: % registros', backup_count;
    END IF;
END $$;

-- PASSO 8: Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- PASSO 9: Validar estrutura final
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'stc_verification_history';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE 'Tabela: stc_verification_history';
    RAISE NOTICE 'Colunas: %', col_count;
    RAISE NOTICE '========================================';
END $$;

-- PASSO 10: Mostrar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stc_verification_history'
ORDER BY ordinal_position;

