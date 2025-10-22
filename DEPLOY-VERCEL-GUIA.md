# 🚀 DEPLOY VERCEL - GUIA COMPLETO

## 📋 PRÉ-REQUISITOS

### ✅ Antes de Deployar:

1. **CI Local Verde:**
   ```bash
   npm run ci:full
   ```
   ✅ Build sem erros  
   ✅ Doctor passa  
   ✅ Smoke E2E passa  
   ✅ Performance < 1.5s  
   ✅ Tenant guard passa  

2. **Supabase Configurado:**
   - ✅ 11 migrations executadas (001-011)
   - ✅ RLS habilitada em 17 tabelas
   - ✅ MVs criadas e populadas (primeiro REFRESH)
   - ✅ Seeds de tenants (OLV, etc.)

3. **ENV Validado:**
   ```bash
   npm run verify-env
   ```
   ✅ Todas as variáveis presentes

---

## 🔧 PASSO A PASSO

### 1. Preparar Repositório

```bash
# Commit final
git add .
git commit -m "feat: v2.0-final - 11 ciclos + multi-tenancy completo"

# Tag de versão
git tag v2.0-final
git push origin main --tags
```

---

### 2. Vercel - Deploy

#### A. Importar Projeto

1. Acesse https://vercel.com/new
2. Import Git Repository
3. Selecione `olv-intelligence-prospect-v2`
4. Framework Preset: **Next.js**
5. Root Directory: `./`

#### B. Configurar Build

**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`  
**Development Command:** `npm run dev`

#### C. Variáveis de Ambiente

**Adicionar TODAS as variáveis do `.env.local`:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Providers
RECEITAWS_API_TOKEN=sua-key
SERPER_API_KEY=sua-key

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email
SMTP_PASS=sua-senha-app
FROM_EMAIL=seu-email

# WhatsApp (opcional)
WA_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+55...

# Segredos
CRON_SECRET=string-forte-1
ANALYTICS_REFRESH_SECRET=string-forte-2
ALERTS_SCAN_SECRET=string-forte-3
WEBHOOK_EMAIL_SECRET=string-forte-4
WEBHOOK_WA_SECRET=string-forte-5

# Tenant
DEFAULT_TENANT_ID=uuid-tenant-padrao

# App
NEXT_PUBLIC_APP_NAME="OLV Intelligent Prospect v2"
APP_BASE_URL=https://seu-dominio.vercel.app
```

⚠️ **NUNCA** commitar `.env.local` no Git!

---

### 3. Deploy

1. Clicar "Deploy"
2. Aguardar build (~2-5 min)
3. Obter URL: `https://olv-intelligence-prospect-v2.vercel.app`

---

### 4. Validação Pós-Deploy

#### A. Health Check

```bash
curl https://seu-dominio.vercel.app/api/health
```

**Esperado:**
```json
{
  "ok": true,
  "supabase": true,
  "providers": {
    "receitaws": true,
    "serper": true
  }
}
```

#### B. Navegação Manual

1. **Dashboard:** `https://seu-dominio.vercel.app/`
2. **Companies:** `/companies`
3. **Analytics:** `/analytics`
4. **Status:** `/_status`

✅ Todas devem carregar sem erro 500

#### C. Ciclo Completo (Smoke Prod)

```
1. SearchHub → Buscar CNPJ real
2. /companies → Ver na lista
3. /companies/[id] → Abrir detalhes
4. Tab Digital → Atualizar Digital
5. Tab Decisores → Atualizar Decisores
6. Criar Lead
7. /leads/[id] → Inbox
8. Enviar mensagem teste
9. /analytics/funnel → Ver funil
10. /reports → Gerar PDF
```

✅ Tudo deve funcionar sem erros

---

### 5. Configurar Webhooks

#### Email Webhook (Inbound)

**URL:** `https://seu-dominio.vercel.app/api/webhooks/email`

**Provider:** Configure em seu SMTP/Email provider:
- Mailgun: Webhook URL
- SendGrid: Inbound Parse
- Postmark: Inbound Webhook

**Header:** `x-webhook-secret: SEU_WEBHOOK_EMAIL_SECRET`

#### WhatsApp Webhook (Twilio)

1. Acesse Twilio Console
2. WhatsApp Sandbox Settings
3. **Webhook URL:** `https://seu-dominio.vercel.app/api/webhooks/wa`
4. **Method:** POST
5. Twilio valida HMAC automaticamente

---

### 6. Configurar Crons (Supabase)

#### Analytics Refresh (5 min)

```sql
SELECT cron.schedule(
  'refresh-analytics',
  '*/5 * * * *',
  $$SELECT refresh_ciclo9_materialized()$$
);
```

#### Reports Cron (1 min)

```bash
# Via Vercel Cron:
# vercel.json
{
  "crons": [{
    "path": "/api/reports/cron",
    "schedule": "* * * * *"
  }]
}
```

#### Alerts Scan (15 min)

```bash
# Via cron job externo ou Vercel Cron:
curl -X POST https://seu-dominio.vercel.app/api/alerts/scan \
  -H "x-alerts-secret: $ALERTS_SCAN_SECRET"
```

---

### 7. Monitoramento

#### Vercel Dashboard

- **Logs:** Realtime function logs
- **Analytics:** Pageviews, performance
- **Errors:** Filtrar por 500

#### Sentry (Opcional)

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

### 8. Rollback (se necessário)

```bash
# Via Vercel Dashboard:
Deployments → Anterior → "Promote to Production"

# Ou via CLI:
vercel rollback
```

---

## ✅ CHECKLIST FINAL

- [ ] CI local verde (`npm run ci:full`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Deploy concluído sem erros
- [ ] Health check retorna 200
- [ ] Navegação manual OK
- [ ] Ciclo completo funciona (busca → enriquece → lead → mensagem)
- [ ] Webhooks configurados
- [ ] Crons agendados
- [ ] Monitoramento ativo

---

## 🎊 PÓS-DEPLOY

### Opcional (Melhorias):

1. **Domínio Custom:**
   - Vercel → Settings → Domains
   - Adicionar `prospect.olv.com.br`

2. **SSL/HTTPS:**
   - Automático via Vercel

3. **Edge Functions:**
   - Já ativado automaticamente

4. **Analytics:**
   - Vercel Analytics (built-in)
   - Ou PostHog/Mixpanel

---

**Tempo de Deploy:** 5-10 minutos  
**Status:** ✅ PRODUÇÃO-READY

