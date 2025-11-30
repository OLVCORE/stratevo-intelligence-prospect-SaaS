# 🎯 CICLO 7: GESTÃO DE EQUIPE AVANÇADA - PLANO COMPLETO

## 📊 STATUS ATUAL

### ✅ TABELAS EXISTENTES

1. **`gamification`** ✅
   - Já existe na migration `20250122000004_crm_complete_olinda_replica.sql`
   - Campos: `user_id`, `tenant_id`, `total_points`, `level`, `badges`, `achievements`
   - **Necessário:** Verificar se está completo e adicionar campos faltantes

2. **`sales_goals`** ✅
   - Já existe na migration `20251024040801_af7b7681-9b4f-467f-8dfb-944aa683e4d8.sql`
   - Campos: `period_type`, `proposals_target`, `sales_target`, `revenue_target`, `progress_percentage`
   - **Problema:** Não tem `tenant_id` - precisa adicionar para multi-tenancy
   - **Problema:** Não tem `user_id` - precisa adicionar para metas individuais

---

## 🎯 OBJETIVOS DO CICLO 7

### 7.1 Metas & KPIs
- Metas individuais e de equipe
- Tracking em tempo real
- Notificações de milestone
- Gráficos de progresso
- Comparação entre vendedores

### 7.2 Gamificação
- Sistema de pontos
- Badges e conquistas
- Leaderboard
- Prêmios configuráveis
- Desafios semanais/mensais

### 7.3 Coaching Insights
- Sugestões de IA
- Áreas de melhoria identificadas
- Best practices automáticas
- Análise de performance
- Recomendações personalizadas

---

## 📋 TAREFAS DETALHADAS

### FASE 1: CORRIGIR E EXPANDIR TABELAS EXISTENTES

#### 1.1 Migration: Corrigir `sales_goals` para Multi-Tenancy
- [ ] Adicionar `tenant_id` à tabela `sales_goals`
- [ ] Adicionar `user_id` para metas individuais
- [ ] Adicionar `team_id` para metas de equipe
- [ ] Adicionar campos de tracking: `last_updated_at`, `milestone_notifications`
- [ ] Adicionar RLS policies baseadas em `tenant_id`

#### 1.2 Migration: Expandir `gamification`
- [ ] Verificar campos existentes
- [ ] Adicionar campos faltantes: `weekly_points`, `monthly_points`, `challenges_completed`
- [ ] Adicionar tabela `gamification_badges` para badges customizados
- [ ] Adicionar tabela `gamification_challenges` para desafios

#### 1.3 Migration: Criar Tabelas Novas
- [ ] `coaching_insights` - Insights de coaching por usuário
- [ ] `performance_reviews` - Reviews de performance
- [ ] `kpi_tracking` - Tracking de KPIs em tempo real
- [ ] `team_leaderboards` - Leaderboards de equipe

---

### FASE 2: COMPONENTES REACT

#### 2.1 Metas & KPIs
- [ ] `GoalsDashboard.tsx` - Dashboard de metas
- [ ] `IndividualGoals.tsx` - Metas individuais
- [ ] `TeamGoals.tsx` - Metas de equipe
- [ ] `KPITracking.tsx` - Tracking de KPIs
- [ ] `GoalProgressChart.tsx` - Gráfico de progresso
- [ ] `SalesComparison.tsx` - Comparação entre vendedores

#### 2.2 Gamificação
- [ ] `GamificationDashboard.tsx` - Dashboard de gamificação
- [ ] `Leaderboard.tsx` - Leaderboard
- [ ] `BadgesPanel.tsx` - Painel de badges
- [ ] `ChallengesPanel.tsx` - Painel de desafios
- [ ] `PointsHistory.tsx` - Histórico de pontos

#### 2.3 Coaching Insights
- [ ] `CoachingDashboard.tsx` - Dashboard de coaching
- [ ] `AIInsights.tsx` - Insights de IA
- [ ] `PerformanceAnalysis.tsx` - Análise de performance
- [ ] `ImprovementAreas.tsx` - Áreas de melhoria
- [ ] `BestPractices.tsx` - Best practices

---

### FASE 3: EDGE FUNCTIONS

#### 3.1 Tracking de Metas
- [ ] `crm-goal-tracker` - Atualiza progresso de metas em tempo real
- [ ] `crm-milestone-notifier` - Notifica quando milestone é atingido

#### 3.2 Gamificação
- [ ] `crm-gamification-processor` - Processa pontos e badges
- [ ] `crm-leaderboard-updater` - Atualiza leaderboard

#### 3.3 Coaching
- [ ] `crm-coaching-analyzer` - Analisa performance e gera insights
- [ ] `crm-best-practices-generator` - Gera best practices baseado em dados

---

### FASE 4: INTEGRAÇÃO COM CRM EXISTENTE

#### 4.1 Integração com Deals
- [ ] Atualizar pontos quando deal é ganho
- [ ] Atualizar metas quando deal é ganho
- [ ] Notificar quando meta é atingida

#### 4.2 Integração com Activities
- [ ] Pontos por atividades completadas
- [ ] Badges por milestones de atividades

#### 4.3 Integração com Call Recordings
- [ ] Análise de coaching baseada em gravações
- [ ] Insights de performance baseados em calls

---

## 🗂️ ESTRUTURA DE ARQUIVOS

```
supabase/migrations/
  └── 20250122000012_ciclo7_gestao_equipe.sql

supabase/functions/
  ├── crm-goal-tracker/
  ├── crm-milestone-notifier/
  ├── crm-gamification-processor/
  ├── crm-leaderboard-updater/
  ├── crm-coaching-analyzer/
  └── crm-best-practices-generator/

src/modules/crm/components/team/
  ├── goals/
  │   ├── GoalsDashboard.tsx
  │   ├── IndividualGoals.tsx
  │   ├── TeamGoals.tsx
  │   ├── KPITracking.tsx
  │   ├── GoalProgressChart.tsx
  │   └── SalesComparison.tsx
  ├── gamification/
  │   ├── GamificationDashboard.tsx
  │   ├── Leaderboard.tsx
  │   ├── BadgesPanel.tsx
  │   ├── ChallengesPanel.tsx
  │   └── PointsHistory.tsx
  └── coaching/
      ├── CoachingDashboard.tsx
      ├── AIInsights.tsx
      ├── PerformanceAnalysis.tsx
      ├── ImprovementAreas.tsx
      └── BestPractices.tsx

src/modules/crm/pages/
  ├── Goals.tsx (nova página)
  ├── Gamification.tsx (nova página)
  └── Coaching.tsx (nova página)
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar migration para corrigir `sales_goals`
2. ✅ Criar migration para expandir `gamification`
3. ✅ Criar migration para novas tabelas
4. ✅ Criar componentes React
5. ✅ Criar Edge Functions
6. ✅ Integrar com CRM existente

---

**Status:** 📋 PLANO CRIADO | ⏳ AGUARDANDO IMPLEMENTAÇÃO

