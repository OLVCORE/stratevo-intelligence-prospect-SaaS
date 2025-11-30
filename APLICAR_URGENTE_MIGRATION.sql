-- ==========================================
-- ⚠️ AÇÃO URGENTE - APLICAR ESTA MIGRATION
-- ==========================================
-- Esta migration resolve o erro 406 (Not Acceptable)
-- que ocorre ao tentar acessar icp_profile do schema do tenant

CREATE OR REPLACE FUNCTION public.get_icp_profile_from_tenant(
  p_schema_name TEXT,
  p_icp_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_sql TEXT;
BEGIN
  -- Validar entrada
  IF p_schema_name IS NULL OR p_icp_profile_id IS NULL THEN
    RETURN NULL::JSONB;
  END IF;

  -- Construir query dinâmica
  v_sql := format(
    'SELECT row_to_json(t.*)::jsonb 
     FROM %I.icp_profile t 
     WHERE t.id = $1',
    p_schema_name
  );

  -- Executar query dinâmica
  EXECUTE v_sql INTO v_result USING p_icp_profile_id;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro
    RAISE WARNING 'Erro ao buscar icp_profile do schema %: %', p_schema_name, SQLERRM;
    RETURN NULL::JSONB;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.get_icp_profile_from_tenant IS 
'Busca dados do icp_profile no schema do tenant. Necessário porque PostgREST não permite acessar schemas customizados diretamente.';

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_icp_profile_from_tenant(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_icp_profile_from_tenant(TEXT, UUID) TO anon;

-- Verificar se a função foi criada
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_icp_profile_from_tenant';

