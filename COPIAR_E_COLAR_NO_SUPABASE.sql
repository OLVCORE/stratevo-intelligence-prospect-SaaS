-- ==========================================
-- COPIE E COLE ESTE SQL NO SUPABASE DASHBOARD
-- ==========================================
-- Acesse: https://app.supabase.com/
-- Vá em: SQL Editor → New Query
-- Cole este código completo
-- Clique em: Run (Ctrl+Enter)
-- ==========================================

-- 🔥 CORREÇÃO: Dropar view materializada ANTES de alterar coluna
DROP MATERIALIZED VIEW IF EXISTS mv_enderecos_completos CASCADE;

-- 1. Garantir que step1_data é JSONB
DO $$ 
BEGIN
  -- Verificar se precisa converter
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

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_onboarding_step1_cnpj 
  ON onboarding_sessions USING gin ((step1_data -> 'cnpj'));

CREATE INDEX IF NOT EXISTS idx_onboarding_step1_concorrentes 
  ON onboarding_sessions USING gin ((step1_data -> 'concorrentesDiretos'));

-- 3. Função para obter endereço do TENANT
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

-- 4. Função para obter endereços de CONCORRENTES
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

-- 5. Criar view materializada para cache de endereços
CREATE MATERIALIZED VIEW mv_enderecos_completos AS
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

-- 6. Criar índice único na view
CREATE UNIQUE INDEX idx_mv_enderecos_tenant 
  ON mv_enderecos_completos (tenant_id);

-- 7. Garantir permissões
GRANT SELECT ON mv_enderecos_completos TO authenticated;
GRANT EXECUTE ON FUNCTION get_concorrentes_com_endereco(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_endereco(uuid) TO authenticated;

-- ==========================================
-- ✅ PRONTO! AGORA VOCÊ PODE TESTAR:
-- ==========================================

-- Ver endereço de um tenant específico:
-- SELECT * FROM get_tenant_endereco('SEU_TENANT_ID');

-- Ver endereços de concorrentes:
-- SELECT * FROM get_concorrentes_com_endereco('SEU_TENANT_ID');

-- Ver view materializada (cache de todos os endereços):
-- SELECT * FROM mv_enderecos_completos WHERE tenant_id = 'SEU_TENANT_ID';

-- Ver dados brutos (JSON):
-- SELECT step1_data FROM onboarding_sessions WHERE tenant_id = 'SEU_TENANT_ID';

