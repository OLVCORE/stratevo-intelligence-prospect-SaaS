# 🚀 PROMPT FINAL CONSOLIDADO - CRM STRATEVO INTELLIGENCE

**Leia sempre: CRM = SDR Workspace.**  
O módulo de CRM oficial é o **SDR Workspace** (Execução → SDR Workspace). Não confundir com o módulo antigo em `/crm`, que foi desativado no menu e redirecionado para `/sdr/workspace`.

---

## 🎯 CRM OFICIAL = SDR WORKSPACE

**Menu (Execução → SDR Workspace):**

| Item              | Rota / Ação                         | Descrição                          |
|-------------------|-------------------------------------|------------------------------------|
| Pipeline Kanban   | `/sdr/workspace`                    | Gestão visual de deals             |
| AI Voice SDR      | `/sdr/workspace?tab=ai-voice`       | Chamadas automáticas 24/7 com IA   |
| Inbox Unificado   | `/sdr/inbox`                        | Central de mensagens multi-canal   |
| Sequências        | `/sdr/sequences`                    | Cadências automatizadas            |
| Tarefas           | `/sdr/tasks`                        | Gestão de tarefas inteligentes     |
| **Relatórios**    | **`/sdr/reports`**                  | Métricas, forecast e export CSV    |
| Integrações       | `/sdr/integrations`                 | Twilio, WhatsApp, Email, APIs      |

- **Rotas:** `/crm` e `/crm/*` redirecionam para `/sdr/workspace`. Apenas `/crm/onboarding` permanece ativa (onboarding de tenant); ao concluir, redireciona para `/sdr/workspace`.

---

## ⚠️ 🛡️ PROTOCOLO DE SEGURANÇA CRÍTICA GLOBAL

**LEIA ANTES DE EXECUTAR QUALQUER COMANDO**

Este projeto evolui o CRM integrado ao sistema existente. É **FUNDAMENTAL** seguir as regras de segurança para **NÃO** quebrar funcionalidades existentes.

### 🔒 REGRAS INVIOLÁVEIS DE PROTEÇÃO

**VOCÊ ESTÁ PROIBIDO DE:**

- Modificar QUALQUER arquivo que não esteja listado explicitamente
- Remover imports "não usados" de arquivos existentes
- Renomear componentes/funções existentes
- Refatorar código que funciona
- Alterar estrutura de pastas existentes
- Modificar tipos/interfaces de outros módulos
- Mudar estilos CSS de componentes existentes
- Atualizar dependências sem autorização
- Fazer QUALQUER mudança não solicitada

**VOCÊ DEVE:**

- Criar APENAS arquivos novos listados ou modificar APENAS as linhas indicadas
- Testar cada mudança individualmente
- Reverter imediatamente se algo quebrar
- Preservar TUDO que funciona
- Fazer mudanças incrementais
- Perguntar em caso de dúvida

### 🎯 MANTRA DE EXECUÇÃO

> "Vou modificar APENAS o solicitado. Vou tocar APENAS nos arquivos necessários. Vou preservar TUDO que funciona. CRM = SDR Workspace."

### 📊 CHECKLIST PRÉ-EXECUÇÃO

- [ ] Li e compreendi todas as regras de segurança acima?
- [ ] Identifiquei todos os arquivos que serão criados/modificados?
- [ ] Confirmei que não vou alterar arquivos de outros módulos?
- [ ] Estou preparado para reverter se algo quebrar?

**Se TODAS as respostas forem SIM, prossiga. Se UMA for NÃO, PARE.**

---

## 📋 VISÃO GERAL DO PROJETO

### Objetivo

Manter e evoluir o **CRM (Customer Relationship Management)** integrado à plataforma Stratevo Intelligence, **centralizado no SDR Workspace**, conectado ao sistema de extração de decisores (LinkedIn → Apollo → Lusha) e às tabelas `companies` e `decision_makers`.

### Escopo do CRM (SDR Workspace)

1. **Pipeline de Deals** (Kanban em `/sdr/workspace`)
2. **Gestão de Atividades** (emails, ligações, reuniões, tarefas)
3. **Automação de Outreach** (sequências, follow-ups)
4. **Analytics e Relatórios** (`/sdr/reports` – métricas, forecast, CSV)
5. **Integração** com enriquecimento (companies, decision_makers, `crm_leads`)

### Tecnologias Utilizadas

- **Frontend:** React + TypeScript + shadcn/ui (AppLayout, SDRWorkspacePage)
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Deploy:** Vercel (frontend) + Supabase (backend)

---

## 🏗️ ARQUITETURA REAL DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRATEVO INTELLIGENCE                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├── Dossiê Estratégico ✅
                              ├── Enriquecimento (companies, decision_makers) ✅
                              └── CRM = SDR WORKSPACE ✅
                                   │
                                   ├── /sdr/workspace (Pipeline Kanban, tabs)
                                   ├── /sdr/inbox, /sdr/sequences, /sdr/tasks
                                   ├── /sdr/reports (Relatórios CRM)
                                   └── /sdr/integrations
                                        │
                                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                           │
├─────────────────────────────────────────────────────────────────┤
│  Tabelas CRM (crm_*):                                           │
│  • crm_pipelines, crm_pipeline_stages                           │
│  • crm_leads (company_id → companies, decision_maker_id)        │
│  • crm_deals, crm_activities, crm_tasks                         │
│  Integração: companies ✅, decision_makers ✅, tenants ✅         │
└─────────────────────────────────────────────────────────────────┘
```

**Migration existente:** `supabase/migrations/20260128180000_crm_internal_core_tables.sql`  
**Não usar:** `company_profiles` nem `crm_contacts`/`crm_companies` (não existem no schema atual).

---

## 📂 ESTRUTURA REAL DO PROJETO (CRM / SDR)

### Já existem e NÃO devem ser removidos

```
src/
├── pages/
│   ├── SDRWorkspacePage.tsx          # Hub principal CRM (Pipeline, tabs)
│   ├── SDRInboxPage.tsx, SDRSequencesPage.tsx, SDRTasksPage.tsx
│   ├── SDRIntegrationsPage.tsx, SDRAnalyticsPage.tsx
│   └── crm/
│       ├── ReportsPage.tsx            # Relatórios CRM (métricas, forecast, CSV)
│       └── OnboardingTenant.tsx       # /crm/onboarding → redireciona para /sdr/workspace
├── components/
│   ├── sdr/                          # Kanban, DealCard, ExecutiveView, etc.
│   └── crm/
│       └── ForecastChart.tsx          # Gráfico de previsão (ReportsPage)
├── services/
│   └── crm/
│       ├── CRMAnalyticsService.ts     # Dashboard metrics, forecast, export CSV
│       └── CRMEnrichmentIntegration.ts # Ponte CRM ↔ EnrichmentOrchestrator
├── hooks/
│   ├── useDeals.ts, usePipelineStages.ts
│   └── useSDRAutomations.ts
└── App.tsx                           # Rotas /sdr/*, /sdr/reports, redirect /crm → /sdr/workspace

supabase/
├── migrations/
│   └── 20260128180000_crm_internal_core_tables.sql  # crm_pipelines, stages, leads, deals, activities, tasks
└── functions/
    └── crm-process-sequences/
        └── index.ts                  # Edge: processar sequências (se tabelas existirem)
```

### Arquivos que podem ser CRIADOS (sem alterar os existentes)

- Novos serviços em `src/services/crm/` (ex.: CRMLeadsService, CRMDealsService) se precisar de APIs adicionais.
- Novas páginas ou componentes **somente** se solicitado; o fluxo principal permanece no SDR Workspace.
- Novas migrations para tabelas opcionais (ex.: `crm_sequences`, `crm_sequence_steps`, `crm_email_templates`) se for usar a Edge `crm-process-sequences` com dados reais.

### Arquivos que podem ser MODIFICADOS (apenas quando indicado)

- `src/App.tsx` – apenas para adicionar rotas novas (ex.: nova rota sob `/sdr/`).
- `src/components/layout/AppSidebar.tsx` – apenas para adicionar/ajustar itens sob **Execução → SDR Workspace**.

---

## 📊 PARTE 1: BANCO DE DADOS (JÁ APLICADO)

- **Migration:** `20260128180000_crm_internal_core_tables.sql`
- **Tabelas:** `crm_pipelines`, `crm_pipeline_stages`, `crm_leads`, `crm_deals`, `crm_activities`, `crm_tasks`
- **Integração:** `companies`, `decision_makers`, `tenants`, `auth.users`
- **RLS:** políticas para `authenticated` por tenant/user conforme migration.

**Rollback:** criar script que faz `DROP TABLE` na ordem reversa das FKs (apenas se necessário).

---

## 📦 PARTE 2: COMANDOS DE INSTALAÇÃO

- Não instalar dependências não solicitadas. O projeto já usa Supabase, React, React Router, etc.
- Se for adicionar lib (ex.: Resend, Redis): documentar no prompt e fazer backup de `package.json` antes.

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO (ESTADO ATUAL)

| Item                                      | Status |
|-------------------------------------------|--------|
| CRM = SDR Workspace (menu e rotas)        | ✅     |
| Pipeline Kanban em /sdr/workspace         | ✅     |
| Relatórios em /sdr/reports                | ✅     |
| Redirect /crm → /sdr/workspace             | ✅     |
| Tabelas crm_* (migration aplicada)        | ✅     |
| CRMAnalyticsService + ReportsPage          | ✅     |
| CRMEnrichmentIntegration (serviço)        | ✅     |
| Edge crm-process-sequences                 | ✅ (responde 200; tabelas opcionais) |
| Seed pipeline padrão (crm_pipelines/stages)| ⏳ Opcional |
| Conectar CRMEnrichmentIntegration na UI   | ⏳ Opcional |
| Tabelas de sequências (crm_sequences, …)  | ⏳ Opcional |

---

## 📝 PARTE 3: SERVICES, COMPONENTES, EDGE FUNCTIONS E DEPLOY

### ⚠️ 🛡️ PROTOCOLO DE SEGURANÇA - PARTE 3

**Arquivos EXISTENTES que NÃO devem ser tocados:**

- `src/pages/SDRWorkspacePage.tsx`, `src/pages/crm/ReportsPage.tsx`
- `src/services/crm/CRMAnalyticsService.ts`, `src/services/crm/CRMEnrichmentIntegration.ts`
- `supabase/migrations/20260128180000_crm_internal_core_tables.sql`
- `supabase/functions/crm-process-sequences/index.ts`

**Arquivos que PODEM ser criados (apenas quando solicitado):**

- `src/services/crm/CRMLeadsService.ts`, `CRMDealsService.ts`, `LeadScoringService.ts`, `EmailAutomationService.ts`
- Novos componentes/páginas sob SDR Workspace somente se listados explicitamente.

**❌ PROIBIDO:**

- Usar **SERVICE_ROLE_KEY** (ou `VITE_SUPABASE_SERVICE_ROLE_KEY`) em código **frontend**. Isso bypassa RLS e expõe o banco. **Nunca** criar `createClient(url, service_role_key)` em `src/`.
- Modificar CRMAnalyticsService ou CRMEnrichmentIntegration sem autorização explícita.
- Alterar schema do banco (migration já aplicada) sem nova migration aprovada.
- Criar componentes que duplicam funcionalidades já existentes no SDR Workspace.

**✅ REGRA PARA SERVICES OPCIONAIS:**

- Seguir o padrão de **CRMAnalyticsService**: receber **SupabaseClient** autenticado como parâmetro (ex.: do hook/contexto da app). O cliente deve ser o do usuário logado (RLS aplicado).
- `tenant_id` deve vir do **TenantContext** (ou parâmetro) no componente que chama o service; o service pode receber `(supabase, tenantId?, ...)`.
- Não usar tabela `crm_analytics_events` no frontend: **não existe** na migration atual. Se precisar de eventos, criar nova migration para essa tabela ou omitir chamadas de analytics nos services opcionais.

**Checklist pré-implementação Parte 3:**

- [ ] O novo código usa cliente Supabase passado como parâmetro (não service role)?
- [ ] Confirmei que não vou alterar arquivos existentes listados acima?
- [ ] Uso apenas schema `companies`, `decision_makers`, `crm_*` (sem `company_profiles`/`crm_contacts`)?

---

### PARTE 3.1: Services opcionais (referência)

Quando for implementar services opcionais (CRMLeadsService, CRMDealsService, LeadScoringService):

1. **Assinatura:** receber `supabase: SupabaseClient` (e opcionalmente `tenantId: string`) em cada método ou no construtor, em vez de instanciar cliente com service role.
2. **Schema:** usar apenas `crm_leads`, `crm_deals`, `companies`, `decision_makers`, `crm_pipeline_stages`, `crm_activities`, `crm_tasks`. Verificar nomes de colunas em `companies` (ex.: podem ser `razao_social`, `nome_fantasia`, `cnpj` ou outros conforme migration real).
3. **Analytics:** não inserir em `crm_analytics_events` até que exista migration para essa tabela, ou implementar como no-op.
4. **Tenant:** obter `tenant_id` do contexto (TenantContext) no componente e passar para o service.

Exemplo de assinatura segura:

```ts
// ✅ Correto: cliente passado pelo caller (RLS aplicado)
async listLeads(supabase: SupabaseClient, tenantId: string, filters: ListLeadsFilters) { ... }
```

---

### PARTE 3.2: Componentes React, Edge Functions e Deploy (quando solicitado)

#### Hooks corretos no projeto (obrigatório)

- **Não existe** `useSupabase()` no projeto. Usar:
  - **`useTenantSupabase()`** – retorna o cliente Supabase (ou `null` se não houver tenant), de `@/contexts/TenantContext`.
  - **`useTenant()`** – retorna `{ tenant, loading, ... }`, de `@/contexts/TenantContext`. Usar `tenant?.id` para tenant id.
- Componentes opcionais devem usar `const supabase = useTenantSupabase()` e `const { tenant } = useTenant()`; verificar `supabase` e `tenant` antes de chamar services.

#### Componentes opcionais (criar apenas quando solicitado)

| Componente | Localização | Uso |
|------------|-------------|-----|
| LeadScoreBadge | `src/components/crm/LeadScoreBadge.tsx` | Badge de score do lead (0–100, HOT/WARM/COLD). Depende de LeadScoringService com assinatura `(supabase, tenantId?, leadId)`. |
| ActivityTimeline | `src/components/crm/ActivityTimeline.tsx` | Timeline de atividades do lead/deal a partir de `crm_activities`. Usar `useTenantSupabase()` e query com RLS. |
| EnrichmentButton | `src/components/crm/EnrichmentButton.tsx` | Botão para enriquecer lead. Chamar **apenas** `CRMEnrichmentIntegration.enrichLeadAfterCreation(supabase, leadId)` – **dois parâmetros** (a assinatura existente não recebe tenantId). |

**Componentes existentes que NÃO devem ser modificados:** `EnhancedKanbanBoard`, `DealDetailsDialog`, `DealFormDialog`, `ExecutiveView`, `SDRWorkspacePage`, `ReportsPage`, etc. Não existe `PipelineKanban.tsx`; o Kanban está em `src/components/sdr/EnhancedKanbanBoard.tsx`.

#### Edge Functions opcionais (criar apenas quando solicitado)

- **crm-update-overdue-tasks** – Marcar tasks atrasadas (`crm_tasks.status = 'overdue'`). Pode usar SERVICE_ROLE no servidor. Cron sugerido: diário.
- **crm-calculate-lead-scores** – Recalcular scores de leads em lote. Pode usar SERVICE_ROLE no servidor. Cron sugerido: semanal.
- **crm-process-sequences** – Já existe; não modificar sem autorização.

#### Deploy

- **Frontend:** Vercel (deploy automático no push). Variáveis `VITE_*` no dashboard Vercel; nunca commitar `.env`.
- **Edge Functions:** `supabase functions deploy <nome>`. Variáveis sensíveis via `supabase secrets set`. Cron no Dashboard Supabase (Edge Functions → função → Cron).
- **Rollback:** Vercel – promover deploy anterior; Supabase – redeploy da função a partir de commit anterior.

#### Checklist final Parte 3

| Item | Status |
|------|--------|
| Services opcionais (cliente passado como parâmetro) | ⏳ Quando solicitado |
| Componentes opcionais (useTenantSupabase, useTenant) | ⏳ Quando solicitado |
| EnrichmentButton: enrichLeadAfterCreation(supabase, leadId) apenas | ✅ Assinatura correta |
| Edge Functions (service role no servidor OK) | ⏳ Quando solicitado |
| Deploy Vercel + Supabase | ✅ Manter como está |

---

## 📝 PARTE 3 (RESUMO – QUANDO SOLICITADO)

- **Services:** Implementar apenas serviços novos listados (ex.: CRMLeadsService, CRMDealsService) **com cliente Supabase passado como parâmetro**; não alterar CRMAnalyticsService/CRMEnrichmentIntegration.
- **Componentes:** Criar apenas componentes novos indicados; não refatorar Kanban/DealCard existentes.
- **Edge Functions:** Evoluir `crm-process-sequences` ou criar novas somente quando pedido.
- **Deploy:** Manter deploy atual (Vercel + Supabase); documentar variáveis novas se houver.

---

## 🎯 RESUMO PARA O CURSOR / IA

1. **CRM = SDR Workspace.** Todas as funcionalidades de CRM (pipeline, relatórios, tarefas, sequências, inbox, integrações) estão sob **Execução → SDR Workspace** e rotas `/sdr/*`.
2. **Relatórios CRM:** rota `/sdr/reports`, página `src/pages/crm/ReportsPage.tsx`, serviço `src/services/crm/CRMAnalyticsService.ts`.
3. **Schema:** usar `companies`, `decision_makers`, tabelas `crm_*` da migration `20260128180000_crm_internal_core_tables.sql`. Não usar `company_profiles` nem `crm_contacts`/`crm_companies`.
4. **Segurança:** modificar apenas o que for solicitado; preservar todo o código existente. **Nunca** usar SERVICE_ROLE_KEY no frontend; services opcionais devem receber `SupabaseClient` autenticado como parâmetro.
5. **Módulo antigo `/crm`:** desativado no menu; `/crm` e `/crm/*` redirecionam para `/sdr/workspace`. Apenas `/crm/onboarding` permanece; ao concluir, redireciona para `/sdr/workspace`.
6. **Hooks CRM/frontend:** usar **`useTenantSupabase()`** e **`useTenant()`** de `@/contexts/TenantContext` (não existe `useSupabase()`). **CRMEnrichmentIntegration.enrichLeadAfterCreation(supabase, leadId)** – apenas dois parâmetros.

Este documento é o **prompt consolidado** para manter consistência em futuras sessões e implementações.
