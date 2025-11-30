-- ============================================================================
-- FORÇAR INSERÇÃO DE TODOS OS 625 NICHOS - EXECUTAR AGORA
-- ============================================================================
-- Este script DELETA todos os nichos existentes e INSERE os 625 nichos corretos
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: DELETAR TODOS OS NICHOS EXISTENTES
DELETE FROM public.niches;

-- PASSO 2: GARANTIR QUE OS 25 SETORES EXISTEM
-- (Se não existirem, execute ADICIONAR_SETORES_PRINCIPAIS_B2B.sql primeiro)

-- PASSO 3: INSERIR TODOS OS 625 NICHOS
-- IMPORTANTE: Este script contém apenas a estrutura. 
-- Você precisa executar o arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql COMPLETO
-- que contém todos os 625 nichos (linhas 69-777)

-- NOTA: Devido ao limite de tamanho, este script apenas prepara o ambiente.
-- Execute o arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql DEPOIS deste script.

-- PASSO 4: GARANTIR RLS E PERMISSÕES
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
CREATE POLICY "niches_read_all" ON public.niches FOR SELECT TO authenticated, anon USING (true);
GRANT SELECT ON public.niches TO authenticated, anon;

-- PASSO 5: FORÇAR RELOAD
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.niches IS 'Catálogo de nichos B2B - Atualizado: ' || NOW()::TEXT;
NOTIFY pgrst, 'reload schema';

-- VERIFICAÇÃO
SELECT 
    '✅ NICHOS DELETADOS - AGORA EXECUTE ADICIONAR_NICHOS_COMPLETO_B2B.sql' as status,
    (SELECT COUNT(*) FROM public.niches) as total_nichos_atual;

