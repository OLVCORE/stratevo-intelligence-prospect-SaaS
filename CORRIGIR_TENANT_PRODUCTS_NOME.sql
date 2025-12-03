 -- =====================================================
-- CORRIGIR COLUNA 'nome' EM tenant_products
-- =====================================================
-- Este script garante que a coluna 'nome' existe
-- Se a tabela tiver 'name' (inglês), renomeia para 'nome' (português)
-- =====================================================

DO $$
DECLARE
  has_nome BOOLEAN;
  has_name BOOLEAN;
  has_table BOOLEAN;
BEGIN
  -- Verificar se a tabela existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products'
  ) INTO has_table;
  
  IF NOT has_table THEN
    RAISE NOTICE '❌ Tabela tenant_products não existe! Execute a migration 20250201000001_tenant_products_catalog.sql primeiro.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Tabela tenant_products existe';
  
  -- Verificar se tem coluna 'nome'
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'nome'
  ) INTO has_nome;
  
  -- Verificar se tem coluna 'name'
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'name'
  ) INTO has_name;
  
  RAISE NOTICE 'Coluna "nome" existe: %', has_nome;
  RAISE NOTICE 'Coluna "name" existe: %', has_name;
  
  -- Se tem 'name' mas não tem 'nome', adicionar 'nome' e copiar dados
  IF has_name AND NOT has_nome THEN
    RAISE NOTICE '🔄 Tabela tem coluna "name" mas não tem "nome". Adicionando coluna "nome"...';
    ALTER TABLE tenant_products ADD COLUMN nome VARCHAR(255);
    -- Copiar dados de 'name' para 'nome'
    UPDATE tenant_products SET nome = name WHERE nome IS NULL;
    -- Tornar NOT NULL se não houver NULLs
    ALTER TABLE tenant_products ALTER COLUMN nome SET NOT NULL;
    RAISE NOTICE '✅ Coluna "nome" adicionada e preenchida!';
  ELSIF NOT has_nome AND NOT has_name THEN
    -- Se não tem nenhuma, adicionar 'nome'
    RAISE NOTICE '➕ Adicionando coluna "nome"...';
    ALTER TABLE tenant_products ADD COLUMN nome VARCHAR(255) NOT NULL;
    RAISE NOTICE '✅ Coluna "nome" criada!';
  ELSIF has_nome THEN
    RAISE NOTICE '✅ Coluna "nome" já existe!';
  END IF;
  
  -- Garantir outras colunas essenciais
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'descricao'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN descricao TEXT;
    RAISE NOTICE '✅ Coluna "descricao" criada!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'categoria'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN categoria VARCHAR(100);
    RAISE NOTICE '✅ Coluna "categoria" criada!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Coluna "created_at" criada!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'destaque'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN destaque BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Coluna "destaque" criada!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'ativo'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN ativo BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Coluna "ativo" criada!';
  END IF;
  
END $$;

-- Verificar resultado
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tenant_products'
AND column_name IN ('nome', 'name', 'descricao', 'categoria', 'created_at', 'destaque', 'ativo')
ORDER BY column_name;

-- ✅ Script concluído!

