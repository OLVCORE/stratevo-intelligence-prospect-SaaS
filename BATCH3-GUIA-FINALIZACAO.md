# 🔒 BATCH 3 - GUIA DE FINALIZAÇÃO

## 📋 CHECKLIST DE ROTAS PENDENTES

### ⏳ 4 Rotas SDR Restantes

#### 1. `/api/leads/route.ts` (POST)
```typescript
// Adicionar no topo:
import { db } from '@/lib/db';
import { assertCompanyInTenantOr404 } from '@/lib/tenant-assert';

// No handler POST:
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, ...rest } = Schema.parse(body);
  
  // ADICIONAR:
  const guard = await assertCompanyInTenantOr404(companyId);
  if (guard) return guard;
  
  // TROCAR:
  // await supabaseAdmin.from('leads').insert(...)
  // POR:
  const { insert } = db();
  const { data, error } = await insert('leads', {
    company_id: companyId,
    ...rest
  }).select().single();
}
```

#### 2. `/api/leads/[leadId]/threads/route.ts` (GET/POST)
```typescript
// Adicionar no topo:
import { db } from '@/lib/db';
import { assertLeadInTenantOr404 } from '@/lib/tenant-assert';

// No handler GET:
export async function GET(req, { params }) {
  // ADICIONAR:
  const guard = await assertLeadInTenantOr404(params.leadId);
  if (guard) return guard;
  
  // TROCAR:
  // await supabaseAdmin.from('threads').select(...)
  // POR:
  const { from } = db();
  const { data } = await from('threads')
    .select('*')
    .eq('lead_id', params.leadId);
}

// No handler POST:
export async function POST(req, { params }) {
  // ADICIONAR:
  const guard = await assertLeadInTenantOr404(params.leadId);
  if (guard) return guard;
  
  // TROCAR inserts por db().insert
  const { insert } = db();
  await insert('threads', { lead_id: params.leadId, ... });
}
```

#### 3. `/api/threads/[threadId]/messages/route.ts` (GET)
```typescript
// Adicionar no topo:
import { db } from '@/lib/db';
import { assertThreadInTenantOr404 } from '@/lib/tenant-assert';

// No handler:
export async function GET(req, { params }) {
  // ADICIONAR:
  const guard = await assertThreadInTenantOr404(params.threadId);
  if (guard) return guard;
  
  // TROCAR:
  const { from } = db();
  const { data } = await from('messages')
    .select('*')
    .eq('thread_id', params.threadId);
}
```

#### 4. `/api/threads/[threadId]/messages/send/route.ts` (POST)
```typescript
// Adicionar no topo:
import { db } from '@/lib/db';
import { assertThreadInTenantOr404 } from '@/lib/tenant-assert';

// No handler:
export async function POST(req, { params }) {
  // ADICIONAR:
  const guard = await assertThreadInTenantOr404(params.threadId);
  if (guard) return guard;
  
  const { from, insert, tenantId } = db();
  
  // LGPD: Verificar privacy_prefs
  const { data: prefs } = await from('privacy_prefs')
    .select('store_message_body')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  
  const storeBody = prefs?.store_message_body === true;
  
  // TROCAR inserts:
  await insert('messages', {
    thread_id: params.threadId,
    body: storeBody ? body : null,  // ← LGPD!
    ...
  });
  
  await insert('provider_logs', { ... });
}
```

---

### ⏳ 2 Webhooks (Exceções Seguras)

#### 5. `/api/webhooks/email/route.ts`
```typescript
// @public - webhook endpoint (não usa db() no início)
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req) {
  const signature = req.headers.get("x-webhook-secret");
  const payload = await req.json();
  
  // 1. Resolver tenant pelo secret
  const { data } = await supabaseAdmin
    .from("webhook_secrets")
    .select("tenant_id")
    .eq("email_secret", signature)
    .single();
    
  if (!data) return new Response("Forbidden", { status: 403 });
  const tenantId = data.tenant_id;
  
  // 2. LGPD: verificar privacy_prefs
  const { data: prefs } = await supabaseAdmin
    .from("privacy_prefs")
    .select("store_message_body")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  
  const body = prefs?.store_message_body ? payload.text : null;
  
  // 3. Gravar mensagem COM tenant_id explícito
  await supabaseAdmin.from("messages").insert({
    tenant_id: tenantId,  // ← EXPLÍCITO!
    direction: "inbound",
    channel: "email",
    from_identity: payload.from,
    subject: payload.subject,
    body: body,  // ← LGPD-safe
    status: "received"
  });
  
  return Response.json({ ok: true });
}
```

#### 6. `/api/webhooks/wa/route.ts`
```typescript
// @public - webhook endpoint
// Mesma lógica de email, mas validando HMAC do Twilio
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req) {
  // 1. Validar HMAC/signature do Twilio
  // 2. Resolver tenant via wa_secret
  // 3. Verificar LGPD (privacy_prefs)
  // 4. Inserir message COM tenant_id explícito
}
```

---

## 📝 PADRÃO DE SUBSTITUIÇÃO

### Em TODAS as 6 rotas acima:

**1. Imports:**
```typescript
// REMOVER:
import { supabaseAdmin } from '@/lib/supabase/server';

// ADICIONAR:
import { db } from '@/lib/db';
import { assertXXXInTenantOr404 } from '@/lib/tenant-assert';
```

**2. Validação de Posse:**
```typescript
// ADICIONAR no início do handler:
const guard = await assertXXXInTenantOr404(params.xxxId);
if (guard) return guard;
```

**3. Queries:**
```typescript
// TROCAR:
supabaseAdmin.from("table")

// POR:
const { from } = db();
from("table")
```

**4. Inserts:**
```typescript
// TROCAR:
await supabaseAdmin.from("table").insert(...)

// POR:
const { insert } = db();
await insert("table", ...)
```

---

## ✅ VALIDAÇÃO

### Após aplicar os patches:

```bash
# 1. Tenant Guard (deve passar com webhooks na allowlist)
npm run ci:tenant

# 2. Doctor
npm run doctor

# 3. Smoke Tests
npm run test:smoke

# 4. Tenant Isolation
npm run test:tenant

# 5. Pipeline Completo
npm run ci:quick
```

**Todos devem estar VERDES!** ✅

---

## 📊 RESULTADO ESPERADO

Após completar BATCH 3:
- ✅ 14/35 rotas protegidas (40%)
- ✅ SDR 100% multi-tenant
- ✅ LGPD-safe (privacy_prefs)
- ✅ Webhooks seguros (secret validation)
- ✅ CI Guard passa

---

## 🚀 PRÓXIMOS BATCHES

**BATCH 4:** Playbooks (6 rotas) - ~20 min  
**BATCH 5:** Relatórios (6 rotas) - ~20 min  
**BATCH 6:** Analytics (5 rotas) - ~15 min  
**BATCH 7:** Alertas (4 rotas) - ~15 min  

**Total:** ~1h 10min para 100%

---

**Status:** 🔄 BATCH 3 PRONTO PARA FINALIZAÇÃO

