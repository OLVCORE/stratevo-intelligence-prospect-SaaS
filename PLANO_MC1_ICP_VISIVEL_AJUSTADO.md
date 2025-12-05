# 📋 PLANO MC1 - ICP VISÍVEL (AJUSTADO)

**Data:** 2025-01-22  
**Status:** 📝 **AGUARDANDO APROVAÇÃO**

---

## 🎯 OBJETIVO DO MC1 (AJUSTADO)

**IMPORTANTE:** MC1 **NÃO CRIA** um novo ICP. MC1 **APENAS EXIBE** o ICP que já existe no sistema, incluindo sua **camada completa de inteligência mercadológica**.

Criar um painel "ICP – Perfil Ideal" que:
- Leia os dados do ICP já criado pelo fluxo existente (`tenant-onboarding` + `central-icp/profile/:id`)
- Exiba o retrato vivo COMPLETO do ICP ativo para o tenant atual
- **Consuma e exiba a inteligência mercadológica já calculada** (BCG, produtos, competitiva, SWOT, plano)
- Mostre isso em uma rota clara e acessível
- Garanta que o ICP exibido seja o MESMO usado pelo motor de qualificação

**🧠 CAMADA DE INTELIGÊNCIA MERCADOLÓGICA:**

O ICP não é apenas um cadastro. É um **motor completo de inteligência de mercado** com módulos complexos que **JÁ EXISTEM e FUNCIONAM**:

- **Aba Critérios:** Análise macroeconômica, setores, CNAEs, estatística, competitiva, tendências, projeções, comércio exterior
- **Aba 360°:** Análise multidimensional
- **Aba Competitiva:** Matriz BCG, perfil financeiro, mapa geográfico, diferenciais, concorrentes diretos, mapa competitivo do Brasil, SWOT/SACT, descobrir concorrentes automaticamente
- **Métricas de Produtos:** 254 produtos, 19 categorias, tabela comparativa, diferenciais, alta concorrência, oportunidades, mapa de calor, análise estratégica de IA
- **Aba Plano:** Plano estratégico de ação (curto, médio, longo prazo) baseado em capital social
- **Aba Análise CEO:** Recomendações estratégicas geradas por IA

**MC1 deve CONSUMIR esses dados já calculados, não recalcular nem simplificar.**

---

## ✅ PRINCÍPIOS FUNDAMENTAIS

### ❌ MC1 NÃO FAZ:
- ❌ Criar novo modelo de ICP
- ❌ Duplicar schema ou tabela
- ❌ Alterar motor de qualificação
- ❌ Alterar ICP Engine
- ❌ Mudar estoque/quarentena/pipeline
- ❌ Criar novo fluxo de onboarding
- ❌ **Alterar módulos de inteligência mercadológica** (BCG, CompetitiveAnalysis, ProductComparisonMatrix, StrategicActionPlan)
- ❌ **Recalcular análises** (produtos, categorias, mapas, benchmarks)
- ❌ **Simplificar** análises complexas para poucos campos
- ❌ **Remover integrações** existentes (APIs, scraping, IA)

### ✅ MC1 APENAS FAZ:
- ✅ Lê dados de `icp_profiles_metadata`
- ✅ Identifica ICP ativo (campo `ativo` ou `icp_principal`)
- ✅ **Consome dados já calculados** pela camada de inteligência
- ✅ **Exibe resumos executivos** dos módulos complexos
- ✅ Exibe dados em formato visual consolidado
- ✅ Cria rota de visualização
- ✅ Adiciona item na sidebar
- ✅ **Orquestra módulos existentes** sem alterá-los

---

## 📍 1. ONDE INSERIR

### 1.1 Nova Rota
**Rota:** `/central-icp/profile-active`  
**Componente:** `src/pages/CentralICP/ActiveICPProfile.tsx` (NOVO)

**Alternativa (Reutilizar rota existente):**
- Usar `/central-icp/profile/:id` com lógica para detectar ICP ativo
- Criar alias `/central-icp/active` que redireciona para o ICP ativo

**Decisão:** Criar rota nova para clareza e simplicidade.

---

### 1.2 Sidebar
**Arquivo:** `src/components/layout/AppSidebar.tsx`

**Onde adicionar:**
- Grupo "Configuração ICP"
- Novo item: "ICP Ativo" ou "Perfil Ideal"
- URL: `/central-icp/profile-active`

---

## 📋 2. ELEMENTOS DO PAINEL

### 2.1 Dados a Exibir (Baseado no ICP Existente)

**Dados Básicos:**
- ✅ Nome do ICP (`nome`)
- ✅ Descrição (`descricao`)
- ✅ Setor (`setor_foco`)
- ✅ Subsetor/Nicho (`nicho_foco`)

**Dados de Qualificação:**
- ✅ CNAEs Alvo (`target_cnaes` do metadata)
- ✅ CNAEs Excluídos (`excluded_cnaes` do metadata)
- ✅ Porte (`target_porte` do metadata)
- ✅ Região (`target_ufs`, `target_cidades` do metadata)
- ✅ Capital Social (`target_capital_min/max` do metadata)

**Dados de Persona:**
- ✅ Decisor (`persona_decisor` do metadata)
- ✅ Dor Principal (`dor_principal` do metadata)
- ✅ Objeções (`objeções` do metadata - array)
- ✅ Desejos (`desejos` do metadata - array)

**Dados de Stack e Maturidade:**
- ✅ Stack Tech (`stack_tech` do metadata)
- ✅ Maturidade Digital (`maturidade_digital` do metadata)

**Dados de Comunicação:**
- ✅ Canal Preferido (`canal_preferido` do metadata)
- ✅ Pitch (`pitch` do metadata)

**Dados de Playbooks:**
- ✅ Playbooks Recomendados (`playbooks_recomendados` do metadata - array)

**🧠 INTELIGÊNCIA MERCADOLÓGICA (Consumir Dados Já Calculados):**

**Análise Competitiva (Resumo Executivo):**
- ✅ Top 3 Concorrentes (maior capital social, maior ameaça)
- ✅ Principais Diferenciais Competitivos
- ✅ Oportunidades Identificadas
- ✅ Mapa Competitivo (resumo geográfico)
- **Fonte:** `CompetitiveAnalysis` component (consumir dados já calculados)

**Matriz BCG (Resumo Executivo):**
- ✅ Nichos Prioritários (Stars, Cash Cows)
- ✅ Clientes Desejados (baseado em benchmarking)
- ✅ Priorização Estratégica
- **Fonte:** `BCGMatrix` component (consumir dados já calculados)

**Métricas de Produtos (Resumo Executivo):**
- ✅ Principais Diferenciais (top 5 produtos únicos)
- ✅ Oportunidades de Expansão (top 5 gaps)
- ✅ Alta Concorrência (top 3 categorias)
- ✅ Cobertura Total (254 produtos, 19 categorias)
- **Fonte:** `ProductComparisonMatrix` component (consumir dados já calculados)

**Plano Estratégico (Resumo Executivo):**
- ✅ Quick Wins (curto prazo)
- ✅ Decisões Críticas
- ✅ Investimento Total Estimado
- **Fonte:** `StrategicActionPlan` component (consumir dados já calculados)

**Dados Adicionais (se disponíveis):**
- ✅ Exemplos de ICP Real (buscar empresas aprovadas com score alto)
- ✅ Pontos Fortes (derivado dos dados)
- ✅ Pontos Fracos (derivado dos dados)

---

## 🔧 3. IMPLEMENTAÇÃO PASSO A PASSO

### Passo 1: Criar Hook para Buscar ICP Ativo
**Arquivo:** `src/hooks/useActiveICP.ts` (NOVO)

```typescript
export function useActiveICP() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ['active-icp', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Tentar buscar por ativo = true
      let { data } = await supabase
        .from('icp_profiles_metadata')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('ativo', true)
        .maybeSingle();

      // Se não encontrar, tentar icp_principal = true
      if (!data) {
        ({ data } = await supabase
          .from('icp_profiles_metadata')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('icp_principal', true)
          .maybeSingle());
      }

      // Se ainda não encontrar, usar o mais recente
      if (!data) {
        ({ data } = await supabase
          .from('icp_profiles_metadata')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle());
      }

      return data;
    },
    enabled: !!tenantId,
  });
}
```

---

### Passo 2: Criar Componente da Página
**Arquivo:** `src/pages/CentralICP/ActiveICPProfile.tsx` (NOVO)

**Estrutura:**
```typescript
export default function ActiveICPProfile() {
  const { data: icp, isLoading, error } = useActiveICP();
  const navigate = useNavigate();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState />;
  if (!icp) return <NoICPState />;

  return (
    <div className="p-6">
      <Header icp={icp} />
      <ICPBasicInfo icp={icp} />
      <ICPQualificationCriteria icp={icp} />
      <ICPPersona icp={icp} />
      <ICPStackAndMaturity icp={icp} />
      <ICPCommunication icp={icp} />
      <ICPPlaybooks icp={icp} />
      
      {/* 🧠 INTELIGÊNCIA MERCADOLÓGICA - Resumos Executivos */}
      <ICPCompetitiveInsights icpId={icp.id} />
      <ICPBCGHighlights icpId={icp.id} />
      <ICPProductHighlights icpId={icp.id} />
      <ICPStrategicPlanHighlights icpId={icp.id} />
      
      <ICPExamples icp={icp} />
      <Actions icp={icp} />
    </div>
  );
}
```

**⚠️ IMPORTANTE:** Componentes de inteligência mercadológica devem **consumir dados já calculados**, não recalcular.

---

### Passo 3: Criar Componentes de Exibição
**Arquivos:**
- `src/components/icp/ICPBasicInfoCard.tsx` (NOVO)
- `src/components/icp/ICPQualificationCard.tsx` (NOVO)
- `src/components/icp/ICPPersonaCard.tsx` (NOVO)
- `src/components/icp/ICPStackCard.tsx` (NOVO)
- `src/components/icp/ICPCommunicationCard.tsx` (NOVO)
- `src/components/icp/ICPPlaybooksCard.tsx` (NOVO)

**🧠 Componentes de Inteligência Mercadológica (Resumos Executivos):**
- `src/components/icp/ICPCompetitiveInsights.tsx` (NOVO)
  - Consome dados de `CompetitiveAnalysis`
  - Exibe: top 3 concorrentes, principais diferenciais, oportunidades
- `src/components/icp/ICPBCGHighlights.tsx` (NOVO)
  - Consome dados de `BCGMatrix`
  - Exibe: nichos prioritários, clientes desejados
- `src/components/icp/ICPProductHighlights.tsx` (NOVO)
  - Consome dados de `ProductComparisonMatrix`
  - Exibe: principais diferenciais, oportunidades, alta concorrência
- `src/components/icp/ICPStrategicPlanHighlights.tsx` (NOVO)
  - Consome dados de `StrategicActionPlan`
  - Exibe: quick wins, decisões críticas, investimento estimado

**⚠️ REGRA CRÍTICA:**
- ✅ **Apenas consumir** dados já calculados
- ✅ **Não recalcular** análises
- ✅ **Não alterar** componentes existentes
- ✅ **Reutilizar** lógica de busca de dados dos componentes originais

---

### Passo 4: Adicionar Rota
**Arquivo:** `src/App.tsx`

```typescript
const ActiveICPProfile = lazy(() => import("./pages/CentralICP/ActiveICPProfile"));

// Dentro de Routes:
<Route
  path="/central-icp/profile-active"
  element={
    <ProtectedRoute>
      <AppLayout>
        <ActiveICPProfile />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

---

### Passo 5: Adicionar Item na Sidebar
**Arquivo:** `src/components/layout/AppSidebar.tsx`

**Onde:** Grupo "Configuração ICP"

```typescript
{
  label: "Configuração ICP",
  icon: Target,
  items: [
    {
      title: "Central ICP",
      icon: Target,
      url: "/central-icp",
      // ... submenu existente
    },
    {
      title: "ICP Ativo", // NOVO
      icon: CheckCircle2,
      url: "/central-icp/profile-active",
      description: "Visualizar perfil do ICP ativo",
      highlighted: true, // Destacar
    },
  ]
}
```

---

### Passo 6: Conectar com Edição
**Ação:** Adicionar botão "Editar ICP" que redireciona para `/central-icp/profile/:id`

```typescript
<Button onClick={() => navigate(`/central-icp/profile/${icp.id}`)}>
  <Edit className="h-4 w-4 mr-2" />
  Editar ICP
</Button>
```

---

## 🎨 4. DESIGN DO PAINEL

### 4.1 Layout Proposto

```
┌─────────────────────────────────────────────────┐
│  ICP – Perfil Ideal                    [Editar] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Dados Básicos                            │  │
│  │ Nome: [Nome do ICP]                      │  │
│  │ Setor: [Setor]                           │  │
│  │ Nicho: [Nicho]                           │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Critérios de Qualificação                │  │
│  │ CNAEs: [Lista]                           │  │
│  │ Porte: [Lista]                           │  │
│  │ Região: [Lista]                          │  │
│  │ Capital: [Faixa]                         │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Persona do Decisor                       │  │
│  │ Perfil: [Descrição]                      │  │
│  │ Dor: [Descrição]                         │  │
│  │ Objeções: [Lista]                        │  │
│  │ Desejos: [Lista]                         │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Stack Tech & Maturidade                  │  │
│  │ Stack: [Lista]                           │  │
│  │ Maturidade: [Score]                      │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ Comunicação & Playbooks                  │  │
│  │ Canal: [Canal]                           │  │
│  │ Pitch: [Texto]                           │  │
│  │ Playbooks: [Lista]                       │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ 5. VALIDAÇÕES E TESTES

### 5.1 Casos de Teste

**CT1: ICP Ativo Existe**
- ✅ Deve exibir todos os dados do ICP
- ✅ Deve mostrar botão "Editar ICP"
- ✅ Deve permitir navegação para edição

**CT2: Múltiplos ICPs (ativo = true)**
- ✅ Deve exibir o mais recente
- ✅ Deve mostrar aviso se houver múltiplos ativos

**CT3: Nenhum ICP Ativo**
- ✅ Deve exibir mensagem "Nenhum ICP ativo"
- ✅ Deve oferecer link para criar ICP
- ✅ Deve redirecionar para onboarding se não houver ICPs

**CT4: ICP Sem Dados Completos**
- ✅ Deve exibir campos disponíveis
- ✅ Deve mostrar "Não informado" para campos vazios
- ✅ Deve oferecer link para completar dados

---

## 📊 6. MÉTRICAS DE SUCESSO

- ✅ Painel exibe ICP ativo corretamente
- ✅ Dados são lidos de `icp_profiles_metadata` (não criados)
- ✅ Rota `/central-icp/profile-active` funciona
- ✅ Item na sidebar está visível
- ✅ Botão "Editar" redireciona corretamente
- ✅ Não há alterações no motor de qualificação
- ✅ Não há alterações no ICP Engine
- ✅ Build passa sem erros

---

## ⚠️ 7. RISCOS E MITIGAÇÕES

### Risco 1: ICP Ativo Não Identificado
**Mitigação:** Usar fallback (ativo → principal → mais recente)

### Risco 2: Dados Incompletos
**Mitigação:** Exibir campos disponíveis, mostrar "Não informado" para vazios

### Risco 3: Performance (múltiplas queries)
**Mitigação:** Usar React Query com cache, fazer queries em paralelo

---

## 🎯 8. ENTREGAS DO MC1

1. ✅ Hook `useActiveICP` criado
2. ✅ Página `ActiveICPProfile.tsx` criada
3. ✅ Componentes de exibição criados
4. ✅ Rota `/central-icp/profile-active` adicionada
5. ✅ Item na sidebar adicionado
6. ✅ Conectado com edição existente
7. ✅ Testes realizados
8. ✅ Documentação atualizada

---

## 📝 9. PRÓXIMOS PASSOS (APÓS MC1)

1. **MC2:** Seleção de ICP antes do upload
2. **MC3:** Distribuição estatística
3. **MC4:** Unificação sidebar

---

**Status:** 📝 **PLANO COMPLETO - AGUARDANDO APROVAÇÃO**

**Próxima Ação:** Aguardar aprovação antes de executar qualquer código.

