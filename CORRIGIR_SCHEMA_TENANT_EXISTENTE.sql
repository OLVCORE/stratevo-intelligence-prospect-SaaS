-- ==========================================
-- CORRIGIR: Criar Schema do Tenant que não foi criado
-- ==========================================
-- Execute este script para criar o schema do tenant OLV Internacional
-- que não foi criado automaticamente

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
    RAISE EXCEPTION '❌ Tenant não encontrado: %', v_tenant_id;
  END IF;
  
  RAISE NOTICE '🔍 Tenant encontrado: %', v_schema_name;
  
  -- Verificar se o schema já existe
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema_name) THEN
    RAISE NOTICE '✅ Schema % já existe!', v_schema_name;
  ELSE
    RAISE NOTICE '📦 Criando schema: %', v_schema_name;
    
    -- Criar schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema_name);
    
    -- Criar todas as tabelas usando a função create_tenant_schema se existir
    BEGIN
      PERFORM create_tenant_schema(v_schema_name);
      RAISE NOTICE '✅ Schema % criado com sucesso usando create_tenant_schema!', v_schema_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Função create_tenant_schema não disponível. Erro: %', SQLERRM;
      RAISE NOTICE '📝 Schema % criado, mas você precisará criar as tabelas manualmente.', v_schema_name;
    END;
  END IF;
END;
$$;

-- Verificar se foi criado
SELECT 
  schema_name,
  '✅ Schema existe' as status
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%'
  AND schema_name = (SELECT schema_name FROM public.tenants WHERE id = '0bc75a60-7f19-4228-a0ca-c4e627a0f739')
ORDER BY schema_name;

