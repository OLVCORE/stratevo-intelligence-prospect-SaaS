# 🚀 PLAUD INTEGRATION - INSTRUÇÕES DE SETUP

## ✅ **PASSO A PASSO COMPLETO**

---

## **1️⃣ APLICAR MIGRATION NO SUPABASE** (5 min)

### **Opção A: Via SQL Editor (RECOMENDADO)**

1. Acesse: [Supabase SQL Editor](https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/sql/new)

2. Abra o arquivo:
   ```
   C:\Projects\olv-intelligence-prospect-v2\supabase\migrations\20251111120000_plaud_integration.sql
   ```

3. Copie **TODO** o conteúdo do arquivo

4. Cole no SQL Editor do Supabase

5. Clique em **"Run"** (canto inferior direito)

6. ✅ Sucesso! Você verá: "Success. No rows returned"

---

### **Opção B: Via CLI (alternativa)**

Se preferir usar o CLI do Supabase:

```powershell
cd C:\Projects\olv-intelligence-prospect-v2

# Conectar ao projeto
supabase link --project-ref kdalsopwfkrxiaxxophh

# Aplicar só a migration do Plaud
supabase db remote commit
```

---

## **2️⃣ CONFIGURAR OPENAI API KEY** (2 min)

### **✅ Já configurado no Supabase!**

Você mencionou que a key já está lá:
```
OPENAI_API_KEY=sk-proj-...
```

### **🔄 ATUALIZAR PARA USAR GPT-4o-MINI (mais barato + rápido)**

1. Acesse: [Supabase Edge Functions Secrets](https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/settings/functions)

2. Edite a secret `OPENAI_API_KEY` se necessário

3. **IMPORTANTE:** O código já está configurado para usar `gpt-4o-mini`

**Arquivo já atualizado:** `supabase/functions/plaud-webhook-receiver/index.ts`

```typescript
// Linha 189 - Já configurado para gpt-4o-mini
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // ✅ Modelo econômico
  messages: [...],
  temperature: 0.3,
  response_format: { type: "json_object" }
});
```

**Custos GPT-4o-mini:**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- **Call média (15 min):** ~$0.005 (R$ 0,025)

---

## **3️⃣ DEPLOY DA EDGE FUNCTION** (3 min)

```powershell
cd C:\Projects\olv-intelligence-prospect-v2

# Deploy da função
supabase functions deploy plaud-webhook-receiver

# Verificar logs (opcional)
supabase functions logs plaud-webhook-receiver --tail
```

### **✅ URL do Webhook Será:**

```
https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/plaud-webhook-receiver
```

---

## **4️⃣ CONFIGURAR WEBHOOK NO PLAUD APP** (5 min)

### **No App Plaud (iOS/Android):**

1. Abra o **Plaud App**

2. Vá em **Settings** → **Integrations** → **Webhooks**

3. Clique em **"Add Webhook"** ou **"+"**

4. **Webhook URL:**
   ```
   https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/plaud-webhook-receiver
   ```

5. **Event:** Selecione **"Recording Transcribed"** ou **"Transcription Complete"**

6. **Method:** POST (padrão)

7. **Headers** (opcional): Deixe vazio por enquanto

8. Clique em **"Save"** ou **"Add"**

9. ✅ Teste: Grave uma call curta (30 seg) e veja se o webhook é disparado

---

## **5️⃣ TESTAR A INTEGRAÇÃO** (5 min)

### **Teste 1: Webhook Automático** ⚡

1. **Grave uma call de teste:**
   - Use o Plaud NotePin
   - Grave 30-60 segundos
   - Fale sobre qualquer assunto

2. **Aguarde transcrição:**
   - Plaud leva 1-2 minutos para transcrever
   - Acompanhe no app

3. **Verifique no STRATEVO:**
   - Acesse: http://localhost:5173
   - Menu → **Sales Coaching**
   - Deve aparecer a call analisada!

### **Teste 2: Importação Manual** 📥

1. **Abra uma empresa no STRATEVO**

2. **Clique em "📱 Importar Call Plaud"**

3. **Cole esta transcrição de teste:**
   ```
   Vendedor: Bom dia! Como posso ajudá-lo hoje?
   
   Cliente: Olá! Estou interessado em conhecer seus produtos.
   
   Vendedor: Ótimo! Me conte um pouco sobre o que você precisa.
   
   Cliente: Preciso de uma solução para gestão empresarial.
   
   Vendedor: Perfeito! Temos o sistema ideal. Qual é o tamanho da sua empresa?
   
   Cliente: Somos 50 colaboradores.
   
   Vendedor: Entendi. Você poderia me enviar um email para eu preparar uma proposta?
   
   Cliente: Claro! Meu email é joao@empresa.com
   
   Vendedor: Perfeito! Vou enviar até amanhã. Obrigado!
   
   Cliente: Obrigado você!
   ```

4. **Clique em "Analisar com IA"**

5. **✅ Em 5-10 segundos você verá:**
   - Sentimento: Positivo 😊
   - Action items: "Enviar proposta para joao@empresa.com"
   - Perguntas feitas: 2
   - Resumo gerado automaticamente

---

## **6️⃣ VERIFICAR LOGS** (se houver problemas)

### **Ver logs da Edge Function:**

```powershell
supabase functions logs plaud-webhook-receiver --tail
```

### **Ver logs no Dashboard:**

1. Acesse: [Supabase Functions](https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/functions)

2. Clique em **"plaud-webhook-receiver"**

3. Vá na aba **"Logs"**

4. Veja as últimas execuções

---

## **7️⃣ VERIFICAR TABELAS NO BANCO** (opcional)

### **Verificar se as tabelas foram criadas:**

Execute no SQL Editor:

```sql
-- Verificar tabelas do Plaud
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'call_%' 
  OR table_name LIKE '%coaching%'
  OR table_name LIKE 'plaud%'
ORDER BY table_name;

-- Deve retornar:
-- call_analytics
-- call_recordings
-- plaud_webhook_logs
-- sales_coaching_recommendations
```

### **Ver performance summary view:**

```sql
SELECT * FROM call_performance_summary LIMIT 1;
```

---

## **8️⃣ ADICIONAR METADATA AO GRAVAR (AVANÇADO)** 

Para vincular automaticamente calls a empresas/deals:

### **No Plaud App (se suportado):**

Ao criar a gravação, adicione **tags** ou **notas**:

```json
{
  "company_cnpj": "12.345.678/0001-90",
  "deal_id": "uuid-do-deal"
}
```

Ou simplesmente mencione durante a call:
- "Essa call é com a empresa Metalife, CNPJ 12.345.678/0001-90"

A IA vai extrair automaticamente! 🤖

---

## **🆘 TROUBLESHOOTING**

### **Problema: "Webhook não está sendo recebido"**

**Solução:**
1. Verifique a URL do webhook no Plaud App
2. Teste manualmente com curl:
   ```powershell
   curl -X POST https://kdalsopwfkrxiaxxophh.supabase.co/functions/v1/plaud-webhook-receiver `
     -H "Content-Type: application/json" `
     -d '{\"recording_id\": \"test\", \"transcript\": \"Teste de transcrição\"}'
   ```

---

### **Problema: "IA não está analisando"**

**Solução:**
1. Verifique se `OPENAI_API_KEY` está configurada
2. Execute no terminal:
   ```powershell
   supabase secrets list
   ```
3. Deve aparecer: `OPENAI_API_KEY`

---

### **Problema: "Action items não estão sendo criados"**

**Solução:**
1. Verifique se a tabela `smart_tasks` existe:
   ```sql
   SELECT * FROM smart_tasks LIMIT 1;
   ```
2. Verifique se o trigger está ativo:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'trigger_auto_create_tasks_from_call';
   ```

---

## **✅ CHECKLIST FINAL**

- [ ] Migration aplicada no Supabase
- [ ] OpenAI API Key configurada
- [ ] Edge Function deployada
- [ ] Webhook configurado no Plaud App
- [ ] Teste manual funcionou (importação)
- [ ] Teste automático funcionou (webhook)
- [ ] Sales Coaching Dashboard acessível
- [ ] Logs verificados (sem erros)

---

## **📊 CUSTOS ESTIMADOS**

### **Por Call (15 minutos):**
- Transcrição Plaud: Grátis (300 min/mês)
- OpenAI GPT-4o-mini: ~R$ 0,025
- Supabase: Grátis (até 500GB)

### **Por Mês (100 calls):**
- Hardware Plaud: R$ 950 (one-time)
- Transcrição: R$ 0 (grátis)
- OpenAI: R$ 2,50
- Supabase: R$ 0

**Total mensal: ~R$ 2,50** 🎉

---

## **🚀 PRÓXIMOS PASSOS**

1. ✅ Aplicar migration
2. ✅ Deploy Edge Function
3. ✅ Configurar webhook
4. ✅ Fazer testes
5. 🎯 Treinar equipe de vendas
6. 📊 Acompanhar métricas
7. 🏆 Celebrar resultados!

---

## **📞 SUPORTE**

**Problemas?**
- Email: marcos.oliveira@olv.com.br
- Docs: `PLAUD_INTEGRATION_GUIDE.md`

**Funcionalidade funcionando?**
- Compartilhe resultados! 🎉
- Sugira melhorias

---

**Status:** ✅ Pronto para uso!  
**Última atualização:** 2025-11-11  
**Versão:** 1.0.0

