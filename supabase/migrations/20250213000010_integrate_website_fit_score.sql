-- ==========================================
-- 🔧 INTEGRAR WEBSITE FIT SCORE NA QUALIFICAÇÃO
-- ==========================================
-- Objetivo: Calcular e salvar website_fit_score automaticamente durante a qualificação
-- ==========================================

-- 1. HABILITAR EXTENSÃO pg_net (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. MODIFICAR FUNÇÃO process_qualification_job_sniper para incluir campos de website
-- (Os campos já existem na tabela via migration 20250221000001_prospect_extracted_products.sql)

-- 3. CRIAR FUNÇÃO PARA CHAMAR EDGE FUNCTION scan-prospect-website
CREATE OR REPLACE FUNCTION public.trigger_scan_prospect_website()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_url TEXT;
  v_website_url TEXT;
BEGIN
  -- Apenas processar se houver website
  v_website_url := COALESCE(NEW.website_encontrado, NEW.website);
  
  IF v_website_url IS NULL OR v_website_url = '' THEN
    RETURN NEW; -- Sem website, não fazer nada
  END IF;

  -- Obter URL do Supabase (usar valor padrão se não houver configuração)
  v_supabase_url := COALESCE(
    (SELECT value FROM public.app_config WHERE key = 'supabase_url' LIMIT 1),
    'https://vkdvezuivlovzqxmnohk.supabase.co'
  );
  
  -- Construir URL completa da Edge Function
  v_url := v_supabase_url || '/functions/v1/scan-prospect-website';
  
  -- Chamar Edge Function de forma assíncrona via pg_net
  -- Isso não bloqueia a transação
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Trigger', 'true',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'tenant_id', NEW.tenant_id,
        'qualified_prospect_id', NEW.id,
        'website_url', v_website_url,
        'razao_social', NEW.razao_social
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, apenas logar (não quebrar a transação)
    RAISE WARNING 'Erro ao chamar Edge Function scan-prospect-website para prospect %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. CRIAR TRIGGER PARA ESCANEAR WEBSITE APÓS INSERIR EM qualified_prospects
DROP TRIGGER IF EXISTS trigger_scan_website_on_qualified_prospect_insert ON public.qualified_prospects;
CREATE TRIGGER trigger_scan_website_on_qualified_prospect_insert
  AFTER INSERT ON public.qualified_prospects
  FOR EACH ROW
  WHEN (NEW.website IS NOT NULL OR NEW.website_encontrado IS NOT NULL)
  EXECUTE FUNCTION public.trigger_scan_prospect_website();

-- 5. CRIAR TRIGGER PARA RE-ESCANEAR SE WEBSITE FOR ATUALIZADO
DROP TRIGGER IF EXISTS trigger_scan_website_on_qualified_prospect_update ON public.qualified_prospects;
CREATE TRIGGER trigger_scan_website_on_qualified_prospect_update
  AFTER UPDATE OF website, website_encontrado ON public.qualified_prospects
  FOR EACH ROW
  WHEN (
    (NEW.website IS NOT NULL OR NEW.website_encontrado IS NOT NULL)
    AND (OLD.website IS DISTINCT FROM NEW.website OR OLD.website_encontrado IS DISTINCT FROM NEW.website_encontrado)
    AND (NEW.website_fit_score IS NULL OR NEW.website_fit_score = 0)
  )
  EXECUTE FUNCTION public.trigger_scan_prospect_website();

-- 6. COMENTÁRIOS
COMMENT ON FUNCTION public.trigger_scan_prospect_website IS 
'Chama automaticamente a Edge Function scan-prospect-website para calcular website_fit_score quando um prospect qualificado é inserido ou atualizado com website';

COMMENT ON TRIGGER trigger_scan_website_on_qualified_prospect_insert ON public.qualified_prospects IS 
'Dispara escaneamento automático de website após inserir prospect qualificado com website';

COMMENT ON TRIGGER trigger_scan_website_on_qualified_prospect_update ON public.qualified_prospects IS 
'Dispara re-escaneamento de website se website for atualizado e website_fit_score ainda estiver zerado';


