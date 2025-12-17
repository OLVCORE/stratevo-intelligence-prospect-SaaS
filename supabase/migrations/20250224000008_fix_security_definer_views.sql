-- ==========================================
-- 🔒 CORRIGIR VIEWS COM SECURITY DEFINER
-- ==========================================
-- Views com SECURITY DEFINER executam com privilégios do criador,
-- não do usuário. Isso pode ser um risco de segurança.
-- 
-- NOTA: Esta migration é OPCIONAL - as views podem funcionar
-- corretamente com SECURITY DEFINER se necessário para a lógica.
-- ==========================================

-- ==========================================
-- report_dashboard
-- ==========================================
-- Recriar view sem SECURITY DEFINER
-- A view apenas faz SELECT, então não precisa de privilégios elevados
CREATE OR REPLACE VIEW public.report_dashboard
WITH (security_invoker = true)
AS
SELECT 
  r.id AS report_id,
  r.company_name,
  r.cnpj,
  r.status AS report_status,
  rs.status AS state_status,
  rs.current_step,
  rs.progress_percent,
  rs.steps_completed,
  rs.started_at,
  rs.completed_at,
  EXTRACT(EPOCH FROM (COALESCE(rs.completed_at, NOW()) - rs.started_at)) AS duration_seconds,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id) AS total_jobs,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id AND status = 'completed') AS completed_jobs,
  (SELECT COUNT(*) FROM job_queue WHERE report_id = r.id AND status = 'failed') AS failed_jobs,
  (SELECT SUM(cost_usd) FROM api_calls_log WHERE report_id = r.id) AS total_cost_usd,
  (SELECT COUNT(*) FROM api_calls_log WHERE report_id = r.id) AS total_api_calls,
  r.created_at,
  r.updated_at
FROM stc_verification_history r
LEFT JOIN report_state rs ON rs.report_id = r.id
ORDER BY r.created_at DESC;

-- ==========================================
-- unified_deals
-- ==========================================
-- Verificar se a view existe e recriar sem SECURITY DEFINER
-- Verificar dinamicamente quais colunas existem em deals
DO $$
DECLARE
  has_company_id BOOLEAN;
  has_priority BOOLEAN;
  has_owner_id BOOLEAN;
  has_assigned_to BOOLEAN;
  has_source BOOLEAN;
  company_id_expr TEXT;
  priority_expr TEXT;
  assigned_to_expr TEXT;
  source_expr TEXT;
  view_sql TEXT;
BEGIN
  -- Verificar se a view existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name = 'unified_deals'
  ) THEN
    RAISE NOTICE '⚠️ View unified_deals não encontrada - pulando';
    RETURN;
  END IF;
  
  -- Verificar quais colunas existem em deals
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'deals' 
      AND column_name = 'company_id'
  ) INTO has_company_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'deals' 
      AND column_name = 'priority'
  ) INTO has_priority;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'deals' 
      AND column_name = 'owner_id'
  ) INTO has_owner_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'deals' 
      AND column_name = 'assigned_to'
  ) INTO has_assigned_to;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'deals' 
      AND column_name = 'source'
  ) INTO has_source;
  
  -- Determinar expressões baseado nas colunas disponíveis
  company_id_expr := CASE WHEN has_company_id THEN 'cd.company_id' ELSE 'NULL::uuid' END;
  priority_expr := CASE WHEN has_priority THEN 'cd.priority' ELSE '''medium''::text' END;
  source_expr := CASE WHEN has_source THEN 'cd.source' ELSE 'NULL::text' END;
  
  IF has_assigned_to THEN
    assigned_to_expr := 'cd.assigned_to';
  ELSIF has_owner_id THEN
    assigned_to_expr := 'cd.owner_id';
  ELSE
    assigned_to_expr := 'NULL::uuid';
  END IF;
  
  -- Construir SQL da view usando format()
  -- NOTA: Dropar a view primeiro para evitar conflito de nomes de colunas
  -- Depois recriar com a estrutura correta
  EXECUTE 'DROP VIEW IF EXISTS public.unified_deals CASCADE';
  
  -- Construir SQL da view usando format()
  -- NOTA: Renomear coluna 'source' das tabelas para 'deal_source' para evitar ambiguidade
  view_sql := format('
    CREATE VIEW public.unified_deals
    WITH (security_invoker = true)
    AS
    SELECT 
      ''sdr'' as source,
      sd.id,
      sd.company_id,
      sd.contact_id,
      sd.title,
      sd.description,
      sd.value,
      sd.stage,
      sd.probability,
      sd.priority,
      sd.assigned_to,
      sd.source as deal_source,
      sd.status,
      sd.expected_close_date,
      sd.created_at,
      sd.updated_at,
      NULL::uuid as crm_deal_id,
      c.tenant_id
    FROM public.sdr_deals sd
    LEFT JOIN public.companies c ON c.id = sd.company_id
    WHERE sd.stage IN (''discovery'', ''contact'', ''qualified'')
    
    UNION ALL
    
    SELECT 
      ''crm'' as source,
      cd.id,
      %s as company_id,
      NULL::uuid as contact_id,
      cd.title,
      cd.description,
      cd.value,
      cd.stage,
      cd.probability,
      %s as priority,
      %s as assigned_to,
      %s as deal_source,
      NULL::text as status,
      cd.expected_close_date,
      cd.created_at,
      cd.updated_at,
      cd.id as crm_deal_id,
      cd.tenant_id
    FROM public.deals cd
    WHERE cd.stage IN (''proposta'', ''negociacao'', ''ganho'', ''perdido'');
  ', company_id_expr, priority_expr, assigned_to_expr, source_expr);
  
  EXECUTE view_sql;
  
  RAISE NOTICE '✅ View unified_deals recriada sem SECURITY DEFINER';
  RAISE NOTICE '   company_id: %', company_id_expr;
  RAISE NOTICE '   priority: %', priority_expr;
  RAISE NOTICE '   assigned_to: %', assigned_to_expr;
  RAISE NOTICE '   source: %', source_expr;
END $$;

-- ==========================================
-- COMENTÁRIOS EXPLICATIVOS
-- ==========================================
COMMENT ON VIEW public.report_dashboard IS 
  'Dashboard de relatórios - View recriada com security_invoker para respeitar RLS do usuário';

-- ==========================================
-- LOG DE CONCLUSÃO
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Views corrigidas para usar security_invoker';
  RAISE NOTICE '✅ RLS do usuário será respeitado ao consultar as views';
END $$;

