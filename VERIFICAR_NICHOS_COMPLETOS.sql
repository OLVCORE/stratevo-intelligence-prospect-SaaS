-- ============================================================================
-- VERIFICAÇÃO COMPLETA DOS NICHOS
-- ============================================================================
-- Este script verifica se todos os 625 nichos foram inseridos corretamente
-- ============================================================================

-- 1. Total de nichos (deve ser ~625)
SELECT 
    '📊 TOTAL DE NICHOS' as tipo,
    COUNT(*) as total_nichos,
    CASE 
        WHEN COUNT(*) >= 600 THEN '✅ OK (≥600 nichos)'
        WHEN COUNT(*) >= 500 THEN '⚠️ PARCIAL (500-599 nichos)'
        ELSE '❌ INSUFICIENTE (<500 nichos)'
    END as status
FROM public.niches;

-- 2. Nichos por setor (deve ser 25-30 por setor)
SELECT 
    '📋 NICHOS POR SETOR' as tipo,
    s.sector_code,
    s.sector_name,
    COUNT(n.id) as total_nichos,
    CASE 
        WHEN COUNT(n.id) >= 20 THEN '✅ OK'
        WHEN COUNT(n.id) >= 10 THEN '⚠️ PARCIAL'
        ELSE '❌ INSUFICIENTE'
    END as status
FROM public.sectors s
LEFT JOIN public.niches n ON n.sector_code = s.sector_code
GROUP BY s.sector_code, s.sector_name
ORDER BY total_nichos DESC, s.sector_code;

-- 3. Verificar setores com menos de 20 nichos (problema)
SELECT 
    '⚠️ SETORES COM POUCOS NICHOS' as tipo,
    s.sector_code,
    s.sector_name,
    COUNT(n.id) as total_nichos
FROM public.sectors s
LEFT JOIN public.niches n ON n.sector_code = s.sector_code
GROUP BY s.sector_code, s.sector_name
HAVING COUNT(n.id) < 20
ORDER BY total_nichos;

-- 4. Verificar se há nichos duplicados (mesmo sector_code + niche_code)
SELECT 
    '⚠️ NICHOS DUPLICADOS' as tipo,
    sector_code,
    niche_code,
    COUNT(*) as total_duplicados
FROM public.niches
GROUP BY sector_code, niche_code
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC, sector_code, niche_code;

-- 5. Verificar nichos sem setor (não deve existir)
SELECT 
    '⚠️ NICHOS SEM SETOR' as tipo,
    n.sector_code,
    COUNT(*) as total_nichos
FROM public.niches n
LEFT JOIN public.sectors s ON s.sector_code = n.sector_code
WHERE s.sector_code IS NULL
GROUP BY n.sector_code;

-- 6. Resumo final
SELECT 
    '✅ RESUMO FINAL' as tipo,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    (SELECT COUNT(DISTINCT sector_code) FROM public.niches) as setores_com_nichos,
    (SELECT ROUND(AVG(cnt), 2) FROM (
        SELECT COUNT(*) as cnt 
        FROM public.niches 
        GROUP BY sector_code
    ) sub) as media_nichos_por_setor,
    (SELECT MIN(cnt) FROM (
        SELECT COUNT(*) as cnt 
        FROM public.niches 
        GROUP BY sector_code
    ) sub) as min_nichos_por_setor,
    (SELECT MAX(cnt) FROM (
        SELECT COUNT(*) as cnt 
        FROM public.niches 
        GROUP BY sector_code
    ) sub) as max_nichos_por_setor;

-- 7. Listar alguns nichos de exemplo por setor
SELECT 
    '📝 EXEMPLOS DE NICHOS' as tipo,
    n.sector_code,
    n.niche_code,
    n.niche_name
FROM public.niches n
WHERE n.sector_code IN ('agro', 'manufatura', 'tecnologia', 'financial_services', 'educacional')
ORDER BY n.sector_code, n.niche_name
LIMIT 20;

