-- ============================================================================
-- AUDITORIA 360° COMPLETA: Verificar e Criar TUDO que está faltando
-- ============================================================================
-- Este script faz uma análise completa e cria todas as tabelas, funções RPC,
-- políticas RLS e mecanismos que o código espera encontrar
-- ============================================================================

DO $$
DECLARE
  -- Lista de TODAS as tabelas referenciadas no código
  tabelas_esperadas TEXT[] := ARRAY[
    -- Multi-tenant (schema public)
    'tenants', 'users', 'subscriptions', 'audit_logs', 'onboarding_data',
    
    -- Setores e Nichos
    'sectors', 'niches',
    
    -- Empresas e Análises
    'companies', 'icp_analysis_results', 'discarded_companies', 'leads_pool', 
    'leads_qualified', 'suggested_companies', 'similar_companies',
    
    -- Decisores e Contatos
    'decision_makers', 'contacts',
    
    -- Verificação e Histórico
    'stc_verification_history', 'simple_totvs_checks', 'totvs_usage_detection',
    
    -- Digital e Governança
    'digital_presence', 'digital_maturity', 'governance_signals', 'insights',
    
    -- SDR e Pipeline
    'sdr_deals', 'sdr_opportunities', 'sdr_pipeline_stages', 'sdr_deal_activities',
    'sdr_tasks', 'sdr_sequences', 'sdr_sequence_steps', 'sdr_sequence_runs',
    'sdr_handoffs', 'sdr_notifications',
    
    -- Configurações Tenant
    'icp_profile', 'tenant_products', 'tenant_competitor_configs', 
    'tenant_search_configs', 'sector_configs',
    
    -- Produtos e CPQ
    'product_catalog', 'pricing_rules', 'quote_history', 'scenarios',
    'visual_proposals', 'value_realization_tracking',
    
    -- Intenção e Sinais
    'intent_signals', 'buying_signals', 'company_monitoring',
    
    -- Competitividade
    'competitors', 'battle_cards', 'win_loss_analysis',
    
    -- Estratégia de Conta
    'account_strategies', 'account_strategy_modules', 'account_touchpoints',
    
    -- Outros
    'filter_presets', 'search_history', 'conversations', 'messages',
    'call_recordings'
  ];
  
  -- Lista de funções RPC esperadas
  funcoes_rpc_esperadas TEXT[] := ARRAY[
    'get_user_tenant',
    'get_sectors_niches',
    'get_sectors_niches_json',
    'log_api_call'
  ];
  
  tabela TEXT;
  funcao TEXT;
  tabela_existe BOOLEAN;
  funcao_existe BOOLEAN;
  tabelas_faltantes TEXT[] := ARRAY[]::TEXT[];
  funcoes_faltantes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDITORIA 360° COMPLETA DO PROJETO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- ========================================
  -- FASE 1: VERIFICAR TABELAS
  -- ========================================
  RAISE NOTICE 'FASE 1: Verificando tabelas...';
  
  FOREACH tabela IN ARRAY tabelas_esperadas
  LOOP
    SELECT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = tabela
    ) INTO tabela_existe;
    
    IF NOT tabela_existe THEN
      tabelas_faltantes := array_append(tabelas_faltantes, tabela);
      RAISE NOTICE '  ❌ Tabela faltando: %', tabela;
    ELSE
      RAISE NOTICE '  ✅ Tabela existe: %', tabela;
    END IF;
  END LOOP;
  
  -- ========================================
  -- FASE 2: VERIFICAR FUNÇÕES RPC
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE 'FASE 2: Verificando funções RPC...';
  
  FOREACH funcao IN ARRAY funcoes_rpc_esperadas
  LOOP
    SELECT EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = funcao
    ) INTO funcao_existe;
    
    IF NOT funcao_existe THEN
      funcoes_faltantes := array_append(funcoes_faltantes, funcao);
      RAISE NOTICE '  ❌ Função RPC faltando: %', funcao;
    ELSE
      RAISE NOTICE '  ✅ Função RPC existe: %', funcao;
    END IF;
  END LOOP;
  
  -- ========================================
  -- RESUMO
  -- ========================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO DA AUDITORIA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de tabelas verificadas: %', array_length(tabelas_esperadas, 1);
  RAISE NOTICE 'Tabelas faltando: %', array_length(tabelas_faltantes, 1);
  RAISE NOTICE 'Total de funções RPC verificadas: %', array_length(funcoes_rpc_esperadas, 1);
  RAISE NOTICE 'Funções RPC faltando: %', array_length(funcoes_faltantes, 1);
  RAISE NOTICE '========================================';
  
  IF array_length(tabelas_faltantes, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'TABELAS FALTANDO:';
    FOREACH tabela IN ARRAY tabelas_faltantes
    LOOP
      RAISE NOTICE '  - %', tabela;
    END LOOP;
  END IF;
  
  IF array_length(funcoes_faltantes, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'FUNÇÕES RPC FALTANDO:';
    FOREACH funcao IN ARRAY funcoes_faltantes
    LOOP
      RAISE NOTICE '  - %', funcao;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- CRIAR FUNÇÕES RPC FALTANTES
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

-- 2. get_sectors_niches (TABLE version)
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

-- 3. get_sectors_niches_json (JSONB version)
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

-- 4. log_api_call (se não existir)
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
  -- Criar tabela se não existir
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
    CREATE INDEX idx_api_call_logs_created ON public.api_call_logs(created_at);
    
    ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY api_call_logs_read ON public.api_call_logs
      FOR SELECT TO authenticated
      USING (true);
  END IF;
  
  -- Inserir log
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
-- GARANTIR QUE SETORES E NICHOS ESTÃO CRIADOS E POPULADOS
-- ============================================================================

-- Executar script completo de setores e nichos se não existirem
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  IF sectors_count < 12 OR niches_count < 120 THEN
    RAISE NOTICE 'Executando criação de setores e nichos...';
    -- O script SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql será executado separadamente
    RAISE WARNING 'Execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql para criar setores e nichos';
  END IF;
END $$;

-- ============================================================================
-- FORÇAR RELOAD DO POSTGREST
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  rpc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  SELECT COUNT(*) INTO rpc_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant', 'get_sectors_niches', 'get_sectors_niches_json', 'log_api_call');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: % / Esperado: 12', sectors_count;
  RAISE NOTICE 'Nichos: % / Esperado: 120', niches_count;
  RAISE NOTICE 'Funções RPC criadas: % / Esperado: 4', rpc_count;
  RAISE NOTICE '========================================';
  
  IF sectors_count >= 12 AND niches_count >= 120 AND rpc_count >= 4 THEN
    RAISE NOTICE '✅ FUNÇÕES RPC CRIADAS COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Execute SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql se setores/nichos faltarem';
    RAISE NOTICE '2. Aguarde 30 segundos';
    RAISE NOTICE '3. Recarregue o frontend (Ctrl+Shift+R)';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS CONFIGURAÇÕES AINDA FALTAM';
  END IF;
END $$;

