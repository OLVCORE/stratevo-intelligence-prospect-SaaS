-- Criar tabela para armazenar leads do formulário de contato
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy para permitir inserção pública (qualquer pessoa pode enviar formulário)
CREATE POLICY "Qualquer pessoa pode criar leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy para leitura (apenas autenticados podem ver)
CREATE POLICY "Apenas autenticados podem ver leads"
ON public.leads
FOR SELECT
USING (false);

-- Criar índice para melhorar performance nas buscas
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_leads_updated_at();