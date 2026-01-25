-- ==========================================
-- MC-2.6.20: ATUALIZAR FUNÇÃO PARA SETOR COM CATEGORIA EM qualified_prospects
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Atualiza função update_qualified_prospects_sector_from_cnae para retornar
--            setor no formato "Setor - Categoria" baseado em cnae_classifications

-- ==========================================
-- FUNÇÃO: Atualizar setor em qualified_prospects com formato "Setor - Categoria"
-- ==========================================
CREATE OR REPLACE FUNCTION update_qualified_prospects_sector_from_cnae()
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prospect RECORD;
  v_cnae_code TEXT;
  v_setor_industria TEXT;
  v_categoria TEXT;
  v_setor_formatted TEXT;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_prospect IN 
    SELECT 
      id,
      cnae_principal,
      enrichment_data,
      setor
    FROM public.qualified_prospects
    WHERE setor IS NULL OR setor = '' OR setor NOT LIKE '%-%'
  LOOP
    -- Extrair CNAE
    v_cnae_code := NULL;
    
    -- Prioridade 1: cnae_principal direto (se existir)
    IF v_prospect.cnae_principal IS NOT NULL AND v_prospect.cnae_principal != '' THEN
      BEGIN
        -- ✅ CRÍTICO: Se o código é apenas numérico (ex: "2833000"), converter para formato "28.33-0/00"
        DECLARE
          v_cnae_clean TEXT;
          v_cnae_formatted TEXT;
        BEGIN
          v_cnae_clean := REPLACE(REPLACE(REPLACE(REPLACE(TRIM(v_prospect.cnae_principal), '.', ''), '-', ''), '/', ''), ' ', '');
          
          -- Se é apenas números (7 dígitos), formatar: NN.NN-N/NN
          IF LENGTH(v_cnae_clean) = 7 AND v_cnae_clean ~ '^[0-9]+$' THEN
            v_cnae_formatted := SUBSTRING(v_cnae_clean, 1, 2) || '.' || 
                               SUBSTRING(v_cnae_clean, 3, 2) || '-' || 
                               SUBSTRING(v_cnae_clean, 5, 1) || '/' || 
                               SUBSTRING(v_cnae_clean, 6, 2);
            v_cnae_code := normalize_cnae_code(v_cnae_formatted);
          ELSE
            v_cnae_code := normalize_cnae_code(v_prospect.cnae_principal);
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_prospect.cnae_principal), '.', ''), ' ', ''));
        END;
      EXCEPTION
        WHEN OTHERS THEN
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_prospect.cnae_principal), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Prioridade 2: enrichment_data (estrutura do qualified_prospects)
    IF v_cnae_code IS NULL AND v_prospect.enrichment_data IS NOT NULL THEN
      BEGIN
        v_cnae_code := extract_cnae_from_raw_data(v_prospect.enrichment_data);
      EXCEPTION
        WHEN OTHERS THEN
          -- Fallback manual
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(
            COALESCE(
              (v_prospect.enrichment_data->'receita_federal'->'atividade_principal'->0->>'code'),
              (v_prospect.enrichment_data->'receita'->'atividade_principal'->0->>'code'),
              (v_prospect.enrichment_data->'atividade_principal'->0->>'code'),
              (v_prospect.enrichment_data->>'cnae_fiscal'),
              (v_prospect.enrichment_data->>'cnae_principal')
            )
          ), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Buscar setor E categoria
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
        IF v_prospect.setor IS NULL OR v_prospect.setor = '' OR v_prospect.setor != v_setor_formatted THEN
          UPDATE public.qualified_prospects
          SET setor = v_setor_formatted
          WHERE id = v_prospect.id;
          
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
COMMENT ON FUNCTION update_qualified_prospects_sector_from_cnae IS 
'MC2.6.20: Atualiza setor em qualified_prospects com formato "Setor - Categoria" baseado em cnae_classifications. Suporta códigos numéricos e formatados.';
