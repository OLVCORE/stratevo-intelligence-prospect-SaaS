-- ============================================
-- CONECTAR TRIGGERS DE IA COM EDGE FUNCTIONS
-- ============================================
-- Este migration cria triggers que chamam automaticamente as Edge Functions de IA
-- quando leads/deals são criados ou atualizados

-- ============================================
-- 1. HABILITAR EXTENSÃO pg_net (se não estiver habilitada)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- NOTA: Esta migration depende de app_config table
-- Execute primeiro: 20250122000019_create_app_config_table.sql
-- ============================================

-- ============================================
-- 2. FUNÇÃO PARA CHAMAR EDGE FUNCTION DE IA LEAD SCORING
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_ai_lead_scoring()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_url TEXT;
BEGIN
  -- Obter URL do Supabase da tabela de configuração
  v_supabase_url := public.app_get_config('supabase_url');
  
  -- Se não encontrar na tabela, usar valor padrão
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://vkdvezuivlovzqxmnohk.supabase.co';
  END IF;
  
  -- Construir URL completa
  v_url := v_supabase_url || '/functions/v1/crm-ai-lead-scoring';
  
  -- Chamar Edge Function de forma assíncrona via pg_net
  -- Isso não bloqueia a transação
  -- Usamos um header especial para indicar que é uma chamada interna de trigger
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Trigger', 'true'
        -- A Edge Function deve aceitar chamadas sem JWT quando este header estiver presente
      ),
      body := jsonb_build_object(
        'lead_id', CASE WHEN TG_TABLE_NAME = 'leads' THEN NEW.id ELSE NULL END,
        'deal_id', CASE WHEN TG_TABLE_NAME = 'deals' THEN NEW.id ELSE NULL END,
        'tenant_id', NEW.tenant_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, apenas logar (não quebrar a transação)
    RAISE WARNING 'Erro ao chamar Edge Function crm-ai-lead-scoring: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. TRIGGERS PARA LEAD SCORING
-- ============================================
DROP TRIGGER IF EXISTS trigger_ai_lead_scoring_on_lead_create ON public.leads;
CREATE TRIGGER trigger_ai_lead_scoring_on_lead_create
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_lead_scoring();

DROP TRIGGER IF EXISTS trigger_ai_lead_scoring_on_lead_update ON public.leads;
CREATE TRIGGER trigger_ai_lead_scoring_on_lead_update
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trigger_ai_lead_scoring();

DROP TRIGGER IF EXISTS trigger_ai_lead_scoring_on_deal_create ON public.deals;
CREATE TRIGGER trigger_ai_lead_scoring_on_deal_create
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_lead_scoring();

DROP TRIGGER IF EXISTS trigger_ai_lead_scoring_on_deal_update ON public.deals;
CREATE TRIGGER trigger_ai_lead_scoring_on_deal_update
  AFTER UPDATE OF stage, value, probability ON public.deals
  FOR EACH ROW
  WHEN (
    OLD.stage IS DISTINCT FROM NEW.stage OR 
    OLD.value IS DISTINCT FROM NEW.value OR 
    OLD.probability IS DISTINCT FROM NEW.probability
  )
  EXECUTE FUNCTION public.trigger_ai_lead_scoring();

-- ============================================
-- 3. FUNÇÃO PARA CHAMAR EDGE FUNCTION DE IA ASSISTANT
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_ai_assistant()
RETURNS TRIGGER AS $$
DECLARE
  v_context_type TEXT;
  v_context_id UUID;
  v_supabase_url TEXT;
  v_url TEXT;
BEGIN
  -- Determinar contexto baseado na tabela
  IF TG_TABLE_NAME = 'activities' THEN
    v_context_type := CASE 
      WHEN NEW.type = 'email' THEN 'email'
      WHEN NEW.type = 'call' THEN 'call'
      WHEN NEW.type = 'meeting' THEN 'meeting'
      ELSE 'general'
    END;
    v_context_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'proposals' THEN
    v_context_type := 'proposal';
    v_context_id := NEW.id;
  ELSE
    RETURN NEW; -- Não processar outros tipos
  END IF;
  
  -- Obter URL do Supabase da tabela de configuração
  v_supabase_url := public.app_get_config('supabase_url');
  
  -- Se não encontrar na tabela, usar valor padrão
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://vkdvezuivlovzqxmnohk.supabase.co';
  END IF;
  
  -- Construir URL completa
  v_url := v_supabase_url || '/functions/v1/crm-ai-assistant';
  
  -- Chamar Edge Function de forma assíncrona
  -- Usamos um header especial para indicar que é uma chamada interna de trigger
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Trigger', 'true'
        -- A Edge Function deve aceitar chamadas sem JWT quando este header estiver presente
      ),
      body := jsonb_build_object(
        'context_type', v_context_type,
        'context_id', v_context_id,
        'conversation_data', to_jsonb(NEW),
        'tenant_id', NEW.tenant_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, apenas logar (não quebrar a transação)
    RAISE WARNING 'Erro ao chamar Edge Function crm-ai-assistant: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 4. TRIGGERS PARA IA ASSISTANT
-- ============================================
DROP TRIGGER IF EXISTS trigger_ai_assistant_on_activity ON public.activities;
CREATE TRIGGER trigger_ai_assistant_on_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW
  WHEN (NEW.type IN ('email', 'call', 'meeting'))
  EXECUTE FUNCTION public.trigger_ai_assistant();

DROP TRIGGER IF EXISTS trigger_ai_assistant_on_proposal ON public.proposals;
CREATE TRIGGER trigger_ai_assistant_on_proposal
  AFTER INSERT OR UPDATE OF status ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_assistant();

-- ============================================
-- 5. FUNÇÃO PARA PROCESSAR WEBHOOKS PENDENTES
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_webhook_processor()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_url TEXT;
BEGIN
  -- Obter URL do Supabase da tabela de configuração
  v_supabase_url := public.app_get_config('supabase_url');
  
  -- Se não encontrar na tabela, usar valor padrão
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://vkdvezuivlovzqxmnohk.supabase.co';
  END IF;
  
  -- Construir URL completa
  v_url := v_supabase_url || '/functions/v1/crm-webhook-processor';
  
  -- Chamar Edge Function para processar webhooks pendentes
  -- Isso é feito de forma assíncrona para não bloquear
  -- Usamos um header especial para indicar que é uma chamada interna de trigger
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Trigger', 'true'
        -- A Edge Function deve aceitar chamadas sem JWT quando este header estiver presente
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, apenas logar (não quebrar a transação)
    RAISE WARNING 'Erro ao chamar Edge Function crm-webhook-processor: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 6. TRIGGER PARA PROCESSAR WEBHOOKS QUANDO NOVOS SÃO CRIADOS
-- ============================================
DROP TRIGGER IF EXISTS trigger_webhook_processor_on_insert ON public.webhook_deliveries;
CREATE TRIGGER trigger_webhook_processor_on_insert
  AFTER INSERT ON public.webhook_deliveries
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.trigger_webhook_processor();

-- ============================================
-- 7. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION public.trigger_ai_lead_scoring() IS 'Chama automaticamente a Edge Function de IA Lead Scoring quando leads/deals são criados ou atualizados';
COMMENT ON FUNCTION public.trigger_ai_assistant() IS 'Chama automaticamente a Edge Function de IA Assistant após atividades ou propostas';
COMMENT ON FUNCTION public.trigger_webhook_processor() IS 'Chama automaticamente a Edge Function de processamento de webhooks quando novos são criados';

