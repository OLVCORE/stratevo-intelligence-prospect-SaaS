# 🚀 PLANO DE IMPLEMENTAÇÃO - CICLO 2: AUTOMAÇÕES BÁSICAS

**Data:** 2025-01-22  
**Objetivo:** Reduzir trabalho manual através de automações inteligentes  
**Prazo Estimado:** 5-7 dias  
**Status:** 🟢 PRONTO PARA EXECUÇÃO

---

## 📋 CHECKLIST DETALHADO

### ✅ FASE 1: INFRAESTRUTURA (Dia 1-2)

#### 1.1 Edge Function: Automation Runner
- [ ] Criar `supabase/functions/crm-automation-runner/index.ts`
- [ ] Implementar busca de regras ativas por tenant
- [ ] Implementar verificação de condições
- [ ] Implementar execução de ações
- [ ] Implementar logging em `automation_logs`
- [ ] Configurar cron job (a cada 5 minutos)
- [ ] Testar execução manual

#### 1.2 Database Triggers
- [ ] Criar função `trigger_on_lead_stage_change()`
- [ ] Criar trigger `on_lead_stage_change` na tabela `leads`
- [ ] Criar função `trigger_on_deal_stage_change()`
- [ ] Criar trigger `on_deal_stage_change` na tabela `deals`
- [ ] Notificar fila de automações quando estágio muda
- [ ] Testar triggers com dados de exemplo

#### 1.3 Sistema de Lembretes
- [ ] Verificar/criar tabela `reminders`
- [ ] Criar Edge Function `crm-reminder-processor`
- [ ] Implementar busca de lembretes vencidos
- [ ] Implementar criação de notificações
- [ ] Configurar cron job (a cada hora)
- [ ] Testar sistema de lembretes

---

### ✅ FASE 2: TRIGGERS POR ESTÁGIO (Dia 2-3)

#### 2.1 Email Automático ao Mudar Estágio
- [ ] Criar regra de exemplo: "Novo → Qualificado"
- [ ] Criar template de email: "Bem-vindo - Lead Qualificado"
- [ ] Implementar ação `send_email` no automation runner
- [ ] Integrar com `email_templates` table
- [ ] Implementar substituição de variáveis
- [ ] Testar envio automático

#### 2.2 Criação Automática de Tarefas
- [ ] Criar regra: "Qualificado → Proposta" → Criar tarefa "Enviar proposta"
- [ ] Criar regra: "Proposta → Negociação" → Criar tarefa "Agendar reunião"
- [ ] Implementar ação `create_task` no automation runner
- [ ] Criar tarefas em `activities` table
- [ ] Atribuir tarefa ao responsável do lead
- [ ] Testar criação automática

#### 2.3 Notificações Configuráveis
- [ ] Implementar ação `send_notification` no automation runner
- [ ] Criar regra: notificar vendedor ao mudar estágio
- [ ] Criar regra: notificar manager para deals > R$ 100k
- [ ] Integrar com sistema de notificações existente
- [ ] Testar notificações

---

### ✅ FASE 3: LEMBRETES INTELIGENTES (Dia 3-4)

#### 3.1 Follow-up Automático
- [ ] Criar regra: `trigger_type = 'time_based'`
- [ ] Condição: `days_since_last_contact >= 3`
- [ ] Ação: criar tarefa de follow-up
- [ ] Ação alternativa: enviar email de follow-up
- [ ] Configurável por tenant
- [ ] Testar follow-up automático

#### 3.2 Alertas de Propostas Vencidas
- [ ] Criar regra: proposta vencendo em 3 dias
- [ ] Condição: `proposal.valid_until < NOW() + 3 days` e `status = 'sent'`
- [ ] Ação: notificar vendedor + criar tarefa urgente
- [ ] Ação: enviar email ao cliente sobre vencimento
- [ ] Testar alertas de vencimento

#### 3.3 Tarefas Overdue
- [ ] Criar regra: tarefa vencida
- [ ] Condição: `activity.due_date < NOW()` e `completed = false`
- [ ] Ação: criar notificação urgente
- [ ] Ação: atualizar prioridade da tarefa
- [ ] Ação: escalar para manager se > 2 dias
- [ ] Testar detecção de overdue

---

### ✅ FASE 4: TEMPLATES DE RESPOSTA (Dia 4-5)

#### 4.1 Email Templates Pré-configurados
- [ ] Criar template: "Bem-vindo - Novo Lead"
- [ ] Criar template: "Follow-up - Após 3 dias"
- [ ] Criar template: "Proposta Enviada"
- [ ] Criar template: "Lembrete - Proposta Vencendo"
- [ ] Adicionar variáveis dinâmicas em todos
- [ ] Testar templates

#### 4.2 WhatsApp Quick Replies
- [ ] Verificar/criar tabela `whatsapp_quick_replies`
- [ ] Criar quick replies básicos:
  - "Olá, obrigado pelo contato!"
  - "Vou verificar e retorno em breve"
  - "Proposta enviada, aguardo retorno"
- [ ] Integrar com Edge Function `sdr-send-message`
- [ ] Testar envio de quick replies

#### 4.3 Sistema de Variáveis
- [ ] Implementar substituição de variáveis:
  - `{{lead.name}}`, `{{lead.email}}`, `{{lead.company_name}}`
  - `{{today}}`, `{{proposal.valid_until}}`
  - `{{tenant.name}}`
- [ ] Criar função `replaceVariables(template, data)`
- [ ] Preview de template antes de enviar
- [ ] Testar todas as variáveis

---

### ✅ FASE 5: INTERFACE DE GERENCIAMENTO (Dia 5-7)

#### 5.1 Migrar Componentes do Olinda
- [ ] Copiar `AutomationRulesManager.tsx` para `src/modules/crm/components/automations/`
- [ ] Adaptar para multi-tenant (adicionar `tenant_id` em queries)
- [ ] Copiar `CreateAutomationRuleDialog.tsx`
- [ ] Adaptar para multi-tenant
- [ ] Testar componentes migrados

#### 5.2 Página de Automações Completa
- [ ] Atualizar `src/modules/crm/pages/Automations.tsx`
- [ ] Integrar `AutomationRulesManager`
- [ ] Adicionar filtros (ativas/inativas, tipo de trigger)
- [ ] Adicionar busca de regras
- [ ] Testar página completa

#### 5.3 Logs de Execução
- [ ] Criar componente `AutomationLogs.tsx`
- [ ] Listar execuções com filtros
- [ ] Mostrar status (success, error, skipped)
- [ ] Mostrar detalhes de cada execução
- [ ] Botão para re-executar execuções com erro
- [ ] Testar visualização de logs

---

## 🗄️ MIGRAÇÕES SQL NECESSÁRIAS

### Migration: `20250122000006_crm_automations_infrastructure.sql`

```sql
-- ============================================
-- REMINDERS (Lembretes Agendados)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL, -- follow_up, proposal_expiry, task_overdue, custom
  reminder_date TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  
  -- Ações
  action_type TEXT NOT NULL, -- create_task, send_email, send_notification, send_whatsapp
  action_config JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, sent, cancelled
  sent_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_tenant_id ON public.reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON public.reminders(tenant_id, reminder_date) WHERE status = 'pending';

-- RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders from their tenant"
  ON public.reminders FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage reminders in their tenant"
  ON public.reminders FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- WHATSAPP QUICK REPLIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT, -- greeting, follow_up, proposal, closing
  
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_tenant_id ON public.whatsapp_quick_replies(tenant_id);

-- RLS
ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quick replies from their tenant"
  ON public.whatsapp_quick_replies FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can manage quick replies in their tenant"
  ON public.whatsapp_quick_replies FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ============================================
-- TRIGGERS PARA MUDANÇAS DE ESTÁGIO
-- ============================================

-- Função para notificar mudança de estágio de lead
CREATE OR REPLACE FUNCTION public.notify_lead_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notificar apenas se o estágio realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Inserir na fila de automações (via pg_notify ou tabela de fila)
    PERFORM pg_notify('lead_stage_change', json_build_object(
      'lead_id', NEW.id,
      'tenant_id', NEW.tenant_id,
      'old_status', OLD.status,
      'new_status', NEW.status
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para leads
DROP TRIGGER IF EXISTS trigger_notify_lead_stage_change ON public.leads;
CREATE TRIGGER trigger_notify_lead_stage_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_lead_stage_change();

-- Função para notificar mudança de estágio de deal
CREATE OR REPLACE FUNCTION public.notify_deal_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    PERFORM pg_notify('deal_stage_change', json_build_object(
      'deal_id', NEW.id,
      'tenant_id', NEW.tenant_id,
      'old_stage', OLD.stage,
      'new_stage', NEW.stage
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para deals
DROP TRIGGER IF EXISTS trigger_notify_deal_stage_change ON public.deals;
CREATE TRIGGER trigger_notify_deal_stage_change
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION public.notify_deal_stage_change();

-- ============================================
-- TEMPLATES DE EMAIL PRÉ-CONFIGURADOS
-- ============================================

-- Template: Bem-vindo - Novo Lead
INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
SELECT 
  t.id,
  'Bem-vindo - Novo Lead',
  'Bem-vindo, {{lead.name}}!',
  'Olá {{lead.name}},

Obrigado pelo seu interesse! Estamos felizes em ter você como nosso lead.

Em breve entraremos em contato para conversarmos sobre como podemos ajudar a {{lead.company_name}}.

Atenciosamente,
Equipe {{tenant.name}}',
  'welcome',
  true
FROM public.tenants t
ON CONFLICT DO NOTHING;

-- Template: Follow-up - Após 3 dias
INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
SELECT 
  t.id,
  'Follow-up - Após 3 dias',
  'Seguindo sobre nossa conversa - {{lead.company_name}}',
  'Olá {{lead.name}},

Espero que esteja bem! Gostaria de saber se há alguma dúvida sobre nossa proposta para a {{lead.company_name}}.

Estou à disposição para conversarmos.

Atenciosamente,
{{sender.name}}',
  'follow_up',
  true
FROM public.tenants t
ON CONFLICT DO NOTHING;

-- Template: Proposta Enviada
INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
SELECT 
  t.id,
  'Proposta Enviada',
  'Proposta Comercial - {{proposal.proposal_number}}',
  'Olá {{lead.name}},

Segue em anexo nossa proposta comercial para a {{lead.company_name}}.

Proposta: {{proposal.proposal_number}}
Valor: R$ {{proposal.final_price}}
Validade: {{proposal.valid_until}}

Aguardo seu retorno.

Atenciosamente,
{{sender.name}}',
  'proposal',
  true
FROM public.tenants t
ON CONFLICT DO NOTHING;

-- Template: Lembrete - Proposta Vencendo
INSERT INTO public.email_templates (tenant_id, name, subject, body, category, is_active)
SELECT 
  t.id,
  'Lembrete - Proposta Vencendo',
  'Lembrete: Proposta {{proposal.proposal_number}} vence em breve',
  'Olá {{lead.name}},

Gostaria de lembrar que nossa proposta {{proposal.proposal_number}} vence em {{days_until_expiry}} dias.

Valor: R$ {{proposal.final_price}}
Validade: {{proposal.valid_until}}

Se tiver alguma dúvida ou quiser negociar, estou à disposição.

Atenciosamente,
{{sender.name}}',
  'reminder',
  true
FROM public.tenants t
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.reminders IS 'Lembretes agendados para automações';
COMMENT ON TABLE public.whatsapp_quick_replies IS 'Respostas rápidas para WhatsApp';
```

---

## 🔧 EDGE FUNCTIONS A CRIAR

### 1. `crm-automation-runner/index.ts`

```typescript
// Executa automações em background
// Trigger: Cron (a cada 5 minutos)
// Busca regras ativas → Verifica condições → Executa ações → Registra logs
```

### 2. `crm-reminder-processor/index.ts`

```typescript
// Processa lembretes agendados
// Trigger: Cron (a cada hora)
// Busca lembretes vencidos → Cria notificações → Envia emails/SMS
```

---

## 📊 MÉTRICAS DE SUCESSO

- ✅ **100%** das mudanças de estágio geram ações automáticas (quando configurado)
- ✅ **90%** redução em tarefas manuais de follow-up
- ✅ **80%** de propostas vencidas detectadas automaticamente
- ✅ **70%** de tarefas overdue resolvidas antes de escalar

---

## 🚀 ORDEM DE EXECUÇÃO

1. **Dia 1:** Criar migrations SQL + Edge Functions base
2. **Dia 2:** Implementar triggers por estágio
3. **Dia 3:** Implementar lembretes inteligentes
4. **Dia 4:** Criar templates de resposta
5. **Dia 5-7:** Migrar e adaptar componentes do Olinda

---

**Status:** 🟢 PLANO COMPLETO - PRONTO PARA IMPLEMENTAÇÃO

