-- Criar tabela de versões de propostas
CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  change_description TEXT,
  UNIQUE(proposal_id, version_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_created_at ON public.proposal_versions(created_at DESC);

-- RLS policies
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposal versions"
  ON public.proposal_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create proposal versions"
  ON public.proposal_versions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função para criar versão automaticamente ao atualizar proposta
CREATE OR REPLACE FUNCTION public.create_proposal_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  -- Obter próximo número de versão
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.proposal_versions
  WHERE proposal_id = OLD.id;

  -- Criar snapshot da versão anterior
  INSERT INTO public.proposal_versions (
    proposal_id,
    version_number,
    data,
    created_by,
    change_description
  ) VALUES (
    OLD.id,
    v_version_number,
    to_jsonb(OLD),
    auth.uid(),
    'Versão criada automaticamente antes de atualização'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar versões automaticamente
CREATE TRIGGER create_version_before_update
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.create_proposal_version();

-- Comentários
COMMENT ON TABLE public.proposal_versions IS 'Histórico de versões das propostas para auditoria e rollback';
COMMENT ON COLUMN public.proposal_versions.data IS 'Snapshot completo da proposta em formato JSONB';
COMMENT ON COLUMN public.proposal_versions.version_number IS 'Número sequencial da versão (1, 2, 3...)';