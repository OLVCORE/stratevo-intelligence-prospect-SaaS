# 🎯 Interface de Chat com Toggle VOZ/TEXTO - Implementação Completa

**Data:** 2025-01-22  
**Status:** ✅ Implementado  
**Componentes:** ChatInterface, VoiceChatController, Edge Functions

---

## 📋 Sumário

Interface de chat completa com dois modos:
- **MODO TEXTO:** Input tradicional + envio por Enter
- **MODO VOZ:** Microfone + ElevenLabs Conversational AI

Ambos os modos capturam leads automaticamente usando hooks de captura.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│      ChatInterface.tsx              │
│  ┌──────────┐  ┌──────────┐        │
│  │   VOZ    │  │  TEXTO   │        │ ← Toggle
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  VoiceChatController       │   │ ← Modo Voz
│  │  (ElevenLabs)              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Input + Send Button        │   │ ← Modo Texto
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ useVoiceLead    │  │ useTextLead     │
│ Capture         │  │ Capture         │
└─────────────────┘  └─────────────────┘
         │                    │
         └──────────┬─────────┘
                    ▼
         ┌──────────────────┐
         │  leads (table)    │
         └──────────────────┘
```

---

## 📁 Arquivos Criados

### Frontend

1. **`src/components/chat/ChatInterface.tsx`**
   - Componente principal com toggle VOZ/TEXTO
   - Design dourado/verde escuro conforme Espaço Olinda
   - Integração com hooks de captura

2. **`src/components/chat/VoiceChatController.tsx`**
   - Controle de gravação de áudio
   - Integração com ElevenLabs
   - Processamento de transcrições

### Backend

3. **`supabase/functions/chat-ai/index.ts`**
   - Edge Function para respostas do assistente (modo texto)
   - Usa OpenAI GPT-4o-mini
   - Mantém contexto da conversa

4. **`supabase/functions/elevenlabs-conversation/index.ts`**
   - Edge Function para processar áudio (modo voz)
   - Integração com ElevenLabs Conversational AI
   - Extração de entidades

### Database

5. **`supabase/migrations/20250122000027_chat_sessions_and_messages.sql`**
   - Tabela `chat_sessions` (sessões de conversa)
   - Tabela `chat_messages` (mensagens)
   - RLS policies multi-tenant
   - Triggers automáticos

---

## 🚀 Passos de Implementação

### 1. Executar Migration

```sql
-- No Supabase SQL Editor, execute:
-- supabase/migrations/20250122000027_chat_sessions_and_messages.sql
```

### 2. Deploy Edge Functions

```powershell
.\DEPLOY_CHAT_INTERFACE.ps1
```

Ou manualmente:

```powershell
npx supabase functions deploy chat-ai --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
npx supabase functions deploy elevenlabs-conversation --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

### 3. Configurar Secrets

No Supabase Dashboard → Settings → Edge Functions → Secrets:

| Secret | Descrição | Obrigatório para |
|--------|-----------|------------------|
| `OPENAI_API_KEY` | Chave da OpenAI | Modo TEXTO |
| `ELEVENLABS_API_KEY` | Chave da ElevenLabs | Modo VOZ |
| `ELEVENLABS_AGENT_ID` | ID do agente (opcional) | Modo VOZ |

**Como obter:**

- **OpenAI:** https://platform.openai.com/api-keys
- **ElevenLabs:** https://elevenlabs.io/app/settings/api-keys

### 4. Testar Interface

1. Acesse: `http://localhost:5174/`
2. O chat aparece no canto inferior direito
3. Teste modo TEXTO:
   - Digite: "Quero agendar um casamento"
   - Verifique resposta do assistente
4. Teste modo VOZ:
   - Clique em "VOZ"
   - Clique no microfone
   - Fale: "Meu nome é Fernando Silva"
   - Verifique transcrição e resposta

---

## 🎨 Design Visual

### Cores

- **Header:** `#D4AF37` (dourado)
- **Fundo:** `#2C3E36` (verde escuro)
- **Botão VOZ ativo:** `#4FC3F7` (azul claro)
- **Mensagens usuário:** `#D4AF37` (dourado)
- **Mensagens assistente:** `#1a2520` (verde mais escuro)

### Layout

```
┌─────────────────────────────────┐
│ 🤖 Lian - Assistente Virtual   │ ← Header dourado
│    Espaço Olinda                │
├─────────────────────────────────┤
│                                 │
│ [Mensagens do chat]             │ ← Área de mensagens
│                                 │
├─────────────────────────────────┤
│  [  VOZ  ] [TEXTO]              │ ← Toggle
├─────────────────────────────────┤
│ [Input ou Microfone]            │ ← Input área
└─────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados

### Modo TEXTO

```
Usuário digita → handleSendMessage() →
  ↓
Salva em chat_messages (role: user) →
  ↓
textCapture.processMessage() → Extrai dados →
  ↓
Chama chat-ai Edge Function →
  ↓
Salva resposta em chat_messages (role: assistant) →
  ↓
textCapture.processMessage() → Atualiza lead
```

### Modo VOZ

```
Usuário fala → VoiceChatController → Grava áudio →
  ↓
Envia para elevenlabs-conversation →
  ↓
Recebe transcrição + resposta de voz →
  ↓
handleVoiceMessage() → Adiciona à UI →
  ↓
voiceCapture.processTranscript() → Extrai dados →
  ↓
Salva em chat_messages → Atualiza lead
```

---

## ✅ Checklist de Testes

- [ ] **Teste 1:** Modo TEXTO - Enviar mensagem
  - Digite: "Quero agendar um evento"
  - Verifique: Resposta do assistente aparece
  - Verifique: Mensagem salva em `chat_messages`

- [ ] **Teste 2:** Modo TEXTO - Captura de dados
  - Digite: "Meu nome é João Silva, email joao@teste.com"
  - Verifique: Lead criado/atualizado em `leads`
  - Verifique: Sessão vinculada ao lead

- [ ] **Teste 3:** Modo VOZ - Gravação
  - Clique em "VOZ"
  - Clique no microfone
  - Fale: "Quero agendar um casamento"
  - Verifique: Transcrição aparece na UI

- [ ] **Teste 4:** Modo VOZ - Captura de dados
  - Fale: "Meu nome é Maria, telefone 11 98765-4321"
  - Verifique: Lead criado/atualizado
  - Verifique: Dados capturados corretamente

- [ ] **Teste 5:** Alternância de modos
  - Inicie no modo TEXTO
  - Digite: "Quero agendar"
  - Mude para VOZ
  - Fale: "Para 150 pessoas"
  - Verifique: Sessão mantida, lead atualizado

- [ ] **Teste 6:** Sessão órfã (recuperação)
  - Force erro no salvamento
  - Verifique: Sessão criada sem lead_id
  - Execute: `recover-orphan-leads`
  - Verifique: Lead recuperado e vinculado

---

## 🐛 Solução de Problemas

| Problema | Causa | Solução |
|----------|-------|---------|
| **Microfone não funciona** | Permissão negada | Solicitar permissão no navegador |
| **Sem resposta de voz** | ELEVENLABS_API_KEY incorreta | Verificar secret no Supabase |
| **Lead não é criado** | Hook não vinculado | Verificar `sessionId` no hook |
| **Mensagens não salvam** | Erro no Supabase | Verificar RLS policies |
| **Toggle não funciona** | Estado não atualizado | Verificar `setMode()` |
| **Erro 400 na Edge Function** | Secret não configurado | Configurar OPENAI_API_KEY ou ELEVENLABS_API_KEY |

---

## 📊 Métricas de Sucesso

Após implementação, você deve ter:

- ✅ **0% de perda de leads** (sistema anti-perda ativo)
- ✅ **100% de sessões vinculadas** (após CRON)
- ✅ **< 2s de latência** (resposta do assistente)
- ✅ **Captura automática** de nome, telefone, email, evento, data, convidados

---

## 🔗 Arquivos Relacionados

- `docs/SISTEMA_ANTI_PERDA_LEADS_STRATEVO.md` - Documentação completa do sistema
- `src/hooks/useTextLeadCapture.tsx` - Hook de captura texto
- `src/hooks/useVoiceLeadCapture.tsx` - Hook de captura voz
- `supabase/functions/recover-orphan-leads/index.ts` - Recuperação automática

---

**Documentação criada por:** Sistema Lovable AI  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso

