# ⚡ APLICAR AGORA - GROWTH ENGINE
## 5 Passos para 100% Funcional (30 minutos)

**Data:** 05/12/2025  
**Status:** ✅ Todas APIs já configuradas!  
**Tempo:** 30 minutos

---

## ✅ CONFIRMAÇÃO DE APIS

```
✅ ElevenLabs: JÁ TEM
✅ Twilio: JÁ TEM  
✅ OpenAI: JÁ TEM
```

**Excelente! Vamos direto para o deploy!**

---

## 📝 PASSO 1: APLICAR MIGRATION SQL (5 minutos)

### Copiar e executar no Supabase SQL Editor:

```sql
-- Abrir: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk
-- SQL Editor → New Query
-- Copiar TUDO abaixo e executar:
```

**Arquivo:** `supabase/migrations/20250205000001_ai_voice_agents_multi_tenant.sql`

👉 **Você mesmo copiará e colará este arquivo no Supabase!**

---

## 📦 PASSO 2: CRIAR STORAGE BUCKET (2 minutos)

### Executar no Supabase SQL Editor:

```sql
-- Criar bucket de storage para gravações de voz
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-recordings',
  'voice-recordings',
  true,
  52428800, -- 50 MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav']
)
ON CONFLICT (id) DO NOTHING;

-- Criar política de acesso público para leitura
CREATE POLICY IF NOT EXISTS "Public Access to voice recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-recordings');

-- Permitir uploads autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can upload voice recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-recordings');

-- Permitir updates autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can update voice recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'voice-recordings');
```

✅ **FEITO!** Bucket criado

---

## 🚀 PASSO 3: VERIFICAR SECRETS (2 minutos)

### Executar no Supabase SQL Editor para verificar:

```sql
-- Verificar quais secrets já existem
SELECT name, created_at 
FROM vault.decrypted_secrets 
WHERE name IN (
  'ELEVENLABS_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'OPENAI_API_KEY'
)
ORDER BY name;
```

**Se faltar algum:**
- Settings → Edge Functions → Secrets → Add Secret

---

## ⚙️ PASSO 4: DEPLOY EDGE FUNCTIONS (10 minutos)

### As 4 Edge Functions criadas:

1. ✅ `crm-ai-voice-call` - Gerenciador principal
2. ✅ `crm-ai-voice-twiml` - Handler TwiML
3. ✅ `crm-ai-voice-webhook` - Status updates
4. ✅ `crm-ai-voice-recording` - Processar gravações

### Opção A: Deploy via Terminal (RECOMENDADO)

```bash
# No terminal do projeto, executar:

npx supabase functions deploy crm-ai-voice-call
npx supabase functions deploy crm-ai-voice-twiml
npx supabase functions deploy crm-ai-voice-webhook
npx supabase functions deploy crm-ai-voice-recording

# Verificar deploy:
npx supabase functions list
```

### Opção B: Deploy Manual (se terminal não funcionar)

```
1. Supabase Dashboard → Edge Functions
2. Create a new function → crm-ai-voice-call
3. Copiar código de: supabase/functions/crm-ai-voice-call/index.ts
4. Deploy
5. Repetir para as outras 3 funções
```

**Eu recomendo Opção A (terminal) - mais rápido!**

---

## 🧪 PASSO 5: CONFIGURAR AGENTE E TESTAR (10 minutos)

### 5.1 Iniciar Aplicação

```bash
npm run dev
```

### 5.2 Configurar Agente

```
1. Acessar: http://localhost:5173/growth-engine
2. Clicar aba: "AI Voice SDR"
3. Sub-aba: "Configuração do Agente"
4. Preencher:

   Nome do Agente: "Assistente Virtual Stratevo"
   Personalidade: Profissional
   Voz: Bella (Feminina - BR)
   Estabilidade: 75%
   Naturalidade: 75%
   
   Script Saudação:
   "Olá! Sou o assistente virtual da Stratevo Intelligence. 
    Estamos entrando em contato sobre nossas soluções de 
    inteligência de vendas com IA. Você tem alguns minutos 
    para uma breve conversa?"
   
   Script Encerramento:
   "Foi um prazer conversar com você. Em breve um consultor 
    especializado entrará em contato para agendar uma 
    demonstração personalizada. Tenha um ótimo dia!"

5. Clicar "Salvar Configuração" ✅
```

### 5.3 Fazer Chamada de Teste

```
1. Sub-aba: "Chamadas"
2. Clicar: "Nova Chamada"
3. Telefone: +55 11 XXXXX-XXXX (SEU número de teste)
4. Clicar: "Iniciar Chamada"
5. Aguardar 10-30 segundos
6. Seu telefone deve tocar! 📞
7. Atender e conversar com o agente
8. Após encerrar, verificar:
   - Dashboard atualizado
   - Gravação disponível
   - Transcrição gerada
   - Sentimento calculado
```

---

## 📋 VALIDAÇÃO FINAL

### Se tudo funcionou:

```
✅ Tabelas criadas no banco
✅ Bucket de storage criado
✅ 4 Edge Functions deployadas
✅ Growth Engine acessível
✅ Agente configurado
✅ Chamada recebida
✅ Voz clara e natural
✅ Gravação salva
✅ Transcrição correta
✅ Sentimento calculado
```

**🎉 SISTEMA 100% OPERACIONAL!**

---

## 🎯 RESUMO ULTRA-RÁPIDO

```bash
# COPIAR E EXECUTAR:

# 1. Supabase SQL Editor (copiar migration completa)
# Ver arquivo: supabase/migrations/20250205000001_ai_voice_agents_multi_tenant.sql

# 2. Supabase SQL Editor (criar bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-recordings', 'voice-recordings', true);

# 3. Terminal (deploy functions)
npx supabase functions deploy crm-ai-voice-call
npx supabase functions deploy crm-ai-voice-twiml
npx supabase functions deploy crm-ai-voice-webhook
npx supabase functions deploy crm-ai-voice-recording

# 4. Iniciar app
npm run dev

# 5. Testar
http://localhost:5173/growth-engine
```

**TEMPO TOTAL: 30 MINUTOS** ⏱️

---

**🚀 PRONTO! SIGA ESTES 5 PASSOS E TERÁ 100% FUNCIONAL!**


