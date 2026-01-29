# 🚨 FIX URGENTE: Variáveis de Ambiente no Vercel

## ❌ ERRO ATUAL
```
Uncaught Error: ❌ SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios!
Página completamente branca no Vercel
```

## ✅ SOLUÇÃO IMEDIATA

### PASSO 1: Acessar Configurações do Vercel
1. Acesse: https://vercel.com/olv-core444/stratevo-intelligence-prospect-saa-s/settings/environment-variables
2. Ou navegue: **Settings** → **Environment Variables**

### PASSO 2: Adicionar Variáveis Obrigatórias

**⚠️ IMPORTANTE:** Adicione TODAS as variáveis abaixo e marque **TODOS os ambientes** (Production ✅ Preview ✅ Development ✅)

#### Variável 1: VITE_SUPABASE_URL
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://vkdvezuivlovzqxmnohk.supabase.co`
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### Variável 2: VITE_SUPABASE_ANON_KEY
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** _(copie do Supabase: Project Settings → API → anon public)_
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### Variável 3: VITE_SUPABASE_SERVICE_ROLE_KEY (Opcional mas recomendado)
- **Name:** `VITE_SUPABASE_SERVICE_ROLE_KEY`
- **Value:** _(copie do Supabase: Project Settings → API → service_role)_
- **Environment:** ✅ Production ✅ Preview ✅ Development

### PASSO 3: REDEPLOY OBRIGATÓRIO ⚠️

**Após adicionar as variáveis, você DEVE fazer redeploy:**

1. Vá em: **Deployments** (menu superior)
2. Encontre o último deployment (ou qualquer deployment de Production)
3. Clique nos **3 pontos** (...) à direita
4. Clique em **"Redeploy"**
5. Aguarde 2-3 minutos para o build completar

**OU** faça um novo push para o GitHub (se o commit MC-CANON-3 for feito)

---

## 🔍 VERIFICAÇÃO

Após o redeploy:
1. Acesse: https://stratevo-intelligence-prospect-saa-s.vercel.app
2. Abra o Console do navegador (F12)
3. **NÃO deve aparecer** o erro de SUPABASE_URL
4. O `manifest.json` deve carregar sem erro 401
5. A página deve carregar normalmente (não mais branca)

---

## 📋 VARIÁVEIS ADICIONAIS (Opcionais mas recomendadas)

Se quiser adicionar todas as variáveis do projeto:

### APIs Externas
- **VITE_OPENAI_API_KEY:** _(sua chave OpenAI em https://platform.openai.com/api-keys)_
- **VITE_APOLLO_API_KEY:** _(sua chave Apollo)_
- **VITE_SERPER_API_KEY:** _(sua chave Serper)_

---

## ⚠️ NOTA SOBRE DEPLOY VIA CLI

O deploy feito via `vercel --prod --yes` **não aparece na lista de Deployments** porque:
- Foi feito diretamente via CLI, sem estar vinculado a um commit do Git
- A lista de Deployments mostra apenas deploys vinculados a commits do GitHub

**Solução:** Após configurar as variáveis e fazer redeploy, o próximo commit/push para `master` criará um deployment que aparecerá na lista.
