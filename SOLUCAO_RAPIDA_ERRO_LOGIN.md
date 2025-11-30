# ⚡ SOLUÇÃO RÁPIDA: ERRO DE LOGIN

## 🚨 PROBLEMA

**Erro no Console:**
```
Could not find the table 'public.users' in the schema cache
Failed to load resource: 404 - get_user_tenant
```

**Causa:** A tabela `public.users` não existe no banco de dados.

---

## ✅ SOLUÇÃO EM 2 PASSOS

### **PASSO 1: Executar SQL no Supabase** (OBRIGATÓRIO)

1. Acesse: **Supabase Dashboard** → **SQL Editor**
2. Execute o arquivo: `FIX_TABELA_USERS_E_FUNCAO.sql`

**OU copie e cole este SQL:**

```sql
-- Criar tabela users
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

### **PASSO 2: Recarregar a Página**

1. Feche todas as abas do `localhost:5173`
2. Abra novamente: `http://localhost:5173/login`
3. Faça login novamente

---

## ✅ RESULTADO ESPERADO

Após executar o SQL:
- ✅ Login funciona normalmente
- ✅ Se não tiver tenant → Redireciona para `/tenant-onboarding`
- ✅ Se tiver tenant → Redireciona para `/dashboard`
- ✅ Não há mais erros no console

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor:

```sql
-- Verificar tabela
SELECT COUNT(*) FROM public.users;

-- Verificar função
SELECT get_user_tenant();
```

Se retornar números (não erro), está funcionando!

---

**IMPORTANTE:** Execute o SQL primeiro antes de tentar fazer login novamente!

