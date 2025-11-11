# 🎙️ PLAUD NOTEPIN - GUIA COMPLETO DE INTEGRAÇÃO

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Setup e Configuração](#setup-e-configuração)
4. [Webhook Integration](#webhook-integration)
5. [Importação Manual](#importação-manual)
6. [Features Implementadas](#features-implementadas)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

A integração com **Plaud NotePin** transforma o STRATEVO Intelligence 360° em uma plataforma completa de **Sales Coaching com IA**.

### ✨ O que faz?

- 🎙️ **Recebe transcrições** automáticas via webhook
- 🤖 **Analisa com GPT-4o** para extrair insights
- 📊 **Gera métricas** de performance (talk time, perguntas, objeções)
- 🎯 **Cria action items** automaticamente
- 💡 **Detecta oportunidades** de cross-sell/upsell
- 📈 **Coaching em tempo real** com recomendações de IA
- 🏆 **Dashboard analítico** para gestores

---

## 🏗️ ARQUITETURA

```
┌─────────────────┐
│  Plaud NotePin  │
│   (Hardware)    │
└────────┬────────┘
         │ Grava call
         │ Transcreve com IA
         ▼
┌─────────────────────────┐
│   Plaud Cloud Service   │
└────────┬────────────────┘
         │ Webhook POST
         ▼
┌──────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTION                  │
│  plaud-webhook-receiver                  │
│                                          │
│  1. Valida payload                       │
│  2. Analisa com OpenAI GPT-4o           │
│  3. Calcula métricas de coaching        │
│  4. Salva no banco de dados             │
│  5. Cria action items automaticamente   │
│  6. Gera recomendações de coaching      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│           SUPABASE DATABASE              │
│                                          │
│  • call_recordings                       │
│  • sales_coaching_recommendations        │
│  • call_analytics                        │
│  • plaud_webhook_logs                    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│          REACT FRONTEND                  │
│                                          │
│  • CallRecordingsTab                     │
│  • SalesCoachingDashboard                │
│  • ImportPlaudRecording (manual)         │
└──────────────────────────────────────────┘
```

---

## ⚙️ SETUP E CONFIGURAÇÃO

### 1️⃣ **Aplicar Migration no Supabase**

```bash
# Conectar ao projeto Supabase
cd c:\Projects\olv-intelligence-prospect-v2

# Aplicar migration
supabase db push
```

Ou execute manualmente no **Supabase SQL Editor**:
```sql
-- Execute o arquivo:
-- supabase/migrations/20251111120000_plaud_integration.sql
```

### 2️⃣ **Deploy da Edge Function**

```bash
# Deploy da função webhook
supabase functions deploy plaud-webhook-receiver

# Verificar logs
supabase functions logs plaud-webhook-receiver
```

### 3️⃣ **Configurar Secrets no Supabase**

No **Supabase Dashboard** → Project Settings → Edge Functions → Secrets:

```bash
# OpenAI API Key (obrigatório para análise)
OPENAI_API_KEY=sk-proj-...

# As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY 
# já estão disponíveis automaticamente nas Edge Functions
```

### 4️⃣ **Obter URL do Webhook**

Após o deploy, sua URL será:

```
https://[seu-projeto-id].supabase.co/functions/v1/plaud-webhook-receiver
```

Exemplo:
```
https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/plaud-webhook-receiver
```

---

## 🔗 WEBHOOK INTEGRATION

### **Configurar Webhook no Plaud App**

1. Abra o **Plaud App** (iOS/Android)
2. Vá em **Settings** → **Integrations** → **Webhooks**
3. Clique em **Add Webhook**
4. Cole a URL da Edge Function:
   ```
   https://[seu-projeto-id].supabase.co/functions/v1/plaud-webhook-receiver
   ```
5. Selecione evento: **"Recording Transcribed"**
6. Salve a configuração

### **Formato do Payload**

O Plaud envia este JSON quando uma gravação é transcrita:

```json
{
  "recording_id": "plaud_rec_abc123",
  "recording_url": "https://plaud.ai/recordings/abc123.mp3",
  "recording_date": "2025-11-11T14:30:00Z",
  "duration_seconds": 900,
  "transcript": "Olá, bom dia! Como posso ajudá-lo hoje?...",
  "summary": "Cliente interessado em renovação do contrato...",
  "language": "pt-BR",
  "speakers": [
    {
      "name": "João (Vendedor)",
      "duration_seconds": 360
    },
    {
      "name": "Maria (Cliente)",
      "duration_seconds": 540
    }
  ],
  "metadata": {
    "company_name": "Metalife Indústria",
    "company_cnpj": "12.345.678/0001-90",
    "deal_id": "uuid-do-deal",
    "tags": ["renovação", "pilates"]
  }
}
```

### **Metadata Opcional (Recomendado)**

Para vincular automaticamente a call a uma empresa/deal, adicione metadata:

```json
{
  "metadata": {
    "company_cnpj": "12.345.678/0001-90",
    "deal_id": "uuid-do-deal-no-stratevo"
  }
}
```

---

## 📥 IMPORTAÇÃO MANUAL

Se você não configurou o webhook, pode importar transcrições manualmente:

### **Como Usar:**

1. No STRATEVO, abra a **página da empresa** ou **deal**
2. Clique em **"📱 Importar Call Plaud"**
3. Cole a transcrição da call
4. Informe data e duração
5. Clique em **"Analisar com IA"**

A IA vai extrair automaticamente:
- ✅ Resumo da conversa
- ✅ Action items com prazos
- ✅ Análise de sentimento
- ✅ Objeções levantadas
- ✅ Oportunidades de cross-sell
- ✅ Recomendações de coaching

---

## 🚀 FEATURES IMPLEMENTADAS

### **1. Análise Automática com IA** 🤖

**Tecnologia:** OpenAI GPT-4o

**Extrai:**
- 📝 Resumo conciso (2-3 frases)
- 🏷️ Tópicos principais (keywords)
- 😊😐😟 Sentimento geral (-1.0 a 1.0)
- ✅ Action items com prioridade
- ⚠️ Objeções e como foram tratadas
- 💡 Oportunidades de negócio
- 🎯 Sinais de compra e risco

---

### **2. Métricas de Coaching** 📊

**Calculado automaticamente:**

| Métrica | Ideal | Descrição |
|---------|-------|-----------|
| **Talk Time Ratio** | 30-40% | % do tempo que o vendedor fala |
| **Perguntas Feitas** | 10-15 | Número de perguntas de descoberta |
| **Objection Handling** | >70% | Efetividade ao tratar objeções |
| **Closing Attempts** | 2-3 | Tentativas de avançar o deal |

---

### **3. Action Items Automáticos** ✅

Cada action item extraído gera automaticamente uma **task no STRATEVO**:

```typescript
// Exemplo de action item gerado:
{
  task: "Enviar proposta comercial com desconto de 15%",
  assignee: "João Silva",
  due_date: "2025-11-15",
  priority: "high",
  context: "Cliente solicitou proposta até sexta-feira"
}
```

Estas tasks aparecem em:
- 📋 **Smart Tasks** do deal
- 📅 **Timeline** do deal
- ✉️ **Notificações** por email

---

### **4. Recomendações de Coaching** 🏆

A IA gera recomendações personalizadas baseadas na performance:

#### **Tipos de Recomendações:**

1. **Talk Time** 🗣️
   - "Você está falando demais" (se >60%)
   - "Você pode falar mais" (se <25%)

2. **Discovery Questions** ❓
   - "Faça mais perguntas de descoberta"
   - Sugestão: Usar SPIN Selling

3. **Objection Handling** ⚠️
   - "Melhore o tratamento de objeções"
   - Sugestão: Técnica LAER

4. **Closing Technique** 🎯
   - "Nenhuma tentativa de fechamento"
   - Sugestão: Sempre termine com next step

5. **Active Listening** 👂
   - "Cliente demonstrou insatisfação"
   - Sugestão: Follow-up rápido

6. **Value Proposition** 💎
   - "Oportunidades detectadas"
   - Sugestão: Preparar proposta específica

---

### **5. Dashboard de Performance** 📈

Localização: **Menu → Sales Coaching**

**3 Abas:**

#### 📋 **Recomendações**
- Lista de coaching tips da IA
- Prioridade (critical/warning/info)
- Ações sugeridas
- Status (lida/pendente)

#### 🏆 **Pontos Fortes**
- O que você está fazendo bem
- Métricas acima da média
- Reconhecimento de boas práticas

#### 🎯 **Áreas de Melhoria**
- O que precisa desenvolver
- Comparativo com ideal
- Plano de ação sugerido

---

### **6. Call Recordings Tab** 🎙️

Adicionada em **Company Detail Page** e **Deal Details**.

**Mostra:**
- 📅 Data e duração da call
- 😊😐😟 Sentimento detectado
- 🏷️ Tópicos principais
- ✅ Action items criados
- 💡 Oportunidades detectadas
- ⚠️ Objeções levantadas
- 🎯 Sinais de compra/risco
- 📝 Transcrição completa

---

### **7. Automações Inteligentes** ⚡

#### **Triggers Automáticos:**

```sql
-- 1. Auto-criar tasks de action items
CREATE TRIGGER trigger_auto_create_tasks_from_call

-- 2. Atualizar deal baseado em sentimento
CREATE TRIGGER trigger_update_deal_from_call_sentiment
```

#### **Comportamentos:**

✅ **Sentimento Positivo (>0.7) + Buying Signals:**
- Deal prioridade → **HIGH**
- Notificação para gerente

⚠️ **Sentimento Negativo (<-0.5):**
- Cria alerta no timeline
- Sugere follow-up urgente

💰 **Oportunidades Detectadas:**
- Cria deal secundário (upsell/cross-sell)
- Atribui para mesmo vendedor

---

## 📚 API REFERENCE

### **PlaudAnalyzer Service**

```typescript
import { analyzeAndSaveCall } from '@/services/plaudAnalyzer';

// Analisar e salvar call
const result = await analyzeAndSaveCall({
  plaud_recording_id: 'rec_123',
  transcript: 'transcrição completa...',
  recording_date: '2025-11-11T14:30:00Z',
  duration_seconds: 900,
  company_id: 'uuid-empresa',
  deal_id: 'uuid-deal'
}, userId);

// Retorna: { id: string, analysis: CallAnalysisResult }
```

### **Componentes React**

```tsx
import { ImportPlaudRecording } from '@/components/plaud/ImportPlaudRecording';
import { CallRecordingsTab } from '@/components/plaud/CallRecordingsTab';

// Importação manual
<ImportPlaudRecording 
  open={open}
  onOpenChange={setOpen}
  companyId="uuid"
  dealId="uuid"
  onSuccess={(callRecordingId) => console.log('Saved!', callRecordingId)}
/>

// Visualizar gravações
<CallRecordingsTab 
  companyId="uuid" 
  dealId="uuid" 
/>
```

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Webhook não está sendo recebido**

**Solução:**
```bash
# 1. Verificar logs da Edge Function
supabase functions logs plaud-webhook-receiver --tail

# 2. Testar manualmente com curl
curl -X POST https://[seu-projeto].supabase.co/functions/v1/plaud-webhook-receiver \
  -H "Content-Type: application/json" \
  -d '{"recording_id": "test", "transcript": "Teste de transcrição"}'
```

**Verificar:**
- ✅ URL do webhook está correta no Plaud App
- ✅ Edge Function foi deployada com sucesso
- ✅ OpenAI API key está configurada nos Secrets

---

### **Problema 2: IA não está analisando**

**Erro comum:**
```
Error: OpenAI API key not configured
```

**Solução:**
```bash
# Configurar secret no Supabase
supabase secrets set OPENAI_API_KEY=sk-proj-...

# Re-deploy da função
supabase functions deploy plaud-webhook-receiver
```

---

### **Problema 3: Action items não estão sendo criados**

**Verificar:**
1. Tabela `smart_tasks` existe?
2. Trigger está ativo?

```sql
-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_create_tasks_from_call';

-- Verificar action items
SELECT action_items FROM call_recordings WHERE id = 'uuid-da-call';
```

---

### **Problema 4: Importação manual não funciona**

**Erro comum:**
```
Error: User not authenticated
```

**Solução:**
- Usuário deve estar logado no STRATEVO
- Verificar se `auth.uid()` retorna valor válido

```typescript
// Verificar autenticação
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.id);
```

---

## 🎓 BEST PRACTICES

### **1. Metadata nas Gravações**

Sempre que possível, adicione metadata ao gravar:

```json
{
  "metadata": {
    "company_cnpj": "12.345.678/0001-90",
    "deal_id": "uuid-deal",
    "tags": ["demo", "decisor-presente"]
  }
}
```

Isso permite:
- ✅ Auto-vinculação com empresa/deal
- ✅ Métricas mais precisas
- ✅ Relatórios segmentados

---

### **2. Revisar Coaching Recommendations**

Os vendedores devem:
1. **Acessar** o Sales Coaching Dashboard semanalmente
2. **Reconhecer** as recomendações (marcar como lida)
3. **Implementar** as sugestões em próximas calls
4. **Comparar** métricas before/after

---

### **3. Gestores: Monitorar Trends**

Use os dados para:
- 📊 Identificar padrões de win/loss
- 🏆 Reconhecer top performers
- 🎯 Treinar vendedores com dificuldades
- 📈 Medir ROI do coaching

---

## 📞 SUPORTE

**Issues/Bugs:** Abra issue no GitHub

**Dúvidas:** marcos.oliveira@olv.com.br

**Documentação Plaud:** https://plaud.ai/docs

---

## 🚀 PRÓXIMOS PASSOS (Roadmap)

- [ ] **Win/Loss Analysis:** Correlação entre métricas e deals fechados
- [ ] **Team Leaderboard:** Ranking de performance entre vendedores
- [ ] **AI Script Generator:** IA gera scripts personalizados por segmento
- [ ] **Real-time Coaching:** Alertas durante a call (via smartwatch?)
- [ ] **Multilingual Support:** Análise em inglês, espanhol, etc.
- [ ] **Voice Sentiment:** Análise do tom de voz (além do texto)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Schema de banco de dados criado
- [x] Edge Function deployada
- [x] Serviço PlaudAnalyzer com IA
- [x] Componente ImportPlaudRecording
- [x] CallRecordingsTab
- [x] Sales Coaching Dashboard
- [x] Automações (triggers)
- [x] Análise de sentimento
- [x] Win/loss patterns
- [x] Documentação completa

---

## 🎉 CONCLUSÃO

A integração com **Plaud NotePin** transforma o STRATEVO em uma plataforma de **Sales Enablement de classe mundial**, combinando:

- 🎙️ **Hardware dedicado** (Plaud NotePin)
- 🤖 **IA avançada** (GPT-4o)
- 📊 **Analytics profundo** (métricas de coaching)
- ⚡ **Automações inteligentes** (action items, alerts)
- 🏆 **Coaching personalizado** (recomendações em tempo real)

**Resultado:** Vendedores mais preparados, deals fechados mais rápido, receita crescendo! 🚀

---

**Última atualização:** 2025-11-11  
**Versão:** 1.0.0  
**Autor:** STRATEVO Intelligence Team

