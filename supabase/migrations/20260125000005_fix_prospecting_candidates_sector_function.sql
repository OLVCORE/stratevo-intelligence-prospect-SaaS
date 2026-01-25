-- ==========================================
-- MC-2.6.2: CORREÇÃO - prospecting_candidates não tem raw_data
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Corrige a função update_prospecting_candidates_sector_from_cnae()
--            A tabela prospecting_candidates não possui raw_data nem cnae_principal.
--            A função agora busca CNAE de outras tabelas relacionadas (icp_analysis_results, companies)
--            via CNPJ.

-- ==========================================
-- RECRIAR FUNÇÃO: update_prospecting_candidates_sector_from_cnae (CORRIGIDA)
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
      cnpj
    FROM public.prospecting_candidates
    WHERE sector IS NULL OR sector = ''
      AND cnpj IS NOT NULL
      AND cnpj != ''
  LOOP
    -- Extrair CNAE de outras tabelas relacionadas via CNPJ
    v_cnae_code := NULL;
    
    -- Prioridade 1: Buscar CNAE de icp_analysis_results (via CNPJ)
    IF v_cnae_code IS NULL THEN
      SELECT cnae_principal INTO v_cnae_code
      FROM public.icp_analysis_results
      WHERE cnpj = v_candidate.cnpj
        AND cnae_principal IS NOT NULL
        AND cnae_principal != ''
      LIMIT 1;
    END IF;
    
    -- Prioridade 2: Buscar CNAE de companies (via CNPJ e raw_data)
    IF v_cnae_code IS NULL THEN
      SELECT extract_cnae_from_raw_data(raw_data) INTO v_cnae_code
      FROM public.companies
      WHERE cnpj = v_candidate.cnpj
        AND raw_data IS NOT NULL
      LIMIT 1;
    END IF;
    
    -- Buscar setor
    IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
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

-- Comentário
COMMENT ON FUNCTION update_prospecting_candidates_sector_from_cnae IS 
'MC2.6.2: Atualiza sector em prospecting_candidates baseado no CNAE usando cnae_classifications. Busca CNAE de icp_analysis_results ou companies via CNPJ, já que prospecting_candidates não possui raw_data. CORRIGIDO: não tenta acessar raw_data que não existe';
