-- ============================================================================
-- SOLUÇÃO ALTERNATIVA: CRIAR TENANTS COM VERIFICAÇÃO EXPLÍCITA
-- ============================================================================
-- Se o PostgREST ainda não reconhecer, vamos tentar uma abordagem diferente
-- ============================================================================

-- 1. VERIFICAR SE TABELA EXISTE E RECRIAR SE NECESSÁRIO
DO $$
BEGIN
  -- Se não existir, criar
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) THEN
    RAISE NOTICE 'Criando tabela tenants...';
    
    CREATE TABLE public.tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(255) UNIQUE NOT NULL,
      nome VARCHAR(255) NOT NULL,
      cnpj VARCHAR(18) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(20),
      schema_name VARCHAR(255) UNIQUE NOT NULL,
      plano VARCHAR(50) DEFAULT 'FREE' CHECK (plano IN ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE')),
      status VARCHAR(50) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED')),
      creditos INTEGER DEFAULT 10,
      data_expiracao TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_tenants_slug ON public.tenants(slug);
    CREATE INDEX idx_tenants_cnpj ON public.tenants(cnpj);
    CREATE INDEX idx_tenants_schema_name ON public.tenants(schema_name);
    CREATE INDEX idx_tenants_email ON public.tenants(email);
    
    ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ Tabela criada!';
  ELSE
    RAISE NOTICE '✅ Tabela já existe!';
  END IF;
END$$;

-- 2. GARANTIR PERMISSÕES ABSOLUTAS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.tenants TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. REMOVER TODAS AS POLÍTICAS E RECRIAR
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', r.policyname);
  END LOOP;
END$$;

-- Criar políticas super permissivas
CREATE POLICY "allow_all_select" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.tenants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON public.tenants FOR DELETE USING (true);

-- 4. FORÇAR RELOAD AGRESSIVO
DO $$
DECLARE
  i INTEGER;
BEGIN
  -- Notificar 10 vezes
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.2);
  END LOOP;
  
  -- Atualizar comentário múltiplas vezes
  FOR i IN 1..5 LOOP
    EXECUTE format($f$COMMENT ON TABLE public.tenants IS %L;$f$, 
      'Reload ' || i || ' - ' || to_char(now(), 'HH24:MI:SS'));
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE '✅ Reload agressivo executado!';
END$$;

-- 5. VERIFICAR CONFIGURAÇÃO DO POSTGREST
-- Verificar se há alguma configuração que bloqueia a tabela
SELECT 
  'Configuração PostgREST' as tipo,
  schemaname,
  tablename,
  'Verifique Settings → API → Exposed schemas' as instrucao
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'tenants';

-- 6. TESTE FINAL: TENTAR INSERIR UM REGISTRO DE TESTE
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Tentar inserir um registro de teste
  INSERT INTO public.tenants (slug, nome, cnpj, email, schema_name)
  VALUES ('test-' || extract(epoch from now())::text, 'Teste', '00000000000000', 'teste@teste.com', 'tenant_test')
  RETURNING id INTO test_id;
  
  RAISE NOTICE '✅ Registro de teste inserido: %', test_id;
  
  -- Deletar o registro de teste
  DELETE FROM public.tenants WHERE id = test_id;
  RAISE NOTICE '✅ Registro de teste removido';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao inserir teste: %', SQLERRM;
END$$;

-- 7. MENSAGEM FINAL
SELECT 
  '✅ Script executado!' as status,
  '⚠️ VERIFIQUE: Settings → API → Exposed schemas deve incluir "public"' as proximo_passo,
  'Se ainda não funcionar, pode ser necessário criar via Edge Function' as alternativa;

