-- =====================================================
-- PASSO 1: LISTAR TENANTS DISPONÍVEIS
-- =====================================================
-- Execute esta query PRIMEIRO para ver os tenants disponíveis
-- Depois copie o UUID do tenant que você quer verificar
-- =====================================================

SELECT 
  id as tenant_id,
  nome,
  cnpj,
  created_at,
  'Copie este UUID para usar no script de verificação' as instrucao
FROM public.tenants
ORDER BY created_at DESC;

