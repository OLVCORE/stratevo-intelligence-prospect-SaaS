# 🚀 OLV Intelligence Prospect v2

> Plataforma B2B SaaS de Prospecção & Inteligência com dados reais, multi-tenancy e automação SDR.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

---

## 📋 Visão Geral

Plataforma completa para prospecção B2B com:

- 🔍 **Busca inteligente** por CNPJ/Website
- 🌐 **Enriquecimento automático** (ReceitaWS, Google, Apollo, Hunter)
- 💬 **SDR automatizado** (Email + WhatsApp)
- 📊 **Analytics 360°** com cache materializado (SLA < 1.5s)
- 🔔 **Alertas proativos** (5 tipos de eventos)
- 📄 **Relatórios PDF** profissionais
- 🎯 **Playbooks A/B** para outreach
- 🛡️ **Multi-tenancy** com RLS e permissões

---

## 🏗️ Arquitetura

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Charts:** Recharts

### Backend
- **Database:** Supabase (Postgres)
- **Validation:** Zod
- **PDF:** @react-pdf/renderer
- **Email:** Nodemailer
- **WhatsApp:** Twilio

### Segurança
- **Multi-Tenancy:** RLS + Policies
- **LGPD:** Privacy-by-design
- **Audit:** Logs completos
- **CI/CD:** Pipeline automatizado

---

## 🚀 Quick Start

### 1. Pré-requisitos
- Node.js >= 18
- npm >= 9
- Conta Supabase (grátis)

### 2. Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd olv-intelligence-prospect-v2

# Instalar dependências
npm install
npx playwright install
npx husky install
```

### 3. Configuração

```bash
# Copiar exemplo de ENV
cp .env.example .env.local

# Editar com suas chaves
# (ver ENV-SETUP.md para detalhes)
```

### 4. Banco de Dados

Execute as migrations no Supabase SQL Editor (em ordem):
1. `lib/supabase/migrations/001_ciclo1_companies.sql`
2. ... até ...
11. `lib/supabase/migrations/011_batch3_sdr_decisores.sql`

### 5. Iniciar

```bash
# Desenvolvimento
npm run dev

# Acessar
http://localhost:3000
```

---

## 📚 Documentação

### Guias Principais
- **`LEIA-ME-PRIMEIRO.md`** - ⭐ Comece aqui!
- **`SETUP-COMPLETO.md`** - Setup detalhado
- **`DEPLOY-VERCEL-GUIA.md`** - Deploy em produção

### Ciclos Implementados
- `CICLO1-RESUMO.md` até `CICLO11-RESUMO.md`
- Cada ciclo tem: RESUMO + DOD + TESTE-DE-MESA

### Integração Multi-Tenant
- `BATCH3-GUIA-FINALIZACAO.md` até `BATCH7-ALERTAS-GUIA.md`
- Aplicar padrões de proteção em rotas

---

## 🧪 Testes

```bash
# Validação completa
npm run ci:full

# Testes individuais
npm run doctor           # Valida rotas
npm run test:smoke       # E2E básico
npm run test:tenant      # Isolamento
npm run ci:perf          # Performance
npm run ci:tenant        # Guard multi-tenant
```

---

## 🔐 Segurança

### Multi-Tenancy
- ✅ RLS habilitada em 17 tabelas
- ✅ 20+ políticas SQL por papel
- ✅ Workspace Switcher (isolamento UI)
- ✅ Guardrails CI (bloqueia vazamentos)

### LGPD
- ✅ Privacy-by-design
- ✅ Message body opcional
- ✅ Retention configurável
- ✅ Audit trail completo

---

## 📊 Funcionalidades

### Core
- ✅ Busca por CNPJ/Website
- ✅ Enriquecimento (Digital + Tech Stack)
- ✅ Decisores (Apollo, Hunter, PhantomBuster)
- ✅ Maturidade (6 pilares)
- ✅ FIT TOTVS (6 áreas)

### SDR
- ✅ Inbox unificado (Email + WhatsApp)
- ✅ Templates parametrizados
- ✅ Playbooks multi-step
- ✅ A/B testing
- ✅ Webhooks inbound

### Analytics
- ✅ Funil de conversão
- ✅ Performance de playbooks
- ✅ Heatmap de engajamento
- ✅ Eficiência por persona

### Alertas
- ✅ 5 tipos de eventos
- ✅ Notificações multi-canal
- ✅ Digests diário/semanal

---

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Ver guia completo: `DEPLOY-VERCEL-GUIA.md`

---

## 🎯 Status do Projeto

- ✅ **11 ciclos** funcionais (100%)
- ✅ **Multi-tenancy** estruturado
- 🔄 **Integração** em progresso (30%)
- ✅ **Documentação** completa
- ✅ **CI/CD** operacional

**Versão:** 2.11.0  
**Status:** Fundação Production-Ready

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `LEIA-ME-PRIMEIRO.md`
2. Verifique `/_status` (diagnóstico)
3. Execute `npm run doctor`
4. Veja logs específicos de cada ciclo

---

## 📜 Licença

Proprietary - © 2025 OLV

---

## 🙏 Créditos

Desenvolvido seguindo metodologia de ciclos curtos com:
- ✅ Dados reais (zero mocks)
- ✅ Testes em cada ciclo
- ✅ Definition of Done (DoD)
- ✅ Pipeline CI/CD
