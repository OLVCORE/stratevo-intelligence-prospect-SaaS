-- ==========================================
-- MIGRATION: Garantir endereço completo para Tenant e Concorrentes
-- Data: 2025-02-02
-- Descrição: Adiciona campos de endereço completo em onboarding_sessions
-- ==========================================

-- 🔥 CORREÇÃO: Dropar views e triggers existentes ANTES de modificar
DROP TRIGGER IF EXISTS trigger_refresh_enderecos ON onboarding_sessions CASCADE;
DROP FUNCTION IF EXISTS refresh_enderecos_on_update() CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_enderecos_completos CASCADE;

-- 1. Verificar se a coluna step1_data existe e é do tipo jsonb
DO $$ 
BEGIN
  -- Garantir que step1_data é JSONB (não JSON)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'onboarding_sessions' 
      AND column_name = 'step1_data' 
      AND data_type = 'json'
  ) THEN
    ALTER TABLE onboarding_sessions 
      ALTER COLUMN step1_data TYPE jsonb USING step1_data::jsonb;
    
    RAISE NOTICE '✅ step1_data convertido para JSONB';
  ELSE
    RAISE NOTICE '✅ step1_data já é JSONB';
  END IF;
END $$;

-- 2. Criar comentários para documentar a estrutura esperada
COMMENT ON COLUMN onboarding_sessions.step1_data IS 
'Dados do Step 1 (Dados Básicos) em formato JSONB.

Estrutura esperada:
{
  "cnpj": "00.000.000/0000-00",
  "email": "contato@empresa.com",
  "website": "https://empresa.com",
  "telefone": "(11) 9999-9999",
  "cnpjData": {
    "nome": "RAZAO SOCIAL LTDA",
    "fantasia": "Nome Fantasia",
    "situacao": "ATIVA",
    "abertura": "01/01/2020",
    "natureza_juridica": "LTDA",
    "capital_social": 100000,
    "porte": "MEDIO",
    "atividade_principal": [...],
    "municipio": "SAO PAULO",
    "uf": "SP",
    "cep": "01234-000",
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Sala 1"
  },
  "concorrentesDiretos": [
    {
      "cnpj": "00.000.000/0000-00",
      "razaoSocial": "CONCORRENTE LTDA",
      "nomeFantasia": "Concorrente",
      "setor": "Industria",
      "cidade": "SAO PAULO",
      "estado": "SP",
      "capitalSocial": 50000,
      "cnaePrincipal": "1234567",
      "cnaePrincipalDescricao": "Atividade principal",
      "website": "https://concorrente.com",
      "urlParaScan": "https://concorrente.com",
      "produtosExtraidos": 0,
      "produtos": [],
      "cep": "01234-000",
      "endereco": "Rua Exemplo",
      "bairro": "Centro",
      "numero": "123"
    }
  ]
}';

-- 3. Criar índices para melhorar performance de queries com JSONB
CREATE INDEX IF NOT EXISTS idx_onboarding_step1_cnpj 
  ON onboarding_sessions USING gin ((step1_data -> 'cnpj'));

CREATE INDEX IF NOT EXISTS idx_onboarding_step1_concorrentes 
  ON onboarding_sessions USING gin ((step1_data -> 'concorrentesDiretos'));

-- 4. Criar função para validar estrutura de endereço
CREATE OR REPLACE FUNCTION validate_endereco_structure(endereco_json jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar se tem pelo menos CEP ou logradouro
  RETURN (
    endereco_json ? 'cep' OR 
    endereco_json ? 'endereco' OR 
    endereco_json ? 'logradouro'
  );
END;
$$;

COMMENT ON FUNCTION validate_endereco_structure(jsonb) IS 
'Valida se um objeto JSON de endereço tem estrutura mínima (CEP ou logradouro)';

-- 5. Criar função para extrair endereços completos de concorrentes
CREATE OR REPLACE FUNCTION get_concorrentes_com_endereco(p_tenant_id uuid)
RETURNS TABLE (
  cnpj text,
  razao_social text,
  cep text,
  endereco text,
  numero text,
  bairro text,
  cidade text,
  estado text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (c->>'cnpj')::text AS cnpj,
    (c->>'razaoSocial')::text AS razao_social,
    (c->>'cep')::text AS cep,
    (c->>'endereco')::text AS endereco,
    (c->>'numero')::text AS numero,
    (c->>'bairro')::text AS bairro,
    (c->>'cidade')::text AS cidade,
    (c->>'estado')::text AS estado
  FROM 
    onboarding_sessions os,
    jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
  WHERE 
    os.tenant_id = p_tenant_id
    AND os.step1_data ? 'concorrentesDiretos'
    AND jsonb_array_length(os.step1_data->'concorrentesDiretos') > 0;
END;
$$;

COMMENT ON FUNCTION get_concorrentes_com_endereco(uuid) IS 
'Retorna lista de concorrentes com endereços completos de um tenant';

-- 6. Criar função para obter endereço do tenant
CREATE OR REPLACE FUNCTION get_tenant_endereco(p_tenant_id uuid)
RETURNS TABLE (
  cep text,
  logradouro text,
  numero text,
  bairro text,
  complemento text,
  cidade text,
  estado text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (os.step1_data->'cnpjData'->>'cep')::text AS cep,
    (os.step1_data->'cnpjData'->>'logradouro')::text AS logradouro,
    (os.step1_data->'cnpjData'->>'numero')::text AS numero,
    (os.step1_data->'cnpjData'->>'bairro')::text AS bairro,
    (os.step1_data->'cnpjData'->>'complemento')::text AS complemento,
    (os.step1_data->'cnpjData'->>'municipio')::text AS cidade,
    (os.step1_data->'cnpjData'->>'uf')::text AS estado
  FROM 
    onboarding_sessions os
  WHERE 
    os.tenant_id = p_tenant_id
    AND os.step1_data ? 'cnpjData';
END;
$$;

COMMENT ON FUNCTION get_tenant_endereco(uuid) IS 
'Retorna endereço completo do tenant';

-- 7. Criar view materializada para endereços (performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_enderecos_completos AS
SELECT 
  os.tenant_id,
  os.user_id,
  -- Endereço do Tenant
  os.step1_data->'cnpjData'->>'cep' AS tenant_cep,
  os.step1_data->'cnpjData'->>'logradouro' AS tenant_logradouro,
  os.step1_data->'cnpjData'->>'numero' AS tenant_numero,
  os.step1_data->'cnpjData'->>'bairro' AS tenant_bairro,
  os.step1_data->'cnpjData'->>'municipio' AS tenant_cidade,
  os.step1_data->'cnpjData'->>'uf' AS tenant_estado,
  -- Array de endereços de concorrentes
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'cnpj', c->>'cnpj',
        'razaoSocial', c->>'razaoSocial',
        'cep', c->>'cep',
        'endereco', c->>'endereco',
        'numero', c->>'numero',
        'bairro', c->>'bairro',
        'cidade', c->>'cidade',
        'estado', c->>'estado'
      )
    )
    FROM jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
    WHERE c ? 'cep' OR c ? 'endereco'
  ) AS concorrentes_enderecos,
  os.updated_at
FROM 
  onboarding_sessions os
WHERE 
  os.step1_data IS NOT NULL;

-- Criar índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_enderecos_tenant 
  ON mv_enderecos_completos (tenant_id);

CREATE INDEX IF NOT EXISTS idx_mv_enderecos_updated 
  ON mv_enderecos_completos (updated_at DESC);

COMMENT ON MATERIALIZED VIEW mv_enderecos_completos IS 
'View materializada com endereços completos de tenants e concorrentes.
IMPORTANTE: Atualizar com REFRESH MATERIALIZED VIEW mv_enderecos_completos;';

-- 8. Criar trigger para atualizar view materializada automaticamente
CREATE OR REPLACE FUNCTION refresh_enderecos_on_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar view materializada de forma concorrente (não bloqueia)
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_enderecos_completos;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se falhar, logar erro mas não interromper a operação
    RAISE WARNING 'Erro ao atualizar mv_enderecos_completos: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger apenas se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_refresh_enderecos'
  ) THEN
    CREATE TRIGGER trigger_refresh_enderecos
      AFTER INSERT OR UPDATE OF step1_data
      ON onboarding_sessions
      FOR EACH ROW
      EXECUTE FUNCTION refresh_enderecos_on_update();
    
    RAISE NOTICE '✅ Trigger para atualizar endereços criado';
  END IF;
END $$;

-- 9. Garantir permissões de acesso
GRANT SELECT ON mv_enderecos_completos TO authenticated;
GRANT EXECUTE ON FUNCTION get_concorrentes_com_endereco(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_endereco(uuid) TO authenticated;

-- 10. Refresh inicial da view materializada
REFRESH MATERIALIZED VIEW mv_enderecos_completos;

-- ==========================================
-- FIM DA MIGRATION
-- ==========================================

-- Verificações finais
DO $$ 
DECLARE
  v_count integer;
BEGIN
  -- Contar registros na view
  SELECT COUNT(*) INTO v_count FROM mv_enderecos_completos;
  RAISE NOTICE '✅ Migration concluída! % registros na view materializada', v_count;
  
  -- Verificar se índices foram criados
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onboarding_step1_cnpj') THEN
    RAISE NOTICE '✅ Índice idx_onboarding_step1_cnpj criado';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mv_enderecos_tenant') THEN
    RAISE NOTICE '✅ Índice idx_mv_enderecos_tenant criado';
  END IF;
END $$;

