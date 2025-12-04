-- ==========================================
-- ATUALIZAR ENDEREÇOS DE CONCORRENTES EXISTENTES
-- ==========================================
-- Este script NÃO atualiza automaticamente.
-- Você precisa fazer manualmente para cada tenant.
-- ==========================================

-- 1. Ver quais concorrentes NÃO têm endereço
-- Substituir 'SEU_TENANT_ID' pelo ID real:

SELECT 
  c->>'cnpj' as cnpj,
  c->>'razaoSocial' as razao_social,
  c->>'cep' as cep,
  c->>'endereco' as endereco,
  CASE 
    WHEN c->>'cep' IS NULL THEN '❌ SEM CEP'
    WHEN c->>'endereco' IS NULL THEN '⚠️ SEM ENDEREÇO'
    ELSE '✅ OK'
  END as status
FROM 
  onboarding_sessions os,
  jsonb_array_elements(os.step1_data->'concorrentesDiretos') c
WHERE 
  os.tenant_id = 'SEU_TENANT_ID'
ORDER BY status DESC;

-- ==========================================
-- 2. OPÇÃO A: Recadastrar os concorrentes
-- ==========================================
-- A forma MAIS FÁCIL é:
-- 1. Ir no frontend (Etapa 1 do Onboarding)
-- 2. Remover os concorrentes antigos
-- 3. Adicionar novamente (vai buscar CEP/endereço automaticamente)

-- ==========================================
-- 3. OPÇÃO B: Buscar CEPs na Receita Federal
-- ==========================================
-- Infelizmente, não dá para fazer isso direto no SQL.
-- O Supabase não tem acesso à API da Receita Federal.
-- 
-- SOLUÇÃO: Use o frontend para reprocessar:
-- 1. Vá na página de Onboarding
-- 2. Para cada concorrente sem endereço:
--    - Copie o CNPJ
--    - Adicione novamente
--    - O sistema vai buscar CEP/endereço automaticamente

-- ==========================================
-- 4. Ver dados brutos para debug
-- ==========================================
SELECT 
  tenant_id,
  step1_data->'concorrentesDiretos' as concorrentes_json
FROM onboarding_sessions
WHERE tenant_id = 'SEU_TENANT_ID';

-- ==========================================
-- 5. EXEMPLO: Atualizar UM concorrente manualmente
-- ==========================================
-- Se você JÁ SABE o CEP/endereço de um concorrente específico,
-- pode atualizar manualmente (substitua os valores):

/*
UPDATE onboarding_sessions
SET step1_data = jsonb_set(
  step1_data,
  '{concorrentesDiretos}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN c->>'cnpj' = '00.762.253/0001-00' THEN
          c || jsonb_build_object(
            'cep', '01234-000',
            'endereco', 'Rua Exemplo',
            'numero', '123',
            'bairro', 'Centro'
          )
        ELSE c
      END
    )
    FROM jsonb_array_elements(step1_data->'concorrentesDiretos') c
  )
)
WHERE tenant_id = 'SEU_TENANT_ID';
*/

-- ==========================================
-- ❌ NÃO RECOMENDADO: Atualização em massa
-- ==========================================
-- Não é possível buscar CEPs diretamente do Supabase.
-- Use o frontend para garantir dados corretos.

-- ==========================================
-- ✅ SOLUÇÃO RECOMENDADA:
-- ==========================================
-- 1. Vá no frontend (Etapa 1 - Cadastro de Concorrentes)
-- 2. Para cada concorrente listado:
--    - Clique em "Remover" 
--    - Digite o CNPJ novamente
--    - Sistema busca CEP/endereço automaticamente
--    - Clique "Adicionar Concorrente"
-- 3. Salve e pronto! ✅

