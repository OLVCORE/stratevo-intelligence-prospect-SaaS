-- ============================================
-- RLS PARA PRODUÇÃO SAAS - VERSÃO FINAL
-- ============================================
-- SEM ERROS DE SINTAXE
-- ============================================

-- ============================================
-- PASSO 1: LIMPAR POLICIES ANTIGAS
-- ============================================
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  -- Limpar policies antigas de icp_profiles_metadata
  FOR policy_name IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'icp_profiles_metadata'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.icp_profiles_metadata', policy_name);
  END LOOP;
  
  RAISE NOTICE '✅ Policies antigas removidas';
END $$;

-- ============================================
-- PASSO 2: FUNÇÃO HELPER - Verificar se é Admin/Dev
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_or_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND email IN (
      'marcos.oliveira@olvinternacional.com.br',
      'dev@stratevo.com.br',
      'admin@stratevo.com.br'
    )
  )
  OR EXISTS (
    SELECT 1 
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role IN ('ADMIN', 'SUPERADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASSO 3: POLICIES - icp_profiles_metadata
-- ============================================

-- SELECT
CREATE POLICY "SAAS Secure: View ICPs"
  ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    is_admin_or_developer()
    OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "SAAS Secure: Create ICPs"
  ON public.icp_profiles_metadata
  FOR INSERT
  WITH CHECK (
    is_admin_or_developer()
    OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "SAAS Secure: Update ICPs"
  ON public.icp_profiles_metadata
  FOR UPDATE
  USING (
    is_admin_or_developer()
    OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin_or_developer()
    OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "SAAS Secure: Delete ICPs"
  ON public.icp_profiles_metadata
  FOR DELETE
  USING (
    icp_principal = false
    AND
    (
      is_admin_or_developer()
      OR
      tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================
-- PASSO 4: POLICIES - onboarding_sessions
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'onboarding_sessions' 
    AND column_name = 'tenant_id'
  ) THEN
    DROP POLICY IF EXISTS "SAAS Secure: View onboarding sessions" ON public.onboarding_sessions;
    
    EXECUTE '
      CREATE POLICY "SAAS Secure: View onboarding sessions"
        ON public.onboarding_sessions
        FOR SELECT
        USING (
          is_admin_or_developer()
          OR
          tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
          )
        )
    ';
    
    RAISE NOTICE '✅ Policy criada: onboarding_sessions';
  ELSE
    RAISE NOTICE '⚠️ onboarding_sessions: sem tenant_id';
  END IF;
END $$;

-- ============================================
-- PASSO 5: POLICIES - companies
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'tenant_id'
  ) THEN
    DROP POLICY IF EXISTS "SAAS Secure: View companies" ON public.companies;
    
    EXECUTE '
      CREATE POLICY "SAAS Secure: View companies"
        ON public.companies
        FOR SELECT
        USING (
          is_admin_or_developer()
          OR
          tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
          )
        )
    ';
    
    RAISE NOTICE '✅ Policy criada: companies';
  ELSE
    RAISE NOTICE '⚠️ companies: tabela não existe ou sem tenant_id';
  END IF;
END $$;

-- ============================================
-- PASSO 6: POLICIES - icp_analysis_results
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'icp_analysis_results'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'tenant_id'
  ) THEN
    DROP POLICY IF EXISTS "SAAS Secure: View icp_analysis_results" ON public.icp_analysis_results;
    
    EXECUTE '
      CREATE POLICY "SAAS Secure: View icp_analysis_results"
        ON public.icp_analysis_results
        FOR SELECT
        USING (
          is_admin_or_developer()
          OR
          tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
          )
        )
    ';
    
    RAISE NOTICE '✅ Policy criada: icp_analysis_results';
  ELSE
    RAISE NOTICE '⚠️ icp_analysis_results: tabela não existe ou sem tenant_id';
  END IF;
END $$;

-- ============================================
-- PASSO 7: POLICIES - qualified_prospects
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'qualified_prospects'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'qualified_prospects' 
    AND column_name = 'tenant_id'
  ) THEN
    DROP POLICY IF EXISTS "SAAS Secure: View qualified_prospects" ON public.qualified_prospects;
    
    EXECUTE '
      CREATE POLICY "SAAS Secure: View qualified_prospects"
        ON public.qualified_prospects
        FOR SELECT
        USING (
          is_admin_or_developer()
          OR
          tenant_id IN (
            SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
          )
        )
    ';
    
    RAISE NOTICE '✅ Policy criada: qualified_prospects';
  ELSE
    RAISE NOTICE '⚠️ qualified_prospects: tabela não existe (será criada depois)';
  END IF;
END $$;

-- ============================================
-- PASSO 8: VERIFICAÇÃO FINAL
-- ============================================
DO $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_tenant_count INTEGER;
  v_icp_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ RLS SAAS SEGURO APLICADO';
  RAISE NOTICE '===========================================';
  
  IF v_user_id IS NOT NULL THEN
    SELECT is_admin_or_developer() INTO v_is_admin;
    
    SELECT COUNT(*) INTO v_tenant_count
    FROM public.users
    WHERE auth_user_id = v_user_id;
    
    SELECT COUNT(*) INTO v_icp_count
    FROM public.icp_profiles_metadata;
    
    RAISE NOTICE '';
    RAISE NOTICE '👤 SEU PERFIL:';
    RAISE NOTICE '   User ID: %', v_user_id;
    RAISE NOTICE '   É Admin/Dev: %', CASE WHEN v_is_admin THEN 'SIM' ELSE 'NAO' END;
    RAISE NOTICE '   Tenants vinculados: %', v_tenant_count;
    RAISE NOTICE '   ICPs acessíveis: %', v_icp_count;
    
    RAISE NOTICE '';
    IF v_is_admin THEN
      RAISE NOTICE '🔓 MODO DESENVOLVEDOR ATIVO';
      RAISE NOTICE '   Você tem acesso TOTAL';
    ELSE
      RAISE NOTICE '🔒 MODO USUÁRIO NORMAL';
      RAISE NOTICE '   Acesso restrito aos próprios tenants';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Execute autenticado para ver seu perfil';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎯 GOVERNANÇA SAAS ATIVA';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- PASSO 9: LISTAR POLICIES CRIADAS
-- ============================================
SELECT 
  tablename as tabela,
  policyname as policy,
  cmd as operacao
FROM pg_policies
WHERE policyname LIKE '%SAAS Secure%'
ORDER BY tablename, cmd;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

