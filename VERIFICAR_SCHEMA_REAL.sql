-- ============================================================================
-- VERIFICAR SCHEMA REAL DO SUPABASE
-- Copie e cole NO SUPABASE SQL EDITOR para ver a estrutura real
-- ============================================================================

-- 1. VERIFICAR COLUNAS DA TABELA companies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- 2. VERIFICAR COLUNAS DA TABELA icp_analysis_results
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'icp_analysis_results'
ORDER BY ordinal_position;

-- 3. VERIFICAR COLUNAS DA TABELA sdr_deals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- 4. VERIFICAR COLUNAS DA TABELA sdr_pipeline_stages
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sdr_pipeline_stages'
ORDER BY ordinal_position;

-- 5. VERIFICAR COLUNAS DA TABELA discarded_companies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discarded_companies'
ORDER BY ordinal_position;

-- 6. LISTAR TODAS AS TABELAS PÚBLICAS
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

