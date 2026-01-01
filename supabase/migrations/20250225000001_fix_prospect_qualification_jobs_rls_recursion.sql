-- ============================================================================
-- MIGRATION: Corrigir recursão infinita em RLS de prospect_qualification_jobs
-- ============================================================================
-- Data: 2025-02-25
-- Descrição: Remove políticas duplicadas que causam recursão infinita
-- ============================================================================

-- 🔥 CRÍTICO: Criar função SECURITY DEFINER para obter tenant_ids sem recursão
-- Esta função bypassa RLS e retorna os tenant_ids do usuário atual
-- DEVE SER CRIADA ANTES DE SER USADA NAS POLÍTICAS
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT tu.tenant_id
  FROM public.tenant_users tu
  WHERE tu.user_id = auth.uid() 
    AND tu.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_tenant_ids() IS 
'Retorna os tenant_ids do usuário atual sem causar recursão RLS. Usa SECURITY DEFINER para bypassar RLS.';

-- 🔥 CRÍTICO: Remover políticas duplicadas de prospect_qualification_jobs
-- A migration 20250224000007 criou políticas que conflitam com as da 20250204000000
-- e causam recursão infinita com tenant_users
DO $$
BEGIN
  -- Remover políticas duplicadas criadas pela migration 20250224000007
  DROP POLICY IF EXISTS "Users can view prospect_qualification_jobs from their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can insert prospect_qualification_jobs in their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can update prospect_qualification_jobs from their tenant" 
    ON public.prospect_qualification_jobs;
  
  DROP POLICY IF EXISTS "Users can delete prospect_qualification_jobs from their tenant" 
    ON public.prospect_qualification_jobs;
  
  -- Remover políticas antigas que podem estar causando problemas
  DROP POLICY IF EXISTS "Users can view their tenant jobs" 
    ON public.prospect_qualification_jobs;
  DROP POLICY IF EXISTS "Users can insert their tenant jobs" 
    ON public.prospect_qualification_jobs;
  DROP POLICY IF EXISTS "Users can update their tenant jobs" 
    ON public.prospect_qualification_jobs;
  
  RAISE NOTICE '✅ Políticas duplicadas removidas de prospect_qualification_jobs';
END $$;

-- 🔥 CRÍTICO: Criar políticas corretas usando função SECURITY DEFINER (sem recursão)
DO $$
BEGIN
  CREATE POLICY "Users can view their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR SELECT 
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  CREATE POLICY "Users can insert their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR INSERT 
    WITH CHECK (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  CREATE POLICY "Users can update their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR UPDATE 
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  CREATE POLICY "Users can delete their tenant jobs" 
    ON public.prospect_qualification_jobs
    FOR DELETE 
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  RAISE NOTICE '✅ Políticas corretas criadas para prospect_qualification_jobs (usando função SECURITY DEFINER)';
END $$;

-- 🔥 CRÍTICO: Corrigir política de tenant_users que causa recursão
-- Substituir a política recursiva por uma que usa a função SECURITY DEFINER
DO $$
BEGIN
  -- Remover política problemática
  DROP POLICY IF EXISTS "Users can view members of their tenant" 
    ON public.tenant_users;
  
  -- Criar nova política que usa a função (sem recursão)
  CREATE POLICY "Users can view members of their tenant"
    ON public.tenant_users FOR SELECT
    USING (
      tenant_id = ANY(
        SELECT public.get_user_tenant_ids()
      )
    );
  
  RAISE NOTICE '✅ Política recursiva corrigida em tenant_users (usando função SECURITY DEFINER)';
END $$;

-- ============================================================================
-- LOG DE CONCLUSÃO
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Recursão infinita corrigida em prospect_qualification_jobs';
  RAISE NOTICE '✅ Políticas duplicadas removidas';
  RAISE NOTICE '✅ Função SECURITY DEFINER criada para evitar recursão';
  RAISE NOTICE '✅ Políticas corretas garantidas';
END $$;





