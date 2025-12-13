-- ==========================================
-- FIX: Garantir que SERVICE_ROLE_KEY pode inserir em tenant_products
-- ==========================================
-- Problema: RLS pode estar bloqueando inserção mesmo com SERVICE_ROLE_KEY
-- Solução: Criar política que permite inserção quando auth.uid() é NULL (SERVICE_ROLE_KEY)
-- ==========================================

-- 1. Remover política atual que pode estar bloqueando
DROP POLICY IF EXISTS "tenant_products_policy" ON tenant_products;

-- 2. Criar políticas separadas para SELECT e INSERT/UPDATE/DELETE
-- SELECT: Usuários autenticados podem ver produtos de seus tenants
CREATE POLICY "tenant_products_select_policy" ON tenant_products
  FOR SELECT
  USING (
    -- Se auth.uid() é NULL (SERVICE_ROLE_KEY), permitir tudo
    auth.uid() IS NULL
    OR
    -- Se usuário autenticado, verificar se tem acesso ao tenant
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- INSERT: Permitir inserção com SERVICE_ROLE_KEY (auth.uid() IS NULL)
-- OU se usuário tem acesso ao tenant
CREATE POLICY "tenant_products_insert_policy" ON tenant_products
  FOR INSERT
  WITH CHECK (
    -- SERVICE_ROLE_KEY (auth.uid() IS NULL) pode inserir
    auth.uid() IS NULL
    OR
    -- Usuário autenticado pode inserir em seus próprios tenants
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- UPDATE: Permitir atualização com SERVICE_ROLE_KEY ou se usuário tem acesso
CREATE POLICY "tenant_products_update_policy" ON tenant_products
  FOR UPDATE
  USING (
    auth.uid() IS NULL
    OR
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- DELETE: Permitir deleção com SERVICE_ROLE_KEY ou se usuário tem acesso
CREATE POLICY "tenant_products_delete_policy" ON tenant_products
  FOR DELETE
  USING (
    auth.uid() IS NULL
    OR
    tenant_id IN (
      SELECT tenant_id FROM public.get_user_tenant_ids()
    )
  );

-- 3. Criar função RPC de inserção como fallback (SECURITY DEFINER bypassa RLS)
CREATE OR REPLACE FUNCTION public.insert_tenant_product(
  p_tenant_id UUID,
  p_nome TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL,
  p_subcategoria TEXT DEFAULT NULL,
  p_codigo_interno TEXT DEFAULT NULL,
  p_setores_alvo TEXT DEFAULT NULL, -- Receber como string JSON
  p_diferenciais TEXT DEFAULT NULL, -- Receber como string JSON
  p_extraido_de TEXT DEFAULT 'website',
  p_confianca_extracao NUMERIC DEFAULT 0.7,
  p_dados_extraidos TEXT DEFAULT NULL -- Receber como string JSON
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO tenant_products (
    tenant_id,
    nome,
    descricao,
    categoria,
    subcategoria,
    codigo_interno,
    setores_alvo,
    diferenciais,
    extraido_de,
    confianca_extracao,
    dados_extraidos
  ) VALUES (
    p_tenant_id,
    p_nome,
    p_descricao,
    p_categoria,
    p_subcategoria,
    p_codigo_interno,
    CASE WHEN p_setores_alvo IS NOT NULL THEN p_setores_alvo::jsonb ELSE NULL END,
    CASE WHEN p_diferenciais IS NOT NULL THEN p_diferenciais::jsonb ELSE NULL END,
    p_extraido_de,
    p_confianca_extracao,
    CASE WHEN p_dados_extraidos IS NOT NULL THEN p_dados_extraidos::jsonb ELSE NULL END
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION
  WHEN others THEN
    -- Log erro mas não falhar silenciosamente
    RAISE WARNING 'Erro ao inserir produto: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- 4. Comentários
COMMENT ON FUNCTION public.insert_tenant_product IS 'Função RPC para inserir produtos do tenant. Usa SECURITY DEFINER para bypassar RLS.';

