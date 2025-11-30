-- ============================================================================
-- DIAGNÓSTICO: Verificar estado atual de setores e nichos
-- ============================================================================

-- Verificar setores existentes
SELECT 
    'SETORES EXISTENTES' as tipo,
    COUNT(*) as total,
    string_agg(sector_code, ', ' ORDER BY sector_code) as codigos
FROM public.sectors;

-- Verificar nichos existentes por setor
SELECT 
    sector_code,
    COUNT(*) as total_nichos,
    string_agg(niche_code, ', ' ORDER BY niche_code) as codigos_nichos
FROM public.niches
GROUP BY sector_code
ORDER BY sector_code;

-- Verificar estrutura da tabela sectors
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sectors'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela niches
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'niches'
ORDER BY ordinal_position;

