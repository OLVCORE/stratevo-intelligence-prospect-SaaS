# 📊 PLANO COMPLETO: Barras de Progresso Personalizadas por Tab

## 🎯 OBJETIVO

Criar barra de progresso específica para cada tab do relatório, mostrando fases reais e evidências encontradas.

---

## 📋 ESTRUTURA POR TAB

### 1️⃣ TAB TOTVS CHECK (70 fontes)

**Fases Reais (Backend):**
```typescript
const PHASES_TOTVS = [
  { 
    id: 'job_portals', 
    name: 'Portais de Vagas', 
    count: 4, // LinkedIn Jobs, Indeed, Gupy, LinkedIn Posts
    sources: ['linkedin.com/jobs', 'indeed.com.br', 'gupy.io', 'linkedin.com/posts'],
    estimatedTime: 15 
  },
  { 
    id: 'totvs_cases', 
    name: 'Cases Oficiais TOTVS', 
    count: 3, // totvs.com/blog, totvs.com/cases, totvs.com/noticias
    sources: ['totvs.com/blog', 'totvs.com/cases', 'totvs.com/noticias'],
    estimatedTime: 8 
  },
  { 
    id: 'official_sources', 
    name: 'Fontes Oficiais', 
    count: 10, // CVM, B3, TJSP, etc.
    sources: ['cvm.gov.br', 'b3.com.br', 'tjsp.jus.br', ...],
    estimatedTime: 10 
  },
  { 
    id: 'premium_news', 
    name: 'Notícias Premium', 
    count: 29, // Valor, Exame, InfoMoney, etc.
    sources: ['valor.globo.com', 'exame.com', 'infomoney.com.br', ...],
    estimatedTime: 12 
  },
  { 
    id: 'tech_portals', 
    name: 'Portais Tech', 
    count: 7, // Baguete, CIO, TI Inside, etc.
    sources: ['baguete.com.br', 'cio.com.br', 'tiinside.com.br', ...],
    estimatedTime: 8 
  },
  { 
    id: 'video_content', 
    name: 'Vídeos', 
    count: 2, // YouTube, Vimeo
    sources: ['youtube.com', 'vimeo.com'],
    estimatedTime: 5 
  },
  { 
    id: 'social_media', 
    name: 'Redes Sociais', 
    count: 3, // Instagram, Facebook, LinkedIn Posts
    sources: ['instagram.com', 'facebook.com', 'linkedin.com/posts'],
    estimatedTime: 5 
  },
  { 
    id: 'totvs_partners', 
    name: 'Parceiros TOTVS', 
    count: 1, // Fusion
    sources: ['fusion.totvs.com'],
    estimatedTime: 3 
  },
  { 
    id: 'google_news', 
    name: 'Google News', 
    count: 1,
    sources: ['news.google.com'],
    estimatedTime: 5 
  },
];
```

**Features:**
- ✅ Popup ao finalizar cada etapa com número de evidências encontradas
- ✅ Dropdown clicável para ver detalhes de cada etapa
- ✅ Total de evidências ao final
- ✅ Contador de evidências por fase em tempo real

---

### 2️⃣ TAB COMPETITORES (15+ concorrentes, 8 fases)

**Fases Reais (Backend):**
```typescript
const PHASES_COMPETITORS = [
  { 
    id: 'job_portals', 
    name: 'Portais de Vagas', 
    count: 4,
    estimatedTime: 15 
  },
  { 
    id: 'competitor_cases', 
    name: 'Cases Concorrentes', 
    count: 5, // Omie, Senior, Conta Azul, Bling, Sankhya
    estimatedTime: 8 
  },
  { 
    id: 'official_sources', 
    name: 'Fontes Oficiais', 
    count: 10,
    estimatedTime: 10 
  },
  { 
    id: 'premium_news', 
    name: 'Notícias Premium', 
    count: 27,
    estimatedTime: 12 
  },
  { 
    id: 'tech_portals', 
    name: 'Portais Tech', 
    count: 7,
    estimatedTime: 8 
  },
  { 
    id: 'video_content', 
    name: 'Vídeos', 
    count: 2,
    estimatedTime: 5 
  },
  { 
    id: 'social_media', 
    name: 'Redes Sociais', 
    count: 3,
    estimatedTime: 5 
  },
  { 
    id: 'google_news', 
    name: 'Google News', 
    count: 1,
    estimatedTime: 5 
  },
];
```

**Progresso por Concorrente:**
```typescript
// 15+ Concorrentes: Omie, Senior, Conta Azul, Bling, Sankhya, vhsys, Tiny, 
// GestãoClick, WebMais, Linx, RD Station, RD CRM, Pipedrive, Salesforce, HubSpot, etc.
interface CompetitorProgress {
  competitorName: string;
  currentPhase: string;
  evidencesFound: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}
```

**Features:**
- ✅ Barra geral com 8 fases
- ✅ Contador de concorrentes processados: "Processando: Omie (1/15 concorrentes)"
- ✅ Evidências encontradas por concorrente
- ✅ Queries melhoradas com TODOS os produtos do concorrente

**Processamento:**
- ✅ **SEQUENCIAL** (recomendado para evitar timeout/custo alto)
- ✅ Processar 1 concorrente por vez com todas as fases
- ✅ Mostrar progresso: "Concorrente 1/15: Omie - Fase 3/8"

---

### 3️⃣ TAB DIGITAL INTELLIGENCE (4 fases)

**Fases Reais (Backend - digital-intelligence-analysis):**
```typescript
const PHASES_DIGITAL = [
  { 
    id: 'website_analysis', 
    name: 'Análise de Website', 
    count: 1, // Website oficial
    estimatedTime: 10 
  },
  { 
    id: 'social_media', 
    name: 'Redes Sociais', 
    count: 5, // LinkedIn, Instagram, Facebook, Twitter, YouTube
    estimatedTime: 15 
  },
  { 
    id: 'ai_analysis', 
    name: 'Análise IA', 
    count: 50, // URLs analisadas (50-100)
    estimatedTime: 30 
  },
  { 
    id: 'insights_generation', 
    name: 'Geração de Insights', 
    count: 1,
    estimatedTime: 5 
  },
];
```

**Features:**
- ✅ Mostrar URLs analisadas: "Analisando URL 25/50..."
- ✅ Sinais de compra detectados em tempo real
- ✅ Temperatura (Hot/Warm/Cold) por URL

---

### 4️⃣ TAB DECISORES (4 fases)

**Fases Reais (Backend - enrich-apollo-decisores):**
```typescript
const PHASES_DECISORES = [
  { 
    id: 'apollo_search', 
    name: 'Busca Apollo', 
    count: 1, // Apollo API
    estimatedTime: 10 
  },
  { 
    id: 'linkedin_analysis', 
    name: 'Análise LinkedIn', 
    count: 10, // PhantomBuster (até 10 decisores)
    estimatedTime: 30 
  },
  { 
    id: 'enrichment', 
    name: 'Enriquecimento', 
    count: 10, // Email, telefone, dados corporativos
    estimatedTime: 15 
  },
  { 
    id: 'classification', 
    name: 'Classificação', 
    count: 10, // Decision-maker, Influencer, User
    estimatedTime: 5 
  },
];
```

**Features:**
- ✅ Decisores encontrados: "5 decision-makers, 3 influencers, 2 users"
- ✅ Progresso por decisor: "Enriquecendo: João Silva (3/10)"

---

### 5️⃣ TAB RECOMMENDED PRODUCTS (4 fases)

**Fases Reais (Backend - generate-product-gaps):**
```typescript
const PHASES_PRODUCTS = [
  { 
    id: 'gap_analysis', 
    name: 'Análise de Gaps', 
    count: 1, // Produtos detectados vs. matriz
    estimatedTime: 5 
  },
  { 
    id: 'product_matching', 
    name: 'Matching de Produtos', 
    count: 14, // 14 categorias TOTVS
    estimatedTime: 10 
  },
  { 
    id: 'roi_calculation', 
    name: 'Cálculo ROI', 
    count: 1, // ARR, timeline, probabilidade
    estimatedTime: 5 
  },
  { 
    id: 'recommendations', 
    name: 'Recomendações', 
    count: 1, // Scripts, abordagem
    estimatedTime: 5 
  },
];
```

**Features:**
- ✅ Produtos recomendados encontrados: "5 primários, 3 relevantes"
- ✅ Potencial ARR estimado

---

### 6️⃣ TAB OPPORTUNITIES (sem backend, usa dados TOTVS)

**Fases:**
```typescript
const PHASES_OPPORTUNITIES = [
  { 
    id: 'products_analysis', 
    name: 'Análise de Produtos', 
    count: 1, // Usa stcResult.evidences
    estimatedTime: 2 
  },
  { 
    id: 'opportunities_identification', 
    name: 'Identificação de Oportunidades', 
    count: 1, // Baseado em PRODUCT_SEGMENT_MATRIX
    estimatedTime: 2 
  },
  { 
    id: 'potential_calculation', 
    name: 'Cálculo de Potencial', 
    count: 1, // ARR estimado
    estimatedTime: 1 
  },
];
```

**Features:**
- ✅ Oportunidades primárias: "3 produtos"
- ✅ Oportunidades relevantes: "2 produtos"
- ✅ Potencial total estimado

---

### 7️⃣ TAB SIMILAR/CLIENTS (ainda não construído)

**Fases Propostas:**
```typescript
const PHASES_SIMILAR = [
  { 
    id: 'similar_search', 
    name: 'Busca de Similares', 
    count: 10, // Por setor, porte, região
    estimatedTime: 15 
  },
  { 
    id: 'client_analysis', 
    name: 'Análise de Clientes', 
    count: 10, // Verificar TOTVS usage
    estimatedTime: 20 
  },
  { 
    id: 'relationship_mapping', 
    name: 'Mapeamento de Relacionamentos', 
    count: 10, // Conexões, parcerias
    estimatedTime: 10 
  },
];
```

**Features:**
- ✅ Empresas similares encontradas
- ✅ Clientes TOTVS identificados

---

### 8️⃣ TAB 360° (compartilha com Executive)

**Fases Propostas (baseado em análise 360°):**
```typescript
const PHASES_360 = [
  { 
    id: 'data_collection', 
    name: 'Coleta de Dados', 
    count: 5, // Receita, dívidas, crescimento, contratações, notícias
    estimatedTime: 10 
  },
  { 
    id: 'score_calculation', 
    name: 'Cálculo de Score', 
    count: 1, // Health score
    estimatedTime: 5 
  },
  { 
    id: 'analysis', 
    name: 'Análise Completa', 
    count: 1, // Diagnóstico
    estimatedTime: 5 
  },
  { 
    id: 'executive_summary', 
    name: 'Resumo Executivo', 
    count: 1, // Para tab Executive
    estimatedTime: 5 
  },
];
```

**Features:**
- ✅ Score de saúde da empresa
- ✅ Análise de riscos e oportunidades

---

### 9️⃣ TAB EXECUTIVE (compartilha com 360°)

**Fases:**
```typescript
// Usa dados de todas as tabs anteriores
const PHASES_EXECUTIVE = [
  { 
    id: 'data_aggregation', 
    name: 'Agregação de Dados', 
    count: 8, // 8 tabs anteriores
    estimatedTime: 5 
  },
  { 
    id: 'insights_generation', 
    name: 'Geração de Insights', 
    count: 1, // Análise consolidada
    estimatedTime: 5 
  },
  { 
    id: 'recommendations', 
    name: 'Recomendações', 
    count: 1, // Abordagem sugerida
    estimatedTime: 3 
  },
];
```

**Features:**
- ✅ Resumo de todas as tabs
- ✅ Recomendações consolidadas

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### 1. Queries Melhoradas para Competidores

**Função:**
```typescript
function generateQueryBySourceTypeForCompetitor(
  sourceType: string,
  portal: string,
  companyName: string,
  competitorName: string,
  competitorProducts: string[] // TODOS os produtos e aliases
): string {
  // Unir TODOS os produtos e aliases
  const produtosQuery = competitorProducts.map(p => `"${p}"`).join(' OR ');
  
  switch (sourceType) {
    case 'job_portals':
      // Buscar empresa + concorrente OU empresa + produtos do concorrente
      return `site:${portal} "${companyName}" ("${competitorName}" OR ${produtosQuery})`;
    
    case 'competitor_cases':
      // Buscar por "case" ou "cliente" no site do concorrente
      return `site:${portal} ("case" OR "cliente" OR "depoimento") "${companyName}"`;
    
    case 'premium_news':
      return `site:${portal} "${companyName}" ("${competitorName}" OR ${produtosQuery} OR "implementação" OR "migração")`;
    
    default:
      return `site:${portal} "${companyName}" ("${competitorName}" OR ${produtosQuery})`;
  }
}
```

**Uso:**
```typescript
// Para cada concorrente, pegar TODOS os produtos e aliases
const competitor = COMPETITORS_MATRIX.find(c => c.name === competitorName);
const allProducts = competitor.products.flatMap(p => [p.name, ...p.aliases]);

const query = generateQueryBySourceTypeForCompetitor(
  'job_portals',
  'linkedin.com/jobs',
  companyName,
  competitorName,
  allProducts // TODOS os produtos
);
```

---

### 2. Processamento Paralelo vs. Sequencial para Competidores

**ANÁLISE:**

**PARALELO:**
- ✅ Mais rápido (todos os 15+ concorrentes ao mesmo tempo)
- ❌ Alto consumo de tokens/custo
- ❌ Risco de timeout/memory limit
- ❌ Difícil rastrear progresso individual

**SEQUENCIAL:**
- ✅ Baixo consumo de tokens/custo
- ✅ Sem risco de timeout
- ✅ Fácil rastrear progresso individual
- ✅ Mais confiável
- ❌ Mais lento (mas aceitável)

**RECOMENDAÇÃO: SEQUENCIAL**

**Estratégia:**
```typescript
// Processar 1 concorrente por vez, mas todas as fases dele
for (const competitor of COMPETITORS_MATRIX) {
  console.log(`[COMPETITORS] 🔍 Processando: ${competitor.name} (${index + 1}/${total})`);
  
  // Atualizar progresso
  setCurrentCompetitor(competitor.name);
  setCompetitorIndex(index + 1);
  
  // Processar todas as 8 fases para este concorrente
  for (const phase of PHASES_COMPETITORS) {
    setCurrentPhase(phase.id);
    // ... buscar evidências ...
  }
}
```

**Custo Estimado (Sequencial):**
- 15 concorrentes × 8 fases × ~10 tokens/fase = ~1.200 tokens
- ✅ Aceitável e previsível

---

### 3. Popup de Evidências por Etapa (TOTVS)

**Implementação:**
```typescript
interface PhaseEvidence {
  phaseId: string;
  phaseName: string;
  evidencesFound: number;
  evidences: Array<{
    url: string;
    title: string;
    snippet: string;
    matchType: 'single' | 'double' | 'triple';
  }>;
}

// Ao finalizar cada fase, mostrar popup
useEffect(() => {
  if (phaseCompleted && phaseEvidences[phaseCompleted.id]) {
    toast.success(
      `✅ ${phaseCompleted.name} concluída!`,
      {
        description: `${phaseEvidences[phaseCompleted.id].evidencesFound} evidências encontradas`,
        action: {
          label: 'Ver detalhes',
          onClick: () => setExpandedPhase(phaseCompleted.id)
        }
      }
    );
  }
}, [phaseCompleted]);
```

---

### 4. Dropdown de Detalhes por Etapa

**Implementação:**
```typescript
<Collapsible>
  <CollapsibleTrigger className="flex items-center justify-between w-full">
    <span>{phase.name} ({phaseEvidences[phase.id]?.evidencesFound || 0} evidências)</span>
    <ChevronDown />
  </CollapsibleTrigger>
  <CollapsibleContent>
    {phaseEvidences[phase.id]?.evidences.map((evidence, idx) => (
      <div key={idx} className="p-2 border-b">
        <a href={evidence.url} target="_blank" rel="noopener">
          {evidence.title}
        </a>
        <p className="text-sm text-muted-foreground">{evidence.snippet}</p>
        <Badge>{evidence.matchType}</Badge>
      </div>
    ))}
  </CollapsibleContent>
</Collapsible>
```

---

## 📊 ESTRUTURA DE DADOS

### Backend → Frontend (Progresso em Tempo Real)

**Estrutura:**
```typescript
interface ProgressUpdate {
  phaseId: string;
  phaseName: string;
  status: 'in_progress' | 'completed' | 'error';
  evidencesFound?: number;
  totalEvidences?: number;
  currentCompetitor?: string; // Para competidores
  competitorIndex?: number;
  competitorTotal?: number;
}
```

**Envio (Backend):**
```typescript
// Enviar updates a cada fase completada
console.log(JSON.stringify({
  type: 'progress',
  phaseId: 'job_portals',
  phaseName: 'Portais de Vagas',
  status: 'completed',
  evidencesFound: 5,
  totalEvidences: 5
}));
```

**Recepção (Frontend):**
```typescript
// Via WebSocket ou polling (simular com interval)
useEffect(() => {
  const interval = setInterval(async () => {
    // Simular recebimento de progresso
    // Na prática, usar WebSocket ou polling do backend
  }, 2000);
  
  return () => clearInterval(interval);
}, []);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: TOTVS Check
- [ ] Atualizar `VerificationProgressBar` com 9 fases reais
- [ ] Adicionar contador de evidências por fase
- [ ] Implementar popup ao finalizar cada etapa
- [ ] Implementar dropdown de detalhes clicável
- [ ] Mostrar total de evidências ao final

### FASE 2: Competidores
- [ ] Criar `generateQueryBySourceTypeForCompetitor()`
- [ ] Atualizar backend para usar queries melhoradas
- [ ] Implementar processamento sequencial
- [ ] Adicionar contador de concorrentes processados
- [ ] Mostrar evidências por concorrente

### FASE 3: Digital Intelligence
- [ ] Atualizar `GenericProgressBar` com 4 fases
- [ ] Mostrar progresso de URLs analisadas
- [ ] Mostrar sinais de compra em tempo real

### FASE 4: Decisores
- [ ] Criar estrutura de 4 fases
- [ ] Mostrar decisores encontrados
- [ ] Mostrar progresso por decisor

### FASE 5: Products & Opportunities
- [ ] Atualizar `GenericProgressBar` com fases específicas
- [ ] Mostrar produtos recomendados encontrados

### FASE 6: Similar/Clients & 360° & Executive
- [ ] Definir fases quando tabs forem construídas
- [ ] Implementar barras de progresso específicas

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Aprovar plano**
2. ✅ **Implementar FASE 1 (TOTVS)**
3. ✅ **Implementar FASE 2 (Competidores)**
4. ✅ **Implementar FASE 3-5 (Demais tabs)**
5. ✅ **Testar e validar**

---

**STATUS:** ⏸️ AGUARDANDO APROVAÇÃO

