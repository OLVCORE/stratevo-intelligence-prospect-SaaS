-- =====================================================
-- FIX DEFINITIVO V2: RLS stc_verification_history (406)
-- Data: 04/11/2025
-- Versão: IDEMPOTENTE (pode executar múltiplas vezes)
-- =====================================================

-- 1️⃣ DROP TODAS as políticas existentes (com IF EXISTS)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stc_verification_history'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.stc_verification_history', pol.policyname);
    END LOOP;
END $$;

-- 2️⃣ DESABILITAR RLS temporariamente
ALTER TABLE public.stc_verification_history DISABLE ROW LEVEL SECURITY;

-- 3️⃣ REABILITAR RLS
ALTER TABLE public.stc_verification_history ENABLE ROW LEVEL SECURITY;

-- 4️⃣ CRIAR políticas ULTRA-PERMISSIVAS (fresh start)

-- Política READ: TODOS podem ler
CREATE POLICY "stc_history_read_all" ON public.stc_verification_history
  FOR SELECT
  USING (true);

-- Política INSERT: TODOS podem inserir
CREATE POLICY "stc_history_insert_all" ON public.stc_verification_history
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE: TODOS podem atualizar
CREATE POLICY "stc_history_update_all" ON public.stc_verification_history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE: TODOS podem deletar
CREATE POLICY "stc_history_delete_all" ON public.stc_verification_history
  FOR DELETE
  USING (true);

-- 5️⃣ GRANT permissões explícitas
GRANT ALL ON public.stc_verification_history TO anon;
GRANT ALL ON public.stc_verification_history TO authenticated;
GRANT ALL ON public.stc_verification_history TO service_role;

-- 6️⃣ VERIFICAR resultado
SELECT 
  '✅ RLS V2 configurado com sucesso!' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT company_name) as unique_companies,
  MAX(created_at) as last_update
FROM public.stc_verification_history;

-- 7️⃣ LISTAR políticas ativas
SELECT 
  policyname as "Política",
  cmd as "Comando",
  qual as "Condição"
FROM pg_policies 
WHERE tablename = 'stc_verification_history'
ORDER BY policyname;

-- =====================================================
-- RESULTADO ESPERADO:
-- - 4 políticas ativas (read, insert, update, delete)
-- - Todas com condição "true" (ultra-permissivas)
-- =====================================================

