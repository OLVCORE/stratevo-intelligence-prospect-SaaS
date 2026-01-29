-- ==========================================
-- FIX: Permitir DELETE em qualified_prospects (Estoque Qualificado → Banco de Empresas)
-- ==========================================
-- Problema: Ao enviar empresas do Estoque Qualificado para o Banco de Empresas,
--           o código deleta o registro de qualified_prospects, mas não havia
--           política RLS de DELETE nem GRANT DELETE, então 0 linhas eram afetadas
--           e as empresas continuavam aparecendo no Estoque.
-- Solução: Adicionar política DELETE (tenant isolation) e GRANT DELETE.
-- ==========================================

-- 1. GRANT DELETE para authenticated (compatível com SELECT, INSERT, UPDATE já existentes)
GRANT DELETE ON public.qualified_prospects TO authenticated;

-- 2. Política de DELETE: usuários podem deletar prospects do próprio tenant
--    (mesmo critério das políticas SELECT/UPDATE em 20250204000000_motor_qualificacao.sql)
CREATE POLICY "Users can delete their tenant prospects"
  ON public.qualified_prospects
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can delete their tenant prospects" ON public.qualified_prospects IS
'Permite remover do Estoque Qualificado ao enviar para Banco de Empresas. Isolamento por tenant.';
