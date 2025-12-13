-- ==========================================
-- FIX URGENTE: Corrigir recursão RLS na tabela users (VERSÃO DEFINITIVA)
-- ==========================================
-- PROBLEMA: Erro 500 "infinite recursion detected in policy for relation 'users'"
-- CAUSA: Políticas RLS que fazem queries na tabela users causam recursão infinita
-- SOLUÇÃO: Políticas que usam APENAS auth.uid() diretamente, SEM queries em users
-- ==========================================

-- ==========================================
-- PASSO 1: DESABILITAR RLS TEMPORARIAMENTE para limpar políticas problemáticas
-- ==========================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASSO 2: Remover TODAS as políticas antigas (forçar drop)
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
  END LOOP;
END $$;

-- ==========================================
-- PASSO 3: Criar políticas SIMPLES que usam APENAS auth.uid()
-- ==========================================
-- CRÍTICO: NÃO usar get_user_tenant_ids() ou qualquer função que faça query em users
-- Isso evita recursão infinita

-- SELECT: Usuários podem ver APENAS seus próprios registros
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
-- PASSO 4: REABILITAR RLS
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASSO 5: Garantir que get_user_tenant_ids() não causa recursão
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- IMPORTANTE: SECURITY DEFINER bypassa RLS, evitando recursão
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

