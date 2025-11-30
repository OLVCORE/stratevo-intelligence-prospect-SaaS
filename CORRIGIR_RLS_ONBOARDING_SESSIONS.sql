-- ============================================================================
-- CORREÇÃO: RLS Policy para onboarding_sessions
-- ============================================================================
-- O erro 400 ocorre porque a política atual não permite UPDATE/INSERT
-- Vamos corrigir para permitir que usuários autenticados gerenciem suas próprias sessões
-- ============================================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "public.onboarding_sessions_authenticated" ON public.onboarding_sessions;

-- Criar políticas mais específicas
-- SELECT: Usuários podem ver suas próprias sessões
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
CREATE POLICY "onboarding_sessions_service_role"
ON public.onboarding_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

