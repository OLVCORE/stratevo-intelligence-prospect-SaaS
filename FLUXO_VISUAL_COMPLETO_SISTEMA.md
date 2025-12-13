# 🗺️ FLUXO VISUAL COMPLETO DO SISTEMA - STRATEVO ONE

## 📊 DIAGRAMA DE ALTO NÍVEL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STRATEVO ONE - SALES MACHINE                         │
│                  Plataforma Completa de Prospecção B2B                  │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────┐
                    │   USUÁRIO FINAL (SDR/Vendedor)│
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    INTERFACE FRONTEND       │
                    │  (React Components)        │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    SUPABASE RPC CALLS       │
                    │  (Funções SQL)              │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    BANCO DE DADOS (PostgreSQL)│
                    │  (Tabelas + Triggers)        │
                    └─────────────────────────────┘
```

---

## 🔄 FLUXO COMPLETO: DO UPLOAD À VENDA

### **ETAPA 1: IMPORTAÇÃO E QUALIFICAÇÃO**

```
┌─────────────────────────────────────────────────────────────┐
│                    ETAPA 1: DADOS BRUTOS                     │
└─────────────────────────────────────────────────────────────┘

USUÁRIO:
  📥 Faz upload de planilha (100 empresas)
  ✅ Define source_name: "Campanha LinkedIn Q1 2025"

SISTEMA:
  ✅ Insere em prospecting_candidates
  ✅ Gera source_batch_id (UUID único)
  ✅ Salva source_name
  ✅ Status: pending

RESULTADO:
  → 100 empresas em "Motor de Qualificação"
```

```
┌─────────────────────────────────────────────────────────────┐
│              ETAPA 2: MOTOR DE QUALIFICAÇÃO                  │
└─────────────────────────────────────────────────────────────┘

USUÁRIO:
  🔍 Seleciona lote de importação
  🎯 Escolhe ICP: "Empresas Tech 50-200 funcionários"
  ▶️ Clica "Rodar Qualificação"

SISTEMA:
  ✅ Executa process_qualification_job_sniper()
  ✅ Compara cada empresa com ICP
  ✅ Calcula fit_score (0-100)
  ✅ Atribui grade (A, B, C, D)
  ✅ Insere em qualified_prospects

RESULTADO:
  → 60 empresas qualificadas (fit_score >= 70)
  → 40 empresas não qualificadas
  → Distribuição: 15 A, 25 B, 15 C, 5 D
```

```
┌─────────────────────────────────────────────────────────────┐
│            ETAPA 3: ESTOQUE QUALIFICADO                      │
└─────────────────────────────────────────────────────────────┘

SISTEMA:
  ✅ calculate_purchase_intent_score() executada
  ✅ Analisa sinais de mercado
  ✅ Calcula score (0-100)

USUÁRIO VÊ:
  📊 Lista de 60 empresas qualificadas
  🔥 Purchase Intent Badge:
     • 20 Hot (70+) - Prioridade máxima
     • 25 Warm (40-69) - Monitorar
     • 15 Cold (0-39) - Nutrir

USUÁRIO:
  ✅ Seleciona 50 empresas (Grade A e B)
  📤 Clica "Enviar para Banco de Empresas"

RESULTADO:
  → 50 empresas na "Base de Empresas"
  → Disponíveis para análise ICP
```

---

### **ETAPA 2: ANÁLISE E APROVAÇÃO**

```
┌─────────────────────────────────────────────────────────────┐
│              ETAPA 4: QUARENTENA ICP                        │
└─────────────────────────────────────────────────────────────┘

SISTEMA:
  ✅ Empresas aparecem automaticamente
  ✅ calculate_purchase_intent_score() atualiza scores
  ✅ Badge visual exibido

USUÁRIO VÊ:
  📋 Lista de empresas na quarentena
  🔥 Purchase Intent Score: 72 (Hot)
  📊 ICP Score: 85
  🌡️ Temperatura: Hot
  ✅ Status: Pendente análise

USUÁRIO AÇÕES:
  1. 🔍 Enriquece com Receita Federal
  2. 🔍 Enriquece com Apollo (contatos)
  3. 🔍 Enriquece 360° (completo)
  4. 🎯 Roda MC8 (matching produtos)
  5. 📊 Ver Relatório Executivo

USUÁRIO DECIDE:
  ✅ Aprovar 20 empresas (Hot + ICP Score alto)
  ❌ Rejeitar 5 empresas (Cold + ICP Score baixo)
  🗑️ Deletar 2 empresas (duplicadas)

RESULTADO:
  → 20 empresas aprovadas
  → 5 empresas rejeitadas (com motivo)
  → 2 empresas deletadas
```

```
┌─────────────────────────────────────────────────────────────┐
│          ETAPA 5: APROVAÇÃO → DEAL CREATION                 │
└─────────────────────────────────────────────────────────────┘

USUÁRIO:
  ✅ Clica "Aprovar" em 20 empresas

SISTEMA EXECUTA:
  ✅ approve_quarantine_to_crm() chamada via RPC
  
  PROCESSO INTERNO:
    1. Busca empresa em companies (por CNPJ)
       └─→ Se não existe: CRIA empresa
    
    2. CRIA deal em deals:
       ├─→ company_id vinculado
       ├─→ probability = 40% (ICP score >= 85)
       ├─→ priority = high (temperatura = hot)
       ├─→ stage = discovery
       └─→ source = quarantine
    
    3. CRIA lead (se houver email/telefone):
       └─→ Vinculado ao deal

RESULTADO:
  → 20 DEALS CRIADOS AUTOMATICAMENTE
  → 20 empresas em "Leads Aprovados"
  → 20 deals no Pipeline (estágio Discovery)
```

---

### **ETAPA 3: PIPELINE E HANDOFF**

```
┌─────────────────────────────────────────────────────────────┐
│            ETAPA 6: PIPELINE DE VENDAS                      │
└─────────────────────────────────────────────────────────────┘

SISTEMA:
  ✅ calculate_deal_score() executada automaticamente
  ✅ calculate_deal_risk_score() executada automaticamente
  ✅ Scores salvos em deal_scores e deal_risk_scores

USUÁRIO VÊ:
  📊 Kanban Board com 20 deals
  🔥 Purchase Intent Score em cada deal
  📈 Deal Score: 65/100
  ⚠️ Risk Score: 20/100 (baixo risco)
  💰 Valor total: R$ 2.000.000

USUÁRIO:
  📤 Move 10 deals para estágio "Qualification"

RESULTADO:
  → 10 deals em Discovery
  → 10 deals em Qualification
```

```
┌─────────────────────────────────────────────────────────────┐
│        ETAPA 7: HANDOFF AUTOMÁTICO SDR → VENDEDOR           │
└─────────────────────────────────────────────────────────────┘

TRIGGER AUTOMÁTICO:
  ✅ Detecta: Deal mudou para 'qualification'
  ✅ Executa: assign_sales_rep_to_deal()

PROCESSO INTERNO:
  1. get_available_sales_reps() lista vendedores:
     ├─→ Vendedor A: 5 deals ativos
     ├─→ Vendedor B: 3 deals ativos
     └─→ Vendedor C: 8 deals ativos
  
  2. Seleciona Vendedor B (menor carga - round-robin)
  
  3. Atualiza deal:
     └─→ owner_id = Vendedor B
  
  4. Registra em deal_handoffs:
     ├─→ deal_id
     ├─→ from_user_id = SDR
     ├─→ to_user_id = Vendedor B
     ├─→ handoff_type = auto
     └─→ created_at = now()
  
  5. Notifica Vendedor B

RESULTADO:
  → 10 deals atribuídos automaticamente
  → Vendedor B recebe notificação
  → Histórico de handoff registrado
```

---

### **ETAPA 4: AUTOMAÇÕES E INTELIGÊNCIA**

```
┌─────────────────────────────────────────────────────────────┐
│         ETAPA 8: SMART CADENCES (Otimização)               │
└─────────────────────────────────────────────────────────────┘

USUÁRIO:
  ⚙️ Configura Smart Cadence:
     • Canal: Email → LinkedIn → Call
     • 3 steps com delays

SISTEMA:
  ✅ optimize_cadence_step_timing() executada
  ✅ Analisa histórico de respostas
  ✅ Otimiza delays:
     • Step 1: 24h → 18h (melhor resposta)
     • Step 2: 48h → 36h (melhor resposta)
     • Step 3: 72h → 60h (melhor resposta)

  ✅ calculate_optimal_contact_time() executada
  ✅ Determina melhor horário:
     • Email: 10h (segunda a sexta)
     • LinkedIn: 14h (segunda a sexta)
     • Call: 15h (terça a quinta)

  ✅ personalize_cadence_message() executada
  ✅ Personaliza mensagens:
     • {{contact_name}} → "João"
     • {{company_name}} → "Empresa XYZ"
     • {{industry}} → "Tecnologia"

RESULTADO:
  → Cadência otimizada
  → Timing personalizado
  → Mensagens personalizadas
  → +100% taxa de resposta esperada
```

```
┌─────────────────────────────────────────────────────────────┐
│         ETAPA 9: AI VOICE SDR (Chamadas Automáticas)        │
└─────────────────────────────────────────────────────────────┘

SISTEMA:
  ✅ schedule_voice_call_for_lead() executada
  ✅ Agenda chamadas para leads aprovados

PROCESSO:
  1. Busca leads com Purchase Intent Score >= 70
  2. Valida telefone disponível
  3. Agenda chamada:
     ├─→ agent_id (agente ativo)
     ├─→ phone_number
     ├─→ scheduled_at (horário otimizado)
     └─→ status = queued

  4. Edge Function executa chamada
  5. process_voice_call_result() processa resultado:
     ├─→ Atualiza status do lead
     ├─→ Cria atividade no CRM
     └─→ check_voice_call_handoff_needed() verifica handoff

RESULTADO:
  → 15 chamadas agendadas
  → 10 chamadas completadas
  → 5 leads interessados
  → 3 handoffs para humano
```

```
┌─────────────────────────────────────────────────────────────┐
│    ETAPA 10: CONVERSATION INTELLIGENCE (Análise)            │
└─────────────────────────────────────────────────────────────┘

SISTEMA:
  ✅ Chamada é transcrita
  ✅ analyze_conversation_auto() executada automaticamente

PROCESSO:
  1. calculate_talk_listen_ratio():
     ├─→ Vendedor: 40% (ideal)
     ├─→ Comprador: 60% (ideal)
     └─→ Ratio: 0.67 (bom)

  2. detect_objections_in_transcript():
     ├─→ Objeção: "Preço muito alto"
     ├─→ Confiança: 85%
     └─→ Contexto: "Comparando com concorrente"

  3. update_objection_pattern():
     └─→ Atualiza frequência de objeção "preço"

  4. generate_coaching_card():
     ├─→ Tipo: "Talk-to-Listen Ratio"
     ├─→ Título: "Fale menos, escute mais"
     ├─→ Recomendações: ["Fazer mais perguntas abertas"]
     └─→ Prioridade: medium

RESULTADO:
  → Análise completa da conversa
  → Coaching card gerado
  → Padrão de objeção atualizado
  → Vendedor recebe feedback
```

```
┌─────────────────────────────────────────────────────────────┐
│      ETAPA 11: REVENUE INTELLIGENCE (Previsão)             │
└─────────────────────────────────────────────────────────────┘

SISTEMA:
  ✅ calculate_deal_score() executada automaticamente
  ✅ calculate_deal_risk_score() executada automaticamente
  ✅ ForecastPanel busca revenue_forecasts

USUÁRIO VÊ:
  📊 Forecast para próximos 30/60/90 dias:
     • 30 dias: R$ 500.000 (confiança: 75%)
     • 60 dias: R$ 1.200.000 (confiança: 65%)
     • 90 dias: R$ 2.000.000 (confiança: 55%)

  📈 Deal Scores:
     • Deal A: 85/100 (Alto)
     • Deal B: 72/100 (Médio)
     • Deal C: 45/100 (Baixo)

  ⚠️ Risk Scores:
     • Deal A: 15/100 (Baixo risco)
     • Deal B: 35/100 (Médio risco)
     • Deal C: 70/100 (Alto risco - ação necessária)

  🎯 Next Best Actions:
     • Deal A: "Enviar proposta"
     • Deal B: "Agendar reunião"
     • Deal C: "Reengajar - sem atividade há 30 dias"

RESULTADO:
  → Previsão de receita atualizada
  → Deals priorizados por score
  → Riscos identificados
  → Ações recomendadas
```

---

## 🔄 CICLO COMPLETO AUTOMATIZADO (VISÃO GERAL)

```
                    ┌─────────────────────┐
                    │  1. UPLOAD          │
                    │  📥 100 empresas    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  2. QUALIFICAÇÃO    │
                    │  🔍 ICP Matching    │
                    │  ✅ 60 qualificadas │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  3. ESTOQUE         │
                    │  📦 Purchase Intent  │
                    │  🔥 20 Hot Leads     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  4. QUARENTENA      │
                    │  🛡️ Enriquecimento  │
                    │  ✅ 20 aprovadas    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  5. DEAL CREATION   │
                    │  🤖 AUTO: 20 deals  │
                    │  ✅ company_id link  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  6. PIPELINE        │
                    │  💼 20 deals        │
                    │  📊 Scores calculados│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  7. HANDOFF AUTO    │
                    │  🤝 10 vendedores   │
                    │  ✅ Round-robin     │
                    └──────────┬──────────┘
                               │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ SMART CADENCES│      │ AI VOICE SDR  │      │ CONVERSATION  │
│ ⚡ Otimiza    │      │ 📞 Agenda     │      │ 🧠 Analisa    │
│   timing      │      │   chamadas    │      │   calls       │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  REVENUE INTELLIGENCE │
                    │  📊 Forecast          │
                    │  ⚠️ Risk Scores       │
                    │  🎯 Next Actions      │
                    └───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  RESULTADO FINAL      │
                    │  💰 Mais vendas       │
                    │  🚀 Mais receita      │
                    │  📈 Pipeline saudável │
                    └───────────────────────┘
```

---

## 📊 FUNÇÕES SQL POR ETAPA

### **ETAPA 1-3: Importação → Qualificação → Estoque**
- ✅ `process_qualification_job_sniper()` - Qualifica empresas
- ✅ `calculate_purchase_intent_score()` - Calcula intenção
- ✅ `update_purchase_intent_scores()` - Atualiza scores

### **ETAPA 4-5: Quarentena → Aprovação**
- ✅ `approve_quarantine_to_crm()` - Cria deal automaticamente
- ✅ `calculate_purchase_intent_score()` - Atualiza score

### **ETAPA 6-7: Pipeline → Handoff**
- ✅ `calculate_deal_score()` - Calcula score do deal
- ✅ `calculate_deal_risk_score()` - Calcula risco
- ✅ `assign_sales_rep_to_deal()` - Atribui vendedor
- ✅ `get_available_sales_reps()` - Lista vendedores

### **ETAPA 8: Smart Cadences**
- ✅ `optimize_cadence_step_timing()` - Otimiza timing
- ✅ `calculate_optimal_contact_time()` - Melhor horário
- ✅ `personalize_cadence_message()` - Personaliza mensagem
- ✅ `get_channel_response_rates()` - Taxa de resposta

### **ETAPA 9: AI Voice SDR**
- ✅ `schedule_voice_call_for_lead()` - Agenda chamada
- ✅ `process_voice_call_result()` - Processa resultado
- ✅ `get_voice_call_stats_by_date_range()` - Estatísticas
- ✅ `check_voice_call_handoff_needed()` - Verifica handoff

### **ETAPA 10: Conversation Intelligence**
- ✅ `analyze_conversation_auto()` - Análise completa
- ✅ `calculate_talk_listen_ratio()` - Ratio de fala
- ✅ `detect_objections_in_transcript()` - Detecta objeções
- ✅ `generate_coaching_card()` - Gera coaching

### **ETAPA 11: Revenue Intelligence**
- ✅ `calculate_deal_score()` - Score do deal
- ✅ `calculate_deal_risk_score()` - Risco do deal
- ✅ `update_deal_scores_batch()` - Atualiza em lote
- ✅ Busca `revenue_forecasts` - Previsões

---

## 🎯 RESUMO: 30 FUNÇÕES SQL CONECTADAS

| Microciclo | Funções | Status |
|------------|---------|--------|
| 1. Deal Creation | 1 | ✅ 100% |
| 2. Purchase Intent | 3 | ✅ 100% |
| 3. Handoff | 3 | ✅ 100% |
| 4. Revenue Intelligence | 4 | ✅ 100% |
| 5. Smart Cadences | 6 | ✅ 100% |
| 6. Conversation Intelligence | 7 | ✅ 100% |
| 7. AI Voice SDR | 6 | ✅ 100% |
| **TOTAL** | **30** | **✅ 100%** |

---

**Última Atualização:** 2025-02-13  
**Versão:** 1.0.0  
**Status:** ✅ Completo e Visual

