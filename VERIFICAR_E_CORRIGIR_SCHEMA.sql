-- ============================================
-- VERIFICAR E CORRIGIR SCHEMA DEFINITIVAMENTE
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Este script verifica e corrige TODOS os problemas possíveis

-- 1. Verificar todas as colunas da tabela decision_makers
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
ORDER BY ordinal_position;

-- 2. Verificar se existe coluna data_source (singular) - PROBLEMA!
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    RAISE NOTICE '🚨 PROBLEMA ENCONTRADO: Coluna data_source (singular) existe!';
    RAISE NOTICE 'Removendo coluna data_source (singular)...';
    ALTER TABLE public.decision_makers DROP COLUMN IF EXISTS data_source;
    RAISE NOTICE '✅ Coluna data_source (singular) removida!';
  ELSE
    RAISE NOTICE '✅ OK: Coluna data_source (singular) não existe';
  END IF;
END $$;

-- 3. Garantir que data_sources (plural) existe
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

-- 4. Verificar resultado final
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

-- 5. Verificar se há dados com data_source (singular) - limpar se necessário
DO $$ 
DECLARE
  count_singular INTEGER;
BEGIN
  -- Verificar se há dados com data_source (se a coluna ainda existir)
  SELECT COUNT(*) INTO count_singular
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'decision_makers' 
    AND column_name = 'data_source';
  
  IF count_singular > 0 THEN
    RAISE NOTICE '⚠️ Ainda existe coluna data_source (singular) - execute DROP COLUMN manualmente';
  ELSE
    RAISE NOTICE '✅ OK: Nenhuma coluna data_source (singular) encontrada';
  END IF;
END $$;

-- 6. Recriar função RPC com TEXT (evita validação do PostgREST)
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);

CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
  decisores_data_text TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decisores_data JSONB;
  decisor JSONB;
  inserted_id UUID;
BEGIN
  -- Converter TEXT para JSONB internamente
  decisores_data := decisores_data_text::JSONB;
  
  -- Iterar sobre cada decisor no array JSONB
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- Inserir ou atualizar decisor
    INSERT INTO public.decision_makers (
      company_id,
      apollo_organization_id,
      apollo_person_id,
      name,
      title,
      email,
      linkedin_url,
      seniority,
      data_sources,
      photo_url,
      city,
      state,
      country,
      headline,
      raw_apollo_data
    ) VALUES (
      (decisor->>'company_id')::UUID,
      NULLIF(decisor->>'apollo_organization_id', 'null'),
      NULLIF(decisor->>'apollo_person_id', 'null'),
      decisor->>'name',
      NULLIF(decisor->>'title', 'null'),
      NULLIF(decisor->>'email', 'null'),
      NULLIF(decisor->>'linkedin_url', 'null'),
      NULLIF(decisor->>'seniority', 'null'),
      COALESCE((decisor->'data_sources')::JSONB, '["apollo"]'::JSONB),
      NULLIF(decisor->>'photo_url', 'null'),
      NULLIF(decisor->>'city', 'null'),
      NULLIF(decisor->>'state', 'null'),
      NULLIF(decisor->>'country', 'null'),
      NULLIF(decisor->>'headline', 'null'),
      COALESCE((decisor->'raw_apollo_data')::JSONB, '{}'::JSONB)
    )
    ON CONFLICT (apollo_person_id) 
    WHERE apollo_person_id IS NOT NULL
    DO UPDATE SET
      company_id = EXCLUDED.company_id,
      apollo_organization_id = EXCLUDED.apollo_organization_id,
      name = EXCLUDED.name,
      title = EXCLUDED.title,
      email = EXCLUDED.email,
      linkedin_url = EXCLUDED.linkedin_url,
      seniority = EXCLUDED.seniority,
      data_sources = EXCLUDED.data_sources,
      photo_url = EXCLUDED.photo_url,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      headline = EXCLUDED.headline,
      raw_apollo_data = EXCLUDED.raw_apollo_data,
      updated_at = NOW()
    RETURNING id INTO inserted_id;
    
    -- Retornar ID inserido
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- 8. Forçar recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 9. Aguardar alguns segundos
SELECT pg_sleep(3);

-- 10. Verificar função criada
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

-- ✅ Processo concluído! Tente buscar decisores novamente.

