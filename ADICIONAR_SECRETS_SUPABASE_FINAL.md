# 🔐 ADICIONAR SECRETS NO SUPABASE - AÇÃO MANUAL NECESSÁRIA

## ⚠️ CRÍTICO: Você precisa adicionar 2 chaves no Supabase Dashboard:

### 1️⃣ OPENAI_API_KEY
**Status:** ⚠️ VERIFICAR SE JÁ EXISTE  
**Usado por:** `generate-product-gaps` (Aba Products - IA)

### 2️⃣ RECEITAWS_API_TOKEN (NOVO)
**Status:** ❌ FALTANDO  
**Usado por:** `enrich-receita-federal` (Enriquecimento CNPJ)

---

## 📋 PASSO A PASSO:

### 1. Acessar Supabase Dashboard:
```
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/vault/secrets
```

### 2. Adicionar cada chave:

#### OPENAI_API_KEY:
- Clique em **"New Secret"**
- Name: `OPENAI_API_KEY`
- Value: `sk-proj-xxxxx` (sua chave OpenAI)
- Clique **"Add Secret"**

#### RECEITAWS_API_TOKEN:
- Clique em **"New Secret"**
- Name: `RECEITAWS_API_TOKEN`
- Value: (sua chave ReceitaWS - se tiver, senão deixar vazio `""`)
- Clique **"Add Secret"**

---

## ✅ CONFIRMAÇÃO:

Após adicionar, você verá:
```
✓ OPENAI_API_KEY
✓ RECEITAWS_API_TOKEN
✓ SERPER_API_KEY (já existe)
✓ APOLLO_API_KEY (já existe)
✓ JINA_API_KEY (já existe)
```

---

## 🚀 RESULTADO:

- **ABA PRODUCTS:** 100% conectada com OpenAI GPT-4o-mini (não mais mock!)
- **ENRIQUECIMENTO CNPJ:** Fallback ReceitaWS disponível
- **CUSTOS:** ~0.0015 USD por análise de produtos (GPT-4o-mini)

---

## ⏰ TEMPO ESTIMADO: 2 minutos

