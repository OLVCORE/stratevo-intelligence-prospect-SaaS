# 🎯 PLANEJAMENTO ESTRATÉGICO, TÁTICO E OPERACIONAL
## CRM Multi-Tenant Completo - STRATEVO Intelligence 360°

**Data:** 2025-01-22  
**Engenheiro Chefe:** AI Assistant  
**Status:** 🚀 EM EXECUÇÃO

---

## 📊 VISÃO GERAL DO PROJETO

### Objetivo Principal
Criar um **CRM completo, genérico e multi-tenant** integrado à plataforma STRATEVO, onde os leads fluem naturalmente dos módulos existentes (Base de Empresas → Quarentena ICP → Aprovadas) para o CRM, respeitando completamente o contexto do tenant.

### Princípios Fundamentais
1. ✅ **100% Genérico** - Serve para qualquer empresa/segmento
2. ✅ **Multi-Tenant Completo** - Isolamento total por tenant
3. ✅ **Integração Nativa** - Fluxo contínuo com módulos existentes
4. ✅ **Arquitetura Modular** - Código isolado em `src/modules/crm/`
5. ✅ **Terminologia Abstraída** - Sem termos específicos de eventos

---

## 🎯 NÍVEL ESTRATÉGICO

### 1. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    STRATEVO PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Base Empresas│→ │ Quarentena   │→ │ Leads        │      │
│  │              │  │ ICP          │  │ Aprovadas    │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                               │              │
│                                               ▼              │
│                                      ┌──────────────┐       │
│                                      │   CRM MODULE │       │
│                                      │  (Multi-Tenant)│      │
│                                      └──────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         TENANT CONTEXT (tenant-context.ts)          │   │
│  │  • get_current_tenant_id()                          │   │
│  │  • has_tenant_role()                                │   │
│  │  • RLS Policies                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Fluxo de Dados Estratégico

```
1. EMPRESA CADASTRADA (Base de Empresas)
   ↓
2. ANÁLISE ICP (Quarentena)
   ↓
3. APROVAÇÃO (Leads Aprovadas)
   ↓
4. CRIAÇÃO AUTOMÁTICA DE LEAD NO CRM
   ↓
5. DISTRIBUIÇÃO PARA VENDEDOR
   ↓
6. PIPELINE DE VENDAS
   ↓
7. PROPOSTA → NEGOCIAÇÃO → FECHAMENTO
```

### 3. Isolamento Multi-Tenant

- **Schema-Based**: Cada tenant tem isolamento completo via `tenant_id`
- **RLS Policies**: Todas as queries filtram automaticamente por tenant
- **Edge Functions**: Validam tenant em todas as operações
- **Frontend**: Context API garante tenant correto

---

## 🛠️ NÍVEL TÁTICO

### 1. Estrutura de Módulos

```
src/modules/crm/
├── components/
│   ├── layout/
│   │   ├── CRMLayout.tsx          ← Layout principal com sidebar
│   │   └── CRMSidebar.tsx          ← Menu completo (19 itens)
│   ├── dashboard/
│   │   ├── MetricsCards.tsx
│   │   ├── PipelineOverview.tsx
│   │   └── QuickActions.tsx
│   ├── leads/
│   │   ├── LeadsTable.tsx
│   │   ├── LeadDetails.tsx
│   │   ├── LeadForm.tsx
│   │   └── LeadPipeline.tsx       ← Já existe, adaptar
│   ├── distribution/
│   │   ├── DistributionRules.tsx
│   │   └── AssignmentManager.tsx
│   ├── appointments/
│   │   ├── CalendarView.tsx
│   │   └── AppointmentForm.tsx
│   ├── automations/
│   │   ├── AutomationRules.tsx
│   │   └── AutomationLogs.tsx
│   ├── workflows/
│   │   ├── WorkflowBuilder.tsx
│   │   └── WorkflowTemplates.tsx
│   ├── performance/
│   │   ├── PerformanceCharts.tsx
│   │   └── GoalsDashboard.tsx
│   ├── templates/
│   │   ├── EmailTemplatesList.tsx
│   │   └── TemplateEditor.tsx
│   ├── whatsapp/
│   │   ├── WhatsAppManager.tsx
│   │   └── QuickReplies.tsx
│   ├── ai-insights/
│   │   ├── AILeadInsights.tsx
│   │   └── AIAssistantPanel.tsx
│   ├── calendar/
│   │   ├── CalendarBlocks.tsx      ← EventBlocks → CalendarBlocks
│   │   └── BlockManager.tsx
│   ├── opportunities/
│   │   ├── ClosedOpportunities.tsx ← ConfirmedEvents → ClosedOpportunities
│   │   └── OpportunityDetails.tsx
│   ├── proposals/
│   │   ├── ProposalBuilder.tsx
│   │   ├── ProposalList.tsx
│   │   └── ProposalEditor.tsx
│   ├── calculator/
│   │   └── PricingCalculator.tsx
│   ├── users/
│   │   └── UserManagement.tsx
│   ├── audit/
│   │   └── AuditLogs.tsx
│   ├── integrations/
│   │   └── IntegrationsManager.tsx
│   ├── analytics/
│   │   └── AnalyticsDashboard.tsx
│   └── financial/
│       └── FinancialDashboard.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Leads.tsx
│   ├── Distribution.tsx
│   ├── Appointments.tsx
│   ├── Automations.tsx
│   ├── Workflows.tsx
│   ├── Performance.tsx
│   ├── EmailTemplates.tsx
│   ├── WhatsApp.tsx
│   ├── AIInsights.tsx
│   ├── CalendarBlocks.tsx
│   ├── ClosedOpportunities.tsx
│   ├── Proposals.tsx
│   ├── Calculator.tsx
│   ├── Users.tsx
│   ├── AuditLogs.tsx
│   ├── Integrations.tsx
│   ├── Analytics.tsx
│   └── Financial.tsx
├── hooks/
│   ├── useTenant.tsx               ← Adaptar do Olinda
│   ├── useLeads.tsx
│   ├── useProposals.tsx
│   ├── usePermissions.tsx
│   ├── useAutomations.tsx
│   └── useAppointments.tsx
├── services/
│   ├── leads.service.ts
│   ├── proposals.service.ts
│   ├── automations.service.ts
│   └── appointments.service.ts
├── types/
│   ├── lead.types.ts
│   ├── proposal.types.ts
│   └── tenant.types.ts
├── utils/
│   └── crm-helpers.ts
└── index.tsx                       ← Entry point do módulo
```

### 2. Integração com Fluxo Existente

#### 2.1 Hook de Integração com Leads Aprovadas

```typescript
// src/modules/crm/hooks/useApprovedLeadsIntegration.ts
export function useApprovedLeadsIntegration() {
  const { tenantId } = useTenant();
  
  // Quando um lead é aprovado, criar automaticamente no CRM
  const createLeadFromApproved = async (approvedLeadId: string) => {
    // Buscar lead aprovado
    const { data: approved } = await supabase
      .from('icp_analysis_results')
      .select('*, companies(*)')
      .eq('id', approvedLeadId)
      .eq('status', 'aprovada')
      .single();
    
    if (!approved) return;
    
    // Criar lead no CRM com tenant_id
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenantId,
        name: approved.companies.name,
        email: approved.companies.email || null,
        phone: approved.companies.phone || null,
        company_name: approved.companies.name,
        source: 'icp_approved',
        lead_score: approved.icp_score || 0,
        status: 'novo',
        business_data: {
          icp_score: approved.icp_score,
          temperatura: approved.temperatura,
          icp_analysis_id: approved.id,
          company_id: approved.company_id
        }
      })
      .select()
      .single();
    
    return lead;
  };
  
  return { createLeadFromApproved };
}
```

#### 2.2 Componente de Sincronização

```typescript
// src/modules/crm/components/integration/ApprovedLeadsSync.tsx
export function ApprovedLeadsSync() {
  const { tenantId } = useTenant();
  const { createLeadFromApproved } = useApprovedLeadsIntegration();
  
  // Monitorar leads aprovados e criar no CRM
  useEffect(() => {
    const channel = supabase
      .channel('approved-leads-sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'icp_analysis_results',
        filter: `status=eq.aprovada`
      }, async (payload) => {
        // Criar lead no CRM automaticamente
        await createLeadFromApproved(payload.new.id);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);
  
  return null; // Componente invisível
}
```

### 3. Menu Completo do CRM

```typescript
const crmMenuItems = [
  { title: 'Dashboard', path: '/crm/dashboard', icon: LayoutDashboard },
  { title: 'Leads', path: '/crm/leads', icon: Users },
  { title: 'Distribuição', path: '/crm/distribution', icon: UsersRound },
  { title: 'Agendamentos', path: '/crm/appointments', icon: Calendar },
  { title: 'Automações', path: '/crm/automations', icon: Zap },
  { title: 'Workflows Visuais', path: '/crm/workflows', icon: Workflow },
  { title: 'Performance', path: '/crm/performance', icon: Target },
  { title: 'Templates Email', path: '/crm/templates', icon: Mail },
  { title: 'WhatsApp', path: '/crm/whatsapp', icon: MessageSquare },
  { title: 'Insights de IA', path: '/crm/ai-insights', icon: Sparkles },
  { title: 'Bloqueios de Datas', path: '/crm/calendar-blocks', icon: Ban },
  { title: 'Oportunidades Fechadas', path: '/crm/closed-opportunities', icon: CheckCircle2 },
  { title: 'Propostas', path: '/crm/proposals', icon: FileText },
  { title: 'Calculadora', path: '/crm/calculator', icon: Calculator },
  { title: 'Usuários', path: '/crm/users', icon: UserCog },
  { title: 'Auditoria', path: '/crm/audit-logs', icon: Shield },
  { title: 'Integrações', path: '/crm/integrations', icon: Settings },
  { title: 'Analytics', path: '/crm/analytics', icon: BarChart3 },
  { title: 'Financeiro', path: '/crm/financial', icon: DollarSign },
];
```

---

## ⚙️ NÍVEL OPERACIONAL

### FASE 1: Estrutura Base (Dia 1)

#### 1.1 Criar Estrutura de Pastas
```bash
mkdir -p src/modules/crm/{components/{layout,dashboard,leads,distribution,appointments,automations,workflows,performance,templates,whatsapp,ai-insights,calendar,opportunities,proposals,calculator,users,audit,integrations,analytics,financial},pages,hooks,services,types,utils}
```

#### 1.2 Criar Entry Point
- `src/modules/crm/index.tsx` - Módulo principal com rotas

#### 1.3 Criar Layout e Sidebar
- `CRMLayout.tsx` - Wrapper com sidebar
- `CRMSidebar.tsx` - Menu completo

### FASE 2: Páginas Principais (Dia 2-3)

#### 2.1 Dashboard
- Métricas em tempo real
- Pipeline overview
- Quick actions

#### 2.2 Leads
- Lista de leads
- Detalhes do lead
- Formulário de criação/edição
- Pipeline visual

#### 2.3 Distribuição
- Regras de distribuição
- Atribuição manual/automática
- Histórico de atribuições

### FASE 3: Funcionalidades Avançadas (Dia 4-5)

#### 3.1 Automações
- Regras de automação
- Triggers e ações
- Logs de execução

#### 3.2 Workflows Visuais
- Builder de workflows
- Templates pré-configurados
- Execução de workflows

#### 3.3 Performance
- Dashboards de métricas
- Metas e KPIs
- Relatórios

### FASE 4: Integrações (Dia 6-7)

#### 4.1 Integração com Leads Aprovadas
- Sincronização automática
- Criação de leads no CRM
- Mapeamento de dados

#### 4.2 Edge Functions
- Adaptar `ai-lead-scoring` para multi-tenant
- Criar funções de automação
- Webhooks e integrações

### FASE 5: Testes e Validação (Dia 8)

#### 5.1 Testes de Multi-Tenancy
- Criar múltiplos tenants
- Validar isolamento de dados
- Testar permissões por role

#### 5.2 Testes de Integração
- Fluxo completo: Base → Quarentena → Aprovadas → CRM
- Validação de sincronização
- Testes de performance

---

## 🔐 SEGURANÇA E PERMISSÕES

### Roles e Permissões

```typescript
type TenantRole = 
  | 'owner'      // Acesso total
  | 'admin'      // Administração completa
  | 'manager'    // Gestão de equipe
  | 'sales'      // Vendas
  | 'sdr'        // Qualificação
  | 'viewer';    // Somente leitura

const rolePermissions = {
  owner: ['*'],
  admin: ['leads.*', 'proposals.*', 'users.*', 'settings.*'],
  manager: ['leads.read', 'leads.update', 'proposals.*', 'reports.*'],
  sales: ['leads.read', 'leads.update', 'proposals.create', 'proposals.update'],
  sdr: ['leads.read', 'leads.create', 'leads.qualify'],
  viewer: ['leads.read', 'reports.read']
};
```

### RLS Policies

Todas as tabelas do CRM já têm RLS configurado nas migrations:
- `leads` - Filtro por `tenant_id`
- `proposals` - Filtro por `tenant_id`
- `activities` - Filtro por `tenant_id`
- `appointments` - Filtro por `tenant_id`
- `automation_rules` - Filtro por `tenant_id`
- E todas as outras...

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Técnicos
- ✅ 19 páginas funcionais
- ✅ 100% de isolamento multi-tenant
- ✅ Integração completa com fluxo de leads
- ✅ Performance < 2s de carregamento
- ✅ 0 vazamentos de dados entre tenants

### KPIs de Negócio
- ✅ Taxa de conversão de leads
- ✅ Tempo médio no pipeline
- ✅ Taxa de fechamento
- ✅ ROI por tenant

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ Criar estrutura de pastas completa
2. ✅ Criar CRMLayout e CRMSidebar
3. ✅ Criar entry point do módulo
4. ✅ Integrar rotas no App.tsx
5. ✅ Criar páginas principais (Dashboard, Leads)
6. ✅ Implementar integração com Leads Aprovadas
7. ✅ Testar fluxo completo

---

## 📝 NOTAS IMPORTANTES

- **NÃO** usar terminologia específica de eventos
- **SEMPRE** adicionar `tenant_id` em todas as queries
- **SEMPRE** usar `get_current_tenant_id()` nas Edge Functions
- **SEMPRE** validar permissões por role
- **SEMPRE** testar isolamento multi-tenant

---

**Status:** 🟢 PLANEJAMENTO COMPLETO - PRONTO PARA EXECUÇÃO

