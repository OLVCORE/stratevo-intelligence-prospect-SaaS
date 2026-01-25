-- ==========================================
-- MC-2.6.10: ATUALIZAR SETOR COM CATEGORIA EM icp_analysis_results
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Atualiza setor em icp_analysis_results com formato "Setor - Categoria"
--            para empresas já aprovadas que não têm setor ou têm setor sem categoria

-- ==========================================
-- FUNÇÃO: Atualizar setor em icp_analysis_results com formato "Setor - Categoria"
-- ==========================================
CREATE OR REPLACE FUNCTION update_icp_analysis_results_setor_with_categoria()
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
  v_cnae_code TEXT;
  v_setor_industria TEXT;
  v_categoria TEXT;
  v_setor_formatted TEXT;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_result IN 
    SELECT 
      id,
      cnae_principal,
      raw_data,
      setor
    FROM public.icp_analysis_results
    WHERE setor IS NULL OR setor = '' OR setor NOT LIKE '%-%'
  LOOP
    -- Extrair CNAE
    v_cnae_code := NULL;
    
    -- Prioridade 1: cnae_principal direto
    IF v_result.cnae_principal IS NOT NULL AND v_result.cnae_principal != '' THEN
      v_cnae_code := normalize_cnae_code(v_result.cnae_principal);
    END IF;
    
    -- Prioridade 2: raw_data
    IF v_cnae_code IS NULL AND v_result.raw_data IS NOT NULL THEN
      v_cnae_code := extract_cnae_from_raw_data(v_result.raw_data);
    END IF;
    
    -- Buscar setor e categoria
    IF v_cnae_code IS NOT NULL THEN
      SELECT setor_industria, categoria 
      INTO v_setor_industria, v_categoria
      FROM public.cnae_classifications
      WHERE cnae_code = v_cnae_code
      LIMIT 1;
      
      -- Formatar como "Setor - Categoria" se ambos existirem
      IF v_setor_industria IS NOT NULL THEN
        IF v_categoria IS NOT NULL THEN
          v_setor_formatted := v_setor_industria || ' - ' || v_categoria;
        ELSE
          v_setor_formatted := v_setor_industria;
        END IF;
        
        -- Atualizar apenas se o setor atual não estiver no formato correto
        IF v_result.setor IS NULL OR v_result.setor = '' OR v_result.setor != v_setor_formatted THEN
          UPDATE public.icp_analysis_results
          SET setor = v_setor_formatted
          WHERE id = v_result.id;
          
          v_updated := v_updated + 1;
        ELSE
          v_skipped := v_skipped + 1;
        END IF;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_updated, v_skipped;
END;
$$;

-- Comentário
COMMENT ON FUNCTION update_icp_analysis_results_setor_with_categoria IS 
'MC2.6.10: Atualiza setor em icp_analysis_results com formato "Setor - Categoria" baseado em cnae_classifications.';
