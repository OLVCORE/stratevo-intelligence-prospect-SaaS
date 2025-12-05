-- ============================================
-- ENCONTRAR AS 54 EMPRESAS - EXECUÇÃO RÁPIDA
-- ============================================

-- 1. POLICY USERS (resolver erro 406)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- 2. POLICY COMPANIES (mostrar empresas)
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Users can view companies"
  ON public.companies
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- 3. DIAGNOSTICAR
SELECT tenant_id, COUNT(*) as total
FROM companies
GROUP BY tenant_id;

SELECT * FROM users WHERE auth_user_id = auth.uid();

-- ============================================
-- EXECUTE E RECARREGUE A PÁGINA
-- ============================================

