-- ==========================================
-- 🚨 APLICAR ESTAS MIGRATIONS NO SUPABASE SQL EDITOR
-- ==========================================
-- Execute na ordem:
-- 1. 20250224000003_add_tenant_id_to_icp_analysis_results.sql
-- 2. 20250224000004_ensure_raw_analysis_column.sql
-- 3. 20250224000002_auto_recalculate_purchase_intent_triggers.sql (CORRIGIDO)
-- ==========================================

-- MIGRATION 1: Adicionar tenant_id
-- ==========================================
-- 🔧 Multi-tenant em icp_analysis_results (correção de políticas RLS)
-- ==========================================

-- 1) Adicionar coluna tenant_id (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.icp_analysis_results 
      ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Coluna tenant_id adicionada à icp_analysis_results';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna tenant_id já existe em icp_analysis_results';
  END IF;
END $$;

-- 2) Popular tenant_id com base em company_id (para registros existentes)
UPDATE public.icp_analysis_results iar
SET tenant_id = c.tenant_id
FROM public.companies c
WHERE iar.company_id = c.id
  AND iar.tenant_id IS NULL
  AND c.tenant_id IS NOT NULL;

-- 3) Para registros sem company_id, inferir via user_id
UPDATE public.icp_analysis_results iar
SET tenant_id = u.tenant_id
FROM public.users u
WHERE iar.user_id = u.auth_user_id
  AND iar.tenant_id IS NULL
  AND u.tenant_id IS NOT NULL;

-- 4) Índices para performance
CREATE INDEX IF NOT EXISTS idx_icp_analysis_results_tenant_id 
  ON public.icp_analysis_results(tenant_id)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- 5) Habilitar RLS
ALTER TABLE public.icp_analysis_results ENABLE ROW LEVEL SECURITY;

-- 6) Limpar políticas antigas que possam conflitar
DROP POLICY IF EXISTS "Authenticated users can read icp_analysis_results" ON public.icp_analysis_results;
DROP POLICY IF EXISTS "Authenticated users can insert icp_analysis_results" ON public.icp_analysis_results;
DROP POLICY IF EXISTS "Authenticated users can update icp_analysis_results" ON public.icp_analysis_results;
DROP POLICY IF EXISTS "Authenticated users can delete icp_analysis_results" ON public.icp_analysis_results;

DROP POLICY IF EXISTS "Users can view icp_analysis_results from their tenant" ON public.icp_analysis_results;
DROP POLICY IF EXISTS "Users can insert icp_analysis_results in their tenant" ON public.icp_analysis_results;
DROP POLICY IF EXISTS "Users can update icp_analysis_results from their tenant" ON public.icp_analysis_results;
DROP POLICY IF EXISTS "Users can delete icp_analysis_results from their tenant" ON public.icp_analysis_results;

-- 7) Criar políticas corretas
CREATE POLICY "Users can view icp_analysis_results from their tenant"
  ON public.icp_analysis_results
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert icp_analysis_results in their tenant"
  ON public.icp_analysis_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update icp_analysis_results from their tenant"
  ON public.icp_analysis_results
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete icp_analysis_results from their tenant"
  ON public.icp_analysis_results
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

-- 8) Comentário explicativo
COMMENT ON COLUMN public.icp_analysis_results.tenant_id 
  IS 'ID do tenant proprietário do registro. Usado para isolamento de dados multi-tenant.';

-- ==========================================
-- MIGRATION 2: Garantir coluna raw_analysis
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results' 
      AND column_name = 'raw_analysis'
  ) THEN
    ALTER TABLE public.icp_analysis_results 
      ADD COLUMN raw_analysis JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Coluna raw_analysis adicionada à icp_analysis_results';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna raw_analysis já existe em icp_analysis_results';
  END IF;
END $$;

COMMENT ON COLUMN public.icp_analysis_results.raw_analysis 
  IS 'Resultado completo da análise em JSON, incluindo dados de origem e enriquecimento';

-- ==========================================
-- MIGRATION 3: Corrigir triggers (remover icp_id)
-- ==========================================
-- Corrigir função do trigger que tenta acessar NEW.icp_id (que não existe)
CREATE OR REPLACE FUNCTION trigger_recalculate_purchase_intent_on_quarantine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect_id UUID;
  v_tenant_id UUID;
BEGIN
  -- 🔥 CORRIGIDO: Removido NEW.icp_id que não existe na tabela
  SELECT 
    qp.id,
    qp.tenant_id
  INTO v_prospect_id, v_tenant_id
  FROM qualified_prospects qp
  WHERE qp.cnpj = NEW.cnpj
    AND qp.tenant_id = NEW.tenant_id
  LIMIT 1;

  -- Se encontrou prospect, marcar para recálculo
  IF v_prospect_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    UPDATE qualified_prospects
    SET purchase_intent_needs_recalculation = true
    WHERE id = v_prospect_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_recalculate_purchase_intent_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect_id UUID;
BEGIN
  -- Se status mudou para 'aprovada', buscar prospect_id
  IF NEW.status = 'aprovada' AND (OLD.status IS NULL OR OLD.status != 'aprovada') THEN
    -- 🔥 CORRIGIDO: Removido NEW.icp_id que não existe na tabela
    SELECT qp.id
    INTO v_prospect_id
    FROM qualified_prospects qp
    WHERE qp.cnpj = NEW.cnpj
      AND qp.tenant_id = NEW.tenant_id
    LIMIT 1;

    -- Marcar para recálculo
    IF v_prospect_id IS NOT NULL THEN
      UPDATE qualified_prospects
      SET purchase_intent_needs_recalculation = true,
          purchase_intent_type = 'real'
      WHERE id = v_prospect_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ==========================================
-- ✅ MIGRATIONS APLICADAS COM SUCESSO
-- ==========================================

