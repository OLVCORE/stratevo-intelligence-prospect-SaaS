# 🚀 DEPLOY DA EDGE FUNCTION "DIGITAL INTELLIGENCE"

## ✅ **PASSO 1: VERIFICAR SE SUPABASE CLI ESTÁ INSTALADO**

```bash
supabase --version
```

**Se não estiver instalado:**
```bash
npm install -g supabase
```

---

## ✅ **PASSO 2: FAZER LOGIN NO SUPABASE**

```bash
supabase login
```

---

## ✅ **PASSO 3: LINKAR AO PROJETO**

```bash
supabase link --project-ref qtcwetabhhkhvomcrqgm
```

---

## ✅ **PASSO 4: DEPLOY DA EDGE FUNCTION**

```bash
supabase functions deploy digital-intelligence-analysis --no-verify-jwt
```

**Output esperado:**
```
Deploying digital-intelligence-analysis...
✓ Function deployed successfully
```

---

## ✅ **PASSO 5: CONFIGURAR VARIÁVEL DE AMBIENTE (OPENAI_API_KEY)**

### **Opção A: Via Dashboard (RECOMENDADO)**

1. Abra: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/functions
2. Clique em **"Secrets"** ou **"Environment Variables"**
3. Adicione:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (sua chave da OpenAI)
4. Clique em **"Save"**

### **Opção B: Via CLI**

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

---

## ✅ **PASSO 6: VERIFICAR SE SERPER_API_KEY JÁ EXISTE**

```bash
supabase secrets list
```

**Deve aparecer:**
- ✅ `SERPER_API_KEY` (já configurado)
- ✅ `OPENAI_API_KEY` (recém adicionado)

**Se SERPER_API_KEY não existir:**
```bash
supabase secrets set SERPER_API_KEY=sua_chave_serper
```

---

## ✅ **PASSO 7: TESTAR A FUNÇÃO**

```bash
curl -i --location --request POST 'https://qtcwetabhhkhvomcrqgm.supabase.co/functions/v1/digital-intelligence-analysis' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "companyName": "Viana Off-Shore Comércio Ltda.",
    "cnpj": "04624947000124",
    "domain": "vianaoffshore.com.br",
    "sector": "Offshore"
  }'
```

**Output esperado:**
```json
{
  "temperature": "hot",
  "sales_readiness_score": 8,
  "analyzed_urls": [
    {
      "url": "https://vianaoffshore.com.br",
      "title": "...",
      ...
    }
  ]
}
```

---

## 🔧 **PASSO 8: SE DER ERRO DE TIMEOUT**

A função pode levar 60-90 segundos. Configure timeout maior:

```bash
supabase functions deploy digital-intelligence-analysis --no-verify-jwt --timeout 120
```

---

## ⚠️ **TROUBLESHOOTING**

### **Erro: "Function not found"**
```bash
# Re-deploy forçado
supabase functions deploy digital-intelligence-analysis --no-verify-jwt --force
```

### **Erro: "OPENAI_API_KEY not set"**
```bash
# Verificar secrets
supabase secrets list

# Re-adicionar
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### **Erro: "SERPER_API_KEY not set"**
```bash
supabase secrets set SERPER_API_KEY=sua_chave_serper
```

---

## 🎯 **RESUMO RÁPIDO (COPIAR/COLAR):**

```bash
# 1. Login
supabase login

# 2. Link
supabase link --project-ref qtcwetabhhkhvomcrqgm

# 3. Deploy
supabase functions deploy digital-intelligence-analysis --no-verify-jwt

# 4. Configurar OpenAI (via Dashboard ou CLI)
# Dashboard: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/functions
# CLI: supabase secrets set OPENAI_API_KEY=sk-proj-...

# 5. Verificar
supabase secrets list
```

---

## ✅ **APÓS O DEPLOY:**

1. Aguarde 30 segundos para propagar
2. Atualize a página do relatório (`Ctrl + Shift + R`)
3. Clique em "Gerar Análise com IA"
4. Aguarde 60-90 segundos
5. Verifique se as URLs aparecem!

---

## 💰 **CONSUMO ESPERADO (POR EMPRESA):**

- 20 queries Serper = ~$0.02
- 50 análises GPT-4o-mini = ~$0.01
- **TOTAL: ~$0.03 USD por empresa**

**Para 40 empresas NO-GO: ~$1.20 USD** ✅

---

**EXECUTE OS COMANDOS ACIMA E ME DIGA SE DEU CERTO!** 🚀

