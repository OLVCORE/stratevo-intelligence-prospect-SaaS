# 🔧 SOLUÇÃO: Erro 404 no Login

## 🚨 PROBLEMA IDENTIFICADO

Os erros 404 indicam que:
1. ❌ Função `get_user_tenant()` não está acessível via RPC
2. ❌ Tabela `users` não existe ou não está acessível

## ✅ SOLUÇÃO IMEDIATA

### **PASSO 1: Execute o Script SQL de Correção**

Execute no Supabase SQL Editor: `CORRIGIR_RPC_GET_USER_TENANT.sql`

Este script vai:
- ✅ Remover função antiga (se existir)
- ✅ Recriar função com permissões corretas
- ✅ Garantir acesso via RPC
- ✅ Verificar se tudo está funcionando

---

### **PASSO 2: Execute o Script de Verificação Completa**

Execute no Supabase SQL Editor: `VERIFICAR_E_CORRIGIR_USERS_COMPLETO.sql`

Este script vai:
- ✅ Criar tabela `users` (se não existir)
- ✅ Criar função `get_user_tenant()` (se não existir)
- ✅ Criar índices necessários
- ✅ Configurar RLS policies
- ✅ Verificar tudo

---

### **PASSO 3: Limpar Cache do Navegador**

1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cache" e "Cookies"
3. Limpar dados
4. OU: `Ctrl + Shift + R` para recarregar forçadamente

---

### **PASSO 4: Testar Login Novamente**

1. Acesse: `http://localhost:5173/login`
2. Faça login com email e senha
3. Abra o Console (F12) e verifique:
   - ✅ **NÃO deve aparecer mais** erro 404
   - ✅ Deve aparecer: `[MultiTenant] Usuário não tem tenant associado` (normal)
   - ✅ Deve redirecionar para `/tenant-onboarding`

---

## 🔍 VERIFICAÇÃO MANUAL

Execute no Supabase SQL Editor para verificar:

```sql
-- 1. Verificar se tabela existe
SELECT COUNT(*) FROM public.users;

-- 2. Verificar se função existe
SELECT 
  proname AS function_name,
  pronargs AS num_args,
  prorettype::regtype AS return_type
FROM pg_proc
WHERE proname = 'get_user_tenant'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verificar permissões da função
SELECT 
  p.proname,
  r.rolname,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'get_user_tenant'
AND r.rolname IN ('authenticated', 'anon')
AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Resultado esperado:**
- ✅ `COUNT(*)` retorna 0 (tabela existe, mas vazia - normal)
- ✅ Função existe com 0 argumentos e retorna UUID
- ✅ `can_execute` = `true` para `authenticated` e `anon`

---

## 🚨 SE AINDA HOUVER ERRO 404

### **Cenário A: Função ainda não existe**

Execute apenas esta parte do script:

```sql
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon;
```

### **Cenário B: Tabela ainda não existe**

Execute apenas esta parte do script:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  auth_user_id UUID UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

## ✅ RESULTADO ESPERADO APÓS CORREÇÃO

Após executar os scripts:

1. ✅ Login funciona sem erros 404
2. ✅ Console mostra: `[MultiTenant] Usuário não tem tenant associado` (normal)
3. ✅ Redirecionamento para `/tenant-onboarding`
4. ✅ Onboarding acessível e funcional

---

**Status:** 🔧 Execute os scripts SQL acima para corrigir

