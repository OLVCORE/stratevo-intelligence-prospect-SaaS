# 📋 ETAPA 1 - PLANEJAMENTO REVISADO MC1 (ARQUITETURA UNIFICADA)

**Data:** 2025-01-22  
**Status:** 📝 **PLANEJAMENTO REVISADO - AGUARDANDO APROVAÇÃO**

---

## 🎯 OBJETIVO DO MC1 (REVISADO)

Criar painel "ICP – Perfil Ideal" que:
- Leia o ICP principal já criado
- Exiba dados básicos + inteligência mercadológica consolidada
- Mostre resumo executivo dos módulos complexos
- Crie biblioteca de ICPs (leitura)

**⚠️ REGRA CRÍTICA:** Apenas CONSUMIR sínteses/snapshots já salvos, NUNCA recalcular.

---

## 🧠 ARQUITETURA UNIFICADA

### Princípio Fundamental

**O ICP é uma tese estratégica única, não uma soma de dados desconectados.**

Em vez de múltiplos hooks fragmentados, criamos:
- **1 hook unificado** `useTenantICP()` que retorna o modelo completo do ICP
- **Consumo de sínteses** já calculadas e salvas, não dados brutos
- **Ponto único de auditoria** para verificar se os dados estão realmente conectados

---

## 📊 ARQUIVOS QUE SERÃO CRIADOS/MODIFICADOS

### 🔵 BACK-END / SERVICES / HOOKS DE DADOS

#### 1. `src/hooks/useTenantICP.ts` (NOVO - ÚNICO HOOK UNIFICADO)
**Objetivo:** Buscar modelo completo do ICP ativo com TODOS os blocos de inteligência

**Dados que vai CONSUMIR (SOMENTE SÍNTESES/SNAPSHOTS):**

**A) Perfil Básico do ICP:**
- Tabela: `icp_profiles_metadata`
- Campos: `id`, `nome`, `descricao`, `tipo`, `setor_foco`, `nicho_foco`, `ativo`, `icp_principal`
- Filtro: `tenant_id = X`, `ativo = true` OU `icp_principal = true`

**B) Persona e Critérios (do onboarding):**
- Tabela: `onboarding_sessions` (mais recente)
- Campos: `step1_data`, `step3_data` (persona, dores, objeções, desejos)
- Caminho: `session.step1_data.persona`, `session.step3_data.dores`, etc.

**C) Análise Competitiva (SNAPSHOT):**
- Tabela: `competitive_analysis` (se existir)
- Campos: `competitor_data` (JSONB), `ceo_analysis`, `swot_analysis`, `market_share_analysis`
- Fallback: `icp_profiles_metadata.icp_recommendation.analise_detalhada.competitiva`
- **NÃO recalcular** - apenas consumir snapshot salvo

**D) Matriz BCG (SNAPSHOT):**
- Tabela: `onboarding_sessions.step5_data` (clientes, benchmarking)
- Caminho: `session.step5_data.clientesAtuais`, `session.step5_data.empresasBenchmarking`
- Fallback: `icp_profiles_metadata.icp_recommendation.analise_detalhada.bcg`
- **NÃO recalcular** - apenas consumir dados já classificados

**E) Métricas de Produtos (SNAPSHOT):**
- Tabela: `tenant_products` (produtos do tenant)
- Tabela: `tenant_competitor_products` (produtos dos concorrentes)
- **Apenas contagem e categorias** - não recalcular matches
- Fallback: `icp_profiles_metadata.icp_recommendation.analise_detalhada.produtos`

**F) Plano Estratégico (SNAPSHOT):**
- Tabela: `strategic_action_plans` (se existir)
- Campos: `actions`, `kpis`, `risks`, `quick_wins`, `critical_decisions`, `ceo_recommendation`, `investment_summary`
- Fallback: `icp_profiles_metadata.icp_recommendation.analise_detalhada.plano_estrategico`
- **NÃO recalcular** - apenas consumir snapshot salvo

**G) Análise CEO (SNAPSHOT):**
- Tabela: `competitive_analysis.ceo_analysis` (se existir)
- Fallback: `strategic_action_plans.ceo_recommendation`
- Fallback: `icp_profiles_metadata.icp_recommendation.analise_detalhada.ceo_analysis`
- **NÃO recalcular** - apenas consumir snapshot salvo

**Função/hook existente reutilizado:**
- `supabase.from('icp_profiles_metadata').select()` (query direta)
- `supabase.from('onboarding_sessions').select()` (query direta)
- `supabase.from('competitive_analysis').select()` (query direta - se existir)
- `supabase.from('strategic_action_plans').select()` (query direta - se existir)
- `supabase.from('tenant_products').select()` (query direta - apenas contagem)
- `supabase.from('tenant_competitor_products').select()` (query direta - apenas contagem)
- `useTenant()` para obter `tenant_id`

**Confirmação de somente leitura:**
- ✅ Apenas `SELECT` - nenhuma escrita
- ✅ Consome snapshots/sínteses já calculadas
- ✅ Log: `MC1[data]: carregando modelo completo do ICP para tenant ${tenantId}`
- ✅ Log: `MC1[data]: ICP ativo = ${icpId}`
- ✅ Log: `MC1[data]: carregando snapshot competitivo`
- ✅ Log: `MC1[data]: carregando snapshot BCG`
- ✅ Log: `MC1[data]: carregando snapshot produtos`
- ✅ Log: `MC1[data]: carregando snapshot plano estratégico`
- ✅ Log: `MC1[data]: carregando snapshot análise CEO`

**Retorno (Modelo Unificado):**
```typescript
{
  // Perfil básico
  profile: {
    id: string;
    nome: string;
    descricao: string;
    tipo: string;
    setor_foco: string;
    nicho_foco: string;
    ativo: boolean;
    icp_principal: boolean;
  };
  
  // Persona e critérios
  persona: {
    decisor: string;
    dor_principal: string;
    objeções: string[];
    desejos: string[];
    stack_tech: string;
    maturidade_digital: string;
    canal_preferido: string;
    pitch: string;
    playbooks: string[];
  };
  
  // Critérios de qualificação
  criteria: {
    setores_alvo: string[];
    cnaes_alvo: string[];
    porte: string[];
    regioes_alvo: string[];
    faturamento_min: number;
    faturamento_max: number;
    funcionarios_min: number;
    funcionarios_max: number;
  };
  
  // Análise competitiva (SNAPSHOT)
  competitiveMatrix: {
    topCompetitors: Array<{
      nome: string;
      capitalSocial: number;
      ameacaPotencial: 'alta' | 'media' | 'baixa';
      produtosCount: number;
    }>;
    totalCapital: number;
    yourMarketShare: number;
    yourPosition: number;
    diferenciais: string[];
    swotAnalysis: any; // JSONB snapshot
    marketShareAnalysis: any; // JSONB snapshot
  } | null;
  
  // Matriz BCG (SNAPSHOT)
  bcgMatrix: {
    priorityNiches: Array<{
      name: string;
      growth: number;
      marketShare: number;
      type: 'niche';
    }>;
    desiredClients: Array<{
      name: string;
      growth: number;
      marketShare: number;
      revenue: number;
      type: 'client';
    }>;
    benchmarking: Array<{
      name: string;
      growth: number;
      marketShare: number;
      type: 'benchmarking';
    }>;
  } | null;
  
  // Métricas de produtos (SNAPSHOT)
  productMetrics: {
    tenantProductsCount: number;
    tenantProductsCategories: string[];
    competitorProductsCount: number;
    competitorProductsCategories: string[];
    differentials: Array<{ nome: string; categoria: string }>; // Top 5
    opportunities: Array<{ categoria: string; gap: string }>; // Top 5
    highCompetition: Array<{ categoria: string; competitorCount: number }>; // Top 3
    totalCategories: number;
  } | null;
  
  // Plano estratégico (SNAPSHOT)
  strategicPlan: {
    quickWins: string[];
    criticalDecisions: string[];
    investmentSummary: {
      shortTerm: number;
      mediumTerm: number;
      longTerm: number;
    };
    actions: Array<{
      title: string;
      status: string;
      priority: string;
      timeframe: string;
    }>; // Top 5
  } | null;
  
  // Análise CEO (SNAPSHOT)
  CEOAnalysis: {
    recommendation: string | null;
    keyInsights: string[];
  } | null;
  
  // Estados
  isLoading: boolean;
  error: Error | null;
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

### 🟢 FRONT-END / COMPONENTES DE UI / PÁGINAS

#### 3. `src/pages/CentralICP/ActiveICPProfile.tsx` (NOVO)
**Objetivo:** Página principal do ICP ativo com resumo executivo unificado

**Dados que vai CONSUMIR:**
- Hook: `useTenantICP()` - Modelo completo do ICP

**Função/hook existente reutilizado:**
- Hook `useTenantICP()` (criado acima)
- Componentes de UI existentes: `Card`, `Badge`, `Button`, `Tabs`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita
- ✅ Log: `MC1[ui]: ICP ativo exibido = ${icpId}`
- ✅ Log: `MC1[ui]: modelo completo carregado para ICP ${icpId}`

**Estrutura:**
- Header com nome do ICP
- Componente `ICPExecutiveSummary` (resumo executivo unificado)
- Bloco de insights competitivos (top 3 concorrentes, diferenciais)
- Bloco de highlights BCG (nichos prioritários, clientes desejados)
- Bloco de highlights de produtos (diferenciais, oportunidades, alta concorrência)
- Bloco de highlights do plano estratégico (quick wins, decisões críticas, investimento)
- Bloco de análise CEO (recomendação principal)
- Link para ver completo (`/central-icp/profile/:id`)

---

#### 4. `src/pages/CentralICP/ICPLibrary.tsx` (NOVO)
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

#### 5. `src/components/icp/ICPExecutiveSummary.tsx` (NOVO - ÚNICO COMPONENTE)
**Objetivo:** Componente de resumo executivo unificado do ICP

**Dados que vai CONSUMIR:**
- Props: `icp: TenantICPModel` - Modelo completo do ICP (retornado por `useTenantICP()`)

**Função/hook existente reutilizado:**
- Componentes de UI existentes: `Card`, `Badge`, `Separator`, etc.

**Confirmação de somente leitura:**
- ✅ Apenas exibição - nenhuma escrita

**Estrutura:**
- **Seção 1: Perfil Básico**
  - Nome, setor, nicho
  - Tipo, status, data de criação

- **Seção 2: Persona e Critérios**
  - Persona decisora
  - Dor principal
  - Objeções (top 3)
  - Desejos (top 3)
  - Stack tech, maturidade digital
  - Canais preferidos, playbooks

- **Seção 3: Análise Competitiva (Resumo)**
  - Top 3 concorrentes
  - Principais diferenciais
  - Posição no mercado
  - Link para ver completo

- **Seção 4: Matriz BCG (Resumo)**
  - Nichos prioritários (top 3)
  - Clientes desejados (top 3)
  - Link para ver completo

- **Seção 5: Métricas de Produtos (Resumo)**
  - Principais diferenciais (top 5)
  - Oportunidades de expansão (top 5)
  - Alta concorrência (top 3)
  - Cobertura total
  - Link para ver completo

- **Seção 6: Plano Estratégico (Resumo)**
  - Quick wins (top 3)
  - Decisões críticas (top 3)
  - Investimento total estimado
  - Link para ver completo

- **Seção 7: Análise CEO (Resumo)**
  - Recomendação principal
  - Insights chave
  - Link para ver completo

---

### 🟡 ROTAS / SIDEBAR / NAVEGAÇÃO

#### 6. `src/App.tsx` (MODIFICAR)
**Objetivo:** Adicionar rotas para ICP ativo e biblioteca

**Modificações:**
- Adicionar rota: `/central-icp/profile-active` → `ActiveICPProfile`
- Adicionar rota: `/central-icp/library` → `ICPLibrary`

**Confirmação:**
- ✅ Apenas adicionar rotas - não alterar rotas existentes
- ✅ Usar lazy loading se aplicável

---

#### 7. `src/components/layout/AppSidebar.tsx` (MODIFICAR)
**Objetivo:** Adicionar itens na sidebar para ICP ativo e biblioteca

**Modificações:**
- Adicionar item "ICP Ativo" no grupo "Configuração ICP"
- Adicionar item "Biblioteca de ICPs" no grupo "Configuração ICP"

**Confirmação:**
- ✅ Apenas adicionar itens - não alterar itens existentes
- ✅ Manter estrutura existente

---

## 📋 RESUMO DE ARQUIVOS (REVISADO)

### Arquivos NOVOS (4):
1. `src/hooks/useTenantICP.ts` - **HOOK UNIFICADO** (modelo completo do ICP)
2. `src/hooks/useICPLibrary.ts` - Biblioteca de ICPs
3. `src/pages/CentralICP/ActiveICPProfile.tsx` - Página do ICP ativo
4. `src/pages/CentralICP/ICPLibrary.tsx` - Página da biblioteca
5. `src/components/icp/ICPExecutiveSummary.tsx` - **COMPONENTE ÚNICO** (resumo executivo unificado)

### Arquivos MODIFICADOS (2):
6. `src/App.tsx` (adicionar rotas)
7. `src/components/layout/AppSidebar.tsx` (adicionar itens)

**Total: 5 arquivos novos + 2 modificados = 7 arquivos**

---

## 📊 MAPEAMENTO DE FONTES DE DADOS (SNAPSHOTS)

### Onde os dados estão salvos:

| Bloco de Inteligência | Fonte Primária | Fonte Secundária (Fallback) | Tipo |
|----------------------|----------------|----------------------------|------|
| **Perfil Básico** | `icp_profiles_metadata` | - | Tabela |
| **Persona/Critérios** | `onboarding_sessions.step1_data`, `step3_data` | `icp_profiles_metadata.icp_recommendation.icp_profile` | JSONB |
| **Análise Competitiva** | `competitive_analysis` | `icp_profiles_metadata.icp_recommendation.analise_detalhada.competitiva` | Tabela/JSONB |
| **Matriz BCG** | `onboarding_sessions.step5_data` | `icp_profiles_metadata.icp_recommendation.analise_detalhada.bcg` | JSONB |
| **Métricas de Produtos** | `tenant_products`, `tenant_competitor_products` (contagem) | `icp_profiles_metadata.icp_recommendation.analise_detalhada.produtos` | Tabelas/JSONB |
| **Plano Estratégico** | `strategic_action_plans` | `icp_profiles_metadata.icp_recommendation.analise_detalhada.plano_estrategico` | Tabela/JSONB |
| **Análise CEO** | `competitive_analysis.ceo_analysis` OU `strategic_action_plans.ceo_recommendation` | `icp_profiles_metadata.icp_recommendation.analise_detalhada.ceo_analysis` | Tabela/JSONB |

---

## ✅ CONFIRMAÇÕES FINAIS

### Todas as operações são SOMENTE LEITURA:
- ✅ Nenhum `INSERT`, `UPDATE`, `DELETE`
- ✅ Apenas `SELECT` / `GET`
- ✅ Consome snapshots/sínteses já calculadas
- ✅ Nenhuma alteração em componentes existentes de inteligência
- ✅ Nenhum recálculo de análises

### Logs implementados:
- ✅ `MC1[data]: ...` - Logs de carregamento de dados
- ✅ `MC1[ui]: ...` - Logs de interações na UI
- ✅ Logs específicos para cada snapshot carregado

### Arquitetura unificada:
- ✅ **1 hook único** `useTenantICP()` - ponto central de auditoria
- ✅ **1 componente único** `ICPExecutiveSummary` - visão unificada
- ✅ **Modelo completo** retornado de uma vez - não fragmentado
- ✅ **Snapshots consumidos** - não dados brutos recalculados

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
- ❌ Fragmentar dados em múltiplos hooks

### ✅ PODE FAZER:
- ✅ Criar 1 hook unificado de leitura
- ✅ Criar 1 componente de resumo executivo
- ✅ Adicionar novas rotas
- ✅ Adicionar itens na sidebar
- ✅ Consumir snapshots/sínteses já calculadas
- ✅ Reutilizar lógica existente (sem alterar componentes originais)

---

## 🎯 VANTAGENS DA ARQUITETURA UNIFICADA

1. **Unidade Intelectual:** ICP é tratado como uma tese única, não fragmentada
2. **Ponto Único de Auditoria:** `useTenantICP()` é o único lugar para verificar conexão de dados
3. **Redução de Risco:** 1 hook = 1 ponto de falha (vs 6 hooks = 6 pontos)
4. **Núcleo Central:** Hook central que força entendimento do ICP como modelo estratégico
5. **Testabilidade:** Fácil testar se os dados estão realmente conectados
6. **Manutenibilidade:** Mudanças futuras em um único lugar

---

**Status:** 📝 **PLANEJAMENTO REVISADO COMPLETO - AGUARDANDO APROVAÇÃO**

**Próxima Etapa:** Após aprovação, executar ETAPA 2 - Implementação do MC1

