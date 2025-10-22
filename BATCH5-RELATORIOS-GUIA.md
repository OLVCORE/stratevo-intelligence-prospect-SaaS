# 📄 BATCH 5 - RELATÓRIOS - GUIA DE APLICAÇÃO

## 📋 ROTAS A ATUALIZAR (6)

| # | Rota | Assert Necessário |
|---|------|-------------------|
| 1 | `/api/reports/create` (POST) | Não (usa companyId do body) |
| 2 | `/api/reports/schedule` (POST) | Não (usa companyId do body) |
| 3 | `/api/reports/cron` (POST) | Não (processa jobs) |
| 4 | `/api/export/companies` (GET) | Não (lista filtrada) |
| 5 | `/api/export/decision-makers` (GET) | Não (usa companyId param) |
| 6 | `/api/export/runs` (GET) | Não (usa companyId param) |

---

## 🔧 PADRÃO DE APLICAÇÃO

### Relatórios (create/schedule)

```typescript
import { db } from '@/lib/db';

export async function POST(req) {
  const { companyId, ... } = await req.json();
  
  // Validar company pertence ao tenant
  const { from } = db();
  const { data: company } = await from('companies')
    .select('id')
    .eq('id', companyId)
    .maybeSingle();
  
  if (!company) {
    return Response.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
  }
  
  // Composição do relatório
  const reportData = await composeReport(companyId);
  
  // Audit
  const { insert } = db();
  await insert('audit_log', {
    action: 'report_create',
    entity_id: companyId,
    ...
  });
  
  // ... gerar PDF/agendar
}
```

### Export CSV

```typescript
import { db } from '@/lib/db';

export async function GET(req) {
  const { from } = db();
  
  // Filtro automático por tenant_id
  const { data } = await from('companies')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5000);
  
  // ... gerar CSV
}
```

### Cron (processa jobs)

```typescript
import { db } from '@/lib/db';

export async function POST(req) {
  // Verificar CRON_SECRET
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return Response.json('Forbidden', { status: 403 });
  }
  
  const { from } = db();
  
  // Buscar jobs agendados (sem tenant específico - processa todos)
  const { data: jobs } = await supabaseAdmin
    .from('report_jobs')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString());
  
  for (const job of jobs || []) {
    // Para cada job, usar tenant_id do job.company_id
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('tenant_id')
      .eq('id', job.company_id)
      .single();
    
    if (!company) continue;
    
    // Processar no contexto do tenant
    // ... gerar PDF, enviar email
  }
}
```

---

## ✅ CHECKLIST

- [ ] `/api/reports/create` - valida company via `db().from()`
- [ ] `/api/reports/schedule` - valida company via `db().from()`
- [ ] `/api/reports/cron` - processa jobs (usa tenant_id do company)
- [ ] `/api/export/companies` - usa `db().from('companies')`
- [ ] `/api/export/decision-makers` - valida company + usa `db().from()`
- [ ] `/api/export/runs` - valida company + usa `db().from()`

---

## 🧪 VALIDAÇÃO

```bash
npm run ci:tenant
npm run doctor
```

---

**Tempo:** 20 minutos  
**Progresso após:** 26/35 (74%)

