-- ==========================================
-- FIX FINAL: Corrigir recursão RLS na tabela users
-- ==========================================
-- PROBLEMA: Erro 500 "infinite recursion detected in policy for relation 'users'"
-- CAUSA: Políticas RLS que verificam tenant_id podem causar recursão quando fazem queries na tabela users
-- SOLUÇÃO: Simplificar políticas para usar apenas auth.uid() diretamente, sem verificar tenant_id
-- ==========================================

-- ==========================================
-- PASSO 1: Remover TODAS as políticas antigas de users
-- ==========================================
DROP POLICY IF EXISTS "users_select_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "users_update_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "users_delete_own_by_auth" ON public.users;
DROP POLICY IF EXISTS "Users can view own records" ON public.users;
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "allow_all_select" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can delete own record" ON public.users;

-- ==========================================
-- PASSO 2: Criar políticas SIMPLES que usam APENAS auth.uid()
-- ==========================================
-- IMPORTANTE: NÃO usar get_user_tenant_ids() ou qualquer função que faça query em users
-- Isso evita recursão infinita

-- SELECT: Usuários podem ver APENAS seus próprios registros (baseado em auth_user_id)
CREATE POLICY "users_select_own_by_auth" ON public.users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- INSERT: Usuários podem inserir APENAS seus próprios registros
CREATE POLICY "users_insert_own_by_auth" ON public.users
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- UPDATE: Usuários podem atualizar APENAS seus próprios registros
CREATE POLICY "users_update_own_by_auth" ON public.users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- DELETE: Usuários podem deletar APENAS seus próprios registros
CREATE POLICY "users_delete_own_by_auth" ON public.users
  FOR DELETE
  USING (auth_user_id = auth.uid());

-- ==========================================
-- PASSO 3: Garantir que a função get_user_tenant_ids() não causa recursão
-- ==========================================
-- A função já existe, mas vamos garantir que ela está correta
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- IMPORTANTE: Usar SECURITY DEFINER para bypassar RLS
  -- Isso evita recursão porque a função não é afetada pelas políticas RLS
  RETURN QUERY
  SELECT DISTINCT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.tenant_id IS NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Retornar vazio em caso de erro (evita erro 500)
    RETURN;
END;
$$;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON POLICY "users_select_own_by_auth" ON public.users IS 
  'Permite que usuários vejam apenas seus próprios registros (baseado em auth_user_id) - SEM verificação de tenant_id para evitar recursão';

COMMENT ON POLICY "users_insert_own_by_auth" ON public.users IS 
  'Permite que usuários insiram apenas seus próprios registros (baseado em auth_user_id)';

COMMENT ON POLICY "users_update_own_by_auth" ON public.users IS 
  'Permite que usuários atualizem apenas seus próprios registros (baseado em auth_user_id)';

COMMENT ON POLICY "users_delete_own_by_auth" ON public.users IS 
  'Permite que usuários deletem apenas seus próprios registros (baseado em auth_user_id)';

