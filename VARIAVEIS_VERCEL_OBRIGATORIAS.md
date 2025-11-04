# 🔑 VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS NO VERCEL

**Data:** 04/11/2025  
**Objetivo:** Lista completa de variáveis `VITE_*` para adicionar no Vercel

---

## 🚨 ERRO ATUAL:

```
[OFFICIAL] ❌ Erro na busca: Error: SERPER_API_KEY não configurada
```

**Causa:** Variáveis de ambiente não estão configuradas no Vercel!

---

## 📋 COMO ADICIONAR NO VERCEL:

### 1. Acesse o painel:
https://vercel.com/olv-core444/olv-intelligence-prospect-v2/settings/environment-variables

### 2. Para CADA variável abaixo:
- Clique "Add New"
- Name: `VITE_NOME_DA_VARIAVEL`
- Value: (copie do Supabase Secrets)
- Environment: Selecione **TODAS** (Production, Preview, Development)
- Clique "Save"

### 3. Após adicionar TODAS:
- Vá em: https://vercel.com/olv-core444/olv-intelligence-prospect-v2
- Clique "Redeploy" (último deployment)
- Aguarde ~2-3 minutos

---

## 🔑 LISTA COMPLETA - 24 VARIÁVEIS VITE_*

### 1. SUPABASE (3)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_PUBLISHABLE_KEY
```

### 2. IA & ANALYTICS (2)
```
VITE_OPENAI_API_KEY
VITE_JINA_API_KEY
```

### 3. PROSPECT & ENRICHMENT (2)
```
VITE_APOLLO_API_KEY
VITE_SERPER_API_KEY
```

### 4. GOOGLE (3)
```
VITE_GOOGLE_CUSTOM_SEARCH_API_KEY
VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID
VITE_YOUTUBE_API_KEY
```

### 5. BRASIL DATA (2)
```
VITE_RECEITAWS_API_TOKEN
VITE_EMPRESASAQUI_API_KEY
```

### 6. CONTACT (1)
```
VITE_HUNTER_API_KEY
```

### 7. PHANTOMBUSTER (3)
```
VITE_PHANTOMBUSTER_API_KEY
VITE_PHANTOMBUSTER_LINKEDIN_SCRAPER_ID
VITE_PHANTOMBUSTER_COMPANY_SCRAPER_ID
```

### 8. GITHUB (1)
```
VITE_GITHUB_TOKEN
```

### 9. PAYMENTS (1)
```
VITE_STRIPE_PUBLIC_KEY
```

### 10. SEARCH (1)
```
VITE_SEARCH_API_KEY
```

### 11. AUTH (2)
```
VITE_AUTH_REDIRECT_URL
VITE_AUTH_CALLBACK_URL
```

### 12. AMBIENTE (2)
```
VITE_APP_ENV
VITE_API_BASE_URL
```

### 13. MAPS (1)
```
VITE_MAPBOX_TOKEN
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO:

- [ ] Acesse painel Vercel Environment Variables
- [ ] Adicione VITE_SUPABASE_URL
- [ ] Adicione VITE_SUPABASE_ANON_KEY
- [ ] Adicione VITE_SUPABASE_PUBLISHABLE_KEY
- [ ] Adicione VITE_OPENAI_API_KEY
- [ ] Adicione VITE_JINA_API_KEY
- [ ] Adicione VITE_APOLLO_API_KEY
- [ ] Adicione VITE_SERPER_API_KEY ← **CRÍTICO PARA BUSCA!**
- [ ] Adicione VITE_GOOGLE_CUSTOM_SEARCH_API_KEY
- [ ] Adicione VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID
- [ ] Adicione VITE_YOUTUBE_API_KEY
- [ ] Adicione VITE_RECEITAWS_API_TOKEN
- [ ] Adicione VITE_EMPRESASAQUI_API_KEY
- [ ] Adicione VITE_HUNTER_API_KEY
- [ ] Adicione VITE_PHANTOMBUSTER_API_KEY
- [ ] Adicione VITE_PHANTOMBUSTER_LINKEDIN_SCRAPER_ID
- [ ] Adicione VITE_PHANTOMBUSTER_COMPANY_SCRAPER_ID
- [ ] Adicione VITE_GITHUB_TOKEN
- [ ] Adicione VITE_STRIPE_PUBLIC_KEY
- [ ] Adicione VITE_SEARCH_API_KEY
- [ ] Adicione VITE_AUTH_REDIRECT_URL
- [ ] Adicione VITE_AUTH_CALLBACK_URL
- [ ] Adicione VITE_APP_ENV
- [ ] Adicione VITE_API_BASE_URL
- [ ] Adicione VITE_MAPBOX_TOKEN
- [ ] **Redeploy** do projeto no Vercel
- [ ] Aguardar 2-3 minutos
- [ ] Testar novamente

---

## 🎯 COMANDO PARA COPIAR VALORES DO SUPABASE:

**No Supabase:**
1. Vá em: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/vault/secrets
2. Procure por cada variável (sem `VITE_`)
3. Copie o valor
4. Cole no Vercel com prefixo `VITE_`

**Exemplo:**
- Supabase: `SERPER_API_KEY = abc123`
- Vercel: `VITE_SERPER_API_KEY = abc123`

---

## ⚠️ IMPORTANTE:

**Após adicionar TODAS as variáveis:**

1. **Não esqueça de Redeploy!**
   - Vercel NÃO aplica variáveis automaticamente
   - É necessário fazer redeploy

2. **Selecione TODOS os ambientes:**
   - Production ✅
   - Preview ✅
   - Development ✅

3. **Aguarde o deploy completo:**
   - ~2-3 minutos
   - Verifique logs de build

---

## 🔍 COMO VERIFICAR SE FUNCIONOU:

Após redeploy, teste:
1. Abra o site no Vercel
2. Vá para aba Keywords
3. Clique "Buscar Website Oficial (TOP 10)"
4. **Console (F12):** NÃO deve mostrar `SERPER_API_KEY não configurada`
5. Deve mostrar: `[OFFICIAL] ✅ Encontrados X resultados`

---

**CRIADO EM:** 04/11/2025  
**URGÊNCIA:** CRÍTICA (sem isso, site no Vercel não funciona)

