-- ============================================================================
-- CORREÇÕES COMPLETAS: Onboarding Sessions
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- ============================================
-- 1. CORRIGIR RLS POLICIES
-- ============================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "public.onboarding_sessions_authenticated" ON public.onboarding_sessions;

-- Criar políticas mais específicas
-- SELECT: Usuários podem ver suas próprias sessões
DROP POLICY IF EXISTS "onboarding_sessions_select_own" ON public.onboarding_sessions;
CREATE POLICY "onboarding_sessions_select_own"
ON public.onboarding_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = onboarding_sessions.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- INSERT: Usuários podem criar sessões para si mesmos
DROP POLICY IF EXISTS "onboarding_sessions_insert_own" ON public.onboarding_sessions;
CREATE POLICY "onboarding_sessions_insert_own"
ON public.onboarding_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = onboarding_sessions.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- UPDATE: Usuários podem atualizar suas próprias sessões
DROP POLICY IF EXISTS "onboarding_sessions_update_own" ON public.onboarding_sessions;
CREATE POLICY "onboarding_sessions_update_own"
ON public.onboarding_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = onboarding_sessions.user_id
    AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = onboarding_sessions.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- DELETE: Usuários podem deletar suas próprias sessões
DROP POLICY IF EXISTS "onboarding_sessions_delete_own" ON public.onboarding_sessions;
CREATE POLICY "onboarding_sessions_delete_own"
ON public.onboarding_sessions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = onboarding_sessions.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- Permitir service_role gerenciar tudo (para Edge Functions)
DROP POLICY IF EXISTS "onboarding_sessions_service_role" ON public.onboarding_sessions;
CREATE POLICY "onboarding_sessions_service_role"
ON public.onboarding_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. VERIFICAR CHECK CONSTRAINT DO STATUS
-- ============================================

-- Verificar se o constraint está correto
-- Deve permitir: 'draft', 'submitted', 'analyzed', 'completed'
-- Se não estiver, recriar:

DO $$
BEGIN
  -- Verificar se o constraint existe e está correto
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'onboarding_sessions_status_check'
    AND contype = 'c'
  ) THEN
    -- Remover constraint antigo se existir
    ALTER TABLE public.onboarding_sessions 
    DROP CONSTRAINT IF EXISTS onboarding_sessions_status_check;
  END IF;
  
  -- Criar constraint correto
  ALTER TABLE public.onboarding_sessions
  ADD CONSTRAINT onboarding_sessions_status_check 
  CHECK (status IN ('draft', 'submitted', 'analyzed', 'completed'));
END $$;

-- ============================================
-- 3. ATUALIZAR STATUS EXISTENTES (se houver)
-- ============================================

-- Atualizar qualquer 'in_progress' para 'draft'
UPDATE public.onboarding_sessions
SET status = 'draft'
WHERE status = 'in_progress' OR status NOT IN ('draft', 'submitted', 'analyzed', 'completed');

-- ============================================
-- 4. GRANTS (garantir permissões)
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_sessions TO authenticated;
GRANT ALL ON public.onboarding_sessions TO service_role;

-- ============================================
-- 5. NOTIFICAR POSTGREST
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- ✅ CORREÇÕES APLICADAS!
-- ============================================================================
-- Agora o sistema deve funcionar corretamente:
-- - RLS policies corrigidas
-- - Status constraint corrigido
-- - Dados existentes atualizados
-- ============================================================================

