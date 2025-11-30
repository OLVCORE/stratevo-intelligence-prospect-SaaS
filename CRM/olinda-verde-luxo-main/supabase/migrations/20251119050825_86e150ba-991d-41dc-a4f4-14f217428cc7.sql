-- Create audit_logs table for tracking administrative actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_data JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add deleted_at column to leads for soft delete
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

-- Create integrations_config table for storing API tokens and settings
CREATE TABLE IF NOT EXISTS public.integrations_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  config_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (only admins can view)
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for integrations_config (only admins can manage)
CREATE POLICY "Admins can view integrations config"
ON public.integrations_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert integrations config"
ON public.integrations_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update integrations config"
ON public.integrations_config
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update leads policies to exclude soft-deleted leads from normal queries
DROP POLICY IF EXISTS "Only admin/sales can view leads" ON public.leads;
CREATE POLICY "Only admin/sales can view active leads"
ON public.leads
FOR SELECT
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role))
  AND deleted_at IS NULL
);

-- Policy to allow admins to view deleted leads
CREATE POLICY "Admins can view deleted leads"
ON public.leads
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND deleted_at IS NOT NULL
);

-- Create trigger to update updated_at on integrations_config
CREATE TRIGGER update_integrations_config_updated_at
BEFORE UPDATE ON public.integrations_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for better performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON public.leads(deleted_at) WHERE deleted_at IS NULL;