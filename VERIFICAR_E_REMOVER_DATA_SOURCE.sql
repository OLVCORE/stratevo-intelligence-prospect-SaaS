-- ============================================
-- VERIFICAR E REMOVER COLUNA data_source (singular)
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este script verifica se a coluna data_source (singular) existe
-- e a remove se existir

-- 1. Verificar TODAS as colunas da tabela decision_makers
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

-- 2. Verificar especificamente colunas relacionadas a data_source
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%data_source%' OR column_name LIKE '%data_sources%')
ORDER BY column_name;

-- 3. Remover coluna data_source (singular) se existir
DO $$ 
BEGIN
  -- Verificar se existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    RAISE NOTICE '🚨 REMOVENDO coluna data_source (singular)...';
    ALTER TABLE public.decision_makers DROP COLUMN IF EXISTS data_source CASCADE;
    RAISE NOTICE '✅ Coluna data_source (singular) removida!';
  ELSE
    RAISE NOTICE '✅ OK: Coluna data_source (singular) não existe';
  END IF;
END $$;

-- 4. Garantir que data_sources (plural) existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_sources'
  ) THEN
    RAISE NOTICE 'Criando coluna data_sources (plural)...';
    ALTER TABLE public.decision_makers 
    ADD COLUMN data_sources JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE '✅ Coluna data_sources (plural) criada!';
  ELSE
    RAISE NOTICE '✅ OK: Coluna data_sources (plural) já existe';
  END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%data_source%' OR column_name LIKE '%data_sources%')
ORDER BY column_name;

-- 6. Forçar recarregamento do cache do PostgREST (múltiplas vezes)
DO $$
BEGIN
  FOR i IN 1..20 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
  RAISE NOTICE '✅ 20 notificações de reload enviadas ao PostgREST';
END $$;

-- 7. Aguardar alguns segundos
SELECT pg_sleep(5);

-- 8. Mensagens finais (dentro de um bloco DO)
DO $$
BEGIN
  RAISE NOTICE '✅ Processo concluído!';
  RAISE NOTICE '⚠️ IMPORTANTE: Se o erro persistir, REINICIE o projeto Supabase:';
  RAISE NOTICE '   1. Acesse: https://supabase.com/dashboard';
  RAISE NOTICE '   2. Vá em: Settings → General';
  RAISE NOTICE '   3. Clique em: Restart Project';
  RAISE NOTICE '   4. Aguarde 2-3 minutos';
  RAISE NOTICE '   5. Tente novamente';
END $$;

