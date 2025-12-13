-- ==========================================
-- 🔧 SOLUÇÃO FINAL: Aplicar mesma lógica que funciona em competitors
-- ==========================================
-- Baseado no fato de que competitors FUNCIONAM (8 produtos inseridos)
-- e tenant NÃO funciona (0 produtos inseridos)
-- ==========================================
--
-- ESTRATÉGIA:
-- 1. Verificar política de tenant_competitor_products (que funciona)
-- 2. Aplicar EXATAMENTE a mesma lógica em tenant_products
-- 3. NÃO remover nada que já existe
-- 4. Apenas garantir que tenant_products tenha a mesma permissão
-- ==========================================

-- PASSO 1: Verificar se tenant_competitor_products tem política FOR ALL
-- (isso explicaria por que funciona mesmo sem política INSERT específica)
SELECT 
  '🔍 POLÍTICA DE COMPETITORS (QUE FUNCIONA)' as secao,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenant_competitor_products'
ORDER BY cmd, policyname;

-- PASSO 2: Se tenant_competitor_products tem política FOR ALL que permite SERVICE_ROLE_KEY,
-- vamos criar política FOR ALL similar para tenant_products (mas não remover as existentes)

-- NOTA: Aguardar resultado do PASSO 1 antes de executar PASSO 2

