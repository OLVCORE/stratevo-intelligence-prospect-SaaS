# 📚 OLV Intelligence Prospect v2 - Índice de Documentação

## 🚀 Início Rápido

Novo no projeto? Comece por aqui:

1. **[INSTALACAO.md](./INSTALACAO.md)** ⭐ **COMECE AQUI**
   - Guia passo a passo completo
   - Instalação de dependências
   - Configuração de variáveis
   - Criação do schema
   - Troubleshooting

2. **[QUICK-START.md](./QUICK-START.md)**
   - Versão resumida (5 minutos)
   - Para quem já tem experiência

---

## 📖 Documentação Técnica

### Geral
- **[README.md](./README.md)** - Documentação técnica completa do projeto
- **[PROJECT-STATUS.md](./PROJECT-STATUS.md)** - Status atual, métricas e roadmap
- **[ENV-SETUP.md](./ENV-SETUP.md)** - Guia detalhado de variáveis de ambiente

### CICLO 4 (Atual) ⭐ NOVO!
- **[CICLO4-STATUS.md](./CICLO4-STATUS.md)** ⭐ **LEIA PRIMEIRO** - Status e como testar
- **[CICLO4-RESUMO.md](./CICLO4-RESUMO.md)** - Resumo executivo do Ciclo 4
- **[CICLO4-DOD.md](./CICLO4-DOD.md)** - Definition of Done (checklist completo)
- **[CICLO4-TESTE-DE-MESA.md](./CICLO4-TESTE-DE-MESA.md)** - Testes práticos detalhados

### CICLO 3 (Completo)
- **[CICLO3-RESUMO.md](./CICLO3-RESUMO.md)** - Resumo executivo do Ciclo 3

### CICLO 2 (Completo)
- **[CICLO2-STATUS.md](./CICLO2-STATUS.md)** - Status e como testar
- **[CICLO2-RESUMO.md](./CICLO2-RESUMO.md)** - Resumo executivo do Ciclo 2
- **[CICLO2-DOD.md](./CICLO2-DOD.md)** - Definition of Done (checklist completo)
- **[CICLO2-TESTE-DE-MESA.md](./CICLO2-TESTE-DE-MESA.md)** - Testes práticos detalhados

### CICLO 1 (Completo)
- **[CICLO1-RESUMO.md](./CICLO1-RESUMO.md)** - Resumo executivo do Ciclo 1
- **[CICLO1-DOD.md](./CICLO1-DOD.md)** - Definition of Done (checklist completo)
- **[CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md)** - Testes práticos detalhados
- **[TESTE-DE-MESA.md](./TESTE-DE-MESA.md)** - Testes do setup inicial

---

## 🗂️ Estrutura do Projeto

```
olv-intelligence-prospect-v2/
│
├── 📄 Documentação
│   ├── INDEX.md (este arquivo)
│   ├── INSTALACAO.md ⭐ COMECE AQUI
│   ├── QUICK-START.md
│   ├── README.md
│   ├── PROJECT-STATUS.md
│   ├── ENV-SETUP.md
│   ├── CICLO1-RESUMO.md
│   ├── CICLO1-DOD.md
│   └── CICLO1-TESTE-DE-MESA.md
│
├── 📁 app/ - Next.js App Router
│   ├── (dashboard)/
│   │   ├── layout.tsx - Layout principal
│   │   └── page.tsx - Dashboard
│   ├── api/
│   │   ├── health/route.ts - Health check
│   │   └── companies/smart-search/route.ts - Busca inteligente
│   ├── globals.css
│   └── layout.tsx - Root layout
│
├── 📁 lib/ - Lógica de negócio
│   ├── cnpj.ts - Validação/normalização
│   ├── money.ts - Conversão monetária
│   ├── fetchers.ts - Retry + timeout
│   ├── utils.ts - Utilities gerais
│   ├── providers/
│   │   ├── receitaws.ts - API ReceitaWS
│   │   └── search.ts - Google CSE/Serper
│   ├── state/
│   │   └── company.ts - Context global
│   └── supabase/
│       ├── browser.ts - Cliente browser
│       ├── server.ts - Cliente server
│       └── migrations/
│           └── 001_ciclo1_companies.sql
│
├── 📁 components/ - Componentes React
│   ├── GlobalHeader.tsx - Header com contexto
│   └── SearchHub.tsx - Busca única
│
├── 📁 types/ - TypeScript types
│   ├── database.types.ts - Schema Supabase
│   └── index.ts - Tipos do domínio
│
├── 📁 scripts/
│   └── verify-env.ts - Validação de ENV
│
└── 📁 Configuração
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── postcss.config.js
```

---

## 🎯 Por Onde Começar?

### 👨‍💻 Desenvolvedor Novo
1. [INSTALACAO.md](./INSTALACAO.md) - Instalar e configurar
2. [QUICK-START.md](./QUICK-START.md) - Testar rapidamente
3. [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) - Validar funcionamento
4. [README.md](./README.md) - Entender a arquitetura

### 🎨 Designer/Product Manager
1. [CICLO1-RESUMO.md](./CICLO1-RESUMO.md) - Visão geral executiva
2. [QUICK-START.md](./QUICK-START.md) - Ver o sistema funcionando
3. [PROJECT-STATUS.md](./PROJECT-STATUS.md) - Roadmap e próximos passos

### 🔧 DevOps/Infra
1. [ENV-SETUP.md](./ENV-SETUP.md) - Variáveis de ambiente
2. [README.md](./README.md) - Arquitetura e stack
3. [INSTALACAO.md](./INSTALACAO.md) - Deploy checklist

### 🧪 QA/Tester
1. [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) - Casos de teste
2. [CICLO1-DOD.md](./CICLO1-DOD.md) - Critérios de aceite
3. [QUICK-START.md](./QUICK-START.md) - Setup rápido

---

## 🔍 Buscar por Assunto

### Instalação & Setup
- [INSTALACAO.md](./INSTALACAO.md) - Guia completo
- [QUICK-START.md](./QUICK-START.md) - Versão rápida
- [ENV-SETUP.md](./ENV-SETUP.md) - Variáveis de ambiente

### Funcionalidades
- [CICLO1-RESUMO.md](./CICLO1-RESUMO.md) - O que foi entregue
- [README.md](./README.md) - Documentação técnica
- [CICLO1-DOD.md](./CICLO1-DOD.md) - Checklist completo

### Testes
- [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) - Testes do Ciclo 1
- [TESTE-DE-MESA.md](./TESTE-DE-MESA.md) - Testes do setup

### Arquitetura
- [README.md](./README.md) - Stack técnica
- [PROJECT-STATUS.md](./PROJECT-STATUS.md) - Estrutura e métricas

### Troubleshooting
- [INSTALACAO.md](./INSTALACAO.md) - Seção 🆘 Problemas Comuns
- [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) - Seção Troubleshooting
- [QUICK-START.md](./QUICK-START.md) - Seção Problemas Comuns

---

## 📊 Status Atual

**Versão:** 2.4.0  
**Fase:** CICLO 4 ✅ COMPLETO  
**Próximo:** CICLO 5 - SDR OLV (Spotter-like)

### ✅ Entregas do Ciclo 4 (Atual)
- Decisores on-demand (Apollo/Hunter/Phantom opcionais)
- Contatos verificados (email ✓)
- Ação "Criar Lead"
- Base SDR (leads + outbound_logs)
- Empty-state guiado
- LGPD-safe
- Telemetria completa (fonte + ms + confiança)

### ✅ Entregas do Ciclo 3
- Digital Signals (homepage)
- Tech Stack (heurística 30+ regras)
- BuiltWith opcional
- Tabs na página empresa

### ✅ Entregas do Ciclo 2
- Lista de empresas paginada (10/20/50/100 itens)
- Filtros (busca, status, ordenação)
- Telemetria visível (coluna "Fonte")
- Ação "Tornar Ativa"
- Navegação Dashboard/Empresas (header sticky)
- Empty state com CTA

### ✅ Entregas do Ciclo 1
- SearchHub único (CNPJ + Website)
- Integração ReceitaWS
- Integração Google CSE/Serper
- UPSERT idempotente
- Company Context global
- Persistência localStorage
- Telemetria básica
- Health check

### 🔜 Próximos Ciclos
- CICLO 3: Enriquecimento Digital + Tech Stack detalhado
- CICLO 4: Enriquecimento adicional (Apollo, Hunter)
- CICLO 5: Relatórios PDF + Dashboard de métricas
- CICLO 6: Canvas colaborativo
- CICLO 7+: Módulo SDR (WhatsApp + Email)

Detalhes em: [PROJECT-STATUS.md](./PROJECT-STATUS.md)

---

## 🛠️ Stack Técnica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Banco:** Supabase (Postgres)
- **Estado:** Zustand
- **Validação:** Zod
- **UI:** Tailwind CSS + shadcn/ui
- **APIs:** ReceitaWS, Google CSE, Serper

Detalhes em: [README.md](./README.md)

---

## 🔗 Links Úteis

### Serviços Externos
- [Supabase Dashboard](https://supabase.com/dashboard)
- [ReceitaWS API](https://receitaws.com.br/api)
- [Google Cloud Console](https://console.cloud.google.com)
- [Serper Dev](https://serper.dev)

### Repositório
- SQL Migrations: `lib/supabase/migrations/`
- API Routes: `app/api/`
- Componentes: `components/`
- Providers: `lib/providers/`

---

## ❓ FAQ

### Como instalar o projeto?
Siga: [INSTALACAO.md](./INSTALACAO.md)

### Como testar se está funcionando?
Siga: [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md)

### Quais variáveis de ambiente preciso?
Veja: [ENV-SETUP.md](./ENV-SETUP.md)

### O que foi entregue no Ciclo 1?
Leia: [CICLO1-RESUMO.md](./CICLO1-RESUMO.md)

### Como funciona a arquitetura?
Consulte: [README.md](./README.md)

### Encontrei um problema, e agora?
Troubleshooting em: [INSTALACAO.md](./INSTALACAO.md) seção 🆘

---

## 📞 Suporte

Problemas ou dúvidas:

1. **Instalação:** [INSTALACAO.md](./INSTALACAO.md) seção Problemas Comuns
2. **Testes:** [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) seção Troubleshooting
3. **ENV:** [ENV-SETUP.md](./ENV-SETUP.md)
4. **Arquitetura:** [README.md](./README.md)

---

**Última atualização:** 21 de Outubro de 2025  
**Desenvolvido com ⚡️ por OLV Team**

