-- ============================================================================
-- FORÇAR POSTGREST A RECONHECER AS TABELAS SETORES E NICHOS
-- ============================================================================
-- Este script força o PostgREST a reconhecer as tabelas sectors e niches
-- Execute este script e DEPOIS REINICIE o projeto Supabase
-- ============================================================================

-- 1. Verificar se as tabelas existem
DO $$
DECLARE
    total_setores INTEGER;
    total_nichos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_setores FROM public.sectors;
    SELECT COUNT(*) INTO total_nichos FROM public.niches;
    
    IF total_setores = 0 THEN
        RAISE EXCEPTION 'Tabela sectors existe mas está vazia!';
    END IF;
    
    IF total_nichos = 0 THEN
        RAISE EXCEPTION 'Tabela niches existe mas está vazia!';
    END IF;
    
    RAISE NOTICE '✅ Tabelas verificadas: % setores e % nichos encontrados', total_setores, total_nichos;
END $$;

-- 2. Garantir que RLS está habilitado (mas permissivo)
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover políticas de sectors
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sectors', r.policyname);
    END LOOP;
    
    -- Remover políticas de niches
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.niches', r.policyname);
    END LOOP;
END $$;

-- 4. Criar políticas PERMISSIVAS (somente SELECT)
CREATE POLICY "sectors_read_all"
ON public.sectors
FOR SELECT
TO authenticated, anon, service_role
USING (true);

CREATE POLICY "niches_read_all"
ON public.niches
FOR SELECT
TO authenticated, anon, service_role
USING (true);

-- 5. Garantir GRANTs explícitos
GRANT SELECT ON public.sectors TO authenticated;
GRANT SELECT ON public.sectors TO anon;
GRANT SELECT ON public.sectors TO service_role;

GRANT SELECT ON public.niches TO authenticated;
GRANT SELECT ON public.niches TO anon;
GRANT SELECT ON public.niches TO service_role;

-- 6. Garantir que o schema public está acessível
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. FORÇAR RELOAD DO POSTGREST (múltiplas tentativas)
NOTIFY pgrst, 'reload schema';

-- Atualizar comentários (força invalidação de cache)
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
  EXECUTE format(
    'COMMENT ON SCHEMA public IS %L;',
    'Schema público - Atualizado: ' || ts
  );
END
$do$;

NOTIFY pgrst, 'reload schema';

-- Aguardar um pouco e notificar novamente
DO $$
BEGIN
    PERFORM pg_sleep(1);
END $$;

NOTIFY pgrst, 'reload schema';

-- 8. Verificar se as políticas foram criadas corretamente
SELECT 
    '✅ POLÍTICAS CRIADAS' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors') as policies_sectors,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches') as policies_niches,
    (SELECT COUNT(*) FROM public.sectors) as total_setores,
    (SELECT COUNT(*) FROM public.niches) as total_nichos;

-- 9. Testar se as tabelas são acessíveis
SELECT 
    '✅ TESTE DE ACESSO' as status,
    (SELECT COUNT(*) FROM public.sectors LIMIT 1) as sectors_acessivel,
    (SELECT COUNT(*) FROM public.niches LIMIT 1) as niches_acessivel;

-- 10. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ Script executado com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ AGORA É OBRIGATÓRIO REINICIAR O PROJETO SUPABASE:';
    RAISE NOTICE '   1. Vá em Settings → General → Restart Project';
    RAISE NOTICE '   2. Aguarde 2-3 minutos';
    RAISE NOTICE '   3. Recarregue o frontend (Ctrl+Shift+R)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ TAMBÉM VERIFIQUE:';
    RAISE NOTICE '   - Settings → API → Exposed schemas → deve incluir "public"';
    RAISE NOTICE '============================================================================';
END $$;

