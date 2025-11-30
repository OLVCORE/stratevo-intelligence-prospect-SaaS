-- Criar tabela para rastrear leads duplicados
CREATE TABLE IF NOT EXISTS public.lead_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  duplicate_lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  similarity_score INTEGER NOT NULL DEFAULT 0,
  match_fields TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_duplicate_pair UNIQUE(lead_id, duplicate_lead_id),
  CONSTRAINT different_leads CHECK (lead_id != duplicate_lead_id)
);

-- Índices para performance
CREATE INDEX idx_lead_duplicates_lead_id ON public.lead_duplicates(lead_id);
CREATE INDEX idx_lead_duplicates_duplicate_lead_id ON public.lead_duplicates(duplicate_lead_id);
CREATE INDEX idx_lead_duplicates_status ON public.lead_duplicates(status);

-- RLS policies
ALTER TABLE public.lead_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Sales podem ver duplicados"
  ON public.lead_duplicates FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'gestor'::app_role)
  );

CREATE POLICY "Admins/Sales podem criar duplicados"
  ON public.lead_duplicates FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

CREATE POLICY "Admins/Sales podem atualizar duplicados"
  ON public.lead_duplicates FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sales'::app_role)
  );

-- Função para detectar duplicados automaticamente
CREATE OR REPLACE FUNCTION public.detect_lead_duplicates(p_lead_id UUID)
RETURNS TABLE(
  duplicate_id UUID,
  similarity_score INTEGER,
  match_fields TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
BEGIN
  -- Buscar o lead atual
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Buscar duplicados potenciais
  RETURN QUERY
  SELECT 
    l.id as duplicate_id,
    (
      CASE WHEN LOWER(l.email) = LOWER(v_lead.email) THEN 50 ELSE 0 END +
      CASE WHEN LOWER(l.phone) = LOWER(v_lead.phone) THEN 40 ELSE 0 END +
      CASE WHEN LOWER(l.name) = LOWER(v_lead.name) THEN 20 ELSE 0 END +
      CASE WHEN l.company_name IS NOT NULL AND LOWER(l.company_name) = LOWER(v_lead.company_name) THEN 15 ELSE 0 END
    )::INTEGER as similarity_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN LOWER(l.email) = LOWER(v_lead.email) THEN 'email' ELSE NULL END,
      CASE WHEN LOWER(l.phone) = LOWER(v_lead.phone) THEN 'phone' ELSE NULL END,
      CASE WHEN LOWER(l.name) = LOWER(v_lead.name) THEN 'name' ELSE NULL END,
      CASE WHEN l.company_name IS NOT NULL AND LOWER(l.company_name) = LOWER(v_lead.company_name) THEN 'company' ELSE NULL END
    ], NULL)::TEXT[] as match_fields
  FROM public.leads l
  WHERE 
    l.id != v_lead.id
    AND l.deleted_at IS NULL
    AND (
      LOWER(l.email) = LOWER(v_lead.email) OR
      LOWER(l.phone) = LOWER(v_lead.phone) OR
      (LOWER(l.name) = LOWER(v_lead.name) AND l.company_name IS NOT NULL AND LOWER(l.company_name) = LOWER(v_lead.company_name))
    )
  ORDER BY similarity_score DESC;
END;
$$;

-- Função para fazer merge de leads
CREATE OR REPLACE FUNCTION public.merge_leads(
  p_source_lead_id UUID,
  p_target_lead_id UUID,
  p_merged_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_lead RECORD;
  v_target_lead RECORD;
BEGIN
  -- Buscar os leads
  SELECT * INTO v_source_lead FROM public.leads WHERE id = p_source_lead_id;
  SELECT * INTO v_target_lead FROM public.leads WHERE id = p_target_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado';
  END IF;

  -- Registrar histórico do merge no lead de destino
  INSERT INTO public.lead_history (lead_id, user_id, action, description)
  VALUES (
    p_target_lead_id,
    p_merged_by,
    'merge',
    'Lead mesclado com ' || v_source_lead.name || ' (ID: ' || p_source_lead_id || ')'
  );

  -- Atualizar atividades para o lead de destino
  UPDATE public.activities SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar emails para o lead de destino
  UPDATE public.email_history SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar chamadas para o lead de destino
  UPDATE public.call_history SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar WhatsApp para o lead de destino
  UPDATE public.whatsapp_messages SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar arquivos para o lead de destino
  UPDATE public.lead_files SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar contatos para o lead de destino
  UPDATE public.lead_contacts SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar agendamentos para o lead de destino
  UPDATE public.appointments SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar propostas para o lead de destino
  UPDATE public.proposals SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;
  
  -- Atualizar deals para o lead de destino
  UPDATE public.deals SET lead_id = p_target_lead_id WHERE lead_id = p_source_lead_id;

  -- Soft delete do lead de origem
  UPDATE public.leads 
  SET 
    deleted_at = now(),
    deleted_by = p_merged_by,
    status = 'merged'
  WHERE id = p_source_lead_id;

  -- Marcar duplicados como resolvidos
  UPDATE public.lead_duplicates
  SET 
    status = 'merged',
    resolved_at = now(),
    resolved_by = p_merged_by
  WHERE (lead_id = p_source_lead_id OR duplicate_lead_id = p_source_lead_id)
    OR (lead_id = p_target_lead_id OR duplicate_lead_id = p_target_lead_id);

  RETURN p_target_lead_id;
END;
$$;