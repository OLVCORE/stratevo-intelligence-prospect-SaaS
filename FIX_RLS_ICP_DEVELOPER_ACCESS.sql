-- ============================================
-- FIX: RLS para ICP - Acesso de Desenvolvedor
-- ============================================
-- PROBLEMA: Erro 406 ao acessar ICPs
-- CAUSA: RLS bloqueia acesso se usuário não está vinculado ao tenant
-- SOLUÇÃO: Policy especial para desenvolvedores/admins
-- ============================================

-- 1. Verificar policies existentes
DO $$
BEGIN
  RAISE NOTICE 'Políticas atuais em icp_profiles_metadata:';
END $$;

SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'icp_profiles_metadata';

-- 2. OPÇÃO A: Policy para ADMIN/DEVELOPER (recomendado para produção)
-- Adiciona policy que permite acesso para usuários admin
DROP POLICY IF EXISTS "Admins can view all ICPs" ON public.icp_profiles_metadata;
CREATE POLICY "Admins can view all ICPs"
  ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    -- Permite acesso se:
    -- 1. Usuário está vinculado ao tenant do ICP (regra normal)
    -- 2. OU usuário é admin (via campo role='OWNER' ou outro critério)
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
    OR
    -- Admin pode ver todos
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (
        role = 'ADMIN' 
        OR role = 'OWNER'
        OR email = 'marcos.oliveira@olvinternacional.com.br' -- Developer específico
      )
    )
  );

-- 3. OPÇÃO B: TEMPORÁRIO - Desabilitar RLS para TESTE (CUIDADO!)
-- ⚠️ APENAS PARA DESENVOLVIMENTO - NUNCA EM PRODUÇÃO!
-- Descomente apenas se for testar localmente:

-- ALTER TABLE public.icp_profiles_metadata DISABLE ROW LEVEL SECURITY;

-- 4. OPÇÃO C: Policy permissiva para TODOS os usuários autenticados (desenvolvimento)
-- ⚠️ CUIDADO: Permite ver TODOS os ICPs de TODOS os tenants
-- Útil apenas para desenvolvimento/testes

DROP POLICY IF EXISTS "DEV: All authenticated users can view all ICPs" ON public.icp_profiles_metadata;
CREATE POLICY "DEV: All authenticated users can view all ICPs"
  ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    -- Permite acesso a QUALQUER ICP se estiver autenticado
    auth.uid() IS NOT NULL
  );

-- 5. Verificar se o usuário está vinculado aos tenants corretos
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_count INTEGER;
BEGIN
  -- Pegar ID do usuário autenticado
  SELECT auth.uid() INTO v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum usuário autenticado';
  ELSE
    -- Contar quantos tenants o usuário está vinculado
    SELECT COUNT(*) INTO v_tenant_count
    FROM public.users
    WHERE auth_user_id = v_user_id;
    
    RAISE NOTICE '✅ Usuário autenticado: %', v_user_id;
    RAISE NOTICE '📊 Vinculado a % tenant(s)', v_tenant_count;
    
    -- Listar os tenants
    RAISE NOTICE '📋 Tenants do usuário:';
    FOR v_tenant_id IN 
      SELECT tenant_id FROM public.users WHERE auth_user_id = v_user_id
    LOOP
      RAISE NOTICE '  - %', v_tenant_id;
    END LOOP;
  END IF;
END $$;

-- 6. Verificar ICPs existentes
SELECT 
  id,
  nome,
  tenant_id,
  tipo,
  icp_principal,
  ativo,
  created_at
FROM public.icp_profiles_metadata
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 
-- PARA TESTAR NO SUPABASE:
-- 1. Copie este SQL
-- 2. Cole no Supabase SQL Editor
-- 3. Execute
-- 4. Recarregue a página do frontend
-- 5. Tente acessar o ICP novamente
--
-- PARA REVERTER (remover policy permissiva):
-- DROP POLICY IF EXISTS "DEV: All authenticated users can view all ICPs" ON public.icp_profiles_metadata;
--
-- PARA PRODUÇÃO:
-- Manter apenas a policy "Admins can view all ICPs"
-- E remover a policy "DEV: All authenticated users..."
-- ============================================

-- 7. DIAGNÓSTICO: Verificar por que não está funcionando
DO $$
DECLARE
  v_user_id UUID;
  v_icp_id UUID := 'e33e7d01-2c05-4040-9738-f19ef47d9acb'; -- ID do ICP problemático
BEGIN
  SELECT auth.uid() INTO v_user_id;
  
  RAISE NOTICE '🔍 DIAGNÓSTICO DO ICP: %', v_icp_id;
  
  -- Verificar se o ICP existe
  IF EXISTS (SELECT 1 FROM public.icp_profiles_metadata WHERE id = v_icp_id) THEN
    RAISE NOTICE '✅ ICP existe na tabela';
    
    -- Mostrar tenant do ICP
    FOR v_tenant_id IN 
      SELECT tenant_id FROM public.icp_profiles_metadata WHERE id = v_icp_id
    LOOP
      RAISE NOTICE '📊 Tenant do ICP: %', v_tenant_id;
    END LOOP;
    
    -- Verificar se usuário está vinculado ao tenant do ICP
    IF EXISTS (
      SELECT 1 
      FROM public.icp_profiles_metadata icp
      INNER JOIN public.users u ON u.tenant_id = icp.tenant_id
      WHERE icp.id = v_icp_id AND u.auth_user_id = v_user_id
    ) THEN
      RAISE NOTICE '✅ Usuário ESTÁ vinculado ao tenant do ICP';
    ELSE
      RAISE NOTICE '❌ Usuário NÃO está vinculado ao tenant do ICP';
      RAISE NOTICE '🔧 SOLUÇÃO: Execute este comando:';
      RAISE NOTICE '   INSERT INTO public.users (auth_user_id, tenant_id, email, role)';
      RAISE NOTICE '   SELECT ''%'', tenant_id, ''email@exemplo.com'', ''OWNER''', v_user_id;
      RAISE NOTICE '   FROM public.icp_profiles_metadata WHERE id = ''%'';', v_icp_id;
    END IF;
  ELSE
    RAISE NOTICE '❌ ICP NÃO existe na tabela';
  END IF;
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

