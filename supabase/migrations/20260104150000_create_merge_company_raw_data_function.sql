-- ==========================================
-- FUNÇÃO: Merge raw_data JSONB para empresas existentes
-- ==========================================
-- Permite atualizar apenas campos específicos do raw_data
-- sem perder dados existentes

CREATE OR REPLACE FUNCTION merge_company_raw_data(
  p_cnpj TEXT,
  p_raw_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_raw_data JSONB;
  v_merged_raw_data JSONB;
BEGIN
  -- Buscar raw_data existente
  SELECT raw_data INTO v_existing_raw_data
  FROM companies
  WHERE cnpj = p_cnpj;
  
  -- Se não encontrou empresa, retornar erro
  IF v_existing_raw_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Empresa não encontrada');
  END IF;
  
  -- Fazer merge: dados existentes + novos dados (novos sobrescrevem existentes)
  v_merged_raw_data := v_existing_raw_data || p_raw_data;
  
  -- Atualizar empresa com raw_data mesclado
  UPDATE companies
  SET 
    raw_data = v_merged_raw_data,
    updated_at = NOW()
  WHERE cnpj = p_cnpj;
  
  RETURN jsonb_build_object('success', true, 'merged_data', v_merged_raw_data);
END;
$$;

-- Comentário
COMMENT ON FUNCTION merge_company_raw_data IS 'Faz merge do raw_data JSONB preservando dados existentes e adicionando/atualizando apenas campos novos';

