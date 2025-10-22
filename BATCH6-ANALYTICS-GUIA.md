# 📊 BATCH 6 - ANALYTICS - GUIA DE APLICAÇÃO

## 📋 ROTAS A ATUALIZAR (5)

| # | Rota | Filtro Necessário |
|---|------|-------------------|
| 1 | `/api/analytics/funnel` | companyId (param) |
| 2 | `/api/analytics/playbooks` | playbookId (param) |
| 3 | `/api/analytics/heatmap` | Global (sem filtro específico) |
| 4 | `/api/analytics/persona` | Global (sem filtro específico) |
| 5 | `/api/analytics/refresh` | Não (refresh MVs) |

---

## 🔧 PADRÃO DE APLICAÇÃO

### Analytics com Filtro (funnel/playbooks)

```typescript
import { db } from '@/lib/db';

export async function GET(req) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get('companyId');
  
  if (!companyId) {
    return Response.json({ ok: false, code: 'INVALID_INPUT' }, { status: 422 });
  }
  
  // Validar company pertence ao tenant
  const { from } = db();
  const { data: company } = await from('companies')
    .select('id')
    .eq('id', companyId)
    .maybeSingle();
  
  if (!company) {
    return Response.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
  }
  
  // Consultar MV (tenant_id já aplicado via db())
  const { data } = await from('mv_funnel_daily')
    .select('*')
    .eq('company_id', companyId);
  
  return Response.json({ ok: true, items: data });
}
```

### Analytics Global (heatmap/persona)

```typescript
import { db } from '@/lib/db';

export async function GET() {
  const { from } = db();
  
  // MVs já têm tenant_id, filtro automático
  const { data } = await from('mv_heatmap').select('*');
  
  return Response.json({ ok: true, items: data });
}
```

### Refresh (protegido)

```typescript
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req) {
  if (req.headers.get('x-analytics-secret') !== process.env.ANALYTICS_REFRESH_SECRET) {
    return Response.json('Forbidden', { status: 403 });
  }
  
  // Refresh global de todas as MVs
  await supabaseAdmin.rpc('refresh_ciclo9_materialized');
  
  return Response.json({ ok: true });
}
```

---

## ⚠️ IMPORTANTE: MVs e Tenant

As materialized views **devem incluir tenant_id** nas queries base.

**Atualizar MVs** (se necessário):

```sql
-- Refazer MV com tenant_id
DROP MATERIALIZED VIEW IF EXISTS mv_funnel_daily;

CREATE MATERIALIZED VIEW mv_funnel_daily AS
SELECT
  c.id as company_id,
  c.tenant_id,  -- ← ADICIONAR!
  date_trunc('day', e.created_at) as d,
  ...
FROM provider_logs e
JOIN companies c ON c.id = e.company_id
GROUP BY 1, 2, 3;  -- ← incluir tenant_id no GROUP BY

CREATE INDEX ON mv_funnel_daily(tenant_id, company_id, d);
```

---

## ✅ CHECKLIST

- [ ] `/api/analytics/funnel` - valida company + usa `db().from()`
- [ ] `/api/analytics/playbooks` - valida playbook + usa `db().from()`
- [ ] `/api/analytics/heatmap` - usa `db().from('mv_heatmap')`
- [ ] `/api/analytics/persona` - usa `db().from('mv_persona_efficiency')`
- [ ] `/api/analytics/refresh` - mantém supabaseAdmin (refresh global)
- [ ] MVs refeitas com tenant_id (se necessário)

---

## 🧪 VALIDAÇÃO

```bash
npm run ci:tenant
npm run ci:perf  # Validar SLA < 1.5s
```

---

**Tempo:** 15-20 minutos  
**Progresso após:** 31/35 (89%)

