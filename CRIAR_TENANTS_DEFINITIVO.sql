-- ============================================================================
-- CRIAR TABELA TENANTS DEFINITIVO - FORÇAR POSTGREST RELOAD
-- ============================================================================
-- Este script garante que a tabela tenants existe e está acessível via PostgREST
-- Execute este script e depois REINICIE o projeto Supabase
-- ============================================================================

-- 1. Criar tabela tenants se não existir (com todas as colunas necessárias)
CREATE TABLE IF NOT EXISTS public.tenants (
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

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON public.tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON public.tenants(schema_name);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);

-- 3. Garantir que RLS está habilitado
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem ler tenants" ON public.tenants;
DROP POLICY IF EXISTS "Usuários autenticados podem criar tenants" ON public.tenants;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio tenant" ON public.tenants;
DROP POLICY IF EXISTS "Tenants são públicos para leitura" ON public.tenants;
DROP POLICY IF EXISTS "Tenants podem ser criados por qualquer um" ON public.tenants;
DROP POLICY IF EXISTS "Tenants podem ser atualizados por qualquer um" ON public.tenants;

-- 5. Criar políticas RLS permissivas (para desenvolvimento)
-- Permitir leitura para todos
CREATE POLICY "Tenants são públicos para leitura" 
  ON public.tenants FOR SELECT 
  USING (true);

-- Permitir inserção para usuários autenticados
CREATE POLICY "Tenants podem ser criados por qualquer um" 
  ON public.tenants FOR INSERT 
  WITH CHECK (true);

-- Permitir atualização para usuários autenticados
CREATE POLICY "Tenants podem ser atualizados por qualquer um" 
  ON public.tenants FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- 6. Garantir permissões GRANT explícitas
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;

-- 7. Garantir que a sequência UUID está disponível
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Forçar reload do PostgREST de múltiplas formas
NOTIFY pgrst, 'reload schema';

-- 9. Adicionar comentário para forçar reload
DO $$
DECLARE
  ts TEXT := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON TABLE public.tenants IS %L;$f$, 'Tabela de tenants - Atualizado: ' || ts);
END$$;

-- 10. Verificar se foi criada corretamente
DO $$
DECLARE
  table_exists BOOLEAN;
  row_count INTEGER;
BEGIN
  -- Verificar se tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO row_count FROM public.tenants;
    RAISE NOTICE '✅ Tabela tenants existe! Total de registros: %', row_count;
  ELSE
    RAISE EXCEPTION '❌ ERRO: Tabela tenants NÃO foi criada!';
  END IF;
END$$;

-- 11. Verificar permissões
SELECT 
  'Verificação de Permissões' as tipo,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
ORDER BY grantee, privilege_type;

-- 12. Verificar RLS
SELECT 
  'Verificação RLS' as tipo,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
JOIN pg_namespace pn ON pn.oid = pc.relnamespace
WHERE pt.schemaname = 'public' 
  AND pt.tablename = 'tenants';

-- 13. Mensagem final
SELECT 
  '✅ SCRIPT EXECUTADO COM SUCESSO!' as status,
  '⚠️ IMPORTANTE: REINICIE O PROJETO SUPABASE AGORA!' as proximo_passo,
  'Dashboard → Settings → General → Restart Project' as instrucao;
