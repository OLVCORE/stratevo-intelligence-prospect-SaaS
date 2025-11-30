# ESTRATÉGIA DE ABSTRAÇÃO - ESPAÇO OLINDA → STRATEVO

## 📋 DECISÃO: DUAS VERSÕES

### **VERSÃO A: ESPAÇO OLINDA (atual)**
- ✅ Mantém todos os campos e funcionalidades específicas de eventos
- ✅ Páginas: Casamentos, Corporativo, Hospedagem, Gastronomia
- ✅ Campos: `event_type`, `event_date`, `guest_count`, `venue_price`, etc.
- ✅ Pronto para produção AGORA

### **VERSÃO B: STRATEVO (abstraída)**
- ✅ CRM 100% genérico e multi-tenant
- ✅ Aplicável a qualquer indústria
- ✅ Sem referências a eventos
- ✅ Campos abstraídos e flexíveis

---

## 🔄 GUIA COMPLETO DE ABSTRAÇÃO

### **1. TABELAS - RENOMEAR E ABSTRAIR**

#### **1.1. TABELA: `leads`**
```sql
-- ABSTRAIR CAMPOS:
event_type → opportunity_type TEXT NOT NULL
event_date → target_date DATE
-- Manter: name, email, phone, company_name, budget, etc.
```

**Valores exemplo**:
- ❌ `event_type`: 'casamento', 'corporativo', 'festa'
- ✅ `opportunity_type`: 'consultoria', 'licença software', 'projeto', 'produto', 'serviço'

---

#### **1.2. TABELA: `proposals`**
```sql
-- REMOVER CAMPOS ESPECÍFICOS:
❌ venue_price
❌ catering_price
❌ decoration_price
❌ guest_count

-- USAR SISTEMA DE ITEMS (já existe proposal_items):
✅ proposal_items[] com category: 'product', 'service', 'license', etc.

-- ABSTRAIR:
event_type → opportunity_type
event_date → delivery_date (ou start_date)
```

---

#### **1.3. TABELA: `appointments`**
```sql
-- ABSTRAIR:
event_type → opportunity_type
event_date → scheduled_date
guest_count → participants_count

appointment_type valores:
❌ 'visita', 'degustação', 'tour'
✅ 'meeting', 'demo', 'consultation', 'presentation', 'visit', 'audit'
```

---

#### **1.4. RENOMEAR TABELAS**
```sql
-- Event-specific → Genérico
confirmed_events → confirmed_opportunities
event_blocks → calendar_blocks (com reason genérico)
event_payments → opportunity_payments (ou payments)
```

**Nova estrutura `confirmed_opportunities`**:
```sql
CREATE TABLE confirmed_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  opportunity_type TEXT NOT NULL,
  delivery_date DATE NOT NULL,        -- ou start_date
  scope_quantity INTEGER,             -- genérico
  total_value NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  -- ... outros campos genéricos
);
```

---

### **2. COMPONENTES REACT - ABSTRAIR OU REMOVER**

#### **2.1. REMOVER (não migrar para STRATEVO)**
```
❌ src/pages/Casamentos.tsx
❌ src/pages/Corporativo.tsx
❌ src/pages/Hospedagem.tsx
❌ src/pages/Gastronomia.tsx
❌ src/pages/Galeria.tsx (específico)
❌ src/pages/admin/Calculator.tsx (calculadora de eventos)
❌ src/pages/admin/EventBlocks.tsx
❌ src/components/admin/EventBlocksManager.tsx
❌ src/components/admin/EventBlocksImport.tsx
```

#### **2.2. ABSTRAIR (renomear + adaptar)**
```typescript
// ❌ EventPayments.tsx
// ✅ OpportunityPayments.tsx
export const OpportunityPayments = ({ opportunityId }: Props) => {
  // Labels: "Pagamento do Evento" → "Pagamento"
  // Campos: event_id → opportunity_id
}

// ❌ ConfirmedEvents.tsx
// ✅ ConfirmedOpportunities.tsx
export const ConfirmedOpportunities = () => {
  // "Eventos Confirmados" → "Oportunidades Fechadas"
  // "Data do Evento" → "Data de Entrega"
}
```

#### **2.3. MANTER (já são genéricos)**
```
✅ src/components/admin/LeadsTable.tsx
✅ src/components/admin/LeadsPipeline.tsx
✅ src/components/admin/ProposalsTable.tsx
✅ src/components/admin/DealsPipeline.tsx
✅ src/components/admin/AutomationRulesManager.tsx
✅ src/components/admin/GoalsDashboard.tsx
✅ src/components/admin/GamificationLeaderboard.tsx
✅ src/components/admin/AIInsights.tsx
✅ src/components/admin/WhatsAppQuickReplies.tsx
✅ src/components/admin/EmailTemplates.tsx
✅ Todo sistema de integrations, analytics, users
```

---

### **3. EDGE FUNCTIONS - SUBSTITUIÇÕES**

#### **3.1. Padrões de substituição**
```typescript
// EM TODOS OS EDGE FUNCTIONS:

// ❌ EVENT-SPECIFIC
const { event_type, event_date, guest_count } = body
const eventData = await supabase.from('confirmed_events')

// ✅ GENÉRICO
const { opportunity_type, target_date, quantity } = body
const opportunityData = await supabase.from('confirmed_opportunities')
```

#### **3.2. Edge Functions específicas - ADAPTAR**
```
✅ chatbot → abstrair lógica de eventos
✅ generate-proposal-pdf → usar campos genéricos
✅ notify-new-lead → manter genérico
✅ send-appointment-confirmation → abstrair "evento"
✅ ai-assistant → contexts genéricos
```

---

### **4. UI/UX - TERMINOLOGIA**

#### **4.1. Substituições de texto globais**
```javascript
// Find & Replace em TODOS os arquivos:
"Evento" → "Oportunidade"
"Eventos" → "Oportunidades"
"Data do Evento" → "Data Alvo" ou "Data de Entrega"
"Tipo de Evento" → "Tipo de Oportunidade"
"Convidados" → "Participantes" ou "Quantidade"
"Buffet" → "Serviço"
"Decoração" → "Produto/Serviço"
"Local" → "Recurso" ou remover
"Visitação" → "Reunião" ou "Consulta"
```

#### **4.2. Formulários - Labels genéricos**
```typescript
// ❌ EVENT-SPECIFIC
<Label>Tipo de Evento</Label>
<Select>
  <option>Casamento</option>
  <option>Corporativo</option>
  <option>Festa</option>
</Select>

// ✅ GENÉRICO
<Label>Tipo de Oportunidade</Label>
<Select>
  <option>Projeto</option>
  <option>Consultoria</option>
  <option>Produto</option>
  <option>Serviço</option>
  <option>Licença</option>
</Select>
```

---

### **5. ROTAS E NAVEGAÇÃO**

#### **5.1. AdminSidebar do STRATEVO**
```typescript
// ADICIONAR ao sidebar existente do STRATEVO:
{
  title: "CRM",
  icon: Users,
  items: [
    { title: "Dashboard", url: "/crm/dashboard" },
    { title: "Leads", url: "/crm/leads" },
    { title: "Oportunidades", url: "/crm/opportunities" }, // não "Eventos"
    { title: "Propostas", url: "/crm/proposals" },
    { title: "Agendamentos", url: "/crm/appointments" },
    { title: "Automações", url: "/crm/automations" },
    { title: "Performance", url: "/crm/performance" },
  ]
}
```

---

### **6. CUSTOMIZAÇÃO POR TENANT**

#### **6.1. Tabela de configuração**
```sql
CREATE TABLE tenant_crm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Configurações de terminologia customizada
  opportunity_label TEXT DEFAULT 'Oportunidade',
  opportunity_types JSONB DEFAULT '["Projeto","Consultoria","Produto"]',
  
  -- Campos customizados ativos
  custom_fields JSONB DEFAULT '{}',
  
  -- Stages do pipeline customizados
  pipeline_stages JSONB DEFAULT '["novo","qualificado","proposta","negociação","fechado"]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Exemplo de uso**:
```typescript
// Tenant A (SaaS):
opportunity_types: ["Trial", "Licença Anual", "Enterprise"]

// Tenant B (Consultoria):
opportunity_types: ["Auditoria", "Projeto", "Mentoria"]

// Tenant C (Indústria):
opportunity_types: ["Pedido", "Contrato", "Distribuição"]
```

---

### **7. MIGRATIONS - ORDEM DE EXECUÇÃO**

```sql
-- 1. Multi-tenancy base
CREATE TABLE tenants (...)
CREATE TABLE tenant_users (...)

-- 2. Tabelas abstraídas
CREATE TABLE leads (
  -- ... com opportunity_type, target_date
)

CREATE TABLE confirmed_opportunities (
  -- ... sem referências a events
)

CREATE TABLE calendar_blocks (
  -- ... genérico
)

-- 3. RLS com tenant_id
CREATE POLICY "Tenant isolation" ON leads
  FOR ALL USING (tenant_id = current_tenant_id())

-- 4. Functions helper
CREATE FUNCTION current_tenant_id() ...
```

---

### **8. TESTES PÓS-MIGRAÇÃO**

#### **8.1. Checklist de validação**
- [ ] Nenhuma referência a "evento" no código (exceto logs/comentários)
- [ ] Todos os campos `event_` foram substituídos
- [ ] Tabelas renomeadas corretamente
- [ ] RLS funciona com tenant_id
- [ ] Componentes renderizam com terminologia genérica
- [ ] Propostas usam sistema de items, não preços fixos
- [ ] Edge functions adaptadas
- [ ] Rotas no sidebar corretas

---

## 📊 RESUMO EXECUTIVO

### **OLINDA (atual) - ESPECÍFICO**
- 🎪 Foco: Eventos (casamentos, corporativo, festas)
- 📅 Campos: `event_type`, `event_date`, `guest_count`, `venue_price`
- 🏠 Páginas públicas específicas
- ✅ Pronto para produção

### **STRATEVO (abstraído) - GENÉRICO**
- 🌐 Foco: Qualquer indústria
- 📊 Campos: `opportunity_type`, `target_date`, `quantity`, proposal_items[]
- 🔧 100% customizável por tenant
- 🚀 Multi-tenant robusto

---

## ⚙️ PRÓXIMOS PASSOS

1. ✅ **Olinda**: Publicar versão atual em produção
2. 🔄 **STRATEVO**: Cursor executará migração abstraída seguindo este guia
3. 🎨 **Customização**: Cada tenant configura terminologia e tipos
4. 📈 **Escala**: CRM funciona para qualquer modelo de negócio

---

**Tempo estimado de abstração no Cursor**: 2-3 horas
**Complexidade**: Média (substituições globais + adaptações de lógica)
**Resultado**: CRM universal e escalável
