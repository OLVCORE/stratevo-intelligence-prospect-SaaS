-- ============================================================================
-- SOLUÇÃO DEFINITIVA: NICHOS NO FRONTEND
-- ============================================================================
-- Este script garante que TUDO está configurado corretamente para os
-- nichos aparecerem no frontend via PostgREST
-- ============================================================================

-- ============================================================================
-- ETAPA 1: GARANTIR QUE AS TABELAS EXISTEM E TÊM DADOS
-- ============================================================================

DO $$
DECLARE
    total_setores INTEGER;
    total_nichos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_setores FROM public.sectors;
    SELECT COUNT(*) INTO total_nichos FROM public.niches;
    
    IF total_setores = 0 THEN
        RAISE EXCEPTION 'ERRO: Tabela sectors está vazia! Execute ADICIONAR_SETORES_PRINCIPAIS_B2B.sql primeiro.';
    END IF;
    
    IF total_nichos = 0 THEN
        RAISE EXCEPTION 'ERRO: Tabela niches está vazia! Execute ADICIONAR_NICHOS_COMPLETO_B2B.sql primeiro.';
    END IF;
    
    RAISE NOTICE '✅ Verificação de dados: % setores, % nichos', total_setores, total_nichos;
END $$;

-- ============================================================================
-- ETAPA 2: REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================================================

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
    
    RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- ============================================================================
-- ETAPA 3: HABILITAR RLS E CRIAR POLÍTICAS CORRETAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Criar políticas PERMISSIVAS para SELECT (SEM WITH CHECK)
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

-- Não usar RAISE NOTICE fora de bloco DO
-- RAISE NOTICE '✅ RLS habilitado e políticas criadas';

-- ============================================================================
-- ETAPA 4: GARANTIR TODAS AS PERMISSÕES (GRANTs)
-- ============================================================================

-- Permissões no schema
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;

-- Permissões nas tabelas
GRANT SELECT ON public.sectors TO authenticated, anon, service_role;
GRANT SELECT ON public.niches TO authenticated, anon, service_role;

-- Permissões nas colunas específicas (para garantir acesso às colunas usadas no frontend)
GRANT SELECT (sector_code, sector_name, description) ON public.sectors TO authenticated, anon, service_role;
GRANT SELECT (niche_code, niche_name, sector_code, description, keywords, cnaes, ncms, totvs_products) ON public.niches TO authenticated, anon, service_role;

-- RAISE NOTICE '✅ Permissões concedidas';

-- ============================================================================
-- ETAPA 5: FORÇAR RELOAD DO POSTGREST (MÚLTIPLAS VEZES)
-- ============================================================================

DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        PERFORM pg_notify('pgrst', 'reload schema');
        PERFORM pg_sleep(0.3);
    END LOOP;
    RAISE NOTICE '✅ Notificações de reload enviadas (10x)';
END $$;

-- ============================================================================
-- ETAPA 6: ATUALIZAR COMENTÁRIOS (INVALIDA CACHE)
-- ============================================================================

DO $do$
DECLARE
  ts text := to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format('COMMENT ON TABLE public.sectors IS %L;', 'Setores B2B - Atualizado em ' || ts);
  EXECUTE format('COMMENT ON TABLE public.niches IS %L;', 'Nichos B2B - Atualizado em ' || ts);
  EXECUTE format('COMMENT ON SCHEMA public IS %L;', 'Schema público - Atualizado em ' || ts);
  RAISE NOTICE '✅ Comentários atualizados para invalidar cache';
END
$do$;

-- ============================================================================
-- ETAPA 7: ATUALIZAR ESTATÍSTICAS
-- ============================================================================

ANALYZE public.sectors;
ANALYZE public.niches;

-- RAISE NOTICE '✅ Estatísticas atualizadas';

-- ============================================================================
-- ETAPA 8: VERIFICAÇÃO FINAL E TESTE
-- ============================================================================

DO $$
DECLARE
    total_setores INTEGER;
    total_nichos INTEGER;
    policies_sectors INTEGER;
    policies_niches INTEGER;
    sectors_accessible BOOLEAN;
    niches_accessible BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO total_setores FROM public.sectors;
    SELECT COUNT(*) INTO total_nichos FROM public.niches;
    SELECT COUNT(*) INTO policies_sectors FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sectors';
    SELECT COUNT(*) INTO policies_niches FROM pg_policies WHERE schemaname = 'public' AND tablename = 'niches';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE table_schema = 'public' 
        AND table_name = 'sectors' 
        AND privilege_type = 'SELECT'
        AND grantee IN ('authenticated', 'anon')
    ) INTO sectors_accessible;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE table_schema = 'public' 
        AND table_name = 'niches' 
        AND privilege_type = 'SELECT'
        AND grantee IN ('authenticated', 'anon')
    ) INTO niches_accessible;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '📊 VERIFICAÇÃO FINAL:';
    RAISE NOTICE '   Setores: % | Nichos: %', total_setores, total_nichos;
    RAISE NOTICE '   Políticas RLS (sectors): % | (niches): %', policies_sectors, policies_niches;
    RAISE NOTICE '   Acessível (sectors): % | (niches): %', sectors_accessible, niches_accessible;
    RAISE NOTICE '';
    
    IF total_setores < 20 OR total_nichos < 600 THEN
        RAISE WARNING '⚠️ AVISO: Poucos dados! Esperado: 25 setores e 635 nichos';
    END IF;
    
    IF policies_sectors = 0 OR policies_niches = 0 THEN
        RAISE EXCEPTION '❌ ERRO: Políticas RLS não foram criadas corretamente!';
    END IF;
    
    IF NOT sectors_accessible OR NOT niches_accessible THEN
        RAISE WARNING '⚠️ AVISO: Permissões podem não estar configuradas corretamente';
    END IF;
    
    RAISE NOTICE '✅ CONFIGURAÇÃO COMPLETA!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ AÇÃO OBRIGATÓRIA:';
    RAISE NOTICE '   1. REINICIE o projeto Supabase AGORA:';
    RAISE NOTICE '      Dashboard → Settings → General → Restart Project';
    RAISE NOTICE '   2. Aguarde 2-3 minutos até voltar online';
    RAISE NOTICE '   3. Verifique no Dashboard:';
    RAISE NOTICE '      Settings → API → Exposed schemas → deve incluir "public"';
    RAISE NOTICE '      Settings → API → Max Rows → deve ser ≥ 2000';
    RAISE NOTICE '   4. Recarregue o frontend com Ctrl+Shift+R (hard refresh)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTE A API DIRETAMENTE:';
    RAISE NOTICE '   GET {SUPABASE_URL}/rest/v1/sectors?select=*';
    RAISE NOTICE '   GET {SUPABASE_URL}/rest/v1/niches?select=*';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

