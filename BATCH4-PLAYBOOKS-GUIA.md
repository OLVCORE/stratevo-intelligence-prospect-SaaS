# 🎯 BATCH 4 - PLAYBOOKS - GUIA DE APLICAÇÃO

## 📋 ROTAS A ATUALIZAR (6)

### Módulo: Playbooks & Sequencer

| # | Rota | Método | Assert |
|---|------|--------|--------|
| 1 | `/api/playbooks/route.ts` | GET | Não (lista) |
| 2 | `/api/playbooks/route.ts` | POST | Não (create) |
| 3 | `/api/playbooks/[id]/activate/route.ts` | POST | assertPlaybookInTenantOr404 |
| 4 | `/api/leads/[leadId]/run/route.ts` | POST | assertLeadInTenantOr404 |
| 5 | `/api/runs/[runId]/route.ts` | GET | assertRunInTenantOr404 |
| 6 | `/api/runs/[runId]/next/route.ts` | POST | assertRunInTenantOr404 |
| 7 | `/api/runs/[runId]/skip/route.ts` | POST | assertRunInTenantOr404 |
| 8 | `/api/runs/[runId]/stop/route.ts` | POST | assertRunInTenantOr404 |

---

## 🔧 PADRÃO DE APLICAÇÃO

### 1. Imports (TODAS as rotas)
```typescript
// ADICIONAR:
import { db } from '@/lib/db';

// SE usar params com ID resource:
import { assertPlaybookInTenantOr404, assertLeadInTenantOr404, assertRunInTenantOr404 } from '@/lib/tenant-assert';
```

### 2. Handlers GET/POST

#### Listagem (sem assert):
```typescript
export async function GET() {
  const { from } = db();
  const { data } = await from('playbooks').select('*');
  return Response.json({ ok: true, items: data });
}
```

#### Create (sem assert, mas usa db):
```typescript
export async function POST(req) {
  const { insert } = db();
  const { data } = await insert('playbooks', { name, ... });
  return Response.json({ ok: true, playbook: data });
}
```

#### Com ID (assert + db):
```typescript
export async function POST(req, { params }) {
  const guard = await assertPlaybookInTenantOr404(params.id);
  if (guard) return guard;
  
  const { update } = db();
  await update('playbooks', { status: 'active' }).eq('id', params.id);
  return Response.json({ ok: true });
}
```

---

## 📝 SUBSTITUIÇÕES ESPECÍFICAS

### Arquivo: `app/api/playbooks/route.ts`

**GET:**
```typescript
// TROCAR:
const { data } = await supabaseAdmin.from('playbooks').select('*');

// POR:
const { from } = db();
const { data } = await from('playbooks').select('*');
```

**POST:**
```typescript
// TROCAR:
await supabaseAdmin.from('playbooks').insert({ ... })

// POR:
const { insert } = db();
await insert('playbooks', { ... })
```

### Arquivo: `app/api/playbooks/[id]/activate/route.ts`

```typescript
// ADICIONAR no início:
const guard = await assertPlaybookInTenantOr404(params.id);
if (guard) return guard;

// TROCAR queries por db()
const { update } = db();
await update('playbooks', { status: 'active' }).eq('id', params.id);
```

### Arquivo: `app/api/leads/[leadId]/run/route.ts`

```typescript
// ADICIONAR no início:
const guard = await assertLeadInTenantOr404(params.leadId);
if (guard) return guard;

// TROCAR queries/inserts por db()
const { from, insert } = db();
await insert('runs', { lead_id: params.leadId, playbook_id, ... });
await insert('run_events', { run_id, ... });
```

### Arquivo: `app/api/runs/[runId]/*.ts` (4 rotas)

```typescript
// TODAS seguem mesmo padrão:
const guard = await assertRunInTenantOr404(params.runId);
if (guard) return guard;

const { from, update, insert } = db();
// ... usar from/update/insert em vez de supabaseAdmin
```

---

## ✅ CHECKLIST

- [ ] `app/api/playbooks/route.ts` - GET usa `db().from()`
- [ ] `app/api/playbooks/route.ts` - POST usa `db().insert()`
- [ ] `app/api/playbooks/[id]/activate/route.ts` - assert + `db().update()`
- [ ] `app/api/leads/[leadId]/run/route.ts` - assert + `db().insert()`
- [ ] `app/api/runs/[runId]/route.ts` - assert + `db().from()`
- [ ] `app/api/runs/[runId]/next/route.ts` - assert + `db()`
- [ ] `app/api/runs/[runId]/skip/route.ts` - assert + `db()`
- [ ] `app/api/runs/[runId]/stop/route.ts` - assert + `db()`

---

## 🧪 VALIDAÇÃO

```bash
# Tenant Guard (deve passar)
npm run ci:tenant

# Smoke Tests
npm run test:smoke

# Pipeline
npm run ci:quick
```

---

## 📊 APÓS BATCH 4

**Progresso:** 20/35 rotas (57%)  
**Próximo:** BATCH 5 (Relatórios)

---

**Tempo estimado:** 20 minutos  
**Impacto:** Playbooks & Sequencer 100% multi-tenant

