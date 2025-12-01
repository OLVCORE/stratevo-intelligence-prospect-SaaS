-- =====================================================
-- CORRIGIR COLUNAS DE PRODUTOS
-- =====================================================
-- Execute este script no Supabase SQL Editor para garantir
-- que todas as colunas necessárias existam
-- =====================================================

-- 1. VERIFICAR E CORRIGIR ESTRUTURA DE tenant_products
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
    RAISE NOTICE 'Tabela tenant_products não existe. Criando...';
    -- Criar tabela completa
    CREATE TABLE tenant_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      categoria VARCHAR(100),
      subcategoria VARCHAR(100),
      codigo_interno VARCHAR(50),
      preco_minimo DECIMAL(15,2),
      preco_maximo DECIMAL(15,2),
      ticket_medio DECIMAL(15,2),
      moeda VARCHAR(3) DEFAULT 'BRL',
      cnaes_alvo TEXT[],
      setores_alvo TEXT[],
      portes_alvo TEXT[],
      capital_social_minimo DECIMAL(15,2),
      capital_social_maximo DECIMAL(15,2),
      regioes_alvo TEXT[],
      diferenciais TEXT[],
      casos_uso TEXT[],
      dores_resolvidas TEXT[],
      beneficios TEXT[],
      concorrentes_diretos TEXT[],
      vantagens_competitivas TEXT[],
      imagem_url TEXT,
      documentos JSONB DEFAULT '[]',
      ativo BOOLEAN DEFAULT true,
      destaque BOOLEAN DEFAULT false,
      ordem_exibicao INTEGER DEFAULT 0,
      extraido_de TEXT,
      dados_extraidos JSONB,
      confianca_extracao DECIMAL(3,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Tabela tenant_products criada com sucesso!';
  ELSE
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
    
    -- Se tem 'name' mas não tem 'nome', renomear ou adicionar
    IF has_name AND NOT has_nome THEN
      RAISE NOTICE 'Tabela tem coluna "name" mas não tem "nome". Adicionando coluna "nome"...';
      ALTER TABLE tenant_products ADD COLUMN nome VARCHAR(255);
      -- Copiar dados de 'name' para 'nome'
      UPDATE tenant_products SET nome = name WHERE nome IS NULL;
      -- Tornar NOT NULL se não houver NULLs
      ALTER TABLE tenant_products ALTER COLUMN nome SET NOT NULL;
      RAISE NOTICE 'Coluna "nome" adicionada e preenchida!';
    ELSIF NOT has_nome AND NOT has_name THEN
      -- Se não tem nenhuma, adicionar 'nome'
      RAISE NOTICE 'Adicionando coluna "nome"...';
      ALTER TABLE tenant_products ADD COLUMN nome VARCHAR(255) NOT NULL;
      RAISE NOTICE 'Coluna "nome" criada!';
    END IF;
    
    -- Garantir coluna 'destaque'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'destaque'
    ) THEN
      ALTER TABLE tenant_products ADD COLUMN destaque BOOLEAN DEFAULT false;
      COMMENT ON COLUMN tenant_products.destaque IS 'Produto carro-chefe';
      RAISE NOTICE 'Coluna destaque criada em tenant_products';
    END IF;
    
    -- Garantir coluna 'ativo'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'ativo'
    ) THEN
      ALTER TABLE tenant_products ADD COLUMN ativo BOOLEAN DEFAULT true;
      COMMENT ON COLUMN tenant_products.ativo IS 'Produto ativo/inativo';
      RAISE NOTICE 'Coluna ativo criada em tenant_products';
    END IF;
    
    -- Garantir coluna 'created_at'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE tenant_products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Coluna created_at criada em tenant_products';
    END IF;
  END IF;
END $$;

-- 2. GARANTIR COLUNA uploaded_at EM tenant_product_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_product_documents' 
    AND column_name = 'uploaded_at'
  ) THEN
    ALTER TABLE tenant_product_documents ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    COMMENT ON COLUMN tenant_product_documents.uploaded_at IS 'Data de upload do documento';
    
    -- Preencher uploaded_at com created_at para registros existentes
    UPDATE tenant_product_documents 
    SET uploaded_at = created_at 
    WHERE uploaded_at IS NULL;
    
    RAISE NOTICE 'Coluna uploaded_at criada em tenant_product_documents';
  END IF;
END $$;

-- 3. VERIFICAR RESULTADO
SELECT 
  'tenant_products' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tenant_products'
AND column_name IN ('destaque', 'ativo')
UNION ALL
SELECT 
  'tenant_product_documents' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tenant_product_documents'
AND column_name = 'uploaded_at'
ORDER BY tabela, column_name;

-- ✅ Todas as colunas foram verificadas e criadas!

