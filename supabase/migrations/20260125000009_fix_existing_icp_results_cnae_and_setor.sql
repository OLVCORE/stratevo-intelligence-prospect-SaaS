-- ==========================================
-- MC-2.6.14: CORRIGIR CNAE E SETOR EM REGISTROS EXISTENTES
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Corrige CNAE e setor em registros existentes de icp_analysis_results
--            que foram criados antes das correções

-- ==========================================
-- 1. GARANTIR QUE A FUNÇÃO DE ATUALIZAÇÃO EXISTE
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
      BEGIN
        v_cnae_code := normalize_cnae_code(v_result.cnae_principal);
      EXCEPTION
        WHEN OTHERS THEN
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_result.cnae_principal), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Prioridade 2: raw_data
    IF v_cnae_code IS NULL AND v_result.raw_data IS NOT NULL THEN
      BEGIN
        v_cnae_code := extract_cnae_from_raw_data(v_result.raw_data);
      EXCEPTION
        WHEN OTHERS THEN
          -- Fallback manual
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(
            COALESCE(
              (v_result.raw_data->'receita_federal'->'atividade_principal'->0->>'code'),
              (v_result.raw_data->'receita'->'atividade_principal'->0->>'code'),
              (v_result.raw_data->'atividade_principal'->0->>'code'),
              (v_result.raw_data->>'cnae_fiscal'),
              (v_result.raw_data->>'cnae_principal')
            )
          ), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Buscar setor e categoria
    IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
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

-- ==========================================
-- 2. ATUALIZAR CNAE_principal COM CÓDIGO ORIGINAL (se estiver vazio ou normalizado)
-- ==========================================
DO $$
DECLARE
  v_result RECORD;
  v_raw_cnae TEXT;
  v_updated INTEGER := 0;
BEGIN
  FOR v_result IN 
    SELECT 
      id,
      cnae_principal,
      raw_data
    FROM public.icp_analysis_results
    WHERE cnae_principal IS NULL 
       OR cnae_principal = ''
       OR cnae_principal NOT LIKE '%.%' -- Código sem pontos (normalizado)
  LOOP
    -- Extrair código CNAE original de raw_data
    IF v_result.raw_data IS NOT NULL THEN
      v_raw_cnae := COALESCE(
        (v_result.raw_data->'receita_federal'->'atividade_principal'->0->>'code'),
        (v_result.raw_data->'receita'->'atividade_principal'->0->>'code'),
        (v_result.raw_data->'atividade_principal'->0->>'code'),
        (v_result.raw_data->>'cnae_fiscal'),
        (v_result.raw_data->>'cnae_principal')
      );
      
      -- Atualizar se encontrou código original
      IF v_raw_cnae IS NOT NULL AND v_raw_cnae != '' THEN
        UPDATE public.icp_analysis_results
        SET cnae_principal = v_raw_cnae
        WHERE id = v_result.id;
        
        v_updated := v_updated + 1;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Atualizados % registros com código CNAE original', v_updated;
END $$;

-- Comentário
COMMENT ON FUNCTION update_icp_analysis_results_setor_with_categoria IS 
'MC2.6.14: Atualiza setor em icp_analysis_results com formato "Setor - Categoria" baseado em cnae_classifications.';
