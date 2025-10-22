# 🧪 CICLO 11 - TESTE DE MESA: Governança & Multilocação

## 📋 PRÉ-REQUISITOS

1. ✅ Banco com dados dos Ciclos 1-10
2. ✅ ENV configurado (sem novas variáveis necessárias)
3. ✅ SQL migrations 010 e 010b executadas
4. ✅ Pelo menos 2 tenants criados (OLV, Cliente Demo)
5. ✅ Você como admin em ambos os tenants

---

## 🧪 TESTE 1: Criar Tenants

### Executar no Supabase SQL Editor:

```sql
-- Migration 010b já cria, mas pode adicionar mais:
INSERT INTO public.tenants (name) 
VALUES ('Empresa Teste') 
RETURNING id;
```

### Resultado Esperado:
✅ Tenant criado com UUID  
✅ Índice único em LOWER(name) previne duplicatas  

---

## 🧪 TESTE 2: Adicionar Membership

### Executar no Supabase:

```sql
-- 1. Descobrir seu user_id
SELECT id, email FROM auth.users LIMIT 5;

-- 2. Adicionar como admin no tenant
INSERT INTO public.tenant_members (tenant_id, user_id, role)
VALUES (
  (SELECT id FROM tenants WHERE name = 'OLV'),
  '<SEU_USER_ID>',
  'admin'
);
```

### Resultado Esperado:
✅ Membership criado  
✅ Constraint PK (tenant_id, user_id) previne duplicatas  

---

## 🧪 TESTE 3: API - Listar Tenants

### Entrada:
```bash
GET http://localhost:3000/api/tenants/list
```

### Resultado Esperado:
✅ Status: 200  
✅ Response:
```json
{
  "ok": true,
  "items": [
    { "id": "uuid-1", "name": "Cliente Demo" },
    { "id": "uuid-2", "name": "OLV" }
  ]
}
```

✅ Ordenado por name (alfabético)  

---

## 🧪 TESTE 4: API - Workspace Atual (GET)

### Entrada:
```bash
GET http://localhost:3000/api/workspaces/current
```

### Resultado Esperado (primeira vez):
✅ Status: 200  
✅ Response: `{ "ok": true, "tenantId": null }`  

---

## 🧪 TESTE 5: API - Definir Workspace (POST)

### Entrada:
```bash
POST http://localhost:3000/api/workspaces/current
Content-Type: application/json

{
  "tenantId": "{{UUID_TENANT_OLV}}"
}
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true, "tenantId": "uuid..." }`  
✅ Cookie `olv.activeTenant` definido (ver em DevTools → Application → Cookies)  

### Validar Cookie:
✅ Name: `olv.activeTenant`  
✅ Value: UUID do tenant  
✅ HttpOnly: true  
✅ SameSite: Lax  
✅ Path: `/`  

---

## 🧪 TESTE 6: Workspace Switcher UI

### Entrada:
```
http://localhost:3000
```

### Resultado Esperado:
✅ Header mostra "Workspace:" + dropdown/texto  
✅ Dropdown lista tenants (OLV, Cliente Demo)  
✅ Mostra tenant atual selecionado  

### Trocar Workspace:
1. Selecionar "Cliente Demo" no dropdown
2. Página recarrega (router.refresh())
✅ Switcher atualiza para "Cliente Demo"  
✅ Company Context limpo (se implementado)  

---

## 🧪 TESTE 7: Isolamento de Dados

### Preparação:
1. Workspace = "OLV"
2. Criar empresa "Empresa A" via SearchHub
3. Trocar para workspace "Cliente Demo"
4. Criar empresa "Empresa B"

### Validação no Banco:
```sql
-- Ver tenant_id das empresas
SELECT id, name, tenant_id FROM companies ORDER BY created_at DESC LIMIT 5;
```

✅ "Empresa A" tem `tenant_id` = UUID do OLV  
✅ "Empresa B" tem `tenant_id` = UUID do Cliente Demo  

### Validação na UI:
1. Workspace = "OLV" → `/companies`
✅ Mostra apenas "Empresa A"  

2. Workspace = "Cliente Demo" → `/companies`
✅ Mostra apenas "Empresa B"  

**ISOLAMENTO COMPLETO!** ✓

---

## 🧪 TESTE 8: RLS - SELECT (Client-Side)

### Preparação:
1. Criar script para testar via anon key (client)

```ts
// Teste client-side (browser)
import { supabaseBrowser } from '@/lib/supabase/browser';

const { data } = await supabaseBrowser.from("companies").select("*");
console.log(data);
// Deve retornar APENAS empresas do tenant atual (via JWT)
```

### Resultado Esperado:
✅ RLS aplica filtro automaticamente  
✅ Retorna apenas dados do tenant  

**⚠️ Se JWT não tiver tenant_id:** Retorna vazio ou erro de policy.

---

## 🧪 TESTE 9: Permissões - SDR (Escrita)

### Preparação:
1. Criar usuário "sdr@teste.com" no Auth
2. Adicionar como SDR no tenant "Cliente Demo"

```sql
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES (
  (SELECT id FROM tenants WHERE name = 'Cliente Demo'),
  (SELECT id FROM auth.users WHERE email = 'sdr@teste.com'),
  'sdr'
);
```

### Teste:
1. Login como SDR
2. Tentar criar empresa via `/api/companies/smart-search`

### Resultado Esperado:
✅ Se via client (anon): **FALHA** - policy não permite (SDR não tem INSERT em companies)  
✅ Se via server (service role): **SUCESSO** - mas deve validar papel manualmente  

### Teste 2:
1. Tentar criar lead via `/api/leads`

### Resultado Esperado:
✅ **SUCESSO** - SDR tem permissão para INSERT em leads  

---

## 🧪 TESTE 10: Permissões - Viewer (Apenas Leitura)

### Preparação:
1. Criar usuário "viewer@teste.com"
2. Adicionar como VIEWER no tenant

### Teste:
1. Login como viewer
2. Tentar criar lead

### Resultado Esperado:
✅ **FALHA** - policy não permite INSERT para viewer  
✅ Erro SQL claro (violação de policy)  

### Teste 2:
1. Listar leads

### Resultado Esperado:
✅ **SUCESSO** - Viewer tem SELECT em todas as tabelas  

---

## 🧪 TESTE 11: Service Role - Filtro Manual

### Verificar Rota Server-Side:

```ts
// Exemplo: app/api/companies/list/route.ts
import { getActiveTenantId } from '@/lib/tenant';

const tenantId = getActiveTenantId();
const { data } = await supabaseAdmin
  .from("companies")
  .select("*")
  .eq("tenant_id", tenantId);  // ← FILTRO MANUAL!
```

### Teste:
1. Workspace = "OLV"
2. GET `/api/companies/list`

### Resultado Esperado:
✅ Retorna apenas empresas do tenant OLV  
✅ Se esquecer `.eq("tenant_id", tenantId)` → **VAZA** dados de outros tenants!  

---

## 🧪 TESTE 12: CI - Doctor

### Executar:
```bash
npm run doctor
```

### Resultado Esperado:
✅ `/api/workspaces/current` → 200  
✅ `/api/tenants/list` → 200  

---

## 🧪 TESTE 13: CI - Smoke E2E

### Executar:
```bash
npm run test:smoke
```

### Resultado Esperado:
✅ Teste "Fluxo mínimo..." valida workspace switcher  
✅ Console mostra "✅ Workspace Switcher renderizado"  
✅ 3 testes passam  

---

## 🧪 TESTE 14: Migração de Dados Existentes

### Se já tem dados sem tenant_id:

```sql
-- 1. Criar tenant padrão
INSERT INTO tenants (name) VALUES ('Default') RETURNING id;
-- Copie o UUID retornado

-- 2. Atualizar todas as tabelas (substitua <UUID>)
UPDATE companies SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE leads SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE threads SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE messages SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE runs SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE run_events SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE provider_logs SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE alert_rules SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE alert_occurrences SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE digital_signals SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE tech_signals SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE people SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE person_contacts SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE playbooks SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE maturity_scores SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE maturity_recos SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;
UPDATE fit_totvs SET tenant_id = '<UUID_DEFAULT>' WHERE tenant_id IS NULL;

-- 3. Validar (nenhum NULL deve restar)
SELECT 
  (SELECT COUNT(*) FROM companies WHERE tenant_id IS NULL) as companies,
  (SELECT COUNT(*) FROM leads WHERE tenant_id IS NULL) as leads,
  (SELECT COUNT(*) FROM messages WHERE tenant_id IS NULL) as messages;
```

✅ Todas as contagens devem ser 0  

---

## 🧪 TESTE 15: Validação de Integridade

### Executar:
```sql
-- Verificar que todos os tenant_id são válidos
SELECT table_name, count(*) as invalid_tenant_count
FROM (
  SELECT 'companies' as table_name, COUNT(*) FROM companies WHERE tenant_id NOT IN (SELECT id FROM tenants)
  UNION ALL
  SELECT 'leads', COUNT(*) FROM leads WHERE tenant_id NOT IN (SELECT id FROM tenants)
  UNION ALL
  SELECT 'messages', COUNT(*) FROM messages WHERE tenant_id NOT IN (SELECT id FROM tenants)
  -- ... adicionar demais tabelas
) AS counts
WHERE count > 0;
```

### Resultado Esperado:
✅ Nenhum registro retornado (todos os tenant_id válidos)  

---

## ✅ CHECKLIST FINAL

- [ ] Tenants criados (Teste 1)
- [ ] Memberships adicionadas (Teste 2)
- [ ] API tenants/list funciona (Teste 3)
- [ ] API workspaces/current GET funciona (Teste 4)
- [ ] API workspaces/current POST funciona (Teste 5)
- [ ] UI WorkspaceSwitcher renderiza (Teste 6)
- [ ] Isolamento de dados validado (Teste 7)
- [ ] RLS client-side funciona (Teste 8)
- [ ] Permissões SDR corretas (Teste 9)
- [ ] Permissões Viewer corretas (Teste 10)
- [ ] Service Role filtra manualmente (Teste 11)
- [ ] CI Doctor passa (Teste 12)
- [ ] CI Smoke E2E passa (Teste 13)
- [ ] Dados existentes migrados (Teste 14)
- [ ] Integridade validada (Teste 15)

---

## 🎯 RESUMO

**15 testes** cobrindo:
- Criação de tenants e memberships
- APIs de workspace
- UI switcher
- Isolamento de dados (RLS)
- Permissões por papel (admin/manager/sdr/viewer)
- Filtros manuais server-side
- CI completo

**⚠️ ATENÇÃO:** Antes de produção, atualizar TODAS as rotas server-side com filtro `tenant_id`!

---

**Status:** ✅ PRONTO PARA INTEGRAÇÃO EM ROTAS EXISTENTES

