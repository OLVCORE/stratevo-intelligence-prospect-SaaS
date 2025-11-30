-- ============================================================================
-- CRIAR FUNÇÃO RPC PARA CRIAR TENANT DIRETAMENTE
-- ============================================================================
-- Esta função permite criar tenant via RPC, bypassando problemas do PostgREST
-- ============================================================================

-- 1. Criar função que insere diretamente na tabela
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
  -- Inserir tenant diretamente
  INSERT INTO public.tenants (
    slug,
    nome,
    cnpj,
    email,
    telefone,
    schema_name,
    plano,
    status,
    creditos,
    data_expiracao
  ) VALUES (
    p_slug,
    p_nome,
    p_cnpj,
    p_email,
    p_telefone,
    p_schema_name,
    p_plano,
    p_status,
    p_creditos,
    p_data_expiracao
  )
  RETURNING public.tenants.id INTO v_tenant_id;

  -- Retornar dados do tenant criado
  RETURN QUERY
  SELECT 
    t.id,
    t.slug,
    t.nome,
    t.cnpj,
    t.email,
    t.telefone,
    t.schema_name,
    t.plano,
    t.status,
    t.creditos,
    t.data_expiracao,
    t.created_at,
    t.updated_at
  FROM public.tenants t
  WHERE t.id = v_tenant_id;
END;
$$;

-- 2. Garantir permissões
GRANT EXECUTE ON FUNCTION public.create_tenant_direct TO anon, authenticated, service_role;

-- 3. Comentário
COMMENT ON FUNCTION public.create_tenant_direct IS 'Cria tenant diretamente via SQL, bypassando PostgREST';

-- 4. Notificar PostgREST
NOTIFY pgrst, 'reload schema';

-- 5. Teste
SELECT 
  '✅ Função criada!' as status,
  'Teste: SELECT * FROM create_tenant_direct(...)' as instrucao;

