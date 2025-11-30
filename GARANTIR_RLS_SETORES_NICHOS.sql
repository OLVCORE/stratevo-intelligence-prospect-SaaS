-- ============================================================================
-- GARANTIR RLS E PERMISSÕES PARA SETORES E NICHOS
-- ============================================================================
-- Este script garante que as tabelas sectors e niches estão acessíveis via PostgREST
-- Execute este script e depois REINICIE o projeto Supabase
-- ============================================================================

-- 1. Garantir que as tabelas existem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sectors') THEN
        RAISE EXCEPTION 'Tabela public.sectors não existe! Execute ADICIONAR_SETORES_PRINCIPAIS_B2B.sql primeiro.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'niches') THEN
        RAISE EXCEPTION 'Tabela public.niches não existe! Execute ADICIONAR_NICHOS_COMPLETO_B2B.sql primeiro.';
    END IF;
END $$;

-- 2. Habilitar RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "sectors_read_all" ON public.sectors;
DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
DROP POLICY IF EXISTS "Authenticated users can read sectors" ON public.sectors;
DROP POLICY IF EXISTS "Authenticated users can read niches" ON public.niches;
DROP POLICY IF EXISTS "Public read access on sectors" ON public.sectors;
DROP POLICY IF EXISTS "Public read access on niches" ON public.niches;

-- 4. Criar políticas permissivas para leitura (autenticados e anônimos)
CREATE POLICY "sectors_read_all"
ON public.sectors
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "niches_read_all"
ON public.niches
FOR SELECT
TO authenticated, anon
USING (true);

-- IMPORTANTE: A política acima permite acesso anônimo também
-- Se você quiser apenas autenticados, remova "anon" das políticas

-- 5. Garantir permissões GRANT
GRANT SELECT ON public.sectors TO authenticated, anon;
GRANT SELECT ON public.niches TO authenticated, anon;

-- 6. Verificar se as tabelas estão no schema público exposto
DO $$
BEGIN
    RAISE NOTICE '✅ RLS e permissões configuradas para sectors e niches';
    RAISE NOTICE '⚠️ IMPORTANTE: Verifique se o schema "public" está exposto no Supabase Dashboard → Settings → API → Exposed schemas';
    RAISE NOTICE '⚠️ IMPORTANTE: REINICIE o projeto Supabase após executar este script (Settings → General → Restart Project)';
END $$;

-- 7. Forçar reload do PostgREST (e atualizar comentários com timestamp)
NOTIFY pgrst, 'reload schema';

DO $do$
DECLARE
  ts text := to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format(
    'COMMENT ON TABLE public.sectors IS %L;',
    'Catálogo de setores B2B - Atualizado: ' || ts
  );
  EXECUTE format(
    'COMMENT ON TABLE public.niches IS %L;',
    'Catálogo de nichos B2B - Atualizado: ' || ts
  );
END
$do$;

NOTIFY pgrst, 'reload schema';

-- 8. Verificar se há nichos no banco
DO $$
DECLARE
    total_nichos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_nichos FROM public.niches;
    IF total_nichos < 600 THEN
        RAISE WARNING '⚠️ Apenas % nichos encontrados. Execute ADICIONAR_NICHOS_COMPLETO_B2B.sql para inserir todos os 625 nichos!', total_nichos;
    ELSE
        RAISE NOTICE '✅ % nichos encontrados no banco!', total_nichos;
    END IF;
END $$;

-- 9. Verificação final
SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors') as policies_sectors,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches') as policies_niches;

