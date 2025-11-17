# 🏆 Estratégia de Análise de Competidores - Detecção de Produtos

## 🎯 Objetivo

Detectar **quais produtos de CONCORRENTES** a empresa analisada está usando, similar à metodologia da aba **TOTVS Check**, mas aplicada para produtos de **concorrentes diretos**.

---

## 🔍 Metodologia Proposta

### **FASE 1: Identificação de Competidores**

#### **1.1 Fontes de Dados**

1. **Aba Competitors** (já existe):
   - Lista de competidores diretos identificados
   - Baseado em dados do mercado/setor

2. **Análise de URLs**:
   - Detectar menções a competidores em notícias
   - Identificar parcerias com competidores
   - Encontrar comparações/benchmarks

3. **Análise de Decisores**:
   - Ex-funcionários que trabalharam em empresas competidoras
   - Profissionais que vieram de competidores

#### **1.2 Matriz de Competidores por Segmento**

Criar matriz similar à `PRODUCT_SEGMENT_MATRIX`:

```typescript
const COMPETITOR_MATRIX = {
  'ERP': {
    'Indústria': ['SAP', 'Oracle', 'Microsiga', 'Senior', 'Totvs'],
    'Varejo': ['Linx', 'TOTVS', 'Senior', 'Loyality'],
    // ...
  },
  'CRM': {
    'Varejo': ['Salesforce', 'HubSpot', 'RD Station', 'Pipedrive'],
    // ...
  },
  // ...
};
```

---

### **FASE 2: Detecção de Produtos de Competidores (Similar ao TOTVS Check)**

#### **2.1 Metodologia de Busca (Double/Triple Matching)**

Usar a **mesma metodologia** da aba TOTVS Check:

1. **Queries Estruturadas**:
   ```
   "Empresa X" + "Produto Competidor Y"
   "Empresa X" AND "SAP"
   "Empresa X" AND "Oracle ERP"
   "Empresa X" AND "funcionário" AND "Senior Sistemas"
   ```

2. **Fontes de Busca**:
   - **Portais de Vagas** (LinkedIn, Gupy, Indeed):
     - Buscar vagas da empresa mencionando produtos de competidores
     - Ex: "Vaga para consultor SAP" na empresa X
   
   - **Notícias Premium** (Google News, TechCrunch):
     - Buscar notícias sobre parcerias com competidores
     - Ex: "Empresa X anuncia parceria com Oracle"
   
   - **Fontes Oficiais** (Website, Press Releases):
     - Buscar no site da empresa menções a produtos de competidores
     - Ex: "Clientes da empresa X que usam SAP"
   
   - **Cases de Sucesso**:
     - Buscar cases de competidores mencionando a empresa
     - Ex: "Oracle: Case de Sucesso - Empresa X"

3. **Sistema de Scoring (Double/Triple Matching)**:

   ```
   SINGLE MATCH (1 ponto):
   - Menção do nome da empresa + nome do produto competidor em contexto separado
   - Ex: "Empresa X anunciou expansão. Oracle ERP é líder de mercado."
   
   DOUBLE MATCH (3 pontos):
   - Menção do nome da empresa + nome do produto competidor na mesma frase
   - Ex: "Empresa X implementa Oracle ERP para gestão"
   
   TRIPLE MATCH (5 pontos):
   - Menção da empresa + produto competidor + contexto específico (vaga, case, parceria)
   - Ex: "Empresa X contrata consultor SAP para projeto de implementação"
   - Ex: "Oracle: Case de Sucesso - Empresa X aumentou produtividade em 30%"
   ```

4. **Confidence Score**:
   ```
   HIGH (80-100%): Triple match + múltiplas fontes confirmadas
   MEDIUM (50-79%): Double match + 2+ fontes
   LOW (30-49%): Single match ou apenas 1 fonte
   ```

---

### **FASE 3: Edge Function `detect-competitor-products`**

#### **3.1 Estrutura da Função**

```typescript
interface CompetitorDetectionRequest {
  companyName: string;
  cnpj: string;
  sector: string;
  competitors: Array<{
    name: string;
    products: string[]; // Produtos conhecidos do competidor
  }>;
  allUrls: string[]; // URLs descobertas da empresa
  detectedProducts?: string[]; // Produtos TOTVS já detectados
}

interface CompetitorProductDetection {
  competitor_name: string;
  product_name: string;
  confidence: 'high' | 'medium' | 'low';
  evidences: Array<{
    url: string;
    title: string;
    source: string;
    match_type: 'single' | 'double' | 'triple';
    excerpt: string;
  }>;
  total_weight: number;
  match_summary: {
    single_matches: number;
    double_matches: number;
    triple_matches: number;
  };
}
```

#### **3.2 Algoritmo de Detecção**

```typescript
async function detectCompetitorProducts(
  companyName: string,
  competitor: { name: string; products: string[] },
  allUrls: string[]
): Promise<CompetitorProductDetection[]> {
  
  const detections: CompetitorProductDetection[] = [];
  
  // Para cada produto do competidor
  for (const product of competitor.products) {
    const evidences: Evidence[] = [];
    
    // 1. Buscar em portais de vagas
    const jobQueries = [
      `"${companyName}" "${product}" vaga`,
      `"${companyName}" "${product}" funcionário`,
      `"${companyName}" "${product}" consultor`,
      `"${companyName}" "${product}" técnico`,
    ];
    
    // 2. Buscar em notícias
    const newsQueries = [
      `"${companyName}" "${product}"`,
      `"${companyName}" "${competitor.name}" "${product}"`,
      `"${companyName}" parceria "${product}"`,
    ];
    
    // 3. Buscar em fontes oficiais
    const officialQueries = [
      `site:${companyName} "${product}"`,
      `site:${companyName} "${competitor.name}"`,
    ];
    
    // 4. Buscar em cases de sucesso
    const caseQueries = [
      `"${competitor.name}" case "${companyName}"`,
      `"${competitor.name}" cliente "${companyName}"`,
    ];
    
    // Executar todas as buscas e agreggar resultados
    const allResults = await Promise.all([
      searchJobPortals(jobQueries),
      searchNews(newsQueries),
      searchOfficialSources(officialQueries),
      searchCases(caseQueries),
      analyzeUrlsForMentions(allUrls, companyName, product, competitor.name)
    ]);
    
    // Processar resultados e calcular scoring
    for (const result of allResults.flat()) {
      const matchType = classifyMatch(result, companyName, product, competitor.name);
      const weight = calculateWeight(matchType, result.source);
      
      evidences.push({
        url: result.url,
        title: result.title,
        source: result.source,
        match_type: matchType,
        excerpt: result.excerpt,
        weight
      });
    }
    
    // Calcular confidence e total_weight
    const totalWeight = evidences.reduce((sum, e) => sum + e.weight, 0);
    const confidence = calculateConfidence(totalWeight, evidences);
    
    // Agregar detecção
    detections.push({
      competitor_name: competitor.name,
      product_name: product,
      confidence,
      evidences,
      total_weight: totalWeight,
      match_summary: {
        single_matches: evidences.filter(e => e.match_type === 'single').length,
        double_matches: evidences.filter(e => e.match_type === 'double').length,
        triple_matches: evidences.filter(e => e.match_type === 'triple').length,
      }
    });
  }
  
  return detections;
}
```

---

### **FASE 4: Integração na Aba Competitors**

#### **4.1 Novo Hook `useCompetitorProductDetection`**

```typescript
export function useCompetitorProductDetection({
  companyId,
  companyName,
  cnpj,
  competitors,
  allUrls,
  enabled = false
}: UseCompetitorProductDetectionParams) {
  return useQuery({
    queryKey: ['competitor-products', companyId, competitors.map(c => c.name).join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('detect-competitor-products', {
        body: {
          companyName,
          cnpj,
          competitors,
          allUrls,
        }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: enabled && competitors.length > 0,
  });
}
```

#### **4.2 Interface na Aba Competitors**

```
🏆 ANÁLISE DE COMPETIDORES

Competidor: SAP
├─ Produtos Detectados:
│  ├─ SAP ERP (Confidence: HIGH - 3 evidências)
│  │  ├─ ✅ Triple Match: "Empresa X contrata consultor SAP ERP" (LinkedIn)
│  │  ├─ ✅ Double Match: "Empresa X implementa SAP ERP" (Notícia)
│  │  └─ ✅ Double Match: "Empresa X usa SAP ERP para gestão" (Site)
│  └─ SAP BI (Confidence: MEDIUM - 2 evidências)
│     ├─ ✅ Double Match: "Empresa X migra para SAP BI" (Notícia)
│     └─ ⚠️ Single Match: "Empresa X menciona SAP BI" (Site)
│
├─ Oportunidades TOTVS:
│  ├─ 🔥 Protheus (Substituir SAP ERP)
│  │  └─ Motivo: Mesmo segmento, menor custo, melhor fit
│  └─ 💡 TOTVS BI (Substituir SAP BI)
│     └─ Motivo: Integração nativa com Protheus
│
└─ Market Share Disputado: 🔥 ALTO
   └─ Competidor está presente com produtos core (ERP, BI)
```

---

### **FASE 5: Estratégia de Displacement (Substituição)**

#### **5.1 Matriz de Produtos TOTVS vs Competidores**

```typescript
const DISPLACEMENT_MATRIX = {
  'SAP ERP': {
    totvs_alternative: 'Protheus',
    fit_score: 90,
    reason: 'ERP equivalente para indústria, menor custo, melhor localização',
    displacement_strategy: 'Mostrar ROI, custo-benefício, casos de migração',
  },
  'Oracle ERP': {
    totvs_alternative: 'Datasul',
    fit_score: 85,
    reason: 'ERP robusto para empresas grandes, suporte local',
    displacement_strategy: 'Focar em suporte, localização, custo de licenciamento',
  },
  'Salesforce': {
    totvs_alternative: 'TOTVS CRM',
    fit_score: 80,
    reason: 'CRM nativo com integração ERP, menor custo',
    displacement_strategy: 'Integração nativa, TCO menor, customização',
  },
  // ...
};
```

#### **5.2 Recomendações Baseadas em Competidores Detectados**

Quando detectar produto de competidor:

1. **Identificar produto TOTVS equivalente** usando `DISPLACEMENT_MATRIX`
2. **Calcular fit score** baseado em:
   - Segmento da empresa
   - Tamanho da empresa
   - Produto competidor detectado
   - Maturidade digital
3. **Gerar estratégia de displacement**:
   - Argumentos de substituição
   - Cases de migração
   - ROI estimado
   - Timeline de migração

---

### **FASE 6: Integração no Relatório Holístico**

#### **6.1 Incluir no Prompt da AI**

```
🏆 7. PRODUTOS DE COMPETIDORES DETECTADOS:
   ${competitorProducts.map(p => `
   - ${p.competitor_name} ${p.product_name} (Confidence: ${p.confidence})
     Evidências: ${p.evidences.length} (${p.match_summary.triple_matches} triple, ${p.match_summary.double_matches} double)
     ${p.evidences.slice(0, 3).map(e => `  • ${e.title} (${e.source})`).join('\n')}
   `).join('\n')}

💰 7.1. OPORTUNIDADES DE DISPLACEMENT:
   ${displacementOpportunities.map(opp => `
   - Substituir ${opp.competitor_product} por ${opp.totvs_product}
     Fit Score: ${opp.fit_score}/100
     Motivo: ${opp.reason}
     Estratégia: ${opp.strategy}
   `).join('\n')}
```

#### **6.2 Executive Summary**

```
Análise de Competidores:
- Detetados X produtos de competidores em uso
- Principais competidores: Competidor 1 (Y produtos), Competidor 2 (Z produtos)
- Market Share Disputado: ALTO/MÉDIO/BAIXO
- Oportunidades de Displacement: N produtos TOTVS podem substituir produtos de competidores
```

---

## 📊 Exemplo de Output

```json
{
  "competitor_detections": [
    {
      "competitor_name": "SAP",
      "products_detected": [
        {
          "product_name": "SAP ERP",
          "confidence": "high",
          "total_weight": 8,
          "evidences": [
            {
              "url": "https://linkedin.com/jobs/...",
              "title": "Vaga: Consultor SAP ERP - Empresa X",
              "source": "linkedin_jobs",
              "match_type": "triple",
              "excerpt": "Empresa X contrata consultor SAP ERP para projeto de implementação...",
              "weight": 5
            },
            {
              "url": "https://news.example.com/...",
              "title": "Empresa X implementa SAP ERP",
              "source": "news_premium",
              "match_type": "double",
              "excerpt": "Empresa X anunciou implementação de SAP ERP para gestão...",
              "weight": 3
            }
          ],
          "match_summary": {
            "single_matches": 0,
            "double_matches": 1,
            "triple_matches": 1
          }
        }
      ],
      "market_share_disputed": "high"
    }
  ],
  "displacement_opportunities": [
    {
      "competitor_product": "SAP ERP",
      "totvs_product": "Protheus",
      "fit_score": 90,
      "reason": "ERP equivalente para indústria, menor custo, melhor localização",
      "strategy": "Mostrar ROI, custo-benefício, casos de migração",
      "estimated_roi_months": 12,
      "migration_timeline": "6-9 meses"
    }
  ]
}
```

---

## 🎯 Próximos Passos

1. **Criar Edge Function `detect-competitor-products`**
2. **Criar hook `useCompetitorProductDetection`**
3. **Criar componente `CompetitorProductDetection`** na aba Competitors
4. **Integrar `DISPLACEMENT_MATRIX`** no relatório holístico
5. **Atualizar prompt da AI** para incluir produtos de competidores
6. **Adicionar estratégia de displacement** nas recomendações

---

## ❓ Perguntas Frequentes

**Q: Como garantir que não vamos detectar falsos positivos?**

**R**: 
- Usar sistema de scoring (single/double/triple matching)
- Requerer múltiplas fontes para confidence HIGH
- Validar contexto das menções (ex: "Empresa X menciona SAP" vs "Empresa X usa SAP")

**Q: E se o competidor não estiver na lista?**

**R**:
- Usar análise de URLs para detectar menções a produtos desconhecidos
- Criar lista dinâmica de competidores baseada em menções encontradas
- Validar com dados de mercado/setor

**Q: Como priorizar oportunidades de displacement?**

**R**:
- Priorizar produtos core (ERP, CRM) sobre produtos complementares
- Considerar fit score + market share disputado
- Focar em produtos com maior ROI de substituição

