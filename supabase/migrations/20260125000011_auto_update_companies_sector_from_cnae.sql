-- ==========================================
-- MC-2.6.40: TRIGGER AUTOMÁTICO - Atualizar setor/categoria em companies
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Cria trigger automático que atualiza sector_name em companies
--            baseado no CNAE extraído de raw_data após enriquecimento Receita Federal
--            Formato: "Setor - Categoria" (igual ao usado em qualified_prospects)
--            ✅ CRÍTICO: Garante que TODAS as empresas futuras sejam atualizadas automaticamente
--            quando raw_data é atualizado com dados da Receita Federal
--
-- PRÉ-REQUISITOS:
-- - Função extract_cnae_from_raw_data() deve existir (criada em 20260125000003)
-- - Função normalize_cnae_code() deve existir (criada em 20260125000002)
-- - Tabela cnae_classifications deve existir com colunas: cnae_code, setor_industria, categoria

-- ==========================================
-- FUNÇÃO DO TRIGGER: Atualizar setor automaticamente ao inserir/atualizar companies
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_update_company_sector_from_cnae()
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
  -- Só processar se sector_name estiver null, vazio ou não no formato "Setor - Categoria"
  -- OU se raw_data foi atualizado (enriquecimento Receita Federal)
  IF (NEW.sector_name IS NULL OR NEW.sector_name = '' OR NEW.sector_name NOT LIKE '%-%') 
     OR (TG_OP = 'UPDATE' AND (OLD.raw_data IS DISTINCT FROM NEW.raw_data)) THEN
    
    -- Extrair CNAE de raw_data usando função auxiliar
    v_cnae_code := NULL;
    
    -- Prioridade: raw_data (enriquecimento Receita Federal)
    IF NEW.raw_data IS NOT NULL THEN
      BEGIN
        v_cnae_code := extract_cnae_from_raw_data(NEW.raw_data);
      EXCEPTION
        WHEN OTHERS THEN
          -- Fallback: tentar extrair manualmente
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(
            COALESCE(
              (NEW.raw_data->'receita_federal'->'atividade_principal'->0->>'code'),
              (NEW.raw_data->'receita'->'atividade_principal'->0->>'code'),
              (NEW.raw_data->'atividade_principal'->0->>'code'),
              (NEW.raw_data->>'cnae_fiscal'),
              (NEW.raw_data->>'cnae_principal')
            )
          ), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Buscar setor e categoria na tabela cnae_classifications
    IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
      SELECT setor_industria, categoria 
      INTO v_setor_industria, v_categoria
      FROM public.cnae_classifications
      WHERE cnae_code = normalize_cnae_code(v_cnae_code)
      LIMIT 1;
      
      -- Formatar como "Setor - Categoria" (mesmo formato de qualified_prospects)
      IF v_setor_industria IS NOT NULL THEN
        IF v_categoria IS NOT NULL THEN
          v_setor_formatted := v_setor_industria || ' - ' || v_categoria;
        ELSE
          v_setor_formatted := v_setor_industria;
        END IF;
        
        -- Atualizar NEW antes de salvar
        NEW.sector_name := v_setor_formatted;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ==========================================
-- CRIAR TRIGGER: BEFORE INSERT OR UPDATE
-- ==========================================
DROP TRIGGER IF EXISTS trigger_companies_update_sector_from_cnae ON public.companies;
CREATE TRIGGER trigger_companies_update_sector_from_cnae
  BEFORE INSERT OR UPDATE OF raw_data, sector_name ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_company_sector_from_cnae();

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON FUNCTION trigger_update_company_sector_from_cnae IS 
'MC2.6.40: Trigger automático que atualiza sector_name em companies com formato "Setor - Categoria" baseado em cnae_classifications. Executa automaticamente quando raw_data é atualizado (ex: enriquecimento Receita Federal).';

COMMENT ON TRIGGER trigger_companies_update_sector_from_cnae ON public.companies IS 
'MC2.6.40: Atualiza sector_name automaticamente ao inserir/atualizar companies quando raw_data contém CNAE da Receita Federal. Garante que TODAS as empresas futuras sejam processadas automaticamente.';

-- ==========================================
-- TRIGGER AUTOMÁTICO: Atualizar setor/categoria em icp_analysis_results
-- ==========================================
-- ✅ CRÍTICO: Garantir que Leads Aprovados também sejam atualizados automaticamente

-- Função do trigger para icp_analysis_results
CREATE OR REPLACE FUNCTION trigger_update_icp_analysis_results_sector_from_cnae()
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
  -- OU se raw_analysis foi atualizado (enriquecimento Receita Federal)
  IF (NEW.setor IS NULL OR NEW.setor = '' OR NEW.setor NOT LIKE '%-%') 
     OR (TG_OP = 'UPDATE' AND (OLD.raw_analysis IS DISTINCT FROM NEW.raw_analysis)) THEN
    
    -- Extrair CNAE
    v_cnae_code := NULL;
    
    -- Prioridade 1: cnae_principal direto
    IF NEW.cnae_principal IS NOT NULL AND NEW.cnae_principal != '' THEN
      BEGIN
        v_cnae_code := normalize_cnae_code(NEW.cnae_principal);
      EXCEPTION
        WHEN OTHERS THEN
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(NEW.cnae_principal), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Prioridade 2: raw_analysis (enriquecimento Receita Federal)
    IF v_cnae_code IS NULL AND NEW.raw_analysis IS NOT NULL THEN
      BEGIN
        -- Tentar extrair de raw_analysis.receita_federal.data
        IF NEW.raw_analysis->'receita_federal'->'data' IS NOT NULL THEN
          v_cnae_code := extract_cnae_from_raw_data(NEW.raw_analysis->'receita_federal'->'data');
        END IF;
        
        -- Se não encontrou, tentar raw_analysis.receita
        IF v_cnae_code IS NULL AND NEW.raw_analysis->'receita' IS NOT NULL THEN
          v_cnae_code := extract_cnae_from_raw_data(NEW.raw_analysis->'receita');
        END IF;
        
        -- Se ainda não encontrou, tentar raw_analysis diretamente
        IF v_cnae_code IS NULL THEN
          v_cnae_code := extract_cnae_from_raw_data(NEW.raw_analysis);
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Fallback: tentar extrair manualmente
          v_cnae_code := UPPER(REPLACE(REPLACE(TRIM(
            COALESCE(
              (NEW.raw_analysis->'receita_federal'->'data'->'atividade_principal'->0->>'code'),
              (NEW.raw_analysis->'receita'->'atividade_principal'->0->>'code'),
              (NEW.raw_analysis->'atividade_principal'->0->>'code'),
              (NEW.raw_analysis->>'cnae_fiscal'),
              (NEW.raw_analysis->>'cnae_principal')
            )
          ), '.', ''), ' ', ''));
      END;
    END IF;
    
    -- Prioridade 3: raw_data (fallback)
    IF v_cnae_code IS NULL AND NEW.raw_data IS NOT NULL THEN
      BEGIN
        v_cnae_code := extract_cnae_from_raw_data(NEW.raw_data);
      EXCEPTION
        WHEN OTHERS THEN
          NULL; -- Ignorar erro
      END;
    END IF;
    
    -- Buscar setor e categoria na tabela cnae_classifications
    IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
      SELECT setor_industria, categoria 
      INTO v_setor_industria, v_categoria
      FROM public.cnae_classifications
      WHERE cnae_code = normalize_cnae_code(v_cnae_code)
      LIMIT 1;
      
      -- Formatar como "Setor - Categoria" (mesmo formato de qualified_prospects e companies)
      IF v_setor_industria IS NOT NULL THEN
        IF v_categoria IS NOT NULL THEN
          v_setor_formatted := v_setor_industria || ' - ' || v_categoria;
        ELSE
          v_setor_formatted := v_setor_industria;
        END IF;
        
        -- Atualizar NEW antes de salvar
        NEW.setor := v_setor_formatted;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger BEFORE INSERT OR UPDATE para icp_analysis_results
DROP TRIGGER IF EXISTS trigger_icp_analysis_results_update_sector_from_cnae ON public.icp_analysis_results;
CREATE TRIGGER trigger_icp_analysis_results_update_sector_from_cnae
  BEFORE INSERT OR UPDATE OF cnae_principal, raw_analysis, raw_data, setor ON public.icp_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_icp_analysis_results_sector_from_cnae();

-- Comentários
COMMENT ON FUNCTION trigger_update_icp_analysis_results_sector_from_cnae IS 
'MC2.6.40: Trigger automático que atualiza setor em icp_analysis_results com formato "Setor - Categoria" baseado em cnae_classifications. Executa automaticamente quando raw_analysis é atualizado (ex: enriquecimento Receita Federal).';

COMMENT ON TRIGGER trigger_icp_analysis_results_update_sector_from_cnae ON public.icp_analysis_results IS 
'MC2.6.40: Atualiza setor automaticamente ao inserir/atualizar icp_analysis_results quando raw_analysis contém CNAE da Receita Federal. Garante que TODOS os leads aprovados sejam processados automaticamente.';
