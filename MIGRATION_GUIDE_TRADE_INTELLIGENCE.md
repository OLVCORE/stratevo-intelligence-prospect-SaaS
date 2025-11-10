# 📘 GUIA DE MIGRAÇÃO: TOTVS → TRADE INTELLIGENCE

---

## 🎯 OBJETIVO

Transformar `olv-intelligence-prospect-v2` (TOTVS) em `olv-trade-intelligence` (Multi-tenant SaaS).

---

## ✅ PASSO A PASSO

### **PASSO 1: Clonar Projeto (Você faz)**

```bash
# 1. Ir para pasta de projetos
cd C:\Projects\

# 2. Copiar projeto inteiro
xcopy /E /I olv-intelligence-prospect-v2 olv-trade-intelligence

# 3. Entrar no novo projeto
cd olv-trade-intelligence

# 4. Limpar git history (começar do zero)
rmdir /S /Q .git
git init
git add .
git commit -m "chore: initial clone from TOTVS project"

# 5. Criar repo no GitHub
# Vá em: https://github.com/OLVCORE
# Clique em "New Repository"
# Nome: olv-trade-intelligence
# Description: Multi-tenant SaaS for Export/Import Intelligence
# Private: ✅

# 6. Conectar ao novo repo
git remote add origin https://github.com/OLVCORE/olv-trade-intelligence.git
git push -u origin master
```

---

### **PASSO 2: Criar Novo Projeto Supabase (Você faz)**

```
1. Vá em: https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - Name: olv-trade-intelligence
   - Database Password: [CRIAR SENHA FORTE]
   - Region: South America (São Paulo)
4. Aguarde ~2 minutos (criação do projeto)
5. Copie a URL e anon key:
   - Project URL: https://[PROJECT_ID].supabase.co
   - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **PASSO 3: Configurar .env (Você faz)**

```bash
# No novo projeto, edite o .env.local:

# SUPABASE (NOVO PROJETO)
VITE_SUPABASE_URL=https://[NOVO_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[NOVA_ANON_KEY]

# APIs (copiar do projeto TOTVS)
VITE_APOLLO_API_KEY=[sua chave]
VITE_SERPER_API_KEY=[sua chave]
LUSHA_API_KEY=f72937c7-cd70-4e01-931e-5ec3a5017e21
HUNTER_API_KEY=[sua chave]

# Supabase Secrets (executar depois)
# supabase secrets set APOLLO_API_KEY=[sua chave]
# supabase secrets set SERPER_API_KEY=[sua chave]
# supabase secrets set LUSHA_API_KEY=f72937c7-cd70-4e01-931e-5ec3a5017e21
# supabase secrets set HUNTER_API_KEY=[sua chave]
```

---

### **PASSO 4: Executar SQL Setup (Você faz)**

```
1. Abra o Supabase Dashboard do NOVO projeto
2. Vá em: SQL Editor
3. Abra o arquivo: DATABASE_SETUP_TRADE_INTELLIGENCE.sql
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em "Run"
7. Aguarde confirmação de sucesso
8. Verifique:
   - Tenants: 1 (MetaLife)
   - Workspaces: 3 (Domestic, Export, Import)
   - HS Codes: 3
```

---

### **PASSO 5: Abrir Projeto no Cursor (Você faz)**

```bash
# 1. Abrir VS Code / Cursor
code C:\Projects\olv-trade-intelligence

# 2. Aguardar carregar
# 3. Abrir arquivo: INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md
# 4. Selecionar TODO o conteúdo (Ctrl+A)
# 5. Copiar (Ctrl+C)
# 6. Abrir Cursor Chat (Ctrl+L)
# 7. Colar o prompt completo
```

---

### **PASSO 6: Prompt para o Cursor (Você cola)**

```
Olá! Este é o projeto OLV Trade Intelligence, clonado de olv-intelligence-prospect-v2.

Por favor, leia o arquivo INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md completamente.

Este arquivo contém:
- Contexto histórico do projeto
- Objetivos da transformação
- Estrutura de database
- Mudanças necessárias no código
- Checklist completo de tarefas

EXECUTE AS SEGUINTES FASES EM ORDEM:

FASE 1: Database & Multi-Tenancy
- Verificar se tabelas foram criadas (tenants, workspaces, tenant_products)
- Criar TenantContext e TenantProvider
- Criar WorkspaceSwitcher component
- Modificar hooks para filtrar por workspace_id

FASE 2: Remover Hard-coded TOTVS
- Deletar PRODUCT_SEGMENT_MATRIX.ts
- Remover todas referências a "TOTVS", "Protheus", "Fluig"
- Renomear TOTVSCheckCard → ProductAnalysisCard
- Substituir lógica "sem TOTVS = quente" por lógica dinâmica

FASE 3: Product Catalog
- Criar ProductCatalogManager component
- Criar Edge Function import-product-catalog
- Implementar crawl de metalifepilates.com.br
- Importar 246 produtos MetaLife

FASE 4: Export Intelligence
- Criar ExportFitAnalysis component
- Criar Edge Function discover-importers
- Implementar HS Code matching
- Implementar Export Fit Score

NÃO PULE NENHUMA FASE. Quando terminar cada fase, me avise para eu revisar.

Primeiro tenant: MetaLife Pilates
CNPJ: 06.334.616/0001-85
Website: https://metalifepilates.com.br/

Pode começar pela FASE 1!
```

---

## 📋 ARQUIVOS DE SUPORTE CRIADOS

Eu criei 3 arquivos para você:

1. ✅ **`INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md`**
   - Prompt completo para o Cursor
   - Contexto histórico
   - Objetivos
   - Checklist de tarefas

2. ✅ **`DATABASE_SETUP_TRADE_INTELLIGENCE.sql`**
   - Script SQL completo
   - Criar tabelas (tenants, workspaces, products)
   - Adicionar colunas nas tabelas existentes
   - RLS policies
   - Dados iniciais (MetaLife, workspaces, HS Codes)

3. ✅ **`MIGRATION_GUIDE_TRADE_INTELLIGENCE.md`**
   - Este arquivo
   - Passo a passo manual
   - Comandos exatos
   - O que você precisa fazer

---

## 🎯 RESUMO (TL;DR)

**VOCÊ FAZ:**
1. ✅ Clonar projeto: `olv-intelligence-prospect-v2` → `olv-trade-intelligence`
2. ✅ Criar novo projeto Supabase
3. ✅ Executar `DATABASE_SETUP_TRADE_INTELLIGENCE.sql` no SQL Editor
4. ✅ Abrir novo projeto no Cursor
5. ✅ Colar prompt do `INITIALIZATION_PROMPT_TRADE_INTELLIGENCE.md` no chat

**CURSOR FAZ (automaticamente):**
1. ✅ Implementar multi-tenancy
2. ✅ Remover hard-coded TOTVS
3. ✅ Criar product catalog manager
4. ✅ Implementar export intelligence
5. ✅ Importar produtos MetaLife
6. ✅ Configurar workspace switcher

---

## ⏱️ TEMPO ESTIMADO

- **Você (Manual):** 30 minutos
- **Cursor (Auto):** 4-6 horas (depende da complexidade)

---

## ✅ RESULTADO FINAL

Você terá **2 PROJETOS FUNCIONAIS:**

1. **olv-intelligence-prospect-v2** ← TOTVS (intacto)
2. **olv-trade-intelligence** ← SaaS Multi-tenant (novo)

**Ambos independentes, ambos funcionais!** 🎉

---

## 🚀 PRONTO PARA COMEÇAR?

Confirme e eu finalizo os arquivos! 📄

