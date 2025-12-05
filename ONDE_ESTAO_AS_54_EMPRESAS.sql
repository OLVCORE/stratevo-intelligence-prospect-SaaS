-- ============================================
-- DIAGNÓSTICO: Onde estão as 54 empresas?
-- ============================================

-- 1. Contar empresas por tenant
SELECT 
  tenant_id,
  COUNT(*) as total_empresas,
  MIN(created_at) as primeira_importacao,
  MAX(created_at) as ultima_importacao
FROM public.companies
GROUP BY tenant_id
ORDER BY total_empresas DESC;

-- 2. Ver as 54 empresas mais recentes (provavelmente são as que você importou)
SELECT 
  id,
  cnpj,
  company_name,
  tenant_id,
  source_name,
  created_at
FROM public.companies
ORDER BY created_at DESC
LIMIT 54;

-- 3. Ver empresas importadas nas últimas 24 horas
SELECT 
  tenant_id,
  COUNT(*) as empresas_hoje,
  MIN(created_at) as primeira,
  MAX(created_at) as ultima
FROM public.companies
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY tenant_id;

-- 4. Ver qual é o seu tenant preferido
SELECT 
  u.tenant_id,
  u.email,
  u.role,
  t.company_name as nome_tenant
FROM public.users u
LEFT JOIN public.tenants t ON t.id = u.tenant_id
WHERE u.auth_user_id = auth.uid();

-- 5. DIAGNÓSTICO COMPLETO
DO $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_count INTEGER;
  v_companies_count INTEGER;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DIAGNÓSTICO: Onde estão as 54 empresas?';
  RAISE NOTICE '===========================================';
  
  -- Contar tenants do usuário
  SELECT COUNT(*) INTO v_tenant_count
  FROM public.users
  WHERE auth_user_id = v_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '👤 SEU PERFIL:';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Tenants vinculados: %', v_tenant_count;
  
  -- Mostrar empresas por tenant
  RAISE NOTICE '';
  RAISE NOTICE '📊 EMPRESAS POR TENANT:';
  FOR rec IN 
    SELECT 
      u.tenant_id,
      t.company_name as tenant_nome,
      COUNT(c.id) as total_empresas,
      MAX(c.created_at) as ultima_importacao
    FROM public.users u
    LEFT JOIN public.tenants t ON t.id = u.tenant_id
    LEFT JOIN public.companies c ON c.tenant_id = u.tenant_id
    WHERE u.auth_user_id = v_user_id
    GROUP BY u.tenant_id, t.company_name
  LOOP
    RAISE NOTICE '   Tenant: % (%) - % empresas - Última: %', 
      rec.tenant_id, 
      rec.tenant_nome, 
      rec.total_empresas,
      rec.ultima_importacao;
  END LOOP;
  
  -- Total geral
  SELECT COUNT(*) INTO v_companies_count
  FROM public.companies c
  INNER JOIN public.users u ON u.tenant_id = c.tenant_id
  WHERE u.auth_user_id = v_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 TOTAL ACESSÍVEL: % empresas', v_companies_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- RESULTADO ESPERADO:
-- Você verá exatamente:
-- - Quantos tenants você tem
-- - Quantas empresas em cada tenant
-- - Onde estão as 54 empresas importadas
-- ============================================

