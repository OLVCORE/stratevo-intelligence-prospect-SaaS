-- ==========================================
-- MC-2.6.2: CORREÇÃO - Nome da tabela qualified_prospects
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Corrige a função update_qualified_prospects_sector_from_cnae()
--            para usar a tabela correta: qualified_prospects (não qualified_prospects_stock)
--            e a coluna correta: enrichment_data (não enrichment)

-- ==========================================
-- RECRIAR FUNÇÃO: update_qualified_prospects_sector_from_cnae (CORRIGIDA)
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

-- Comentário
COMMENT ON FUNCTION update_qualified_prospects_sector_from_cnae IS 
'MC2.6.2: Atualiza setor em qualified_prospects baseado no CNAE usando cnae_classifications. CORRIGIDO: usa tabela qualified_prospects e coluna enrichment_data';
