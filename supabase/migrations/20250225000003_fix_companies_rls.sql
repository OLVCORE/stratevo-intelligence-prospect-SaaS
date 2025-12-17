-- ============================================================================
-- MIGRATION: Corrigir RLS da tabela companies
-- ============================================================================
-- Data: 2025-02-25
-- Descrição: Corrigir políticas RLS de companies para usar função SECURITY DEFINER
-- ============================================================================
-- 
-- PROBLEMA: Políticas RLS em companies podem estar bloqueando inserções
-- quando o usuário tenta criar empresas a partir de prospects qualificados.
--
-- SOLUÇÃO: Usar função get_user_tenant_ids() que bypassa RLS
-- ============================================================================

-- ============================================================================
-- PASSO 1: Remover TODAS as políticas antigas de companies
-- ============================================================================
DO $$
BEGIN
  -- Remover TODAS as políticas antigas de companies
  DROP POLICY IF EXISTS "Authenticated users can read companies" ON public.companies;
  DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
  DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
  DROP POLICY IF EXISTS "Service role can manage companies" ON public.companies;
  DROP POLICY IF EXISTS "Public read access on companies" ON public.companies;
  DROP POLICY IF EXISTS "Public insert access on companies" ON public.companies;
  DROP POLICY IF EXISTS "Public update access on companies" ON public.companies;
  DROP POLICY IF EXISTS "Tenant can read companies" ON public.companies;
  DROP POLICY IF EXISTS "Tenant can write companies" ON public.companies;
  DROP POLICY IF EXISTS "Tenant can update companies" ON public.companies;
  DROP POLICY IF EXISTS "Tenant can delete companies" ON public.companies;
  DROP POLICY IF EXISTS "SAAS Secure: View companies" ON public.companies;
  DROP POLICY IF EXISTS "Users can view companies from their tenant" ON public.companies;
  DROP POLICY IF EXISTS "Users can create companies in their tenant" ON public.companies;
  DROP POLICY IF EXISTS "Users can update companies from their tenant" ON public.companies;
  DROP POLICY IF EXISTS "Users can delete companies from their tenant" ON public.companies;
  
  RAISE NOTICE '✅ Políticas antigas de companies removidas';
END $$;

-- ============================================================================
-- PASSO 2: Criar políticas corretas usando função SECURITY DEFINER
-- ============================================================================
DO $$
BEGIN
  -- Política SELECT: Usuários podem ver empresas dos seus tenants
  CREATE POLICY "Users can view companies from their tenant"
    ON public.companies FOR SELECT
    USING (
      auth.uid() IS NOT NULL 
      AND (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
        OR tenant_id IS NULL
      )
    );
  
  -- Política INSERT: Usuários podem criar empresas nos seus tenants
  CREATE POLICY "Users can create companies in their tenant"
    ON public.companies FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  -- Política UPDATE: Usuários podem atualizar empresas dos seus tenants
  CREATE POLICY "Users can update companies from their tenant"
    ON public.companies FOR UPDATE
    USING (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    )
    WITH CHECK (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  -- Política DELETE: Usuários podem deletar empresas dos seus tenants
  CREATE POLICY "Users can delete companies from their tenant"
    ON public.companies FOR DELETE
    USING (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  RAISE NOTICE '✅ Políticas corretas de companies criadas (usando função SECURITY DEFINER)';
END $$;

-- ============================================================================
-- LOG DE CONCLUSÃO
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ RLS DE COMPANIES CORRIGIDO ✅✅✅';
  RAISE NOTICE '✅ Políticas de companies agora usam função SECURITY DEFINER';
  RAISE NOTICE '✅ Inserções de empresas a partir de prospects qualificados devem funcionar';
END $$;
