-- ============================================================================
-- DIAGNÓSTICO COMPLETO: VERIFICAR POR QUE TENANTS NÃO APARECE NO POSTGREST
-- ============================================================================

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
  '1. Verificação de Existência' as etapa,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tenants'
    ) THEN '✅ Tabela EXISTS'
    ELSE '❌ Tabela NÃO EXISTE'
  END as status;

-- 2. VERIFICAR ESTRUTURA DA TABELA
SELECT 
  '2. Estrutura da Tabela' as etapa,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
ORDER BY ordinal_position;

-- 3. VERIFICAR RLS
SELECT 
  '3. Status RLS' as etapa,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
JOIN pg_namespace pn ON pn.oid = pc.relnamespace
WHERE pt.schemaname = 'public' 
  AND pt.tablename = 'tenants';

-- 4. VERIFICAR PERMISSÕES
SELECT 
  '4. Permissões' as etapa,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
ORDER BY grantee, privilege_type;

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
  '5. Políticas RLS' as etapa,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'tenants';

-- 6. VERIFICAR SE SCHEMA PUBLIC ESTÁ EXPOSTO
SELECT 
  '6. Schema Public Exposto' as etapa,
  nspname as schema_name,
  nspowner::regrole as owner
FROM pg_namespace
WHERE nspname = 'public';

-- 7. VERIFICAR SE HÁ DADOS NA TABELA
SELECT 
  '7. Dados na Tabela' as etapa,
  COUNT(*) as total_registros
FROM public.tenants;

-- 8. VERIFICAR ÍNDICES
SELECT 
  '8. Índices' as etapa,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'tenants';

-- 9. TENTAR FORÇAR RELOAD MULTIPLAS VEZES
DO $$
BEGIN
  -- Notificar PostgREST múltiplas vezes
  FOR i IN 1..5 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  -- Adicionar comentário com timestamp
  EXECUTE format($f$COMMENT ON TABLE public.tenants IS %L;$f$, 
    'Tabela de tenants - Reload forçado: ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'));
  
  RAISE NOTICE '✅ Reload forçado executado 5 vezes';
END$$;

-- 10. VERIFICAR SE POSTGREST CONSEGUE VER A TABELA
-- (Isso deve retornar dados se PostgREST conseguir ver)
SELECT 
  '10. Teste PostgREST' as etapa,
  'Execute: SELECT * FROM public.tenants LIMIT 1' as instrucao,
  'Se retornar dados, tabela existe. Se der erro, PostgREST não vê.' as observacao;

