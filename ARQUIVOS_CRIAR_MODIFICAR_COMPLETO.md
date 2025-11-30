# 📋 LISTA COMPLETA DE ARQUIVOS - PLANO ESTRATÉGICO

## 🛡️ GARANTIA DE SEGURANÇA

**NENHUM arquivo existente será deletado, renomeado ou refatorado sem necessidade.**

---

## 📁 ARQUIVOS A CRIAR (NOVOS - 100% novos)

### FASE 1: AI Voice SDR + Smart Templates + Revenue Intelligence

#### 1. AI Voice SDR
```
src/modules/crm/components/ai-voice/
├── AIVoiceSDR.tsx                    # Componente principal
├── VoiceCallManager.tsx               # Gerenciador de chamadas
├── VoiceScriptBuilder.tsx             # Builder de scripts
├── SentimentAnalysis.tsx              # Análise de sentimento
└── CallTranscription.tsx              # Transcrição automática

supabase/functions/crm-ai-voice-call/
└── index.ts                           # Edge Function para chamadas

supabase/functions/crm-voice-sentiment/
└── index.ts                           # Análise de sentimento

supabase/migrations/
└── 20250122000020_ai_voice_sdr.sql    # Tabelas para IA Voice
```

#### 2. Smart Templates
```
src/modules/crm/components/smart-templates/
├── SmartTemplateGenerator.tsx         # Gerador de templates IA
├── TemplateABTesting.tsx              # A/B testing
├── ResponseRateAnalyzer.tsx            # Análise de resposta
└── TemplateOptimizer.tsx               # Otimizador contínuo

supabase/functions/crm-generate-smart-template/
└── index.ts                           # Edge Function para gerar templates

supabase/migrations/
└── 20250122000021_smart_templates.sql # Tabelas para templates IA
```

#### 3. Revenue Intelligence
```
src/modules/crm/components/revenue-intelligence/
├── PredictiveForecast.tsx             # Previsão preditiva
├── DealRiskAnalyzer.tsx               # Análise de risco
├── PipelineHealthScore.tsx            # Health score do pipeline
├── NextBestActionRecommender.tsx      # Recomendações automáticas
└── DealScoringEngine.tsx              # Engine de scoring

supabase/functions/crm-predictive-forecast/
└── index.ts                           # Previsão preditiva

supabase/functions/crm-deal-risk-analysis/
└── index.ts                           # Análise de risco

supabase/migrations/
└── 20250122000023_revenue_intelligence.sql  # Tabelas para revenue intelligence
```

---

### FASE 2: Smart Cadences + Sales Academy

#### 4. Smart Cadences
```
src/modules/crm/components/smart-cadences/
├── SmartCadenceBuilder.tsx            # Builder de cadências
├── CadenceOptimizer.tsx               # Otimizador de timing
├── PersonalizationEngine.tsx           # Engine de personalização
├── FollowUpPrioritizer.tsx            # Priorizador de follow-ups
└── CadenceAnalytics.tsx               # Analytics de cadências

supabase/functions/crm-optimize-cadence-timing/
└── index.ts                           # Otimização de timing

supabase/migrations/
└── 20250122000024_smart_cadences.sql  # Tabelas para cadências inteligentes
```

#### 5. Sales Academy
```
src/modules/sales-academy/
├── pages/
│   ├── AcademyDashboard.tsx           # Dashboard principal
│   ├── LearningPaths.tsx              # Trilhas de aprendizado
│   ├── Certifications.tsx             # Certificações
│   ├── PlaybooksLibrary.tsx           # Biblioteca de playbooks
│   └── SalesSimulator.tsx             # Simulador de vendas
├── components/
│   ├── LearningPathCard.tsx           # Card de trilha
│   ├── CertificationBadge.tsx         # Badge de certificação
│   ├── PlaybookViewer.tsx             # Visualizador de playbook
│   └── SimulatorSession.tsx           # Sessão de simulação
└── hooks/
    └── useSalesAcademy.ts             # Hook para academia

supabase/migrations/
└── 20250122000022_sales_academy.sql   # Tabelas para academia
```

---

### FASE 3: Conversation Intelligence + Módulos IA Avançados

#### 6. Conversation Intelligence
```
src/modules/crm/components/conversation-intelligence/
├── CallTranscriptionView.tsx          # Visualização de transcrição
├── ObjectionPatternAnalyzer.tsx       # Análise de objeções
├── CompetitorMentionTracker.tsx       # Rastreamento de competidores
├── CoachingCardsGenerator.tsx         # Geração de coaching cards
└── TalkListenRatioTracker.tsx        # Tracking de ratio

supabase/functions/crm-transcribe-call/
└── index.ts                           # Transcrição automática

supabase/functions/crm-analyze-objections/
└── index.ts                           # Análise de objeções

supabase/functions/crm-generate-coaching-cards/
└── index.ts                           # Geração de coaching cards

supabase/migrations/
└── 20250122000025_conversation_intelligence.sql  # Tabelas para CI
```

#### 7. AI Sales Coach
```
src/modules/crm/components/ai-coach/
├── RealTimeCoaching.tsx               # Coaching em tempo real
├── ObjectionHandlingAssistant.tsx     # Assistente de objeções
├── NextBestQuestion.tsx               # Próxima melhor pergunta
├── PostCallAnalysis.tsx               # Análise pós-chamada
└── ImprovementPlan.tsx                # Plano de melhoria

supabase/functions/crm-ai-sales-coach/
└── index.ts                           # Edge Function para coaching

supabase/migrations/
└── 20250122000026_ai_sales_coach.sql  # Tabelas para AI Coach
```

#### 8. Deal Accelerator
```
src/modules/crm/components/deal-accelerator/
├── BottleneckDetector.tsx             # Detecção de gargalos
├── AutoReminders.tsx                  # Lembretes contextuais
├── StakeholderMapper.tsx              # Mapeamento de decisores
├── WinProbabilityEngine.tsx           # Engine de probabilidade
└── RiskFactorAnalyzer.tsx             # Análise de fatores de risco

supabase/functions/crm-deal-accelerator/
└── index.ts                           # Edge Function para acelerar deals

supabase/migrations/
└── 20250122000027_deal_accelerator.sql # Tabelas para Deal Accelerator
```

#### 9. Customer Health Score
```
src/modules/crm/components/customer-health/
├── ChurnPrediction.tsx                # Previsão de churn
├── EarlyWarningSystem.tsx             # Sistema de alerta precoce
├── InterventionPlaybook.tsx           # Playbook de intervenção
├── UpsellOpportunityDetector.tsx      # Detector de upsell
└── EngagementTracking.tsx            # Tracking de engajamento

supabase/functions/crm-customer-health/
└── index.ts                           # Edge Function para health score

supabase/migrations/
└── 20250122000028_customer_health.sql  # Tabelas para Customer Health
```

---

## ✏️ ARQUIVOS A MODIFICAR (INTEGRAÇÃO - Mínimo necessário)

### Modificações na FASE 1:

1. **`src/modules/crm/pages/Leads.tsx`**
   - Adicionar: Botão "IA Voice Call" no card de lead
   - Linhas: ~5-10 linhas adicionadas
   - Tipo: Adição pura, sem remoção

2. **`src/modules/crm/pages/EmailTemplates.tsx`**
   - Adicionar: Seção "Smart Templates" com toggle
   - Linhas: ~20-30 linhas adicionadas
   - Tipo: Adição pura, sem remoção

3. **`src/modules/crm/components/analytics/RevenueForecasting.tsx`**
   - Adicionar: Modo "Predictive" com toggle
   - Linhas: ~30-40 linhas adicionadas
   - Tipo: Adição pura, sem remoção

---

### Modificações na FASE 2:

4. **`src/modules/crm/pages/Automations.tsx`**
   - Adicionar: Seção "Smart Cadences" com tab
   - Linhas: ~15-20 linhas adicionadas
   - Tipo: Adição pura, sem remoção

5. **`src/components/layout/AppSidebar.tsx`**
   - Adicionar: Item de menu "Academia de Vendas"
   - Linhas: ~5-10 linhas adicionadas
   - Tipo: Adição pura, sem remoção

6. **`src/modules/crm/components/performance/CoachingInsights.tsx`**
   - Adicionar: Link para módulo de Academia
   - Linhas: ~5-10 linhas adicionadas
   - Tipo: Adição pura, sem remoção

7. **`src/pages/SDRPipelinePage.tsx`**
   - Adicionar: Integração com Smart Cadences
   - Linhas: ~10-15 linhas adicionadas
   - Tipo: Adição pura, sem remoção

---

### Modificações na FASE 3:

8. **`src/modules/crm/components/communications/CallRecordingsPanel.tsx`**
   - Adicionar: Seção "Conversation Intelligence" com análise IA
   - Linhas: ~30-40 linhas adicionadas
   - Tipo: Adição pura, sem remoção

9. **`src/modules/crm/pages/Dashboard.tsx`**
   - Adicionar: Widgets de Revenue Intelligence, Deal Accelerator, Customer Health
   - Linhas: ~50-60 linhas adicionadas
   - Tipo: Adição pura, sem remoção

---

## 📊 RESUMO ESTATÍSTICO

**Total de Arquivos a CRIAR:**
- Componentes React: ~45 arquivos
- Edge Functions: ~12 arquivos
- Migrations SQL: ~9 arquivos
- **Total: ~66 arquivos novos**

**Total de Arquivos a MODIFICAR:**
- **9 arquivos** (apenas adições, sem remoções)

**Total de Linhas a ADICIONAR:**
- Componentes novos: ~5.000 linhas
- Modificações: ~200 linhas
- **Total: ~5.200 linhas**

**Total de Linhas a REMOVER:**
- **0 linhas** (nenhuma remoção)

---

## ✅ GARANTIAS FINAIS

1. ✅ **NENHUM arquivo existente será deletado**
2. ✅ **NENHUM arquivo existente será renomeado**
3. ✅ **NENHUM arquivo existente será refatorado sem necessidade**
4. ✅ **TODAS as funcionalidades existentes continuarão funcionando**
5. ✅ **TODAS as modificações são apenas adições**
6. ✅ **TODOS os novos arquivos são 100% novos (sem conflitos)**

---

**MANTRA:** Evoluir, NÃO regredir. Expandir, NÃO destruir. Cirurgia precisa, NÃO reforma geral.

