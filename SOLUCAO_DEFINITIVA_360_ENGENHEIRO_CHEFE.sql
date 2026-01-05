-- ============================================
-- SOLUÇÃO DEFINITIVA 360° - ENGENHEIRO-CHEFE
-- ============================================
-- Este script resolve TODOS os problemas identificados:
-- 1. Inconsistência na função RPC (TEXT vs JSONB)
-- 2. Cache do PostgREST com referência à coluna antiga
-- 3. Garantir schema correto da tabela decision_makers
-- 
-- ⚠️ IMPORTANTE: Após executar este script, você DEVE REINICIAR o projeto Supabase
-- para limpar completamente o cache do PostgREST.
-- ============================================

-- ============================================
-- ETAPA 1: REMOVER TODAS AS REFERÊNCIAS À COLUNA ANTIGA
-- ============================================
DO $$ 
BEGIN
  -- Remover source (singular) - migração 20251026012553
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN source CASCADE;
    RAISE NOTICE '✅ Coluna source (singular) removida';
  ELSE
    RAISE NOTICE '✅ Coluna source (singular) não existe';
  END IF;
  
  -- Remover data_source (singular) - CAUSA DO ERRO
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_source'
  ) THEN
    ALTER TABLE public.decision_makers DROP COLUMN data_source CASCADE;
    RAISE NOTICE '✅ Coluna data_source (singular) removida - CAUSA DO ERRO';
  ELSE
    RAISE NOTICE '✅ Coluna data_source (singular) não existe';
  END IF;
END $$;

-- ============================================
-- ETAPA 2: GARANTIR COLUNA CORRETA (data_sources - PLURAL)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'decision_makers' 
      AND column_name = 'data_sources'
  ) THEN
    ALTER TABLE public.decision_makers 
    ADD COLUMN data_sources JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE '✅ Coluna data_sources (plural) criada';
  ELSE
    -- Garantir que é JSONB e tem default
    ALTER TABLE public.decision_makers 
    ALTER COLUMN data_sources SET DEFAULT '[]'::JSONB;
    RAISE NOTICE '✅ Coluna data_sources (plural) já existe e foi atualizada';
  END IF;
END $$;

-- ============================================
-- ETAPA 3: GARANTIR TODAS AS COLUNAS NECESSÁRIAS
-- ============================================
-- Adicionar colunas de localização (se não existirem)
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS city TEXT NULL,
  ADD COLUMN IF NOT EXISTS state TEXT NULL,
  ADD COLUMN IF NOT EXISTS country TEXT NULL;

-- Adicionar colunas do Apollo (se não existirem)
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS headline TEXT NULL,
  ADD COLUMN IF NOT EXISTS apollo_organization_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS apollo_person_id TEXT;

-- Garantir que raw_apollo_data existe
ALTER TABLE public.decision_makers
  ADD COLUMN IF NOT EXISTS raw_apollo_data JSONB NULL;

-- Criar índice único em apollo_person_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'decision_makers' 
    AND indexname = 'decision_makers_apollo_person_id_key'
  ) THEN
    CREATE UNIQUE INDEX decision_makers_apollo_person_id_key 
    ON public.decision_makers(apollo_person_id) 
    WHERE apollo_person_id IS NOT NULL;
    RAISE NOTICE '✅ Índice único em apollo_person_id criado';
  ELSE
    RAISE NOTICE '✅ Índice único em apollo_person_id já existe';
  END IF;
END $$;

-- ============================================
-- ETAPA 4: REMOVER TODAS AS VERSÕES ANTIGAS DA FUNÇÃO
-- ============================================
-- Remover TODAS as versões possíveis (JSONB e TEXT)
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(JSONB);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_direct(TEXT);
DROP FUNCTION IF EXISTS public.insert_decision_makers_batch_v2(TEXT);

-- ============================================
-- ETAPA 5: CRIAR FUNÇÃO DEFINITIVA (TEXT - CONFORME CÓDIGO)
-- ============================================
-- ✅ RECEBE TEXT e converte internamente (bypass total PostgREST)
-- ✅ Esta é a versão que o código da Edge Function espera
CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
  decisores_data_text TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decisores_data JSONB;
  decisor JSONB;
  inserted_id UUID;
  sql_dynamic TEXT;
BEGIN
  -- Converter TEXT para JSONB internamente (bypass PostgREST validation)
  BEGIN
    decisores_data := decisores_data_text::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid JSON: %', SQLERRM;
  END;
  
  -- Iterar sobre cada decisor
  FOR decisor IN SELECT * FROM jsonb_array_elements(decisores_data)
  LOOP
    -- Construir SQL dinâmico para inserção
    sql_dynamic := format('
      INSERT INTO public.decision_makers (
        company_id, apollo_organization_id, apollo_person_id, name, title,
        email, linkedin_url, seniority, data_sources, photo_url,
        city, state, country, headline, raw_apollo_data
      ) VALUES (
        %L::UUID, %L, %L, %L, %L, %L, %L, %L, %L::JSONB, %L, %L, %L, %L, %L, %L::JSONB
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
      RETURNING id;
    ',
      COALESCE(decisor->>'company_id', ''),
      COALESCE(NULLIF(decisor->>'apollo_organization_id', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'apollo_person_id', 'null'), NULL),
      COALESCE(decisor->>'name', ''),
      COALESCE(NULLIF(decisor->>'title', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'email', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'linkedin_url', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'seniority', 'null'), NULL),
      COALESCE(
        CASE 
          WHEN decisor->'data_sources' IS NOT NULL AND decisor->'data_sources' != 'null'::jsonb
          THEN (decisor->'data_sources')::TEXT
          ELSE '["apollo"]'
        END,
        '["apollo"]'
      )::JSONB,
      COALESCE(NULLIF(decisor->>'photo_url', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'city', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'state', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'country', 'null'), NULL),
      COALESCE(NULLIF(decisor->>'headline', 'null'), NULL),
      COALESCE(
        CASE 
          WHEN decisor->'raw_apollo_data' IS NOT NULL AND decisor->'raw_apollo_data' != 'null'::jsonb
          THEN (decisor->'raw_apollo_data')::TEXT
          ELSE '{}'
        END,
        '{}'
      )::JSONB
    );
    
    -- Executar SQL dinâmico
    EXECUTE sql_dynamic INTO inserted_id;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- ============================================
-- ETAPA 6: CONCEDER PERMISSÕES
-- ============================================
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_decision_makers_batch(TEXT) TO service_role;

-- ============================================
-- ETAPA 7: VERIFICAÇÃO FINAL
-- ============================================
-- Verificar colunas relacionadas a source
SELECT 
  'COLUNAS_SOURCE' as verificação,
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'decision_makers'
  AND (column_name LIKE '%source%' OR column_name LIKE '%data_source%')
ORDER BY column_name;

-- Verificar função criada
SELECT 
  'FUNCAO_RPC' as verificação,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_decision_makers_batch';

-- Verificar parâmetros da função
SELECT 
  'PARAMETROS_FUNCAO' as verificação,
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE 'insert_decision_makers_batch%'
ORDER BY ordinal_position;

-- ============================================
-- ETAPA 8: MENSAGEM FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔴 AÇÃO OBRIGATÓRIA: REINICIAR PROJETO SUPABASE';
  RAISE NOTICE '';
  RAISE NOTICE 'Para limpar o cache do PostgREST completamente:';
  RAISE NOTICE '1. Acesse: https://supabase.com/dashboard';
  RAISE NOTICE '2. Selecione seu projeto';
  RAISE NOTICE '3. Vá em: Settings → General';
  RAISE NOTICE '4. Clique em: "Restart Project"';
  RAISE NOTICE '5. Aguarde 2-3 minutos';
  RAISE NOTICE '6. Teste a busca de decisores novamente';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ SEM REINICIAR, O ERRO PERSISTIRÁ!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

