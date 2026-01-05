-- ==========================================
-- FIX: Garantir política RLS de INSERT para qualified_prospects
-- ==========================================
-- Problema: Política RLS bloqueando INSERT em qualified_prospects
-- Solução: Garantir que a política de INSERT existe e está correta
-- ==========================================

-- 1. Remover política antiga se existir (para recriar)
DROP POLICY IF EXISTS "Users can insert their tenant prospects" ON public.qualified_prospects;

-- 2. Criar política de INSERT para qualified_prospects
CREATE POLICY "Users can insert their tenant prospects" 
  ON public.qualified_prospects
  FOR INSERT 
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 3. Comentário
COMMENT ON POLICY "Users can insert their tenant prospects" ON public.qualified_prospects IS 
'Permite que usuários autenticados insiram prospects no seu tenant. Verifica se o tenant_id fornecido está vinculado ao usuário atual.';

