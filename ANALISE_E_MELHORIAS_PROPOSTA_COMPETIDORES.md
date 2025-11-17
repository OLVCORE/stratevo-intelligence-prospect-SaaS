# 📊 Análise e Melhorias da Proposta de Análise de Competidores

## ✅ Avaliação da Proposta

A proposta está **MUITO BEM ESTRUTURADA** e alinhada com nossa estratégia. Vou destacar os **pontos fortes** e as **melhorias sugeridas**:

---

## 🎯 Pontos Fortes da Proposta

### **1. Metodologia Robusta (Double/Triple Matching)**
✅ **Excelente** - Sistema de scoring baseado em coocorrência é a abordagem correta.

### **2. Fontes de Alta Confiabilidade**
✅ **Muito boa** - Priorizar sites oficiais, cases, vagas, marketplaces aumenta assertividade.

### **3. Regras de Proximidade (Window Tokens)**
✅ **Essencial** - Limitar distância entre termos evita falsos positivos.

### **4. Score de Confiança Detalhado**
✅ **Bem pensado** - Sistema de pontuação incremental (+40, +30, +25...) é escalável.

### **5. Desambiguação (Entity Resolution)**
✅ **Crítico** - Normalização de aliases, CNPJ, contexto geográfico evita erros.

---

## 🔧 Melhorias Sugeridas

### **1. Adaptação para Edge Functions (Deno/TypeScript)**

**Problema**: O código exemplo está em Python, mas precisamos de TypeScript/Deno.

**Solução**: Adaptar para Deno mantendo a mesma lógica:

```typescript
// supabase/functions/detect-competitor-products/index.ts

interface TokenWindowConfig {
  doubleMatchWindow: number; // 50 tokens
  tripleMatchWindow: number; // 30 tokens
}

interface CompetitorAlias {
  competitor: string;
  products: Array<{
    name: string;
    aliases: string[];
  }>;
}

async function tokenize(text: string): Promise<string[]> {
  // Tokenização robusta (considerar usar biblioteca ou regex)
  return text.toLowerCase()
    .split(/\s+/)
    .filter(token => token.length >= 2);
}

function windowCooccurs(
  tokens: string[],
  termGroups: string[][],
  maxWindow: number
): boolean {
  // Mesma lógica do Python, adaptada para TypeScript
  const positions: number[][] = [];
  
  for (const aliases of termGroups) {
    const foundPositions: number[] = [];
    for (let i = 0; i <= tokens.length; i++) {
      for (const alias of aliases) {
        const aliasTokens = alias.toLowerCase().split(/\s+/);
        const slice = tokens.slice(i, i + aliasTokens.length);
        if (slice.join(' ') === aliasTokens.join(' ')) {
          foundPositions.push(i);
        }
      }
    }
    if (foundPositions.length === 0) return false;
    positions.push(foundPositions);
  }
  
  // Verificar distância mínima
  for (const p0 of positions[0]) {
    for (const p1 of positions[1]) {
      if (termGroups.length === 2) {
        if (Math.abs(p0 - p1) <= maxWindow) return true;
      } else {
        for (const p2 of positions[2]) {
          const maxDist = Math.max(
            Math.abs(p0 - p1),
            Math.abs(p0 - p2),
            Math.abs(p1 - p2)
          );
          if (maxDist <= maxWindow) return true;
        }
      }
    }
  }
  return false;
}
```

---

### **2. Dicionário de Competidores Estruturado**

**Melhoria**: Criar estrutura JSON tipada para facilitar manutenção:

```typescript
// src/lib/constants/competitorMatrix.ts

export interface CompetitorProduct {
  name: string;
  aliases: string[];
  category: 'ERP' | 'CRM' | 'WMS' | 'BI' | 'Cloud' | 'RH' | 'Pagamentos';
  totvsAlternative?: string; // Produto TOTVS equivalente
  displacementFitScore?: number; // 0-100
}

export interface Competitor {
  name: string;
  aliases: string[];
  products: CompetitorProduct[];
  category: 'Cloud-First' | 'Enterprise' | 'SMB-Flexible' | 'Global-SMB' | 'Adjacent';
  website?: string;
  casesPage?: string; // URL da página de cases
}

export const COMPETITORS_MATRIX: Competitor[] = [
  {
    name: 'Omie',
    aliases: ['Omie ERP', 'Omie Flow', 'Omie'],
    category: 'Cloud-First',
    website: 'https://www.omie.com.br',
    casesPage: 'https://www.omie.com.br/cases',
    products: [
      {
        name: 'Omie ERP',
        aliases: ['Omie ERP', 'Omie', 'ERP Omie'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
      },
    ],
  },
  {
    name: 'SAP',
    aliases: ['SAP', 'SAP Business One', 'SAP B1', 'SAP B1'],
    category: 'Global-SMB',
    website: 'https://www.sap.com',
    casesPage: 'https://www.sap.com/customer-stories',
    products: [
      {
        name: 'SAP Business One',
        aliases: ['SAP Business One', 'SAP B1', 'SAP B1', 'Business One'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 90,
      },
      {
        name: 'SAP BI',
        aliases: ['SAP BI', 'SAP Business Intelligence', 'SAP Analytics'],
        category: 'BI',
        totvsAlternative: 'TOTVS BI',
        displacementFitScore: 85,
      },
    ],
  },
  // ... outros 13 concorrentes
];
```

---

### **3. Integração com APIs de Busca (Serper/Google)**

**Melhoria**: Usar API Serper (já temos no projeto) em vez de scraping:

```typescript
// Usar função existente ou criar nova
async function searchCompetitorEvidence(
  companyName: string,
  competitor: string,
  product: string,
  allUrls: string[]
): Promise<SearchResult[]> {
  const queries = [
    `"${companyName}" "${competitor}" "${product}"`,
    `"${companyName}" "${product}" vaga`,
    `site:linkedin.com "${companyName}" "${product}"`,
    `"${competitor}" case "${companyName}"`,
    `site:${competitor}.com.br "${companyName}"`,
  ];
  
  // Usar Serper API (já temos no projeto)
  const results = await Promise.all(
    queries.map(q => searchSerper(q))
  );
  
  return results.flat();
}
```

---

### **4. Análise de URLs Já Descobertas (Evitar Busca Duplicada)**

**Melhoria**: Primeiro analisar `allUrls` já coletadas:

```typescript
async function analyzeExistingUrls(
  companyName: string,
  competitor: Competitor,
  allUrls: string[]
): Promise<Evidence[]> {
  const evidences: Evidence[] = [];
  
  // Analisar URLs já descobertas primeiro (mais rápido e eficiente)
  for (const url of allUrls) {
    const html = await fetchHtml(url);
    const text = extractText(html);
    const tokens = tokenize(text);
    
    for (const product of competitor.products) {
      const empresaAliases = [companyName, /* variações */];
      const concorrenteAliases = [competitor.name, ...competitor.aliases];
      const produtoAliases = [product.name, ...product.aliases];
      
      const hasTriple = windowCooccurs(
        tokens,
        [empresaAliases, concorrenteAliases, produtoAliases],
        30 // triple window
      );
      
      const hasDoubleEC = windowCooccurs(
        tokens,
        [empresaAliases, concorrenteAliases],
        50 // double window
      );
      
      if (hasTriple || hasDoubleEC) {
        evidences.push({
          url,
          matchType: hasTriple ? 'triple' : 'double',
          competitor: competitor.name,
          product: product.name,
          excerpt: extractExcerpt(text, tokens, /* posições */),
        });
      }
    }
  }
  
  return evidences;
}
```

---

### **5. Sistema de Score Melhorado (Baseado na Proposta)**

**Implementação**:

```typescript
function calculateConfidenceScore(
  evidences: Evidence[],
  url: string
): { score: number; confidence: 'high' | 'medium' | 'low' } {
  let score = 0;
  
  // Triple match em site oficial do concorrente (cases)
  if (evidences.some(e => 
    e.matchType === 'triple' && 
    e.url.includes('cases') && 
    e.domain.includes(competitor.website?.replace('https://', ''))
  )) {
    score += 40;
  }
  
  // Triple match em mídia/release confiável
  if (evidences.some(e => 
    e.matchType === 'triple' && 
    isReliableNewsSource(e.domain)
  )) {
    score += 30;
  }
  
  // Double match em site da empresa-alvo + termo "implantamos/uso"
  if (evidences.some(e => 
    e.matchType === 'double' && 
    e.domain.includes(companyDomain) &&
    e.excerpt.match(/implantamos|uso|usamos|implementamos/i)
  )) {
    score += 25;
  }
  
  // Double match em vaga oficial da empresa-alvo
  if (evidences.some(e => 
    e.matchType === 'double' && 
    (e.url.includes('linkedin.com/jobs') || e.url.includes('gupy.io'))
  )) {
    score += 15;
  }
  
  // Double match em marketplace/iPaaS oficial
  if (evidences.some(e => 
    e.matchType === 'double' && 
    isMarketplace(e.domain)
  )) {
    score += 10;
  }
  
  // Múltiplas fontes independentes (até +15)
  const uniqueDomains = new Set(evidences.map(e => e.domain));
  score += Math.min(uniqueDomains.size * 5, 15);
  
  // Penalização por ambiguidade
  if (evidences.length === 1 && evidences[0].matchType === 'single') {
    score -= 15;
  }
  
  // Determinar confidence
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 70) confidence = 'high';
  else if (score >= 50) confidence = 'medium';
  else confidence = 'low';
  
  return { score, confidence };
}
```

---

### **6. Matriz de Displacement Integrada**

**Melhoria**: Incluir na estrutura de dados:

```typescript
export const DISPLACEMENT_MATRIX: Record<string, {
  totvsAlternative: string;
  fitScore: number;
  reason: string;
  strategy: string;
  estimatedROIMonths: number;
  migrationTimeline: string;
}> = {
  'Omie ERP': {
    totvsAlternative: 'Protheus',
    fitScore: 85,
    reason: 'ERP equivalente para PME, menor custo, melhor localização',
    strategy: 'Mostrar ROI, custo-benefício, casos de migração',
    estimatedROIMonths: 12,
    migrationTimeline: '4-6 meses',
  },
  'SAP Business One': {
    totvsAlternative: 'Protheus',
    fitScore: 90,
    reason: 'ERP equivalente para indústria, menor custo, melhor localização',
    strategy: 'Focar em custo de licenciamento, suporte local, integração',
    estimatedROIMonths: 18,
    migrationTimeline: '6-9 meses',
  },
  // ... outros
};
```

---

### **7. Pipeline de Análise Otimizado**

**Estrutura**:

```
1. Análise de URLs Já Descobertas (Rápido)
   ↓
2. Busca Direcionada (Serper API) - Apenas se necessário
   ↓
3. Extração e Classificação (Window Co-occurrence)
   ↓
4. Scoring e Desambiguação
   ↓
5. Geração de Evidências
   ↓
6. Matriz de Displacement (Oportunidades TOTVS)
```

---

### **8. Integração com Relatório Holístico**

**Melhoria**: Incluir no prompt da AI:

```typescript
// No prompt de generate-product-gaps
🏆 7. PRODUTOS DE COMPETIDORES DETECTADOS:
${competitorDetections.map(det => `
   - ${det.competitor_name} ${det.product_name} (Confidence: ${det.confidence})
     Evidências: ${det.evidences.length} (${det.match_summary.triple_matches} triple, ${det.match_summary.double_matches} double)
     Score: ${det.total_score}/100
     ${det.evidences.slice(0, 3).map(e => `  • ${e.title} (${e.source})`).join('\n')}
`).join('\n')}

💰 7.1. OPORTUNIDADES DE DISPLACEMENT:
${displacementOpportunities.map(opp => `
   - Substituir ${opp.competitor_product} por ${opp.totvs_product}
     Fit Score: ${opp.fit_score}/100
     Motivo: ${opp.reason}
     Estratégia: ${opp.strategy}
     ROI Estimado: ${opp.estimated_roi_months} meses
     Timeline: ${opp.migration_timeline}
`).join('\n')}
```

---

### **9. KPIs e Métricas (Dashboard)**

**Implementação**:

```typescript
interface CompetitorAnalysisKPIs {
  coverage: number; // % empresas com ≥ 1 evidência
  confirmations: number; // % com triple + score ≥ 70
  penetrationByCompetitor: Record<string, number>; // % por concorrente
  penetrationByProduct: Record<string, number>; // % por produto
  penetrationBySegment: Record<string, number>; // % por segmento
  averageScanTime: number; // tempo médio por varredura
  precision: number; // precisão (validação humana)
  recall: number; // recall (validação humana)
}
```

---

### **10. Plano de Implementação Adaptado**

**Semana 1**:
- ✅ Criar `COMPETITORS_MATRIX` e `DISPLACEMENT_MATRIX` (tipados)
- ✅ Adaptar funções de tokenização/coocorrência para TypeScript/Deno
- ✅ Criar Edge Function `detect-competitor-products` (estrutura base)
- ✅ Implementar análise de URLs já descobertas (fase rápida)

**Semana 2**:
- ✅ Integrar com Serper API para buscas direcionadas
- ✅ Implementar sistema de scoring detalhado
- ✅ Criar desambiguação (aliases, CNPJ, contexto)
- ✅ Salvar evidências no banco de dados

**Semana 3**:
- ✅ Criar componente na aba Competitors
- ✅ Integrar com relatório holístico (prompt AI)
- ✅ Adicionar matriz de displacement nas recomendações
- ✅ Dashboard inicial (KPIs)

**Semana 4**:
- ✅ Validar com ground truth (amostragem humana)
- ✅ Ajustar limiares e pesos de scoring
- ✅ Escalar para lote (500+ empresas)
- ✅ Automação de refresh mensal

---

## 📋 Resumo das Melhorias

| Item | Proposta Original | Melhoria Sugerida | Status |
|------|------------------|-------------------|--------|
| Linguagem | Python | TypeScript/Deno | ✅ Adaptar |
| Estrutura de Dados | Texto | JSON tipado (`COMPETITORS_MATRIX`) | ✅ Criar |
| Busca | Scraping manual | Serper API + análise de URLs existentes | ✅ Integrar |
| Scoring | +40, +30, +25... | Implementação completa com validações | ✅ Implementar |
| Desambiguação | Conceito | Sistema de aliases + CNPJ + contexto | ✅ Criar |
| Displacement | Não mencionado | Matriz completa integrada | ✅ Adicionar |
| Integração | Não especificada | Prompt AI + aba Competitors | ✅ Integrar |
| KPIs | Conceito | Dashboard com métricas reais | ✅ Criar |

---

## 🎯 Próximos Passos

1. **Implementar Edge Function `detect-competitor-products`** com todas as melhorias
2. **Criar `COMPETITORS_MATRIX` e `DISPLACEMENT_MATRIX`** (15 concorrentes)
3. **Integrar na aba Competitors** com visualização de evidências
4. **Atualizar relatório holístico** para incluir produtos de competidores

**Posso começar a implementação agora?** 🚀

