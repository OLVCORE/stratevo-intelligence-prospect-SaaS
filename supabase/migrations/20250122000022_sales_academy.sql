-- ============================================================================
-- MIGRATION: Sales Academy - Academia de Vendas
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Sistema completo de academia de vendas com trilhas, certificações e playbooks
-- ============================================================================

-- ============================================
-- 1. TABELA: LEARNING PATHS (Trilhas de Aprendizado)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_paths') THEN
    CREATE TABLE public.learning_paths (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Informações básicas
      title TEXT NOT NULL,
      description TEXT,
      role_filter TEXT[], -- ['sdr', 'closer', 'manager', 'all']
      difficulty_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
      
      -- Estrutura
      total_modules INTEGER DEFAULT 0,
      estimated_hours NUMERIC(4,1) DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      
      -- Status
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      
      -- Gamificação
      points_reward INTEGER DEFAULT 0,
      badge_id UUID, -- Referência a badge
      
      -- Metadata
      cover_image TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_learning_paths_tenant ON public.learning_paths(tenant_id);
    CREATE INDEX idx_learning_paths_active ON public.learning_paths(tenant_id, is_active);
    CREATE INDEX idx_learning_paths_role ON public.learning_paths(tenant_id, role_filter);
  END IF;
END $$;

-- ============================================
-- 2. TABELA: LEARNING MODULES (Módulos de Aprendizado)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_modules') THEN
    CREATE TABLE public.learning_modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
      
      -- Informações básicas
      title TEXT NOT NULL,
      description TEXT,
      content_type TEXT NOT NULL, -- video, article, quiz, simulation, playbook
      content_url TEXT,
      content_data JSONB DEFAULT '{}'::JSONB,
      
      -- Ordem
      module_order INTEGER NOT NULL,
      estimated_minutes INTEGER DEFAULT 0,
      
      -- Pré-requisitos
      prerequisites UUID[], -- IDs de módulos que devem ser completados antes
      
      -- Gamificação
      points_reward INTEGER DEFAULT 0,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      
      UNIQUE(learning_path_id, module_order)
    );

    CREATE INDEX idx_learning_modules_path ON public.learning_modules(learning_path_id);
    CREATE INDEX idx_learning_modules_tenant ON public.learning_modules(tenant_id);
  END IF;
END $$;

-- ============================================
-- 3. TABELA: USER PROGRESS (Progresso do Usuário)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_learning_progress') THEN
    CREATE TABLE public.user_learning_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
      module_id UUID REFERENCES public.learning_modules(id) ON DELETE CASCADE,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed, skipped
      completion_percentage NUMERIC(5,2) DEFAULT 0,
      
      -- Datas
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      last_accessed_at TIMESTAMPTZ,
      
      -- Resultados
      score NUMERIC(5,2), -- Para quizzes e simulações
      attempts INTEGER DEFAULT 0,
      
      -- Metadata
      progress_data JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      
      UNIQUE(user_id, learning_path_id, module_id)
    );

    CREATE INDEX idx_user_progress_user ON public.user_learning_progress(user_id);
    CREATE INDEX idx_user_progress_path ON public.user_learning_progress(learning_path_id);
    CREATE INDEX idx_user_progress_tenant ON public.user_learning_progress(tenant_id);
    CREATE INDEX idx_user_progress_status ON public.user_learning_progress(tenant_id, status);
  END IF;
END $$;

-- ============================================
-- 4. TABELA: CERTIFICATIONS (Certificações)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certifications') THEN
    CREATE TABLE public.certifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Informações básicas
      name TEXT NOT NULL,
      description TEXT,
      learning_path_id UUID REFERENCES public.learning_paths(id) ON DELETE SET NULL,
      
      -- Requisitos
      required_modules UUID[], -- Módulos que devem ser completados
      minimum_score NUMERIC(5,2) DEFAULT 70, -- Score mínimo para certificação
      
      -- Validade
      validity_days INTEGER, -- NULL = permanente
      
      -- Metadata
      badge_image TEXT,
      certificate_template TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_certifications_tenant ON public.certifications(tenant_id);
    CREATE INDEX idx_certifications_path ON public.certifications(learning_path_id);
  END IF;
END $$;

-- ============================================
-- 5. TABELA: USER CERTIFICATIONS (Certificações do Usuário)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_certifications') THEN
    CREATE TABLE public.user_certifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'earned', -- earned, expired, revoked
      
      -- Datas
      earned_at TIMESTAMPTZ DEFAULT now(),
      expires_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      
      -- Certificado
      certificate_url TEXT,
      certificate_data JSONB DEFAULT '{}'::JSONB,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_user_certifications_user ON public.user_certifications(user_id);
    CREATE INDEX idx_user_certifications_cert ON public.user_certifications(certification_id);
    CREATE INDEX idx_user_certifications_tenant ON public.user_certifications(tenant_id);
    CREATE INDEX idx_user_certifications_status ON public.user_certifications(tenant_id, status);
    
    -- Índice único parcial para garantir apenas uma certificação "earned" por usuário/certificação
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_certifications_unique_earned 
      ON public.user_certifications(user_id, certification_id) 
      WHERE status = 'earned';
  END IF;
END $$;

-- ============================================
-- 6. TABELA: PLAYBOOKS (Playbooks de Vendas)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_playbooks') THEN
    CREATE TABLE public.sales_playbooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Informações básicas
      title TEXT NOT NULL,
      description TEXT,
      category TEXT, -- objection_handling, discovery, closing, follow_up, etc
      scenario TEXT, -- Situação específica
      
      -- Conteúdo
      content JSONB NOT NULL DEFAULT '{}'::JSONB, -- Estrutura do playbook
      steps JSONB DEFAULT '[]'::JSONB, -- Passos do playbook
      
      -- Tags e filtros
      tags TEXT[],
      role_filter TEXT[], -- ['sdr', 'closer', 'manager']
      industry_filter TEXT[], -- Indústrias específicas
      
      -- Status
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      
      -- Analytics
      usage_count INTEGER DEFAULT 0,
      success_rate NUMERIC(5,2) DEFAULT 0,
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_playbooks_tenant ON public.sales_playbooks(tenant_id);
    CREATE INDEX idx_playbooks_category ON public.sales_playbooks(tenant_id, category);
    CREATE INDEX idx_playbooks_active ON public.sales_playbooks(tenant_id, is_active);
  END IF;
END $$;

-- ============================================
-- 7. TABELA: SALES SIMULATIONS (Simulações de Vendas)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_simulations') THEN
    CREATE TABLE public.sales_simulations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Informações básicas
      scenario_name TEXT NOT NULL,
      scenario_type TEXT NOT NULL, -- objection_handling, discovery, closing, etc
      
      -- Estado da simulação
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
      
      -- Resultados
      score NUMERIC(5,2),
      feedback JSONB DEFAULT '{}'::JSONB,
      ai_analysis JSONB DEFAULT '{}'::JSONB,
      
      -- Datas
      started_at TIMESTAMPTZ DEFAULT now(),
      completed_at TIMESTAMPTZ,
      
      -- Metadata
      simulation_data JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX idx_simulations_user ON public.sales_simulations(user_id);
    CREATE INDEX idx_simulations_tenant ON public.sales_simulations(tenant_id);
    CREATE INDEX idx_simulations_status ON public.sales_simulations(tenant_id, status);
  END IF;
END $$;

-- ============================================
-- 8. RLS (Row Level Security)
-- ============================================
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_simulations ENABLE ROW LEVEL SECURITY;

-- Policies para learning_paths
DROP POLICY IF EXISTS "Users can view learning paths from their tenant" ON public.learning_paths;
CREATE POLICY "Users can view learning paths from their tenant"
  ON public.learning_paths FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage learning paths in their tenant" ON public.learning_paths;
CREATE POLICY "Users can manage learning paths in their tenant"
  ON public.learning_paths FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para learning_modules
DROP POLICY IF EXISTS "Users can view learning modules from their tenant" ON public.learning_modules;
CREATE POLICY "Users can view learning modules from their tenant"
  ON public.learning_modules FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage learning modules in their tenant" ON public.learning_modules;
CREATE POLICY "Users can manage learning modules in their tenant"
  ON public.learning_modules FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para user_learning_progress
DROP POLICY IF EXISTS "Users can view their own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can view their own learning progress"
  ON public.user_learning_progress FOR SELECT
  USING (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage their own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can manage their own learning progress"
  ON public.user_learning_progress FOR ALL
  USING (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()));

-- Policies para certifications
DROP POLICY IF EXISTS "Users can view certifications from their tenant" ON public.certifications;
CREATE POLICY "Users can view certifications from their tenant"
  ON public.certifications FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage certifications in their tenant" ON public.certifications;
CREATE POLICY "Users can manage certifications in their tenant"
  ON public.certifications FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para user_certifications
DROP POLICY IF EXISTS "Users can view their own certifications" ON public.user_certifications;
CREATE POLICY "Users can view their own certifications"
  ON public.user_certifications FOR SELECT
  USING (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()));

-- Policies para sales_playbooks
DROP POLICY IF EXISTS "Users can view playbooks from their tenant" ON public.sales_playbooks;
CREATE POLICY "Users can view playbooks from their tenant"
  ON public.sales_playbooks FOR SELECT
  USING (tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage playbooks in their tenant" ON public.sales_playbooks;
CREATE POLICY "Users can manage playbooks in their tenant"
  ON public.sales_playbooks FOR ALL
  USING (tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));

-- Policies para sales_simulations
DROP POLICY IF EXISTS "Users can view their own simulations" ON public.sales_simulations;
CREATE POLICY "Users can view their own simulations"
  ON public.sales_simulations FOR SELECT
  USING (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can manage their own simulations" ON public.sales_simulations;
CREATE POLICY "Users can manage their own simulations"
  ON public.sales_simulations FOR ALL
  USING (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()))
  WITH CHECK (user_id = auth.uid() AND tenant_id = (SELECT get_current_tenant_id()));

-- ============================================
-- 9. TRIGGERS: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_sales_academy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_learning_paths_updated_at ON public.learning_paths;
CREATE TRIGGER trigger_update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

DROP TRIGGER IF EXISTS trigger_update_learning_modules_updated_at ON public.learning_modules;
CREATE TRIGGER trigger_update_learning_modules_updated_at
  BEFORE UPDATE ON public.learning_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_progress_updated_at ON public.user_learning_progress;
CREATE TRIGGER trigger_update_user_progress_updated_at
  BEFORE UPDATE ON public.user_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

DROP TRIGGER IF EXISTS trigger_update_certifications_updated_at ON public.certifications;
CREATE TRIGGER trigger_update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_certifications_updated_at ON public.user_certifications;
CREATE TRIGGER trigger_update_user_certifications_updated_at
  BEFORE UPDATE ON public.user_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

DROP TRIGGER IF EXISTS trigger_update_playbooks_updated_at ON public.sales_playbooks;
CREATE TRIGGER trigger_update_playbooks_updated_at
  BEFORE UPDATE ON public.sales_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

DROP TRIGGER IF EXISTS trigger_update_simulations_updated_at ON public.sales_simulations;
CREATE TRIGGER trigger_update_simulations_updated_at
  BEFORE UPDATE ON public.sales_simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_academy_updated_at();

-- ============================================
-- 10. NOTIFY POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

