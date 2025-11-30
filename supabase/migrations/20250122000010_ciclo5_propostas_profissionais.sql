-- ============================================================================
-- MIGRATION: CICLO 5 - Propostas & Documentos Profissionais
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Editor visual, assinatura digital, versionamento e templates
-- ============================================================================

-- ============================================
-- 1. TABELA: PROPOSAL_VERSIONS (Versionamento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Versão
  version_number INTEGER NOT NULL,
  version_name TEXT, -- "Versão inicial", "Revisão após feedback", etc
  
  -- Conteúdo da versão
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_price NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  final_price NUMERIC NOT NULL,
  terms_and_conditions TEXT,
  payment_terms JSONB,
  delivery_terms JSONB,
  
  -- Status da versão
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  
  -- Comparação
  changes_summary TEXT, -- Resumo das mudanças desta versão
  changed_fields JSONB DEFAULT '{}'::JSONB, -- Campos que mudaram
  
  -- Aprovação
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(proposal_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_tenant_id ON public.proposal_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_version ON public.proposal_versions(proposal_id, version_number DESC);

-- RLS para proposal_versions
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposal_versions' AND policyname='Users can view proposal versions from their tenant') THEN
    DROP POLICY "Users can view proposal versions from their tenant" ON public.proposal_versions;
  END IF;
  CREATE POLICY "Users can view proposal versions from their tenant"
    ON public.proposal_versions FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposal_versions' AND policyname='Users can manage proposal versions') THEN
    DROP POLICY "Users can manage proposal versions" ON public.proposal_versions;
  END IF;
  CREATE POLICY "Users can manage proposal versions"
    ON public.proposal_versions FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 2. TABELA: PROPOSAL_TEMPLATES (Templates Profissionais)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Template
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'standard' CHECK (category IN ('standard', 'premium', 'minimal', 'detailed')),
  
  -- Estrutura do template
  sections JSONB NOT NULL DEFAULT '[]'::JSONB, -- Estrutura de seções pré-definidas
  -- Exemplo: [{"type": "header", "content": "..."}, {"type": "products", "fields": [...]}, {"type": "pricing", "fields": [...]}]
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#f59e0b',
  font_family TEXT DEFAULT 'Inter',
  
  -- Variáveis disponíveis
  available_variables JSONB DEFAULT '[]'::JSONB, -- ["{{company.name}}", "{{proposal.total}}", etc]
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_templates_tenant_id ON public.proposal_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_category ON public.proposal_templates(tenant_id, category);

-- RLS para proposal_templates
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposal_templates' AND policyname='Users can view proposal templates from their tenant') THEN
    DROP POLICY "Users can view proposal templates from their tenant" ON public.proposal_templates;
  END IF;
  CREATE POLICY "Users can view proposal templates from their tenant"
    ON public.proposal_templates FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposal_templates' AND policyname='Users can manage proposal templates') THEN
    DROP POLICY "Users can manage proposal templates" ON public.proposal_templates;
  END IF;
  CREATE POLICY "Users can manage proposal templates"
    ON public.proposal_templates FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 3. TABELA: PROPOSAL_SIGNATURES (Assinatura Digital)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  
  -- Signatário
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT, -- "CEO", "Diretor Comercial", etc
  
  -- Assinatura
  signature_image_url TEXT, -- Imagem da assinatura (base64 ou URL)
  signature_data JSONB, -- Dados da assinatura (coordenadas, timestamp, etc)
  signed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Validação
  ip_address TEXT,
  user_agent TEXT,
  certificate_hash TEXT, -- Hash para validação de integridade
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_signatures_tenant_id ON public.proposal_signatures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_proposal_id ON public.proposal_signatures(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_status ON public.proposal_signatures(tenant_id, status);

-- RLS para proposal_signatures
ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposal_signatures' AND policyname='Users can view proposal signatures from their tenant') THEN
    DROP POLICY "Users can view proposal signatures from their tenant" ON public.proposal_signatures;
  END IF;
  CREATE POLICY "Users can view proposal signatures from their tenant"
    ON public.proposal_signatures FOR SELECT
    USING (tenant_id = get_current_tenant_id());
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='proposal_signatures' AND policyname='Users can manage proposal signatures') THEN
    DROP POLICY "Users can manage proposal signatures" ON public.proposal_signatures;
  END IF;
  CREATE POLICY "Users can manage proposal signatures"
    ON public.proposal_signatures FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());
END $$;

-- ============================================
-- 4. ADICIONAR CAMPOS À PROPOSALS (se necessário)
-- ============================================
DO $$
BEGIN
  -- Adicionar deal_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE public.proposals
    ADD COLUMN deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar template_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.proposals
    ADD COLUMN template_id UUID REFERENCES public.proposal_templates(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar current_version se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'current_version'
  ) THEN
    ALTER TABLE public.proposals
    ADD COLUMN current_version INTEGER DEFAULT 1;
  END IF;

  -- Adicionar requires_signature se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'requires_signature'
  ) THEN
    ALTER TABLE public.proposals
    ADD COLUMN requires_signature BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar shared_link se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'shared_link'
  ) THEN
    ALTER TABLE public.proposals
    ADD COLUMN shared_link TEXT UNIQUE;
  END IF;

  -- Adicionar view_count se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'view_count'
  ) THEN
    ALTER TABLE public.proposals
    ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_proposals_deal_id ON public.proposals(deal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_template_id ON public.proposals(template_id);
CREATE INDEX IF NOT EXISTS idx_proposals_shared_link ON public.proposals(shared_link) WHERE shared_link IS NOT NULL;

-- ============================================
-- 5. FUNÇÃO: CREATE_PROPOSAL_VERSION
-- ============================================
CREATE OR REPLACE FUNCTION public.create_proposal_version(
  p_proposal_id UUID,
  p_version_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal RECORD;
  v_tenant_id UUID;
  v_new_version_number INTEGER;
  v_version_id UUID;
  v_changes JSONB;
BEGIN
  -- Buscar proposta atual
  SELECT * INTO v_proposal
  FROM public.proposals
  WHERE id = p_proposal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;
  
  v_tenant_id := v_proposal.tenant_id;
  
  -- Calcular próximo número de versão
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_new_version_number
  FROM public.proposal_versions
  WHERE proposal_id = p_proposal_id;
  
  -- Detectar mudanças (comparar com versão anterior)
  SELECT jsonb_build_object(
    'items_changed', CASE WHEN v_proposal.items IS DISTINCT FROM (
      SELECT items FROM public.proposal_versions 
      WHERE proposal_id = p_proposal_id 
      ORDER BY version_number DESC LIMIT 1
    ) THEN true ELSE false END,
    'price_changed', CASE WHEN v_proposal.final_price IS DISTINCT FROM (
      SELECT final_price FROM public.proposal_versions 
      WHERE proposal_id = p_proposal_id 
      ORDER BY version_number DESC LIMIT 1
    ) THEN true ELSE false END
  ) INTO v_changes;
  
  -- Criar nova versão
  INSERT INTO public.proposal_versions (
    tenant_id,
    proposal_id,
    version_number,
    version_name,
    items,
    total_price,
    discount_percentage,
    final_price,
    terms_and_conditions,
    payment_terms,
    delivery_terms,
    changes_summary,
    changed_fields,
    created_by
  )
  VALUES (
    v_tenant_id,
    p_proposal_id,
    v_new_version_number,
    COALESCE(p_version_name, format('Versão %s', v_new_version_number)),
    v_proposal.items,
    v_proposal.total_price,
    v_proposal.discount_percentage,
    v_proposal.final_price,
    v_proposal.terms_and_conditions,
    v_proposal.payment_terms,
    v_proposal.delivery_terms,
    format('Versão %s criada', v_new_version_number),
    v_changes,
    auth.uid()
  )
  RETURNING id INTO v_version_id;
  
  -- Atualizar proposta com versão atual
  UPDATE public.proposals
  SET current_version = v_new_version_number,
      updated_at = now()
  WHERE id = p_proposal_id;
  
  RETURN v_version_id;
END;
$$;

-- ============================================
-- 6. FUNÇÃO: GENERATE_SHARED_LINK
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_proposal_shared_link(p_proposal_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shared_link TEXT;
BEGIN
  -- Gerar link único baseado em UUID + timestamp
  v_shared_link := encode(gen_random_bytes(16), 'base64');
  v_shared_link := replace(replace(v_shared_link, '/', '_'), '+', '-');
  v_shared_link := 'prop-' || lower(v_shared_link);
  
  -- Atualizar proposta
  UPDATE public.proposals
  SET shared_link = v_shared_link
  WHERE id = p_proposal_id;
  
  RETURN v_shared_link;
END;
$$;

-- ============================================
-- 7. TRIGGER: UPDATE_UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_proposal_templates_updated_at()
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
    WHERE tgname = 'trigger_update_proposal_templates_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_proposal_templates_updated_at
    BEFORE UPDATE ON public.proposal_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_proposal_templates_updated_at();
  END IF;
END $$;

-- ============================================
-- 8. TEMPLATES PRÉ-CONFIGURADOS
-- ============================================
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    -- Template Standard
    INSERT INTO public.proposal_templates (
      tenant_id,
      name,
      description,
      category,
      sections,
      is_default,
      is_active
    )
    VALUES (
      tenant_record.id,
      'Template Padrão',
      'Template profissional padrão para propostas comerciais',
      'standard',
      '[
        {"type": "header", "title": "Cabeçalho", "fields": ["company_logo", "proposal_number", "date"]},
        {"type": "client_info", "title": "Informações do Cliente", "fields": ["company_name", "contact_name", "email"]},
        {"type": "products", "title": "Produtos/Serviços", "fields": ["items_list", "quantities", "prices"]},
        {"type": "pricing", "title": "Valores", "fields": ["subtotal", "discount", "total"]},
        {"type": "terms", "title": "Termos e Condições", "fields": ["payment_terms", "delivery_terms", "validity"]},
        {"type": "signature", "title": "Assinatura", "fields": ["signature_block"]}
      ]'::JSONB,
      true,
      true
    )
    ON CONFLICT DO NOTHING;

    -- Template Premium
    INSERT INTO public.proposal_templates (
      tenant_id,
      name,
      description,
      category,
      sections,
      is_default,
      is_active
    )
    VALUES (
      tenant_record.id,
      'Template Premium',
      'Template premium com mais detalhes e branding',
      'premium',
      '[
        {"type": "cover", "title": "Capa", "fields": ["hero_image", "title", "subtitle"]},
        {"type": "header", "title": "Cabeçalho", "fields": ["company_logo", "proposal_number", "date"]},
        {"type": "executive_summary", "title": "Resumo Executivo", "fields": ["summary_text"]},
        {"type": "client_info", "title": "Informações do Cliente", "fields": ["company_name", "contact_name", "email", "phone"]},
        {"type": "products", "title": "Produtos/Serviços", "fields": ["items_list", "descriptions", "quantities", "prices"]},
        {"type": "pricing", "title": "Valores", "fields": ["subtotal", "discount", "taxes", "total"]},
        {"type": "timeline", "title": "Cronograma", "fields": ["delivery_timeline"]},
        {"type": "terms", "title": "Termos e Condições", "fields": ["payment_terms", "delivery_terms", "validity", "warranty"]},
        {"type": "signature", "title": "Assinatura", "fields": ["signature_block", "date"]}
      ]'::JSONB,
      false,
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Comentários
COMMENT ON TABLE public.proposal_versions IS 'Versionamento completo de propostas com histórico de alterações';
COMMENT ON TABLE public.proposal_templates IS 'Templates profissionais pré-configurados para propostas';
COMMENT ON TABLE public.proposal_signatures IS 'Assinaturas digitais de propostas com validação';
COMMENT ON FUNCTION public.create_proposal_version(UUID, TEXT) IS 'Cria nova versão de proposta preservando histórico';
COMMENT ON FUNCTION public.generate_proposal_shared_link(UUID) IS 'Gera link compartilhável único para proposta';

