-- ==========================================
-- GARANTIR TODAS AS COLUNAS NECESSÁRIAS EM icp_analysis_results
-- ==========================================
-- Esta migration garante que icp_analysis_results tenha TODAS as colunas
-- necessárias para receber dados de companies, permitindo migração completa
-- ==========================================
-- OBJETIVO: Permitir migração de dados entre companies e icp_analysis_results
-- sem perda de informações e sem erros de schema
-- ==========================================

-- ==========================================
-- 1. COLUNAS DE WEBSITE E LINKEDIN (já devem existir, mas garantimos)
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
-- 2. COLUNAS DE FIT SCORE E PURCHASE INTENT
-- ==========================================
DO $$ 
BEGIN
  -- Fit Score (score de compatibilidade com ICP)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'fit_score'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN fit_score numeric(5,2);
    RAISE NOTICE 'Coluna fit_score adicionada em icp_analysis_results';
  END IF;
  
  -- Purchase Intent Score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'purchase_intent_score'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN purchase_intent_score numeric(5,2) DEFAULT 0;
    RAISE NOTICE 'Coluna purchase_intent_score adicionada em icp_analysis_results';
  END IF;
  
  -- Purchase Intent Type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'purchase_intent_type'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN purchase_intent_type text DEFAULT 'potencial';
    RAISE NOTICE 'Coluna purchase_intent_type adicionada em icp_analysis_results';
  END IF;
END $$;

-- ==========================================
-- 3. COLUNA tenant_id (CRÍTICA PARA MULTI-TENANCY)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN tenant_id UUID;
    RAISE NOTICE 'Coluna tenant_id adicionada em icp_analysis_results';
    
    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_icp_analysis_results_tenant_id 
      ON public.icp_analysis_results(tenant_id);
  END IF;
END $$;

-- ==========================================
-- 4. COLUNA totvs_status (status do TOTVS)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'totvs_status'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN totvs_status text;
    RAISE NOTICE 'Coluna totvs_status adicionada em icp_analysis_results';
  END IF;
END $$;

-- ==========================================
-- 5. REMOVER CHECK CONSTRAINT DA COLUNA origem (se ainda existir)
-- ==========================================
DO $$
BEGIN
  -- Remover constraint antigo que limita valores
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND constraint_name = 'icp_analysis_results_origem_check'
  ) THEN
    ALTER TABLE public.icp_analysis_results 
      DROP CONSTRAINT icp_analysis_results_origem_check;
    RAISE NOTICE 'Constraint icp_analysis_results_origem_check removido';
  END IF;
END $$;

-- ==========================================
-- 6. GARANTIR QUE company_id EXISTE (já deve existir, mas garantimos)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.icp_analysis_results 
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Coluna company_id adicionada em icp_analysis_results';
    
    -- Criar índice
    CREATE INDEX IF NOT EXISTS idx_icp_analysis_results_company_id 
      ON public.icp_analysis_results(company_id);
  END IF;
END $$;

-- ==========================================
-- 7. GARANTIR QUE raw_analysis EXISTE (já deve existir, mas garantimos)
-- ==========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'raw_analysis'
  ) THEN
    ALTER TABLE public.icp_analysis_results 
      ADD COLUMN raw_analysis jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Coluna raw_analysis adicionada em icp_analysis_results';
  END IF;
END $$;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================
COMMENT ON COLUMN public.icp_analysis_results.website_encontrado IS 'Website oficial da empresa encontrado automaticamente via SERPER';
COMMENT ON COLUMN public.icp_analysis_results.website_fit_score IS 'Score de fit baseado em produtos encontrados no website (0-20 pontos)';
COMMENT ON COLUMN public.icp_analysis_results.website_products_match IS 'Array de produtos compatíveis encontrados no website';
COMMENT ON COLUMN public.icp_analysis_results.linkedin_url IS 'URL do LinkedIn da empresa (se encontrado)';
COMMENT ON COLUMN public.icp_analysis_results.fit_score IS 'Score de compatibilidade com ICP (0-100)';
COMMENT ON COLUMN public.icp_analysis_results.purchase_intent_score IS 'Score de intenção de compra (0-100)';
COMMENT ON COLUMN public.icp_analysis_results.purchase_intent_type IS 'Tipo de intenção de compra (potencial, quente, frio)';
COMMENT ON COLUMN public.icp_analysis_results.tenant_id IS 'ID do tenant (multi-tenancy)';
COMMENT ON COLUMN public.icp_analysis_results.totvs_status IS 'Status da verificação TOTVS';
COMMENT ON COLUMN public.icp_analysis_results.origem IS 'Origem da empresa: nome do arquivo de upload (job_name) ou tipo de origem';

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
DO $$
DECLARE
  missing_cols text[];
BEGIN
  -- Verificar se todas as colunas críticas existem
  SELECT array_agg(DISTINCT column_name)
  INTO missing_cols
  FROM (
    SELECT 'website_encontrado' as column_name
    UNION ALL SELECT 'website_fit_score'
    UNION ALL SELECT 'website_products_match'
    UNION ALL SELECT 'linkedin_url'
    UNION ALL SELECT 'fit_score'
    UNION ALL SELECT 'purchase_intent_score'
    UNION ALL SELECT 'purchase_intent_type'
    UNION ALL SELECT 'tenant_id'
    UNION ALL SELECT 'totvs_status'
    UNION ALL SELECT 'company_id'
    UNION ALL SELECT 'raw_analysis'
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = 'icp_analysis_results'
    AND c.column_name = expected.column_name
  );
  
  IF missing_cols IS NOT NULL AND array_length(missing_cols, 1) > 0 THEN
    RAISE WARNING 'Ainda existem colunas faltantes: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as colunas necessárias foram verificadas e existem em icp_analysis_results';
  END IF;
END $$;




