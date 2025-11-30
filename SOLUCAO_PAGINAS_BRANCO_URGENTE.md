# 🚨 SOLUÇÃO URGENTE: PÁGINAS EM BRANCO

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. SERVIDOR DE DESENVOLVIMENTO NÃO ESTÁ RODANDO
**Erro:** `ERR_CONNECTION_REFUSED` na porta 5173

**Solução:**
```powershell
npm run dev
```

### 2. ERRO 400 NAS QUERIES DO SUPABASE
**Erro:** `Failed to load resource: the server responded with a status of 400`

**Causa:** 
- PostgREST não recarregou o schema após as migrations
- Ou a tabela `leads` não tem a coluna `deleted_at` exposta corretamente

**Solução:**
1. Recarregar schema do PostgREST no Supabase Dashboard
2. Verificar se todas as migrations foram aplicadas

---

## ✅ CORREÇÕES NECESSÁRIAS

### 1. INICIAR SERVIDOR DE DESENVOLVIMENTO

Execute no terminal:
```powershell
npm run dev
```

Isso iniciará o servidor Vite na porta 5173.

### 2. RECARREGAR SCHEMA DO POSTGREST

No Supabase Dashboard:
1. Vá para **Settings** → **API**
2. Role até **PostgREST**
3. Clique em **Reload Schema** ou **Refresh Schema**

**OU** execute no SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

### 3. VERIFICAR MIGRATIONS APLICADAS

No Supabase Dashboard:
1. Vá para **Database** → **Migrations**
2. Verifique se todas as migrations do CRM foram aplicadas:
   - `20250122000000_crm_multi_tenant_base.sql`
   - `20250122000001_crm_multi_tenant_tables.sql`
   - `20250122000002_business_model_configs.sql`
   - `20250122000003_add_crm_fields_to_tenants.sql`
   - `20250122000004_crm_complete_olinda_replica.sql`
   - `20250122000005_setup_admin_user.sql`
   - `20250122000006_crm_automations_infrastructure.sql`
   - `20250122000007_crm_email_tracking.sql`
   - `20250122000008_crm_sdr_integration.sql`
   - `20250122000009_ciclo3_complete_integration.sql`
   - `20250122000010_ciclo5_propostas_profissionais.sql`
   - `20250122000011_ciclo6_workflows_visuais_integracao.sql`

### 4. REGENERAR TIPOS DO SUPABASE

Após recarregar o schema:
```powershell
npx supabase gen types typescript --project-id vkdvezuivlovzqxmnohk > src/integrations/supabase/database.types.ts
```

---

## 🔍 VERIFICAÇÃO RÁPIDA

### Verificar se tabela `leads` existe:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public';
```

### Verificar se função `get_current_tenant_id` existe:
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'get_current_tenant_id';
```

### Verificar RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'leads';
```

---

## 📋 CHECKLIST DE CORREÇÃO

- [ ] **1. Iniciar servidor de desenvolvimento** (`npm run dev`)
- [ ] **2. Recarregar schema do PostgREST** (Dashboard ou `NOTIFY pgrst`)
- [ ] **3. Verificar migrations aplicadas** (Dashboard)
- [ ] **4. Regenerar tipos do Supabase** (comando acima)
- [ ] **5. Recarregar página no navegador** (Ctrl+R ou F5)
- [ ] **6. Verificar console do navegador** para erros específicos

---

## 🎯 ORDEM DE EXECUÇÃO

1. **PRIMEIRO:** Iniciar servidor (`npm run dev`)
2. **SEGUNDO:** Recarregar schema do PostgREST
3. **TERCEIRO:** Regenerar tipos do Supabase
4. **QUARTO:** Recarregar página no navegador

---

**Status:** ⚠️ AGUARDANDO AÇÕES DO USUÁRIO

