# 🚀 GUIA COMPLETO - CRIAR NOVO PROJETO SAAS

## 📋 CHECKLIST DE SETUP

### ✅ FASE 1: Criar Projeto no GitHub

### ✅ FASE 2: Criar Projeto no Supabase

### ✅ FASE 3: Setup Local do Projeto

### ✅ FASE 4: Configurar Conexões

---

## FASE 1: GITHUB - Criar Repositório

### Passo 1.1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name:** `intelligent-prospecting-saas`
3. **Description:** `Plataforma SaaS de prospecção inteligente multi-setorial`
4. **Visibility:** Private (ou Public, conforme preferência)
5. **NÃO marque** "Add a README file" (vamos criar do zero)
6. Clique em **"Create repository"**

### Passo 1.2: Copiar URL do Repositório

Após criar, copie a URL do repositório:
- Exemplo: `https://github.com/seu-usuario/intelligent-prospecting-saas.git`

---

## FASE 2: SUPABASE - Criar Projeto

### Passo 2.1: Criar Novo Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `intelligent-prospecting-saas`
   - **Database Password:** (anote esta senha!)
   - **Region:** Escolha a mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan:** Free (ou Pro, se tiver)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto ser criado

### Passo 2.2: Obter Credenciais do Supabase

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Anote:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGci...`
   - **service_role key:** `eyJhbGci...` (⚠️ SECRETO!)

3. Vá em **Settings** → **Database**
4. Anote a **Connection string** (URI):
   - Formato: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

---

## FASE 3: SETUP LOCAL DO PROJETO

### Passo 3.1: Criar Diretório e Clonar

Execute no PowerShell (na pasta pai do projeto atual):

```powershell
# Navegar para pasta pai
cd ..

# Criar diretório
mkdir intelligent-prospecting-saas
cd intelligent-prospecting-saas

# Inicializar Git
git init
git branch -M main

# Adicionar remote do GitHub (SUBSTITUA pela URL do seu repositório)
git remote add origin https://github.com/seu-usuario/intelligent-prospecting-saas.git
```

### Passo 3.2: Criar .gitignore

Criar arquivo `.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env*.local

# Prisma
prisma/migrations/

# Vercel
.vercel

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### Passo 3.3: Inicializar Next.js

```powershell
# Criar projeto Next.js
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --yes

# Instalar dependências principais
npm install @prisma/client
npm install -D prisma
npm install @clerk/nextjs
npm install stripe
npm install zod
npm install react-hook-form
npm install @hookform/resolvers
npm install axios
npm install date-fns
npm install lucide-react
npm install @tanstack/react-query
```

### Passo 3.4: Inicializar Prisma

```powershell
# Inicializar Prisma
npx prisma init
```

Isso criará:
- `prisma/schema.prisma`
- `.env` (se não existir)

---

## FASE 4: CONFIGURAR CONEXÕES

### Passo 4.1: Configurar .env

Edite o arquivo `.env` e adicione:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres"

# Clerk (Authentication)
# Obter em: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Stripe (Payments)
# Obter em: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# OpenAI (ICP Analysis)
OPENAI_API_KEY=sk-xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** Substitua `[SUA_SENHA]` pela senha do banco do Supabase!

### Passo 4.2: Configurar Clerk

1. Acesse: https://dashboard.clerk.com
2. Clique em **"Create Application"**
3. Nome: `Intelligent Prospecting SaaS`
4. Escolha: **Email, Phone, Username** (ou apenas Email)
5. Copie as chaves para o `.env`

### Passo 4.3: Configurar Stripe (Opcional - pode fazer depois)

1. Acesse: https://dashboard.stripe.com
2. Vá em **Developers** → **API keys**
3. Copie as chaves de teste para o `.env`

---

## FASE 5: CRIAR ESTRUTURA DO PROJETO

### Passo 5.1: Criar Estrutura de Pastas

Execute no PowerShell:

```powershell
# Criar estrutura de pastas
New-Item -ItemType Directory -Force -Path "src/app/(auth)/login"
New-Item -ItemType Directory -Force -Path "src/app/(auth)/register"
New-Item -ItemType Directory -Force -Path "src/app/(auth)/onboarding"
New-Item -ItemType Directory -Force -Path "src/app/(dashboard)/empresas"
New-Item -ItemType Directory -Force -Path "src/app/(dashboard)/decisores"
New-Item -ItemType Directory -Force -Path "src/app/(dashboard)/settings"
New-Item -ItemType Directory -Force -Path "src/app/api/auth"
New-Item -ItemType Directory -Force -Path "src/app/api/onboarding"
New-Item -ItemType Directory -Force -Path "src/app/api/tenants"
New-Item -ItemType Directory -Force -Path "src/components/ui"
New-Item -ItemType Directory -Force -Path "src/components/onboarding"
New-Item -ItemType Directory -Force -Path "src/components/dashboard"
New-Item -ItemType Directory -Force -Path "src/lib"
New-Item -ItemType Directory -Force -Path "src/services"
New-Item -ItemType Directory -Force -Path "src/middleware"
New-Item -ItemType Directory -Force -Path "src/types"
New-Item -ItemType Directory -Force -Path "src/config"
```

---

## FASE 6: CONFIGURAR PRISMA SCHEMA

### Passo 6.1: Substituir schema.prisma

Edite `prisma/schema.prisma` e substitua TODO o conteúdo pelo schema multi-tenant (já criado anteriormente).

### Passo 6.2: Criar Migration

```powershell
# Criar migration inicial
npx prisma migrate dev --name init_multi_tenant

# Gerar Prisma Client
npx prisma generate
```

### Passo 6.3: Verificar no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Verifique se as tabelas foram criadas:
   - `Tenant`
   - `User`
   - `Subscription`
   - `AuditLog`
   - `OnboardingData`

---

## FASE 7: COMMITAR E PUSHAR

### Passo 7.1: Primeiro Commit

```powershell
# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Initial setup: Next.js + Prisma + Multi-tenancy structure"

# Push para GitHub
git push -u origin main
```

---

## ✅ VALIDAÇÃO FINAL

### Testar que tudo funciona:

```powershell
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Acessar http://localhost:3000
# 3. Verificar que não há erros no console
```

### Checklist de Validação:

- [ ] Projeto criado no GitHub ✅
- [ ] Projeto criado no Supabase ✅
- [ ] `.env` configurado com todas as chaves ✅
- [ ] Prisma schema criado ✅
- [ ] Migration executada com sucesso ✅
- [ ] Tabelas visíveis no Supabase ✅
- [ ] `npm run dev` funciona sem erros ✅
- [ ] Código commitado e pushado no GitHub ✅

---

## 🎯 PRÓXIMOS PASSOS

Após validar tudo:

1. **Criar arquivos base** (lib/prisma.ts, lib/clerk.ts, etc.)
2. **Implementar MultiTenantService**
3. **Criar API routes**
4. **Implementar Onboarding Wizard**
5. **Criar Landing Page**

---

## 📝 NOTAS IMPORTANTES

### ⚠️ SEGURANÇA

- **NUNCA** commite o arquivo `.env` no Git
- Use `.env.example` para documentar variáveis necessárias
- Service Role Key do Supabase é SECRETO - não compartilhe

### 🔧 TROUBLESHOOTING

**Erro de conexão com Supabase:**
- Verifique se a senha está correta no `DATABASE_URL`
- Verifique se o projeto Supabase está ativo
- Teste a conexão no Supabase Dashboard → SQL Editor

**Erro no Prisma:**
- Execute `npx prisma generate` novamente
- Verifique se o `DATABASE_URL` está correto
- Tente `npx prisma db push` para forçar sincronização

---

## 🚀 PRONTO!

Agora você tem:
- ✅ Projeto no GitHub
- ✅ Projeto no Supabase
- ✅ Estrutura local configurada
- ✅ Prisma conectado
- ✅ Pronto para começar desenvolvimento!

**Próximo passo:** Criar os arquivos base do projeto seguindo o mega prompt anterior.

