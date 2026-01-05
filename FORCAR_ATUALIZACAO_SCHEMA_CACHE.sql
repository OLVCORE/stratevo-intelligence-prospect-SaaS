-- ============================================
-- FORÇAR ATUALIZAÇÃO DO SCHEMA CACHE DO SUPABASE
-- ============================================
-- Execute este SQL no Supabase SQL Editor para forçar
-- a atualização do cache de schema do PostgREST

-- 1. Verificar se existe coluna data_source (singular) antiga
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND column_name IN ('data_source', 'data_sources')
ORDER BY column_name;

-- 2. Se existir coluna data_source (singular), removê-la
DO $$ 
BEGIN
  -- Verificar se existe coluna data_source (singular)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    -- Remover coluna antiga
    ALTER TABLE public.decision_makers
      DROP COLUMN IF EXISTS data_source;
    
    RAISE NOTICE 'Coluna data_source (singular) removida com sucesso';
  ELSE
    RAISE NOTICE 'Coluna data_source (singular) não existe - OK';
  END IF;
END $$;

-- 3. Garantir que data_sources (plural) existe e é JSONB
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
    
    RAISE NOTICE 'Coluna data_sources (plural) criada com sucesso';
  ELSE
    -- Verificar se o tipo está correto
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'decision_makers' 
        AND column_name = 'data_sources'
        AND data_type != 'jsonb'
    ) THEN
      -- Converter para JSONB se necessário
      ALTER TABLE public.decision_makers
        ALTER COLUMN data_sources TYPE JSONB USING data_sources::JSONB;
      
      RAISE NOTICE 'Coluna data_sources convertida para JSONB';
    ELSE
      RAISE NOTICE 'Coluna data_sources (plural) existe e está correta - OK';
    END IF;
  END IF;
END $$;

-- 4. Forçar atualização do schema cache do PostgREST
-- O PostgREST atualiza o cache automaticamente, mas podemos forçar
-- através de uma operação que força a verificação do schema
DO $$ 
BEGIN
  -- Tentar notificar o PostgREST (pode não funcionar em todos os ambientes)
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Notificação de reload schema enviada ao PostgREST';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível enviar notificação (normal em alguns ambientes)';
END $$;

-- 5. Executar queries que forçam o PostgREST a verificar o schema
-- Isso força o PostgREST a recarregar o cache do schema
SELECT COUNT(*) as total_decisores FROM public.decision_makers;
SELECT column_name FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'decision_makers' 
  AND column_name = 'data_sources';

-- 5. Verificar resultado final
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

-- 6. Verificar todas as colunas da tabela para debug
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

