# 🔧 COMO EXECUTAR FIX DO RLS (Row Level Security)

## 🎯 **PROBLEMA**

**Erro 406:** PostgreSQL RLS está bloqueando acesso ao ICP, mesmo você sendo o desenvolvedor.

**Causa:** Você não está vinculado ao tenant onde o ICP foi criado na tabela `users`.

---

## ✅ **SOLUÇÃO RÁPIDA (3 Passos)**

### **Passo 1: Abrir Supabase SQL Editor**

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql
2. Clique em **"New Query"**

### **Passo 2: Executar o Fix**

Copie e cole este SQL completo:

```sql
-- FIX RÁPIDO: Policy permissiva para desenvolvedor
DROP POLICY IF EXISTS "DEV: All authenticated users can view all ICPs" ON public.icp_profiles_metadata;
CREATE POLICY "DEV: All authenticated users can view all ICPs"
  ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    -- Permite acesso a QUALQUER ICP se estiver autenticado
    auth.uid() IS NOT NULL
  );
```

### **Passo 3: Recarregar Página**

```
Ctrl + Shift + R (Windows)
ou
Cmd + Shift + R (Mac)
```

---

## 🎯 **ALTERNATIVA: Fix Específico (Recomendado para Produção)**

Se quiser uma solução mais segura (apenas você como desenvolvedor):

```sql
-- Policy para usuário específico (desenvolvedor)
DROP POLICY IF EXISTS "Developer can view all ICPs" ON public.icp_profiles_metadata;
CREATE POLICY "Developer can view all ICPs"
  ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    -- Permite acesso se:
    -- 1. Usuário está vinculado ao tenant (regra normal)
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
    OR
    -- 2. OU é o desenvolvedor específico
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND email = 'marcos.oliveira@olvinternacional.com.br'
    )
  );
```

---

## 📊 **DIAGNÓSTICO: Por Que Está Bloqueando?**

Execute este SQL para diagnosticar:

```sql
-- Ver seu usuário e tenants vinculados
SELECT 
  u.id,
  u.email,
  u.tenant_id,
  u.role,
  t.company_name as tenant_nome
FROM public.users u
LEFT JOIN public.tenants t ON t.id = u.tenant_id
WHERE u.auth_user_id = auth.uid();

-- Ver todos os ICPs
SELECT 
  id,
  nome,
  tenant_id,
  tipo,
  icp_principal,
  ativo,
  created_at
FROM public.icp_profiles_metadata
ORDER BY created_at DESC;

-- Ver se você está vinculado ao tenant do ICP problemático
SELECT 
  icp.id as icp_id,
  icp.nome as icp_nome,
  icp.tenant_id as icp_tenant,
  u.tenant_id as user_tenant,
  CASE 
    WHEN u.tenant_id = icp.tenant_id THEN '✅ VINCULADO'
    ELSE '❌ NÃO VINCULADO'
  END as status
FROM public.icp_profiles_metadata icp
CROSS JOIN (
  SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
) u
WHERE icp.id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb';
```

---

## 🔧 **SOLUÇÃO DEFINITIVA: Vincular ao Tenant**

Se o diagnóstico mostrar que você NÃO está vinculado ao tenant do ICP:

```sql
-- Vincular seu usuário ao tenant do ICP
INSERT INTO public.users (auth_user_id, tenant_id, email, role)
SELECT 
  auth.uid(),
  tenant_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'OWNER'
FROM public.icp_profiles_metadata
WHERE id = 'e33e7d01-2c05-4040-9738-f19ef47d9acb'
ON CONFLICT (auth_user_id, tenant_id) DO NOTHING;
```

---

## 🚨 **IMPORTANTE: RLS em Produção**

### **Para Desenvolvimento/Testes:**
✅ Use a policy permissiva (todos autenticados)

### **Para Produção:**
❌ **NÃO** use a policy permissiva  
✅ Use apenas a policy específica para developers  
✅ Ou vincule usuários aos tenants corretos

---

## 📋 **CHECKLIST**

- [ ] 1. Abri Supabase SQL Editor
- [ ] 2. Executei o FIX SQL
- [ ] 3. Recarreguei a página (Ctrl+Shift+R)
- [ ] 4. Testei acessar o ICP
- [ ] 5. ✅ Funcionou!

---

## ❓ **AINDA NÃO FUNCIONOU?**

Execute o diagnóstico completo:

```sql
-- Script completo de diagnóstico
DO $$
DECLARE
  v_user_id UUID := auth.uid();
  v_icp_id UUID := 'e33e7d01-2c05-4040-9738-f19ef47d9acb';
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETO DO RLS';
  RAISE NOTICE '===========================================';
  
  -- 1. Verificar usuário
  RAISE NOTICE '1. USUÁRIO AUTENTICADO:';
  RAISE NOTICE '   ID: %', v_user_id;
  
  -- 2. Verificar tenants
  RAISE NOTICE '';
  RAISE NOTICE '2. TENANTS VINCULADOS:';
  FOR rec IN 
    SELECT tenant_id FROM public.users WHERE auth_user_id = v_user_id
  LOOP
    RAISE NOTICE '   - %', rec.tenant_id;
  END LOOP;
  
  -- 3. Verificar ICP
  RAISE NOTICE '';
  RAISE NOTICE '3. ICP ALVO:';
  FOR rec IN 
    SELECT tenant_id, nome FROM public.icp_profiles_metadata WHERE id = v_icp_id
  LOOP
    RAISE NOTICE '   Tenant: %', rec.tenant_id;
    RAISE NOTICE '   Nome: %', rec.nome;
  END LOOP;
  
  -- 4. Verificar vínculo
  RAISE NOTICE '';
  RAISE NOTICE '4. STATUS DO VÍNCULO:';
  IF EXISTS (
    SELECT 1 
    FROM public.icp_profiles_metadata icp
    INNER JOIN public.users u ON u.tenant_id = icp.tenant_id
    WHERE icp.id = v_icp_id AND u.auth_user_id = v_user_id
  ) THEN
    RAISE NOTICE '   ✅ Você ESTÁ vinculado ao tenant do ICP';
  ELSE
    RAISE NOTICE '   ❌ Você NÃO está vinculado ao tenant do ICP';
    RAISE NOTICE '   💡 Execute o comando de vínculo no guia!';
  END IF;
  
  -- 5. Verificar policies
  RAISE NOTICE '';
  RAISE NOTICE '5. POLICIES ATIVAS:';
  FOR rec IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'icp_profiles_metadata'
  LOOP
    RAISE NOTICE '   - %', rec.policyname;
  END LOOP;
  
  RAISE NOTICE '===========================================';
END $$;
```

---

## 🎉 **RESULTADO ESPERADO**

Após executar o fix, você deve conseguir:

✅ Acessar `/central-icp/profile/e33e7d01-2c05-4040-9738-f19ef47d9acb`  
✅ Ver todos os dados do ICP  
✅ Ver todas as inteligências criadas  
✅ Navegar entre os steps normalmente  

---

## 📞 **RESUMO**

**Problema:** RLS bloqueando acesso ao ICP  
**Causa:** Usuário não vinculado ao tenant  
**Solução:** Policy permissiva ou vínculo direto  

**Execute o fix agora e teste! 🚀**

