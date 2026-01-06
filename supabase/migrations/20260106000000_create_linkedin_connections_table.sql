-- ============================================
-- Tabela: linkedin_connections
-- Rastreamento de solicitações de conexão LinkedIn
-- ============================================

CREATE TABLE IF NOT EXISTS public.linkedin_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados do decisor
  decisor_name TEXT NOT NULL,
  decisor_linkedin_url TEXT NOT NULL,
  decisor_title TEXT,
  decisor_company TEXT,
  
  -- Mensagem personalizada
  message TEXT,
  has_premium BOOLEAN DEFAULT false,
  
  -- Status e rastreamento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'ignored', 'failed')),
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- ✅ NOVO: Rastreamento PhantomBuster (envio real)
  phantom_container_id TEXT, -- ID do container do PhantomBuster
  phantom_result JSONB, -- Resultado completo do PhantomBuster
  
  -- Relacionamentos
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  decision_maker_id UUID REFERENCES public.decision_makers(id) ON DELETE SET NULL,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_user_id ON public.linkedin_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_sent_date ON public.linkedin_connections(sent_date);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_status ON public.linkedin_connections(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_decision_maker_id ON public.linkedin_connections(decision_maker_id);

-- RLS Policies
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias conexões
CREATE POLICY "Users can view their own connections"
  ON public.linkedin_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir suas próprias conexões
CREATE POLICY "Users can insert their own connections"
  ON public.linkedin_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias conexões
CREATE POLICY "Users can update their own connections"
  ON public.linkedin_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_linkedin_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linkedin_connections_updated_at
  BEFORE UPDATE ON public.linkedin_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_linkedin_connections_updated_at();

-- Comentários
COMMENT ON TABLE public.linkedin_connections IS 'Rastreamento de solicitações de conexão LinkedIn enviadas pelo sistema';
COMMENT ON COLUMN public.linkedin_connections.status IS 'Status da conexão: pending, sent, accepted, rejected, ignored';
COMMENT ON COLUMN public.linkedin_connections.sent_date IS 'Data em que a solicitação foi enviada (para controle de limite diário)';

