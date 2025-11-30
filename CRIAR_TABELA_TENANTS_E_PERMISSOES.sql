-- ============================================================================
-- CRIAR TABELA TENANTS E PERMISSÕES
-- ============================================================================
-- Este script garante que a tabela tenants existe e está acessível via PostgREST
-- ============================================================================

-- 1. Criar tabela tenants se não existir
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

-- 3. Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS (permitir leitura/escrita para usuários autenticados)
DROP POLICY IF EXISTS "Usuários autenticados podem ler tenants" ON public.tenants;
CREATE POLICY "Usuários autenticados podem ler tenants" 
  ON public.tenants FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem criar tenants" ON public.tenants;
CREATE POLICY "Usuários autenticados podem criar tenants" 
  ON public.tenants FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários podem atualizar próprio tenant" ON public.tenants;
CREATE POLICY "Usuários podem atualizar próprio tenant" 
  ON public.tenants FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Garantir permissões para anon e authenticated
GRANT SELECT, INSERT, UPDATE ON public.tenants TO anon;
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;

-- 6. Forçar reload do PostgREST
NOTIFY pgrst, 'reload schema';

-- 7. Adicionar comentário para forçar reload
COMMENT ON TABLE public.tenants IS 'Tabela de tenants da plataforma SaaS - Atualizado: ' || NOW()::TEXT;

-- 8. Verificar se foi criada
SELECT 
  'Tabela tenants criada com sucesso!' as status,
  COUNT(*) as total_tenants
FROM public.tenants;

