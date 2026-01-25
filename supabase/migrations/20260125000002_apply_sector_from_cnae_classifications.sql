-- ==========================================
-- MC-2.6.2: APLICAR SETOR DE cnae_classifications EM TODAS AS TABELAS
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Aplica o mapeamento CNAE → setor_industria da tabela cnae_classifications
--            para popular a coluna sector/setor nas tabelas:
--            - companies (sector_name)
--            - qualified_prospects_stock (setor)
--            - prospecting_candidates (sector)
--            - icp_analysis_results (setor - se existir, senão criar)
--
-- Mecanismo: Mesmo usado no Step3 do onboarding ICP que mostra badges com setor e categoria

-- ==========================================
-- FUNÇÃO AUXILIAR: Normalizar código CNAE para formato do banco
-- ==========================================
CREATE OR REPLACE FUNCTION normalize_cnae_code(p_cnae_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_cnae_code IS NULL OR p_cnae_code = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remover pontos, espaços e converter para maiúsculas
  -- Ex: "62.03-1/00" -> "6203-1/00"
  RETURN UPPER(REPLACE(REPLACE(TRIM(p_cnae_code), '.', ''), ' ', ''));
END;
$$;

-- ==========================================
-- FUNÇÃO AUXILIAR: Extrair CNAE de raw_data JSONB
-- ==========================================
CREATE OR REPLACE FUNCTION extract_cnae_from_raw_data(p_raw_data JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_cnae TEXT;
BEGIN
  IF p_raw_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- ✅ CORRIGIDO: Usar COALESCE em vez de OR (OR só funciona com boolean)
  -- Tentar múltiplas estruturas possíveis, retornando o primeiro não-nulo
  v_cnae := COALESCE(
    NULLIF(p_raw_data->'receita_federal'->'atividade_principal'->0->>'code', ''),
    NULLIF(p_raw_data->'receita'->'atividade_principal'->0->>'code', ''),
    NULLIF(p_raw_data->'atividade_principal'->0->>'code', ''),
    NULLIF(p_raw_data->>'cnae_fiscal', ''),
    NULLIF(p_raw_data->>'cnae_principal', '')
  );
  
  RETURN normalize_cnae_code(v_cnae);
END;
$$;

-- ==========================================
-- FUNÇÃO: Obter setor_industria de um CNAE
-- ==========================================
CREATE OR REPLACE FUNCTION get_sector_from_cnae(p_cnae_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_setor TEXT;
  v_normalized_cnae TEXT;
BEGIN
  IF p_cnae_code IS NULL OR p_cnae_code = '' THEN
    RETURN NULL;
  END IF;
  
  v_normalized_cnae := normalize_cnae_code(p_cnae_code);
  
  -- Buscar na tabela cnae_classifications
  SELECT setor_industria INTO v_setor
  FROM public.cnae_classifications
  WHERE cnae_code = v_normalized_cnae
  LIMIT 1;
  
  RETURN v_setor;
END;
$$;

-- ==========================================
-- 1. ADICIONAR COLUNA setor EM icp_analysis_results (se não existir)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'icp_analysis_results' 
    AND column_name = 'setor'
  ) THEN
    ALTER TABLE public.icp_analysis_results ADD COLUMN setor TEXT;
    CREATE INDEX IF NOT EXISTS idx_icp_analysis_results_setor 
      ON public.icp_analysis_results(setor) WHERE setor IS NOT NULL;
    RAISE NOTICE 'Coluna setor adicionada em icp_analysis_results';
  END IF;
END $$;

-- ==========================================
-- 2. FUNÇÃO: Atualizar setor em companies baseado em CNAE
-- ==========================================
CREATE OR REPLACE FUNCTION update_companies_sector_from_cnae()
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company RECORD;
  v_cnae_code TEXT;
  v_setor TEXT;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_company IN 
    SELECT 
      id,
      raw_data,
      sector_name
    FROM public.companies
    WHERE sector_name IS NULL OR sector_name = ''
  LOOP
    -- Extrair CNAE apenas de raw_data (cnae_principal não existe em companies)
    v_cnae_code := NULL;
    
    -- Extrair de raw_data
    IF v_company.raw_data IS NOT NULL THEN
      v_cnae_code := extract_cnae_from_raw_data(v_company.raw_data);
    END IF;
    
    -- Buscar setor
    IF v_cnae_code IS NOT NULL THEN
      v_setor := get_sector_from_cnae(v_cnae_code);
      
      IF v_setor IS NOT NULL THEN
        UPDATE public.companies
        SET sector_name = v_setor
        WHERE id = v_company.id;
        
        v_updated := v_updated + 1;
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
-- 3. FUNÇÃO: Atualizar setor em qualified_prospects baseado em CNAE
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
  v_setor TEXT;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_prospect IN 
    SELECT 
      id,
      cnae_principal,
      enrichment_data
    FROM public.qualified_prospects
    WHERE setor IS NULL OR setor = ''
  LOOP
    -- Extrair CNAE
    v_cnae_code := NULL;
    
    -- Prioridade 1: cnae_principal direto (se existir)
    IF v_prospect.cnae_principal IS NOT NULL AND v_prospect.cnae_principal != '' THEN
      v_cnae_code := normalize_cnae_code(v_prospect.cnae_principal);
    END IF;
    
    -- Prioridade 2: enrichment_data (estrutura do qualified_prospects)
    IF v_cnae_code IS NULL AND v_prospect.enrichment_data IS NOT NULL THEN
      v_cnae_code := extract_cnae_from_raw_data(v_prospect.enrichment_data);
    END IF;
    
    -- Buscar setor
    IF v_cnae_code IS NOT NULL THEN
      v_setor := get_sector_from_cnae(v_cnae_code);
      
      IF v_setor IS NOT NULL THEN
        UPDATE public.qualified_prospects
        SET setor = v_setor
        WHERE id = v_prospect.id;
        
        v_updated := v_updated + 1;
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
-- 4. FUNÇÃO: Atualizar setor em prospecting_candidates baseado em CNAE
-- ==========================================
CREATE OR REPLACE FUNCTION update_prospecting_candidates_sector_from_cnae()
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidate RECORD;
  v_cnae_code TEXT;
  v_setor TEXT;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_candidate IN 
    SELECT 
      id,
      raw_data
    FROM public.prospecting_candidates
    WHERE sector IS NULL OR sector = ''
  LOOP
    -- Extrair CNAE de raw_data
    v_cnae_code := NULL;
    
    IF v_candidate.raw_data IS NOT NULL THEN
      v_cnae_code := extract_cnae_from_raw_data(v_candidate.raw_data);
    END IF;
    
    -- Buscar setor
    IF v_cnae_code IS NOT NULL THEN
      v_setor := get_sector_from_cnae(v_cnae_code);
      
      IF v_setor IS NOT NULL THEN
        UPDATE public.prospecting_candidates
        SET sector = v_setor
        WHERE id = v_candidate.id;
        
        v_updated := v_updated + 1;
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
-- 5. FUNÇÃO: Atualizar setor em icp_analysis_results baseado em CNAE
-- ==========================================
CREATE OR REPLACE FUNCTION update_icp_analysis_results_sector_from_cnae()
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
  v_setor TEXT;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOR v_result IN 
    SELECT 
      id,
      cnae_principal,
      raw_data
    FROM public.icp_analysis_results
    WHERE setor IS NULL OR setor = ''
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
    
    -- Buscar setor
    IF v_cnae_code IS NOT NULL THEN
      v_setor := get_sector_from_cnae(v_cnae_code);
      
      IF v_setor IS NOT NULL THEN
        UPDATE public.icp_analysis_results
        SET setor = v_setor
        WHERE id = v_result.id;
        
        v_updated := v_updated + 1;
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
-- 6. FUNÇÃO: Atualizar setor em approve_company_to_leads (durante aprovação)
-- ==========================================
-- Esta função será integrada na função approve_company_to_leads
-- para garantir que o setor seja populado durante a aprovação

-- ==========================================
-- 7. EXECUTAR ATUALIZAÇÃO INICIAL (OPCIONAL - pode ser executado manualmente)
-- ==========================================
-- Descomente as linhas abaixo para executar a atualização imediatamente:
-- 
-- DO $$
-- DECLARE
--   v_companies_result RECORD;
--   v_qualified_result RECORD;
--   v_prospecting_result RECORD;
--   v_icp_result RECORD;
-- BEGIN
--   SELECT * INTO v_companies_result FROM update_companies_sector_from_cnae();
--   RAISE NOTICE 'Companies: % atualizadas, % puladas', v_companies_result.updated_count, v_companies_result.skipped_count;
--   
--   SELECT * INTO v_qualified_result FROM update_qualified_prospects_sector_from_cnae();
--   RAISE NOTICE 'Qualified Prospects: % atualizadas, % puladas', v_qualified_result.updated_count, v_qualified_result.skipped_count;
--   
--   SELECT * INTO v_prospecting_result FROM update_prospecting_candidates_sector_from_cnae();
--   RAISE NOTICE 'Prospecting Candidates: % atualizadas, % puladas', v_prospecting_result.updated_count, v_prospecting_result.skipped_count;
--   
--   SELECT * INTO v_icp_result FROM update_icp_analysis_results_sector_from_cnae();
--   RAISE NOTICE 'ICP Analysis Results: % atualizadas, % puladas', v_icp_result.updated_count, v_icp_result.skipped_count;
-- END $$;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================
COMMENT ON FUNCTION normalize_cnae_code IS 
'Normaliza código CNAE removendo pontos e espaços para formato do banco (ex: "62.03-1/00" -> "6203-1/00")';

COMMENT ON FUNCTION extract_cnae_from_raw_data IS 
'Extrai código CNAE de raw_data JSONB tentando múltiplas estruturas possíveis';

COMMENT ON FUNCTION get_sector_from_cnae IS 
'Busca setor_industria na tabela cnae_classifications baseado no código CNAE';

COMMENT ON FUNCTION update_companies_sector_from_cnae IS 
'Atualiza sector_name em companies baseado no CNAE usando cnae_classifications';

COMMENT ON FUNCTION update_qualified_prospects_sector_from_cnae IS 
'Atualiza setor em qualified_prospects baseado no CNAE usando cnae_classifications';

COMMENT ON FUNCTION update_prospecting_candidates_sector_from_cnae IS 
'Atualiza sector em prospecting_candidates baseado no CNAE usando cnae_classifications';

COMMENT ON FUNCTION update_icp_analysis_results_sector_from_cnae IS 
'Atualiza setor em icp_analysis_results baseado no CNAE usando cnae_classifications';
