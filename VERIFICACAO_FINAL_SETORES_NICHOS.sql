-- ============================================================================
-- VERIFICAÇÃO FINAL - SETORES E NICHOS
-- ============================================================================
-- Execute este script após LIMPAR_SETORES_ANTIGOS.sql e ADICIONAR_NICHOS_COMPLETO_B2B.sql
-- ============================================================================

-- 1. Total de setores e nichos
SELECT 
    '📊 RESUMO GERAL' as tipo,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos;

-- 2. Nichos por setor (deve mostrar 25 setores com 20-30 nichos cada)
SELECT 
    '📋 NICHOS POR SETOR' as tipo,
    s.sector_code,
    s.sector_name,
    COUNT(n.id) as total_nichos
FROM public.sectors s
LEFT JOIN public.niches n ON n.sector_code = s.sector_code
GROUP BY s.sector_code, s.sector_name
ORDER BY s.sector_code;

-- 3. Verificar se todos os 25 setores esperados estão presentes
SELECT 
    '✅ VERIFICAÇÃO DOS 25 SETORES' as tipo,
    COUNT(*) FILTER (WHERE sector_code = 'agro') as agro,
    COUNT(*) FILTER (WHERE sector_code = 'manufatura') as manufatura,
    COUNT(*) FILTER (WHERE sector_code = 'construcao') as construcao,
    COUNT(*) FILTER (WHERE sector_code = 'tecnologia') as tecnologia,
    COUNT(*) FILTER (WHERE sector_code = 'logistica') as logistica,
    COUNT(*) FILTER (WHERE sector_code = 'distribuicao') as distribuicao,
    COUNT(*) FILTER (WHERE sector_code = 'varejo') as varejo,
    COUNT(*) FILTER (WHERE sector_code = 'financial_services') as financial_services,
    COUNT(*) FILTER (WHERE sector_code = 'energia') as energia,
    COUNT(*) FILTER (WHERE sector_code = 'mineracao') as mineracao,
    COUNT(*) FILTER (WHERE sector_code = 'quimica') as quimica,
    COUNT(*) FILTER (WHERE sector_code = 'metalurgia') as metalurgia,
    COUNT(*) FILTER (WHERE sector_code = 'papel_celulose') as papel_celulose,
    COUNT(*) FILTER (WHERE sector_code = 'textil') as textil,
    COUNT(*) FILTER (WHERE sector_code = 'automotivo') as automotivo,
    COUNT(*) FILTER (WHERE sector_code = 'farmaceutico') as farmaceutico,
    COUNT(*) FILTER (WHERE sector_code = 'alimentacao') as alimentacao,
    COUNT(*) FILTER (WHERE sector_code = 'telecomunicacoes') as telecomunicacoes,
    COUNT(*) FILTER (WHERE sector_code = 'saude') as saude,
    COUNT(*) FILTER (WHERE sector_code = 'educacional') as educacional,
    COUNT(*) FILTER (WHERE sector_code = 'engenharia') as engenharia,
    COUNT(*) FILTER (WHERE sector_code = 'consultoria') as consultoria,
    COUNT(*) FILTER (WHERE sector_code = 'juridico') as juridico,
    COUNT(*) FILTER (WHERE sector_code = 'imobiliario') as imobiliario,
    COUNT(*) FILTER (WHERE sector_code = 'midia_comunicacao') as midia_comunicacao
FROM public.sectors;

-- 4. Verificar se há setores inesperados (não devem existir)
SELECT 
    '⚠️ SETORES INESPERADOS (devem ser removidos)' as tipo,
    sector_code,
    sector_name
FROM public.sectors
WHERE sector_code NOT IN (
    'agro', 'manufatura', 'construcao', 'tecnologia', 'logistica',
    'distribuicao', 'varejo', 'financial_services', 'energia', 'mineracao',
    'quimica', 'metalurgia', 'papel_celulose', 'textil', 'automotivo',
    'farmaceutico', 'alimentacao', 'telecomunicacoes', 'saude', 'educacional',
    'engenharia', 'consultoria', 'juridico', 'imobiliario', 'midia_comunicacao'
)
ORDER BY sector_code;

-- 5. Verificar setores com menos de 20 nichos (pode indicar problema)
SELECT 
    '⚠️ SETORES COM POUCOS NICHOS (< 20)' as tipo,
    s.sector_code,
    s.sector_name,
    COUNT(n.id) as total_nichos
FROM public.sectors s
LEFT JOIN public.niches n ON n.sector_code = s.sector_code
GROUP BY s.sector_code, s.sector_name
HAVING COUNT(n.id) < 20
ORDER BY total_nichos;

