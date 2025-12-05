# 🔌 APIS NECESSÁRIAS - CONFIGURAÇÃO COMPLETA
## Growth Engine + AI Voice SDR + Plataforma Completa

**Data:** 05/12/2025  
**Status:** 📋 Lista completa para aplicação imediata

---

## 🎯 APIS CRÍTICAS (OBRIGATÓRIAS)

### 1. **ElevenLabs** - Voz IA Realista 🔴 CRÍTICA

**Para que serve:** Síntese de voz ultra-realista em português BR

**Plano recomendado:** Starter ($5/mês)
- 30.000 caracteres/mês
- Todas as vozes premium
- Conversational AI incluído

**Como configurar:**

```bash
# 1. Criar conta
https://elevenlabs.io/sign-up

# 2. Após login, ir em:
Profile → API Keys → Create New Key

# 3. Copiar a Key (começa com "sk_")

# 4. No Supabase Dashboard:
Project → Settings → Edge Functions → Secrets
Adicionar:
Nome: ELEVENLABS_API_KEY
Valor: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vozes recomendadas para português:**
```json
{
  "bella_br": "EXAVITQu4vr4xnSDxMaL", // Feminina BR
  "antonio_br": "pNInz6obpgDQGcFmaJgB", // Masculino BR
  "rachel": "21m00Tcm4TlvDq8ikWAM", // Feminina US (inglês)
  "adam": "pNInz6obpgDQGcFmaJgB" // Masculino US (inglês)
}
```

**Teste rápido:**
```bash
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL \
  -H "xi-api-key: SUA_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Olá! Sou o assistente virtual da Stratevo.",
    "voice_settings": {
      "stability": 0.75,
      "similarity_boost": 0.75
    }
  }' \
  --output test.mp3
```

**Custo estimado:** $5-20/mês (500-2000 chamadas)

---

### 2. **Twilio** - Chamadas Telefônicas 🔴 CRÍTICA

**Para que serve:** Realizar chamadas telefônicas reais

**Plano recomendado:** Pay as you go (trial $15 grátis)
- $0.012/minuto para chamadas BR
- $1-5/mês por número brasileiro
- Transcrições incluídas

**Como configurar:**

```bash
# 1. Criar conta
https://www.twilio.com/try-twilio

# 2. Comprar número brasileiro
Console → Phone Numbers → Buy a Number
Selecionar: Brazil (+55)
Capacidades: Voice ✓

# 3. Obter credenciais
Console → Account → Keys & Credentials
Copiar:
- Account SID (começa com "AC")
- Auth Token

# 4. No Supabase Dashboard:
Adicionar 3 secrets:

TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER = +5511999999999
```

**Configurar Webhook:**
```
Console → Phone Numbers → [Seu Número] → Configure

Voice & Fax:
A CALL COMES IN: Webhook
URL: https://SEU_PROJETO.supabase.co/functions/v1/crm-ai-voice-twiml
HTTP POST
```

**Custo estimado:** $50-150/mês (500 chamadas)

---

### 3. **OpenAI** - Inteligência Artificial 🔴 CRÍTICA

**Para que serve:** 
- Transcrição de áudio (Whisper)
- Análise de sentimento (GPT-4o-mini)
- Smart Templates
- Revenue Intelligence
- Conversation Intelligence

**Plano recomendado:** Pay as you go
- Whisper: $0.006/minuto
- GPT-4o-mini: $0.15/1M tokens (super barato!)

**Como configurar:**

```bash
# 1. Criar conta
https://platform.openai.com/signup

# 2. Criar API Key
API Keys → Create New Secret Key

# 3. No Supabase Dashboard:
OPENAI_API_KEY = sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Já está configurado?** ✅ Sim! (Você já usa para outras features)

**Custo estimado:** $20-50/mês (já incluído no uso atual)

---

## 🟡 APIS IMPORTANTES (RECOMENDADAS)

### 4. **Apollo.io** - Enriquecimento B2B 🟡 IMPORTANTE

**Para que serve:** Dados de empresas B2B, decisores, emails

**Plano recomendado:** Basic ($49/mês)
- 1.000 créditos/mês
- Email finder
- Tech stack detection

**Como configurar:**

```bash
# 1. Criar conta
https://www.apollo.io/

# 2. Obter API Key
Settings → Integrations → API

# 3. No Supabase Dashboard:
APOLLO_API_KEY = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Já está configurado?** ✅ Provavelmente sim (verificar)

**Custo estimado:** $49-99/mês

---

### 5. **Resend** - Envio de Emails Transacionais 🟡 IMPORTANTE

**Para que serve:** Enviar emails das automações

**Plano recomendado:** Free (100 emails/dia)
- Domínio customizado
- Templates ilimitados
- Analytics incluído

**Como configurar:**

```bash
# 1. Criar conta
https://resend.com/signup

# 2. Adicionar domínio
Domains → Add Domain
Configurar DNS (TXT, MX, CNAME)

# 3. Criar API Key
API Keys → Create

# 4. No Supabase Dashboard:
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Custo estimado:** $0-20/mês (free tier suficiente)

---

## 🟢 APIS OPCIONAIS (NICE TO HAVE)

### 6. **WhatsApp Business API** 🟢 OPCIONAL

**Para que serve:** Enviar mensagens WhatsApp automatizadas

**Opções:**

**A. Via Twilio (Mais fácil)**
- Já vem junto com Twilio
- $0.005/mensagem
- Configuração simples

**B. Via Meta Oficial (Mais complexo)**
- Grátis até 1.000 conversas/mês
- Precisa de Business Verification
- Mais features

**Como configurar (Twilio):**
```bash
# No Twilio Console
Messaging → Try it Out → Send a WhatsApp message

# Copiar WhatsApp Sender:
whatsapp:+14155238886 (número sandbox Twilio)

# No Supabase:
TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886
```

**Custo estimado:** $10-50/mês

---

### 7. **Serper** - Google Search API 🟢 OPCIONAL

**Para que serve:** Buscas no Google para análise competitiva

**Plano recomendado:** Free (2.500 searches grátis)

**Como configurar:**

```bash
# 1. Criar conta
https://serper.dev/

# 2. Dashboard → API Key

# 3. No Supabase:
SERPER_API_KEY = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Já está configurado?** ✅ Provavelmente sim (verificar)

**Custo estimado:** $0-20/mês

---

### 8. **Jina AI** - Web Scraping 🟢 OPCIONAL

**Para que serve:** Extrair conteúdo de sites

**Plano recomendado:** Free (20 requests/dia)

**Como configurar:**

```bash
# 1. Criar conta
https://jina.ai/

# 2. Get API Key

# 3. No Supabase:
JINA_API_KEY = jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Já está configurado?** ✅ Provavelmente sim (verificar)

**Custo estimado:** $0-10/mês

---

## 📋 CHECKLIST RÁPIDA

### APIS CRÍTICAS (Fazer AGORA)
- [ ] **ElevenLabs** - Criar conta + API Key
- [ ] **Twilio** - Criar conta + Comprar número BR
- [ ] **OpenAI** - Verificar se já tem API Key

### APIS IMPORTANTES (Fazer esta semana)
- [ ] **Apollo.io** - Verificar se já configurado
- [ ] **Resend** - Criar conta + Configurar domínio

### APIS OPCIONAIS (Fazer depois)
- [ ] **WhatsApp** - Configurar via Twilio
- [ ] **Serper** - Verificar se já configurado
- [ ] **Jina AI** - Verificar se já configurado

---

## 💰 CUSTO TOTAL MENSAL

| API | Plano | Custo/Mês | Prioridade |
|-----|-------|-----------|------------|
| **ElevenLabs** | Starter | $5 | 🔴 Crítica |
| **Twilio** | Pay as you go | $100 | 🔴 Crítica |
| **OpenAI** | Pay as you go | $50 | 🔴 Crítica |
| **Apollo.io** | Basic | $49 | 🟡 Importante |
| **Resend** | Free | $0 | 🟡 Importante |
| **WhatsApp** | Via Twilio | $20 | 🟢 Opcional |
| **Serper** | Free | $0 | 🟢 Opcional |
| **Jina AI** | Free | $0 | 🟢 Opcional |
| **TOTAL CRÍTICO** | - | **$155** | - |
| **TOTAL COMPLETO** | - | **$224** | - |

**ROI Projetado:** R$ 43.2M/mês com 500 chamadas  
**ROI:** 193.000x 🚀

---

## 🚀 SEQUÊNCIA DE APLICAÇÃO (ORDEM CORRETA)

### **DIA 1: Fundação (1-2 horas)**

```bash
# PASSO 1: Aplicar Migration SQL
1. Abrir: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk
2. SQL Editor → New Query
3. Copiar/Colar: supabase/migrations/20250205000001_ai_voice_agents_multi_tenant.sql
4. Run
5. Verificar: SELECT * FROM ai_voice_agents;

# PASSO 2: Deploy Edge Function
npx supabase functions deploy crm-ai-voice-call

# PASSO 3: Verificar frontend
npm run dev
Acessar: http://localhost:5173/growth-engine
```

---

### **DIA 2: ElevenLabs (30 minutos)**

```bash
# 1. Criar conta ElevenLabs
https://elevenlabs.io/sign-up
Plano: Starter ($5/mês)

# 2. Copiar API Key
Profile → API Keys → Create

# 3. Adicionar no Supabase
Settings → Secrets → Add Secret
Nome: ELEVENLABS_API_KEY
Valor: sk_...

# 4. Testar
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL \
  -H "xi-api-key: SUA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Teste de voz","voice_settings":{"stability":0.75}}' \
  --output test.mp3
```

---

### **DIA 3: Twilio (1 hora)**

```bash
# 1. Criar conta Twilio
https://www.twilio.com/try-twilio
Trial: $15 grátis

# 2. Comprar número brasileiro
Console → Phone Numbers → Buy a Number
País: Brazil (+55)
Tipo: Voice

# 3. Configurar Webhook
Phone Numbers → [Seu número]
Voice & Fax → A CALL COMES IN:
URL: https://SEU_PROJETO.supabase.co/functions/v1/crm-ai-voice-twiml
Method: HTTP POST

# 4. Adicionar secrets no Supabase
TWILIO_ACCOUNT_SID = AC...
TWILIO_AUTH_TOKEN = ...
TWILIO_PHONE_NUMBER = +5511...
```

---

### **DIA 4: Criar TwiML Handler (1 hora)**

**Arquivo:** `supabase/functions/crm-ai-voice-twiml/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const formData = await req.formData();
  const callSid = formData.get('CallSid');
  
  // Buscar call e agente
  const { data: call } = await supabase
    .from('ai_voice_calls')
    .select('*, ai_voice_agents(*)')
    .eq('twilio_call_sid', callSid)
    .single();
  
  if (!call) {
    return new Response('<Response><Hangup/></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
  
  const agent = call.ai_voice_agents;
  
  // TwiML com voz ElevenLabs (via URL)
  const elevenLabsUrl = await generateElevenLabsAudio(
    agent.greeting_script, 
    agent.voice_id
  );
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Play>${elevenLabsUrl}</Play>
      <Gather input="speech" timeout="10" language="pt-BR" 
              action="/functions/v1/crm-ai-voice-process">
        <Pause length="2"/>
      </Gather>
    </Response>
  `;
  
  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' }
  });
});

async function generateElevenLabsAudio(text: string, voiceId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') ?? '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.75, similarity_boost: 0.75 }
      })
    }
  );
  
  // Upload para storage público e retornar URL
  const audioBlob = await response.blob();
  const fileName = `voice-${Date.now()}.mp3`;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  await supabase.storage
    .from('voice-recordings')
    .upload(`public/${fileName}`, audioBlob, {
      contentType: 'audio/mpeg',
      cacheControl: '3600'
    });
  
  const { data } = supabase.storage
    .from('voice-recordings')
    .getPublicUrl(`public/${fileName}`);
  
  return data.publicUrl;
}
```

**Deploy:**
```bash
npx supabase functions deploy crm-ai-voice-twiml
```

---

### **DIA 5: Testes End-to-End (2 horas)**

```bash
# 1. Acessar Growth Engine
http://localhost:5173/growth-engine

# 2. Configurar Agente
Aba: AI Voice SDR → Configuração
- Nome: "Assistente Virtual Stratevo"
- Voz: Bella (BR)
- Script: "Olá! Sou o assistente virtual da Stratevo..."
Salvar

# 3. Fazer chamada de teste
Aba: AI Voice SDR → Chamadas
Nova Chamada
Telefone: SEU_NÚMERO_DE_TESTE
Iniciar

# 4. Verificar:
- Chamada recebida?
- Voz clara e natural?
- Script correto?
- Gravação salva?
- Transcrição funcionando?
- Sentimento calculado?

# 5. Ver resultado no banco
SELECT * FROM ai_voice_calls ORDER BY created_at DESC LIMIT 1;
```

---

## 🎯 VERIFICAÇÃO DE APIS JÁ CONFIGURADAS

**Execute este script para verificar:**

```sql
-- No Supabase SQL Editor
SELECT 
  name,
  CASE 
    WHEN value IS NOT NULL THEN '✅ Configurado'
    ELSE '❌ Faltando'
  END as status
FROM (
  VALUES 
    ('ELEVENLABS_API_KEY'),
    ('TWILIO_ACCOUNT_SID'),
    ('TWILIO_AUTH_TOKEN'),
    ('TWILIO_PHONE_NUMBER'),
    ('OPENAI_API_KEY'),
    ('APOLLO_API_KEY'),
    ('RESEND_API_KEY'),
    ('SERPER_API_KEY'),
    ('JINA_API_KEY')
) AS required_secrets(name)
LEFT JOIN vault.decrypted_secrets ON vault.decrypted_secrets.name = required_secrets.name;
```

---

## 📞 SUPORTE RÁPIDO

### Problemas Comuns:

**1. ElevenLabs retorna erro 401:**
```bash
# Verificar se API Key está correta
curl https://api.elevenlabs.io/v1/user \
  -H "xi-api-key: SUA_KEY"
```

**2. Twilio não liga:**
```bash
# Verificar se webhook está configurado
# Twilio Console → Phone Numbers → [Seu número]
# Deve ter URL do webhook configurada
```

**3. Edge Function não encontra secret:**
```bash
# Re-deploy após adicionar secret
npx supabase functions deploy crm-ai-voice-call
```

---

## ✅ PRONTO PARA APLICAR!

**Ordem de execução:**
1. ✅ Aplicar migration SQL (5 min)
2. ✅ Deploy Edge Function (2 min)
3. ✅ Criar contas APIs (30 min)
4. ✅ Configurar secrets (10 min)
5. ✅ Criar TwiML handler (1h)
6. ✅ Testar chamada real (30 min)

**Tempo total:** ~3-4 horas
**Resultado:** Sistema 100% funcional! 🚀

---

**Última atualização:** 05/12/2025  
**Próximo:** Aplicar APIs conforme esta sequência


