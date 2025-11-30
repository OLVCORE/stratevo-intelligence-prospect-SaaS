# 🔧 FIX: Erro 401 e SUPABASE_URL não encontrado no Vercel

## 🚨 ERRO ATUAL

```
manifest.json:1 Failed to load resource: the server responded with a status of 401 ()
Uncaught Error: ❌ SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios! Verifique seu arquivo .env.local
```

**Causa:** Variáveis de ambiente não estão configuradas no Vercel ou não foram aplicadas após adicionar.

---

## ✅ SOLUÇÃO RÁPIDA

### PASSO 1: Verificar Variáveis no Vercel

1. Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables
2. Verifique se estas 2 variáveis existem:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### PASSO 2: Adicionar Variáveis Obrigatórias (se não existirem)

**Name:** `VITE_SUPABASE_URL`  
**Value:** `https://vkdvezuivlovzqxmnohk.supabase.co`  
**Environment:** ✅ Production ✅ Preview ✅ Development

**Name:** `VITE_SUPABASE_ANON_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjEzODMsImV4cCI6MjA3OTA5NzM4M30.jPCAye46kuwyO7_JWZV8e-XxxynixbqbUJSYdK9thek`  
**Environment:** ✅ Production ✅ Preview ✅ Development

### PASSO 3: Redeploy OBRIGATÓRIO

⚠️ **IMPORTANTE:** Após adicionar variáveis, você DEVE fazer redeploy!

1. Vá em: **Deployments**
2. Clique nos **3 pontos** (...) do último deployment
3. Clique em **"Redeploy"**
4. Aguarde 2-3 minutos

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:

1. Após redeploy, acesse sua URL do Vercel
2. Abra o Console do navegador (F12)
3. Não deve aparecer mais o erro de SUPABASE_URL
4. O manifest.json deve carregar sem erro 401

---

## 📋 LISTA COMPLETA DE VARIÁVEIS OBRIGATÓRIAS

Se ainda não adicionou todas, adicione estas 6 variáveis críticas primeiro:

```
VITE_SUPABASE_URL=https://vkdvezuivlovzqxmnohk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjEzODMsImV4cCI6MjA3OTA5NzM4M30.jPCAye46kuwyO7_JWZV8e-XxxynixbqbUJSYdK9thek
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMTM4MywiZXhwIjoyMDc5MDk3MzgzfQ.plfX40wrNkl0JkLxNVxNUu-lzM9cufpugHYk_XcRy6A
VITE_SUPABASE_PROJECT_ID=vkdvezuivlovzqxmnohk
NEXT_PUBLIC_SUPABASE_URL=https://vkdvezuivlovzqxmnohk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMTM4MywiZXhwIjoyMDc5MDk3MzgzfQ.plfX40wrNkl0JkLxNVxNUu-lzM9cufpugHYk_XcRy6A
```

---

## ⚠️ ERROS COMUNS

### ❌ Erro: "Variáveis adicionadas mas ainda não funcionam"
**Solução:** Faça redeploy! Variáveis só são aplicadas em novos deploys.

### ❌ Erro: "Variáveis só funcionam em Preview, não em Production"
**Solução:** Verifique se marcou TODOS os ambientes ao adicionar (Production ✅ Preview ✅ Development ✅)

### ❌ Erro: "Ainda aparece erro 401"
**Solução:** 
1. Verifique se os valores estão corretos (sem espaços extras)
2. Verifique se o nome está exatamente como `VITE_SUPABASE_URL` (com VITE_)
3. Faça redeploy novamente

---

## 🔗 LINKS ÚTEIS

- **Vercel Environment Variables:** https://vercel.com/[seu-projeto]/settings/environment-variables
- **Vercel Deployments:** https://vercel.com/[seu-projeto]/deployments
- **Supabase Dashboard:** https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk

---

**Criado em:** 2025-01-19  
**Status:** ✅ Solução completa

