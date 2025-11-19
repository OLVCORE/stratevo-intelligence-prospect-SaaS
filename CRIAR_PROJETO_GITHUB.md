# 🐙 GUIA: CRIAR REPOSITÓRIO NO GITHUB

## Passo a Passo Detalhado

### 1. Acessar GitHub

1. Vá para: https://github.com
2. Faça login na sua conta

### 2. Criar Novo Repositório

1. Clique no botão **"+"** (canto superior direito)
2. Selecione **"New repository"**

### 3. Preencher Dados do Repositório

**Repository name:**
```
intelligent-prospecting-saas
```

**Description:**
```
Plataforma SaaS de prospecção inteligente multi-setorial com ICP personalizado por IA
```

**Visibility:**
- ⚠️ **Private** - Recomendado (projeto proprietário)
- Ou **Public** - Se quiser código aberto

**⚠️ IMPORTANTE - NÃO MARQUE:**
- ❌ Add a README file
- ❌ Add .gitignore
- ❌ Choose a license

(Vamos criar tudo do zero)

### 4. Criar Repositório

1. Clique em **"Create repository"**

### 5. Obter URL do Repositório

Após criar, você verá uma página com instruções. Copie a URL:

**HTTPS:**
```
https://github.com/seu-usuario/intelligent-prospecting-saas.git
```

**SSH (se configurado):**
```
git@github.com:seu-usuario/intelligent-prospecting-saas.git
```

### 6. Conectar Repositório Local

No terminal do projeto (após criar a estrutura local):

```powershell
# Adicionar remote
git remote add origin https://github.com/seu-usuario/intelligent-prospecting-saas.git

# Verificar
git remote -v

# Fazer primeiro push
git add .
git commit -m "Initial commit: Setup projeto SaaS multi-tenant"
git push -u origin main
```

---

## ✅ Checklist

- [ ] Repositório criado no GitHub
- [ ] URL do repositório copiada
- [ ] Remote adicionado no projeto local
- [ ] Primeiro commit feito
- [ ] Código pushado para GitHub

---

## 🔒 Configurações Recomendadas

### 1. Proteger Branch Main

1. Vá em **Settings** → **Branches**
2. Adicione regra para `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging

### 2. Configurar Secrets (para CI/CD)

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione secrets:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `STRIPE_SECRET_KEY`
   - `OPENAI_API_KEY`

### 3. Configurar Branch Protection

1. Vá em **Settings** → **Branches**
2. Configure proteção para `main`:
   - Não permitir push direto
   - Exigir PR para merge

---

## 📝 README Inicial

Após criar o repositório, você pode adicionar um README básico:

```markdown
# Intelligent Prospecting Platform - SaaS Multi-Tenant

Plataforma de prospecção inteligente multi-setorial com ICP personalizado por IA.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase) - Schema-based multi-tenancy
- **ORM:** Prisma
- **Auth:** Clerk
- **Payments:** Stripe
- **IA:** OpenAI GPT-4

## 📋 Status do Projeto

🚧 **Em Desenvolvimento**

## 📚 Documentação

- [Setup Inicial](./SETUP_NOVO_PROJETO_SAAS.md)
- [Arquitetura Multi-Tenant](./MULTI_TENANCY_IMPLEMENTATION.md)

## 📄 Licença

Proprietário - Todos os direitos reservados
```

---

## 🔄 Workflow Git Recomendado

### Branches:

- `main` - Produção (protegida)
- `develop` - Desenvolvimento
- `feature/*` - Novas features
- `fix/*` - Correções

### Commits:

Use mensagens descritivas:
```
feat: adicionar onboarding wizard
fix: corrigir criação de tenant
docs: atualizar README
refactor: reorganizar estrutura de pastas
```

---

## 🆘 Troubleshooting

### Erro: "remote origin already exists"

```powershell
# Remover remote existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/seu-usuario/intelligent-prospecting-saas.git
```

### Erro: "failed to push"

```powershell
# Verificar se está na branch main
git branch

# Se não estiver, criar e mudar
git checkout -b main
git push -u origin main
```

---

## 📚 Recursos

- [GitHub Docs](https://docs.github.com)
- [Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [Conventional Commits](https://www.conventionalcommits.org)

