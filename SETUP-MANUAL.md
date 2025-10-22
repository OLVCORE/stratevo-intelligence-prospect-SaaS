# 🔧 Setup Manual - OLV Intelligence Prospect v2

## ⚠️ IMPORTANTE: Este guia é para VOCÊ executar manualmente

O projeto está **100% pronto**, mas você precisa configurar as chaves das APIs com seus dados **REAIS**.

---

## 📋 Checklist de Setup

### ✅ 1. Criar arquivo `.env.local`

**Crie manualmente** o arquivo `.env.local` na raiz do projeto (`c:\Projects\olv-intelligence-prospect-v2\.env.local`)

**Copie este template e preencha com SUAS chaves REAIS:**

```env
# ========================================
# SUPABASE (OBRIGATÓRIO)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-real-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-real-aqui

# ========================================
# BUSCA (OBRIGATÓRIO - pelo menos 1)
# ========================================
RECEITAWS_API_TOKEN=sua-chave-real-receitaws

# Opção 1: Google Custom Search
GOOGLE_API_KEY=sua-chave-real-google
GOOGLE_CSE_ID=seu-cse-id-real

# Opção 2: Serper (alternativa ao Google)
SERPER_API_KEY=sua-chave-real-serper

# ========================================
# DECISORES (OPCIONAL)
# ========================================
APOLLO_API_KEY=sua-chave-real-apollo
HUNTER_API_KEY=sua-chave-real-hunter
PHANTOM_BUSTER_API_KEY=sua-chave-real-phantom

# ========================================
# ENRIQUECIMENTO (OPCIONAL)
# ========================================
BUILTWITH_API_KEY=sua-chave-real-builtwith

# ========================================
# EMAIL (OPCIONAL - para Ciclo 5)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
FROM_EMAIL="OLV Sistemas <olvsistemas@olvinternacional.com.br>"

# ========================================
# APP
# ========================================
NEXT_PUBLIC_APP_NAME="OLV Intelligent Prospect v2"
```

---

### ✅ 2. Executar SQL no Supabase

Você precisa executar **3 arquivos SQL** no Supabase SQL Editor:

#### A) Schema base (Ciclo 1):
```sql
-- Copie o conteúdo de:
lib/supabase/migrations/001_ciclo1_companies.sql
-- E execute no SQL Editor do Supabase
```

#### B) Enriquecimento (Ciclo 3):
```sql
-- Copie o conteúdo de:
lib/supabase/migrations/002_ciclo3_enrichment.sql
-- E execute no SQL Editor do Supabase
```

#### C) Decisores + SDR (Ciclo 4):
```sql
-- Copie o conteúdo de:
lib/supabase/migrations/003_ciclo4_decisores_sdr.sql
-- E execute no SQL Editor do Supabase
```

**Como fazer:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral → **SQL Editor**
4. Clique **"New query"**
5. Cole o SQL de cada arquivo
6. Clique **"Run"**
7. Repita para os 3 arquivos

---

### ✅ 3. Verificar instalação

```bash
cd c:\Projects\olv-intelligence-prospect-v2
npm run verify-env
```

**Resultado esperado:**
```
✅ Todas as variáveis obrigatórias estão configuradas!

⚠️ APIs opcionais não configuradas:
   - APOLLO_API_KEY
   - HUNTER_API_KEY
   (Isso é OK - sistema funciona sem elas)
```

---

### ✅ 4. Iniciar servidor

```bash
npm run dev
```

**Resultado esperado:**
```
✓ Ready in 3.5s
○ Compiling / ...
✓ Compiled in 1.2s
```

---

### ✅ 5. Testar no navegador

#### A) Dashboard:
```
http://localhost:3000
```

#### B) Lista de Empresas:
```
http://localhost:3000/companies
```

#### C) Health Check:
```
http://localhost:3000/api/health
```

---

## 📚 Onde Obter as Chaves

### Supabase (OBRIGATÓRIO)
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. **Settings** → **API**
4. Copie:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (⚠️ secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### ReceitaWS (OBRIGATÓRIO)
1. Acesse: https://receitaws.com.br/api
2. Crie conta / faça login
3. Obtenha seu token
4. Cole em: `RECEITAWS_API_TOKEN`

### Serper (RECOMENDADO - alternativa gratuita ao Google)
1. Acesse: https://serper.dev
2. Crie conta
3. Obtenha API key
4. Cole em: `SERPER_API_KEY`

### Google Custom Search (ALTERNATIVA ao Serper)
1. Acesse: https://console.cloud.google.com
2. Crie/selecione projeto
3. Ative **Custom Search API**
4. Crie credenciais (API Key)
5. Crie **Custom Search Engine**: https://programmablesearchengine.google.com
6. Copie:
   - API Key → `GOOGLE_API_KEY`
   - Search Engine ID → `GOOGLE_CSE_ID`

### Apollo.io (OPCIONAL - Ciclo 4)
1. Acesse: https://apollo.io
2. Crie conta
3. Settings → API
4. Gere API key
5. Cole em: `APOLLO_API_KEY`

### Hunter.io (OPCIONAL - Ciclo 4)
1. Acesse: https://hunter.io
2. Crie conta
3. API → Generate key
4. Cole em: `HUNTER_API_KEY`

### PhantomBuster (OPCIONAL - Ciclo 4)
1. Acesse: https://phantombuster.com
2. Crie conta
3. Settings → API Key
4. Cole em: `PHANTOM_BUSTER_API_KEY`

### BuiltWith (OPCIONAL - Ciclo 3)
1. Acesse: https://api.builtwith.com
2. Crie conta
3. Obtenha API key
4. Cole em: `BUILTWITH_API_KEY`

---

## ⚡ Configuração Mínima para Testar

**Essencial (sistema funciona):**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RECEITAWS_API_TOKEN=...
SERPER_API_KEY=... (ou GOOGLE_API_KEY + GOOGLE_CSE_ID)
```

**Opcional (funcionalidades extras):**
```env
APOLLO_API_KEY=... (decisores)
HUNTER_API_KEY=... (validação de e-mails)
BUILTWITH_API_KEY=... (tech stack enriquecido)
```

---

## 🧪 Teste Rápido

### 1. Buscar empresa:
```
http://localhost:3000
Digite CNPJ: 18.627.195/0001-60
```

### 2. Ver lista:
```
http://localhost:3000/companies
Clique no nome da empresa
```

### 3. Ver enriquecimento:
```
Tab "Digital" → Atualizar Digital
Tab "Tech Stack" → Atualizar Tech Stack
Tab "Decisores" → Atualizar Decisores (se Apollo configurado)
```

---

## 🆘 Problemas?

### ❌ "Arquivo .env.local não encontrado"
**Solução:** Crie o arquivo manualmente conforme passo 1

### ❌ "SUPABASE_URL não configurada"
**Solução:** Verifique se `.env.local` está na raiz do projeto e tem as variáveis corretas

### ❌ "Table 'companies' does not exist"
**Solução:** Execute os 3 arquivos SQL conforme passo 2

### ❌ Servidor não inicia
**Solução:** 
1. Verifique se `.env.local` existe
2. Execute: `npm install`
3. Execute: `npm run verify-env`
4. Tente novamente: `npm run dev`

---

## ✅ Checklist Final

- [ ] `.env.local` criado com chaves REAIS
- [ ] 3 arquivos SQL executados no Supabase
- [ ] `npm install` executado
- [ ] `npm run verify-env` passou
- [ ] `npm run dev` iniciou sem erros
- [ ] http://localhost:3000 acessível
- [ ] SearchHub funciona (busca por CNPJ)
- [ ] Lista de empresas funciona
- [ ] Página de detalhes funciona (/companies/[id])

---

**✅ Setup Completo!**

Agora você pode testar todos os 4 ciclos implementados! 🚀

---

**Próximo:** Aguardando especificações do **CICLO 5 - SDR OLV**

