# 🚀 MIGRAÇÃO CRM COMPLETO - MULTI-TENANT STRATEVO
## Instruções Cirúrgicas para Implementação no Cursor

---

## 📋 ÍNDICE

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Fase 1: Preparação do Ambiente](#fase-1-preparação-do-ambiente)
3. [Fase 2: Migração do Banco de Dados Multi-Tenant](#fase-2-migração-do-banco-de-dados-multi-tenant)
4. [Fase 3: Migração de Edge Functions](#fase-3-migração-de-edge-functions)
5. [Fase 4: Migração de Componentes React](#fase-4-migração-de-componentes-react)
6. [Fase 5: Sistema de Customização por Modelo de Negócio](#fase-5-sistema-de-customização-por-modelo-de-negócio)
7. [Fase 6: Integração com STRATEVO](#fase-6-integração-com-stratevo)
8. [Fase 7: Testes e Deploy](#fase-7-testes-e-deploy)

---

## 🎯 VISÃO GERAL DA ARQUITETURA

### Conceito Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                    STRATEVO INTELLIGENCE 360°                │
│                    (Plataforma Principal)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────▼─────────┐                 ┌──────────▼────────┐
│  Tenant 1:        │                 │  Tenant 2:        │
│  Empresa Eventos  │                 │  Comércio Ext.    │
├───────────────────┤                 ├───────────────────┤
│ CRM Customizado   │                 │ CRM Customizado   │
│ - Leads Eventos   │                 │ - Leads B2B       │
│ - Propostas       │                 │ - Cotações        │
│ - Agendamentos    │                 │ - Importação      │
│ - Pagamentos      │                 │ - Shipping        │
└───────────────────┘                 └───────────────────┘
```

### Princípios Fundamentais

1. **Isolamento Total de Dados**: Cada tenant tem seus dados completamente isolados
2. **Customização Dinâmica**: CRM se adapta ao modelo de negócio do tenant
3. **Código Compartilhado**: Mesma base de código, comportamento diferente
4. **Escalabilidade**: Suporta ilimitados tenants sem degradação

---

## 🔧 FASE 1: PREPARAÇÃO DO AMBIENTE

### 1.1 Backup Completo do Projeto STRATEVO

```bash
# No diretório do projeto STRATEVO
git checkout -b backup-pre-crm-migration
git add .
git commit -m "backup: Estado antes da migração do CRM"
git push origin backup-pre-crm-migration
```

### 1.2 Criar Branch para Migração

```bash
git checkout -b feature/crm-multi-tenant
```

### 1.3 Instalar Dependências Adicionais do CRM

```json
// package.json - Adicionar ao existing
{
  "dependencies": {
    "@tanstack/react-query": "^5.83.0",
    "date-fns": "^3.6.0",
    "recharts": "^2.15.4",
    "react-hook-form": "^7.61.1",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.25.76"
  }
}
```

```bash
npm install
```

---

## 🗄️ FASE 2: MIGRAÇÃO DO BANCO DE DADOS MULTI-TENANT

### 2.1 Estrutura Multi-Tenant Base

```sql
-- FILE: supabase/migrations/20250101_multi_tenant_base.sql

-- ============================================
-- TABELA DE TENANTS (EMPRESAS CADASTRADAS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  domain TEXT UNIQUE, -- Custom domain opcional
  
  -- Modelo de Negócio
  business_model TEXT NOT NULL, -- 'eventos', 'comercio_exterior', 'software', 'logistica', 'fabricante', 'distribuidor'
  industry_vertical TEXT, -- Sub-categoria específica
  
  -- Configuração
  settings JSONB DEFAULT '{}'::JSONB, -- Configurações customizadas
  crm_config JSONB DEFAULT '{}'::JSONB, -- Config específica do CRM
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#8b5cf6',
  
  -- Status
  status TEXT DEFAULT 'active', -- active, suspended, trial
  subscription_tier TEXT DEFAULT 'starter', -- starter, professional, enterprise
  trial_ends_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS para tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RELAÇÃO USUÁRIOS <-> TENANTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Papéis específicos do tenant
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, manager, sales, sdr, viewer
  
  -- Permissões
  permissions JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, invited, suspended
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant memberships"
  ON public.tenant_users FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- FUNÇÃO: GET CURRENT TENANT
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Busca o tenant_id do usuário atual
  SELECT tenant_id INTO tenant_uuid
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
  
  RETURN tenant_uuid;
END;
$$;

-- ============================================
-- FUNÇÃO: HAS TENANT ROLE
-- ============================================
CREATE OR REPLACE FUNCTION public.has_tenant_role(
  _tenant_id UUID,
  _role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE tenant_id = _tenant_id
      AND user_id = auth.uid()
      AND role = _role
      AND status = 'active'
  );
END;
$$;
```

### 2.2 Migração das Tabelas do CRM com Multi-Tenancy

```sql
-- FILE: supabase/migrations/20250101_crm_multi_tenant_tables.sql

-- ============================================
-- LEADS (Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- MULTI-TENANT KEY
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Informações Básicas
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  
  -- Dados Específicos por Modelo de Negócio (JSONB Flexível)
  business_data JSONB DEFAULT '{}'::JSONB,
  -- Exemplos:
  -- Eventos: { "event_type": "casamento", "event_date": "2025-06-15", "guest_count": 200 }
  -- Comércio Exterior: { "product_category": "eletrônicos", "destination_country": "EUA", "volume": "20 containers" }
  -- Software: { "company_size": "50-200", "current_stack": ["Salesforce", "HubSpot"], "pain_points": [...] }
  
  -- Pipeline
  status TEXT DEFAULT 'novo', -- novo, qualificado, contato_inicial, proposta, negociacao, fechado, perdido
  source TEXT DEFAULT 'website',
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Scoring
  lead_score INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Qualificação
  budget NUMERIC,
  timeline TEXT,
  decision_maker BOOLEAN DEFAULT false,
  
  -- Tracking
  last_contact_date TIMESTAMPTZ,
  next_followup_date TIMESTAMPTZ,
  
  -- Contadores
  notes_count INTEGER DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX idx_leads_status ON public.leads(tenant_id, status);
CREATE INDEX idx_leads_assigned ON public.leads(tenant_id, assigned_to);
CREATE INDEX idx_leads_created ON public.leads(tenant_id, created_at DESC);

-- RLS Multi-Tenant
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads from their tenant"
  ON public.leads FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can create leads in their tenant"
  ON public.leads FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can update leads in their tenant"
  ON public.leads FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (
    tenant_id = get_current_tenant_id() 
    AND has_tenant_role(tenant_id, 'admin')
  );

-- ============================================
-- ACTIVITIES (Tarefas/Atividades Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  
  -- Tipo de atividade adaptável
  type TEXT NOT NULL, -- call, email, meeting, task, visit, demo, proposal, follow_up, shipping_update, customs_clearance
  subject TEXT NOT NULL,
  description TEXT,
  
  -- Agendamento
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Responsável
  created_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_tenant_id ON public.activities(tenant_id);
CREATE INDEX idx_activities_lead_id ON public.activities(lead_id);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities from their tenant"
  ON public.activities FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage activities in their tenant"
  ON public.activities FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- PROPOSALS (Propostas Multi-Tenant e Flexíveis)
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  
  -- Identificação
  proposal_number TEXT UNIQUE NOT NULL,
  
  -- Tipo adaptável por modelo de negócio
  proposal_type TEXT NOT NULL, -- commercial, event, export_quote, software_license, logistics_contract
  
  -- Valores
  total_price NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  final_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Estrutura flexível de itens
  items JSONB DEFAULT '[]'::JSONB,
  -- Exemplo Eventos: [{"category": "venue", "name": "Espaço", "price": 10000}, ...]
  -- Exemplo Software: [{"license_type": "enterprise", "users": 100, "price": 50000}, ...]
  
  -- Termos e condições adaptáveis
  terms_and_conditions TEXT,
  payment_terms JSONB,
  delivery_terms JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
  valid_until DATE NOT NULL,
  
  -- Assinatura
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  
  -- Arquivos
  pdf_url TEXT,
  
  -- Datas
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proposals_tenant_id ON public.proposals(tenant_id);
CREATE INDEX idx_proposals_lead_id ON public.proposals(lead_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposals from their tenant"
  ON public.proposals FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage proposals in their tenant"
  ON public.proposals FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- DEALS (Pipeline de Vendas Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  
  -- Pipeline adaptável
  stage TEXT NOT NULL, -- discovery, qualification, proposal, negotiation, closed_won, closed_lost
  probability INTEGER DEFAULT 50,
  
  -- Datas
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Responsável
  owner_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  priority TEXT DEFAULT 'medium',
  source TEXT,
  tags TEXT[],
  lost_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deals_tenant_id ON public.deals(tenant_id);
CREATE INDEX idx_deals_stage ON public.deals(tenant_id, stage);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals from their tenant"
  ON public.deals FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage deals in their tenant"
  ON public.deals FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- AUTOMATIONS (Regras de Automação Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Configuração
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- status_change, field_update, time_based, webhook
  trigger_condition JSONB NOT NULL,
  actions JSONB NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automations from their tenant"
  ON public.automation_rules FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Admins can manage automations"
  ON public.automation_rules FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    AND has_tenant_role(tenant_id, 'admin')
  );

-- ============================================
-- EMAIL TEMPLATES (Templates Multi-Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Template
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT, -- follow_up, proposal, welcome, shipping_notification, etc
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their tenant"
  ON public.email_templates FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Admins can manage templates"
  ON public.email_templates FOR ALL
  USING (
    tenant_id = get_current_tenant_id()
    AND has_tenant_role(tenant_id, 'admin')
  );

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Configurações de Modelo de Negócio

```sql
-- FILE: supabase/migrations/20250101_business_model_configs.sql

-- ============================================
-- TABELA: BUSINESS MODEL TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_model_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  model_key TEXT UNIQUE NOT NULL, -- eventos, comercio_exterior, software, logistica
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- lucide icon name
  
  -- Configuração do CRM
  crm_config JSONB NOT NULL,
  -- Exemplo para Eventos:
  -- {
  --   "lead_fields": {
  --     "event_type": { "type": "select", "label": "Tipo de Evento", "options": ["casamento", "corporativo", "social"] },
  --     "event_date": { "type": "date", "label": "Data do Evento", "required": true },
  --     "guest_count": { "type": "number", "label": "Número de Convidados" }
  --   },
  --   "pipeline_stages": ["novo", "visita_agendada", "proposta", "negociacao", "fechado"],
  --   "proposal_structure": {
  --     "sections": ["venue", "catering", "decoration", "entertainment", "extras"]
  --   },
  --   "automation_templates": [...]
  -- }
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir templates padrão
INSERT INTO public.business_model_templates (model_key, name, description, icon, crm_config) VALUES
('eventos', 'Empresa de Eventos', 'CRM otimizado para gestão de eventos corporativos, casamentos e festas', 'calendar', '{
  "lead_fields": {
    "event_type": {
      "type": "select",
      "label": "Tipo de Evento",
      "options": ["casamento", "corporativo", "aniversario", "formatura", "outro"],
      "required": true
    },
    "event_date": {
      "type": "date",
      "label": "Data do Evento",
      "required": true
    },
    "guest_count": {
      "type": "number",
      "label": "Número de Convidados",
      "required": false
    },
    "venue_preference": {
      "type": "text",
      "label": "Preferência de Local",
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "visita_agendada", "label": "Visita Agendada", "color": "#8b5cf6"},
    {"key": "proposta_enviada", "label": "Proposta Enviada", "color": "#f59e0b"},
    {"key": "negociacao", "label": "Negociação", "color": "#10b981"},
    {"key": "fechado", "label": "Fechado", "color": "#22c55e"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "venue", "label": "Espaço", "icon": "building"},
    {"key": "catering", "label": "Buffet", "icon": "utensils"},
    {"key": "decoration", "label": "Decoração", "icon": "flower"},
    {"key": "entertainment", "label": "Entretenimento", "icon": "music"},
    {"key": "extras", "label": "Serviços Extras", "icon": "plus"}
  ]
}'::JSONB),

('comercio_exterior', 'Comércio Exterior', 'CRM para trading, importação e exportação', 'ship', '{
  "lead_fields": {
    "product_category": {
      "type": "select",
      "label": "Categoria de Produto",
      "options": ["eletronicos", "maquinas", "textil", "alimentos", "quimicos", "outro"],
      "required": true
    },
    "operation_type": {
      "type": "select",
      "label": "Tipo de Operação",
      "options": ["importacao", "exportacao", "triangulacao"],
      "required": true
    },
    "destination_country": {
      "type": "text",
      "label": "País de Destino/Origem",
      "required": true
    },
    "volume": {
      "type": "text",
      "label": "Volume Estimado",
      "required": false
    },
    "incoterm": {
      "type": "select",
      "label": "Incoterm",
      "options": ["FOB", "CIF", "EXW", "DDP", "DAP"],
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "analise_viabilidade", "label": "Análise de Viabilidade", "color": "#8b5cf6"},
    {"key": "cotacao_enviada", "label": "Cotação Enviada", "color": "#f59e0b"},
    {"key": "documentacao", "label": "Documentação", "color": "#10b981"},
    {"key": "embarque", "label": "Embarque", "color": "#22c55e"},
    {"key": "desembaraco", "label": "Desembaraço", "color": "#14b8a6"},
    {"key": "entregue", "label": "Entregue", "color": "#06b6d4"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "product", "label": "Produto", "icon": "package"},
    {"key": "freight", "label": "Frete", "icon": "truck"},
    {"key": "customs", "label": "Desembaraço", "icon": "file-check"},
    {"key": "insurance", "label": "Seguro", "icon": "shield"},
    {"key": "extras", "label": "Serviços Extras", "icon": "plus"}
  ]
}'::JSONB),

('software', 'Software/SaaS', 'CRM para vendas de software e soluções tecnológicas', 'code', '{
  "lead_fields": {
    "company_size": {
      "type": "select",
      "label": "Tamanho da Empresa",
      "options": ["1-10", "11-50", "51-200", "201-500", "500+"],
      "required": true
    },
    "current_stack": {
      "type": "multiselect",
      "label": "Stack Atual",
      "options": ["Salesforce", "HubSpot", "Pipedrive", "Zoho", "Monday", "Outro", "Nenhum"],
      "required": false
    },
    "pain_points": {
      "type": "textarea",
      "label": "Dores/Desafios",
      "required": false
    },
    "budget_range": {
      "type": "select",
      "label": "Faixa de Orçamento",
      "options": ["até 5k/mês", "5k-10k/mês", "10k-25k/mês", "25k+/mês"],
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "discovery", "label": "Discovery Call", "color": "#8b5cf6"},
    {"key": "demo", "label": "Demo", "color": "#f59e0b"},
    {"key": "proposta", "label": "Proposta", "color": "#10b981"},
    {"key": "negociacao", "label": "Negociação", "color": "#22c55e"},
    {"key": "contrato", "label": "Contrato", "color": "#14b8a6"},
    {"key": "onboarding", "label": "Onboarding", "color": "#06b6d4"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "licenses", "label": "Licenças", "icon": "key"},
    {"key": "implementation", "label": "Implementação", "icon": "settings"},
    {"key": "training", "label": "Treinamento", "icon": "graduation-cap"},
    {"key": "support", "label": "Suporte", "icon": "headphones"},
    {"key": "integrations", "label": "Integrações", "icon": "plug"}
  ]
}'::JSONB),

('logistica', 'Logística e Transportes', 'CRM para transportadoras e operadores logísticos', 'truck', '{
  "lead_fields": {
    "cargo_type": {
      "type": "select",
      "label": "Tipo de Carga",
      "options": ["geral", "refrigerada", "perigosa", "fracionada", "completa"],
      "required": true
    },
    "route": {
      "type": "text",
      "label": "Rota (Origem-Destino)",
      "required": true
    },
    "volume": {
      "type": "text",
      "label": "Volume Mensal Estimado",
      "required": false
    },
    "urgency": {
      "type": "select",
      "label": "Urgência",
      "options": ["express", "normal", "economica"],
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "cotacao", "label": "Cotação", "color": "#8b5cf6"},
    {"key": "negociacao", "label": "Negociação", "color": "#f59e0b"},
    {"key": "contrato", "label": "Contrato", "color": "#10b981"},
    {"key": "primeira_operacao", "label": "Primeira Operação", "color": "#22c55e"},
    {"key": "ativo", "label": "Cliente Ativo", "color": "#14b8a6"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "freight", "label": "Frete", "icon": "truck"},
    {"key": "handling", "label": "Movimentação", "icon": "package"},
    {"key": "storage", "label": "Armazenagem", "icon": "warehouse"},
    {"key": "insurance", "label": "Seguro", "icon": "shield"},
    {"key": "extras", "label": "Serviços Extras", "icon": "plus"}
  ]
}'::JSONB);
```

---

## ⚡ FASE 3: MIGRAÇÃO DE EDGE FUNCTIONS

### 3.1 Estrutura de Pastas das Edge Functions

```
supabase/functions/
├── _shared/
│   ├── tenant-context.ts       # Helpers multi-tenant
│   ├── business-model.ts       # Lógica de modelos de negócio
│   └── cors.ts                 # CORS headers
├── crm-leads/
│   └── index.ts                # CRUD de leads
├── crm-proposals/
│   └── index.ts                # Geração de propostas
├── crm-automations/
│   └── index.ts                # Processamento de automações
└── ai-lead-scoring/
    └── index.ts                # Scoring de leads com IA
```

### 3.2 Helper: Tenant Context

```typescript
// FILE: supabase/functions/_shared/tenant-context.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

export interface TenantContext {
  tenantId: string;
  userId: string;
  tenantConfig: {
    businessModel: string;
    settings: any;
    crmConfig: any;
  };
  supabase: any;
}

export async function getTenantContext(req: Request): Promise<TenantContext> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Unauthorized');
  }
  
  // Buscar tenant do usuário
  const { data: tenantUser, error: tenantError } = await supabase
    .from('tenant_users')
    .select(`
      tenant_id,
      tenants (
        id,
        business_model,
        settings,
        crm_config
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (tenantError || !tenantUser) {
    throw new Error('Tenant not found');
  }
  
  return {
    tenantId: tenantUser.tenant_id,
    userId: user.id,
    tenantConfig: {
      businessModel: tenantUser.tenants.business_model,
      settings: tenantUser.tenants.settings,
      crmConfig: tenantUser.tenants.crm_config
    },
    supabase
  };
}

export function validateTenantAccess(ctx: TenantContext, resourceTenantId: string) {
  if (ctx.tenantId !== resourceTenantId) {
    throw new Error('Access denied: Resource belongs to different tenant');
  }
}
```

### 3.3 Edge Function: CRM Leads

```typescript
// FILE: supabase/functions/crm-leads/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getTenantContext, validateTenantAccess } from '../_shared/tenant-context.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ctx = await getTenantContext(req);
    const { method, url } = req;
    const urlObj = new URL(url);
    const action = urlObj.searchParams.get('action');

    // CREATE LEAD
    if (req.method === 'POST' && action === 'create') {
      const body = await req.json();
      
      // Validar campos obrigatórios baseados no modelo de negócio
      const requiredFields = getRequiredFieldsForModel(ctx.tenantConfig.businessModel);
      validateLeadData(body, requiredFields);
      
      // Inserir lead com tenant_id
      const { data, error } = await ctx.supabase
        .from('leads')
        .insert({
          ...body,
          tenant_id: ctx.tenantId,
          created_by: ctx.userId
        })
        .select()
        .single();

      if (error) throw error;

      // Processar automações
      await processAutomations(ctx, 'lead_created', data);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UPDATE LEAD
    if (req.method === 'PATCH' && action === 'update') {
      const { id, ...updates } = await req.json();
      
      // Verificar se o lead pertence ao tenant
      const { data: lead } = await ctx.supabase
        .from('leads')
        .select('tenant_id')
        .eq('id', id)
        .single();
      
      if (!lead) throw new Error('Lead not found');
      validateTenantAccess(ctx, lead.tenant_id);

      // Atualizar
      const { data, error } = await ctx.supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Processar automações de mudança de status
      if (updates.status) {
        await processAutomations(ctx, 'status_change', data);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // LIST LEADS (com filtros do modelo de negócio)
    if (req.method === 'GET') {
      const status = urlObj.searchParams.get('status');
      const assignedTo = urlObj.searchParams.get('assigned_to');
      
      let query = ctx.supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (assignedTo) query = query.eq('assigned_to', assignedTo);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getRequiredFieldsForModel(businessModel: string): string[] {
  const modelFields = {
    'eventos': ['event_type', 'event_date'],
    'comercio_exterior': ['product_category', 'operation_type', 'destination_country'],
    'software': ['company_size'],
    'logistica': ['cargo_type', 'route']
  };
  return modelFields[businessModel] || [];
}

function validateLeadData(data: any, requiredFields: string[]) {
  const businessData = data.business_data || {};
  for (const field of requiredFields) {
    if (!businessData[field]) {
      throw new Error(`Campo obrigatório ausente: ${field}`);
    }
  }
}

async function processAutomations(ctx: any, triggerType: string, leadData: any) {
  // Buscar regras de automação ativas
  const { data: rules } = await ctx.supabase
    .from('automation_rules')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .eq('trigger_type', triggerType)
    .eq('is_active', true);

  // Processar cada regra
  for (const rule of rules || []) {
    // Verificar condição
    if (evaluateCondition(rule.trigger_condition, leadData)) {
      // Executar ações
      await executeActions(ctx, rule.actions, leadData);
    }
  }
}

function evaluateCondition(condition: any, data: any): boolean {
  // Implementação simplificada
  // TODO: Implementar avaliador de condições mais robusto
  return true;
}

async function executeActions(ctx: any, actions: any[], leadData: any) {
  for (const action of actions) {
    if (action.type === 'create_task') {
      await ctx.supabase.from('activities').insert({
        tenant_id: ctx.tenantId,
        lead_id: leadData.id,
        type: 'task',
        subject: action.title,
        description: action.description,
        due_date: new Date(Date.now() + action.due_days * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    // TODO: Implementar outras ações (email, notificação, etc)
  }
}
```

### 3.4 Edge Function: AI Lead Scoring (Multi-Tenant)

```typescript
// FILE: supabase/functions/ai-lead-scoring/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getTenantContext } from '../_shared/tenant-context.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ctx = await getTenantContext(req);
    const { leadId, action } = await req.json();

    if (action === 'analyze') {
      // Buscar lead completo
      const { data: lead } = await ctx.supabase
        .from('leads')
        .select(`
          *,
          activities (*)
        `)
        .eq('id', leadId)
        .eq('tenant_id', ctx.tenantId)
        .single();

      if (!lead) throw new Error('Lead not found');

      // Construir contexto para IA baseado no modelo de negócio
      const context = buildLeadContext(lead, ctx.tenantConfig);

      // Chamar OpenAI para análise
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente de análise de leads para empresas de ${ctx.tenantConfig.businessModel}. 
              Analise o lead e retorne uma pontuação de 0-100, probabilidade de fechamento, 
              ações recomendadas e data prevista de fechamento.`
            },
            {
              role: 'user',
              content: context
            }
          ],
          temperature: 0.3
        })
      });

      const aiResult = await response.json();
      const analysis = JSON.parse(aiResult.choices[0].message.content);

      // Salvar análise
      await ctx.supabase.from('ai_lead_analysis').insert({
        tenant_id: ctx.tenantId,
        lead_id: leadId,
        predicted_probability: analysis.probability,
        predicted_close_date: analysis.predicted_close_date,
        recommended_actions: analysis.actions,
        score_version: '1.0'
      });

      // Atualizar score do lead
      await ctx.supabase
        .from('leads')
        .update({ lead_score: analysis.score })
        .eq('id', leadId);

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Invalid action', { status: 400 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildLeadContext(lead: any, tenantConfig: any): string {
  const businessModel = tenantConfig.businessModel;
  
  // Contexto básico
  let context = `
    DADOS DO LEAD:
    - Nome: ${lead.name}
    - Empresa: ${lead.company_name || 'N/A'}
    - Email: ${lead.email}
    - Telefone: ${lead.phone}
    - Status Atual: ${lead.status}
    - Prioridade: ${lead.priority}
    - Fonte: ${lead.source}
    - Orçamento: ${lead.budget ? `R$ ${lead.budget}` : 'Não informado'}
    - Timeline: ${lead.timeline || 'Não informado'}
    - É tomador de decisão: ${lead.decision_maker ? 'Sim' : 'Não'}
    - Data de criação: ${lead.created_at}
    - Último contato: ${lead.last_contact_date || 'Nunca'}
  `;

  // Adicionar contexto específico do modelo de negócio
  if (lead.business_data) {
    context += `\n\nDADOS ESPECÍFICOS DO NEGÓCIO (${businessModel}):\n`;
    Object.entries(lead.business_data).forEach(([key, value]) => {
      context += `- ${key}: ${value}\n`;
    });
  }

  // Adicionar histórico de atividades
  if (lead.activities && lead.activities.length > 0) {
    context += `\n\nHISTÓRICO DE ATIVIDADES (${lead.activities.length} atividades):\n`;
    lead.activities.slice(0, 5).forEach((activity: any) => {
      context += `- ${activity.type}: ${activity.subject} (${activity.created_at})\n`;
    });
  }

  return context;
}
```

---

## 📦 FASE 4: MIGRAÇÃO DE COMPONENTES REACT

### 4.1 Estrutura de Componentes

```
src/
├── components/
│   ├── crm/
│   │   ├── multi-tenant/
│   │   │   ├── TenantProvider.tsx          # Context provider
│   │   │   ├── TenantSwitcher.tsx          # Switch entre tenants
│   │   │   └── BusinessModelAdapter.tsx    # Adapta UI ao modelo
│   │   ├── leads/
│   │   │   ├── LeadsList.tsx
│   │   │   ├── LeadDetails.tsx
│   │   │   ├── LeadPipeline.tsx
│   │   │   └── CreateLeadDialog.tsx
│   │   ├── proposals/
│   │   │   ├── ProposalBuilder.tsx
│   │   │   ├── ProposalTemplate.tsx
│   │   │   └── ProposalsList.tsx
│   │   ├── activities/
│   │   │   ├── ActivitiesTimeline.tsx
│   │   │   └── CreateActivityDialog.tsx
│   │   └── shared/
│   │       ├── CRMLayout.tsx
│   │       └── DynamicForm.tsx
│   └── admin/
│       └── ... (componentes existentes do STRATEVO)
├── hooks/
│   ├── useTenant.ts
│   ├── useLeads.ts
│   ├── useProposals.ts
│   └── useBusinessModel.ts
└── services/
    ├── tenantService.ts
    ├── leadsService.ts
    └── proposalsService.ts
```

### 4.2 Tenant Provider

```typescript
// FILE: src/components/crm/multi-tenant/TenantProvider.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  tenant: {
    id: string;
    name: string;
    slug: string;
    businessModel: string;
    settings: any;
    crmConfig: any;
  } | null;
  userRole: string | null;
  isLoading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantContextType['tenant']>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      
      // Buscar tenant do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTenant(null);
        setUserRole(null);
        return;
      }

      const { data: tenantUser, error } = await supabase
        .from('tenant_users')
        .select(`
          role,
          tenants (
            id,
            name,
            slug,
            business_model,
            settings,
            crm_config
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error || !tenantUser) {
        console.error('Tenant not found:', error);
        setTenant(null);
        setUserRole(null);
        return;
      }

      setTenant({
        id: tenantUser.tenants.id,
        name: tenantUser.tenants.name,
        slug: tenantUser.tenants.slug,
        businessModel: tenantUser.tenants.business_model,
        settings: tenantUser.tenants.settings,
        crmConfig: tenantUser.tenants.crm_config
      });
      setUserRole(tenantUser.role);

    } catch (error) {
      console.error('Error loading tenant:', error);
      setTenant(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        userRole,
        isLoading,
        refreshTenant: loadTenant
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

### 4.3 Business Model Adapter

```typescript
// FILE: src/components/crm/multi-tenant/BusinessModelAdapter.tsx

import React from 'react';
import { useTenant } from './TenantProvider';
import { Calendar, Ship, Code, Truck, Building } from 'lucide-react';

interface BusinessModelAdapterProps {
  children: React.ReactNode;
}

export function BusinessModelAdapter({ children }: BusinessModelAdapterProps) {
  const { tenant, isLoading } = useTenant();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Carregando configurações...</p>
      </div>
    </div>;
  }

  if (!tenant) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-red-500">Nenhum tenant configurado</p>
      </div>
    </div>;
  }

  // Definir tema de cores baseado no modelo de negócio
  const modelThemes = {
    'eventos': {
      icon: Calendar,
      primary: '#8b5cf6',
      secondary: '#a78bfa'
    },
    'comercio_exterior': {
      icon: Ship,
      primary: '#0ea5e9',
      secondary: '#38bdf8'
    },
    'software': {
      icon: Code,
      primary: '#10b981',
      secondary: '#34d399'
    },
    'logistica': {
      icon: Truck,
      primary: '#f59e0b',
      secondary: '#fbbf24'
    }
  };

  const theme = modelThemes[tenant.businessModel as keyof typeof modelThemes] || {
    icon: Building,
    primary: '#3b82f6',
    secondary: '#60a5fa'
  };

  // Injetar variáveis CSS customizadas
  React.useEffect(() => {
    document.documentElement.style.setProperty('--crm-primary', theme.primary);
    document.documentElement.style.setProperty('--crm-secondary', theme.secondary);
  }, [tenant.businessModel]);

  return <>{children}</>;
}

// Hook para acessar configuração do modelo de negócio
export function useBusinessModel() {
  const { tenant } = useTenant();
  
  if (!tenant) {
    throw new Error('Tenant not loaded');
  }

  const config = tenant.crmConfig || {};

  return {
    businessModel: tenant.businessModel,
    leadFields: config.lead_fields || {},
    pipelineStages: config.pipeline_stages || [],
    proposalSections: config.proposal_sections || [],
    getFieldConfig: (fieldKey: string) => config.lead_fields?.[fieldKey],
    getStageConfig: (stageKey: string) => 
      config.pipeline_stages?.find((s: any) => s.key === stageKey)
  };
}
```

### 4.4 Dynamic Form Builder

```typescript
// FILE: src/components/crm/shared/DynamicForm.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface DynamicFormProps {
  fields: any[]; // Configuração de campos do modelo de negócio
  onSubmit: (data: any) => void;
  defaultValues?: any;
  submitLabel?: string;
}

export function DynamicForm({
  fields,
  onSubmit,
  defaultValues = {},
  submitLabel = 'Salvar'
}: DynamicFormProps) {
  // Construir schema Zod dinamicamente
  const schemaFields: any = {};
  
  fields.forEach(field => {
    let fieldSchema: any;
    
    switch (field.type) {
      case 'text':
      case 'select':
        fieldSchema = z.string();
        break;
      case 'number':
        fieldSchema = z.number().or(z.string().transform(Number));
        break;
      case 'date':
        fieldSchema = z.date().or(z.string().transform(str => new Date(str)));
        break;
      case 'textarea':
        fieldSchema = z.string();
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        break;
      default:
        fieldSchema = z.any();
    }
    
    if (field.required) {
      schemaFields[field.key] = fieldSchema;
    } else {
      schemaFields[field.key] = fieldSchema.optional();
    }
  });

  const formSchema = z.object(schemaFields);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input {...formField} placeholder={field.placeholder} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'number':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    {...formField} 
                    type="number" 
                    placeholder={field.placeholder} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...formField} 
                    placeholder={field.placeholder}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <Select 
                  onValueChange={formField.onChange} 
                  defaultValue={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || 'Selecione...'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'date':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{field.label}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {formField.value ? (
                          format(new Date(formField.value), 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value ? new Date(formField.value) : undefined}
                      onSelect={formField.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(renderField)}
        
        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
```

### 4.5 Leads Pipeline (Adaptável)

```typescript
// FILE: src/components/crm/leads/LeadPipeline.tsx

import React, { useState, useEffect } from 'react';
import { useBusinessModel } from '../multi-tenant/BusinessModelAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '../multi-tenant/TenantProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  business_data: any;
  lead_score: number;
  created_at: string;
}

export function LeadPipeline() {
  const { tenant } = useTenant();
  const { pipelineStages, businessModel, getStageConfig } = useBusinessModel();
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [tenant]);

  const fetchLeads = async () => {
    if (!tenant) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar leads por estágio
      const groupedLeads: Record<string, Lead[]> = {};
      pipelineStages.forEach((stage: any) => {
        groupedLeads[stage.key] = data?.filter(l => l.status === stage.key) || [];
      });

      setLeads(groupedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceStage = result.source.droppableId;
    const destStage = result.destination.droppableId;
    const leadId = result.draggableId;

    if (sourceStage === destStage) return;

    // Atualizar localmente primeiro (UX otimista)
    const lead = leads[sourceStage].find(l => l.id === leadId);
    if (!lead) return;

    const newLeads = { ...leads };
    newLeads[sourceStage] = newLeads[sourceStage].filter(l => l.id !== leadId);
    newLeads[destStage] = [...newLeads[destStage], { ...lead, status: destStage }];
    setLeads(newLeads);

    // Atualizar no banco
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: destStage })
        .eq('id', leadId);

      if (error) throw error;

      toast.success(`Lead movido para ${getStageConfig(destStage)?.label || destStage}`);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
      // Reverter mudança local
      fetchLeads();
    }
  };

  if (isLoading) {
    return <div>Carregando pipeline...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage: any) => {
          const stageLeads = leads[stage.key] || [];
          const stageConfig = getStageConfig(stage.key);

          return (
            <div key={stage.key} className="flex-shrink-0 w-80">
              <Card>
                <CardHeader className="pb-3" style={{ borderBottomColor: stageConfig?.color }}>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{stage.label}</span>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </CardTitle>
                </CardHeader>
                
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[500px] ${
                        snapshot.isDraggingOver ? 'bg-accent/50' : ''
                      }`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="font-medium text-sm mb-1">{lead.name}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {lead.email}
                              </div>
                              
                              {/* Dados específicos do modelo de negócio */}
                              {lead.business_data && (
                                <div className="text-xs space-y-1 mt-2">
                                  {businessModel === 'eventos' && lead.business_data.event_type && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {lead.business_data.event_type}
                                      </Badge>
                                      {lead.business_data.event_date && (
                                        <span className="text-muted-foreground">
                                          {new Date(lead.business_data.event_date).toLocaleDateString('pt-BR')}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {businessModel === 'comercio_exterior' && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {lead.business_data.operation_type}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        {lead.business_data.destination_country}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Score */}
                              {lead.lead_score > 0 && (
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Score</span>
                                  <Badge variant={lead.lead_score >= 70 ? 'default' : 'secondary'}>
                                    {lead.lead_score}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
```

---

## 🎨 FASE 5: SISTEMA DE CUSTOMIZAÇÃO POR MODELO DE NEGÓCIO

### 5.1 Onboarding de Novo Tenant

```typescript
// FILE: src/pages/OnboardingTenant.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Ship, Code, Truck, Building, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BUSINESS_MODELS = [
  {
    key: 'eventos',
    name: 'Empresa de Eventos',
    description: 'Gestão de casamentos, eventos corporativos e festas',
    icon: Calendar,
    color: '#8b5cf6'
  },
  {
    key: 'comercio_exterior',
    name: 'Comércio Exterior',
    description: 'Trading, importação e exportação',
    icon: Ship,
    color: '#0ea5e9'
  },
  {
    key: 'software',
    name: 'Software/SaaS',
    description: 'Vendas de software e soluções tecnológicas',
    icon: Code,
    color: '#10b981'
  },
  {
    key: 'logistica',
    name: 'Logística e Transportes',
    description: 'Transportadoras e operadores logísticos',
    icon: Truck,
    color: '#f59e0b'
  }
];

export default function OnboardingTenant() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tenantData, setTenantData] = useState({
    name: '',
    slug: '',
    businessModel: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTenant = async () => {
    if (!tenantData.name || !tenantData.slug || !tenantData.businessModel) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setIsCreating(true);

      // Buscar configuração do modelo de negócio
      const { data: modelTemplate, error: templateError } = await supabase
        .from('business_model_templates')
        .select('crm_config')
        .eq('model_key', tenantData.businessModel)
        .single();

      if (templateError) throw templateError;

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          slug: tenantData.slug,
          business_model: tenantData.businessModel,
          crm_config: modelTemplate.crm_config,
          created_by: user.id
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Vincular usuário como owner
      const { error: userTenantError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (userTenantError) throw userTenantError;

      toast.success('Empresa cadastrada com sucesso!');
      navigate('/crm/dashboard');

    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast.error(error.message || 'Erro ao cadastrar empresa');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar Sua Empresa</CardTitle>
          <CardDescription>
            Configure o CRM ideal para o seu modelo de negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  placeholder="Minha Empresa Ltda"
                  value={tenantData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    
                    setTenantData({ ...tenantData, name, slug });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Identificador Único (Slug)</Label>
                <Input
                  id="slug"
                  placeholder="minha-empresa"
                  value={tenantData.slug}
                  onChange={(e) => setTenantData({ ...tenantData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Será usado na URL: stratevo.app/crm/{tenantData.slug}
                </p>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Próximo: Escolher Modelo de Negócio
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Escolha o Modelo de Negócio</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  O CRM será customizado automaticamente para o seu segmento
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {BUSINESS_MODELS.map((model) => {
                  const Icon = model.icon;
                  const isSelected = tenantData.businessModel === model.key;

                  return (
                    <Card
                      key={model.key}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setTenantData({ ...tenantData, businessModel: model.key })}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: `${model.color}20` }}
                          >
                            <Icon className="h-6 w-6" style={{ color: model.color }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{model.name}</h3>
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={handleCreateTenant}
                  disabled={!tenantData.businessModel || isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Criando...' : 'Criar Empresa e CRM'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔗 FASE 6: INTEGRAÇÃO COM STRATEVO

### 6.1 Atualização do App.tsx do STRATEVO

```typescript
// FILE: src/App.tsx (ADICIONAR ao App.tsx existente do STRATEVO)

import { TenantProvider } from './components/crm/multi-tenant/TenantProvider';
import { BusinessModelAdapter } from './components/crm/multi-tenant/BusinessModelAdapter';

// Importar páginas do CRM
const OnboardingTenant = lazy(() => import('./pages/OnboardingTenant'));
const CRMDashboard = lazy(() => import('./pages/crm/Dashboard'));
const CRMLeads = lazy(() => import('./pages/crm/Leads'));
const CRMProposals = lazy(() => import('./pages/crm/Proposals'));
// ... outras páginas do CRM

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="stratevo-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* ADICIONAR TenantProvider aqui */}
            <TenantProvider>
              <BusinessModelAdapter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Rotas existentes do STRATEVO */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* NOVAS ROTAS DO CRM */}
                    <Route path="/onboarding/tenant" element={
                      <ProtectedRoute>
                        <OnboardingTenant />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/crm/dashboard" element={
                      <ProtectedRoute>
                        <CRMDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/crm/leads" element={
                      <ProtectedRoute>
                        <CRMLeads />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/crm/proposals" element={
                      <ProtectedRoute>
                        <CRMProposals />
                      </ProtectedRoute>
                    } />
                    
                    {/* ... outras rotas do CRM */}
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BusinessModelAdapter>
            </TenantProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 6.2 Menu de Navegação Integrado

```typescript
// FILE: src/components/admin/AdminSidebar.tsx (ATUALIZAR o existente do STRATEVO)

import { useTenant } from '@/components/crm/multi-tenant/TenantProvider';

export function AdminSidebar() {
  const { tenant, userRole } = useTenant();
  
  // Menu items do STRATEVO (existente)
  const stratefoItems = [
    { icon: Home, label: 'Dashboard', to: '/' },
    { icon: Search, label: 'Central ICP', to: '/central-icp' },
    // ... outros items existentes
  ];

  // Menu items do CRM (novo)
  const crmItems = tenant ? [
    { icon: BarChart3, label: 'CRM Dashboard', to: '/crm/dashboard' },
    { icon: Users, label: 'Leads', to: '/crm/leads' },
    { icon: FileText, label: 'Propostas', to: '/crm/proposals' },
    { icon: Calendar, label: 'Atividades', to: '/crm/activities' },
    { icon: TrendingUp, label: 'Pipeline', to: '/crm/pipeline' },
    { icon: Settings, label: 'Automações', to: '/crm/automations' },
  ] : [];

  return (
    <aside className="w-64 bg-sidebar border-r">
      <div className="p-4">
        <h2 className="text-lg font-semibold">STRATEVO Intelligence</h2>
        {tenant && (
          <p className="text-xs text-muted-foreground mt-1">
            {tenant.name}
          </p>
        )}
      </div>

      <nav className="space-y-1 p-2">
        {/* Seção STRATEVO */}
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
            Intelligence
          </p>
          {stratefoItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="...">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Seção CRM (apenas se tenant configurado) */}
        {tenant && (
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
              CRM - {tenant.businessModel}
            </p>
            {crmItems.map((item) => (
              <NavLink key={item.to} to={item.to} className="...">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
```

---

## 🧪 FASE 7: TESTES E DEPLOY

### 7.1 Checklist de Implementação

```markdown
### BANCO DE DADOS
- [ ] Executar migration `20250101_multi_tenant_base.sql`
- [ ] Executar migration `20250101_crm_multi_tenant_tables.sql`
- [ ] Executar migration `20250101_business_model_configs.sql`
- [ ] Verificar RLS policies ativas em todas as tabelas
- [ ] Testar funções `get_current_tenant_id()` e `has_tenant_role()`

### EDGE FUNCTIONS
- [ ] Deploy `_shared/tenant-context.ts`
- [ ] Deploy `crm-leads/index.ts`
- [ ] Deploy `ai-lead-scoring/index.ts`
- [ ] Configurar secrets necessários (OPENAI_API_KEY)
- [ ] Testar endpoints com Postman/Insomnia

### COMPONENTES REACT
- [ ] Implementar TenantProvider
- [ ] Implementar BusinessModelAdapter
- [ ] Implementar DynamicForm
- [ ] Implementar LeadPipeline
- [ ] Implementar OnboardingTenant
- [ ] Atualizar App.tsx com rotas do CRM
- [ ] Atualizar AdminSidebar com menu CRM

### INTEGRAÇÃO STRATEVO
- [ ] Instalar dependências adicionais
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Testar fluxo de onboarding
- [ ] Testar navegação entre STRATEVO e CRM
- [ ] Verificar isolamento de dados entre tenants

### TESTES
- [ ] Criar 2 tenants de teste com modelos diferentes
- [ ] Testar criação de leads em cada tenant
- [ ] Verificar que tenant A não vê dados do tenant B
- [ ] Testar pipeline drag-and-drop
- [ ] Testar criação de propostas
- [ ] Testar automações
```

### 7.2 Script de Teste Multi-Tenant

```bash
#!/bin/bash
# FILE: test-multi-tenant.sh

echo "🧪 TESTE DE ISOLAMENTO MULTI-TENANT"
echo ""

# Variáveis
SUPABASE_URL="https://vkdvezuivlovzqxmnohk.supabase.co"
SUPABASE_KEY="[SUA_ANON_KEY]"

# Criar Tenant 1: Eventos
echo "1️⃣ Criando Tenant 1 (Eventos)..."
TENANT1_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/tenants" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer [USER1_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Espaço Linda Eventos",
    "slug": "espaco-linda",
    "business_model": "eventos"
  }')

TENANT1_ID=$(echo $TENANT1_RESPONSE | jq -r '.id')
echo "✅ Tenant 1 criado: $TENANT1_ID"

# Criar Tenant 2: Comércio Exterior
echo ""
echo "2️⃣ Criando Tenant 2 (Comércio Exterior)..."
TENANT2_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/tenants" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer [USER2_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GlobalTrade Brasil",
    "slug": "globaltrade",
    "business_model": "comercio_exterior"
  }')

TENANT2_ID=$(echo $TENANT2_RESPONSE | jq -r '.id')
echo "✅ Tenant 2 criado: $TENANT2_ID"

# Criar Lead no Tenant 1
echo ""
echo "3️⃣ Criando lead no Tenant 1..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/leads" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer [USER1_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 99999-9999",
    "event_type": "casamento",
    "business_data": {
      "event_type": "casamento",
      "event_date": "2025-06-15",
      "guest_count": 200
    }
  }' | jq

echo "✅ Lead criado no Tenant 1"

# Tentar acessar lead do Tenant 1 com usuário do Tenant 2
echo ""
echo "4️⃣ Tentando acessar lead do Tenant 1 com usuário do Tenant 2..."
CROSS_ACCESS=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/leads" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer [USER2_TOKEN]")

LEAD_COUNT=$(echo $CROSS_ACCESS | jq '. | length')

if [ "$LEAD_COUNT" -eq 0 ]; then
  echo "✅ ISOLAMENTO OK: Tenant 2 não vê leads do Tenant 1"
else
  echo "❌ ERRO: Tenant 2 conseguiu acessar leads do Tenant 1!"
fi

echo ""
echo "✅ Teste de isolamento multi-tenant concluído!"
```

---

## 📚 DOCUMENTAÇÃO FINAL

### Resumo da Arquitetura

```
┌────────────────────────────────────────────────────────┐
│                  STRATEVO INTELLIGENCE                 │
│              (Prospect + Analysis + SEO)               │
└────────────────────┬───────────────────────────────────┘
                     │
                     ├─ Multi-Tenant CRM ─────────────────┐
                     │                                    │
    ┌────────────────▼─────────┐         ┌───────────────▼──────────┐
    │  TENANT: Espaço Linda    │         │ TENANT: GlobalTrade      │
    │  Modelo: Eventos         │         │ Modelo: Comércio Ext.    │
    ├──────────────────────────┤         ├──────────────────────────┤
    │ Leads                    │         │ Leads                    │
    │ - event_type             │         │ - product_category       │
    │ - event_date             │         │ - operation_type         │
    │ - guest_count            │         │ - destination_country    │
    │                          │         │                          │
    │ Pipeline                 │         │ Pipeline                 │
    │ - Novo                   │         │ - Novo                   │
    │ - Visita Agendada        │         │ - Análise Viabilidade    │
    │ - Proposta               │         │ - Cotação                │
    │ - Fechado                │         │ - Embarque               │
    │                          │         │                          │
    │ Propostas                │         │ Propostas                │
    │ - Espaço                 │         │ - Produto                │
    │ - Buffet                 │         │ - Frete                  │
    │ - Decoração              │         │ - Desembaraço            │
    └──────────────────────────┘         └──────────────────────────┘
```

### Próximos Passos

1. **Implementar no Cursor**: Seguir fase por fase
2. **Deploy Incremental**: Fazer deploy por etapas
3. **Testes Reais**: Criar tenants de teste
4. **Feedback Loop**: Ajustar baseado no uso real

### Suporte

Para dúvidas durante a implementação:
- Consultar documentação inline nos arquivos
- Revisar exemplos de cada modelo de negócio
- Testar isolamento de dados constantemente

---

**IMPORTANTE**: Esta migração preserva 100% das funcionalidades do CRM original enquanto adiciona:
- ✅ Multi-tenancy completo
- ✅ Customização por modelo de negócio
- ✅ Isolamento total de dados
- ✅ Escalabilidade ilimitada
- ✅ Integração perfeita com STRATEVO
