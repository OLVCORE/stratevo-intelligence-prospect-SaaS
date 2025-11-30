-- ============================================================================
-- MIGRATION: CICLO 3 - Integração Completa WhatsApp + Call Recording
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Completar integração WhatsApp Business API e Call Recording com CRM
-- ============================================================================

-- ============================================
-- 1. ADICIONAR TENANT_ID À CALL_RECORDINGS
-- ============================================
DO $$
BEGIN
  -- Adicionar tenant_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'call_recordings' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.call_recordings
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Criar índice para tenant_id
CREATE INDEX IF NOT EXISTS idx_call_recordings_tenant_id ON public.call_recordings(tenant_id);

-- Atualizar tenant_id existente baseado em company_id ou deal_id
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT cr.id, c.tenant_id as company_tenant, d.tenant_id as deal_tenant
    FROM public.call_recordings cr
    LEFT JOIN public.companies c ON c.id = cr.company_id
    LEFT JOIN public.deals d ON d.id = cr.deal_id
    WHERE cr.tenant_id IS NULL
  LOOP
    UPDATE public.call_recordings
    SET tenant_id = COALESCE(rec.deal_tenant, rec.company_tenant)
    WHERE id = rec.id AND COALESCE(rec.deal_tenant, rec.company_tenant) IS NOT NULL;
  END LOOP;
END $$;

-- RLS para call_recordings
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='call_recordings' AND policyname='Users can view call recordings from their tenant') THEN
    DROP POLICY "Users can view call recordings from their tenant" ON public.call_recordings;
  END IF;
  CREATE POLICY "Users can view call recordings from their tenant"
    ON public.call_recordings FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='call_recordings' AND policyname='Users can insert call recordings') THEN
    DROP POLICY "Users can insert call recordings" ON public.call_recordings;
  END IF;
  CREATE POLICY "Users can insert call recordings"
    ON public.call_recordings FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 2. TABELA: WHATSAPP_MESSAGE_STATUS
-- ============================================
-- Rastreamento de status de entrega/leitura do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  provider_message_id TEXT NOT NULL, -- ID do Twilio/Meta
  
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  status_timestamp TIMESTAMPTZ DEFAULT now(),
  
  error_code TEXT,
  error_message TEXT,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_status_tenant_id ON public.whatsapp_message_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status_message_id ON public.whatsapp_message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status_provider_id ON public.whatsapp_message_status(provider_message_id);

-- RLS para whatsapp_message_status
ALTER TABLE public.whatsapp_message_status ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_message_status' AND policyname='Users can view WhatsApp status from their tenant') THEN
    DROP POLICY "Users can view WhatsApp status from their tenant" ON public.whatsapp_message_status;
  END IF;
  CREATE POLICY "Users can view WhatsApp status from their tenant"
    ON public.whatsapp_message_status FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 3. TABELA: WHATSAPP_APPROVED_TEMPLATES
-- ============================================
-- Templates aprovados pelo WhatsApp Business API
CREATE TABLE IF NOT EXISTS public.whatsapp_approved_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  template_name TEXT NOT NULL, -- Nome do template no WhatsApp
  template_id TEXT NOT NULL, -- ID do template no provider
  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language TEXT DEFAULT 'pt_BR',
  
  -- Estrutura do template
  header_type TEXT CHECK (header_type IN ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]'::JSONB, -- [{type: 'QUICK_REPLY', text: 'Sim'}, {type: 'URL', text: 'Ver mais'}]
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  provider TEXT DEFAULT 'twilio' CHECK (provider IN ('twilio', 'meta', 'zenvia')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, template_name, language)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant_id ON public.whatsapp_approved_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON public.whatsapp_approved_templates(tenant_id, status);

-- RLS para whatsapp_approved_templates
ALTER TABLE public.whatsapp_approved_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_approved_templates' AND policyname='Users can view WhatsApp templates from their tenant') THEN
    DROP POLICY "Users can view WhatsApp templates from their tenant" ON public.whatsapp_approved_templates;
  END IF;
  CREATE POLICY "Users can view WhatsApp templates from their tenant"
    ON public.whatsapp_approved_templates FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_approved_templates' AND policyname='Users can manage WhatsApp templates') THEN
    DROP POLICY "Users can manage WhatsApp templates" ON public.whatsapp_approved_templates;
  END IF;
  CREATE POLICY "Users can manage WhatsApp templates"
    ON public.whatsapp_approved_templates FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 4. FUNÇÃO: ANALYZE_CALL_RECORDING
-- ============================================
-- Função para análise de IA de chamadas (será chamada por Edge Function)
CREATE OR REPLACE FUNCTION public.analyze_call_recording(p_recording_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recording RECORD;
  v_analysis JSONB;
BEGIN
  -- Buscar gravação
  SELECT * INTO v_recording
  FROM public.call_recordings
  WHERE id = p_recording_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Recording not found');
  END IF;
  
  -- Análise básica (será expandida por Edge Function com IA)
  v_analysis := jsonb_build_object(
    'recording_id', p_recording_id,
    'duration', v_recording.duration_seconds,
    'has_transcript', CASE WHEN v_recording.transcript IS NOT NULL THEN true ELSE false END,
    'sentiment', v_recording.sentiment,
    'key_topics', v_recording.key_topics,
    'action_items', v_recording.action_items
  );
  
  RETURN v_analysis;
END;
$$;

-- ============================================
-- 5. TRIGGER: UPDATE_UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_whatsapp_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_whatsapp_templates_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_whatsapp_templates_updated_at
    BEFORE UPDATE ON public.whatsapp_approved_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_whatsapp_templates_updated_at();
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE public.whatsapp_message_status IS 'Rastreamento de status de entrega/leitura de mensagens WhatsApp';
COMMENT ON TABLE public.whatsapp_approved_templates IS 'Templates aprovados pelo WhatsApp Business API';
COMMENT ON FUNCTION public.analyze_call_recording(UUID) IS 'Análise básica de gravação de chamada (expandida por Edge Function com IA)';

