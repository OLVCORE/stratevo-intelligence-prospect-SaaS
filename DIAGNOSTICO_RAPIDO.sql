-- ============================================================================
-- DIAGNÓSTICO RÁPIDO - Verificar estado atual
-- ============================================================================
-- Execute este script PRIMEIRO para ver o que está no banco
-- ============================================================================

SELECT 
    'SETORES' as tipo,
    COUNT(*) as total,
    string_agg(sector_code, ', ' ORDER BY sector_code) as codigos
FROM public.sectors;

SELECT 
    'NICHOS POR SETOR' as tipo,
    sector_code,
    COUNT(*) as total_nichos
FROM public.niches
GROUP BY sector_code
ORDER BY sector_code;

SELECT 
    'TOTAL GERAL' as tipo,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos;

