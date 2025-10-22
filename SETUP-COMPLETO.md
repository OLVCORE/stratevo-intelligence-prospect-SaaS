# 🚀 SETUP COMPLETO - OLV Intelligence Prospect v2

## 📋 GUIA PASSO A PASSO

### 1️⃣ CLONAR/ABRIR PROJETO

```bash
cd c:\Projects\olv-intelligence-prospect-v2
```

---

### 2️⃣ INSTALAR DEPENDÊNCIAS

```bash
npm install
```

**Dependências Principais:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Client
- Zod (validação)
- @react-pdf/renderer (PDF)
- Papaparse (CSV)
- Recharts (gráficos)
- Zustand (state)
- Nodemailer (SMTP)

**Dependências de Dev:**
- Playwright (E2E)
- Husky (git hooks)
- ESLint + TypeScript

---

### 3️⃣ CONFIGURAR PLAYWRIGHT

```bash
npx playwright install
```

---

### 4️⃣ CONFIGURAR HUSKY (Git Hooks)

```bash
npx husky install
chmod +x .husky/pre-push
```

---

### 5️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE

**Copie `.env.example` para `.env.local`:**

```bash
cp .env.example .env.local
```

**Edite `.env.local` com suas chaves REAIS:**

```env
# SUPABASE (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# PROVIDERS (para funcionalidade completa)
RECEITAWS_API_TOKEN=sua-key
SERPER_API_KEY=sua-key

# SMTP (para relatórios por e-mail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
FROM_EMAIL=seu-email@gmail.com

# SEGURANÇA
CRON_SECRET=uma-string-forte-aleatoria

# APP
NEXT_PUBLIC_APP_NAME="OLV Intelligent Prospect v2"
```

**Obter Chaves:**
- **Supabase**: https://supabase.com/dashboard → Seu Projeto → Settings → API
- **ReceitaWS**: https://receitaws.com.br/
- **Serper**: https://serper.dev/

---

### 6️⃣ EXECUTAR SQL MIGRATIONS

**Acesse:** https://supabase.com/dashboard → Seu Projeto → SQL Editor

**Execute EM ORDEM** (copie/cole cada arquivo):

1. `lib/supabase/migrations/001_ciclo1_companies.sql`
2. `lib/supabase/migrations/002_ciclo3_enrichment.sql`
3. `lib/supabase/migrations/003_ciclo4_decisores_sdr.sql`
4. `lib/supabase/migrations/004_ciclo5_sdr.sql`
5. `lib/supabase/migrations/005_ciclo6_maturidade_fit.sql`
6. `lib/supabase/migrations/006_ciclo7_playbooks.sql`
7. `lib/supabase/migrations/007_ciclo8_reports.sql`

**Validar:**
```sql
-- Deve retornar 24 tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

### 7️⃣ VALIDAR AMBIENTE

```bash
npm run verify-env
```

**Esperado:**
```
✅ Todas as variáveis obrigatórias estão presentes
✅ URLs válidas
```

---

### 8️⃣ INICIAR SERVIDOR

```bash
npm run dev
```

**Aguarde compilação (~30-60s primeira vez)**

**Esperado:**
```
✓ Ready in 3.5s
○ Local:        http://localhost:3000
```

---

### 9️⃣ VALIDAR ROTAS

**Em outro terminal:**

```bash
npm run doctor
```

**Esperado:**
```
🔎 Doctor @ http://localhost:3000

✅ /                    200  true  45ms
✅ /companies           200  true  23ms
✅ /reports             200  true  18ms
✅ /api/health          200  true  89ms
...

✅ Todas as rotas core responderam corretamente!
```

---

### 🔟 VALIDAR NAVEGAÇÃO (E2E)

```bash
npm run test:smoke
```

**Esperado:**
```
✓ [chromium] › e2e.smoke.spec.ts:8:1 › Fluxo mínimo de navegação viva (2.3s)
✓ [chromium] › e2e.smoke.spec.ts:35:1 › Navegação entre páginas via header (1.8s)
✓ [chromium] › e2e.smoke.spec.ts:58:1 › API Health endpoint responde (156ms)

3 passed (4.3s)
```

---

## 🎯 PÁGINAS DISPONÍVEIS

### Principais
- http://localhost:3000 - **Dashboard** (SearchHub)
- http://localhost:3000/companies - **Lista de Empresas**
- http://localhost:3000/companies/[id] - **Detalhes da Empresa**
  - Tabs: Digital, Tech Stack, Decisores, Maturidade & Fit
- http://localhost:3000/leads/[id] - **SDR Inbox**
  - Tabs: Inbox, Sequência
- http://localhost:3000/playbooks - **Playbooks**
- http://localhost:3000/reports - **Relatórios & Export**

### Utilitárias
- http://localhost:3000/_status - **Painel de Status**
- http://localhost:3000/api/health - **Health Check (JSON)**

---

## 🧪 PIPELINE CI LOCAL

### Automático (Git Push)

```bash
git add .
git commit -m "feat: minha feature"
git push
```

**O que acontece:**
1. Hook `.husky/pre-push` intercepta
2. Executa `npm run ci:quick`
3. Build → Doctor → Smoke
4. Se tudo passar → push continua
5. Se falhar → push bloqueado

### Manual

```bash
# Pipeline completo
npm run ci:quick

# Apenas build
npm run build

# Apenas validação de rotas
npm run doctor

# Apenas testes E2E
npm run test:smoke
```

---

## 🔍 TROUBLESHOOTING

### Erro: "Variáveis de ambiente inválidas"

**Solução:**
1. Confirme que `.env.local` existe
2. Valide URLs e keys com `npm run verify-env`
3. Copie formato exato de `.env.example`

### Erro: "Connection refused" ao acessar localhost:3000

**Solução:**
1. Confirme que `npm run dev` está rodando
2. Aguarde compilação completa (~60s)
3. Verifique porta 3000 disponível

### Erro: Rotas retornam 422/502 no Doctor

**Isso é NORMAL se:**
- Você não configurou todas as keys de providers
- Está em ambiente de visualização apenas

**422/502 NÃO bloqueiam o pipeline.**

Bloqueiam apenas: 404, 500, timeout.

### Erro: Playwright não instalado

**Solução:**
```bash
npx playwright install
```

### Erro: Husky não funciona

**Solução:**
```bash
npx husky install
chmod +x .husky/pre-push
```

---

## 📊 CICLOS IMPLEMENTADOS

| Ciclo | Feature | Arquivos | Status |
|-------|---------|----------|--------|
| 1 | SearchHub + Company Context | 12 | ✅ |
| 2 | Lista de Empresas | 8 | ✅ |
| 3 | Enriquecimento Digital + Tech | 14 | ✅ |
| 4 | Decisores + SDR Base | 10 | ✅ |
| 5 | SDR Inbox (Email/WhatsApp) | 16 | ✅ |
| 6 | Maturidade + FIT TOTVS | 12 | ✅ |
| 7 | Playbooks & Sequencer | 15 | ✅ |
| 8 | Relatórios & Export (PDF/CSV) | 13 | ✅ |
| **TOTAL** | **8 Ciclos Completos** | **100+** | ✅ |

---

## 🎓 COMANDOS RÁPIDOS

```bash
# Desenvolvimento
npm run dev              # Servidor dev com hot-reload
npm run build            # Build produção
npm run start            # Servidor produção

# Validação
npm run verify-env       # Valida .env.local
npm run doctor           # Valida rotas core
npm run test:smoke       # Testes E2E
npm run ci:quick         # Pipeline completo

# Utilitários
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

---

## 📚 DOCUMENTAÇÃO

### Por Ciclo
- `CICLO1-RESUMO.md` até `CICLO8-RESUMO.md`
- `CICLO1-DOD.md` até `CICLO8-DOD.md`
- `CICLO1-TESTE-DE-MESA.md` até `CICLO8-TESTE-DE-MESA.md`

### Geral
- `README.md` - Overview do projeto
- `INSTRUCOES-IMPORTANTES.md` - Regras imutáveis
- `MINI-PIPELINE-CI.md` - Pipeline local
- `SETUP-COMPLETO.md` - Este arquivo

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Setup Completo** (você está aqui!)
2. ⏭️ **Testar com Dados Reais** (configurar keys de providers)
3. ⏭️ **Popular Banco** (usar SearchHub para buscar empresas)
4. ⏭️ **Ciclo 9?** (Analytics 360 & Telemetria)

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] `npm install` sem erros
- [ ] `npx playwright install` executado
- [ ] `npx husky install` executado
- [ ] `.env.local` criado e preenchido
- [ ] 7 SQL migrations executadas no Supabase
- [ ] `npm run verify-env` passa
- [ ] `npm run dev` inicia sem erros
- [ ] `npm run doctor` todas as rotas 2xx/422/502
- [ ] `npm run test:smoke` 3 testes passam
- [ ] `git push` dispara pipeline automaticamente
- [ ] `http://localhost:3000` acessível
- [ ] `http://localhost:3000/_status` mostra status

---

**Status:** ✅ PRONTO PARA DESENVOLVIMENTO

**Tempo de Setup:** ~10-15 minutos

**Próximo:** Comece a usar o SearchHub para buscar empresas!

