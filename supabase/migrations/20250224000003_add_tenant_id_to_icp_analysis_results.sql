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

-- Opcional: ajuda nas políticas
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

-- 7) Criar políticas corretas (sem OR REPLACE)

-- SELECT
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

-- INSERT
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

-- UPDATE
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

-- DELETE
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

-- 8) Comentário explicativo (idempotente)
COMMENT ON COLUMN public.icp_analysis_results.tenant_id 
  IS 'ID do tenant proprietário do registro. Usado para isolamento de dados multi-tenant.';
