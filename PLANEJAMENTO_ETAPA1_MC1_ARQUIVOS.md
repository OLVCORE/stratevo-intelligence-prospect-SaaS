# 📋 ETAPA 1 - PLANEJAMENTO FINAL DOS ARQUIVOS MC1

**Data:** 2025-01-22  
**Status:** 📝 **PLANEJAMENTO - AGUARDANDO APROVAÇÃO**

---

## 🎯 OBJETIVO DO MC1

Criar painel "ICP – Perfil Ideal" que:
- Leia o ICP principal já criado
- Exiba dados básicos + inteligência mercadológica consolidada
- Mostre resumo executivo dos módulos complexos
- Crie biblioteca de ICPs (leitura)

**⚠️ REGRA CRÍTICA:** Apenas CONSUMIR dados já calculados, NUNCA recalcular.

---

## 📊 ARQUIVOS QUE SERÃO CRIADOS/MODIFICADOS

### 🔵 BACK-END / SERVICES / HOOKS DE DADOS

#### 1. `src/hooks/useActiveICP.ts` (NOVO)
**Objetivo:** Buscar ICP ativo do tenant

**Dados que vai CONSUMIR:**
- Tabela: `icp_profiles_metadata`
- Campos: `id`, `tenant_id`, `ativo`, `icp_principal`, `nome`, `descricao`, `tipo`, `setor_foco`, `metadata` (JSONB)
- Filtros: `tenant_id = X`, `ativo = true` OU `icp_principal = true`, ordenar por `created_at DESC`

**Função/hook existente reutilizado:**
- `supabase.from('icp_profiles_metadata').select()` (query direta)
- `useTenant()` para obter `tenant_id`

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Log: `MC1[data]: carregando ICP ativo para tenant ${tenantId}`

**Retorno:**
```typescript
{
  data: ICPProfile | null,
  isLoading: boolean,
  error: Error | null
}
```

---

#### 2. `src/hooks/useICPLibrary.ts` (NOVO)
**Objetivo:** Buscar biblioteca completa de ICPs do tenant

**Dados que vai CONSUMIR:**
- Tabela: `icp_profiles_metadata`
- Campos: Todos os campos do ICP
- Filtros: `tenant_id = X`, ordenar por `icp_principal DESC, created_at DESC`

**Função/hook existente reutilizado:**
- `supabase.from('icp_profiles_metadata').select()` (query direta)
- `useTenant()` para obter `tenant_id`

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Log: `MC1[data]: carregando biblioteca de ICPs para tenant ${tenantId}`

**Retorno:**
```typescript
{
  data: ICPProfile[],
  isLoading: boolean,
  error: Error | null,
  activeICP: ICPProfile | null
}
```

---

#### 3. `src/hooks/useICPCompetitiveInsights.ts` (NOVO)
**Objetivo:** Buscar resumo executivo da análise competitiva

**Dados que vai CONSUMIR:**
- Tabela: `onboarding_sessions` (step1_data, step4_data)
- Tabela: `tenant_competitor_products`
- Tabela: `tenant_products`
- Lógica: Reutilizar lógica de `CompetitiveAnalysis.tsx` (linhas 156-337) - **APENAS LEITURA**

**Função/hook existente reutilizado:**
- `supabase.from('onboarding_sessions').select('step1_data, step4_data')`
- `supabase.from('tenant_competitor_products').select()`
- `supabase.from('tenant_products').select()`
- Lógica de enriquecimento de `CompetitiveAnalysis.tsx` (sem alterar o componente)

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Consome dados já calculados/enriquecidos
- ✅ Log: `MC1[data]: carregando insights competitivos para ICP ${icpId}`

**Retorno:**
```typescript
{
  topCompetitors: Array<{ nome, capitalSocial, ameacaPotencial, produtosCount }>,
  totalCapital: number,
  yourMarketShare: number,
  yourPosition: number,
  diferenciais: string[],
  isLoading: boolean
}
```

---

#### 4. `src/hooks/useICPBCGHighlights.ts` (NOVO)
**Objetivo:** Buscar resumo executivo da matriz BCG

**Dados que vai CONSUMIR:**
- Tabela: `onboarding_sessions` (step1_data, step5_data)
- Lógica: Reutilizar lógica de `BCGMatrix.tsx` (linhas 130-294) - **APENAS LEITURA**

**Função/hook existente reutilizado:**
- `supabase.from('onboarding_sessions').select('step1_data, step5_data')`
- Lógica de cálculo de `BCGMatrix.tsx` (função `calcularBCGLocal`) - **SEM ALTERAR O COMPONENTE**

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Consome dados já calculados
- ✅ Log: `MC1[data]: carregando highlights BCG para ICP ${icpId}`

**Retorno:**
```typescript
{
  priorityNiches: Array<{ name, growth, marketShare, type }>,
  desiredClients: Array<{ name, growth, marketShare, revenue }>,
  benchmarking: Array<{ name, growth, marketShare }>,
  isLoading: boolean
}
```

---

#### 5. `src/hooks/useICPProductHighlights.ts` (NOVO)
**Objetivo:** Buscar resumo executivo das métricas de produtos

**Dados que vai CONSUMIR:**
- Tabela: `tenant_products`
- Tabela: `tenant_competitor_products`
- Lógica: Reutilizar lógica de `ProductComparisonMatrix.tsx` (linhas 239-350) - **APENAS LEITURA**

**Função/hook existente reutilizado:**
- `supabase.from('tenant_products').select()`
- `supabase.from('tenant_competitor_products').select()`
- Lógica de agrupamento e categorização de `ProductComparisonMatrix.tsx` - **SEM ALTERAR O COMPONENTE**

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Consome dados já calculados
- ✅ Log: `MC1[data]: carregando highlights de produtos para ICP ${icpId}`

**Retorno:**
```typescript
{
  tenantProducts: Array<{ nome, categoria }>,
  competitorProducts: Array<{ nome, categoria, competitor_name }>,
  differentials: Array<{ nome, categoria }>, // Produtos únicos do tenant
  opportunities: Array<{ categoria, gap }>, // Categorias não cobertas
  highCompetition: Array<{ categoria, competitorCount }>, // Categorias com muitos concorrentes
  totalProducts: number,
  totalCategories: number,
  isLoading: boolean
}
```

---

#### 6. `src/hooks/useICPStrategicPlanHighlights.ts` (NOVO)
**Objetivo:** Buscar resumo executivo do plano estratégico

**Dados que vai CONSUMIR:**
- Tabela: `onboarding_sessions` (step1_data, step5_data)
- Tabela: `icp_profiles_metadata.metadata` (se contiver plano estratégico)
- Lógica: Reutilizar lógica de `StrategicActionPlan.tsx` - **APENAS LEITURA**

**Função/hook existente reutilizado:**
- `supabase.from('onboarding_sessions').select('step1_data, step5_data')`
- `supabase.from('icp_profiles_metadata').select('metadata')`
- Lógica de `StrategicActionPlan.tsx` - **SEM ALTERAR O COMPONENTE**

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Consome dados já calculados
- ✅ Log: `MC1[data]: carregando highlights do plano estratégico para ICP ${icpId}`

**Retorno:**
```typescript
{
  quickWins: string[],
  criticalDecisions: string[],
  investmentSummary: {
    shortTerm: number,
    mediumTerm: number,
    longTerm: number
  },
  ceoRecommendation: string | null,
  isLoading: boolean
}
```

---

### 🟢 FRONT-END / COMPONENTES DE UI / PÁGINAS

#### 7. `src/pages/CentralICP/ActiveICPProfile.tsx` (NOVO)
**Objetivo:** Página principal do ICP ativo com resumo executivo

**Dados que vai CONSUMIR:**
- Hook: `useActiveICP()` - ICP ativo
- Hook: `useICPCompetitiveInsights()` - Insights competitivos
- Hook: `useICPBCGHighlights()` - Highlights BCG
- Hook: `useICPProductHighlights()` - Highlights de produtos
- Hook: `useICPStrategicPlanHighlights()` - Highlights do plano

**Função/hook existente reutilizado:**
- Todos os hooks criados acima (1-6)
- Componentes de UI existentes: `Card`, `Badge`, `Button`, `Tabs`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita
- ✅ Log: `MC1[ui]: ICP ativo exibido = ${icpId}`
- ✅ Log: `MC1[ui]: dados de inteligência carregados para ICP ${icpId}`

**Estrutura:**
- Header com nome do ICP
- Resumo executivo (dados básicos)
- Bloco de insights competitivos
- Bloco de highlights BCG
- Bloco de highlights de produtos
- Bloco de highlights do plano estratégico
- Link para ver completo (`/central-icp/profile/:id`)

---

#### 8. `src/pages/CentralICP/ICPLibrary.tsx` (NOVO)
**Objetivo:** Página da biblioteca de ICPs do tenant

**Dados que vai CONSUMIR:**
- Hook: `useICPLibrary()` - Todos os ICPs do tenant

**Função/hook existente reutilizado:**
- Hook `useICPLibrary()` (criado acima)
- Componentes de UI existentes: `Card`, `Badge`, `Button`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita
- ✅ Ações: visualizar, ativar (futuro), definir como principal (futuro)
- ✅ Log: `MC1[ui]: biblioteca de ICPs exibida`

**Estrutura:**
- Grid de cards (um por ICP)
- Destaque visual para ICP principal
- Ações: visualizar, ativar, definir como principal

---

#### 9. `src/components/icp/ICPExecutiveSummary.tsx` (NOVO)
**Objetivo:** Componente de resumo executivo do ICP

**Dados que vai CONSUMIR:**
- Props: `icp: ICPProfile` - Dados básicos do ICP

**Função/hook existente reutilizado:**
- Componentes de UI existentes: `Card`, `Badge`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita

**Estrutura:**
- Nome, setor, nicho
- Persona, dores, objeções
- Stack tech, maturidade digital
- Canais preferidos, playbooks

---

#### 10. `src/components/icp/ICPCompetitiveInsights.tsx` (NOVO)
**Objetivo:** Componente de resumo executivo da análise competitiva

**Dados que vai CONSUMIR:**
- Hook: `useICPCompetitiveInsights(icpId)`

**Função/hook existente reutilizado:**
- Hook `useICPCompetitiveInsights()` (criado acima)
- Componentes de UI existentes: `Card`, `Badge`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita

**Estrutura:**
- Top 3 concorrentes
- Principais diferenciais
- Oportunidades identificadas
- Link para ver completo

---

#### 11. `src/components/icp/ICPBCGHighlights.tsx` (NOVO)
**Objetivo:** Componente de resumo executivo da matriz BCG

**Dados que vai CONSUMIR:**
- Hook: `useICPBCGHighlights(icpId)`

**Função/hook existente reutilizado:**
- Hook `useICPBCGHighlights()` (criado acima)
- Componentes de UI existentes: `Card`, `Badge`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita

**Estrutura:**
- Nichos prioritários (top 3)
- Clientes desejados (top 3)
- Link para ver completo

---

#### 12. `src/components/icp/ICPProductHighlights.tsx` (NOVO)
**Objetivo:** Componente de resumo executivo das métricas de produtos

**Dados que vai CONSUMIR:**
- Hook: `useICPProductHighlights(icpId)`

**Função/hook existente reutilizado:**
- Hook `useICPProductHighlights()` (criado acima)
- Componentes de UI existentes: `Card`, `Badge`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita

**Estrutura:**
- Principais diferenciais (top 5)
- Oportunidades de expansão (top 5)
- Alta concorrência (top 3)
- Cobertura total (254 produtos, 19 categorias)
- Link para ver completo

---

#### 13. `src/components/icp/ICPStrategicPlanHighlights.tsx` (NOVO)
**Objetivo:** Componente de resumo executivo do plano estratégico

**Dados que vai CONSUMIR:**
- Hook: `useICPStrategicPlanHighlights(icpId)`

**Função/hook existente reutilizado:**
- Hook `useICPStrategicPlanHighlights()` (criado acima)
- Componentes de UI existentes: `Card`, `Badge`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita

**Estrutura:**
- Quick wins (top 3)
- Decisões críticas (top 3)
- Investimento total estimado
- Link para ver completo

---

### 🟡 ROTAS / SIDEBAR / NAVEGAÇÃO

#### 14. `src/App.tsx` (MODIFICAR)
**Objetivo:** Adicionar rotas para ICP ativo e biblioteca

**Modificações:**
- Adicionar rota: `/central-icp/profile-active` → `ActiveICPProfile`
- Adicionar rota: `/central-icp/library` → `ICPLibrary`

**Confirmação:**
- ✅ Apenas adicionar rotas - não alterar rotas existentes
- ✅ Usar lazy loading se aplicável

---

#### 15. `src/components/layout/AppSidebar.tsx` (MODIFICAR)
**Objetivo:** Adicionar itens na sidebar para ICP ativo e biblioteca

**Modificações:**
- Adicionar item "ICP Ativo" no grupo "Configuração ICP"
- Adicionar item "Biblioteca de ICPs" no grupo "Configuração ICP"

**Confirmação:**
- ✅ Apenas adicionar itens - não alterar itens existentes
- ✅ Manter estrutura existente

---

## 📋 RESUMO DE ARQUIVOS

### Arquivos NOVOS (13):
1. `src/hooks/useActiveICP.ts`
2. `src/hooks/useICPLibrary.ts`
3. `src/hooks/useICPCompetitiveInsights.ts`
4. `src/hooks/useICPBCGHighlights.ts`
5. `src/hooks/useICPProductHighlights.ts`
6. `src/hooks/useICPStrategicPlanHighlights.ts`
7. `src/pages/CentralICP/ActiveICPProfile.tsx`
8. `src/pages/CentralICP/ICPLibrary.tsx`
9. `src/components/icp/ICPExecutiveSummary.tsx`
10. `src/components/icp/ICPCompetitiveInsights.tsx`
11. `src/components/icp/ICPBCGHighlights.tsx`
12. `src/components/icp/ICPProductHighlights.tsx`
13. `src/components/icp/ICPStrategicPlanHighlights.tsx`

### Arquivos MODIFICADOS (2):
14. `src/App.tsx` (adicionar rotas)
15. `src/components/layout/AppSidebar.tsx` (adicionar itens)

---

## ✅ CONFIRMAÇÕES FINAIS

### Todas as operações são SOMENTE LEITURA:
- ✅ Nenhum `INSERT`, `UPDATE`, `DELETE`
- ✅ Apenas `SELECT` / `GET`
- ✅ Nenhuma alteração em componentes existentes de inteligência
- ✅ Apenas consumo de dados já calculados

### Logs implementados:
- ✅ `MC1[data]: ...` - Logs de carregamento de dados
- ✅ `MC1[ui]: ...` - Logs de interações na UI

### Reutilização de código existente:
- ✅ Lógica de `CompetitiveAnalysis.tsx` (sem alterar o componente)
- ✅ Lógica de `BCGMatrix.tsx` (sem alterar o componente)
- ✅ Lógica de `ProductComparisonMatrix.tsx` (sem alterar o componente)
- ✅ Lógica de `StrategicActionPlan.tsx` (sem alterar o componente)

---

## ⚠️ REGRAS DE BLINDAGEM

### ❌ NÃO FAZER:
- ❌ Alterar `CompetitiveAnalysis.tsx`
- ❌ Alterar `BCGMatrix.tsx`
- ❌ Alterar `ProductComparisonMatrix.tsx`
- ❌ Alterar `StrategicActionPlan.tsx`
- ❌ Criar migrations
- ❌ Alterar schemas/tabelas
- ❌ Recalcular análises
- ❌ Alterar rotas existentes

### ✅ PODE FAZER:
- ✅ Criar novos hooks de leitura
- ✅ Criar novos componentes de visualização
- ✅ Adicionar novas rotas
- ✅ Adicionar itens na sidebar
- ✅ Consumir dados já calculados
- ✅ Reutilizar lógica existente (sem alterar componentes originais)

---

**Status:** 📝 **PLANEJAMENTO COMPLETO - AGUARDANDO APROVAÇÃO**

**Próxima Etapa:** Após aprovação, executar ETAPA 2 - Implementação do MC1

