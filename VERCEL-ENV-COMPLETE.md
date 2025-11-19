# 🔐 Variáveis de Ambiente Completas - OLV Intelligence Prospect v2

## 📋 COPIE E COLE NO VERCEL (27 VARIÁVEIS)

**Instruções:**
1. Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables
2. **Substitua os valores** pelas suas chaves reais
3. Marque: ☑️ **Production** ☑️ **Preview** ☑️ **Development**
4. Clique em "Save" após cada variável

---

## 🗂️ FORMATO PARA COLAR NO VERCEL

### 1. SUPABASE (6 variáveis) - CRÍTICAS

```
VITE_SUPABASE_URL=https://qtcwetabhhkhvomcrqgm.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anon-publica>
VITE_SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-SECRETA>
VITE_SUPABASE_PROJECT_ID=qtcwetabhhkhvomcrqgm
NEXT_PUBLIC_SUPABASE_URL=https://qtcwetabhhkhvomcrqgm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-SECRETA>
```

**⚠️ Onde obter:**
- Dashboard: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/api
- Copie "URL" → `VITE_SUPABASE_URL`
- Copie "anon public" → `VITE_SUPABASE_ANON_KEY`
- Copie "service_role" → `VITE_SUPABASE_SERVICE_ROLE_KEY` ⚠️ SECRETA!

---

### 2. IA & ANALYTICS (1 variável)

```
VITE_OPENAI_API_KEY=<sua-chave-openai>
```

**Obter em:** https://platform.openai.com/api-keys
- Modelo usado: GPT-4o-mini (produtos TOTVS)
- Custo estimado: $50-100/mês

---

### 3. PROSPECT & ENRICHMENT (2 variáveis)

```
VITE_APOLLO_API_KEY=<sua-chave-apollo>
VITE_SERPER_API_KEY=<sua-chave-serper>
```

**Apollo.io** (Decisores/C-Level):
- Obter em: https://apollo.io/settings/integrations
- Usado para: CEO, CFO, CIO, CTO, COO, Diretores

**Serper** (Google Search API):
- Obter em: https://serper.dev/api-key
- Usado para: Press releases, notícias, clientes

---

### 4. GOOGLE APIS (3 variáveis)

```
VITE_GOOGLE_API_KEY=<sua-chave-google>
VITE_GOOGLE_CSE_ID=<seu-custom-search-engine-id>
VITE_YOUTUBE_API_KEY=<sua-chave-youtube>
```

**Google Custom Search Engine:**
1. Criar em: https://programmablesearchengine.google.com/
2. Copiar "Search engine ID" → `VITE_GOOGLE_CSE_ID`
3. API Key: https://console.cloud.google.com/apis/credentials

**YouTube API:**
- Mesmo API Key do Google pode funcionar
- Ou criar específica: https://console.cloud.google.com/apis/library/youtube.googleapis.com

---

### 5. BRASIL DATA (2 variáveis)

```
VITE_RECEITAWS_API_TOKEN=<seu-token-receitaws>
VITE_EMPRESASAQUI_API_KEY=<sua-chave-empresasaqui>
```

**ReceitaWS** (CNPJ/Receita Federal - Fallback):
- Obter em: https://receitaws.com.br/api
- Usado como: Backup do BrasilAPI

**EmpresasAqui** (Dados empresariais BR):
- Obter em: https://empresasaqui.com.br/api
- Usado como: Backup adicional

---

### 6. CONTACT (1 variável)

```
VITE_HUNTER_API_KEY=<sua-chave-hunter>
```

**Hunter.io** (Email Finder & Verification):
- Obter em: https://hunter.io/api-keys
- Usado para: Encontrar e validar emails de decisores

---

### 7. PHANTOMBUSTER (3 variáveis)

```
VITE_PHANTOMBUSTER_API_KEY=<sua-chave-phantombuster>
VITE_PHANTOMBUSTER_AGENT_ID=<seu-agent-id>
VITE_PHANTOMBUSTER_CONTAINER_ID=<seu-container-id>
```

**PhantomBuster** (LinkedIn Automation):
- Obter em: https://phantombuster.com/api
- Dashboard: https://phantombuster.com/console
- Usado para: Scraping LinkedIn, decisores, empresas

---

### 8. GITHUB (1 variável)

```
VITE_GITHUB_TOKEN=<seu-personal-access-token>
```

**GitHub Personal Access Token:**
- Criar em: https://github.com/settings/tokens/new
- Permissões: `repo`, `read:org`, `read:user`
- Usado para: Análise de repositórios públicos das empresas

---

### 9. PAYMENTS (1 variável)

```
VITE_STRIPE_PUBLIC_KEY=<sua-chave-publica-stripe>
```

**Stripe** (Pagamentos):
- Obter em: https://dashboard.stripe.com/apikeys
- Use: "Publishable key" (começa com `pk_live_` ou `pk_test_`)

---

### 10. SEARCH (1 variável)

```
VITE_ALGOLIA_APP_ID=<seu-app-id-algolia>
```

**Algolia** (Search interno da plataforma):
- Obter em: https://dashboard.algolia.com/account/api-keys
- Usado para: Busca rápida de empresas/leads

---

### 11. AUTH (2 variáveis)

```
VITE_AUTH_SECRET=<gere-string-aleatoria-forte-64-chars>
VITE_JWT_SECRET=<gere-string-aleatoria-forte-64-chars>
```

**Gerar segredos fortes:**
```bash
# Execute 2 vezes no terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use: https://generate-secret.vercel.app/64

---

### 12. AMBIENTE (2 variáveis)

```
VITE_APP_URL=https://seu-projeto.vercel.app
VITE_ENVIRONMENT=production
```

**⚠️ IMPORTANTE:**
- Atualize `VITE_APP_URL` **APÓS O PRIMEIRO DEPLOY**
- Use o domínio final do Vercel (ou custom domain se tiver)
- `VITE_ENVIRONMENT`: `development` | `staging` | `production`

---

### 13. MAPS (1 variável)

```
VITE_MAPBOX_TOKEN=<seu-token-mapbox>
```

**Mapbox** (Mapas e Geocoding - Fallback):
- Obter em: https://account.mapbox.com/access-tokens/
- Usado como: Backup do Nominatim (OSM gratuito)
- Plano free: 50k requisições/mês

---

### 14. WEB SCRAPING (1 variável) ⭐ NOVA

```
VITE_JINA_API_KEY=jina_23abb1fbcb5343e693c045b84fec82f4lmjV6DZzBvN67DZCZl1YAwGDEOT1
```

**Jina AI** (Web Reader/Scraping):
- Obter em: https://jina.ai/reader/
- Usado para: Client Discovery Wave7, scraping de páginas /clientes
- Plano free: 1.000 requests/mês

**⚠️ ATENÇÃO:** A chave acima é a sua real. Se precisar trocar, gere nova em Jina AI.

---

## 📊 RESUMO DAS 27 VARIÁVEIS

| Categoria | Variáveis | Status |
|-----------|-----------|--------|
| Supabase | 6 | 🔴 CRÍTICAS |
| IA & Analytics | 1 | 🔴 CRÍTICA |
| Prospect | 2 | 🟡 IMPORTANTES |
| Google | 3 | 🟢 OPCIONAIS |
| Brasil Data | 2 | 🟡 IMPORTANTES |
| Contact | 1 | 🟢 OPCIONAL |
| PhantomBuster | 3 | 🟢 OPCIONAIS |
| GitHub | 1 | 🟢 OPCIONAL |
| Payments | 1 | 🟡 IMPORTANTE |
| Search | 1 | 🟢 OPCIONAL |
| Auth | 2 | 🔴 CRÍTICAS |
| Ambiente | 2 | 🔴 CRÍTICAS |
| Maps | 1 | 🟢 OPCIONAL |
| Web Scraping | 1 | 🟡 IMPORTANTE |

**TOTAL:** 27 variáveis

---

## 🚨 PRIORIDADES DE CONFIGURAÇÃO

### 🔴 URGENTE (11 variáveis) - App não funciona sem elas:
1. ✅ `VITE_SUPABASE_URL`
2. ✅ `VITE_SUPABASE_ANON_KEY`
3. ✅ `VITE_SUPABASE_SERVICE_ROLE_KEY`
4. ✅ `VITE_SUPABASE_PROJECT_ID`
5. ✅ `NEXT_PUBLIC_SUPABASE_URL`
6. ✅ `SUPABASE_SERVICE_ROLE_KEY`
7. ✅ `VITE_OPENAI_API_KEY`
8. ✅ `VITE_AUTH_SECRET`
9. ✅ `VITE_JWT_SECRET`
10. ✅ `VITE_APP_URL`
11. ✅ `VITE_ENVIRONMENT`

### 🟡 IMPORTANTES (7 variáveis) - Features principais funcionam sem elas:
12. ✅ `VITE_APOLLO_API_KEY` (Decisores)
13. ✅ `VITE_SERPER_API_KEY` (Search)
14. ✅ `VITE_RECEITAWS_API_TOKEN` (CNPJ fallback)
15. ✅ `VITE_EMPRESASAQUI_API_KEY` (Dados BR)
16. ✅ `VITE_STRIPE_PUBLIC_KEY` (Pagamentos)
17. ✅ `VITE_JINA_API_KEY` (Wave7)

### 🟢 OPCIONAIS (9 variáveis) - Features extras:
18. ⚪ `VITE_GOOGLE_API_KEY`
19. ⚪ `VITE_GOOGLE_CSE_ID`
20. ⚪ `VITE_YOUTUBE_API_KEY`
21. ⚪ `VITE_HUNTER_API_KEY`
22. ⚪ `VITE_PHANTOMBUSTER_API_KEY`
23. ⚪ `VITE_PHANTOMBUSTER_AGENT_ID`
24. ⚪ `VITE_PHANTOMBUSTER_CONTAINER_ID`
25. ⚪ `VITE_GITHUB_TOKEN`
26. ⚪ `VITE_ALGOLIA_APP_ID`
27. ⚪ `VITE_MAPBOX_TOKEN`

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

Marque conforme for adicionando no Vercel:

### 🔴 URGENTES:
- [ ] Supabase (6 variáveis)
- [ ] OpenAI (1 variável)
- [ ] Auth Secrets (2 variáveis)
- [ ] Ambiente (2 variáveis)

### 🟡 IMPORTANTES:
- [ ] Apollo (1 variável)
- [ ] Serper (1 variável)
- [ ] ReceitaWS (1 variável)
- [ ] Jina AI (1 variável)
- [ ] Stripe (1 variável)

### 🟢 OPCIONAIS:
- [ ] Google (3 variáveis)
- [ ] Hunter (1 variável)
- [ ] PhantomBuster (3 variáveis)
- [ ] GitHub (1 variável)
- [ ] Algolia (1 variável)
- [ ] Mapbox (1 variável)
- [ ] EmpresasAqui (1 variável)

---

## 🎯 ORDEM RECOMENDADA DE ADIÇÃO

**PASSO 1:** Adicione as 11 URGENTES
```bash
# Depois de adicionar no Vercel:
# Settings → Environment Variables → Redeploy
```

**PASSO 2:** Adicione as 7 IMPORTANTES
```bash
# Redeploy novamente
```

**PASSO 3:** Adicione as OPCIONAIS conforme necessário
```bash
# Redeploy se necessário
```

---

## 🔒 SEGURANÇA - IMPORTANTE!

### ❌ NUNCA FAÇA:
- Commit de arquivos `.env*` no Git
- Compartilhe `SERVICE_ROLE_KEY` publicamente
- Use mesmas chaves em dev e produção (se possível)
- Exponha secrets no código frontend

### ✅ SEMPRE FAÇA:
- Use variáveis de ambiente no Vercel
- Mantenha backup seguro das chaves (1Password, Bitwarden)
- Rotacione secrets a cada 3-6 meses
- Monitore uso de APIs no dashboard de cada provedor

---

## 🚀 APÓS CONFIGURAR NO VERCEL

### 1. Redeploy da aplicação:
```bash
# No Vercel Dashboard:
Deployments → ... (3 pontos) → Redeploy
```

### 2. Verifique as variáveis:
```bash
# Acesse:
Settings → Environment Variables
# Deve mostrar 27 variáveis (ou as que você adicionou)
```

### 3. Teste a aplicação:
```bash
# Acesse sua URL do Vercel:
https://seu-projeto.vercel.app

# Teste:
1. Login/Auth ✅
2. Dashboard ✅
3. Busca de empresas (CNPJ) ✅
4. Enriquecimento ✅
5. Wave7 Discovery ✅
6. Produtos TOTVS ✅
```

---

## 🐛 TROUBLESHOOTING

### Erro: "VITE_SUPABASE_URL is not defined"
**Solução:**
- Verifique se adicionou com o prefixo correto: `VITE_` (não `NEXT_PUBLIC_`)
- Redeploy após adicionar

### Erro: "OpenAI API key invalid"
**Solução:**
- Verifique se a chave começa com `sk-`
- Verifique se tem créditos na conta OpenAI
- Dashboard: https://platform.openai.com/usage

### Erro: "Apollo rate limit exceeded"
**Solução:**
- Plano gratuito: 100 requests/mês
- Upgrade: https://apollo.io/pricing
- Ou aguarde reset mensal

### Build passa mas app não funciona:
**Solução:**
- Verifique logs: Vercel → Deployments → [seu deploy] → Function Logs
- Procure por erros de "environment variable not found"

---

## 📱 SUPORTE

**Documentação oficial:**
- Vercel Env Vars: https://vercel.com/docs/environment-variables
- Supabase: https://supabase.com/docs/guides/getting-started
- OpenAI: https://platform.openai.com/docs

**Links úteis:**
- Projeto no Vercel: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm
- GitHub Repo: https://github.com/OLVCORE/olv-intelligence-prospect-v2

---

**Criado em:** 04 de novembro de 2025  
**Projeto:** OLV Intelligence Prospect v2  
**Deploy:** Vercel  
**Total de variáveis:** 27

---

## 🎉 PRONTO PARA DEPLOY!

Após adicionar as variáveis no Vercel, seu app estará 100% funcional! 🚀

**Próximos passos:**
1. ✅ Adicionar variáveis no Vercel
2. ✅ Redeploy
3. ✅ Testar funcionalidades
4. ✅ Deploy das Edge Functions no Supabase (separadamente)




















