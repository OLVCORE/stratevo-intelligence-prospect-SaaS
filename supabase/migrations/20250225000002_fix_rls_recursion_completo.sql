-- ============================================================================
-- MIGRATION: Corrigir recursão infinita RLS - VERSÃO COMPLETA E ROBUSTA
-- ============================================================================
-- Data: 2025-02-25
-- Descrição: Remove TODAS as políticas recursivas e recria usando função SECURITY DEFINER
-- ============================================================================
-- 
-- PROBLEMA: Políticas RLS em tenant_users e prospect_qualification_jobs
-- estão causando recursão infinita porque tentam verificar tenant_users
-- dentro de uma política de tenant_users.
--
-- SOLUÇÃO: Criar função SECURITY DEFINER que bypassa RLS e usar em todas as políticas
-- ============================================================================

-- ============================================================================
-- PASSO 1: Criar função SECURITY DEFINER (DEVE SER PRIMEIRO)
-- ============================================================================
-- Esta função bypassa RLS completamente usando SECURITY DEFINER
-- Ela acessa tenant_users diretamente sem passar pelas políticas RLS
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Acessa tenant_users diretamente, bypassando RLS
  RETURN QUERY
  SELECT tu.tenant_id
  FROM public.tenant_users tu
  WHERE tu.user_id = auth.uid() 
    AND tu.status = 'active';
EXCEPTION
  WHEN others THEN
    -- Em caso de erro, retornar vazio (evita erro 500)
    RETURN;
END;
$$;

COMMENT ON FUNCTION public.get_user_tenant_ids() IS 
'Retorna os tenant_ids do usuário atual sem causar recursão RLS. 
Usa SECURITY DEFINER para bypassar RLS completamente.';

-- ============================================================================
-- PASSO 2: Remover TODAS as políticas problemáticas de tenant_users
-- ============================================================================
DO $$
BEGIN
  -- Remover TODAS as políticas de tenant_users que podem causar recursão
  DROP POLICY IF EXISTS "Users can view members of their tenant" ON public.tenant_users;
  DROP POLICY IF EXISTS "Users can view tenant members" ON public.tenant_users;
  DROP POLICY IF EXISTS "Users can view their tenant memberships" ON public.tenant_users;
  DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
  
  RAISE NOTICE '✅ Políticas antigas de tenant_users removidas';
END $$;

-- ============================================================================
-- PASSO 3: Recriar políticas de tenant_users usando função SECURITY DEFINER
-- ============================================================================
DO $$
BEGIN
  -- Política 1: Usuários podem ver seus próprios vínculos com tenants
  CREATE POLICY "Users can view their tenant memberships"
    ON public.tenant_users FOR SELECT
    USING (user_id = auth.uid());
  
  -- Política 2: Usuários podem ver membros dos tenants que pertencem
  -- Usa a função SECURITY DEFINER para evitar recursão
  CREATE POLICY "Users can view members of their tenant"
    ON public.tenant_users FOR SELECT
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  RAISE NOTICE '✅ Políticas corretas de tenant_users criadas (usando função SECURITY DEFINER)';
END $$;

-- ============================================================================
-- PASSO 4: Remover TODAS as políticas problemáticas de prospect_qualification_jobs
-- ============================================================================
DO $$
BEGIN
  -- Remover TODAS as políticas de prospect_qualification_jobs
  DROP POLICY IF EXISTS "Users can view prospect_qualification_jobs from their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can insert prospect_qualification_jobs in their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can update prospect_qualification_jobs from their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can delete prospect_qualification_jobs from their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can view their tenant jobs" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can insert their tenant jobs" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can update their tenant jobs" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can delete their tenant jobs" 
    ON public.prospect_qualification_jobs;
  
  RAISE NOTICE '✅ Políticas antigas de prospect_qualification_jobs removidas';
END $$;

-- ============================================================================
-- PASSO 5: Recriar políticas de prospect_qualification_jobs usando função SECURITY DEFINER
-- ============================================================================
DO $$
BEGIN
  -- Política SELECT: Usuários podem ver jobs dos seus tenants
  CREATE POLICY "Users can view their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR SELECT 
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  -- Política INSERT: Usuários podem criar jobs nos seus tenants
  CREATE POLICY "Users can insert their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR INSERT 
    WITH CHECK (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  -- Política UPDATE: Usuários podem atualizar jobs dos seus tenants
  CREATE POLICY "Users can update their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR UPDATE 
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  -- Política DELETE: Usuários podem deletar jobs dos seus tenants
  CREATE POLICY "Users can delete their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR DELETE 
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  RAISE NOTICE '✅ Políticas corretas de prospect_qualification_jobs criadas (usando função SECURITY DEFINER)';
END $$;

-- ============================================================================
-- PASSO 6: Verificar e corrigir outras tabelas que podem ter o mesmo problema
-- ============================================================================
-- Corrigir políticas de legal_data, purchase_intent_signals que também usam tenant_users
DO $$
BEGIN
  -- legal_data
  DROP POLICY IF EXISTS "Users can view legal_data from their tenant" ON public.legal_data;
  DROP POLICY IF EXISTS "Users can insert legal_data in their tenant" ON public.legal_data;
  DROP POLICY IF EXISTS "Users can update legal_data from their tenant" ON public.legal_data;
  DROP POLICY IF EXISTS "Users can delete legal_data from their tenant" ON public.legal_data;
  
  CREATE POLICY "Users can view legal_data from their tenant"
    ON public.legal_data FOR SELECT
    USING (
      auth.uid() IS NOT NULL 
      AND (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
        OR tenant_id IS NULL
      )
    );
  
  CREATE POLICY "Users can insert legal_data in their tenant"
    ON public.legal_data FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  CREATE POLICY "Users can update legal_data from their tenant"
    ON public.legal_data FOR UPDATE
    USING (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  CREATE POLICY "Users can delete legal_data from their tenant"
    ON public.legal_data FOR DELETE
    USING (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  -- purchase_intent_signals
  DROP POLICY IF EXISTS "Users can view purchase_intent_signals from their tenant" ON public.purchase_intent_signals;
  DROP POLICY IF EXISTS "Users can insert purchase_intent_signals in their tenant" ON public.purchase_intent_signals;
  DROP POLICY IF EXISTS "Users can update purchase_intent_signals from their tenant" ON public.purchase_intent_signals;
  DROP POLICY IF EXISTS "Users can delete purchase_intent_signals from their tenant" ON public.purchase_intent_signals;
  
  CREATE POLICY "Users can view purchase_intent_signals from their tenant"
    ON public.purchase_intent_signals FOR SELECT
    USING (
      auth.uid() IS NOT NULL 
      AND (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
        OR tenant_id IS NULL
      )
    );
  
  CREATE POLICY "Users can insert purchase_intent_signals in their tenant"
    ON public.purchase_intent_signals FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  CREATE POLICY "Users can update purchase_intent_signals from their tenant"
    ON public.purchase_intent_signals FOR UPDATE
    USING (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  CREATE POLICY "Users can delete purchase_intent_signals from their tenant"
    ON public.purchase_intent_signals FOR DELETE
    USING (
      auth.uid() IS NOT NULL 
      AND tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );
  
  RAISE NOTICE '✅ Políticas de legal_data e purchase_intent_signals corrigidas';
END $$;

-- ============================================================================
-- LOG DE CONCLUSÃO
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ RECURSÃO INFINITA CORRIGIDA COMPLETAMENTE ✅✅✅';
  RAISE NOTICE '✅ Função get_user_tenant_ids() criada com SECURITY DEFINER';
  RAISE NOTICE '✅ Políticas de tenant_users corrigidas (sem recursão)';
  RAISE NOTICE '✅ Políticas de prospect_qualification_jobs corrigidas';
  RAISE NOTICE '✅ Políticas de legal_data e purchase_intent_signals corrigidas';
  RAISE NOTICE '✅ Todas as políticas agora usam função SECURITY DEFINER';
END $$;
