-- ============================================================================
-- SOLUÇÃO FINAL: CRIAR TABELA TENANTS E FORÇAR POSTGREST RELOAD
-- ============================================================================
-- Execute este script NO SUPABASE SQL EDITOR
-- Depois REINICIE o projeto Supabase (Settings → General → Restart Project)
-- ============================================================================

-- 1. REMOVER TABELA SE EXISTIR (para recriar limpa)
DROP TABLE IF EXISTS public.tenants CASCADE;

-- 2. CRIAR TABELA TENANTS COMPLETA
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  
  -- Schema PostgreSQL dedicado
  schema_name VARCHAR(255) UNIQUE NOT NULL,
  
  -- Subscription
  plano VARCHAR(50) DEFAULT 'FREE' CHECK (plano IN ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE')),
  status VARCHAR(50) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED')),
  creditos INTEGER DEFAULT 10,
  
  -- Datas
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX idx_tenants_schema_name ON public.tenants(schema_name);
CREATE INDEX idx_tenants_email ON public.tenants(email);

-- 4. HABILITAR RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 5. REMOVER TODAS AS POLÍTICAS ANTIGAS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', r.policyname);
  END LOOP;
END $$;

-- 6. CRIAR POLÍTICAS RLS PERMISSIVAS (para desenvolvimento)
CREATE POLICY "Tenants são públicos para leitura" 
  ON public.tenants FOR SELECT 
  USING (true);

CREATE POLICY "Tenants podem ser criados por qualquer um" 
  ON public.tenants FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Tenants podem ser atualizados por qualquer um" 
  ON public.tenants FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tenants podem ser deletados por qualquer um" 
  ON public.tenants FOR DELETE 
  USING (true);

-- 7. GARANTIR PERMISSÕES EXPLÍCITAS
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;

-- 8. GARANTIR PERMISSÕES EM SEQUÊNCIAS
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 9. ADICIONAR COMENTÁRIO PARA FORÇAR RELOAD
DO $$
DECLARE
  ts TEXT := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON TABLE public.tenants IS %L;$f$, 'Tabela de tenants - Criado: ' || ts);
END$$;

-- 10. NOTIFICAR POSTGREST PARA RELOAD
NOTIFY pgrst, 'reload schema';

-- 11. VERIFICAR SE FOI CRIADA CORRETAMENTE
DO $$
DECLARE
  table_exists BOOLEAN;
  row_count INTEGER;
  rls_enabled BOOLEAN;
BEGIN
  -- Verificar se tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) INTO table_exists;
  
  -- Verificar RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'tenants';
  
  IF table_exists THEN
    SELECT COUNT(*) INTO row_count FROM public.tenants;
    RAISE NOTICE '✅ Tabela tenants criada com sucesso!';
    RAISE NOTICE '   Total de registros: %', row_count;
    RAISE NOTICE '   RLS habilitado: %', rls_enabled;
  ELSE
    RAISE EXCEPTION '❌ ERRO: Tabela tenants NÃO foi criada!';
  END IF;
END$$;

-- 12. VERIFICAR PERMISSÕES
SELECT 
  'Verificação de Permissões' as tipo,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
ORDER BY grantee, privilege_type;

-- 13. VERIFICAR POLÍTICAS RLS
SELECT 
  'Verificação RLS' as tipo,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'tenants';

-- 14. MENSAGEM FINAL
SELECT 
  '✅ SCRIPT EXECUTADO COM SUCESSO!' as status,
  '⚠️ PRÓXIMO PASSO CRÍTICO: REINICIE O PROJETO SUPABASE!' as proximo_passo,
  'Dashboard → Settings → General → Restart Project' as instrucao,
  'Aguarde 2-3 minutos após restart' as aguardar;

