-- ==========================================
-- 🔧 CORREÇÃO: Funções Manuais para Website Fit Score
-- ==========================================
-- Criar funções RPC que podem ser chamadas manualmente quando o trigger não funciona
-- ==========================================

-- 1. FUNÇÃO PARA ESCANEAR WEBSITE DE UM PROSPECT ESPECÍFICO
CREATE OR REPLACE FUNCTION public.scan_website_for_prospect(
  p_qualified_prospect_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prospect RECORD;
  v_supabase_url TEXT;
  v_url TEXT;
BEGIN
  -- Buscar dados do prospect
  SELECT 
    id,
    tenant_id,
    cnpj,
    razao_social,
    website,
    website_encontrado,
    website_fit_score
  INTO v_prospect
  FROM public.qualified_prospects
  WHERE id = p_qualified_prospect_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prospect não encontrado'
    );
  END IF;
  
  -- Verificar se tem website
  IF COALESCE(v_prospect.website_encontrado, v_prospect.website) IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prospect não tem website cadastrado'
    );
  END IF;
  
  -- Obter URL do Supabase
  v_supabase_url := COALESCE(
    (SELECT value FROM public.app_config WHERE key = 'supabase_url' LIMIT 1),
    'https://vkdvezuivlovzqxmnohk.supabase.co'
  );
  
  -- Construir URL da Edge Function
  v_url := v_supabase_url || '/functions/v1/scan-prospect-website';
  
  -- Chamar Edge Function via pg_net (assíncrono)
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Trigger', 'true'
      ),
      body := jsonb_build_object(
        'tenant_id', v_prospect.tenant_id,
        'qualified_prospect_id', v_prospect.id,
        'website_url', COALESCE(v_prospect.website_encontrado, v_prospect.website),
        'razao_social', v_prospect.razao_social
      )
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Website scan iniciado. A Edge Function atualizará o website_fit_score automaticamente.'
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.scan_website_for_prospect(UUID) TO authenticated;

COMMENT ON FUNCTION public.scan_website_for_prospect IS 
'Chama a Edge Function scan-prospect-website para um prospect específico. Pode ser chamada manualmente quando o trigger automático não funciona.';

-- 2. FUNÇÃO PARA ESCANEAR WEBSITES EM LOTE (até 50 prospects)
CREATE OR REPLACE FUNCTION public.scan_websites_batch(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prospect RECORD;
  v_count INTEGER := 0;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Buscar prospects sem website_fit_score ou com score = 0
  FOR v_prospect IN
    SELECT 
      id,
      tenant_id,
      cnpj,
      razao_social,
      website,
      website_encontrado
    FROM public.qualified_prospects
    WHERE tenant_id = p_tenant_id
      AND (website IS NOT NULL OR website_encontrado IS NOT NULL)
      AND (website_fit_score IS NULL OR website_fit_score = 0)
    LIMIT p_limit
  LOOP
    v_count := v_count + 1;
    
    BEGIN
      PERFORM public.scan_website_for_prospect(v_prospect.id);
      v_success_count := v_success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, v_prospect.razao_social || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_processed', v_count,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'errors', v_errors
  );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.scan_websites_batch(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.scan_websites_batch IS 
'Escaneia websites de múltiplos prospects em lote. Útil para processar prospects antigos que não foram escaneados automaticamente.';

-- 3. FUNÇÃO PARA CALCULAR PURCHASE INTENT SCORE PARA UM PROSPECT
CREATE OR REPLACE FUNCTION public.calculate_purchase_intent_for_prospect(
  p_qualified_prospect_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prospect RECORD;
  v_score INTEGER;
BEGIN
  -- Buscar dados do prospect
  SELECT 
    id,
    tenant_id,
    cnpj,
    purchase_intent_score
  INTO v_prospect
  FROM public.qualified_prospects
  WHERE id = p_qualified_prospect_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prospect não encontrado'
    );
  END IF;
  
  -- Calcular score
  v_score := public.calculate_purchase_intent_score(
    v_prospect.tenant_id,
    v_prospect.cnpj,
    NULL
  );
  
  -- Atualizar prospect
  UPDATE public.qualified_prospects
  SET purchase_intent_score = v_score
  WHERE id = p_qualified_prospect_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'prospect_id', p_qualified_prospect_id,
    'purchase_intent_score', v_score,
    'previous_score', v_prospect.purchase_intent_score
  );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.calculate_purchase_intent_for_prospect(UUID) TO authenticated;

COMMENT ON FUNCTION public.calculate_purchase_intent_for_prospect IS 
'Calcula e atualiza o Purchase Intent Score para um prospect específico.';

-- 4. FUNÇÃO PARA CALCULAR PURCHASE INTENT EM LOTE
CREATE OR REPLACE FUNCTION public.calculate_purchase_intent_batch(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prospect RECORD;
  v_count INTEGER := 0;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Buscar prospects sem purchase_intent_score ou com score = 0
  FOR v_prospect IN
    SELECT id, cnpj, razao_social
    FROM public.qualified_prospects
    WHERE tenant_id = p_tenant_id
      AND cnpj IS NOT NULL
      AND (purchase_intent_score IS NULL OR purchase_intent_score = 0)
    LIMIT p_limit
  LOOP
    v_count := v_count + 1;
    
    BEGIN
      PERFORM public.calculate_purchase_intent_for_prospect(v_prospect.id);
      v_success_count := v_success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, v_prospect.razao_social || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_processed', v_count,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'errors', v_errors
  );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.calculate_purchase_intent_batch(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.calculate_purchase_intent_batch IS 
'Calcula Purchase Intent Score para múltiplos prospects em lote.';

