-- ==========================================
-- ATUALIZAR ENDEREÇOS DE TODOS OS TENANTS
-- ==========================================
-- Este script atualiza endereços faltantes para:
-- 1. Todos os concorrentes de todos os tenants
-- 2. Busca CEP que estão faltando
-- 3. Marca para reprocessamento
-- ==========================================

-- PASSO 1: Ver TODOS os concorrentes sem endereço (de TODOS os tenants)
SELECT 
  os.tenant_id,
  c->>'cnpj' as cnpj,
  c->>'razaoSocial' as razao_social,
  c->>'cep' as cep,
  c->>'endereco' as endereco,
  c->>'cidade' as cidade,
  c->>'estado' as estado,
  CASE 
    WHEN c->>'cep' IS NULL THEN '❌ SEM CEP'
    WHEN c->>'endereco' IS NULL THEN '⚠️ SEM ENDEREÇO'
    ELSE '✅ OK'
  END as status
FROM 
  onboarding_sessions os,
  jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
WHERE 
  os.step1_data IS NOT NULL
  AND os.step1_data ? 'concorrentesDiretos'
ORDER BY 
  os.tenant_id,
  status DESC;

-- ==========================================
-- PASSO 2: Contar quantos precisam de atualização
-- ==========================================
SELECT 
  COUNT(*) as total_concorrentes_sem_endereco,
  COUNT(DISTINCT os.tenant_id) as tenants_afetados
FROM 
  onboarding_sessions os,
  jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
WHERE 
  os.step1_data IS NOT NULL
  AND os.step1_data ? 'concorrentesDiretos'
  AND (
    c->>'cep' IS NULL 
    OR c->>'endereco' IS NULL
  );

-- ==========================================
-- PASSO 3: Criar tabela temporária com CNPJs sem endereço
-- ==========================================
CREATE TEMP TABLE IF NOT EXISTS temp_cnpjs_sem_endereco AS
SELECT DISTINCT
  c->>'cnpj' as cnpj,
  c->>'razaoSocial' as razao_social
FROM 
  onboarding_sessions os,
  jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
WHERE 
  os.step1_data IS NOT NULL
  AND os.step1_data ? 'concorrentesDiretos'
  AND (
    c->>'cep' IS NULL 
    OR c->>'endereco' IS NULL
  );

-- Ver CNPJs únicos que precisam de atualização
SELECT * FROM temp_cnpjs_sem_endereco;

-- ==========================================
-- PASSO 4: SOLUÇÃO RECOMENDADA
-- ==========================================
-- ⚠️ ATENÇÃO: Não é possível buscar CEPs automaticamente via SQL!
-- A API da Receita Federal e ViaCEP só funcionam via HTTP.
--
-- OPÇÕES:
--
-- OPÇÃO A: Use o frontend (RECOMENDADO)
-- 1. Vá na Etapa 1 de CADA tenant
-- 2. Clique no botão "🔄 Atualizar Endereços"
-- 3. Repita para cada tenant
--
-- OPÇÃO B: Script automatizado (abaixo)

-- ==========================================
-- PASSO 5: Criar flag para reprocessamento
-- ==========================================
-- Esta flag marca tenants que precisam de reprocessamento.
-- O frontend vai detectar e mostrar um alerta.

-- Adicionar coluna de controle (se não existir)
ALTER TABLE onboarding_sessions 
ADD COLUMN IF NOT EXISTS needs_address_reprocessing boolean DEFAULT false;

-- Marcar todos os tenants que têm concorrentes sem endereço
UPDATE onboarding_sessions os
SET needs_address_reprocessing = true
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
  WHERE c->>'cep' IS NULL OR c->>'endereco' IS NULL
);

-- Ver quantos foram marcados
SELECT 
  COUNT(*) as tenants_marcados_para_reprocessamento
FROM onboarding_sessions
WHERE needs_address_reprocessing = true;

-- ==========================================
-- PASSO 6: Ver lista de tenants que precisam atualizar
-- ==========================================
SELECT 
  os.tenant_id,
  os.step1_data->'cnpjData'->>'nome' as tenant_name,
  os.step1_data->'cnpjData'->>'cnpj' as tenant_cnpj,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
    WHERE c->>'cep' IS NULL OR c->>'endereco' IS NULL
  ) as concorrentes_sem_endereco,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
  ) as total_concorrentes
FROM onboarding_sessions os
WHERE os.needs_address_reprocessing = true
ORDER BY concorrentes_sem_endereco DESC;

-- ==========================================
-- ✅ PRONTO!
-- ==========================================
-- Agora você tem:
-- 1. Lista de todos os CNPJs sem endereço
-- 2. Flag marcando tenants que precisam atualizar
-- 3. Contador de quantos concorrentes faltam
--
-- O FRONTEND vai detectar a flag e mostrar:
-- 🔔 ALERTA: "11 concorrentes precisam de endereço. Clique aqui para atualizar."
-- 
-- Quando o usuário clicar, o sistema:
-- 1. Busca Receita Federal
-- 2. Busca ViaCEP
-- 3. Atualiza automaticamente
-- 4. Remove a flag
-- ==========================================

