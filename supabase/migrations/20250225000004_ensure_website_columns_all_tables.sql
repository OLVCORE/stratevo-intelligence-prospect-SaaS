-- ==========================================
-- GARANTIR COLUNAS DE WEBSITE EM TODAS AS TABELAS
-- ==========================================
-- Esta migration garante que as colunas website_encontrado, website_fit_score,
-- website_products_match e linkedin_url existam IDENTICAMENTE em todas as tabelas:
-- 1. qualified_prospects (Estoque Qualificado)
-- 2. companies (Base de Empresas)
-- 3. icp_analysis_results (Quarentena ICP e Leads Aprovados)
-- ==========================================
-- OBJETIVO: Permitir migração de dados entre tabelas sem perda de informações
-- ==========================================

-- ==========================================
-- 1. TABELA: qualified_prospects
-- ==========================================
DO $$ 
BEGIN
  -- Website encontrado automaticamente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'qualified_prospects' 
    AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE public.qualified_prospects ADD COLUMN website_encontrado text;
    RAISE NOTICE 'Coluna website_encontrado adicionada em qualified_prospects';
  END IF;
  
  -- Score de fit do website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'qualified_prospects' 
    AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE public.qualified_prospects ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
    RAISE NOTICE 'Coluna website_fit_score adicionada em qualified_prospects';
  END IF;
  
  -- Produtos compatíveis encontrados no website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'qualified_prospects' 
    AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE public.qualified_prospects ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Coluna website_products_match adicionada em qualified_prospects';
  END IF;
  
  -- LinkedIn da empresa (se encontrado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'qualified_prospects' 
    AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE public.qualified_prospects ADD COLUMN linkedin_url text;
    RAISE NOTICE 'Coluna linkedin_url adicionada em qualified_prospects';
  END IF;
END $$;

-- ==========================================
-- 2. TABELA: companies (Base de Empresas)
-- ==========================================
DO $$ 
BEGIN
  -- Website encontrado automaticamente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN website_encontrado text;
    RAISE NOTICE 'Coluna website_encontrado adicionada em companies';
  END IF;
  
  -- Score de fit do website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
    RAISE NOTICE 'Coluna website_fit_score adicionada em companies';
  END IF;
  
  -- Produtos compatíveis encontrados no website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Coluna website_products_match adicionada em companies';
  END IF;
  
  -- LinkedIn da empresa (se encontrado) - verificar se já existe linkedin_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN linkedin_url text;
    RAISE NOTICE 'Coluna linkedin_url adicionada em companies';
  END IF;
END $$;

-- ==========================================
-- 3. TABELA: icp_analysis_results (Quarentena ICP e Leads Aprovados)
-- ==========================================
DO $$ 
BEGIN
  -- Website encontrado automaticamente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'website_encontrado'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN website_encontrado text;
    RAISE NOTICE 'Coluna website_encontrado adicionada em icp_analysis_results';
  END IF;
  
  -- Score de fit do website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'website_fit_score'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN website_fit_score numeric(5,2) DEFAULT 0;
    RAISE NOTICE 'Coluna website_fit_score adicionada em icp_analysis_results';
  END IF;
  
  -- Produtos compatíveis encontrados no website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'website_products_match'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN website_products_match jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Coluna website_products_match adicionada em icp_analysis_results';
  END IF;
  
  -- LinkedIn da empresa (se encontrado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN linkedin_url text;
    RAISE NOTICE 'Coluna linkedin_url adicionada em icp_analysis_results';
  END IF;
END $$;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================
COMMENT ON COLUMN public.qualified_prospects.website_encontrado IS 'Website oficial da empresa encontrado automaticamente via SERPER';
COMMENT ON COLUMN public.qualified_prospects.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN public.qualified_prospects.website_products_match IS 'Array de produtos compatíveis encontrados no website';
COMMENT ON COLUMN public.qualified_prospects.linkedin_url IS 'URL do LinkedIn da empresa (se encontrado)';

COMMENT ON COLUMN public.companies.website_encontrado IS 'Website oficial da empresa encontrado automaticamente via SERPER';
COMMENT ON COLUMN public.companies.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN public.companies.website_products_match IS 'Array de produtos compatíveis encontrados no website';
COMMENT ON COLUMN public.companies.linkedin_url IS 'URL do LinkedIn da empresa (se encontrado)';

COMMENT ON COLUMN public.icp_analysis_results.website_encontrado IS 'Website oficial da empresa encontrado automaticamente via SERPER';
COMMENT ON COLUMN public.icp_analysis_results.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN public.icp_analysis_results.website_products_match IS 'Array de produtos compatíveis encontrados no website';
COMMENT ON COLUMN public.icp_analysis_results.linkedin_url IS 'URL do LinkedIn da empresa (se encontrado)';

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
DO $$
DECLARE
  missing_cols text[];
BEGIN
  -- Verificar se todas as colunas existem em todas as tabelas
  SELECT array_agg(DISTINCT table_name || '.' || column_name)
  INTO missing_cols
  FROM (
    SELECT 'qualified_prospects' as table_name, 'website_encontrado' as column_name
    UNION ALL SELECT 'qualified_prospects', 'website_fit_score'
    UNION ALL SELECT 'qualified_prospects', 'website_products_match'
    UNION ALL SELECT 'qualified_prospects', 'linkedin_url'
    UNION ALL SELECT 'companies', 'website_encontrado'
    UNION ALL SELECT 'companies', 'website_fit_score'
    UNION ALL SELECT 'companies', 'website_products_match'
    UNION ALL SELECT 'companies', 'linkedin_url'
    UNION ALL SELECT 'icp_analysis_results', 'website_encontrado'
    UNION ALL SELECT 'icp_analysis_results', 'website_fit_score'
    UNION ALL SELECT 'icp_analysis_results', 'website_products_match'
    UNION ALL SELECT 'icp_analysis_results', 'linkedin_url'
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = expected.table_name
    AND c.column_name = expected.column_name
  );
  
  IF missing_cols IS NOT NULL AND array_length(missing_cols, 1) > 0 THEN
    RAISE WARNING 'Ainda existem colunas faltantes: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as colunas de website foram verificadas e existem em todas as tabelas';
  END IF;
END $$;
