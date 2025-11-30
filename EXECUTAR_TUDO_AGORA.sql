-- ============================================================================
-- EXECUTAR TUDO AGORA - 625 NICHOS
-- ============================================================================
-- Este script:
-- 1. Garante RLS e permissões
-- 2. Deleta nichos existentes
-- 3. Insere TODOS os 625 nichos
-- 4. Força reload do PostgREST
-- ============================================================================

-- PASSO 1: GARANTIR RLS E PERMISSÕES
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
CREATE POLICY "niches_read_all" ON public.niches FOR SELECT TO authenticated, anon USING (true);
GRANT SELECT ON public.niches TO authenticated, anon;

-- PASSO 2: DELETAR TODOS OS NICHOS EXISTENTES
DELETE FROM public.niches;

-- PASSO 3: EXECUTAR O ARQUIVO ADICIONAR_NICHOS_COMPLETO_B2B.sql
-- IMPORTANTE: Copie e cole TODO o conteúdo do arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql
-- a partir da linha 206 (onde começam os INSERTs) até a linha 916
-- OU simplesmente execute o arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql COMPLETO

-- PASSO 4: FORÇAR RELOAD DO POSTGREST
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.niches IS 'Catálogo de nichos B2B - Atualizado: ' || NOW()::TEXT;
NOTIFY pgrst, 'reload schema';

-- VERIFICAÇÃO
SELECT 
    '✅ SCRIPT EXECUTADO' as status,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.niches) >= 600 THEN '✅ Todos os nichos inseridos!'
        ELSE '⚠️ Execute ADICIONAR_NICHOS_COMPLETO_B2B.sql para inserir todos os 625 nichos'
    END as resultado;

-- Mostrar nichos por setor
SELECT sector_code, COUNT(*) as total_nichos_por_setor 
FROM public.niches 
GROUP BY sector_code 
ORDER BY sector_code;
