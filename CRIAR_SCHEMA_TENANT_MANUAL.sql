-- ==========================================
-- CRIAR SCHEMA DO TENANT MANUALMENTE
-- ==========================================
-- Execute este script se o schema do tenant não foi criado automaticamente
-- Substitua 'tenant_olv-internacional-comercio-importacao-e-exportacao-ltda-' 
-- pelo schema_name correto do seu tenant

-- 1. Buscar o schema_name do tenant específico
SELECT 
  id,
  nome,
  schema_name
FROM public.tenants
WHERE id = '0bc75a60-7f19-4228-a0ca-c4e627a0f739'; -- Substitua pelo tenant_id correto

-- 2. Criar o schema usando a função create_tenant_schema
-- (substitua o schema_name pelo valor retornado acima)
DO $$
DECLARE
  v_tenant_id UUID := '0bc75a60-7f19-4228-a0ca-c4e627a0f739';
  v_schema_name TEXT;
BEGIN
  -- Buscar schema_name do tenant
  SELECT schema_name INTO v_schema_name
  FROM public.tenants
  WHERE id = v_tenant_id;
  
  IF v_schema_name IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado: %', v_tenant_id;
  END IF;
  
  RAISE NOTICE 'Criando schema: %', v_schema_name;
  
  -- Criar schema e todas as tabelas usando a função create_tenant_schema
  PERFORM create_tenant_schema(v_schema_name);
  
  RAISE NOTICE '✅ Schema % criado com sucesso!', v_schema_name;
END;
$$;

-- 3. Verificar se o schema foi criado
SELECT 
  schema_name,
  '✅ Schema existe' as status
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%'
ORDER BY schema_name;

