-- ==========================================
-- SOLUÇÃO RÁPIDA: Adicionar Colunas Faltantes
-- ==========================================
-- Execute este script PRIMEIRO para corrigir a tabela icp_profile

DO $$
DECLARE
  v_schema_name TEXT := 'tenant_olv-internacional-comercio-importacao-e-exportacao-ltda-';
BEGIN
  -- Verificar se o schema existe
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema_name) THEN
    RAISE NOTICE '📦 Adicionando colunas ao schema: %', v_schema_name;
    
    -- Adicionar colunas uma por uma
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS nome TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS descricao TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS tipo TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS setor_foco TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS nicho_foco TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS icp_principal BOOLEAN DEFAULT false', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 1', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS tenant_id UUID', v_schema_name);
    
    -- Atualizar valores padrão
    EXECUTE format('
      UPDATE %I.icp_profile 
      SET nome = COALESCE(nome, ''ICP Principal''),
          tipo = COALESCE(tipo, ''core''),
          ativo = COALESCE(ativo, true),
          icp_principal = COALESCE(icp_principal, false),
          prioridade = COALESCE(prioridade, 1)
      WHERE nome IS NULL OR tipo IS NULL
    ', v_schema_name);
    
    RAISE NOTICE '✅ Colunas adicionadas com sucesso!';
  ELSE
    RAISE EXCEPTION 'Schema % não existe!', v_schema_name;
  END IF;
END;
$$;

-- Verificar resultado
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'tenant_olv-internacional-comercio-importacao-e-exportacao-ltda-'
  AND table_name = 'icp_profile'
  AND column_name IN ('nome', 'descricao', 'tipo', 'setor_foco', 'nicho_foco', 'ativo', 'icp_principal', 'prioridade', 'tenant_id')
ORDER BY column_name;

