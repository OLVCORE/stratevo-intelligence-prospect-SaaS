-- ============================================================================
-- CORRIGIR COLUNAS DA TABELA NICHOS - Remover Limites de Tamanho
-- ============================================================================
-- Este script corrige as colunas da tabela public.niches para aceitar valores maiores
-- Execute este script ANTES de executar ADICIONAR_NICHOS_COMPLETO_B2B.sql
-- ============================================================================

-- PASSO 1: Alterar sector_code, niche_code e niche_name para TEXT
ALTER TABLE public.niches
  ALTER COLUMN sector_code TYPE text,
  ALTER COLUMN niche_code TYPE text,
  ALTER COLUMN niche_name TYPE text;

-- PASSO 2: Alinhar totvs_products com o script (TEXT[] ao invés de jsonb)
-- Usa abordagem em múltiplas etapas para evitar erro com subconsultas em USING
DO $do$
DECLARE
  col_is_jsonb boolean;
  col_exists boolean;
BEGIN
  SELECT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
             AND table_name = 'niches' 
             AND column_name = 'totvs_products'
         ),
         EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
             AND table_name = 'niches' 
             AND column_name = 'totvs_products'
             AND data_type = 'jsonb'
         )
    INTO col_exists, col_is_jsonb;

  IF NOT col_exists THEN
    -- Se a coluna não existe, criar diretamente como text[]
    ALTER TABLE public.niches
      ADD COLUMN totvs_products text[] DEFAULT ARRAY[]::text[];
    RAISE NOTICE '✅ Coluna totvs_products criada como text[]';
    RETURN;
  END IF;

  IF col_is_jsonb THEN
    -- 0) Remover coluna temporária se existir de execução anterior
    ALTER TABLE public.niches DROP COLUMN IF EXISTS totvs_products_text;

    -- 1) Adicionar coluna temporária com o tipo final
    ALTER TABLE public.niches
      ADD COLUMN totvs_products_text text[];

    -- 2) Popular coluna temporária usando UPDATE (subconsultas permitidas aqui)
    UPDATE public.niches
    SET totvs_products_text = CASE
      WHEN totvs_products IS NULL THEN ARRAY[]::text[]
      WHEN jsonb_typeof(totvs_products) = 'array'
        THEN (
          SELECT COALESCE(array_agg(elem), ARRAY[]::text[])
          FROM (
            SELECT value::text AS elem
            FROM jsonb_array_elements_text(totvs_products)
          ) s
        )
      WHEN jsonb_typeof(totvs_products) = 'string'
        THEN ARRAY[(totvs_products)::text]
      ELSE ARRAY[]::text[]
    END;

    -- 3a) Remover coluna original
    ALTER TABLE public.niches
      DROP COLUMN totvs_products;

    -- 3b) Renomear temporária para nome final
    ALTER TABLE public.niches
      RENAME COLUMN totvs_products_text TO totvs_products;

    -- 4) Aplicar default
    ALTER TABLE public.niches
      ALTER COLUMN totvs_products SET DEFAULT ARRAY[]::text[];

    RAISE NOTICE '✅ Coluna totvs_products convertida de jsonb para text[]';
  ELSE
    -- Já é text[] (ou outro tipo não-jsonb)
    -- Garantir que default existe
    ALTER TABLE public.niches
      ALTER COLUMN totvs_products SET DEFAULT ARRAY[]::text[];
    RAISE NOTICE '✅ Coluna totvs_products já é text[] ou compatível';
  END IF;
END
$do$;

-- PASSO 3: Criar índices necessários
CREATE UNIQUE INDEX IF NOT EXISTS idx_niches_sector_code ON public.niches(sector_code, niche_code);
CREATE INDEX IF NOT EXISTS idx_niches_sector ON public.niches(sector_code);
CREATE INDEX IF NOT EXISTS idx_niches_name ON public.niches(niche_name);

-- PASSO 4: Garantir que a foreign key está correta
-- (A FK já deve existir, mas vamos garantir que está funcionando)
DO $$
BEGIN
    -- Verificar se a FK existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'niches' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%sector_code%'
    ) THEN
        ALTER TABLE public.niches
          ADD CONSTRAINT niches_sector_code_fkey 
          FOREIGN KEY (sector_code) 
          REFERENCES public.sectors(sector_code) 
          ON DELETE CASCADE;
        RAISE NOTICE '✅ Foreign key criada';
    ELSE
        RAISE NOTICE '✅ Foreign key já existe';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- VERIFICAÇÃO FINAL
SELECT 
    '✅ CORREÇÃO CONCLUÍDA' as status,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = 'niches' 
     AND column_name = 'sector_code') as sector_code_tipo,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = 'niches' 
     AND column_name = 'niche_code') as niche_code_tipo,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = 'niches' 
     AND column_name = 'niche_name') as niche_name_tipo;

SELECT 
    '✅ AGORA EXECUTE ADICIONAR_NICHOS_COMPLETO_B2B.sql' as proximo_passo;

