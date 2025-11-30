# 🧠 Sistema RAG - Assistente Virtual da STRATEVO

## 📋 Visão Geral

Sistema completo de **Retrieval-Augmented Generation (RAG)** para o Assistente Virtual da STRATEVO, permitindo aprendizado contínuo e respostas mais inteligentes baseadas em conversas anteriores.

---

## 🗃️ Arquitetura

### 1. **Tabelas de Banco de Dados**

- **`conversation_embeddings`**: Armazena embeddings vetoriais de todas as conversas
- **`learning_patterns`**: Armazena padrões de sucesso aprendidos
- **`knowledge_base`** (atualizada): Adiciona suporte a embeddings

### 2. **Edge Functions**

- **`generate-embeddings`**: Gera e armazena embeddings de mensagens
- **`semantic-search`**: Busca semântica em conhecimento, conversas e padrões
- **`update-knowledge`**: Atualiza base de conhecimento baseado em feedback

### 3. **Funções PostgreSQL (RPC)**

- **`match_knowledge`**: Busca vetorial na base de conhecimento
- **`match_conversations`**: Busca vetorial em conversas passadas
- **`match_patterns`**: Busca em padrões aprendidos

---

## 🚀 Instalação

### Passo 1: Aplicar Migrations

Execute no **Supabase SQL Editor**:

1. `supabase/migrations/20250122000028_sistema_rag_stratevo.sql`
2. `supabase/migrations/20250122000029_funcoes_rag_stratevo.sql`

### Passo 2: Deploy das Edge Functions

```powershell
.\DEPLOY_RAG_SISTEMA.ps1
```

### Passo 3: Configurar Secrets

No Supabase Dashboard → Settings → Edge Functions → Secrets:

```
OPENAI_API_KEY=sk-...
```

---

## 🔄 Fluxo de Funcionamento

### 1. **Geração de Embeddings**

Quando uma mensagem é enviada:

```typescript
// Automaticamente em background
await supabase.functions.invoke('generate-embeddings', {
  body: {
    sessionId,
    messageId,
    content: messageText,
  }
});
```

### 2. **Busca Semântica (RAG)**

Antes de gerar resposta, busca contexto relevante:

```typescript
const { data: ragResults } = await supabase.functions.invoke('semantic-search', {
  body: { 
    query: userMessage, 
    limit: 3, 
    threshold: 0.75 
  }
});
```

### 3. **Resposta com Contexto RAG**

A Edge Function `chat-ai` agora inclui contexto RAG no prompt:

```typescript
const systemPrompt = `
Você é o Assistente Virtual da STRATEVO.
${ragContext} // Contexto encontrado via busca semântica
...
`;
```

### 4. **Aprendizado Contínuo**

Quando usuário dá feedback positivo (⭐ 4-5):

```typescript
await supabase.functions.invoke('update-knowledge', {
  body: {
    sessionId,
    feedbackScore: 5,
    wasHelpful: true,
  }
});
```

O sistema:
- Analisa a conversa
- Extrai padrões de sucesso
- Cria/atualiza `learning_patterns`
- Melhora respostas futuras

---

## 📊 Resultados Esperados

✅ **Respostas Mais Inteligentes**: Baseadas em conversas anteriores similares

✅ **Aprendizado Contínuo**: Sistema melhora com cada feedback positivo

✅ **Busca Semântica**: Encontra respostas relevantes mesmo com palavras diferentes

✅ **Padrões de Sucesso**: Identifica e reutiliza respostas que funcionaram bem

---

## 🧪 Testes

### Teste 1: Geração de Embeddings

1. Envie uma mensagem no chat
2. Verifique logs da Edge Function `generate-embeddings`
3. Confirme que embedding foi salvo em `conversation_embeddings`

### Teste 2: Busca Semântica

1. Faça uma pergunta no chat
2. Verifique logs da Edge Function `semantic-search`
3. Confirme que contexto RAG foi encontrado

### Teste 3: Aprendizado

1. Complete uma conversa
2. Dê feedback positivo (⭐ 4-5)
3. Verifique se padrão foi criado em `learning_patterns`
4. Faça pergunta similar e confirme que padrão é usado

---

## 🔧 Troubleshooting

### Erro: "OPENAI_API_KEY not configured"

**Solução**: Configure a secret no Supabase Dashboard

### Erro: "Extension vector does not exist"

**Solução**: Execute a migration `20250122000028_sistema_rag_stratevo.sql` que ativa a extensão

### Embeddings não são gerados

**Verifique**:
- Secret `OPENAI_API_KEY` está configurada
- Edge Function `generate-embeddings` foi deployada
- Logs da Edge Function para erros

---

## 📝 Notas Importantes

- **Custo**: Cada embedding gera 1 chamada à API OpenAI (~$0.0001 por embedding)
- **Performance**: Embeddings são gerados em background (não bloqueiam resposta)
- **Threshold**: Ajuste `threshold` em `semantic-search` para controlar relevância (0.7 = 70% similaridade)

---

**🎯 Sistema RAG implementado e pronto para uso!**


