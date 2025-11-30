-- ============================================================================
-- CORRIGIR POLÍTICAS RLS PARA SETORES E NICHOS
-- ============================================================================
-- Execute este script no Supabase SQL Editor para garantir acesso às tabelas
-- ============================================================================

-- Verificar se as tabelas existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sectors') THEN
    RAISE EXCEPTION 'Tabela sectors não existe! Execute primeiro o script de criação.';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'niches') THEN
    RAISE EXCEPTION 'Tabela niches não existe! Execute primeiro o script de criação.';
  END IF;
END $$;

-- ========================================
-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ========================================
DROP POLICY IF EXISTS "sectors_read_all" ON public.sectors;
DROP POLICY IF EXISTS "sectors_read_anon" ON public.sectors;
DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
DROP POLICY IF EXISTS "niches_read_anon" ON public.niches;

-- ========================================
-- CRIAR POLÍTICAS RLS CORRETAS
-- ========================================

-- SETORES: Permitir leitura para TODOS (autenticados e anônimos)
CREATE POLICY "sectors_read_all" ON public.sectors 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- NICHOS: Permitir leitura para TODOS (autenticados e anônimos)
CREATE POLICY "niches_read_all" ON public.niches 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- ========================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('sectors', 'niches')
ORDER BY tablename, policyname;

-- ========================================
-- TESTAR ACESSO (deve retornar dados)
-- ========================================
SELECT 
  'Setores' as tabela,
  COUNT(*) as total
FROM public.sectors
UNION ALL
SELECT 
  'Nichos' as tabela,
  COUNT(*) as total
FROM public.niches;

