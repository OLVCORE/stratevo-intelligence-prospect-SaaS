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
      cnpj,
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
    
    -- Prioridade 3: Buscar da tabela qualified_stock_enrichment (via stock_id)
    IF v_cnae_code IS NULL THEN
      BEGIN
        SELECT 
          COALESCE(
            cnae_principal,
            (raw->'receita_federal'->'atividade_principal'->0->>'code'),
            (raw->'receita'->'atividade_principal'->0->>'code'),
            (raw->'atividade_principal'->0->>'code'),
            (raw->>'cnae_fiscal'),
            (raw->>'cnae_principal')
          )
        INTO v_cnae_code
        FROM public.qualified_stock_enrichment
        WHERE stock_id = v_prospect.id
          AND (
            cnae_principal IS NOT NULL 
            OR raw IS NOT NULL
          )
        LIMIT 1;
        
        -- Normalizar se encontrou
        IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
          BEGIN
            DECLARE
              v_cnae_clean_enrich TEXT;
              v_cnae_formatted_enrich TEXT;
            BEGIN
              v_cnae_clean_enrich := REPLACE(REPLACE(REPLACE(REPLACE(TRIM(v_cnae_code), '.', ''), '-', ''), '/', ''), ' ', '');
              
              -- Se é apenas números (7 dígitos), formatar: NN.NN-N/NN
              IF LENGTH(v_cnae_clean_enrich) = 7 AND v_cnae_clean_enrich ~ '^[0-9]+$' THEN
                v_cnae_formatted_enrich := SUBSTRING(v_cnae_clean_enrich, 1, 2) || '.' || 
                                         SUBSTRING(v_cnae_clean_enrich, 3, 2) || '-' || 
                                         SUBSTRING(v_cnae_clean_enrich, 5, 1) || '/' || 
                                         SUBSTRING(v_cnae_clean_enrich, 6, 2);
                v_cnae_code := normalize_cnae_code(v_cnae_formatted_enrich);
              ELSE
                v_cnae_code := normalize_cnae_code(v_cnae_code);
              END IF;
            EXCEPTION
              WHEN OTHERS THEN
                v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_cnae_code), '.', ''), ' ', ''));
            END;
          EXCEPTION
            WHEN OTHERS THEN
              v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_cnae_code), '.', ''), ' ', ''));
          END;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignorar erro e continuar
          NULL;
      END;
    END IF;
    
    -- Prioridade 4: Tentar buscar CNAE via CNPJ em outras tabelas (companies, icp_analysis_results)
    IF v_cnae_code IS NULL THEN
      BEGIN
        DECLARE
          v_cnpj_prospect TEXT;
        BEGIN
          -- Usar CNPJ do prospect (já está no SELECT)
          v_cnpj_prospect := v_prospect.cnpj;
          
          -- Tentar buscar de icp_analysis_results
          IF v_cnpj_prospect IS NOT NULL THEN
            SELECT cnae_principal INTO v_cnae_code
            FROM public.icp_analysis_results
            WHERE cnpj = v_cnpj_prospect
              AND cnae_principal IS NOT NULL
              AND cnae_principal != ''
            LIMIT 1;
            
            -- Se não encontrou, tentar buscar de companies via raw_data
            IF v_cnae_code IS NULL THEN
              BEGIN
                DECLARE
                  v_raw_data_companies JSONB;
                BEGIN
                  SELECT raw_data INTO v_raw_data_companies
                  FROM public.companies
                  WHERE cnpj = v_cnpj_prospect
                    AND raw_data IS NOT NULL
                  LIMIT 1;
                  
                  IF v_raw_data_companies IS NOT NULL THEN
                    BEGIN
                      v_cnae_code := extract_cnae_from_raw_data(v_raw_data_companies);
                    EXCEPTION
                      WHEN OTHERS THEN
                        -- Fallback manual
                        v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(
                          COALESCE(
                            (v_raw_data_companies->'receita_federal'->'atividade_principal'->0->>'code'),
                            (v_raw_data_companies->'receita'->'atividade_principal'->0->>'code'),
                            (v_raw_data_companies->'atividade_principal'->0->>'code'),
                            (v_raw_data_companies->>'cnae_fiscal'),
                            (v_raw_data_companies->>'cnae_principal')
                          )
                        ), '.', ''), ' ', ''));
                    END;
                  END IF;
                EXCEPTION
                  WHEN OTHERS THEN
                    NULL;
                END;
              EXCEPTION
                WHEN OTHERS THEN
                  NULL;
              END;
            END IF;
            
            -- Se encontrou, normalizar
            IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
              BEGIN
                DECLARE
                  v_cnae_clean_icp TEXT;
                  v_cnae_formatted_icp TEXT;
                BEGIN
                  v_cnae_clean_icp := REPLACE(REPLACE(REPLACE(REPLACE(TRIM(v_cnae_code), '.', ''), '-', ''), '/', ''), ' ', '');
                  
                  IF LENGTH(v_cnae_clean_icp) = 7 AND v_cnae_clean_icp ~ '^[0-9]+$' THEN
                    v_cnae_formatted_icp := SUBSTRING(v_cnae_clean_icp, 1, 2) || '.' || 
                                          SUBSTRING(v_cnae_clean_icp, 3, 2) || '-' || 
                                          SUBSTRING(v_cnae_clean_icp, 5, 1) || '/' || 
                                          SUBSTRING(v_cnae_clean_icp, 6, 2);
                    v_cnae_code := normalize_cnae_code(v_cnae_formatted_icp);
                  ELSE
                    v_cnae_code := normalize_cnae_code(v_cnae_code);
                  END IF;
                EXCEPTION
                  WHEN OTHERS THEN
                    v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_cnae_code), '.', ''), ' ', ''));
                END;
              EXCEPTION
                WHEN OTHERS THEN
                  v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(v_cnae_code), '.', ''), ' ', ''));
              END;
            END IF;
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            NULL;
        END;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
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
          -- ✅ CRÍTICO: Atualizar também cnae_principal se estiver null
          UPDATE public.qualified_prospects
          SET 
            setor = v_setor_formatted,
            cnae_principal = COALESCE(
              v_prospect.cnae_principal,
              -- Se cnae_principal estava null, salvar o código formatado encontrado
              CASE 
                WHEN v_prospect.cnae_principal IS NULL THEN
                  -- Reverter normalização para formato de exibição (com pontos)
                  CASE 
                    WHEN v_cnae_code LIKE '%-%' THEN
                      -- Formato: "2833-0/00" -> "28.33-0/00"
                      SUBSTRING(v_cnae_code, 1, 2) || '.' || SUBSTRING(v_cnae_code, 3)
                    ELSE
                      v_cnae_code
                  END
                ELSE
                  v_prospect.cnae_principal
              END
            )
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

-- ==========================================
-- TRIGGER: Atualizar setor automaticamente ao inserir/atualizar qualified_prospects
-- ==========================================
-- ✅ CRÍTICO: Garantir que TODAS as empresas futuras sejam atualizadas automaticamente

-- Função do trigger (executa para cada registro)
CREATE OR REPLACE FUNCTION trigger_update_qualified_prospect_sector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cnae_code TEXT;
  v_setor_industria TEXT;
  v_categoria TEXT;
  v_setor_formatted TEXT;
BEGIN
  -- Só processar se setor estiver null, vazio ou não no formato "Setor - Categoria"
  IF NEW.setor IS NULL OR NEW.setor = '' OR NEW.setor NOT LIKE '%-%' THEN
    -- Extrair CNAE usando a mesma lógica da função principal
    v_cnae_code := NULL;
    
    -- Prioridade 1: cnae_principal
    IF NEW.cnae_principal IS NOT NULL AND NEW.cnae_principal != '' THEN
      BEGIN
        DECLARE
          v_cnae_clean TEXT;
          v_cnae_formatted TEXT;
        BEGIN
          v_cnae_clean := REPLACE(REPLACE(REPLACE(REPLACE(TRIM(NEW.cnae_principal), '.', ''), '-', ''), '/', ''), ' ', '');
          IF LENGTH(v_cnae_clean) = 7 AND v_cnae_clean ~ '^[0-9]+$' THEN
            v_cnae_formatted := SUBSTRING(v_cnae_clean, 1, 2) || '.' || 
                               SUBSTRING(v_cnae_clean, 3, 2) || '-' || 
                               SUBSTRING(v_cnae_clean, 5, 1) || '/' || 
                               SUBSTRING(v_cnae_clean, 6, 2);
            v_cnae_code := normalize_cnae_code(v_cnae_formatted);
          ELSE
            v_cnae_code := normalize_cnae_code(NEW.cnae_principal);
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(NEW.cnae_principal), '.', ''), ' ', ''));
        END;
      EXCEPTION
        WHEN OTHERS THEN
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(NEW.cnae_principal), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Prioridade 2: enrichment_data
    IF v_cnae_code IS NULL AND NEW.enrichment_data IS NOT NULL THEN
      BEGIN
        v_cnae_code := extract_cnae_from_raw_data(NEW.enrichment_data);
      EXCEPTION
        WHEN OTHERS THEN
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(
            COALESCE(
              (NEW.enrichment_data->'receita_federal'->'atividade_principal'->0->>'code'),
              (NEW.enrichment_data->'receita'->'atividade_principal'->0->>'code'),
              (NEW.enrichment_data->'atividade_principal'->0->>'code'),
              (NEW.enrichment_data->>'cnae_fiscal'),
              (NEW.enrichment_data->>'cnae_principal')
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
      
      -- Formatar como "Setor - Categoria"
      IF v_setor_industria IS NOT NULL THEN
        IF v_categoria IS NOT NULL THEN
          v_setor_formatted := v_setor_industria || ' - ' || v_categoria;
        ELSE
          v_setor_formatted := v_setor_industria;
        END IF;
        
        -- Atualizar NEW antes de salvar
        NEW.setor := v_setor_formatted;
        
        -- Atualizar cnae_principal se estiver null
        IF NEW.cnae_principal IS NULL THEN
          IF v_cnae_code LIKE '%-%' THEN
            NEW.cnae_principal := SUBSTRING(v_cnae_code, 1, 2) || '.' || SUBSTRING(v_cnae_code, 3);
          ELSE
            NEW.cnae_principal := v_cnae_code;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trigger_qualified_prospects_update_sector ON public.qualified_prospects;
CREATE TRIGGER trigger_qualified_prospects_update_sector
  BEFORE INSERT OR UPDATE ON public.qualified_prospects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_qualified_prospect_sector();

-- Comentário
COMMENT ON FUNCTION trigger_update_qualified_prospect_sector IS 
'MC2.6.24: Trigger automático que atualiza setor e cnae_principal ao inserir/atualizar qualified_prospects. Garante que TODAS as empresas futuras sejam processadas automaticamente.';
