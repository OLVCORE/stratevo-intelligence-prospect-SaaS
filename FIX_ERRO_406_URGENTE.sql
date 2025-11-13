-- ============================================================================
-- FIX URGENTE: ERRO 406 ao buscar empresas
-- ============================================================================

-- EXECUTE ESTE SQL NO SUPABASE PARA RESOLVER O ERRO 406

-- 1. Verificar se RLS está causando o problema
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies';

-- 2. Ver políticas RLS existentes
SELECT * FROM pg_policies WHERE tablename = 'companies';

-- 3. DESABILITAR RLS TEMPORARIAMENTE (TESTE)
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 4. REABILITAR DEPOIS (quando funcionar)
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 5. OU criar política PERMISSIVA para TODOS os usuários autenticados
DROP POLICY IF EXISTS "Users can view all companies" ON public.companies;

CREATE POLICY "Users can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

-- 6. Permitir UPDATE para todos
DROP POLICY IF EXISTS "Users can update all companies" ON public.companies;

CREATE POLICY "Users can update all companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (true);

