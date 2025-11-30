-- ============================================================================
-- LIMPAR SETORES ANTIGOS E MANTER APENAS OS 25 SETORES CORRETOS
-- ============================================================================
-- Este script remove setores antigos com códigos curtos (AGR, AUTO, CON, etc.)
-- e mantém apenas os 25 setores corretos com códigos completos
-- ============================================================================

-- PASSO 1: Deletar setores antigos com códigos curtos
-- Os nichos associados serão deletados automaticamente via CASCADE
DELETE FROM public.sectors 
WHERE sector_code IN (
    'AGR',      -- Antigo, substituído por 'agro'
    'AUTO',     -- Antigo, substituído por 'automotivo'
    'CON',      -- Antigo, substituído por 'construcao'
    'EDU',      -- Antigo, substituído por 'educacional'
    'FIN',      -- Antigo, substituído por 'financial_services'
    'FOOD',     -- Antigo, substituído por 'alimentacao'
    'HEA',      -- Antigo, substituído por 'saude'
    'LOG',      -- Antigo, substituído por 'logistica'
    'MAN',      -- Antigo, substituído por 'manufatura'
    'RET',      -- Antigo, substituído por 'varejo'
    'SER',      -- Antigo (não tem correspondente direto, mas pode ser removido)
    'TECH'      -- Antigo, substituído por 'tecnologia'
);

-- PASSO 2: Verificar quais setores restaram
SELECT 
    'SETORES RESTANTES' as status,
    sector_code,
    sector_name,
    (SELECT COUNT(*) FROM public.niches WHERE niches.sector_code = sectors.sector_code) as total_nichos
FROM public.sectors
ORDER BY sector_code;

-- PASSO 3: Verificação final
SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos;

-- PASSO 4: Listar setores esperados vs encontrados
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'agro') THEN '✅'
        ELSE '❌'
    END as agro,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'manufatura') THEN '✅'
        ELSE '❌'
    END as manufatura,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'construcao') THEN '✅'
        ELSE '❌'
    END as construcao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'tecnologia') THEN '✅'
        ELSE '❌'
    END as tecnologia,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'logistica') THEN '✅'
        ELSE '❌'
    END as logistica,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'distribuicao') THEN '✅'
        ELSE '❌'
    END as distribuicao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'varejo') THEN '✅'
        ELSE '❌'
    END as varejo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'financial_services') THEN '✅'
        ELSE '❌'
    END as financial_services,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'energia') THEN '✅'
        ELSE '❌'
    END as energia,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'mineracao') THEN '✅'
        ELSE '❌'
    END as mineracao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'quimica') THEN '✅'
        ELSE '❌'
    END as quimica,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'metalurgia') THEN '✅'
        ELSE '❌'
    END as metalurgia,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'papel_celulose') THEN '✅'
        ELSE '❌'
    END as papel_celulose,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'textil') THEN '✅'
        ELSE '❌'
    END as textil,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'automotivo') THEN '✅'
        ELSE '❌'
    END as automotivo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'farmaceutico') THEN '✅'
        ELSE '❌'
    END as farmaceutico,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'alimentacao') THEN '✅'
        ELSE '❌'
    END as alimentacao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'telecomunicacoes') THEN '✅'
        ELSE '❌'
    END as telecomunicacoes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'saude') THEN '✅'
        ELSE '❌'
    END as saude,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'educacional') THEN '✅'
        ELSE '❌'
    END as educacional,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'engenharia') THEN '✅'
        ELSE '❌'
    END as engenharia,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'consultoria') THEN '✅'
        ELSE '❌'
    END as consultoria,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'juridico') THEN '✅'
        ELSE '❌'
    END as juridico,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'imobiliario') THEN '✅'
        ELSE '❌'
    END as imobiliario,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.sectors WHERE sector_code = 'midia_comunicacao') THEN '✅'
        ELSE '❌'
    END as midia_comunicacao;

NOTIFY pgrst, 'reload schema';

