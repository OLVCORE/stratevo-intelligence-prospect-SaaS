-- ============================================================================
-- VALIDAÇÃO CONTÍNUA: Sistema de Setores e Nichos
-- ============================================================================
-- Este script pode ser executado a qualquer momento para validar o sistema
-- Retorna status detalhado de todas as verificações
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sectors_niches_system()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  sectors_exist BOOLEAN;
  niches_exist BOOLEAN;
  sectors_count INTEGER;
  niches_count INTEGER;
  rls_enabled_sectors BOOLEAN;
  rls_enabled_niches BOOLEAN;
  policies_count_sectors INTEGER;
  policies_count_niches INTEGER;
  function_exists BOOLEAN;
  grants_ok BOOLEAN;
BEGIN
  -- Verificar existência das tabelas
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sectors'
  ) INTO sectors_exist;

  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'niches'
  ) INTO niches_exist;

  -- Contar registros
  IF sectors_exist THEN
    SELECT COUNT(*) INTO sectors_count FROM public.sectors;
    SELECT relrowsecurity INTO rls_enabled_sectors
    FROM pg_class
    WHERE relname = 'sectors' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    SELECT COUNT(*) INTO policies_count_sectors
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sectors';
  ELSE
    sectors_count := 0;
    rls_enabled_sectors := false;
    policies_count_sectors := 0;
  END IF;

  IF niches_exist THEN
    SELECT COUNT(*) INTO niches_count FROM public.niches;
    SELECT relrowsecurity INTO rls_enabled_niches
    FROM pg_class
    WHERE relname = 'niches' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    SELECT COUNT(*) INTO policies_count_niches
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'niches';
  ELSE
    niches_count := 0;
    rls_enabled_niches := false;
    policies_count_niches := 0;
  END IF;

  -- Verificar função RPC
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
  ) INTO function_exists;

  -- Verificar permissões GRANT
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
    AND table_name = 'sectors'
    AND grantee IN ('authenticated', 'anon')
    AND privilege_type = 'SELECT'
  ) INTO grants_ok;

  -- Construir resultado JSON
  SELECT json_build_object(
    'timestamp', NOW(),
    'status', CASE
      WHEN sectors_exist AND niches_exist 
        AND sectors_count >= 12 
        AND niches_count >= 120 
        AND rls_enabled_sectors 
        AND rls_enabled_niches
        AND policies_count_sectors >= 1
        AND policies_count_niches >= 1
        AND function_exists
        AND grants_ok
      THEN 'OK'
      ELSE 'WARNING'
    END,
    'tables', json_build_object(
      'sectors', json_build_object(
        'exists', sectors_exist,
        'count', sectors_count,
        'rls_enabled', rls_enabled_sectors,
        'policies_count', policies_count_sectors,
        'expected_count', 12,
        'status', CASE 
          WHEN sectors_exist AND sectors_count >= 12 THEN 'OK'
          ELSE 'FAIL'
        END
      ),
      'niches', json_build_object(
        'exists', niches_exist,
        'count', niches_count,
        'rls_enabled', rls_enabled_niches,
        'policies_count', policies_count_niches,
        'expected_count', 120,
        'status', CASE 
          WHEN niches_exist AND niches_count >= 120 THEN 'OK'
          ELSE 'FAIL'
        END
      )
    ),
    'rpc_function', json_build_object(
      'exists', function_exists,
      'name', 'get_sectors_niches',
      'status', CASE WHEN function_exists THEN 'OK' ELSE 'FAIL' END
    ),
    'permissions', json_build_object(
      'grants_ok', grants_ok,
      'status', CASE WHEN grants_ok THEN 'OK' ELSE 'FAIL' END
    ),
    'recommendations', CASE
      WHEN NOT sectors_exist THEN ARRAY['Criar tabela sectors']
      WHEN sectors_count < 12 THEN ARRAY['Inserir dados faltantes em sectors']
      WHEN NOT niches_exist THEN ARRAY['Criar tabela niches']
      WHEN niches_count < 120 THEN ARRAY['Inserir dados faltantes em niches']
      WHEN NOT rls_enabled_sectors THEN ARRAY['Habilitar RLS em sectors']
      WHEN NOT rls_enabled_niches THEN ARRAY['Habilitar RLS em niches']
      WHEN policies_count_sectors = 0 THEN ARRAY['Criar políticas RLS para sectors']
      WHEN policies_count_niches = 0 THEN ARRAY['Criar políticas RLS para niches']
      WHEN NOT function_exists THEN ARRAY['Criar função RPC get_sectors_niches']
      WHEN NOT grants_ok THEN ARRAY['Configurar permissões GRANT']
      ELSE ARRAY['Sistema está funcionando corretamente']
    END
  ) INTO result;

  RETURN result;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION validate_sectors_niches_system() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_sectors_niches_system() TO anon;

-- Executar validação e mostrar resultado
SELECT validate_sectors_niches_system() AS validation_result;

