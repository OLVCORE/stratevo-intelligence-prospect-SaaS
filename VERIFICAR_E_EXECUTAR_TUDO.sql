-- ============================================================================
-- VERIFICAÇÃO FINAL E EXECUÇÃO DE TUDO
-- ============================================================================
-- Execute este script para garantir que TUDO está criado corretamente
-- ============================================================================

-- 1. VERIFICAR SE TABELA TENANTS EXISTE
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE '❌ Tabela tenants NÃO existe! Criando agora...';
    
    -- Criar tabela
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
    
    RAISE NOTICE '✅ Tabela tenants criada!';
  ELSE
    RAISE NOTICE '✅ Tabela tenants já existe!';
  END IF;
END$$;

-- 2. GARANTIR PERMISSÕES
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.tenants TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. REMOVER E RECRIAR POLÍTICAS RLS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', r.policyname);
  END LOOP;
END$$;

CREATE POLICY "allow_all_select" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.tenants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON public.tenants FOR DELETE USING (true);

-- 4. CRIAR/RECRIAR FUNÇÃO RPC
CREATE OR REPLACE FUNCTION public.create_tenant_direct(
  p_slug VARCHAR(255),
  p_nome VARCHAR(255),
  p_cnpj VARCHAR(18),
  p_email VARCHAR(255),
  p_schema_name VARCHAR(255),
  p_telefone VARCHAR(20) DEFAULT NULL,
  p_plano VARCHAR(50) DEFAULT 'FREE',
  p_status VARCHAR(50) DEFAULT 'TRIAL',
  p_creditos INTEGER DEFAULT 10,
  p_data_expiracao TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug VARCHAR(255),
  nome VARCHAR(255),
  cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone VARCHAR(20),
  schema_name VARCHAR(255),
  plano VARCHAR(50),
  status VARCHAR(50),
  creditos INTEGER,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (
    slug, nome, cnpj, email, telefone, schema_name, plano, status, creditos, data_expiracao
  ) VALUES (
    p_slug, p_nome, p_cnpj, p_email, p_telefone, p_schema_name, p_plano, p_status, p_creditos, p_data_expiracao
  )
  RETURNING public.tenants.id INTO v_tenant_id;

  RETURN QUERY
  SELECT 
    t.id, t.slug, t.nome, t.cnpj, t.email, t.telefone, t.schema_name,
    t.plano, t.status, t.creditos, t.data_expiracao, t.created_at, t.updated_at
  FROM public.tenants t
  WHERE t.id = v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_direct TO anon, authenticated, service_role;

-- 5. FORÇAR RELOAD AGRESSIVO
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.2);
  END LOOP;
  
  FOR i IN 1..5 LOOP
    EXECUTE format($f$COMMENT ON TABLE public.tenants IS %L;$f$, 
      'Reload ' || i || ' - ' || to_char(now(), 'HH24:MI:SS'));
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE '✅ Reload agressivo executado!';
END$$;

-- 6. VERIFICAÇÃO FINAL
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
    THEN '✅ Tabela tenants existe'
    ELSE '❌ Tabela tenants NÃO existe'
  END as tabela,
  CASE 
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'create_tenant_direct')
    THEN '✅ Função RPC existe'
    ELSE '❌ Função RPC NÃO existe'
  END as funcao_rpc,
  (SELECT COUNT(*) FROM public.tenants) as total_tenants;

-- 7. MENSAGEM FINAL
SELECT 
  '✅ SCRIPT EXECUTADO!' as status,
  '⚠️ AGUARDE 30 SEGUNDOS e teste novamente' as proximo_passo,
  'Se ainda não funcionar, a Edge Function será usada automaticamente' as alternativa;

