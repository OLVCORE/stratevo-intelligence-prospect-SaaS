-- =====================================================
-- 🔧 RESTAURAR COLUNAS FALTANTES DE tenant_products
-- =====================================================
-- ⚠️ IMPORTANTE: Este script adiciona APENAS as colunas faltantes
-- NÃO remove nada existente
-- NÃO altera dados existentes
-- =====================================================

DO $$
BEGIN
  -- 1. subcategoria VARCHAR(100)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'subcategoria'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN subcategoria VARCHAR(100);
    RAISE NOTICE '✅ Coluna subcategoria criada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna subcategoria já existe';
  END IF;

  -- 2. codigo_interno VARCHAR(50)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'codigo_interno'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN codigo_interno VARCHAR(50);
    RAISE NOTICE '✅ Coluna codigo_interno criada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna codigo_interno já existe';
  END IF;

  -- 3. setores_alvo TEXT[]
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'setores_alvo'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN setores_alvo TEXT[];
    RAISE NOTICE '✅ Coluna setores_alvo criada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna setores_alvo já existe';
  END IF;

  -- 4. diferenciais TEXT[]
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'diferenciais'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN diferenciais TEXT[];
    RAISE NOTICE '✅ Coluna diferenciais criada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna diferenciais já existe';
  END IF;

  -- 5. extraido_de TEXT
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'extraido_de'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN extraido_de TEXT;
    RAISE NOTICE '✅ Coluna extraido_de criada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna extraido_de já existe';
  END IF;

  -- 6. dados_extraidos JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'dados_extraidos'
  ) THEN
    ALTER TABLE tenant_products ADD COLUMN dados_extraidos JSONB;
    RAISE NOTICE '✅ Coluna dados_extraidos criada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna dados_extraidos já existe';
  END IF;

  RAISE NOTICE '✅✅✅ Todas as colunas verificadas e criadas se necessário!';
END $$;

-- Verificação final
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND column_name IN (
    'subcategoria',
    'codigo_interno',
    'setores_alvo',
    'diferenciais',
    'extraido_de',
    'dados_extraidos',
    'confianca_extracao'
  )
ORDER BY column_name;

