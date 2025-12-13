-- =====================================================
-- 🔧 CORRIGIR PROBLEMA: product_name vs nome
-- =====================================================
-- ⚠️ PROBLEMA: Tabela foi criada com product_name (inglês)
-- mas Edge Function tenta inserir em nome (português)
-- =====================================================

DO $$
BEGIN
  -- 1. VERIFICAR SE product_name EXISTE
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'product_name'
  ) THEN
    RAISE NOTICE '⚠️ Coluna product_name encontrada - precisa corrigir';
    
    -- 1.1. Se nome NÃO existe, criar nome e copiar dados de product_name
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenant_products' 
      AND column_name = 'nome'
    ) THEN
      RAISE NOTICE '➕ Criando coluna nome e copiando dados de product_name...';
      ALTER TABLE tenant_products ADD COLUMN nome VARCHAR(255);
      UPDATE tenant_products SET nome = product_name WHERE nome IS NULL;
      ALTER TABLE tenant_products ALTER COLUMN nome SET NOT NULL;
      RAISE NOTICE '✅ Coluna nome criada e preenchida';
    END IF;
    
    -- 1.2. Remover constraint NOT NULL de product_name (se existir)
    BEGIN
      ALTER TABLE tenant_products ALTER COLUMN product_name DROP NOT NULL;
      RAISE NOTICE '✅ Constraint NOT NULL removida de product_name';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ Não foi possível remover NOT NULL de product_name (pode não ter constraint)';
    END;
    
    -- 1.3. Opcional: Remover coluna product_name (descomente se quiser)
    -- ALTER TABLE tenant_products DROP COLUMN IF EXISTS product_name;
    -- RAISE NOTICE '✅ Coluna product_name removida';
    
  ELSE
    RAISE NOTICE '✅ Coluna product_name não existe - OK';
  END IF;
  
  -- 2. GARANTIR QUE nome EXISTE E TEM NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'nome'
  ) THEN
    RAISE NOTICE '➕ Criando coluna nome...';
    ALTER TABLE tenant_products ADD COLUMN nome VARCHAR(255) NOT NULL;
    RAISE NOTICE '✅ Coluna nome criada';
  ELSE
    -- Garantir que nome tem NOT NULL
    BEGIN
      ALTER TABLE tenant_products ALTER COLUMN nome SET NOT NULL;
      RAISE NOTICE '✅ Constraint NOT NULL garantida em nome';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ Não foi possível adicionar NOT NULL em nome (pode já ter)';
    END;
  END IF;
  
  RAISE NOTICE '✅✅✅ Correção concluída!';
END $$;

-- 3. VERIFICAÇÃO FINAL
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'product_name' AND is_nullable = 'NO' THEN '⚠️ PROBLEMA: product_name ainda tem NOT NULL'
    WHEN column_name = 'nome' AND is_nullable = 'NO' THEN '✅ OK: nome tem NOT NULL'
    WHEN column_name = 'product_name' THEN 'ℹ️ product_name existe mas permite NULL'
    ELSE '✅ OK'
  END as observacao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND column_name IN ('product_name', 'nome')
ORDER BY column_name;

