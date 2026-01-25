-- ==========================================
-- MC-2.6.2: CORREÇÃO DEFINITIVA - update_companies_sector_from_cnae
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Força recriação da função update_companies_sector_from_cnae()
--            removendo referência a cnae_principal que não existe em companies
--            A função deve extrair CNAE apenas de raw_data

-- ==========================================
-- RECRIAR FUNÇÃO: update_companies_sector_from_cnae (CORRIGIDA)
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
  -- ✅ CORRIGIDO: NÃO selecionar cnae_principal (coluna não existe em companies)
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
    
    -- Extrair de raw_data usando função auxiliar
    IF v_company.raw_data IS NOT NULL THEN
      v_cnae_code := extract_cnae_from_raw_data(v_company.raw_data);
    END IF;
    
    -- Buscar setor na tabela cnae_classifications
    IF v_cnae_code IS NOT NULL AND v_cnae_code != '' THEN
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

-- Comentário
COMMENT ON FUNCTION update_companies_sector_from_cnae IS 
'MC2.6.2: Atualiza sector_name em companies baseado no CNAE extraído de raw_data usando cnae_classifications. CORRIGIDO: não tenta acessar cnae_principal (coluna não existe)';
