# ✅ SOLUÇÃO: Acesso ao Onboarding

## 📋 SITUAÇÃO ATUAL

- ✅ Função `get_user_tenant()` existe e funciona
- ✅ Retorna `null` porque você ainda não completou o onboarding
- ✅ Isso é **NORMAL e ESPERADO**

## 🎯 PRÓXIMOS PASSOS

### **1. Verificar Diagnóstico**

Execute no Supabase SQL Editor: `DIAGNOSTICO_USUARIO_ATUAL.sql`

**Resultado esperado:**
- ✅ `user_id`: Seu UUID do Supabase Auth
- ✅ `email`: Seu email
- ✅ `Registro em public.users`: **VAZIO** (normal, ainda não completou onboarding)
- ✅ `get_user_tenant()`: `null` (normal)

---

### **2. Acessar Onboarding Diretamente**

**Opção A: Via URL direta**
```
http://localhost:5173/tenant-onboarding
```

**Opção B: Via Login**
1. Acesse: `http://localhost:5173/login`
2. Faça login
3. O sistema deve redirecionar automaticamente para `/tenant-onboarding`

---

### **3. Se NÃO Conseguir Acessar**

#### **Problema: Redirecionamento em loop**

**Sintomas:**
- Login funciona
- Mas redireciona para `/login` novamente
- Não consegue acessar `/tenant-onboarding`

**Solução:**

1. **Limpar cache do navegador** (`Ctrl + Shift + Delete`)
2. **Verificar console** (F12) para erros
3. **Verificar se a rota está protegida incorretamente**

Execute este SQL para criar um registro temporário (apenas para teste):

```sql
-- ⚠️ ATENÇÃO: Execute apenas se você já tem um tenant criado
-- Substitua 'SEU_TENANT_ID_AQUI' pelo ID do tenant que você criou

INSERT INTO public.users (
  email,
  nome,
  tenant_id,
  auth_user_id,
  role
)
VALUES (
  auth.email(),
  'Usuário Teste',
  'SEU_TENANT_ID_AQUI'::uuid, -- ⚠️ SUBSTITUA AQUI
  auth.uid(),
  'OWNER'
)
ON CONFLICT (auth_user_id) DO NOTHING;
```

---

### **4. Fluxo Correto Esperado**

```
1. Login → ✅ Autenticado
2. TenantGuard verifica tenant → ❌ Não encontrado (null)
3. TenantGuard redireciona → ✅ /tenant-onboarding
4. Usuário completa onboarding → ✅ Cria tenant + registro em users
5. TenantGuard verifica tenant → ✅ Encontrado
6. TenantGuard permite acesso → ✅ /dashboard
```

---

### **5. Verificar Se Onboarding Está Funcionando**

1. Acesse `/tenant-onboarding`
2. Preencha o Step 1 (Dados Básicos)
3. Clique em "Próximo"
4. Continue até completar todos os 5 steps
5. Ao finalizar, o sistema deve:
   - ✅ Criar registro em `public.users`
   - ✅ Vincular ao tenant criado
   - ✅ Redirecionar para `/dashboard`

---

## 🚨 SE AINDA HOUVER PROBLEMAS

### **Erro: "Cannot access /tenant-onboarding"**

**Verificar:**
1. Rota está definida em `App.tsx`?
2. `TenantGuard` permite acesso a `/tenant-onboarding`?
3. Console mostra algum erro específico?

### **Erro: "Failed to insert user"**

**Verificar:**
1. Políticas RLS permitem INSERT?
2. `auth_user_id` está correto?
3. Tenant foi criado antes de tentar inserir user?

---

## ✅ TESTE FINAL

Após completar o onboarding:

```sql
-- Verificar se registro foi criado
SELECT * FROM public.users WHERE auth_user_id = auth.uid();

-- Verificar tenant vinculado
SELECT 
  u.email,
  u.nome,
  t.nome AS tenant_nome,
  t.cnpj,
  t.status
FROM public.users u
JOIN public.tenants t ON t.id = u.tenant_id
WHERE u.auth_user_id = auth.uid();
```

**Resultado esperado:**
- ✅ 1 registro em `users`
- ✅ Tenant vinculado corretamente
- ✅ `get_user_tenant()` retorna o `tenant_id`

---

**Status:** ✅ Pronto para testar acesso ao onboarding

