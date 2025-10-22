# 🧪 CICLO 5 - Teste de Mesa

## Objetivo
Validar módulo SDR OLV (Inbox unificado) com envio e recebimento de e-mail/WhatsApp.

---

## 📋 Pré-requisitos

1. **CICLOS 1-4 completos**
2. **SQL executado** (`lib/supabase/migrations/004_ciclo5_sdr.sql`)
3. **ENV configurado** com credenciais REAIS:
   - SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS)
   - Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)
   - Webhook secrets (WEBHOOK_EMAIL_SECRET, WEBHOOK_WA_SECRET)
4. **Pelo menos 1 lead criado** (via "Criar Lead + Inbox" no Ciclo 4)
5. **Servidor rodando:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testes

### 1. Templates Padrão Inseridos

**SQL:**
```sql
SELECT * FROM message_templates WHERE is_active = true;
```

**Resultado Esperado:**
- ✅ 2 templates:
  - "Apresentação OLV" (email)
  - "Primeiro Contato" (whatsapp)
- ✅ body_md contém variáveis (`{{company.name}}`, etc.)

---

### 2. Criar Lead e Abrir Inbox

**Passos:**
1. Acesse `/companies/[id]`
2. Tab "Decisores"
3. Clique "Criar Lead + Inbox" em um decisor

**Resultado Esperado:**
- ✅ Redireciona para `/leads/[leadId]`
- ✅ Página Inbox carrega
- ✅ Mostra: empresa, pessoa, stage
- ✅ Botões "Nova Thread E-mail" e "Nova Thread WhatsApp" visíveis

---

### 3. Criar Thread de E-mail

**Passos:**
1. Na página Inbox do lead
2. Clique "📧 Nova Thread E-mail"

**Resultado Esperado:**
- ✅ Alert: "Thread criada!"
- ✅ Thread aparece na lista à esquerda
- ✅ Ícone 📧 + "email"
- ✅ Subject preenchido: "Contato - [Nome da Empresa]"

**Validação no Banco:**
```sql
SELECT * FROM threads WHERE lead_id = '[uuid]' AND channel = 'email';
```
- ✅ Registro criado
- ✅ subject preenchido

---

### 4. Enviar E-mail COM Template

**Setup:** SMTP configurado no `.env.local`

**Passos:**
1. Selecione a thread criada
2. No composer:
   - Para: (e-mail real de teste)
   - Template: "Apresentação OLV"
   - Observe body preenchido com variáveis
3. Clique "Enviar"

**Resultado Esperado:**
- ✅ Alert: "Mensagem enviada com sucesso!"
- ✅ Mensagem aparece na timeline (bubble direita, azul)
- ✅ Status: "sent"
- ✅ Provider: "smtp"
- ✅ Latência: X ms

**Validação no Banco:**
```sql
SELECT 
  id, direction, from_addr, to_addr, 
  body, provider, provider_msg_id, 
  status, latency_ms
FROM messages 
WHERE thread_id = '[uuid]'
ORDER BY created_at DESC LIMIT 1;
```

**Verificar:**
- ✅ `direction` = `'outbound'`
- ✅ `provider` = `'smtp'`
- ✅ `provider_msg_id` preenchido (Message-ID do SMTP)
- ✅ `status` = `'sent'`
- ✅ `latency_ms` > 0
- ✅ `body` = NULL (se `store_message_body = false`) OU texto completo (se true)

---

### 5. Enviar WhatsApp

**Setup:** Twilio configurado

**Passos:**
1. Crie nova thread WhatsApp
2. No composer:
   - Para: +5511999999999 (número real de teste)
   - Template: "Primeiro Contato"
3. Clique "Enviar"

**Resultado Esperado:**
- ✅ Mensagem enviada via Twilio
- ✅ Timeline atualiza
- ✅ Provider: "twilio"
- ✅ provider_msg_id = SID do Twilio

**Validação:**
```sql
SELECT * FROM messages 
WHERE direction = 'outbound' AND provider = 'twilio'
ORDER BY created_at DESC LIMIT 1;
```

---

### 6. Renderização de Variáveis

**Passos:**
1. Crie lead vinculado a:
   - Empresa: "Nubank"
   - Pessoa: "João Silva"
2. Use template "Apresentação OLV"
3. Observe body antes de enviar

**Resultado Esperado:**
```
Olá João,

Sou da OLV e gostaria de apresentar nossas soluções para Nubank.

Podemos agendar uma conversa?

Atenciosamente,
Equipe OLV
```

- ✅ `{{company.name}}` → "Nubank"
- ✅ `{{person.first_name}}` → "João"

---

### 7. Receber E-mail (Webhook)

**Setup:** Configure seu provedor SMTP para enviar webhooks para:
```
POST https://seu-dominio.com/api/webhooks/email
Header: x-webhook-secret: SEU_SECRET
```

**Payload exemplo:**
```json
{
  "from": "destinatario@empresa.com",
  "to": "olvsistemas@olvinternacional.com.br",
  "subject": "Re: Apresentação - Nubank",
  "text": "Obrigado pelo contato!",
  "messageId": "<reply123@empresa.com>",
  "inReplyTo": "<original123@olv.com>"
}
```

**Resultado Esperado:**
- ✅ Webhook aceito (200 OK)
- ✅ Mensagem inbound criada
- ✅ Timeline mostra bubble à esquerda
- ✅ Direction: "inbound"

---

### 8. Receber WhatsApp (Webhook Twilio)

**Setup:** Configure Twilio webhook para:
```
POST https://seu-dominio.com/api/webhooks/wa
```

**Twilio envia:**
```
From=whatsapp:+5511999999999
To=whatsapp:+55XXXXXXXXXXX
Body=Sim, vamos conversar!
MessageSid=SM123...
```

**Resultado Esperado:**
- ✅ Assinatura Twilio validada
- ✅ Mensagem inbound criada
- ✅ Timeline atualiza

---

### 9. LGPD - Corpo Não Armazenado

**Setup:** `privacy_prefs` com `store_message_body = false` (padrão)

**Passos:**
1. Envie uma mensagem
2. Verifique no banco:

```sql
SELECT body FROM messages 
WHERE direction = 'outbound'
ORDER BY created_at DESC LIMIT 1;
```

**Resultado Esperado:**
- ✅ `body` = NULL

**Na UI:**
- ✅ Bubble mostra: "(corpo não armazenado - LGPD)"

---

### 10. LGPD - Corpo Armazenado (Opt-in)

**Setup:**
```sql
INSERT INTO privacy_prefs (company_id, store_message_body)
VALUES ('[uuid]', true);
```

**Passos:**
1. Envie mensagem
2. Verifique no banco:

```sql
SELECT body FROM messages 
WHERE direction = 'outbound'
ORDER BY created_at DESC LIMIT 1;
```

**Resultado Esperado:**
- ✅ `body` contém texto completo

**Na UI:**
- ✅ Bubble mostra conteúdo real

---

### 11. Telemetria em provider_logs

**SQL:**
```sql
SELECT 
  provider,
  operation,
  status,
  latency_ms,
  meta,
  created_at
FROM provider_logs
WHERE operation IN ('sdr-send', 'sdr-inbound')
ORDER BY created_at DESC
LIMIT 10;
```

**Verificar:**
- ✅ Logs de envio (`operation = 'sdr-send'`)
- ✅ Logs de recebimento (`operation = 'sdr-inbound'`)
- ✅ `latency_ms` preenchido
- ✅ `meta` com thread_id, message_id

---

### 12. Thread Não Duplica

**Passos:**
1. Crie thread de e-mail
2. Tente criar outra thread de e-mail para mesmo lead
3. Observe resposta

**Resultado Esperado:**
- ✅ Retorna threadId da thread existente (não cria nova)
- ✅ Status 200 (não 201)

**SQL:**
```sql
SELECT COUNT(*) FROM threads 
WHERE lead_id = '[uuid]' AND channel = 'email';
-- Resultado: 1 (não duplica)
```

---

## ✅ Definition of Done (DoD)

Marque todos antes de considerar o Ciclo 5 completo:

- [ ] SQL executado (4 tabelas + 2 templates)
- [ ] SMTP provider funcionando
- [ ] WhatsApp provider funcionando  
- [ ] Template rendering OK
- [ ] Webhook email validando signature
- [ ] Webhook WhatsApp validando signature
- [ ] POST create thread
- [ ] POST send message (email)
- [ ] POST send message (WhatsApp)
- [ ] GET messages (timeline)
- [ ] GET threads list
- [ ] UI Inbox renderizando
- [ ] Timeline com bubbles inbound/outbound
- [ ] Composer enviando
- [ ] "Criar Lead + Inbox" funcionando
- [ ] LGPD-safe (corpo NULL por padrão)
- [ ] Telemetria em provider_logs
- [ ] Build TypeScript sem erros
- [ ] Linter sem erros

---

## 🐛 Troubleshooting

### ❌ "SMTP não configurado"
**Solução:** Configure ENV:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

### ❌ "WhatsApp (Twilio) não configurado"
**Solução:** Configure ENV:
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+55...
```

### ❌ Webhook retorna 401 (Unauthorized)
**Solução:** 
- E-mail: header `x-webhook-secret` deve bater com `WEBHOOK_EMAIL_SECRET`
- WhatsApp: assinatura Twilio deve ser válida

### ❌ Variáveis não renderizam
**Solução:** Verifique:
1. Template tem sintaxe correta: `{{company.name}}`
2. Lead está vinculado a company_id e person_id
3. buildTemplateVariables() retorna dados corretos

### ❌ Mensagem envia mas não aparece na timeline
**Solução:**
1. Verifique se foi salva em `messages` (SELECT)
2. Force refresh da página
3. Verifique console do browser para erros

---

## 📊 Checklist de Validação

Execute após implementar:

```bash
# 1. Build TypeScript
npm run type-check

# 2. Linter
npm run lint

# 3. Verificar ENV
npm run verify-env

# 4. Build de produção
npm run build
```

---

**✅ CICLO 5 COMPLETO!**

Todos os testes passando → **SDR OLV funcionando!** 🚀

Aguardando **Ciclo 6 - Maturidade + FIT TOTVS/OLV**

