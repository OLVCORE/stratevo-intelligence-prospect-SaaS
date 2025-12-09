# 📋 RELATÓRIO MC5 – UI SPECS (Match & Fit Dashboard)

**Data:** 2025-01-27  
**Microciclo:** MC5 - Dashboard UI Match & Fit  
**Status:** ✅ **ESPECIFICAÇÃO COMPLETA**

---

## 🎯 OBJETIVO

Criar o **Dashboard UI STRATEVO One** para visualizar o resultado `matchFit` gerado pelo MC4, sem alterar nenhuma funcionalidade anterior.

---

## 📊 JSON ESPERADO

### Estrutura do `matchFit` (vindo do MC4)

```typescript
interface MatchFitResult {
  scores: MatchScore[];
  recommendations: MatchRecommendation[];
  executiveSummary: string;
  metadata: {
    totalIcpEvaluated: number;
    totalProductsEvaluated: number;
    bestFitScore: number;
    bestFitType: 'icp' | 'product' | 'none';
    dataCompleteness: 'complete' | 'partial' | 'insufficient';
    missingData: string[];
  };
}

interface MatchScore {
  referenceType: 'icp' | 'product';
  referenceId: string;
  referenceName: string;
  score: number; // 0-100
  factors: string[];
  breakdown?: {
    sectorMatch?: number;
    cnaeMatch?: number;
    sizeMatch?: number;
    regionMatch?: number;
    painMatch?: number;
    interestMatch?: number;
  };
}

interface MatchRecommendation {
  title: string;
  description: string;
  solutionType: 'product' | 'category' | 'service';
  solutionName: string;
  solutionCategory?: string;
  risksOfNotActing: string[];
  nextAction: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  relatedScore?: MatchScore;
}
```

---

## 🧩 PROPS DOS COMPONENTES

### `MatchFitDashboard`

```typescript
interface MatchFitDashboardProps {
  matchFit: MatchFitResult | null | undefined;
}
```

**Comportamento:**
- Se `matchFit` for `null` ou `undefined`: exibe mensagem "Match & Fit em processamento…"
- Se `matchFit` existir: renderiza componentes filhos

---

### `ScoreRadar`

```typescript
interface ScoreRadarProps {
  scores: MatchScore[];
}
```

**Comportamento:**
- Se `scores` for vazio ou `null`: retorna `null`
- Se houver scores: renderiza gráfico radar SVG

**Especificações do Radar:**
- Tamanho: 300x300px
- Centro: 150, 150
- Raio máximo: 120px
- Cada score representa um eixo
- Score 0-100 mapeado para raio 0-120px
- Cores: azul (rgba(37,99,235,0.3) para preenchimento, #2563eb para borda)

---

### `RecommendationList`

```typescript
interface RecommendationListProps {
  recommendations: MatchRecommendation[];
}
```

**Comportamento:**
- Se `recommendations` for vazio ou `null`: retorna `null`
- Se houver recomendações: renderiza lista de cards

**Estrutura de cada card:**
- Título (bold)
- Descrição
- Lista de riscos
- Próxima ação
- Badges de prioridade e impacto

---

## 🎨 LAYOUT TEXTUAL

```
┌─────────────────────────────────────────────────────────┐
│  STRATEVO One — Match & Fit                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [ScoreRadar - SVG 300x300]                             │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Recomendações                                           │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐ │
│  │ Recomendação: ERP Industrial Modular             │ │
│  │                                                     │ │
│  │ Fit identificado: Setor "Indústria" é alvo...    │ │
│  │                                                     │ │
│  │ Risco: Alto fit indica oportunidade de alto valor │ │
│  │ Próxima ação: Agendar reunião de apresentação...  │ │
│  │                                                     │ │
│  │ [Prioridade: high] [Impacto: high]                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Fit com ICP: ICP Principal                        │ │
│  │ ...                                                │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Resumo Executivo                                        │
├─────────────────────────────────────────────────────────┤
│  Análise de Match & Fit identificou 3 alinhamentos...   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 INTERAÇÃO DOS COMPONENTES

### Fluxo de Dados

```
generate-company-report (Edge Function)
  ↓
  Retorna JSON com campo matchFit
  ↓
CompanyReport.tsx (Componente React)
  ↓
  Extrai report.matchFit
  ↓
MatchFitDashboard (Componente Principal)
  ↓
  ├─ ScoreRadar (recebe matchFit.scores)
  │   └─ Renderiza SVG radar
  │
  ├─ RecommendationList (recebe matchFit.recommendations)
  │   └─ Renderiza lista de cards
  │
  └─ Resumo Executivo (recebe matchFit.executiveSummary)
      └─ Renderiza texto
```

### Estados

1. **Carregando:** `matchFit === null` → "Match & Fit em processamento…"
2. **Vazio:** `matchFit.scores.length === 0` → Componentes retornam `null`
3. **Com dados:** Renderiza todos os componentes

---

## ⚠️ LIMITAÇÕES

1. **Radar SVG:**
   - Máximo recomendado: 8 scores (mais que isso pode ficar confuso)
   - Se houver mais scores, mostrar apenas top 8

2. **Recomendações:**
   - Máximo exibido: top 5 (já filtrado pelo engine)
   - Se não houver recomendações, não exibe nada

3. **Performance:**
   - SVG é renderizado no cliente (leve)
   - Sem animações complexas
   - Sem dependências externas

---

## 🔒 SEGURANÇA

1. **Validação de Props:**
   - Todos os componentes validam props antes de renderizar
   - Tratamento de `null`/`undefined` em todos os níveis

2. **XSS Prevention:**
   - React escapa automaticamente strings
   - Não usa `dangerouslySetInnerHTML`

3. **Isolamento:**
   - Componentes são puros (sem side effects)
   - Não acessam dados de outros tenants
   - Dados vêm do relatório já isolado por tenant

---

## ✅ ZERO REGRESSÃO

### Garantias

1. **Não modifica:**
   - Engines (MC1-MC4)
   - Edge functions
   - Schema Supabase
   - Fluxo de relatórios existente

2. **Apenas adiciona:**
   - Componentes React novos
   - Visualização do campo `matchFit` já existente
   - Sem alterar lógica de negócio

3. **Compatibilidade:**
   - Se `matchFit` não existir, não quebra
   - Se `matchFit` estiver vazio, exibe mensagem apropriada
   - Não interfere com outros componentes do relatório

---

## 📝 NOTAS TÉCNICAS

### Tecnologias

- **React:** Componentes funcionais
- **Tailwind CSS:** Estilização
- **SVG:** Gráfico radar (sem libs externas)
- **TypeScript:** Tipagem completa

### Dependências

- Nenhuma dependência nova necessária
- Usa apenas React e Tailwind já presentes no projeto

### Acessibilidade

- SVG com labels textuais
- Contraste adequado (cores Tailwind padrão)
- Estrutura semântica HTML

---

## 🎯 CONCLUSÃO

**Especificação completa para implementação do MC5.**

**Pronto para desenvolvimento dos componentes.**

---

**Status:** ✅ **ESPECIFICAÇÃO APROVADA**

