-- ============================================================================
-- VALIDAÇÃO: Migration Setor/Nicho e ICP Match
-- ============================================================================
-- Execute este script após aplicar a migration para validar que tudo foi criado corretamente
-- ============================================================================

-- ==========================================
-- 1. VERIFICAR COLUNAS EM companies
-- ==========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name IN (
    'sector_code',
    'sector_name',
    'niche_code',
    'niche_name',
    'icp_match_score',
    'icp_match_tier',
    'icp_match_reasons'
  )
ORDER BY column_name;

-- ==========================================
-- 2. VERIFICAR COLUNAS EM tenants
-- ==========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
  AND column_name IN (
    'icp_sectors',
    'icp_niches',
    'icp_cnaes',
    'endereco_logradouro',
    'endereco_numero',
    'endereco_complemento',
    'endereco_bairro',
    'endereco_cep',
    'endereco_cidade',
    'endereco_estado',
    'endereco_pais',
    'coordenadas_gps',
    'regiao_vendas',
    'data_abertura',
    'situacao_cadastral',
    'natureza_juridica',
    'capital_social'
  )
ORDER BY column_name;

-- ==========================================
-- 3. VERIFICAR CONSTRAINTS CHECK
-- ==========================================
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.companies'::regclass
  AND conname IN (
    'companies_icp_match_score_check',
    'companies_icp_match_tier_check'
  );

-- ==========================================
-- 4. VERIFICAR ÍNDICES
-- ==========================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'tenants')
  AND indexname LIKE '%sector%' 
     OR indexname LIKE '%niche%'
     OR indexname LIKE '%icp%'
     OR indexname LIKE '%endereco%'
ORDER BY tablename, indexname;

-- ==========================================
-- 5. VERIFICAR FUNÇÕES
-- ==========================================
SELECT 
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'classify_company_by_cnae',
    'calculate_icp_match_score',
    'auto_classify_company'
  )
ORDER BY routine_name;

-- ==========================================
-- 6. VERIFICAR TRIGGERS
-- ==========================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_auto_classify_company';

-- ==========================================
-- 7. RESUMO GERAL
-- ==========================================
SELECT 
  'Colunas em companies' AS tipo,
  COUNT(*) AS quantidade
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'companies'
  AND column_name IN ('sector_code', 'sector_name', 'niche_code', 'niche_name', 'icp_match_score', 'icp_match_tier', 'icp_match_reasons')

UNION ALL

SELECT 
  'Colunas em tenants' AS tipo,
  COUNT(*) AS quantidade
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tenants'
  AND column_name IN ('icp_sectors', 'icp_niches', 'icp_cnaes', 'endereco_logradouro', 'endereco_numero', 'endereco_complemento', 'endereco_bairro', 'endereco_cep', 'endereco_cidade', 'endereco_estado', 'endereco_pais', 'coordenadas_gps', 'regiao_vendas', 'data_abertura', 'situacao_cadastral', 'natureza_juridica', 'capital_social')

UNION ALL

SELECT 
  'Constraints CHECK' AS tipo,
  COUNT(*) AS quantidade
FROM pg_constraint
WHERE conrelid = 'public.companies'::regclass
  AND conname IN ('companies_icp_match_score_check', 'companies_icp_match_tier_check')

UNION ALL

SELECT 
  'Índices' AS tipo,
  COUNT(*) AS quantidade
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'tenants')
  AND (indexname LIKE '%sector%' OR indexname LIKE '%niche%' OR indexname LIKE '%icp%' OR indexname LIKE '%endereco%')

UNION ALL

SELECT 
  'Funções' AS tipo,
  COUNT(*) AS quantidade
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('classify_company_by_cnae', 'calculate_icp_match_score', 'auto_classify_company')

UNION ALL

SELECT 
  'Triggers' AS tipo,
  COUNT(*) AS quantidade
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_auto_classify_company';

