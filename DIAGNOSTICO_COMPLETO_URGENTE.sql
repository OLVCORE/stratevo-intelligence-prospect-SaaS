-- ============================================================================
-- DIAGNÓSTICO COMPLETO - Ver o que está quebrado
-- ============================================================================

-- 1. VER COLUNAS QUE REALMENTE EXISTEM
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VER SE RLS ESTÁ BLOQUEANDO
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies';

-- 3. VER POLÍTICAS RLS
SELECT * FROM pg_policies WHERE tablename = 'companies';

-- 4. TESTAR SELECT SIMPLES (sem *)
SELECT id, name, cnpj FROM companies LIMIT 1;

-- 5. TESTAR SELECT COM * (ver se dá erro 406)
SELECT * FROM companies LIMIT 1;

-- 6. VER METALIFE ESPECÍFICA
SELECT 
  id,
  name,
  cnpj,
  website,
  domain
FROM companies
WHERE name = 'METALIFE INDUSTRIA E COMERCIO DE MOVEIS S/A';

