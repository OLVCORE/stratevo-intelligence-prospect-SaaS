-- ============================================
-- MIGRATION: AI VOICE SDR - Tabelas e Estrutura
-- ============================================
-- Cria tabelas para suportar chamadas de IA conversacional
-- 
-- PROTOCOLO DE SEGURANÇA:
-- - Esta migration é 100% NOVA
-- - Não modifica nenhuma tabela existente
-- - Não interfere com integração chat → CRM
-- ============================================

-- ============================================
-- 1. TABELA: ai_voice_calls
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in-progress', 'completed', 'failed')),
  duration INTEGER, -- em segundos
  transcript TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  outcome TEXT CHECK (outcome IN ('interested', 'not-interested', 'callback-requested', 'meeting-scheduled')),
  next_action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 2. TABELA: ai_voice_scripts
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_voice_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  script_type TEXT NOT NULL CHECK (script_type IN ('cold-call', 'follow-up', 'closing', 'custom')),
  script_content TEXT NOT NULL,
  variables JSONB, -- Variáveis dinâmicas do script
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_voice_calls_tenant_id ON public.ai_voice_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_calls_lead_id ON public.ai_voice_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_calls_deal_id ON public.ai_voice_calls(deal_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_calls_status ON public.ai_voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_ai_voice_calls_created_at ON public.ai_voice_calls(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_voice_scripts_tenant_id ON public.ai_voice_scripts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_scripts_type ON public.ai_voice_scripts(script_type);
CREATE INDEX IF NOT EXISTS idx_ai_voice_scripts_active ON public.ai_voice_scripts(is_active) WHERE is_active = true;

-- ============================================
-- 4. RLS (Row Level Security)
-- ============================================
ALTER TABLE public.ai_voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_scripts ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver chamadas do seu tenant
DROP POLICY IF EXISTS "Users can view ai voice calls from their tenant" ON public.ai_voice_calls;
CREATE POLICY "Users can view ai voice calls from their tenant"
  ON public.ai_voice_calls FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem criar chamadas no seu tenant
DROP POLICY IF EXISTS "Users can create ai voice calls in their tenant" ON public.ai_voice_calls;
CREATE POLICY "Users can create ai voice calls in their tenant"
  ON public.ai_voice_calls FOR INSERT
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem atualizar chamadas do seu tenant
DROP POLICY IF EXISTS "Users can update ai voice calls from their tenant" ON public.ai_voice_calls;
CREATE POLICY "Users can update ai voice calls from their tenant"
  ON public.ai_voice_calls FOR UPDATE
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem ver scripts do seu tenant
DROP POLICY IF EXISTS "Users can view ai voice scripts from their tenant" ON public.ai_voice_scripts;
CREATE POLICY "Users can view ai voice scripts from their tenant"
  ON public.ai_voice_scripts FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

-- Policy: Usuários podem gerenciar scripts do seu tenant
DROP POLICY IF EXISTS "Users can manage ai voice scripts in their tenant" ON public.ai_voice_scripts;
CREATE POLICY "Users can manage ai voice scripts in their tenant"
  ON public.ai_voice_scripts FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- ============================================
-- 5. TRIGGER: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_ai_voice_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_voice_calls_updated_at ON public.ai_voice_calls;
CREATE TRIGGER trigger_update_ai_voice_calls_updated_at
  BEFORE UPDATE ON public.ai_voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_voice_calls_updated_at();

CREATE OR REPLACE FUNCTION public.update_ai_voice_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_voice_scripts_updated_at ON public.ai_voice_scripts;
CREATE TRIGGER trigger_update_ai_voice_scripts_updated_at
  BEFORE UPDATE ON public.ai_voice_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_voice_scripts_updated_at();

-- ============================================
-- 6. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.ai_voice_calls IS 'Registros de chamadas realizadas pela IA conversacional';
COMMENT ON TABLE public.ai_voice_scripts IS 'Scripts de voz personalizados para chamadas de IA';
COMMENT ON COLUMN public.ai_voice_calls.transcript IS 'Transcrição completa da chamada';
COMMENT ON COLUMN public.ai_voice_calls.sentiment IS 'Sentimento detectado durante a chamada';
COMMENT ON COLUMN public.ai_voice_calls.outcome IS 'Resultado da chamada (interessado, não interessado, etc)';

