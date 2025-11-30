# 🔧 CORREÇÃO COMPLETA: PÁGINAS EM BRANCO DO CRM

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. SERVIDOR DE DESENVOLVIMENTO NÃO ESTÁ RODANDO ⚠️
**Erro:** `ERR_CONNECTION_REFUSED` na porta 5173

**Sintoma:** 
- Todas as requisições para `:5173/` falham
- Páginas não carregam
- Arquivos TypeScript não são servidos

**Solução:**
```powershell
npm run dev
```

Isso iniciará o servidor Vite na porta 5173.

---

### 2. ERRO 400 NAS QUERIES DO SUPABASE ⚠️
**Erro:** `Failed to load resource: the server responded with a status of 400`

**Queries que estão falhando:**
- `GET /rest/v1/leads?select=*&tenant_id=eq.xxx&deleted_at=is.null`
- `GET /rest/v1/leads?select=*&tenant_id=eq.xxx&status=neq.novo`
- `GET /rest/v1/leads?select=*&tenant_id=eq.xxx&status=eq.ganho`

**Possíveis causas:**
1. PostgREST não recarregou o schema após migrations
2. Tabela `leads` não está exposta corretamente
3. RLS policies estão bloqueando acesso
4. Função `get_current_tenant_id()` não está funcionando

---

## ✅ SOLUÇÕES PASSO A PASSO

### PASSO 1: INICIAR SERVIDOR DE DESENVOLVIMENTO

**Execute no terminal:**
```powershell
npm run dev
```

**Aguarde até ver:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### PASSO 2: RECARREGAR SCHEMA DO POSTGREST

**Opção A - Via SQL Editor (Recomendado):**
```sql
NOTIFY pgrst, 'reload schema';
```

**Opção B - Via Dashboard:**
1. Acesse Supabase Dashboard
2. Vá para **Settings** → **API**
3. Role até **PostgREST**
4. Clique em **Reload Schema** ou **Refresh Schema**

---

### PASSO 3: VERIFICAR SE TABELA `leads` EXISTE

**Execute no SQL Editor:**
```sql
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Verifique se estas colunas existem:**
- ✅ `id`
- ✅ `tenant_id`
- ✅ `name`
- ✅ `email`
- ✅ `phone`
- ✅ `status`
- ✅ `deleted_at`
- ✅ `created_at`
- ✅ `updated_at`

---

### PASSO 4: VERIFICAR FUNÇÃO `get_current_tenant_id`

**Execute no SQL Editor:**
```sql
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'get_current_tenant_id';
```

**Se não existir, execute:**
```sql
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$;
```

---

### PASSO 5: VERIFICAR RLS POLICIES

**Execute no SQL Editor:**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'leads';
```

**Verifique se existem policies para:**
- SELECT
- INSERT
- UPDATE
- DELETE

---

### PASSO 6: REGENERAR TIPOS DO SUPABASE

**Execute no terminal:**
```powershell
npx supabase gen types typescript --project-id vkdvezuivlovzqxmnohk > src/integrations/supabase/database.types.ts
```

---

### PASSO 7: TESTAR QUERY MANUALMENTE

**Execute no SQL Editor:**
```sql
-- Substitua o tenant_id pelo seu tenant_id real
SELECT * 
FROM public.leads 
WHERE tenant_id = '0bc75a60-7f19-4228-a0ca-c4e627a0f739'
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Se esta query funcionar, o problema é com PostgREST/RLS.**

---

## 🔍 DIAGNÓSTICO ADICIONAL

### Se o servidor estiver rodando mas páginas ainda em branco:

1. **Verifique Console do Navegador:**
   - Abra DevTools (F12)
   - Vá para Console
   - Procure por erros específicos

2. **Verifique Network Tab:**
   - Veja quais requisições estão falhando
   - Verifique status codes (400, 401, 403, 500)

3. **Verifique se migrations foram aplicadas:**
   - Dashboard → Database → Migrations
   - Todas as migrations do CRM devem estar aplicadas

---

## 📋 CHECKLIST COMPLETO

- [ ] **1. Servidor de desenvolvimento rodando** (`npm run dev`)
- [ ] **2. Schema do PostgREST recarregado** (`NOTIFY pgrst`)
- [ ] **3. Tabela `leads` existe e tem todas as colunas**
- [ ] **4. Função `get_current_tenant_id()` existe**
- [ ] **5. RLS policies estão corretas**
- [ ] **6. Tipos do Supabase regenerados**
- [ ] **7. Query manual funciona no SQL Editor**
- [ ] **8. Página recarregada no navegador** (Ctrl+R)

---

## 🎯 ORDEM DE EXECUÇÃO CRÍTICA

1. **PRIMEIRO:** `npm run dev` ← **FAÇA ISSO AGORA**
2. **SEGUNDO:** Recarregar schema (`NOTIFY pgrst`)
3. **TERCEIRO:** Verificar tabela `leads` existe
4. **QUARTO:** Regenerar tipos
5. **QUINTO:** Recarregar página

---

**Status:** ⚠️ **SERVIDOR NÃO ESTÁ RODANDO** - Execute `npm run dev` primeiro!

