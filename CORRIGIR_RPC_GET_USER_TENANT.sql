-- ============================================================================
-- CORREÇÃO CRÍTICA: Função RPC get_user_tenant retornando 404
-- ============================================================================
-- Execute este script para garantir que a função está acessível via RPC
-- ============================================================================

-- 1. REMOVER função antiga se existir (para recriar limpa)
DROP FUNCTION IF EXISTS public.get_user_tenant() CASCADE;

-- 2. CRIAR função novamente com configurações corretas
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 3. GARANTIR que a função está no schema public e é acessível
COMMENT ON FUNCTION public.get_user_tenant() IS 'Retorna o tenant_id do usuário autenticado atual';

-- 4. REVOGAR todas as permissões primeiro (limpar estado anterior)
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM anon;
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM service_role;

-- 5. CONCEDER permissões específicas (essencial para RPC funcionar)
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon;

-- 6. VERIFICAR se função foi criada corretamente
DO $$
DECLARE
  func_oid OID;
  func_name TEXT;
  func_schema TEXT;
BEGIN
  SELECT p.oid, p.proname, n.nspname
  INTO func_oid, func_name, func_schema
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'get_user_tenant';
  
  IF func_oid IS NULL THEN
    RAISE EXCEPTION 'Função get_user_tenant não foi criada!';
  ELSE
    RAISE NOTICE '✅ Função criada: %.% (OID: %)', func_schema, func_name, func_oid;
  END IF;
END $$;

-- 7. VERIFICAR permissões da função
SELECT 
  p.proname AS function_name,
  n.nspname AS schema_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  r.rolname AS granted_to,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
AND p.proname = 'get_user_tenant'
AND r.rolname IN ('authenticated', 'anon', 'public')
ORDER BY r.rolname;

-- 8. TESTE: Tentar executar a função (só funciona se autenticado)
DO $$
DECLARE
  test_result UUID;
BEGIN
  BEGIN
    SELECT public.get_user_tenant() INTO test_result;
    IF test_result IS NULL THEN
      RAISE NOTICE '✅ Função executada com sucesso (retornou NULL - normal se não tiver tenant)';
    ELSE
      RAISE NOTICE '✅ Função executada com sucesso (retornou tenant_id: %)', test_result;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao executar função: %', SQLERRM;
    RAISE NOTICE '   Isso é normal se você não estiver autenticado no SQL Editor';
  END;
END $$;

