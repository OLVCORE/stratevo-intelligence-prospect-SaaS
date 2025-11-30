-- ==========================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA icp_profile
-- ==========================================
-- Este script adiciona as colunas necessárias na tabela icp_profile
-- para todos os schemas de tenant que já existem

DO $$
DECLARE
  tenant_record RECORD;
  schema_name TEXT;
BEGIN
  -- Para cada tenant existente
  FOR tenant_record IN 
    SELECT id, schema_name as sn FROM public.tenants
  LOOP
    schema_name := tenant_record.sn;
    
    -- Verificar se o schema existe
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name) THEN
      RAISE NOTICE '📦 Atualizando schema: %', schema_name;
      
      -- Verificar se a tabela icp_profile existe
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = schema_name 
        AND table_name = 'icp_profile'
      ) THEN
        -- Adicionar colunas se não existirem
        BEGIN
          EXECUTE format('
            ALTER TABLE %I.icp_profile 
            ADD COLUMN IF NOT EXISTS nome TEXT,
            ADD COLUMN IF NOT EXISTS descricao TEXT,
            ADD COLUMN IF NOT EXISTS tipo TEXT,
            ADD COLUMN IF NOT EXISTS setor_foco TEXT,
            ADD COLUMN IF NOT EXISTS nicho_foco TEXT,
            ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS icp_principal BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS tenant_id UUID
          ', schema_name);
          
          -- Definir valores padrão para colunas NOT NULL
          EXECUTE format('
            UPDATE %I.icp_profile 
            SET nome = COALESCE(nome, ''ICP Principal''),
                tipo = COALESCE(tipo, ''core''),
                ativo = COALESCE(ativo, true),
                icp_principal = COALESCE(icp_principal, false),
                prioridade = COALESCE(prioridade, 1)
            WHERE nome IS NULL OR tipo IS NULL
          ', schema_name);
          
          -- Tornar colunas NOT NULL se possível
          BEGIN
            EXECUTE format('
              ALTER TABLE %I.icp_profile 
              ALTER COLUMN nome SET DEFAULT ''ICP Principal'',
              ALTER COLUMN tipo SET DEFAULT ''core'',
              ALTER COLUMN ativo SET DEFAULT true,
              ALTER COLUMN icp_principal SET DEFAULT false,
              ALTER COLUMN prioridade SET DEFAULT 1
            ', schema_name);
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Não foi possível alterar defaults para %: %', schema_name, SQLERRM;
          END;
          
          RAISE NOTICE '✅ Tabela icp_profile atualizada no schema: %', schema_name;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '❌ Erro ao atualizar %: %', schema_name, SQLERRM;
        END;
      ELSE
        RAISE NOTICE '⚠️ Tabela icp_profile não existe no schema: %', schema_name;
      END IF;
    ELSE
      RAISE NOTICE '⚠️ Schema não existe: %', schema_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Atualização concluída!';
END;
$$;

-- Verificar resultado
SELECT 
  t.nome as tenant_name,
  t.schema_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = t.schema_name 
      AND table_name = 'icp_profile' 
      AND column_name = 'nome'
    ) THEN '✅ Tem coluna nome'
    ELSE '❌ Falta coluna nome'
  END as status
FROM public.tenants t
WHERE EXISTS (
  SELECT 1 FROM information_schema.schemata 
  WHERE schema_name = t.schema_name
)
ORDER BY t.nome;

