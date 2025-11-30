-- Create proposal_templates table
CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all templates"
  ON public.proposal_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create templates"
  ON public.proposal_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia')
    )
  );

CREATE POLICY "Admins can update templates"
  ON public.proposal_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia')
    )
  );

CREATE POLICY "Admins can delete templates"
  ON public.proposal_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'direcao', 'gerencia')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_proposal_templates_updated_at
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add blocks column to proposals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proposals' 
    AND column_name = 'blocks'
  ) THEN
    ALTER TABLE public.proposals ADD COLUMN blocks JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;