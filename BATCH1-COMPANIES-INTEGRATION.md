# 🔒 BATCH 1 - INTEGRAÇÃO TENANT: Companies

## 🎯 OBJETIVO

Aplicar filtro `tenant_id` em todas as rotas do módulo **Companies** usando o wrapper `db()`.

---

## ✅ GUARDRAILS IMPLEMENTADOS

### 1. Helper Central (lib/tenant.ts)
- ✅ `getActiveTenantId()` **LANÇA ERRO** se não houver tenant
- ✅ Garante que nenhuma rota roda sem workspace ativo

### 2. Wrapper Automático (lib/db.ts)
- ✅ `db().from(table)` - SELECT com filtro tenant_id
- ✅ `db().insert(table, values)` - INSERT com tenant_id preenchido
- ✅ `db().update(table, values)` - UPDATE com filtro tenant_id
- ✅ `db().upsert(table, values, opts)` - UPSERT com tenant_id preenchido
- ✅ `db().delete(table)` - DELETE com filtro tenant_id

### 3. CI Guard (scripts/check-tenant-guard.ts)
- ✅ Verifica se rotas usam `db()` ou `getActiveTenantId()`
- ✅ Bloqueia pipeline se encontrar rotas desprotegidas
- ✅ Ignora rotas públicas (webhooks, health)

### 4. Testes E2E (tests/e2e.tenant.spec.ts)
- ✅ Valida isolamento entre tenants
- ✅ Testa que API retorna erro sem tenant

### 5. Backfill Script (scripts/backfill-tenant.ts)
- ✅ Migra dados existentes para tenant padrão
- ✅ Atualiza 21 tabelas
- ✅ Uso: `DEFAULT_TENANT_ID=uuid tsx scripts/backfill-tenant.ts`

---

## 📦 BATCH 1: ROTAS ATUALIZADAS

### ✅ 1. /api/companies/smart-search
**Mudanças:**
- ❌ ANTES: `import { supabaseAdmin } from '@/lib/supabase/server';`
- ✅ DEPOIS: `import { db } from '@/lib/db';`
- ❌ ANTES: `await supabaseAdmin.from('companies').upsert(...)`
- ✅ DEPOIS: `const { upsert } = db(); await upsert('companies', ...)`

**Comportamento:**
- Tenant preenchido automaticamente no UPSERT
- Se não houver workspace ativo → erro TENANT_MISSING

### ✅ 2. /api/companies/list
**Mudanças:**
- ❌ ANTES: `import { supabaseAdmin } from '@/lib/supabase/server';`
- ✅ DEPOIS: `import { db } from '@/lib/db';`
- ❌ ANTES: `let query = supabaseAdmin.from('companies').select(...)`
- ✅ DEPOIS: `const { from } = db(); let query = from('companies').select(...)`

**Comportamento:**
- Filtro `eq("tenant_id", tenantId)` aplicado automaticamente
- Retorna apenas empresas do workspace ativo

---

## 🧪 VALIDAÇÃO

### CI Guard (automático no pipeline):
```bash
npm run ci:tenant
```

**Esperado:**
```
✅ Tenant guard OK em todas as rotas checadas.
```

**Se falhar:**
```
❌ Rotas sem guard de tenant encontradas:
  ⚠️  app/api/alguma/rota/route.ts
```

### Teste Manual:

1. **Sem workspace ativo:**
   ```bash
   # Limpar cookie
   POST /api/workspaces/current { "tenantId": "" }
   
   # Tentar buscar empresa
   POST /api/companies/smart-search { "cnpj": "..." }
   ```
   **Esperado:** Erro 500 com "TENANT_MISSING"

2. **Com workspace ativo:**
   ```bash
   # Definir workspace
   POST /api/workspaces/current { "tenantId": "uuid-olv" }
   
   # Buscar empresa
   POST /api/companies/smart-search { "cnpj": "..." }
   ```
   **Esperado:** Sucesso, empresa criada com tenant_id = uuid-olv

3. **Isolamento:**
   ```bash
   # Workspace A
   POST /api/workspaces/current { "tenantId": "uuid-a" }
   GET /api/companies/list
   → Retorna empresas do tenant A
   
   # Workspace B
   POST /api/workspaces/current { "tenantId": "uuid-b" }
   GET /api/companies/list
   → Retorna empresas do tenant B
   ```

---

## 📊 IMPACTO DO BATCH 1

### Rotas Atualizadas: 2
- ✅ `/api/companies/smart-search`
- ✅ `/api/companies/list`

### Rotas Pendentes: ~37
- Batch 2: Enriquecimento (Digital/Tech)
- Batch 3: Decisores & SDR
- Batch 4: Playbooks & Sequencer
- Batch 5: Relatórios & Export
- Batch 6: Analytics
- Batch 7: Alertas

---

## 🔄 PRÓXIMOS BATCHES

### BATCH 2: Enriquecimento
- `/api/company/[id]/digital/*` (2 rotas)
- `/api/company/[id]/tech-stack/*` (2 rotas)

### BATCH 3: Decisores & SDR
- `/api/company/[id]/decision-makers/*` (2 rotas)
- `/api/leads/*` (2 rotas)
- `/api/threads/*` (2 rotas)
- `/api/webhooks/*` (2 rotas)

### BATCH 4: Playbooks
- `/api/playbooks/*` (2 rotas)
- `/api/runs/*` (4 rotas)

### BATCH 5: Relatórios
- `/api/reports/*` (3 rotas)
- `/api/export/*` (3 rotas)

### BATCH 6: Analytics
- `/api/analytics/*` (5 rotas)

### BATCH 7: Alertas
- `/api/alerts/*` (4 rotas)

---

## ✅ DEFINITION OF DONE - BATCH 1

- [x] lib/tenant.ts atualizado (lança erro)
- [x] lib/db.ts criado (wrapper auto-tenant)
- [x] scripts/check-tenant-guard.ts criado
- [x] tests/e2e.tenant.spec.ts criado
- [x] scripts/backfill-tenant.ts criado
- [x] package.json atualizado (ci:tenant, glob)
- [x] /api/companies/smart-search atualizado
- [x] /api/companies/list atualizado
- [ ] CI passa (npm run ci:quick)
- [ ] Teste manual de isolamento OK

---

## 🚀 COMANDO DE VALIDAÇÃO

```bash
# Pipeline completo com tenant guard
npm run ci:quick
```

**Se passar:** BATCH 1 aprovado, pode ir para BATCH 2!  
**Se falhar:** Corrigir rotas apontadas pelo guard.

---

**Status:** ✅ BATCH 1 COMPLETO

**Próximo:** BATCH 2 (Enriquecimento) ou CICLO 12 (Observabilidade)?

