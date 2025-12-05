# 🚨 CORREÇÃO FINAL DEFINITIVA - SISTEMA COMPLETO

## ❌ **PROBLEMA RAIZ:**

As 54 empresas foram importadas mas **NÃO APARECEM** porque:

1. ❌ RLS bloqueando acesso à tabela `users` (erro 406)
2. ❌ `useCompanies` hook não consegue pegar `tenant_id`
3. ❌ Sem `tenant_id`, a query retorna vazio
4. ❌ Resultado: "Nenhuma empresa cadastrada"

---

## ✅ **SOLUÇÃO COMPLETA (4 Fixes):**

### **FIX 1: RLS - Tabela `users`** (URGENTE!)

Execute no Supabase:

```sql
-- Policy para usuários acessarem próprio registro
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marcos.oliveira@olvinternacional.com.br'
    )
  );
```

### **FIX 2: RLS - Tabela `companies`** (URGENTE!)

```sql
-- Policy para ver companies do próprio tenant
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Users can view companies"
  ON public.companies
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marcos.oliveira@olvinternacional.com.br'
    )
  );
```

### **FIX 3: Verificar se empresas têm `tenant_id`**

```sql
-- Ver empresas SEM tenant_id
SELECT COUNT(*) as sem_tenant
FROM companies
WHERE tenant_id IS NULL;

-- Atribuir tenant_id se estiver null
UPDATE companies
SET tenant_id = '8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71'
WHERE tenant_id IS NULL
AND created_at > NOW() - INTERVAL '24 hours';
```

### **FIX 4: Diagnosticar**

```sql
-- Ver suas empresas
SELECT 
  tenant_id,
  COUNT(*) as total,
  MAX(created_at) as ultima_importacao
FROM companies
GROUP BY tenant_id;

-- Ver se você está vinculado ao tenant
SELECT * FROM users WHERE auth_user_id = auth.uid();
```

---

## ⚡ **EXECUTE ESTE SQL COMPLETO AGORA:**

```sql
-- ============================================
-- FIX COMPLETO: RLS + DIAGNÓSTICO
-- ============================================

-- 1. Policy para tabela users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marcos.oliveira@olvinternacional.com.br'
    )
  );

-- 2. Policy para tabela companies
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Users can view companies"
  ON public.companies
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marcos.oliveira@olvinternacional.com.br'
    )
  );

-- 3. Diagnosticar
SELECT 
  '🔍 DIAGNÓSTICO:' as info,
  tenant_id,
  COUNT(*) as total_empresas,
  MAX(created_at) as ultima_importacao
FROM companies
GROUP BY tenant_id;

-- 4. Ver seu tenant
SELECT 
  '👤 SEU PERFIL:' as info,
  tenant_id,
  email,
  role
FROM users
WHERE auth_user_id = auth.uid();

-- 5. Corrigir empresas sem tenant (se houver)
UPDATE companies
SET tenant_id = (
  SELECT tenant_id FROM users 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1
)
WHERE tenant_id IS NULL
AND created_at > NOW() - INTERVAL '24 hours'
RETURNING id, cnpj, company_name;

-- ============================================
-- RESULTADO ESPERADO:
-- Após executar, suas 54 empresas devem aparecer!
-- ============================================
```

---

## 🚀 **APÓS EXECUTAR SQL:**

1. Recarregue: `Ctrl + Shift + R`
2. Vá para: `Sidebar → Base de Empresas`
3. Deve ver: **"54 de 54 empresas"**

---

**EXECUTE O SQL AGORA E ME AVISE! 🔥**

