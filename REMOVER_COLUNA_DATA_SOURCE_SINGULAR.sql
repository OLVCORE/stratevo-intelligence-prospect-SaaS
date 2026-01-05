-- ============================================
-- REMOVER COLUNA data_source (singular) se existir
-- ============================================
-- O PostgREST pode estar procurando por uma coluna antiga
-- Execute este SQL no Supabase SQL Editor

-- Verificar se a coluna data_source (singular) existe
SELECT 
  column_name, 
  data_type,
  table_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('data_source', 'data_sources')
ORDER BY column_name;

-- Se data_source (singular) existir, removê-la
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN data_source;
    RAISE NOTICE 'Coluna data_source (singular) removida com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna data_source (singular) não existe. Tudo OK!';
  END IF;
END $$;

-- Garantir que data_sources (plural) existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_sources'
  ) THEN
    ALTER TABLE public.decision_makers 
    ADD COLUMN data_sources JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Coluna data_sources (plural) criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna data_sources (plural) já existe. Tudo OK!';
  END IF;
END $$;

-- Verificar resultado final
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('data_source', 'data_sources')
ORDER BY column_name;

-- Forçar recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- Aguardar alguns segundos
SELECT pg_sleep(2);

-- ✅ Processo concluído! Tente buscar decisores novamente.

