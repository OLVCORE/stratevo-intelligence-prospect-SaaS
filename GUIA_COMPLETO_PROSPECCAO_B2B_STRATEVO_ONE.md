# 🚀 GUIA COMPLETO DE PROSPECÇÃO B2B - STRATEVO ONE

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Jornada Completa do Usuário](#jornada-completa-do-usuário)
3. [Estágio 1: Importação e Enriquecimento](#estágio-1-importação-e-enriquecimento)
4. [Estágio 2: Motor de Qualificação](#estágio-2-motor-de-qualificação)
5. [Estágio 3: Estoque Qualificado](#estágio-3-estoque-qualificado)
6. [Estágio 4: Quarentena ICP](#estágio-4-quarentena-icp)
7. [Estágio 5: Leads Aprovados](#estágio-5-leads-aprovados)
8. [Estágio 6: Pipeline de Vendas](#estágio-6-pipeline-de-vendas)
9. [Automações e Inteligência](#automações-e-inteligência)
10. [Métricas e KPIs](#métricas-e-kpis)

---

## 🎯 VISÃO GERAL

O **Stratevo One** é uma plataforma completa de prospecção B2B que transforma dados brutos em oportunidades de vendas qualificadas através de 7 microciclos automatizados e inteligentes.

### **Fluxo Completo:**

```
📥 Importação → 🔍 Qualificação → 📦 Estoque → 🛡️ Quarentena → ✅ Aprovação → 💼 Pipeline → 🤖 Automação
```

### **7 Microciclos Implementados:**

1. ✅ **Automação de Deal Creation** - Cria deals automaticamente
2. ✅ **Purchase Intent Scoring** - Detecta intenção de compra
3. ✅ **Handoff Automático SDR → Vendedor** - Transfere leads automaticamente
4. ✅ **Revenue Intelligence** - Previsão de receita e análise de risco
5. ✅ **Smart Cadences** - Sequências otimizadas de contato
6. ✅ **Conversation Intelligence** - Análise de conversas e coaching
7. ✅ **AI Voice SDR** - Chamadas automatizadas com IA

---

## 🗺️ JORNADA COMPLETA DO USUÁRIO

### **PASSO 1: Importação de Empresas**

**Localização:** `Base de Empresas` → Botão "Importar Empresas"

**Ações:**
1. Clique em "Importar Empresas"
2. Selecione o arquivo (CSV, Excel ou Google Sheets)
3. Defina o **Nome da Fonte** (ex: "Campanha LinkedIn Q1 2025")
4. Aguarde o processamento

**O que acontece:**
- ✅ Empresas são inseridas em `prospecting_candidates`
- ✅ `source_batch_id` é gerado automaticamente
- ✅ `source_name` é salvo para rastreabilidade
- ✅ Status inicial: `pending`

**Resultado:**
- Empresas aparecem em **"2.1 Motor de Qualificação"** com status `pending`

---

### **PASSO 2: Motor de Qualificação**

**Localização:** `Motor de Qualificação` (2.1)

**Ações:**
1. Visualize os lotes de importação
2. Selecione um lote (checkbox)
3. Escolha o **ICP** a ser usado para qualificação
4. Clique em **"Rodar Qualificação"**

**O que acontece:**
- ✅ Função `process_qualification_job_sniper()` é executada
- ✅ Empresas são avaliadas contra o ICP selecionado
- ✅ `fit_score` é calculado (0-100)
- ✅ `grade` é atribuída (A, B, C, D)
- ✅ Empresas qualificadas vão para `qualified_prospects`

**Resultado:**
- Empresas qualificadas aparecem em **"2.2 Estoque Qualificado"**

**Filtros Disponíveis:**
- Por lote de importação
- Por status (pending, running, completed, failed)
- Por data de criação

**Ações Adicionais:**
- ✅ **Deletar Lote:** Selecione lotes e clique em "Deletar Selecionado(s)"
- ✅ **Ver Detalhes:** Clique no lote para ver estatísticas

---

### **PASSO 3: Estoque Qualificado**

**Localização:** `Estoque de Empresas Qualificadas` (2.2)

**O que você vê:**
- ✅ Lista de empresas qualificadas
- ✅ **Purchase Intent Score** (badge visual: Hot/Warm/Cold)
- ✅ Fit Score e Grade
- ✅ Website e Website Fit Score
- ✅ Origem (nome da fonte de importação)

**Ações:**
1. **Filtrar por Grade:** A, B, C, D
2. **Ordenar por:** Fit Score, Purchase Intent, Data
3. **Enviar para Banco de Empresas:** Selecione empresas e clique em "Enviar para Banco"

**O que acontece:**
- ✅ Empresas são movidas para `companies` (Base de Empresas)
- ✅ `pipeline_status` muda para `qualified`
- ✅ Empresas ficam disponíveis para análise ICP

**Resultado:**
- Empresas aparecem em **"3. Base de Empresas"**

---

### **PASSO 4: Quarentena ICP**

**Localização:** `Quarentena ICP` (4)

**O que você vê:**
- ✅ Empresas analisadas pelo ICP
- ✅ **ICP Score** (0-100)
- ✅ **Temperatura** (Hot/Warm/Cold)
- ✅ **Purchase Intent Score** (badge visual)
- ✅ Status de enriquecimento
- ✅ Evidências TOTVS (se cliente)

**Ações Disponíveis:**

#### **4.1 Enriquecimento:**
- ✅ **Enriquecer Receita:** Busca dados da Receita Federal
- ✅ **Enriquecer Apollo:** Busca contatos e dados da Apollo
- ✅ **Enriquecimento 360°:** Enriquecimento completo
- ✅ **Verificar TOTVS:** Verifica se é cliente TOTVS

#### **4.2 Análise:**
- ✅ **Rodar MC8:** Análise de matching com produtos
- ✅ **Ver Relatório Executivo:** Relatório completo da empresa
- ✅ **Expandir Card:** Ver detalhes completos

#### **4.3 Decisão:**
- ✅ **Aprovar:** Empresa vai para "Leads Aprovados"
  - **O que acontece:**
    - ✅ Função `approve_quarantine_to_crm()` é executada
    - ✅ **Deal é criado automaticamente** em `deals`
    - ✅ Lead é criado (se houver email/telefone)
    - ✅ Empresa é vinculada ao deal via `company_id`
    - ✅ Probabilidade e prioridade são calculadas automaticamente
- ✅ **Rejeitar:** Empresa é descartada (com motivo)
- ✅ **Deletar:** Remove da quarentena

**Filtros Disponíveis:**
- Por temperatura (Hot/Warm/Cold)
- Por status (pendente/analisada/aprovada/descartada)
- Por ICP Score
- Por Purchase Intent Score
- Por origem
- Por setor/UF

**Resultado:**
- Empresas aprovadas aparecem em **"5. Leads Aprovados"**
- Deals criados aparecem em **"6. Pipeline de Vendas"**

---

### **PASSO 5: Leads Aprovados**

**Localização:** `Leads Aprovados` (5)

**O que você vê:**
- ✅ Empresas aprovadas da quarentena
- ✅ **Purchase Intent Score** (badge visual)
- ✅ ICP Score e Temperatura
- ✅ Status de enriquecimento
- ✅ Deal vinculado (se criado)

**Ações:**
1. **Enviar para Pipeline:** Cria deals no estágio "Discovery"
2. **Ver Detalhes:** Expandir card da empresa
3. **Enriquecer:** Adicionar mais dados (Apollo, Receita, etc.)

**O que acontece:**
- ✅ Deals são criados em `deals` ou `sdr_deals`
- ✅ Estágio inicial: `discovery`
- ✅ Empresas ficam disponíveis no Pipeline

**Resultado:**
- Deals aparecem em **"6. Pipeline de Vendas"**

---

### **PASSO 6: Pipeline de Vendas**

**Localização:** `Pipeline` (6) ou `SDR Workspace` → Aba "Pipeline"

**O que você vê:**
- ✅ Kanban board com estágios:
  - **Discovery** (Descoberta)
  - **Qualification** (Qualificação)
  - **Proposal** (Proposta)
  - **Negotiation** (Negociação)
  - **Closed Won** (Ganho)
  - **Closed Lost** (Perdido)

**Ações por Estágio:**

#### **6.1 Discovery:**
- ✅ Arrastar deal para "Qualification"
- ✅ Visualizar detalhes do deal
- ✅ Editar informações

#### **6.2 Qualification:**
- ✅ **Botão "Handoff":** Transfere deal para vendedor
  - **O que acontece:**
    - ✅ Função `assign_sales_rep_to_deal()` é executada
    - ✅ Vendedor é atribuído automaticamente (round-robin)
    - ✅ Histórico de handoff é registrado
    - ✅ Notificação é enviada ao vendedor
- ✅ Ver histórico de handoffs
- ✅ Aprovar/Rejeitar handoff manualmente

**Automações Ativas:**
- ✅ **Trigger Automático:** Quando deal muda para 'qualification', vendedor é atribuído automaticamente
- ✅ **Purchase Intent:** Score é atualizado automaticamente quando sinais são detectados
- ✅ **Deal Scoring:** Score do deal é calculado automaticamente

**Métricas Visíveis:**
- ✅ Valor total do pipeline
- ✅ Número de deals por estágio
- ✅ Deals "Hot" (alta prioridade)
- ✅ Deals fechados no mês

**Resultado:**
- Deals movem-se através dos estágios
- Deals fechados geram receita

---

## 🤖 AUTOMAÇÕES E INTELIGÊNCIA

### **1. Purchase Intent Scoring**

**Como Funciona:**
- ✅ Sistema detecta sinais de compra automaticamente:
  - **Expansão:** Empresa está crescendo
  - **Dor:** Problemas detectados
  - **Orçamento:** Sinais de budget disponível
  - **Timing:** Momento ideal para contato
  - **Concorrentes:** Mudanças de fornecedor
- ✅ Score é calculado (0-100) e atualizado automaticamente
- ✅ Badge visual mostra: 🔥 Hot (70+), 💧 Warm (40-69), ❄️ Cold (0-39)

**Onde Aparece:**
- ✅ Estoque Qualificado
- ✅ Quarentena ICP
- ✅ Leads Aprovados
- ✅ Pipeline de Vendas

**Ações Recomendadas:**
- 🔥 **Hot (70+):** Contato imediato prioritário
- 💧 **Warm (40-69):** Monitorar e engajar
- ❄️ **Cold (0-39):** Nutrir com conteúdo

---

### **2. Revenue Intelligence**

**Como Funciona:**
- ✅ `calculate_deal_score()` calcula score do deal automaticamente
- ✅ `calculate_deal_risk_score()` avalia risco do deal
- ✅ `revenue_forecasts` prevê receita futura
- ✅ `next_best_actions` recomenda próximas ações

**Onde Aparece:**
- ✅ SDR Workspace → Aba "Forecast"
- ✅ SDR Workspace → Aba "Analytics"
- ✅ Deal Details → Score e Risco

**Ações Recomendadas:**
- ✅ Seguir recomendações de "Next Best Actions"
- ✅ Monitorar deals de alto risco
- ✅ Ajustar forecast baseado em scores

---

### **3. Smart Cadences**

**Como Funciona:**
- ✅ `calculate_optimal_contact_time()` determina melhor horário
- ✅ `personalize_cadence_message()` personaliza mensagens
- ✅ `optimize_cadence_step_timing()` otimiza timing
- ✅ `record_cadence_response()` registra respostas

**Onde Configurar:**
- ✅ SDR Workspace → Aba "Automations" → "Smart Cadences"
- ✅ CRM → Automations → Aba "Smart Cadences"

**Ações:**
1. Criar cadência multi-canal (Email, LinkedIn, WhatsApp, Call)
2. Definir sequência de passos
3. Sistema otimiza timing automaticamente
4. Personaliza mensagens com dados da empresa

---

### **4. Conversation Intelligence**

**Como Funciona:**
- ✅ `analyze_conversation_auto()` analisa conversas automaticamente
- ✅ `detect_objections_in_transcript()` detecta objeções
- ✅ `generate_coaching_card()` gera recomendações de coaching
- ✅ `calculate_talk_listen_ratio()` calcula ratio de fala

**Onde Aparece:**
- ✅ CRM → Communications → "Conversation Intelligence"
- ✅ Coaching Cards não lidos aparecem no dashboard

**Ações:**
- ✅ Revisar coaching cards
- ✅ Estudar padrões de objeções
- ✅ Melhorar ratio de fala/escuta

---

### **5. AI Voice SDR**

**Como Funciona:**
- ✅ `schedule_voice_call_for_lead()` agenda chamadas
- ✅ `process_voice_call_result()` processa resultados
- ✅ `check_voice_call_handoff_needed()` detecta necessidade de handoff
- ✅ `get_voice_call_stats_by_date_range()` fornece estatísticas

**Onde Configurar:**
- ✅ SDR Workspace → Aba "AI Voice" → "Configuração"
- ✅ Definir agente de voz, script, personalidade

**Ações:**
1. Agendar chamadas para leads
2. Sistema faz chamadas automaticamente
3. Resultados são processados automaticamente
4. Handoff é detectado quando necessário

---

## 📊 MÉTRICAS E KPIs

### **Métricas por Estágio:**

#### **Importação:**
- Total de empresas importadas
- Taxa de sucesso de importação
- Empresas duplicadas detectadas

#### **Qualificação:**
- Taxa de qualificação (empresas qualificadas / total importadas)
- Distribuição de Grades (A, B, C, D)
- Tempo médio de qualificação

#### **Quarentena:**
- Taxa de aprovação (aprovadas / total analisadas)
- Taxa de descarte (descartadas / total analisadas)
- ICP Score médio
- Purchase Intent Score médio

#### **Pipeline:**
- Valor total do pipeline
- Número de deals por estágio
- Taxa de conversão por estágio
- Tempo médio em cada estágio
- Win rate (deals ganhos / total)

#### **Automações:**
- Taxa de resposta de cadências
- Taxa de qualificação de chamadas IA
- Número de coaching cards gerados
- Taxa de handoff automático

---

## 🎯 MELHORES PRÁTICAS

### **1. Importação:**
- ✅ Use nomes descritivos para fontes (ex: "Campanha LinkedIn Q1 2025")
- ✅ Valide dados antes de importar (CNPJ, nome, setor)
- ✅ Importe em lotes menores (até 1000 empresas por vez)

### **2. Qualificação:**
- ✅ Escolha o ICP correto para cada lote
- ✅ Revise empresas com Grade A e B
- ✅ Delete lotes antigos que não serão usados

### **3. Quarentena:**
- ✅ Priorize empresas com Purchase Intent Score alto (70+)
- ✅ Enriqueça empresas antes de aprovar
- ✅ Use MC8 para matching com produtos
- ✅ Aprove apenas empresas com dados completos

### **4. Pipeline:**
- ✅ Monitore deals em risco
- ✅ Siga recomendações de "Next Best Actions"
- ✅ Use handoff automático para escalar
- ✅ Atualize estágios regularmente

### **5. Automações:**
- ✅ Configure Smart Cadences para diferentes perfis
- ✅ Revise coaching cards regularmente
- ✅ Monitore estatísticas de chamadas IA
- ✅ Ajuste timing de cadências baseado em performance

---

## 🔗 INTEGRAÇÕES E CONEXÕES

### **Conexões Automáticas:**

1. **Importação → Qualificação:**
   - ✅ Empresas importadas aparecem automaticamente no Motor de Qualificação

2. **Qualificação → Estoque:**
   - ✅ Empresas qualificadas aparecem automaticamente no Estoque

3. **Estoque → Base de Empresas:**
   - ✅ Ao enviar para Banco, empresas aparecem na Base

4. **Quarentena → Aprovação:**
   - ✅ Ao aprovar, deal é criado automaticamente
   - ✅ Lead é criado (se houver contato)

5. **Aprovação → Pipeline:**
   - ✅ Deals aparecem automaticamente no Pipeline

6. **Pipeline → Handoff:**
   - ✅ Ao mover para "Qualification", vendedor é atribuído automaticamente

7. **Purchase Intent → Todas as Páginas:**
   - ✅ Score é calculado e exibido automaticamente

---

## 🚨 TROUBLESHOOTING

### **Problema: Empresas não aparecem após importação**
- ✅ Verifique se o lote foi criado em "Motor de Qualificação"
- ✅ Verifique se há erros no console do navegador
- ✅ Confirme que o tenant_id está correto

### **Problema: Qualificação não roda**
- ✅ Verifique se um ICP foi selecionado
- ✅ Verifique se há empresas no lote
- ✅ Verifique logs do Supabase

### **Problema: Purchase Intent Score não aparece**
- ✅ Verifique se a migration foi aplicada
- ✅ Verifique se há sinais detectados
- ✅ Execute `update_purchase_intent_scores()` manualmente

### **Problema: Deal não é criado ao aprovar**
- ✅ Verifique se a função `approve_quarantine_to_crm()` está funcionando
- ✅ Verifique se há CNPJ válido
- ✅ Verifique logs do Supabase

---

## 📚 RECURSOS ADICIONAIS

### **Documentação Técnica:**
- `AUDITORIA_COMPLETA_INTEGRACAO_BACKEND_FRONTEND.md` - Auditoria técnica completa
- `RESUMO_FINAL_MICROCICLOS_IMPLEMENTADOS.md` - Resumo dos microciclos
- `ANALISE_COMPLETA_PLATAFORMA_B2B.md` - Análise completa da plataforma

### **Migrations Aplicadas:**
- `20250213000003_auto_create_deal_on_approval.sql` - Automação de Deal Creation
- `20250213000004_purchase_intent_scoring.sql` - Purchase Intent Scoring
- `20250213000005_auto_handoff_sdr.sql` - Handoff Automático
- `20250213000006_revenue_intelligence.sql` - Revenue Intelligence
- `20250213000007_smart_cadences.sql` - Smart Cadences
- `20250213000008_conversation_intelligence.sql` - Conversation Intelligence
- `20250213000009_ai_voice_sdr_functions.sql` - AI Voice SDR

---

## ✅ CHECKLIST DE USO

### **Para Começar:**
- [ ] Importar primeira planilha de empresas
- [ ] Criar/Configurar ICP
- [ ] Rodar primeira qualificação
- [ ] Revisar Estoque Qualificado
- [ ] Enviar empresas para Base

### **Para Operar:**
- [ ] Revisar Quarentena diariamente
- [ ] Aprovar empresas qualificadas
- [ ] Monitorar Pipeline semanalmente
- [ ] Revisar coaching cards
- [ ] Ajustar cadências baseado em performance

### **Para Otimizar:**
- [ ] Analisar métricas mensalmente
- [ ] Ajustar ICPs baseado em resultados
- [ ] Otimizar timing de cadências
- [ ] Melhorar scripts de chamadas IA
- [ ] Revisar e melhorar processos

---

---

## 🔧 FUNÇÕES SQL DOS 7 MICROCICLOS - GUIA COMPLETO

### **📋 TODAS AS FUNÇÕES CRIADAS E COMO USAR:**

---

### **MICROCICLO 1: Automação de Deal Creation**

#### **Função Principal:**
```sql
approve_quarantine_to_crm(
  p_quarantine_id UUID,
  p_tenant_id UUID
)
```

**O que faz:**
- ✅ Cria deal automaticamente quando lead é aprovado
- ✅ Busca ou cria empresa em `companies`
- ✅ Vincula deal à empresa via `company_id`
- ✅ Calcula probabilidade baseado em ICP score
- ✅ Calcula prioridade baseado em temperatura

**Quando é chamada:**
- ✅ Automaticamente ao clicar "Aprovar" em Quarentena ICP
- ✅ Via RPC: `supabase.rpc('approve_quarantine_to_crm', { p_quarantine_id, p_tenant_id })`

**Onde aparece:**
- ✅ Pipeline de Vendas (deals criados)
- ✅ SDR Workspace (kanban board)

---

### **MICROCICLO 2: Purchase Intent Scoring**

#### **Funções Criadas:**

**1. `calculate_purchase_intent_score()`**
```sql
calculate_purchase_intent_score(
  p_tenant_id UUID DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL
) RETURNS INTEGER
```

**O que faz:**
- ✅ Calcula score (0-100) baseado em sinais de compra
- ✅ Analisa sinais: expansão, dor, orçamento, timing, concorrentes
- ✅ Aplica pesos diferentes por tipo de sinal
- ✅ Bônus de recência (sinais recentes valem mais)

**2. `update_purchase_intent_scores()`**
```sql
update_purchase_intent_scores(p_tenant_id UUID)
```

**O que faz:**
- ✅ Atualiza scores em todas as tabelas relevantes
- ✅ Processa `qualified_prospects`, `companies`, `icp_analysis_results`
- ✅ Executa em lote para performance

**3. `insert_purchase_intent_signal()`**
```sql
insert_purchase_intent_signal(
  p_tenant_id UUID,
  p_cnpj TEXT,
  p_signal_type TEXT,
  p_signal_strength INTEGER,
  p_description TEXT
)
```

**O que faz:**
- ✅ Insere novo sinal de compra
- ✅ Atualiza score automaticamente
- ✅ Registra timestamp

**Quando são chamadas:**
- ✅ Automaticamente quando sinais são detectados
- ✅ Manualmente via RPC para atualizar scores
- ✅ Via Edge Function que detecta sinais de mercado

**Onde aparece:**
- ✅ Estoque Qualificado (badge visual)
- ✅ Quarentena ICP (badge visual)
- ✅ Leads Aprovados (badge visual)
- ✅ Company Detail Page (badge visual)

---

### **MICROCICLO 3: Handoff Automático SDR → Vendedor**

#### **Funções Criadas:**

**1. `assign_sales_rep_to_deal()`**
```sql
assign_sales_rep_to_deal(
  p_deal_id UUID,
  p_tenant_id UUID,
  p_handoff_type TEXT DEFAULT 'auto'
) RETURNS TABLE (success BOOLEAN, message TEXT, handoff_id UUID, assigned_to UUID)
```

**O que faz:**
- ✅ Atribui vendedor ao deal usando round-robin
- ✅ Registra histórico de handoff
- ✅ Notifica vendedor
- ✅ Atualiza deal com novo owner

**2. `get_available_sales_reps()`**
```sql
get_available_sales_reps(p_tenant_id UUID)
RETURNS TABLE (user_id UUID, email TEXT, name TEXT, active_deals_count BIGINT)
```

**O que faz:**
- ✅ Lista vendedores disponíveis
- ✅ Calcula carga de trabalho (deals ativos)
- ✅ Ordena por menor carga (round-robin)

**3. `get_deal_handoff_history()`**
```sql
get_deal_handoff_history(p_deal_id UUID, p_tenant_id UUID)
RETURNS TABLE (...)
```

**O que faz:**
- ✅ Retorna histórico completo de handoffs
- ✅ Mostra quem transferiu, quando e motivo

**Quando são chamadas:**
- ✅ **Automaticamente** via trigger quando deal muda para 'qualification'
- ✅ Manualmente via botão "Handoff" no Pipeline
- ✅ Via RPC: `supabase.rpc('assign_sales_rep_to_deal', { p_deal_id, p_tenant_id })`

**Onde aparece:**
- ✅ Pipeline (botão Handoff)
- ✅ HandoffModal (histórico e ações)

---

### **MICROCICLO 4: Revenue Intelligence**

#### **Funções Criadas:**

**1. `calculate_deal_score()`**
```sql
calculate_deal_score(
  p_deal_id UUID,
  p_tenant_id UUID
) RETURNS INTEGER
```

**O que faz:**
- ✅ Calcula score (0-100) baseado em:
  - Valor do deal (0-25 pontos)
  - Probabilidade (0-25 pontos)
  - Velocidade (0-20 pontos)
  - Engajamento (0-15 pontos)
  - Fit com ICP (0-15 pontos)

**2. `calculate_deal_risk_score()`**
```sql
calculate_deal_risk_score(
  p_deal_id UUID,
  p_tenant_id UUID
) RETURNS INTEGER
```

**O que faz:**
- ✅ Calcula risco (0-100) baseado em:
  - Tempo parado no estágio
  - Probabilidade decrescente
  - Falta de atividade
  - Competidores detectados

**3. `update_deal_scores_batch()`**
```sql
update_deal_scores_batch(p_tenant_id UUID)
```

**O que faz:**
- ✅ Atualiza scores de todos os deals
- ✅ Executa em lote para performance
- ✅ Salva em `deal_scores` table

**4. `update_deal_risk_scores_batch()`**
```sql
update_deal_risk_scores_batch(p_tenant_id UUID)
```

**O que faz:**
- ✅ Atualiza risk scores de todos os deals
- ✅ Salva em `deal_risk_scores` table

**Quando são chamadas:**
- ✅ **Automaticamente** via trigger quando deal é atualizado
- ✅ Manualmente via RPC: `supabase.rpc('calculate_deal_score', { p_deal_id, p_tenant_id })`
- ✅ Via componente: DealScoringEngine

**Onde aparece:**
- ✅ ForecastPanel (dados de `revenue_forecasts`)
- ✅ DealScoringEngine (scores calculados)
- ✅ Pipeline (indicadores de risco)

**Tabelas Utilizadas:**
- ✅ `revenue_forecasts` - Previsões de receita
- ✅ `deal_scores` - Scores de deals
- ✅ `deal_risk_scores` - Riscos de deals
- ✅ `pipeline_health_scores` - Health do pipeline
- ✅ `next_best_actions` - Ações recomendadas

---

### **MICROCICLO 5: Smart Cadences**

#### **Funções Criadas:**

**1. `calculate_optimal_contact_time()`**
```sql
calculate_optimal_contact_time(
  p_tenant_id UUID,
  p_channel TEXT,
  p_cadence_id UUID DEFAULT NULL
) RETURNS TABLE (optimal_hour INTEGER, optimal_day INTEGER, response_rate NUMERIC, average_response_time_hours NUMERIC)
```

**O que faz:**
- ✅ Analisa histórico de respostas por horário
- ✅ Identifica melhor hora e dia da semana
- ✅ Calcula taxa de resposta esperada
- ✅ Baseado em últimos 90 dias

**2. `personalize_cadence_message()`**
```sql
personalize_cadence_message(
  p_template TEXT,
  p_tenant_id UUID,
  p_lead_id UUID DEFAULT NULL,
  p_deal_id UUID DEFAULT NULL
) RETURNS TEXT
```

**O que faz:**
- ✅ Substitui variáveis no template
- ✅ Usa dados do lead/deal/empresa
- ✅ Personaliza: `{{contact_name}}`, `{{company_name}}`, `{{industry}}`, etc.

**3. `optimize_cadence_step_timing()`**
```sql
optimize_cadence_step_timing(
  p_step_id UUID,
  p_tenant_id UUID
) RETURNS TABLE (optimal_delay_hours INTEGER, expected_improvement NUMERIC)
```

**O que faz:**
- ✅ Otimiza delay entre steps
- ✅ Calcula melhoria esperada
- ✅ Atualiza `cadence_steps` com timing otimizado

**4. `calculate_next_optimal_time()`**
```sql
calculate_next_optimal_time(
  p_tenant_id UUID,
  p_channel TEXT,
  p_cadence_id UUID DEFAULT NULL
) RETURNS TIMESTAMPTZ
```

**O que faz:**
- ✅ Calcula próximo horário ideal
- ✅ Considera business hours
- ✅ Considera timezone

**5. `record_cadence_response()`**
```sql
record_cadence_response(
  p_tenant_id UUID,
  p_cadence_id UUID,
  p_step_id UUID,
  p_channel TEXT,
  p_sent_at TIMESTAMPTZ,
  p_lead_id UUID DEFAULT NULL,
  p_deal_id UUID DEFAULT NULL,
  p_has_response BOOLEAN DEFAULT false,
  p_response_at TIMESTAMPTZ DEFAULT NULL
)
```

**O que faz:**
- ✅ Registra envio e resposta
- ✅ Armazena em `cadence_response_history`
- ✅ Usado para otimização futura

**6. `get_channel_response_rates()`**
```sql
get_channel_response_rates(
  p_tenant_id UUID,
  p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (channel TEXT, total_sent BIGINT, total_responses BIGINT, avg_response_rate NUMERIC, avg_response_time_hours NUMERIC)
```

**O que faz:**
- ✅ Calcula taxa de resposta por canal
- ✅ Email, LinkedIn, WhatsApp, Call
- ✅ Tempo médio de resposta

**Quando são chamadas:**
- ✅ Via RPC: `supabase.rpc('optimize_cadence_step_timing', { p_step_id, p_tenant_id })`
- ✅ Via componente: CadenceOptimizer
- ✅ Automaticamente quando cadência é executada

**Onde aparece:**
- ✅ CadenceOptimizer (timing otimizado)
- ✅ FollowUpPrioritizer (optimal contact time)
- ✅ CadenceAnalytics (response rates)
- ✅ PersonalizationEngine (mensagens personalizadas)

**Tabelas Utilizadas:**
- ✅ `smart_cadences` - Configurações de cadências
- ✅ `cadence_steps` - Passos da cadência
- ✅ `cadence_executions` - Execuções ativas
- ✅ `cadence_response_history` - Histórico de respostas
- ✅ `cadence_performance` - Métricas agregadas

---

### **MICROCICLO 6: Conversation Intelligence**

#### **Funções Criadas:**

**1. `calculate_talk_listen_ratio()`**
```sql
calculate_talk_listen_ratio(
  p_transcription_id UUID,
  p_tenant_id UUID
) RETURNS TABLE (seller_talk_time INTEGER, buyer_talk_time INTEGER, talk_to_listen_ratio NUMERIC, seller_percentage NUMERIC, buyer_percentage NUMERIC)
```

**O que faz:**
- ✅ Calcula tempo de fala de vendedor vs comprador
- ✅ Calcula ratio (ideal: 40% vendedor, 60% comprador)
- ✅ Identifica se vendedor fala demais

**2. `detect_objections_in_transcript()`**
```sql
detect_objections_in_transcript(
  p_transcription_id UUID,
  p_tenant_id UUID
) RETURNS TABLE (objection_type TEXT, confidence NUMERIC, context TEXT)
```

**O que faz:**
- ✅ Detecta objeções no transcript
- ✅ Tipos: preço, timing, autoridade, necessidade
- ✅ Calcula confiança da detecção

**3. `update_objection_pattern()`**
```sql
update_objection_pattern(
  p_tenant_id UUID,
  p_objection_type TEXT,
  p_resolved BOOLEAN DEFAULT false
)
```

**O que faz:**
- ✅ Atualiza frequência de objeções
- ✅ Calcula taxa de resolução
- ✅ Armazena em `objection_patterns`

**4. `generate_coaching_card()`**
```sql
generate_coaching_card(
  p_tenant_id UUID,
  p_user_id UUID,
  p_conversation_id UUID,
  p_card_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_recommendations JSONB
) RETURNS UUID
```

**O que faz:**
- ✅ Cria card de coaching
- ✅ Vincula à conversa
- ✅ Armazena recomendações

**5. `analyze_conversation_auto()`**
```sql
analyze_conversation_auto(
  p_transcription_id UUID,
  p_tenant_id UUID
)
```

**O que faz:**
- ✅ Análise completa automática:
  - Calcula talk-to-listen ratio
  - Detecta objeções
  - Analisa sentimento
  - Gera coaching cards
  - Atualiza padrões

**6. `get_unread_coaching_cards()`**
```sql
get_unread_coaching_cards(
  p_user_id UUID,
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (...)
```

**O que faz:**
- ✅ Retorna coaching cards não lidos
- ✅ Ordena por prioridade
- ✅ Filtra por usuário

**7. `mark_coaching_card_read()`**
```sql
mark_coaching_card_read(p_card_id UUID, p_user_id UUID)
```

**O que faz:**
- ✅ Marca card como lido
- ✅ Registra timestamp

**Quando são chamadas:**
- ✅ Automaticamente quando transcrição é salva
- ✅ Via Edge Function que processa calls
- ✅ Via componente: ConversationDashboard

**Onde aparece:**
- ✅ ConversationDashboard (análises recentes)
- ✅ CoachingCards (cards não lidos)
- ✅ CallTranscriptionViewer (ratio e objeções)
- ✅ ObjectionPatternsAnalyzer (padrões detectados)

**Tabelas Utilizadas:**
- ✅ `conversation_transcriptions` - Transcrições
- ✅ `conversation_analyses` - Análises completas
- ✅ `coaching_cards` - Cards de coaching
- ✅ `objection_patterns` - Padrões de objeções

---

### **MICROCICLO 7: AI Voice SDR**

#### **Funções Criadas:**

**1. `schedule_voice_call_for_lead()`**
```sql
schedule_voice_call_for_lead(
  p_tenant_id UUID,
  p_lead_id UUID,
  p_agent_id UUID DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
```

**O que faz:**
- ✅ Agenda chamada automática
- ✅ Busca agente ativo se não fornecido
- ✅ Valida telefone do lead
- ✅ Cria registro em `ai_voice_calls`

**2. `process_voice_call_result()`**
```sql
process_voice_call_result(
  p_call_id UUID,
  p_tenant_id UUID,
  p_status TEXT,
  p_transcript TEXT DEFAULT NULL,
  p_sentiment_label TEXT DEFAULT NULL,
  p_qualification_result TEXT DEFAULT NULL,
  p_outcome TEXT DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL
)
```

**O que faz:**
- ✅ Processa resultado da chamada
- ✅ Atualiza status do lead/deal
- ✅ Cria atividade no CRM
- ✅ Atualiza `ai_voice_calls`

**3. `get_pending_voice_calls()`**
```sql
get_pending_voice_calls(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (id UUID, lead_id UUID, deal_id UUID, phone_number TEXT, agent_id UUID, scheduled_at TIMESTAMPTZ)
```

**O que faz:**
- ✅ Retorna chamadas pendentes
- ✅ Filtra por status 'queued'
- ✅ Ordena por prioridade

**4. `get_voice_call_stats_by_date_range()`**
```sql
get_voice_call_stats_by_date_range(
  p_tenant_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (total_calls BIGINT, completed_calls BIGINT, failed_calls BIGINT, no_answer_calls BIGINT, interested_count BIGINT, qualified_count BIGINT, avg_duration_seconds NUMERIC, avg_sentiment_score NUMERIC, total_cost_cents BIGINT)
```

**O que faz:**
- ✅ Calcula estatísticas por período
- ✅ Total, completadas, falhas, sem resposta
- ✅ Taxa de interesse e qualificação
- ✅ Duração média e sentimento
- ✅ Custo total

**5. `check_voice_call_handoff_needed()`**
```sql
check_voice_call_handoff_needed(
  p_call_id UUID,
  p_tenant_id UUID
) RETURNS BOOLEAN
```

**O que faz:**
- ✅ Verifica se handoff humano é necessário
- ✅ Baseado em resultado da chamada
- ✅ Interesse alto = handoff necessário

**6. `schedule_batch_voice_calls()`**
```sql
schedule_batch_voice_calls(
  p_tenant_id UUID,
  p_lead_ids UUID[],
  p_agent_id UUID DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID[]
```

**O que faz:**
- ✅ Agenda múltiplas chamadas
- ✅ Processa em lote
- ✅ Retorna IDs das chamadas criadas

**Quando são chamadas:**
- ✅ Via RPC: `supabase.rpc('schedule_voice_call_for_lead', { p_tenant_id, p_lead_id })`
- ✅ Via componente: VoiceCallManager
- ✅ Automaticamente quando lead é aprovado (se configurado)

**Onde aparece:**
- ✅ VoiceCallManager (chamadas e estatísticas)
- ✅ AIVoiceSDR (botão para iniciar chamada)
- ✅ SDR Workspace (aba AI Voice)

**Tabelas Utilizadas:**
- ✅ `ai_voice_calls` - Chamadas realizadas
- ✅ `ai_voice_agents` - Agentes configurados
- ✅ `ai_voice_scripts` - Scripts de chamada

---

## 🗺️ FLUXO VISUAL COMPLETO DO SISTEMA

### **DIAGRAMA DE FLUXO PRINCIPAL:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    🚀 STRATEVO ONE - FLUXO COMPLETO                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  1. UPLOAD   │  📥 Usuário faz upload de planilha
│  (CSV/Excel) │  ✅ source_batch_id gerado
│              │  ✅ source_name salvo
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ 2. MOTOR QUALIFICAÇÃO │  🔍 Usuário seleciona ICP
│                      │  ✅ process_qualification_job_sniper() executada
│                      │  ✅ fit_score calculado (0-100)
│                      │  ✅ grade atribuída (A, B, C, D)
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 3. ESTOQUE QUALIFICADO│  📦 Empresas qualificadas
│                      │  ✅ Purchase Intent Score exibido
│                      │  ✅ Badge visual (Hot/Warm/Cold)
│                      │  🔄 calculate_purchase_intent_score() atualiza
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 4. QUARENTENA ICP    │  🛡️ Análise detalhada
│                      │  ✅ ICP Score calculado
│                      │  ✅ Purchase Intent Score exibido
│                      │  ✅ Enriquecimento (Receita, Apollo, 360°)
│                      │  ✅ MC8 Match Assessment
└──────┬───────────────┘
       │
       │ [Aprovar]
       ▼
┌──────────────────────┐
│ 5. APROVAÇÃO          │  ✅ approve_quarantine_to_crm() executada
│                      │  ✅ DEAL CRIADO AUTOMATICAMENTE
│                      │  ✅ company_id vinculado
│                      │  ✅ Probabilidade calculada
│                      │  ✅ Prioridade calculada
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 6. PIPELINE DE VENDAS │  💼 Deal aparece no Pipeline
│                      │  ✅ Estágio: Discovery
│                      │  ✅ Purchase Intent Score exibido
│                      │  🔄 calculate_deal_score() atualiza
│                      │  🔄 calculate_deal_risk_score() atualiza
└──────┬───────────────┘
       │
       │ [Mover para Qualification]
       ▼
┌──────────────────────┐
│ 7. HANDOFF AUTOMÁTICO │  🤝 Trigger automático ativado
│                      │  ✅ assign_sales_rep_to_deal() executada
│                      │  ✅ Vendedor atribuído (round-robin)
│                      │  ✅ Histórico registrado
│                      │  ✅ Notificação enviada
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 8. AUTOMAÇÕES         │  🤖 Sistema inteligente ativo
│                      │  ✅ Smart Cadences otimiza timing
│                      │  ✅ AI Voice SDR agenda chamadas
│                      │  ✅ Conversation Intelligence analisa
│                      │  ✅ Revenue Intelligence prevê
└──────────────────────┘
```

---

### **FLUXO DETALHADO POR MICROCICLO:**

#### **🔄 MICROCICLO 1: Deal Creation Automático**

```
Quarentena ICP
    │
    │ [Usuário clica "Aprovar"]
    ▼
approve_quarantine_to_crm()
    │
    ├─→ Busca empresa em companies (por CNPJ)
    │   └─→ Se não existe: CRIA empresa
    │
    ├─→ CRIA deal em deals
    │   ├─→ company_id vinculado
    │   ├─→ probability calculada (baseado em ICP score)
    │   └─→ priority calculada (baseado em temperatura)
    │
    └─→ CRIA lead (se houver email/telefone)
        │
        └─→ Deal aparece no Pipeline
```

#### **🔄 MICROCICLO 2: Purchase Intent Scoring**

```
Sistema detecta sinais de mercado
    │
    ├─→ insert_purchase_intent_signal()
    │   └─→ Salva em purchase_intent_signals
    │
    ├─→ calculate_purchase_intent_score()
    │   ├─→ Analisa sinais (expansão, dor, orçamento, timing, concorrentes)
    │   ├─→ Aplica pesos diferentes
    │   └─→ Retorna score (0-100)
    │
    └─→ update_purchase_intent_scores()
        ├─→ Atualiza qualified_prospects
        ├─→ Atualiza companies
        └─→ Atualiza icp_analysis_results
            │
            └─→ Badge visual atualizado em todas as páginas
```

#### **🔄 MICROCICLO 3: Handoff Automático**

```
Deal muda para estágio 'qualification'
    │
    ▼
Trigger automático ativado
    │
    ▼
assign_sales_rep_to_deal()
    │
    ├─→ get_available_sales_reps()
    │   └─→ Lista vendedores com menor carga
    │
    ├─→ Atribui vendedor (round-robin)
    │
    ├─→ Registra em deal_handoffs
    │
    └─→ Notifica vendedor
        │
        └─→ Deal aparece no Pipeline com owner
```

#### **🔄 MICROCICLO 4: Revenue Intelligence**

```
Deal é criado ou atualizado
    │
    ▼
Trigger automático ativado
    │
    ├─→ calculate_deal_score()
    │   ├─→ Calcula: value + probability + velocity + engagement + fit
    │   └─→ Salva em deal_scores
    │
    ├─→ calculate_deal_risk_score()
    │   ├─→ Analisa: tempo parado, probabilidade decrescente, falta atividade
    │   └─→ Salva em deal_risk_scores
    │
    └─→ ForecastPanel busca revenue_forecasts
        │
        └─→ Exibe previsão de receita
```

#### **🔄 MICROCICLO 5: Smart Cadences**

```
Usuário cria/executa cadência
    │
    ├─→ optimize_cadence_step_timing()
    │   └─→ Otimiza delay entre steps
    │
    ├─→ calculate_optimal_contact_time()
    │   └─→ Determina melhor horário
    │
    ├─→ personalize_cadence_message()
    │   └─→ Substitui variáveis no template
    │
    ├─→ record_cadence_response()
    │   └─→ Registra envio e resposta
    │
    └─→ get_channel_response_rates()
        └─→ Calcula métricas por canal
```

#### **🔄 MICROCICLO 6: Conversation Intelligence**

```
Chamada é transcrita
    │
    ▼
analyze_conversation_auto()
    │
    ├─→ calculate_talk_listen_ratio()
    │   └─→ Calcula ratio de fala
    │
    ├─→ detect_objections_in_transcript()
    │   └─→ Detecta objeções
    │
    ├─→ update_objection_pattern()
    │   └─→ Atualiza padrões
    │
    └─→ generate_coaching_card()
        └─→ Cria card de coaching
            │
            └─→ Aparece em ConversationDashboard
```

#### **🔄 MICROCICLO 7: AI Voice SDR**

```
Lead é aprovado OU usuário agenda chamada
    │
    ▼
schedule_voice_call_for_lead()
    │
    ├─→ Busca agente ativo
    ├─→ Valida telefone
    └─→ Cria registro em ai_voice_calls
        │
        └─→ Chamada é executada (Edge Function)
            │
            ▼
process_voice_call_result()
    │
    ├─→ Atualiza status do lead/deal
    ├─→ Cria atividade no CRM
    └─→ check_voice_call_handoff_needed()
        │
        └─→ Se necessário: handoff para humano
```

---

## 🔄 CICLO COMPLETO AUTOMATIZADO

### **VISÃO DE ALTO NÍVEL:**

```
┌─────────────────────────────────────────────────────────────┐
│              CICLO AUTOMATIZADO COMPLETO                     │
└─────────────────────────────────────────────────────────────┘

1. 📥 UPLOAD
   └─→ Empresas inseridas → Motor de Qualificação

2. 🔍 QUALIFICAÇÃO
   └─→ ICP Score calculado → Estoque Qualificado

3. 📦 ESTOQUE
   └─→ Purchase Intent Score calculado → Quarentena

4. 🛡️ QUARENTENA
   └─→ Enriquecimento → MC8 → Aprovação

5. ✅ APROVAÇÃO
   └─→ DEAL CRIADO AUTOMATICAMENTE → Pipeline

6. 💼 PIPELINE
   └─→ Deal Score calculado → Mover para Qualification

7. 🤝 HANDOFF
   └─→ VENDEDOR ATRIBUÍDO AUTOMATICAMENTE

8. 🤖 AUTOMAÇÕES
   ├─→ Smart Cadences otimiza timing
   ├─→ AI Voice SDR agenda chamadas
   ├─→ Conversation Intelligence analisa
   └─→ Revenue Intelligence prevê

9. 📊 INTELIGÊNCIA
   ├─→ Purchase Intent atualiza scores
   ├─→ Deal Scores atualizam automaticamente
   ├─→ Risk Scores alertam sobre riscos
   └─→ Next Best Actions recomendam ações

10. 🎯 RESULTADO
    └─→ Pipeline otimizado → Mais vendas → Mais receita
```

---

### **TRIGGERS AUTOMÁTICOS:**

1. **Deal Creation:**
   - ✅ Trigger: Quando lead é aprovado
   - ✅ Função: `approve_quarantine_to_crm()`
   - ✅ Resultado: Deal criado automaticamente

2. **Handoff Automático:**
   - ✅ Trigger: Quando deal muda para 'qualification'
   - ✅ Função: `assign_sales_rep_to_deal()`
   - ✅ Resultado: Vendedor atribuído automaticamente

3. **Deal Scoring:**
   - ✅ Trigger: Quando deal é criado/atualizado
   - ✅ Função: `calculate_deal_score()`, `calculate_deal_risk_score()`
   - ✅ Resultado: Scores atualizados automaticamente

4. **Purchase Intent:**
   - ✅ Trigger: Quando sinal é inserido
   - ✅ Função: `update_purchase_intent_scores()`
   - ✅ Resultado: Scores atualizados em todas as tabelas

---

## 📊 ONDE CADA FUNÇÃO É USADA

### **Frontend → Backend (RPC Calls):**

| Componente Frontend | Função SQL Chamada | Quando |
|---------------------|-------------------|--------|
| DealScoringEngine | `calculate_deal_score()` | Ao carregar scores |
| ForecastPanel | `revenue_forecasts` table | Ao exibir forecast |
| CadenceOptimizer | `optimize_cadence_step_timing()` | Ao otimizar cadência |
| FollowUpPrioritizer | `calculate_optimal_contact_time()` | Ao priorizar follow-ups |
| CadenceAnalytics | `get_channel_response_rates()` | Ao exibir analytics |
| VoiceCallManager | `get_voice_call_stats_by_date_range()` | Ao exibir estatísticas |
| Pipeline (Handoff) | `assign_sales_rep_to_deal()` | Ao clicar Handoff |
| ICPQuarantine (Aprovar) | `approve_quarantine_to_crm()` | Ao aprovar lead |

---

## 🎯 RESUMO: FUNÇÕES POR MICROCICLO

### **MICROCICLO 1: Deal Creation**
- ✅ `approve_quarantine_to_crm()` - 1 função

### **MICROCICLO 2: Purchase Intent**
- ✅ `calculate_purchase_intent_score()` - 1 função
- ✅ `update_purchase_intent_scores()` - 1 função
- ✅ `insert_purchase_intent_signal()` - 1 função
- **Total: 3 funções**

### **MICROCICLO 3: Handoff**
- ✅ `assign_sales_rep_to_deal()` - 1 função
- ✅ `get_available_sales_reps()` - 1 função
- ✅ `get_deal_handoff_history()` - 1 função
- **Total: 3 funções**

### **MICROCICLO 4: Revenue Intelligence**
- ✅ `calculate_deal_score()` - 1 função
- ✅ `calculate_deal_risk_score()` - 1 função
- ✅ `update_deal_scores_batch()` - 1 função
- ✅ `update_deal_risk_scores_batch()` - 1 função
- **Total: 4 funções**

### **MICROCICLO 5: Smart Cadences**
- ✅ `calculate_optimal_contact_time()` - 1 função
- ✅ `personalize_cadence_message()` - 1 função
- ✅ `optimize_cadence_step_timing()` - 1 função
- ✅ `calculate_next_optimal_time()` - 1 função
- ✅ `record_cadence_response()` - 1 função
- ✅ `get_channel_response_rates()` - 1 função
- **Total: 6 funções**

### **MICROCICLO 6: Conversation Intelligence**
- ✅ `calculate_talk_listen_ratio()` - 1 função
- ✅ `detect_objections_in_transcript()` - 1 função
- ✅ `update_objection_pattern()` - 1 função
- ✅ `generate_coaching_card()` - 1 função
- ✅ `analyze_conversation_auto()` - 1 função
- ✅ `get_unread_coaching_cards()` - 1 função
- ✅ `mark_coaching_card_read()` - 1 função
- **Total: 7 funções**

### **MICROCICLO 7: AI Voice SDR**
- ✅ `schedule_voice_call_for_lead()` - 1 função
- ✅ `process_voice_call_result()` - 1 função
- ✅ `get_pending_voice_calls()` - 1 função
- ✅ `get_voice_call_stats_by_date_range()` - 1 função
- ✅ `check_voice_call_handoff_needed()` - 1 função
- ✅ `schedule_batch_voice_calls()` - 1 função
- **Total: 6 funções**

### **TOTAL GERAL:**
- ✅ **30 funções SQL** criadas e conectadas
- ✅ **100% integradas** ao frontend
- ✅ **Triggers automáticos** ativos

---

## 📈 MELHORIAS RECENTES (2025-02-13)

### **✅ FASE 1: Purchase Intent Scoring**
- Adicionado badge visual em todas as páginas principais
- Score calculado automaticamente baseado em sinais de mercado
- Priorização automática de leads Hot (70+)

### **✅ FASE 2: Revenue Intelligence**
- ForecastPanel agora busca dados de `revenue_forecasts`
- DealScoringEngine chama `calculate_deal_score()` via RPC
- Previsões mais precisas com dados reais do banco

### **✅ FASE 3: Smart Cadences**
- CadenceOptimizer usa `optimize_cadence_step_timing()` via RPC
- FollowUpPrioritizer calcula optimal contact time automaticamente
- CadenceAnalytics usa `get_channel_response_rates()` para métricas reais

### **✅ FASE 4: AI Voice SDR**
- VoiceCallManager usa `get_voice_call_stats_by_date_range()` (nova função)
- Estatísticas mais precisas com range de datas customizável
- Fallback automático para função antiga se necessário

---

---

## 🎨 DIAGRAMA VISUAL: FLUXO COMPLETO DO SISTEMA

### **VISÃO GERAL DO ECOSSISTEMA:**

```
                    ┌─────────────────────────────────────┐
                    │   STRATEVO ONE - SALES MACHINE      │
                    └─────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   DADOS       │      │  QUALIFICAÇÃO  │      │  INTELIGÊNCIA │
│               │      │                │      │               │
│ • Upload      │─────▶│ • ICP Matching │─────▶│ • Purchase     │
│ • Enriquec.   │      │ • Fit Score    │      │   Intent      │
│ • Normalização│      │ • Grade (A-D)   │      │ • Deal Score  │
└───────────────┘      └───────────────┘      │ • Risk Score  │
                                              │ • Forecast    │
                                              └───────────────┘
                                                      │
        ┌─────────────────────────────────────────────┼─────┐
        │                                             │     │
        ▼                                             ▼     ▼
┌───────────────┐                          ┌───────────────┐
│   PIPELINE    │                          │  AUTOMAÇÕES   │
│               │                          │               │
│ • Discovery   │                          │ • Smart       │
│ • Qualif.     │◀─── HANDOFF AUTO ───────│   Cadences    │
│ • Proposal    │                          │ • AI Voice    │
│ • Negotiation │                          │ • Conversation│
│ • Closed      │                          │   Intelligence│
└───────────────┘                          └───────────────┘
```

### **FLUXO DETALHADO PASSO A PASSO:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO VISUAL                        │
└─────────────────────────────────────────────────────────────────┘

ETAPA 1: IMPORTAÇÃO
┌─────────────────┐
│ 📥 Upload CSV    │
│ • 100 empresas   │
│ • source_name    │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ 🔍 Motor Qualif.│
│ • Seleciona ICP  │
│ • Roda qualif.   │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ 📦 Estoque Qual. │
│ • 60 qualificadas│
│ • Purchase Intent│
│   Score: 45      │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ 🛡️ Quarentena   │
│ • Enriquecimento│
│ • MC8 Match     │
│ • Purchase Intent│
│   Score: 72 🔥  │
└────────┬─────────┘
         │
         │ [Aprovar 20 empresas]
         ▼
┌─────────────────┐
│ ✅ Aprovação     │
│ • approve_quaran-│
│   tine_to_crm() │
│ • 20 DEALS      │
│   CRIADOS AUTO  │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ 💼 Pipeline     │
│ • 20 deals      │
│ • Stage: Discov.│
│ • calculate_deal_│
│   score() = 65  │
└────────┬─────────┘
         │
         │ [Mover 10 para Qualification]
         ▼
┌─────────────────┐
│ 🤝 Handoff Auto │
│ • Trigger ativa │
│ • assign_sales_ │
│   rep_to_deal() │
│ • 10 vendedores │
│   atribuídos    │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ 🤖 Automações   │
│ • Smart Cadences│
│   otimiza timing │
│ • AI Voice SDR  │
│   agenda calls  │
│ • Conversation  │
│   Intelligence  │
│   analisa calls │
│ • Revenue Intel.│
│   prevê receita │
└─────────────────┘
```

---

**Última Atualização:** 2025-02-13  
**Versão:** 3.0.0  
**Status:** ✅ Completo, Funcional, 100% Conectado e Documentado

