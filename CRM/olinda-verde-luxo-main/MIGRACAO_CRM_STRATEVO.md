# 🚀 GUIA COMPLETO DE MIGRAÇÃO DO CRM PARA STRATEVO

## 📊 SUMÁRIO EXECUTIVO

Este documento detalha como integrar o CRM completo (Espaço Linda) na plataforma STRATEVO Intelligence 360°, transformando-a em uma solução end-to-end de prospecção e gestão de vendas.

---

## 🎯 ANÁLISE COMPARATIVA

### **STRATEVO Intelligence (Atual)**
- 🔍 Prospecção B2B com IA
- 📊 Busca inteligente por CNPJ/empresas
- 👔 Mapeamento de decisores
- 💻 Análise de tech stack e maturidade digital
- 📈 Sinais de compra
- 📬 **CRM Básico:** Inbox, pipeline simples, automações básicas

### **Seu CRM (Espaço Linda) - Funcionalidades**
- ✅ **Gestão Completa de Leads:** Pipeline visual, scoring IA, priorização
- ✅ **IA 360º:** Análise de timeline, chamadas, emails, WhatsApp, arquivos, notas
- ✅ **Comunicação Integrada:** Email, ligações (Twilio), WhatsApp
- ✅ **Automações Avançadas:** Regras de negócio, triggers, notificações
- ✅ **Propostas & Contratos:** Geração automática, assinatura digital, templates
- ✅ **Gestão Financeira:** Pagamentos, parcelas, eventos confirmados
- ✅ **Performance:** Metas hierárquicas, gamificação, dashboards
- ✅ **Análise Preditiva:** Probabilidade de fechamento, churn risk, ações recomendadas

---

## 🔄 ESTRATÉGIAS DE IMPLEMENTAÇÃO

### **OPÇÃO 1: INTEGRAÇÃO HÍBRIDA (⭐ Recomendada)**

Manter STRATEVO para prospecção inicial e usar seu CRM para gestão completa pós-lead.

**Fluxo de Dados:**
```
┌─────────────────────────────────────────────────────────────┐
│                    STRATEVO (Topo do Funil)                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Busca por empresas (CNPJ, setor, localização)           │
│ 2. Análise de maturidade digital                           │
│ 3. Identificação de decisores                              │
│ 4. Sinais de compra detectados                             │
│ 5. Score de fit do produto                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ API Webhook quando lead qualificado
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              SEU CRM (Meio e Fundo do Funil)                │
├─────────────────────────────────────────────────────────────┤
│ 1. Lead criado automaticamente com dados enriquecidos      │
│ 2. IA 360º analisa e define próximas ações                 │
│ 3. Sequências de contato automatizadas                     │
│ 4. Gestão de relacionamento completa                       │
│ 5. Propostas, negociações, fechamento                      │
│ 6. Gestão financeira e pós-venda                           │
└─────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Mantém poder de prospecção da STRATEVO
- ✅ Adiciona gestão completa sem perder funcionalidades
- ✅ Dados enriquecidos automaticamente
- ✅ Implementação mais rápida (webhook + API)

---

### **OPÇÃO 2: SUBSTITUIÇÃO MODULAR**

Substituir apenas o módulo CRM da STRATEVO mantendo prospecção.

**O que substituir:**

| **STRATEVO (Remover)** | **Seu CRM (Adicionar)** |
|------------------------|-------------------------|
| ❌ Inbox unificado básico | ✅ Sistema completo de comunicação |
| ❌ Pipeline Kanban simples | ✅ Pipeline com IA, scoring, automações |
| ❌ Automações básicas | ✅ Regras de negócio avançadas |
| ❌ Relatórios simples | ✅ Analytics preditivo com IA |
| ❌ Sem gestão financeira | ✅ Propostas, pagamentos, eventos |

**Vantagens:**
- ✅ Interface unificada
- ✅ Experiência consistente
- ✅ Menos sistemas para gerenciar

**Desvantagens:**
- ⚠️ Requer mais trabalho de integração frontend
- ⚠️ Pode quebrar fluxos existentes

---

### **OPÇÃO 3: MÓDULO PARALELO**

Adicionar aba "CRM Avançado" mantendo CRM básico da STRATEVO.

**Estrutura:**
```
STRATEVO Dashboard:
├── 🔍 Busca & Prospecção
├── 📊 Análise de Empresas
├── 💼 Decisores
├── 📬 Inbox (CRM Básico) ← mantém
└── 🚀 CRM Avançado (novo) ← adiciona
    ├── Leads & Pipeline IA
    ├── Propostas & Contratos
    ├── Gestão Financeira
    ├── Performance & Metas
    └── IA & Insights
```

---

## 🛠️ IMPLEMENTAÇÃO - OPÇÃO 1 (INTEGRAÇÃO HÍBRIDA)

### **FASE 1: Preparação do Ambiente (1 dia)**

#### **1.1. Setup do Projeto STRATEVO**
```bash
# Clonar projeto atual do CRM (Espaço Linda)
git clone <seu-repositorio-crm>
cd crm-espacolinda

# Criar novo remix no Lovable
# 1. Abrir Lovable
# 2. Selecionar projeto do CRM
# 3. Settings → Remix this project
# 4. Nome: "STRATEVO CRM Integration"
```

#### **1.2. Configurar Secrets no Novo Projeto**
```
Lovable Cloud → Settings → Secrets:

✅ STRATEVO_API_KEY (obter da STRATEVO)
✅ STRATEVO_WEBHOOK_SECRET (criar novo)
✅ OPENAI_API_KEY (já existe)
✅ TWILIO_* (já existem)
✅ RESEND_API_KEY (já existe)
```

---

### **FASE 2: Criação da API de Integração (2-3 dias)**

#### **2.1. Edge Function: Receber Leads da STRATEVO**

Criar `supabase/functions/stratevo-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StratefoLead {
  empresa: {
    cnpj: string;
    razao_social: string;
    faturamento: number;
    num_funcionarios: number;
    cidade: string;
    estado: string;
  };
  decisores: Array<{
    nome: string;
    cargo: string;
    email: string;
    linkedin: string;
  }>;
  maturidade_digital: {
    score_total: number;
    infraestrutura: number;
    sistemas: number;
    seguranca: number;
  };
  tech_stack: string[];
  sinais_compra: Array<{
    tipo: string;
    descricao: string;
    relevancia: number;
  }>;
  fit_score: number;
  produtos_recomendados: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validar webhook secret
    const webhookSecret = req.headers.get('x-stratevo-secret');
    if (webhookSecret !== Deno.env.get('STRATEVO_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: StratefoLead = await req.json();
    console.log('Lead recebido da STRATEVO:', payload);

    // Criar lead no CRM com dados enriquecidos
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: payload.decisores[0]?.nome || payload.empresa.razao_social,
        email: payload.decisores[0]?.email || `contato@${payload.empresa.cnpj}.com`,
        phone: '', // Preencher se STRATEVO fornecer
        company_name: payload.empresa.razao_social,
        event_type: 'corporativo', // Ajustar conforme negócio
        source: 'stratevo',
        status: 'novo',
        priority: payload.fit_score >= 80 ? 'urgent' : 
                  payload.fit_score >= 60 ? 'high' : 'medium',
        budget: payload.empresa.faturamento * 0.01, // 1% do faturamento
        custom_fields: {
          stratevo_data: {
            cnpj: payload.empresa.cnpj,
            num_funcionarios: payload.empresa.num_funcionarios,
            maturidade_digital: payload.maturidade_digital,
            tech_stack: payload.tech_stack,
            sinais_compra: payload.sinais_compra,
            fit_score: payload.fit_score,
            produtos_recomendados: payload.produtos_recomendados,
          }
        },
        city: payload.empresa.cidade,
        state: payload.empresa.estado,
        country: 'Brasil',
        tags: [
          `fit:${payload.fit_score}`,
          `maturidade:${payload.maturidade_digital.score_total}`,
          ...payload.produtos_recomendados.map(p => `produto:${p}`)
        ],
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // Criar contatos dos decisores
    for (const decisor of payload.decisores) {
      await supabase
        .from('lead_contacts')
        .insert({
          lead_id: lead.id,
          name: decisor.nome,
          email: decisor.email,
          position: decisor.cargo,
          is_primary: payload.decisores[0] === decisor,
        });
    }

    // Criar nota com análise da STRATEVO
    await supabase
      .from('activities')
      .insert({
        lead_id: lead.id,
        type: 'note',
        subject: 'Análise STRATEVO Intelligence',
        description: `
**Fit Score:** ${payload.fit_score}/100

**Maturidade Digital:** ${payload.maturidade_digital.score_total}/10
- Infraestrutura: ${payload.maturidade_digital.infraestrutura}/10
- Sistemas: ${payload.maturidade_digital.sistemas}/10
- Segurança: ${payload.maturidade_digital.seguranca}/10

**Tech Stack:** ${payload.tech_stack.join(', ')}

**Sinais de Compra Detectados:**
${payload.sinais_compra.map(s => `- ${s.tipo}: ${s.descricao}`).join('\n')}

**Produtos Recomendados:**
${payload.produtos_recomendados.map(p => `- ${p}`).join('\n')}
        `.trim(),
      });

    // Triggerar análise IA 360º
    await supabase.functions.invoke('ai-lead-scoring', {
      body: { leadId: lead.id }
    });

    console.log('Lead criado com sucesso:', lead.id);

    return new Response(JSON.stringify({ 
      success: true, 
      lead_id: lead.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao processar webhook STRATEVO:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

#### **2.2. Configurar Webhook na STRATEVO**

```bash
# URL do webhook (após deploy):
https://<seu-projeto-id>.supabase.co/functions/v1/stratevo-webhook

# Headers:
x-stratevo-secret: <STRATEVO_WEBHOOK_SECRET>

# Eventos para enviar:
- lead_qualified
- empresa_analisada
- decisor_identificado
- sinal_compra_detectado
```

---

### **FASE 3: Enriquecimento de Dados (1 dia)**

#### **3.1. Atualizar Tabela de Leads**

Adicionar campos específicos para dados da STRATEVO via migration:

```sql
-- Adicionar colunas para dados STRATEVO
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS num_funcionarios integer,
ADD COLUMN IF NOT EXISTS faturamento_anual numeric,
ADD COLUMN IF NOT EXISTS maturidade_digital_score numeric,
ADD COLUMN IF NOT EXISTS fit_score integer,
ADD COLUMN IF NOT EXISTS tech_stack text[];

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_leads_fit_score ON public.leads(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_maturidade ON public.leads(maturidade_digital_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON public.leads(cnpj);
```

#### **3.2. Criar Vista Enriquecida**

```sql
CREATE OR REPLACE VIEW public.leads_enriched AS
SELECT 
  l.*,
  (l.custom_fields->>'stratevo_data')::jsonb AS stratevo_data,
  COUNT(DISTINCT lc.id) AS num_decisores,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'call') AS num_chamadas,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'email') AS num_emails,
  ala.predicted_probability,
  ala.predicted_close_date,
  ala.churn_risk
FROM public.leads l
LEFT JOIN public.lead_contacts lc ON l.id = lc.lead_id
LEFT JOIN public.activities a ON l.id = a.lead_id
LEFT JOIN public.ai_lead_analysis ala ON l.id = ala.lead_id
GROUP BY l.id, ala.predicted_probability, ala.predicted_close_date, ala.churn_risk;
```

---

### **FASE 4: Interface de Visualização (2-3 dias)**

#### **4.1. Criar Badge de STRATEVO**

`src/components/admin/StratefoDataBadge.tsx`:

```typescript
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Building2, TrendingUp, Shield, Server } from "lucide-react";

interface StratefoDataBadgeProps {
  stratefoData: {
    fit_score: number;
    maturidade_digital: {
      score_total: number;
      infraestrutura: number;
      sistemas: number;
      seguranca: number;
    };
    tech_stack: string[];
    sinais_compra: Array<{
      tipo: string;
      descricao: string;
    }>;
  };
}

export const StratefoDataBadge = ({ stratefoData }: StratefoDataBadgeProps) => {
  const { fit_score, maturidade_digital, tech_stack, sinais_compra } = stratefoData;

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Badge 
          variant={fit_score >= 80 ? "default" : fit_score >= 60 ? "secondary" : "outline"}
          className="cursor-pointer"
        >
          <Building2 className="mr-1 h-3 w-3" />
          STRATEVO: {fit_score}/100
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">Fit Score</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${fit_score}%` }}
                />
              </div>
              <span className="text-sm font-medium">{fit_score}%</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Maturidade Digital</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span>Infra: {maturidade_digital.infraestrutura}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>Sistemas: {maturidade_digital.sistemas}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Segurança: {maturidade_digital.seguranca}/10</span>
              </div>
            </div>
          </div>

          {tech_stack && tech_stack.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Tech Stack</h4>
              <div className="flex flex-wrap gap-1">
                {tech_stack.slice(0, 5).map(tech => (
                  <Badge key={tech} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {tech_stack.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{tech_stack.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {sinais_compra && sinais_compra.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Sinais de Compra</h4>
              <ul className="text-sm space-y-1">
                {sinais_compra.slice(0, 3).map((sinal, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    • {sinal.tipo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
```

#### **4.2. Integrar na LeadsTable**

Adicionar coluna para dados STRATEVO:

```typescript
// src/components/admin/LeadsTable.tsx
import { StratefoDataBadge } from "./StratefoDataBadge";

// Adicionar na renderização da tabela:
{lead.source === 'stratevo' && lead.custom_fields?.stratevo_data && (
  <StratefoDataBadge stratefoData={lead.custom_fields.stratevo_data} />
)}
```

---

### **FASE 5: Automações Inteligentes (2 dias)**

#### **5.1. Regra de Auto-Qualificação**

Criar regra de automação para leads da STRATEVO:

```typescript
// No painel Admin → Automations → Criar Nova Regra

Nome: "Auto-qualificar Leads STRATEVO"
Trigger: "Lead criado"
Condições:
  - source = 'stratevo'
  - fit_score >= 70

Ações:
  1. Atualizar status para "qualificado"
  2. Criar tarefa: "Ligar para decisor principal"
  3. Agendar email de apresentação em 1 hora
  4. Notificar vendedor responsável
```

#### **5.2. Sequência de Cadência Automática**

```typescript
// Sequência para leads STRATEVO de alto fit

Dia 1 (Imediato):
- Email: "Análise personalizada da sua maturidade digital"
- Tarefa: Pesquisar LinkedIn dos decisores

Dia 2 (+24h):
- Ligação: Contato com decisor principal
- WhatsApp: Mensagem de apresentação

Dia 5 (+4 dias):
- Email: Case de sucesso relacionado ao setor
- Tarefa: Enviar proposta preliminar

Dia 8 (+3 dias):
- Ligação: Follow-up da proposta
- Tarefa: Agendar demonstração
```

---

### **FASE 6: Dashboard de Performance (2 dias)**

#### **6.1. Métricas STRATEVO**

Criar componente `src/components/admin/StratefoMetrics.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Target, Zap } from "lucide-react";

export const StratefoMetrics = () => {
  const { data: metrics } = useQuery({
    queryKey: ['stratevo-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('source', 'stratevo');

      if (error) throw error;

      const avgFitScore = data.reduce((acc, l) => acc + (l.fit_score || 0), 0) / data.length;
      const highFitLeads = data.filter(l => l.fit_score >= 80).length;
      const avgMaturidade = data.reduce((acc, l) => 
        acc + (l.maturidade_digital_score || 0), 0) / data.length;

      return {
        totalLeads: data.length,
        avgFitScore: Math.round(avgFitScore),
        highFitLeads,
        avgMaturidade: Math.round(avgMaturidade * 10) / 10,
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Leads STRATEVO
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.totalLeads || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total prospectados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Fit Score Médio
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.avgFitScore || 0}%</div>
          <p className="text-xs text-muted-foreground">
            Qualidade dos leads
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Alto Potencial
          </CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.highFitLeads || 0}</div>
          <p className="text-xs text-muted-foreground">
            Fit score ≥ 80
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Maturidade Média
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.avgMaturidade || 0}/10</div>
          <p className="text-xs text-muted-foreground">
            Maturidade digital
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **Preparação**
- [ ] Criar remix do projeto CRM atual
- [ ] Configurar secrets (STRATEVO_API_KEY, STRATEVO_WEBHOOK_SECRET)
- [ ] Obter credenciais da API STRATEVO
- [ ] Documentar estrutura de dados da STRATEVO

### **Backend**
- [ ] Criar edge function `stratevo-webhook`
- [ ] Implementar validação de webhook secret
- [ ] Mapear dados STRATEVO → CRM
- [ ] Adicionar colunas na tabela `leads`
- [ ] Criar views enriquecidas
- [ ] Testar webhook com dados mock

### **Frontend**
- [ ] Criar componente `StratefoDataBadge`
- [ ] Integrar badge na `LeadsTable`
- [ ] Adicionar filtro por origem "STRATEVO"
- [ ] Criar dashboard de métricas STRATEVO
- [ ] Adicionar indicadores visuais de fit score

### **Automações**
- [ ] Criar regra de auto-qualificação
- [ ] Configurar sequência de cadência
- [ ] Criar templates de email personalizados
- [ ] Configurar notificações para alto fit score

### **Testes**
- [ ] Testar recebimento de webhook
- [ ] Verificar criação de leads
- [ ] Validar dados enriquecidos
- [ ] Testar automações
- [ ] Verificar dashboards

### **Deploy**
- [ ] Deploy do CRM integrado
- [ ] Configurar webhook na STRATEVO
- [ ] Treinar equipe
- [ ] Monitorar primeiros leads

---

## 🎓 TREINAMENTO DA EQUIPE

### **Para SDRs/Vendedores**

**O que muda:**
1. ✅ Leads chegam pré-qualificados da STRATEVO com fit score
2. ✅ Informações de maturidade digital e tech stack disponíveis
3. ✅ Sinais de compra já identificados
4. ✅ Decisores mapeados com contatos

**Como usar:**
- Priorizar leads com fit score ≥ 80
- Usar dados de maturidade digital no pitch
- Mencionar tech stack detectado
- Focar em sinais de compra identificados

### **Para Gestores**

**Novos indicadores:**
- 📊 Taxa de conversão por faixa de fit score
- 📈 Correlação entre maturidade digital e fechamento
- 🎯 ROI dos leads STRATEVO vs outras fontes
- ⚡ Tempo médio de fechamento por origem

---

## 🔗 RECURSOS ADICIONAIS

### **Documentação Técnica**
- [API Docs STRATEVO](#) (solicitar à equipe)
- [Webhook Events](#) (estrutura de payloads)
- [Authentication](#) (API keys e secrets)

### **Suporte**
- **Email:** suporte@stratevo.com
- **Discord:** [Link do servidor]
- **Docs:** https://docs.stratevo.com

---

## 📞 PRÓXIMOS PASSOS

1. **Decisão:** Escolher opção de integração (1, 2 ou 3)
2. **Planning:** Agendar sprint de implementação
3. **Kickoff:** Reunir equipe técnica + produto
4. **Desenvolvimento:** Seguir fases 1-6
5. **Homologação:** Testar em ambiente de staging
6. **Rollout:** Deploy gradual (pilot → full)
7. **Monitoramento:** Acompanhar métricas por 30 dias

---

**Última atualização:** 21/11/2025
**Versão:** 1.0
**Autor:** IA Assistant
**Status:** 📋 Aguardando aprovação
