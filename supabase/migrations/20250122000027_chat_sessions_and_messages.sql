-- ============================================================================
-- MIGRATION: Chat Sessions and Messages
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Cria tabelas para sessões de chat e mensagens (voz e texto)
-- ============================================================================

-- ============================================
-- CHAT_SESSIONS (Sessões de Conversa)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Status da sessão
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'abandonado')),
  
  -- Modo da sessão (voz ou texto)
  mode TEXT DEFAULT 'text' CHECK (mode IN ('voice', 'text')),
  
  -- Lead vinculado (pode ser NULL se ainda não foi capturado)
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Dados da sessão (JSONB flexível)
  session_data JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: { "user_agent": "...", "ip": "...", "referrer": "..." }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant_id ON public.chat_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lead_id ON public.chat_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created ON public.chat_sessions(tenant_id, created_at DESC);

-- RLS Multi-Tenant
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sessions from their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_sessions' AND policyname='Users can view sessions from their tenant') THEN
    DROP POLICY "Users can view sessions from their tenant" ON public.chat_sessions;
  END IF;
END $$;
CREATE POLICY "Users can view sessions from their tenant"
  ON public.chat_sessions FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Policy: Users can create sessions in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_sessions' AND policyname='Users can create sessions in their tenant') THEN
    DROP POLICY "Users can create sessions in their tenant" ON public.chat_sessions;
  END IF;
END $$;
CREATE POLICY "Users can create sessions in their tenant"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Policy: Users can update sessions in their tenant
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_sessions' AND policyname='Users can update sessions in their tenant') THEN
    DROP POLICY "Users can update sessions in their tenant" ON public.chat_sessions;
  END IF;
END $$;
CREATE POLICY "Users can update sessions in their tenant"
  ON public.chat_sessions FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- CHAT_MESSAGES (Mensagens da Conversa)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sessão à qual a mensagem pertence
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  
  -- Role da mensagem (user, assistant, system)
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  
  -- Conteúdo da mensagem
  content TEXT NOT NULL,
  
  -- Metadata adicional (JSONB flexível)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Exemplo: { "audio_url": "...", "transcription": "...", "entities": {...} }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON public.chat_messages(session_id, role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(session_id, created_at ASC);

-- RLS (herda do tenant via session_id)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their tenant's sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_messages' AND policyname='Users can view messages from their tenant') THEN
    DROP POLICY "Users can view messages from their tenant" ON public.chat_messages;
  END IF;
END $$;
CREATE POLICY "Users can view messages from their tenant"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.tenant_id = get_current_tenant_id()
    )
  );

-- Policy: Users can create messages in their tenant's sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_messages' AND policyname='Users can create messages in their tenant') THEN
    DROP POLICY "Users can create messages in their tenant" ON public.chat_messages;
  END IF;
END $$;
CREATE POLICY "Users can create messages in their tenant"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em chat_sessions
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trigger_update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Trigger para atualizar session_data quando mensagem é criada
CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET 
    session_data = jsonb_set(
      COALESCE(session_data, '{}'::jsonb),
      '{last_message_at}',
      to_jsonb(now())
    ),
    updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_on_message ON public.chat_messages;
CREATE TRIGGER trigger_update_session_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_message();

