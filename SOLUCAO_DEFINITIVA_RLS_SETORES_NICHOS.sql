-- ============================================================================
-- SOLUÇÃO DEFINITIVA: Corrigir RLS para Setores e Nichos
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- ========================================
-- PASSO 1: REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ========================================
DROP POLICY IF EXISTS "sectors_read_all" ON public.sectors;
DROP POLICY IF EXISTS "sectors_read_anon" ON public.sectors;
DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
DROP POLICY IF EXISTS "niches_read_anon" ON public.niches;

-- ========================================
-- PASSO 2: DESABILITAR RLS TEMPORARIAMENTE (para teste)
-- ========================================
ALTER TABLE public.sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PASSO 3: HABILITAR RLS NOVAMENTE
-- ========================================
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASSO 4: CRIAR POLÍTICAS CORRETAS (UMA POR TABELA)
-- ========================================

-- SETORES: Uma única política que permite authenticated E anon
CREATE POLICY "sectors_read_all" ON public.sectors 
  FOR SELECT 
  USING (true);

-- NICHOS: Uma única política que permite authenticated E anon
CREATE POLICY "niches_read_all" ON public.niches 
  FOR SELECT 
  USING (true);

-- ========================================
-- PASSO 5: VERIFICAR POLÍTICAS CRIADAS
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
-- PASSO 6: TESTAR ACESSO (deve retornar dados)
-- ========================================
-- Execute como usuário anônimo (sem autenticação)
SELECT 
  'Setores' as tabela,
  COUNT(*) as total,
  string_agg(sector_name, ', ') as exemplos
FROM public.sectors
LIMIT 1;

SELECT 
  'Nichos' as tabela,
  COUNT(*) as total,
  string_agg(niche_name, ', ') as exemplos
FROM public.niches
LIMIT 1;

-- ========================================
-- PASSO 7: VERIFICAR SE AS TABELAS TÊM DADOS
-- ========================================
SELECT 
  (SELECT COUNT(*) FROM public.sectors) as total_setores,
  (SELECT COUNT(*) FROM public.niches) as total_nichos;

