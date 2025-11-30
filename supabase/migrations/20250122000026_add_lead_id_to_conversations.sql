-- =====================================================
-- ADICIONAR lead_id EM CONVERSATIONS PARA SISTEMA ANTI-PERDA
-- =====================================================

-- Adicionar coluna lead_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN lead_id UUID REFERENCES public.leads_quarantine(id) ON DELETE SET NULL;
    
    -- Índice para performance
    CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
    
    -- Comentário
    COMMENT ON COLUMN public.conversations.lead_id IS 'ID do lead vinculado à conversa (sistema anti-perda)';
  END IF;
END $$;

-- Adicionar coluna session_id em messages se não existir (para rastreamento)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN session_id TEXT;
    
    -- Índice para performance
    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
    
    -- Comentário
    COMMENT ON COLUMN public.messages.session_id IS 'ID da sessão de chat (para rastreamento e recuperação)';
  END IF;
END $$;

-- Adicionar coluna role em messages se não existir (user/assistant)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN role TEXT CHECK (role IN ('user', 'assistant', 'system')) DEFAULT 'user';
    
    -- Índice para performance
    CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);
  END IF;
END $$;

