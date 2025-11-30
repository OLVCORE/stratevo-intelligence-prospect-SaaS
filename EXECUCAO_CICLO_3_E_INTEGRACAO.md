# 🚀 GUIA DE EXECUÇÃO - CICLO 3 + INTEGRAÇÃO SDR/CRM

## ✅ O QUE PRECISA SER FEITO

### 1️⃣ APLICAR MIGRATIONS SQL NO SUPABASE
### 2️⃣ FAZER DEPLOY DAS EDGE FUNCTIONS
### 3️⃣ CONFIGURAR WEBHOOKS (OPCIONAL)

---

## 📋 PASSO 1: APLICAR MIGRATIONS SQL

### No Supabase Dashboard:
1. Acesse: **SQL Editor** → **New Query**
2. Copie e cole cada migration abaixo (uma por vez, na ordem):

### Migration 1: Integração SDR/CRM
**Arquivo:** `supabase/migrations/20250122000008_crm_sdr_integration.sql`
- Abra o arquivo
- Copie TODO o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **RUN**

### Migration 2: CICLO 3 Completo
**Arquivo:** `supabase/migrations/20250122000009_ciclo3_complete_integration.sql`
- Abra o arquivo
- Copie TODO o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **RUN**

---

## 📋 PASSO 2: DEPLOY DAS EDGE FUNCTIONS

### No PowerShell (na raiz do projeto):

```powershell
# Navegar para a raiz do projeto
cd C:\Projects\stratevo-intelligence-prospect

# Variáveis de configuração
$projectRef = "vkdvezuivlovzqxmnohk"

# ============================================
# 1. DEPLOY: crm-analyze-call-recording
# ============================================
Write-Host "`n📦 Deployando crm-analyze-call-recording..." -ForegroundColor Cyan
npx supabase functions deploy crm-analyze-call-recording `
  --project-ref $projectRef `
  --no-verify-jwt

# ============================================
# 2. DEPLOY: whatsapp-status-webhook
# ============================================
Write-Host "`n📦 Deployando whatsapp-status-webhook..." -ForegroundColor Cyan
npx supabase functions deploy whatsapp-status-webhook `
  --project-ref $projectRef `
  --no-verify-jwt

Write-Host "`n✅ Deploy concluído!" -ForegroundColor Green
```

---

## 📋 PASSO 3: CONFIGURAR WEBHOOKS (OPCIONAL)

### WhatsApp Status Webhook (Twilio)

Se você usa Twilio para WhatsApp, configure o webhook de status:

1. **Acesse Twilio Console** → **Messaging** → **Settings** → **WhatsApp Sandbox**
2. **Status Callback URL:**
   ```
   https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/whatsapp-status-webhook
   ```
3. **Método:** POST
4. **Salve**

---

## ✅ VERIFICAÇÃO

### Verificar Migrations:
```sql
-- No SQL Editor do Supabase, execute:
SELECT 
  name,
  version,
  executed_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '20250122%'
ORDER BY executed_at DESC;
```

### Verificar Edge Functions:
1. Acesse: **Supabase Dashboard** → **Edge Functions**
2. Verifique se aparecem:
   - ✅ `crm-analyze-call-recording`
   - ✅ `whatsapp-status-webhook`

### Verificar Tabelas Criadas:
```sql
-- No SQL Editor do Supabase, execute:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'whatsapp_message_status',
  'whatsapp_approved_templates',
  'unified_deals'
)
ORDER BY table_name;
```

---

## 🎯 RESUMO DOS COMANDOS

### PowerShell (copiar e colar tudo de uma vez):

```powershell
cd C:\Projects\stratevo-intelligence-prospect
$projectRef = "vkdvezuivlovzqxmnohk"

Write-Host "`n🚀 Iniciando deploy das Edge Functions..." -ForegroundColor Yellow

npx supabase functions deploy crm-analyze-call-recording --project-ref $projectRef --no-verify-jwt
npx supabase functions deploy whatsapp-status-webhook --project-ref $projectRef --no-verify-jwt

Write-Host "`n✅ Concluído! Verifique no Dashboard do Supabase." -ForegroundColor Green
```

---

## ⚠️ IMPORTANTE

1. **Migrations SQL:** Execute no Supabase Dashboard (SQL Editor)
2. **Edge Functions:** Execute no PowerShell (comandos acima)
3. **Webhooks:** Configure apenas se usar Twilio WhatsApp

---

## 📞 PRÓXIMOS PASSOS

Após executar tudo:
1. ✅ Teste o CRM → Comunicações → Gravações de Chamada
2. ✅ Teste o CRM → Comunicações → Status WhatsApp
3. ✅ Teste o handoff SDR → CRM (quando deal avança para 'qualified')

**Status:** Pronto para produção! 🎉

