-- ============================================================================
-- SCRIPT COMPLETO CORRIGIDO: Criar TUDO que está faltando no projeto
-- ============================================================================
-- VERSÃO CORRIGIDA: Verifica colunas antes de criar índices
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR FUNÇÕES RPC (CRÍTICO - PRIMEIRO)
-- ============================================================================

-- 1. get_user_tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.tenant_id 
  FROM public.users u 
  WHERE u.auth_user_id = auth.uid() 
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon, authenticated;

-- 2. get_sectors_niches (TABLE)
CREATE OR REPLACE FUNCTION public.get_sectors_niches()
RETURNS TABLE (
  sector_code text,
  sector_name text,
  description text,
  niche_code text,
  niche_name text,
  niche_description text,
  keywords text[],
  cnaes text[],
  ncms text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    s.sector_code,
    s.sector_name,
    s.description,
    n.niche_code,
    n.niche_name,
    n.description as niche_description,
    n.keywords,
    n.cnaes,
    n.ncms
  FROM public.sectors s
  LEFT JOIN public.niches n ON n.sector_code = s.sector_code
  ORDER BY s.sector_name, n.niche_name;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon, authenticated;

-- 3. get_sectors_niches_json (JSONB)
CREATE OR REPLACE FUNCTION public.get_sectors_niches_json()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'sectors', COALESCE(
      (SELECT jsonb_agg(s ORDER BY s.sector_name) 
       FROM public.sectors s),
      '[]'::jsonb
    ),
    'niches', COALESCE(
      (SELECT jsonb_agg(n ORDER BY n.niche_name) 
       FROM public.niches n),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches_json() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO anon, authenticated;

-- 4. log_api_call
CREATE OR REPLACE FUNCTION public.log_api_call(
  p_report_id uuid DEFAULT NULL,
  p_job_id uuid DEFAULT NULL,
  p_provider text DEFAULT NULL,
  p_endpoint text DEFAULT NULL,
  p_status_code integer DEFAULT NULL,
  p_cost_usd numeric DEFAULT 0,
  p_duration_ms integer DEFAULT 0,
  p_success boolean DEFAULT true,
  p_request_body jsonb DEFAULT NULL,
  p_response_body jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_call_logs') THEN
    CREATE TABLE public.api_call_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      report_id uuid,
      job_id uuid,
      provider text,
      endpoint text,
      status_code integer,
      cost_usd numeric DEFAULT 0,
      duration_ms integer DEFAULT 0,
      success boolean DEFAULT true,
      request_body jsonb,
      response_body jsonb,
      error_message text,
      created_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX idx_api_call_logs_report ON public.api_call_logs(report_id);
    CREATE INDEX idx_api_call_logs_job ON public.api_call_logs(job_id);
    CREATE INDEX idx_api_call_logs_provider ON public.api_call_logs(provider);
    
    ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY api_call_logs_read ON public.api_call_logs
      FOR SELECT TO authenticated
      USING (true);
  END IF;
  
  INSERT INTO public.api_call_logs (
    report_id, job_id, provider, endpoint, status_code,
    cost_usd, duration_ms, success, request_body, response_body, error_message
  ) VALUES (
    p_report_id, p_job_id, p_provider, p_endpoint, p_status_code,
    p_cost_usd, p_duration_ms, p_success, p_request_body, p_response_body, p_error_message
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_api_call FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_api_call TO authenticated, anon;

-- ============================================================================
-- PARTE 2: FUNÇÃO AUXILIAR PARA GARANTIR COLUNAS E ÍNDICES
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_column_and_index(
  p_table_name TEXT,
  p_column_name TEXT,
  p_column_type TEXT,
  p_index_name TEXT DEFAULT NULL,
  p_fk_table TEXT DEFAULT NULL,
  p_fk_column TEXT DEFAULT 'id'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_index_name TEXT;
BEGIN
  -- Verificar se tabela existe
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = p_table_name) THEN
    RAISE NOTICE 'Tabela % não existe, pulando...', p_table_name;
    RETURN;
  END IF;
  
  -- Adicionar coluna se não existir
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table_name
    AND column_name = p_column_name
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_type);
    RAISE NOTICE '✅ Coluna % adicionada à tabela %', p_column_name, p_table_name;
    
    -- Adicionar FK se especificado
    IF p_fk_table IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = p_table_name
        AND constraint_name LIKE '%' || p_column_name || '%'
      ) THEN
        EXECUTE format(
          'ALTER TABLE public.%I ADD CONSTRAINT %I_fkey FOREIGN KEY (%I) REFERENCES public.%I(%I) ON DELETE CASCADE',
          p_table_name, p_column_name, p_column_name, p_fk_table, p_fk_column
        );
        RAISE NOTICE '✅ FK adicionada: %.% → %.%', p_table_name, p_column_name, p_fk_table, p_fk_column;
      END IF;
    END IF;
  END IF;
  
  -- Criar índice se especificado e coluna existe
  IF p_index_name IS NOT NULL THEN
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
    ) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(%I)', p_index_name, p_table_name, p_column_name);
      RAISE NOTICE '✅ Índice % criado', p_index_name;
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- PARTE 3: CRIAR TABELAS FALTANTES (IDEMPOTENTE)
-- ============================================================================

-- Garantir que companies tem company_name
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
    PERFORM ensure_column_and_index('companies', 'company_name', 'TEXT', 'idx_companies_company_name');
    -- Atualizar company_name se NULL
    UPDATE public.companies SET company_name = name WHERE company_name IS NULL AND name IS NOT NULL;
  END IF;
END $$;

-- icp_analysis_results
CREATE TABLE IF NOT EXISTS public.icp_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  cnpj TEXT,
  razao_social TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'pendente',
  icp_score INTEGER DEFAULT 0,
  temperatura TEXT DEFAULT 'COLD',
  totvs_status TEXT,
  totvs_check_status TEXT,
  totvs_check_confidence TEXT,
  totvs_evidences JSONB DEFAULT '[]'::jsonb,
  totvs_check_reasoning TEXT,
  totvs_check_date TIMESTAMPTZ,
  simple_totvs_check TEXT,
  is_cliente_totvs BOOLEAN DEFAULT false,
  raw_analysis JSONB DEFAULT '{}'::jsonb,
  raw_data JSONB DEFAULT '{}'::jsonb,
  detection_report JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  analyzed_by UUID
);

-- Garantir índices para icp_analysis_results
DO $$
BEGIN
  PERFORM ensure_column_and_index('icp_analysis_results', 'company_id', 'UUID', 'idx_icp_analysis_company', 'companies');
  PERFORM ensure_column_and_index('icp_analysis_results', 'status', 'TEXT', 'idx_icp_analysis_status');
  PERFORM ensure_column_and_index('icp_analysis_results', 'cnpj', 'TEXT', 'idx_icp_analysis_cnpj');
  CREATE INDEX IF NOT EXISTS idx_icp_analysis_created ON public.icp_analysis_results(created_at DESC);
END $$;

-- stc_verification_history
CREATE TABLE IF NOT EXISTS public.stc_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  status TEXT NOT NULL,
  confidence TEXT DEFAULT 'medium',
  triple_matches INTEGER DEFAULT 0,
  double_matches INTEGER DEFAULT 0,
  single_matches INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  evidences JSONB DEFAULT '[]'::jsonb,
  full_report JSONB DEFAULT '{}'::jsonb,
  sources_consulted INTEGER DEFAULT 0,
  queries_executed INTEGER DEFAULT 0,
  verification_duration_ms INTEGER,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('stc_verification_history', 'company_id', 'UUID', 'idx_stc_history_company', 'companies');
  PERFORM ensure_column_and_index('stc_verification_history', 'status', 'TEXT', 'idx_stc_history_status');
  CREATE INDEX IF NOT EXISTS idx_stc_history_created ON public.stc_verification_history(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_stc_history_full_report ON public.stc_verification_history USING GIN (full_report);
END $$;

-- discarded_companies
CREATE TABLE IF NOT EXISTS public.discarded_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  cnpj TEXT,
  company_name TEXT,
  razao_social TEXT,
  reason TEXT,
  discarded_at TIMESTAMPTZ DEFAULT NOW(),
  discarded_by UUID,
  user_id UUID
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('discarded_companies', 'company_id', 'UUID', 'idx_discarded_companies_company', 'companies');
  CREATE INDEX IF NOT EXISTS idx_discarded_companies_discarded ON public.discarded_companies(discarded_at DESC);
END $$;

-- leads_pool
CREATE TABLE IF NOT EXISTS public.leads_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  cnpj TEXT,
  razao_social TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'novo',
  icp_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('leads_pool', 'company_id', 'UUID', 'idx_leads_pool_company', 'companies');
  PERFORM ensure_column_and_index('leads_pool', 'status', 'TEXT', 'idx_leads_pool_status');
END $$;

-- leads_qualified
CREATE TABLE IF NOT EXISTS public.leads_qualified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  qualified_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_by UUID,
  notes TEXT
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('leads_qualified', 'company_id', 'UUID', 'idx_leads_qualified_company', 'companies');
END $$;

-- suggested_companies (CORRIGIDO)
CREATE TABLE IF NOT EXISTS public.suggested_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cnpj TEXT,
  source TEXT,
  similarity_score NUMERIC,
  source_company_id UUID,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  -- Garantir coluna e FK
  PERFORM ensure_column_and_index('suggested_companies', 'source_company_id', 'UUID', 'idx_suggested_companies_source', 'companies');
  CREATE INDEX IF NOT EXISTS idx_suggested_companies_created ON public.suggested_companies(created_at DESC);
END $$;

-- similar_companies
CREATE TABLE IF NOT EXISTS public.similar_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  similar_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  similarity_score NUMERIC,
  similarity_reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('similar_companies', 'company_id', 'UUID', 'idx_similar_companies_company', 'companies');
  PERFORM ensure_column_and_index('similar_companies', 'similar_company_id', 'UUID', 'idx_similar_companies_similar', 'companies');
END $$;

-- simple_totvs_checks
CREATE TABLE IF NOT EXISTS public.simple_totvs_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT,
  confidence TEXT,
  evidences JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('simple_totvs_checks', 'company_id', 'UUID', 'idx_simple_totvs_company', 'companies');
END $$;

-- totvs_usage_detection
CREATE TABLE IF NOT EXISTS public.totvs_usage_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  products_detected TEXT[],
  confidence_score NUMERIC,
  detection_data JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('totvs_usage_detection', 'company_id', 'UUID', 'idx_totvs_usage_company', 'companies');
END $$;

-- digital_presence
CREATE TABLE IF NOT EXISTS public.digital_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  website TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  technologies TEXT[],
  seo_score NUMERIC,
  traffic_estimate INTEGER,
  presence_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('digital_presence', 'company_id', 'UUID', 'idx_digital_presence_company', 'companies');
END $$;

-- governance_signals
CREATE TABLE IF NOT EXISTS public.governance_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_data JSONB,
  confidence_score NUMERIC,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('governance_signals', 'company_id', 'UUID', 'idx_governance_signals_company', 'companies');
  PERFORM ensure_column_and_index('governance_signals', 'signal_type', 'TEXT', 'idx_governance_signals_type');
END $$;

-- insights
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type TEXT,
  insight_text TEXT,
  insight_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('insights', 'company_id', 'UUID', 'idx_insights_company', 'companies');
END $$;

-- sdr_deals
CREATE TABLE IF NOT EXISTS public.sdr_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'discovery',
  status TEXT DEFAULT 'open',
  value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0,
  sdr_id UUID,
  notes TEXT,
  deal_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('sdr_deals', 'company_id', 'UUID', 'idx_sdr_deals_company', 'companies');
  PERFORM ensure_column_and_index('sdr_deals', 'stage', 'TEXT', 'idx_sdr_deals_stage');
  PERFORM ensure_column_and_index('sdr_deals', 'status', 'TEXT', 'idx_sdr_deals_status');
END $$;

-- sdr_notifications
CREATE TABLE IF NOT EXISTS public.sdr_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  notification_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('sdr_notifications', 'user_id', 'UUID', 'idx_sdr_notifications_user');
  PERFORM ensure_column_and_index('sdr_notifications', 'read', 'BOOLEAN', 'idx_sdr_notifications_read');
END $$;

-- filter_presets
CREATE TABLE IF NOT EXISTS public.filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('filter_presets', 'user_id', 'UUID', 'idx_filter_presets_user');
END $$;

-- product_catalog
CREATE TABLE IF NOT EXISTS public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC,
  product_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('product_catalog', 'tenant_id', 'UUID', 'idx_product_catalog_tenant', 'tenants');
END $$;

-- tenant_products
CREATE TABLE IF NOT EXISTS public.tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,
  category TEXT,
  is_primary BOOLEAN DEFAULT false,
  product_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('tenant_products', 'tenant_id', 'UUID', 'idx_tenant_products_tenant', 'tenants');
END $$;

-- tenant_competitor_configs
CREATE TABLE IF NOT EXISTS public.tenant_competitor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_website TEXT,
  notes TEXT,
  config_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('tenant_competitor_configs', 'tenant_id', 'UUID', 'idx_tenant_competitor_tenant', 'tenants');
END $$;

-- tenant_search_configs
CREATE TABLE IF NOT EXISTS public.tenant_search_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL,
  search_params JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('tenant_search_configs', 'tenant_id', 'UUID', 'idx_tenant_search_configs_tenant', 'tenants');
END $$;

-- sector_configs
CREATE TABLE IF NOT EXISTS public.sector_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code TEXT NOT NULL,
  config_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('sector_configs', 'tenant_id', 'UUID', 'idx_sector_configs_tenant', 'tenants');
  PERFORM ensure_column_and_index('sector_configs', 'sector_code', 'TEXT', 'idx_sector_configs_sector');
END $$;

-- icp_profile
CREATE TABLE IF NOT EXISTS public.icp_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  setores_alvo JSONB DEFAULT '[]'::jsonb,
  cnaes_alvo JSONB DEFAULT '[]'::jsonb,
  porte_alvo JSONB DEFAULT '[]'::jsonb,
  estados_alvo JSONB DEFAULT '[]'::jsonb,
  regioes_alvo JSONB DEFAULT '[]'::jsonb,
  faturamento_min NUMERIC,
  faturamento_max NUMERIC,
  funcionarios_min INTEGER,
  funcionarios_max INTEGER,
  caracteristicas_buscar JSONB DEFAULT '[]'::jsonb,
  score_weights JSONB DEFAULT '{}'::jsonb,
  clientes_historico JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  PERFORM ensure_column_and_index('icp_profile', 'tenant_id', 'UUID', 'idx_icp_profile_tenant', 'tenants');
END $$;

-- ============================================================================
-- PARTE 4: CONFIGURAR RLS EM TODAS AS TABELAS
-- ============================================================================

DO $$
DECLARE
  tabela TEXT;
  tabelas_para_rls TEXT[] := ARRAY[
    'icp_analysis_results', 'stc_verification_history', 'discarded_companies',
    'leads_pool', 'leads_qualified', 'suggested_companies', 'similar_companies',
    'simple_totvs_checks', 'totvs_usage_detection', 'digital_presence',
    'governance_signals', 'insights', 'sdr_deals', 'sdr_notifications',
    'filter_presets', 'product_catalog', 'tenant_products',
    'tenant_competitor_configs', 'tenant_search_configs', 'sector_configs',
    'icp_profile', 'api_call_logs'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas_para_rls
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 5: CRIAR POLÍTICAS RLS BÁSICAS
-- ============================================================================

DO $$
DECLARE
  tabela TEXT;
  tabelas_para_politicas TEXT[] := ARRAY[
    'icp_analysis_results', 'stc_verification_history', 'discarded_companies',
    'leads_pool', 'leads_qualified', 'suggested_companies', 'similar_companies',
    'simple_totvs_checks', 'totvs_usage_detection', 'digital_presence',
    'governance_signals', 'insights', 'sdr_deals', 'sdr_notifications',
    'filter_presets', 'product_catalog', 'tenant_products',
    'tenant_competitor_configs', 'tenant_search_configs', 'sector_configs',
    'icp_profile', 'api_call_logs'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas_para_politicas
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I', tabela, tabela);
      EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', tabela, tabela);
      EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', tabela, tabela);
      
      EXECUTE format('CREATE POLICY %I_read ON public.%I FOR SELECT TO authenticated USING (true)', tabela, tabela);
      EXECUTE format('CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', tabela, tabela);
      EXECUTE format('CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tabela, tabela);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 6: GARANTIR PERMISSÕES SELECT
-- ============================================================================

DO $$
DECLARE
  tabela TEXT;
  tabelas_publicas TEXT[] := ARRAY[
    'sectors', 'niches', 'companies', 'decision_makers', 'digital_maturity',
    'buying_signals', 'search_history'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas_publicas
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated, anon', tabela);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 7: FORÇAR RELOAD DO POSTGREST
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- PARTE 8: VALIDAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_count INTEGER;
  tabelas_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  SELECT COUNT(*) INTO rpc_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant', 'get_sectors_niches', 'get_sectors_niches_json', 'log_api_call');
  
  SELECT COUNT(*) INTO tabelas_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'icp_analysis_results', 'stc_verification_history',
    'decision_makers', 'digital_presence', 'governance_signals',
    'sdr_deals', 'suggested_companies', 'sectors', 'niches'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: % / Esperado: 12', sectors_count;
  RAISE NOTICE 'Nichos: % / Esperado: 120', niches_count;
  RAISE NOTICE 'Funções RPC: % / Esperado: 4', rpc_count;
  RAISE NOTICE 'Tabelas principais: % / Esperado: 10+', tabelas_count;
  RAISE NOTICE '========================================';
END $$;

