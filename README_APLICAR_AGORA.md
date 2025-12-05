# ⚡ APLICAR AGORA - 4 PASSOS RÁPIDOS
## Growth Engine 100% Funcional em 20 Minutos

**Status:** ✅ TODAS as APIs JÁ CONFIGURADAS!  
**Tempo:** 20 minutos

---

## 🎯 SEQUÊNCIA DE EXECUÇÃO

### 📝 PASSO 1: SQL - Migration (5 min)

```
1. Abrir: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk
2. SQL Editor → New Query
3. Copiar TODO conteúdo de: 01_APLICAR_MIGRATION_VOICE_AI.sql
4. Colar e clicar "Run"
5. Aguardar "Success" ✅
```

---

### 📦 PASSO 2: SQL - Storage Bucket (2 min)

```
1. SQL Editor → New Query
2. Copiar TODO conteúdo de: 02_CRIAR_BUCKET_STORAGE.sql
3. Colar e clicar "Run"
4. Aguardar "Success" ✅
```

---

### 🔍 PASSO 3: SQL - Verificar Secrets (1 min)

```
1. SQL Editor → New Query
2. Copiar TODO conteúdo de: 03_VERIFICAR_SECRETS.sql
3. Colar e clicar "Run"
4. Verificar resultado:
   ✅ ELEVENLABS_API_KEY
   ✅ TWILIO_ACCOUNT_SID
   ✅ TWILIO_AUTH_TOKEN
   ✅ TWILIO_PHONE_NUMBER
   ✅ OPENAI_API_KEY
```

**Se faltar algum:** Settings → Secrets → Adicionar

---

### 🚀 PASSO 4: PowerShell - Deploy Functions (10 min)

```powershell
# No terminal do projeto, executar:
.\EXECUTAR_AGORA.ps1
```

**OU manualmente:**

```powershell
npx supabase functions deploy crm-ai-voice-call
npx supabase functions deploy crm-ai-voice-twiml
npx supabase functions deploy crm-ai-voice-webhook
npx supabase functions deploy crm-ai-voice-recording
```

---

## ✅ PRONTO! TESTAR AGORA

```
1. npm run dev
2. http://localhost:5173/growth-engine
3. Aba: AI Voice SDR → Configuração
4. Salvar agente
5. Aba: Chamadas → Nova Chamada
6. Testar! 📞
```

---

## 📋 AS 4 EDGE FUNCTIONS

| # | Nome | Função |
|---|------|--------|
| 1 | **crm-ai-voice-call** | Iniciar/gerenciar chamadas |
| 2 | **crm-ai-voice-twiml** | Handler TwiML (fluxo conversa) |
| 3 | **crm-ai-voice-webhook** | Status updates do Twilio |
| 4 | **crm-ai-voice-recording** | Processar gravações |

**Deploy:** Via terminal com `npx supabase functions deploy`

---

## 🎯 ARQUIVOS PARA APLICAR

### SQL (Copiar e colar no Supabase):
1. ✅ `01_APLICAR_MIGRATION_VOICE_AI.sql`
2. ✅ `02_CRIAR_BUCKET_STORAGE.sql`
3. ✅ `03_VERIFICAR_SECRETS.sql`

### PowerShell (Executar no terminal):
4. ✅ `EXECUTAR_AGORA.ps1`

**TOTAL: 4 arquivos, 20 minutos!**

---

**🚀 VAMOS LÁ! EXECUTE OS 4 PASSOS AGORA!**


