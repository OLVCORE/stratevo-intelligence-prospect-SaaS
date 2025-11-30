# 🔧 GUIA: CORRIGIR ERRO DE LOGIN

## 🚨 PROBLEMA IDENTIFICADO

**Erro no Console:**
```
[MultiTenant] Usuário não encontrado na tabela users: Could not find the table 'public.users' in the schema cache
Failed to load resource: the server responded with a status of 404 () - get_user_tenant:1
```

**Causa:** A tabela `public.users` e/ou a função `get_user_tenant()` não existem no banco de dados.

---

## ✅ SOLUÇÃO

### **PASSO 1: Executar Script SQL no Supabase**

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script: `FIX_TABELA_USERS_E_FUNCAO.sql`

**OU copie e cole este SQL:**

```sql
-- Criar tabela users se não existir
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Criar função get_user_tenant()
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

-- Permissões
REVOKE ALL ON FUNCTION public.get_user_tenant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant() TO anon;

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own record'
  ) THEN
    CREATE POLICY "Users can view own record"
      ON public.users FOR SELECT USING (auth_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own record'
  ) THEN
    CREATE POLICY "Users can insert own record"
      ON public.users FOR INSERT WITH CHECK (auth_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own record'
  ) THEN
    CREATE POLICY "Users can update own record"
      ON public.users FOR UPDATE USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());
  END IF;
END $$;
```

---

### **PASSO 2: Verificar se Foi Criado**

Execute no SQL Editor:

```sql
-- Verificar tabela
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS tabela_users_existe;

-- Verificar função
SELECT EXISTS (
  SELECT FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname = 'get_user_tenant'
) AS funcao_get_user_tenant_existe;
```

**Resultado esperado:**
- `tabela_users_existe`: `true`
- `funcao_get_user_tenant_existe`: `true`

---

### **PASSO 3: Testar Login Novamente**

1. Recarregue a página (`Ctrl+R` ou `F5`)
2. Faça login novamente
3. Verifique se não há mais erros no console

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### **Verificar se a tabela tenants existe:**

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tenants'
) AS tabela_tenants_existe;
```

Se retornar `false`, você precisa executar as migrations principais primeiro.

---

## 📋 CHECKLIST

- [ ] Executei o script SQL no Supabase
- [ ] Tabela `public.users` foi criada
- [ ] Função `get_user_tenant()` foi criada
- [ ] RLS policies foram criadas
- [ ] Recarreguei a página
- [ ] Testei login novamente
- [ ] Não há mais erros no console

---

## 🚨 SE AINDA NÃO FUNCIONAR

### **Verificar se o usuário está no Supabase Auth:**

1. No Supabase Dashboard, vá em **Authentication** → **Users**
2. Verifique se seu email está listado
3. Se não estiver, crie uma conta nova

### **Verificar logs do Supabase:**

1. No Supabase Dashboard, vá em **Logs** → **Postgres Logs**
2. Procure por erros relacionados a `users` ou `get_user_tenant`

### **Limpar cache do navegador:**

1. Abra DevTools (`F12`)
2. Clique com botão direito no botão de recarregar
3. Selecione "Limpar cache e recarregar forçadamente"

---

**Última atualização:** 2025-01-19  
**Status:** 🔧 Correção de Erro

