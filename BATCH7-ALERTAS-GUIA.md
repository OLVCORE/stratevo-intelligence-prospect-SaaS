# 🔔 BATCH 7 - ALERTAS - GUIA DE APLICAÇÃO

## 📋 ROTAS A ATUALIZAR (4)

| # | Rota | Proteção |
|---|------|----------|
| 1 | `/api/alerts/rules` (GET/POST) | db() |
| 2 | `/api/alerts/scan` (POST) | db() + ALERTS_SECRET |
| 3 | `/api/alerts/notify` (POST) | db() + ALERTS_SECRET |
| 4 | `/api/alerts/digest` (POST) | db() + ALERTS_SECRET |

---

## 🔧 PADRÃO DE APLICAÇÃO

### Rules (CRUD)

```typescript
import { db } from '@/lib/db';

export async function GET() {
  const { from } = db();
  const { data } = await from('alert_rules')
    .select('*')
    .order('created_at', { ascending: false });
  
  return Response.json({ ok: true, items: data });
}

export async function POST(req) {
  const { insert, update } = db();
  
  // Create ou Update
  if (ruleId) {
    await update('alert_rules', { ... }).eq('id', ruleId);
  } else {
    await insert('alert_rules', { ... });
  }
}
```

### Scanner

```typescript
import { db } from '@/lib/db';

export async function POST(req) {
  // Verificar secret
  if (req.headers.get('x-alerts-secret') !== process.env.ALERTS_SCAN_SECRET) {
    return Response.json('Forbidden', { status: 403 });
  }
  
  const { from, insert } = db();
  
  // Buscar regras ativas DO TENANT ATUAL
  const { data: rules } = await from('alert_rules')
    .select('*')
    .eq('event', 'delivery_error')
    .eq('status', 'active');
  
  // Buscar eventos (provider_logs DO TENANT)
  const { data: errors } = await from('provider_logs')
    .select('*')
    .eq('status', 'error');
  
  // Criar ocorrências
  for (const rule of rules || []) {
    await insert('alert_occurrences', {
      rule_id: rule.id,
      company_id: rule.company_id,
      payload: { ... },
    });
  }
}
```

### Notify & Digest

```typescript
// Mesmo padrão: db() para buscar ocorrências do tenant
const { from, update } = db();

const { data: occs } = await from('alert_occurrences')
  .select('*, alert_rules(*)')
  .eq('notified', false);

// ... enviar emails

await update('alert_occurrences', { notified: true })
  .eq('id', occId);
```

---

## ✅ CHECKLIST

- [ ] `/api/alerts/rules` (GET/POST) - usa `db()`
- [ ] `/api/alerts/scan` - usa `db()` + ALERTS_SECRET
- [ ] `/api/alerts/notify` - usa `db()` + ALERTS_SECRET
- [ ] `/api/alerts/digest` - usa `db()` + ALERTS_SECRET

---

## 🧪 VALIDAÇÃO

```bash
npm run ci:tenant
npm run doctor
```

---

**Tempo:** 15 minutos  
**Progresso após:** 35/35 (100%) ✅

