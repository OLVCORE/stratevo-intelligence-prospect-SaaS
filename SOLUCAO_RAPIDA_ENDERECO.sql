-- ==========================================
-- ⚡ SOLUÇÃO RÁPIDA - COPIE E COLE NO SUPABASE
-- ==========================================
-- Esta é a versão MAIS SIMPLES e MAIS SEGURA
-- Sem views materializadas, sem triggers complexos
-- Apenas índices e funções essenciais
-- ==========================================

-- 1. Dropar qualquer coisa que possa estar causando conflito
DROP MATERIALIZED VIEW IF EXISTS mv_enderecos_completos CASCADE;
DROP TRIGGER IF EXISTS trigger_refresh_enderecos ON onboarding_sessions CASCADE;
DROP FUNCTION IF EXISTS refresh_enderecos_on_update() CASCADE;

-- 2. Garantir que step1_data é JSONB (sem erros se já for)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'onboarding_sessions' 
      AND column_name = 'step1_data' 
      AND data_type = 'json'
  ) THEN
    ALTER TABLE onboarding_sessions 
      ALTER COLUMN step1_data TYPE jsonb USING step1_data::jsonb;
    RAISE NOTICE '✅ Convertido para JSONB';
  ELSE
    RAISE NOTICE '✅ Já é JSONB';
  END IF;
END $$;

-- 3. Criar índices para performance
DROP INDEX IF EXISTS idx_onboarding_step1_cnpj;
DROP INDEX IF EXISTS idx_onboarding_step1_concorrentes;

CREATE INDEX idx_onboarding_step1_cnpj 
  ON onboarding_sessions USING gin ((step1_data -> 'cnpj'));

CREATE INDEX idx_onboarding_step1_concorrentes 
  ON onboarding_sessions USING gin ((step1_data -> 'concorrentesDiretos'));

-- 4. Função para obter endereço do TENANT
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
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (os.step1_data->'cnpjData'->>'cep')::text,
    (os.step1_data->'cnpjData'->>'logradouro')::text,
    (os.step1_data->'cnpjData'->>'numero')::text,
    (os.step1_data->'cnpjData'->>'bairro')::text,
    (os.step1_data->'cnpjData'->>'complemento')::text,
    (os.step1_data->'cnpjData'->>'municipio')::text,
    (os.step1_data->'cnpjData'->>'uf')::text
  FROM 
    onboarding_sessions os
  WHERE 
    os.tenant_id = p_tenant_id
    AND os.step1_data IS NOT NULL
    AND os.step1_data ? 'cnpjData'
  LIMIT 1;
END;
$$;

-- 5. Função para obter endereços de CONCORRENTES
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
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (c->>'cnpj')::text,
    (c->>'razaoSocial')::text,
    (c->>'cep')::text,
    (c->>'endereco')::text,
    (c->>'numero')::text,
    (c->>'bairro')::text,
    (c->>'cidade')::text,
    (c->>'estado')::text
  FROM 
    onboarding_sessions os,
    jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
  WHERE 
    os.tenant_id = p_tenant_id
    AND os.step1_data IS NOT NULL
    AND os.step1_data ? 'concorrentesDiretos'
    AND jsonb_array_length(os.step1_data->'concorrentesDiretos') > 0;
END;
$$;

-- 6. Garantir permissões
GRANT EXECUTE ON FUNCTION get_concorrentes_com_endereco(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_endereco(uuid) TO authenticated;

-- ==========================================
-- ✅ PRONTO! EXECUTE OS TESTES ABAIXO:
-- ==========================================

-- Substituir 'SEU_TENANT_ID' pelo ID real do seu tenant
-- Exemplo: '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'

-- 1. Ver endereço do tenant:
-- SELECT * FROM get_tenant_endereco('SEU_TENANT_ID');

-- 2. Ver endereços dos concorrentes:
-- SELECT * FROM get_concorrentes_com_endereco('SEU_TENANT_ID');

-- 3. Ver dados brutos (JSON):
-- SELECT 
--   step1_data->'cnpjData' as tenant_dados,
--   step1_data->'concorrentesDiretos' as concorrentes
-- FROM onboarding_sessions 
-- WHERE tenant_id = 'SEU_TENANT_ID';

-- ==========================================
-- 🎉 SE VIU OS DADOS, ESTÁ FUNCIONANDO!
-- ==========================================

