-- ==========================================
-- 🔧 ADICIONAR COLUNA confianca_extracao (SE NÃO EXISTIR)
-- ==========================================
-- ⚠️ IMPORTANTE: Execute VERIFICAR_COLUNA_CONFIANCA.sql PRIMEIRO
-- para confirmar que a coluna não existe antes de criar
-- ==========================================

-- 1. Verificar se coluna existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_products' 
    AND column_name = 'confianca_extracao'
  ) THEN
    -- Adicionar coluna se não existir
    ALTER TABLE tenant_products
    ADD COLUMN confianca_extracao DECIMAL(3,2);
    
    RAISE NOTICE '✅ Coluna confianca_extracao criada com sucesso.';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna confianca_extracao já existe. Nenhuma alteração necessária.';
  END IF;
END $$;

-- 2. Verificar resultado
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenant_products'
  AND column_name = 'confianca_extracao';

