# ⚙️ MINI-PIPELINE LOCAL (CI)

## 🎯 OBJETIVO

Pipeline local automatizado que roda em **todo `git push`**, validando:
- ✅ Build do Next.js sem erros
- ✅ Rotas core respondendo corretamente
- ✅ Navegação E2E funcional
- ✅ Links não quebrados (dev only)

---

## 📦 INSTALAÇÃO

### 1. Instalar Dependências

```bash
npm install
```

As seguintes dependências de desenvolvimento foram adicionadas ao `package.json`:
- `ts-node` - Executor TypeScript
- `playwright` + `@playwright/test` - Testes E2E
- `husky` - Git hooks

### 2. Configurar Playwright

```bash
npx playwright install
```

### 3. Configurar Husky (Git Hooks)

```bash
npx husky install
chmod +x .husky/pre-push
```

---

## 🔧 SCRIPTS DISPONÍVEIS

### `npm run doctor`

Verifica saúde das rotas principais:

```bash
npm run doctor
```

**Output Esperado:**
```
🔎 Doctor @ http://localhost:3000

ROTA                                          STATUS    OK    LATÊNCIA(ms)
──────────────────────────────────────────────────────────────────────────
✅ /                                           200       true  45
✅ /companies                                  200       true  23
✅ /reports                                    200       true  18
✅ /playbooks                                  200       true  21
✅ /api/health                                 200       true  89
✅ /api/export/companies                       200       true  156

──────────────────────────────────────────────────────────────────────────
✅ Todas as rotas core responderam corretamente!
```

**Status não bloqueantes:**
- `422` - Input inválido (esperado sem dados)
- `502` - Provider down (esperado sem keys reais)

**Status bloqueantes:**
- `404` - Rota não encontrada
- `500` - Erro interno
- `0` - Timeout/rede

---

### `npm run test:smoke`

Executa testes E2E de navegação:

```bash
npm run test:smoke
```

**Testes Incluídos:**
1. **Fluxo mínimo de navegação viva**
   - Dashboard renderiza
   - Lista de empresas renderiza
   - Playbooks renderiza
   - Relatórios renderiza
   - Status page renderiza

2. **Navegação entre páginas via header**
   - Clica em "Empresas" → valida URL
   - Clica em "Playbooks" → valida URL
   - Clica em "Relatórios" → valida URL
   - Clica em "Dashboard" → valida URL

3. **API Health endpoint responde**
   - GET /api/health → status 200
   - Response contém `{ ok: ... }`

---

### `npm run ci:quick`

**Pipeline completo** (build + doctor + smoke):

```bash
npm run ci:quick
```

**Ordem de Execução:**
1. `npm run build` - Compila Next.js (type-check incluído)
2. `npm run doctor` - Valida rotas core
3. `npm run test:smoke` - Testes E2E

**Se qualquer etapa falhar, o comando retorna exit code 1.**

---

## 🔒 GIT HOOK (Pre-Push)

O hook `.husky/pre-push` executa **automaticamente** em todo `git push`:

```bash
git push origin main
```

**Fluxo:**
1. Você executa `git push`
2. Husky intercepta e roda `npm run ci:quick`
3. Se passar → push continua
4. Se falhar → push é **bloqueado**

**Como pular (emergências):**
```bash
git push --no-verify
```

---

## 🩺 PAINEL DE STATUS

Acesse **http://localhost:3000/_status** para diagnóstico visual:

**Mostra:**
- ✅ Status de conexão Supabase
- ✅ Status de cada provider (ReceitaWS, Serper, etc.)
- ✅ ENV variables presentes/faltantes
- ✅ JSON completo do `/api/health`

**Útil para:**
- Debug rápido de integradores
- Validar .env.local
- Apresentar status do sistema

---

## 🔗 LINKWATCH (Dev Only)

Componente `LinkWatch` monitora links clicados em **desenvolvimento**:

**Comportamento:**
- Intercepta cliques em `<a href="...">`
- Faz `HEAD` request para validar link
- Se 404/500 → console warning

**Console Output:**
```
🔴 Link possivelmente quebrado: /companies/invalido Status: 404
```

**Produção:**
- Componente é removido automaticamente
- Zero overhead

---

## 📁 ARQUIVOS CRIADOS

### Scripts
- `scripts/doctor.ts` - Verificador de rotas
- `.husky/pre-push` - Git hook

### Testes
- `tests/e2e.smoke.spec.ts` - Smoke tests
- `playwright.config.ts` - Config Playwright

### UI
- `app/_status/page.tsx` - Painel de status
- `components/dev/LinkWatch.tsx` - Monitor de links

### Config
- `package.json` - Scripts + dependências atualizadas

---

## 🎯 DEFINITION OF DONE

### ✅ Instalação
- [ ] `npm install` sem erros
- [ ] `npx playwright install` executado
- [ ] `npx husky install` executado
- [ ] `.husky/pre-push` com permissões executáveis

### ✅ Validação Manual
- [ ] `npm run doctor` passa (todas as rotas 2xx ou 422/502)
- [ ] `npm run test:smoke` passa (3 testes verdes)
- [ ] `npm run ci:quick` completa sem erros
- [ ] Acesso a `/_status` mostra painel de diagnóstico

### ✅ Git Hook
- [ ] `git push` dispara `ci:quick` automaticamente
- [ ] Se build falhar, push é bloqueado
- [ ] Console mostra output do pipeline

### ✅ LinkWatch
- [ ] Console mostra warnings de links quebrados (dev)
- [ ] Em produção, componente não é renderizado

---

## 🧪 TESTE DE MESA

### 1. Doctor - Rotas OK
```bash
npm run doctor
```
**Esperado:** Todas as rotas core com status 200 ou 422/502 (se sem keys)

### 2. Doctor - Rota Quebrada
```bash
# Simule quebrando uma rota (remova arquivo)
npm run doctor
```
**Esperado:** Exit code 1, mostra rota com 404

### 3. Smoke Tests
```bash
npm run test:smoke
```
**Esperado:** 3 testes passam, navegação funcional

### 4. Pipeline Completo
```bash
npm run ci:quick
```
**Esperado:** Build → Doctor → Smoke, todos verdes

### 5. Git Hook
```bash
# Faça um commit qualquer
git add .
git commit -m "test: validar pipeline"
git push
```
**Esperado:** Hook executa ci:quick antes de push

### 6. Status Page
```
http://localhost:3000/_status
```
**Esperado:** Painel renderiza, mostra JSON do /api/health

### 7. LinkWatch (Dev)
```
# Em dev, clique em um link inválido
# Console deve mostrar warning
```
**Esperado:** Console warning com URL e status

---

## 📊 MÉTRICAS

- **7 arquivos criados**
- **3 testes E2E**
- **6 rotas validadas**
- **1 git hook**
- **1 painel de status**
- **1 monitor de links**

---

## 🚀 BENEFÍCIOS

### Antes
- ❌ Push sem validação
- ❌ Regressões silenciosas
- ❌ Links quebrados descobertos em produção
- ❌ Debug manual de integradores

### Depois
- ✅ Push bloqueado se houver erros
- ✅ Regressões detectadas em segundos
- ✅ Links validados em tempo real (dev)
- ✅ Painel de status para diagnóstico rápido

---

## 🎓 COMANDOS ÚTEIS

```bash
# Validar rotas
npm run doctor

# Testes E2E
npm run test:smoke

# Pipeline completo
npm run ci:quick

# Pular hook (emergência)
git push --no-verify

# Ver status do sistema
http://localhost:3000/_status

# Playwright debug
npx playwright test --debug

# Playwright headed (ver browser)
npx playwright test --headed
```

---

## 🔧 CUSTOMIZAÇÃO

### Adicionar Rotas ao Doctor

Edite `scripts/doctor.ts`:

```typescript
const routes = [
  '/',
  '/companies',
  '/sua-nova-rota',  // ← adicione aqui
];
```

### Adicionar Testes E2E

Crie novo arquivo em `tests/`:

```typescript
// tests/meu-fluxo.spec.ts
import { test, expect } from '@playwright/test';

test('Meu fluxo específico', async ({ page }) => {
  await page.goto('/');
  // ... seus testes
});
```

Execute:
```bash
npx playwright test tests/meu-fluxo.spec.ts
```

### Modificar Critérios de Bloqueio

Edite `scripts/doctor.ts`:

```typescript
// Bloquear também por 422/502
const fails = results.filter((x) => !x.ok);
```

---

**Status:** ✅ PIPELINE LOCAL PRONTO PARA PRODUÇÃO

**Desenvolvido com ⚡️ seguindo DevOps best practices**

