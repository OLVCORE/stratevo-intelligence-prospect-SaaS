-- ==========================================
-- 🔧 APLICAR MESMA LÓGICA QUE FUNCIONA EM COMPETITORS PARA TENANT
-- ==========================================
-- Se tenant_competitor_products funciona, vamos verificar sua política
-- e aplicar a mesma lógica em tenant_products
-- ==========================================
--
-- ⚠️ IMPORTANTE: Execute COMPARAR_POLITICAS_TENANT_VS_COMPETITOR.sql PRIMEIRO
-- para ver a diferença entre as políticas
-- ==========================================

-- 1. Verificar se tenant_competitor_products tem política que permite SERVICE_ROLE_KEY
-- Se tiver, vamos copiar a mesma lógica para tenant_products

-- 2. Se tenant_competitor_products NÃO tem política que permite SERVICE_ROLE_KEY,
-- mas funciona, significa que a política antiga ainda está lá e funciona
-- Nesse caso, vamos verificar qual política está ativa

-- 3. Aplicar correção baseada no que funciona em competitors
-- (aguardar resultado da comparação primeiro)

SELECT 
  '⏳ AGUARDANDO COMPARAÇÃO' as status,
  'Execute COMPARAR_POLITICAS_TENANT_VS_COMPETITOR.sql primeiro' as instrucao;

