# 🚨 CORREÇÃO URGENTE - CRIAR E DELETAR TENANTS

## ⚠️ PROBLEMA IDENTIFICADO

A migration `20250216000001_fix_rls_recursion_and_missing_rpc.sql` **NÃO criou políticas RLS para INSERT e DELETE** na tabela `tenants`.

**Resultado:** Não é possível criar nem deletar tenants!

---

## ✅ SOLUÇÃO

Criei a migration `20250217000001_fix_tenant_insert_delete_policies.sql` que adiciona:

1. ✅ Política **INSERT** - Permite usuários autenticados criarem tenants
2. ✅ Política **DELETE** - Permite OWNER/ADMIN deletarem seus tenants
3. ✅ Função `create_tenant_direct()` - Garantida e com permissões
4. ✅ Função `soft_delete_tenant()` - Garantida e com permissões

---

## 📋 PASSO A PASSO PARA APLICAR

### **PASSO 1: Abrir Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione o projeto: **stratevo-intelligence-prospect**

### **PASSO 2: Abrir SQL Editor**
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** (canto superior direito)

### **PASSO 3: Copiar e Colar Migration**
1. Abra o arquivo: `supabase/migrations/20250217000001_fix_tenant_insert_delete_policies.sql`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor do Supabase (Ctrl+V)

### **PASSO 4: Executar**
1. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
2. Aguarde a execução completar
3. Verifique se apareceu "Success" (sem erros)

---

## ✅ VERIFICAÇÃO

Após aplicar, execute no SQL Editor:

```sql
-- Verificar políticas RLS da tabela tenants
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tenants'
ORDER BY policyname;
```

**Deve mostrar 4 políticas:**
1. `tenants_select_user_tenants` (SELECT)
2. `tenants_update_user_tenants` (UPDATE)
3. `tenants_insert_user_tenants` (INSERT) ← **NOVA**
4. `tenants_delete_user_tenants` (DELETE) ← **NOVA**

---

## 🧪 TESTE

Após aplicar a migration:

1. **Testar Criação:**
   - Acesse `/tenant-onboarding` ou `/my-companies`
   - Tente criar uma nova empresa
   - Deve funcionar agora!

2. **Testar Deleção:**
   - Acesse `/my-companies`
   - Tente deletar uma empresa
   - Deve funcionar agora!

---

## 🔍 SE AINDA NÃO FUNCIONAR

Se mesmo após aplicar a migration ainda não funcionar, execute:

```sql
-- Verificar se funções RPC existem
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_tenant_direct', 'soft_delete_tenant', 'get_user_tenant_ids')
ORDER BY routine_name;
```

**Deve mostrar as 3 funções.** Se alguma estiver faltando, me avise!

