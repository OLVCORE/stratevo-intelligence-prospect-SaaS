-- ============================================================================
-- CORRIGIR COLUNA sector_code PARA TEXT (ANTES DE EXECUTAR NICHOS)
-- ============================================================================
-- Execute este script se receber erro "value too long for type character varying(10)"
-- ============================================================================

-- Verificar tipo atual da coluna
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    CASE 
        WHEN data_type = 'text' THEN '✅ Já é TEXT'
        WHEN data_type = 'character varying' AND character_maximum_length < 64 THEN '❌ Precisa alterar para TEXT'
        ELSE '⚠️ Tipo: ' || data_type
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sectors' 
  AND column_name = 'sector_code';

-- Alterar coluna para TEXT se necessário
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sectors' 
        AND column_name = 'sector_code'
        AND (data_type = 'character varying' AND (character_maximum_length IS NULL OR character_maximum_length < 64))
    ) THEN
        ALTER TABLE public.sectors ALTER COLUMN sector_code TYPE TEXT;
        RAISE NOTICE '✅ Coluna sector_code alterada para TEXT com sucesso!';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sectors' 
        AND column_name = 'sector_code'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE '✅ Coluna sector_code já é TEXT - nada a fazer!';
    ELSE
        RAISE NOTICE '⚠️ Tabela sectors ou coluna sector_code não encontrada!';
    END IF;
END $$;

-- Verificar tipo após alteração
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    '✅ Tipo corrigido!' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sectors' 
  AND column_name = 'sector_code';

