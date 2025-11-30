-- ============================================================================
-- TESTAR RPC E VERIFICAR DADOS - Verificar se funções retornam dados corretos
-- ============================================================================

-- ========================================
-- TESTE 1: Verificar dados nas tabelas
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DADOS NAS TABELAS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: %', sectors_count;
  RAISE NOTICE 'Nichos: %', niches_count;
  
  IF sectors_count = 0 THEN
    RAISE WARNING '⚠️ TABELA SECTORS ESTÁ VAZIA!';
  END IF;
  
  IF niches_count = 0 THEN
    RAISE WARNING '⚠️ TABELA NICHES ESTÁ VAZIA!';
  END IF;
END $$;

-- Mostrar alguns registros de exemplo
SELECT 
  'EXEMPLO SETORES' as tipo,
  sector_code,
  sector_name,
  description
FROM public.sectors
ORDER BY sector_name
LIMIT 5;

SELECT 
  'EXEMPLO NICHOS' as tipo,
  niche_code,
  niche_name,
  sector_code,
  description
FROM public.niches
ORDER BY niche_name
LIMIT 5;

-- ========================================
-- TESTE 2: Testar função get_sectors_niches_json
-- ========================================
DO $$
DECLARE
  result_json JSONB;
  sectors_array JSONB;
  niches_array JSONB;
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE: get_sectors_niches_json()';
  RAISE NOTICE '========================================';
  
  SELECT public.get_sectors_niches_json() INTO result_json;
  
  IF result_json IS NULL THEN
    RAISE WARNING '❌ Função retornou NULL!';
    RETURN;
  END IF;
  
  sectors_array := result_json->'sectors';
  niches_array := result_json->'niches';
  
  IF sectors_array IS NULL THEN
    RAISE WARNING '❌ Campo "sectors" não existe no JSON!';
  ELSE
    sectors_count := jsonb_array_length(sectors_array);
    RAISE NOTICE '✅ Campo "sectors" existe: % itens', sectors_count;
    
    IF sectors_count > 0 THEN
      RAISE NOTICE 'Primeiro setor: %', sectors_array->0;
    END IF;
  END IF;
  
  IF niches_array IS NULL THEN
    RAISE WARNING '❌ Campo "niches" não existe no JSON!';
  ELSE
    niches_count := jsonb_array_length(niches_array);
    RAISE NOTICE '✅ Campo "niches" existe: % itens', niches_count;
    
    IF niches_count > 0 THEN
      RAISE NOTICE 'Primeiro nicho: %', niches_array->0;
    END IF;
  END IF;
  
  -- Verificar estrutura do primeiro setor
  IF sectors_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'ESTRUTURA DO PRIMEIRO SETOR:';
    RAISE NOTICE '  sector_code: %', sectors_array->0->>'sector_code';
    RAISE NOTICE '  sector_name: %', sectors_array->0->>'sector_name';
    RAISE NOTICE '  description: %', sectors_array->0->>'description';
  END IF;
  
  -- Verificar estrutura do primeiro nicho
  IF niches_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'ESTRUTURA DO PRIMEIRO NICHO:';
    RAISE NOTICE '  niche_code: %', niches_array->0->>'niche_code';
    RAISE NOTICE '  niche_name: %', niches_array->0->>'niche_name';
    RAISE NOTICE '  sector_code: %', niches_array->0->>'sector_code';
  END IF;
END $$;

-- ========================================
-- TESTE 3: Testar função get_sectors_niches (TABLE)
-- ========================================
DO $$
DECLARE
  row_count INTEGER;
  first_row RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE: get_sectors_niches()';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO row_count FROM public.get_sectors_niches();
  RAISE NOTICE 'Total de linhas retornadas: %', row_count;
  
  IF row_count > 0 THEN
    SELECT * INTO first_row FROM public.get_sectors_niches() LIMIT 1;
    RAISE NOTICE '';
    RAISE NOTICE 'PRIMEIRA LINHA:';
    RAISE NOTICE '  sector_code: %', first_row.sector_code;
    RAISE NOTICE '  sector_name: %', first_row.sector_name;
    RAISE NOTICE '  niche_code: %', first_row.niche_code;
    RAISE NOTICE '  niche_name: %', first_row.niche_name;
  END IF;
END $$;

-- ========================================
-- TESTE 4: Verificar se campos existem nas tabelas
-- ========================================
SELECT 
  'COLUNAS SECTORS' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sectors'
ORDER BY ordinal_position;

SELECT 
  'COLUNAS NICHES' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'niches'
ORDER BY ordinal_position;

-- ========================================
-- TESTE 5: Executar função RPC diretamente e mostrar resultado
-- ========================================
SELECT public.get_sectors_niches_json() as resultado_json;

-- Mostrar primeiras linhas da função TABLE
SELECT * FROM public.get_sectors_niches() LIMIT 10;

