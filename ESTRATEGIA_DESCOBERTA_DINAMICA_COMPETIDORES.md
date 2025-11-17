# 🔍 Estratégia de Descoberta Dinâmica de Competidores e Produtos

## 🎯 Problema Identificado

**Limitação**: Lista fixa de 15 concorrentes não cobre:
1. **Sistemas próprios/customizados** (desenvolvidos internamente)
2. **Concorrentes menores/não mapeados**
3. **Soluções específicas de nicho**
4. **Produtos na "Deep Web"** (menções menos visíveis)

---

## 🚀 Solução: Descoberta Dinâmica + Lista Expandível

### **FASE 1: Detecção de Tecnologias (Análise de Stack)**

#### **1.1 Extrair TODAS as Tecnologias Mencionadas**

Primeiro, analisar **TODAS as URLs** e extrair **qualquer menção a software/sistema**:

```typescript
interface TechnologyMention {
  name: string;
  aliases: string[];
  category: 'ERP' | 'CRM' | 'WMS' | 'BI' | 'Cloud' | 'RH' | 'Pagamentos' | 'Custom' | 'Unknown';
  context: string; // contexto da menção
  url: string;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'explicit' | 'implicit' | 'contextual';
}
```

#### **1.2 Padrões de Detecção**

**Padrões Explícitos** (Alta Confiança):
- "Empresa X usa Sistema Y"
- "Empresa X implementou ERP Y"
- "Empresa X contrata desenvolvedor Sistema Y"
- "Empresa X migrou para Software Y"

**Padrões Implícitos** (Média Confiança):
- "Empresa X + nome de software" na mesma frase
- Vagas mencionando domínio de sistema específico
- Integrações listadas em marketplaces

**Padrões Contextuais** (Baixa Confiança):
- Menções em contexto de tecnologia
- Comparações/benchmarks

---

### **FASE 2: Classificação Dinâmica**

#### **2.1 Categorizar Descobertas**

```typescript
interface DiscoveredTechnology {
  name: string;
  category: TechnologyCategory;
  classification: 'known_competitor' | 'unknown_competitor' | 'custom_system' | 'proprietary' | 'open_source' | 'unknown';
  totvsMatch?: string; // Produto TOTVS equivalente (se houver)
  evidence: Evidence[];
  confidence: number;
}
```

**Classificação Automática**:

1. **Known Competitor** (Concorrente Conhecido):
   - Nome existe em `COMPETITORS_MATRIX`
   - Produto mapeado
   - → Usar estratégia de displacement

2. **Unknown Competitor** (Concorrente Desconhecido):
   - Nome de software/sistema não está na lista
   - Mencionado como produto comercial
   - → Adicionar à lista de descobertas
   - → Tentar identificar categoria (ERP, CRM, etc.)
   - → Sugerir produto TOTVS equivalente

3. **Custom System** (Sistema Próprio):
   - Indícios de desenvolvimento interno
   - → Marcar como "sistema próprio"
   - → Oportunidade de substituição por TOTVS

4. **Proprietary** (Sistema Proprietário):
   - Nome específico da empresa
   - → Sistema desenvolvido pela própria empresa
   - → Alta oportunidade de substituição

5. **Open Source** (Código Aberto):
   - Nomes conhecidos (Odoo, ERPNext, etc.)
   - → Competidores de código aberto
   - → Estratégia de displacement diferente

---

### **FASE 3: Indicadores de Sistema Próprio**

#### **3.1 Detectar Desenvolvimento Interno**

**Padrões de Alto Indicador**:
- "Sistema próprio da Empresa X"
- "Desenvolvido internamente"
- "ERP próprio"
- "Sistema customizado"
- "Time de desenvolvimento interno"
- "Vagas para desenvolvedor + nome da empresa"

**Padrões de Médio Indicador**:
- Nome do sistema = nome da empresa (ex: "Sistema Metalife")
- Menções a "versão customizada"
- "Desenvolvimento sob medida"
- "Adaptado para nossas necessidades"

**Padrões de Baixo Indicador**:
- Menções genéricas a "sistema interno"
- "Ferramenta própria" sem mais contexto

---

### **FASE 4: Expansão Automática da Lista**

#### **4.1 Sistema de Aprendizado Contínuo**

```typescript
interface CompetitorDiscovery {
  name: string;
  products: string[];
  category: 'ERP' | 'CRM' | 'WMS' | 'BI' | 'Cloud' | 'RH' | 'Pagamentos';
  firstDiscovered: string; // data
  discoveryCount: number; // quantas empresas já detectaram
  confidence: number; // baseado em evidências acumuladas
  totvsAlternative?: string;
  status: 'pending_review' | 'approved' | 'rejected';
}
```

#### **4.2 Critérios para Adicionar à Lista**

**Automaticamente** (Alta Confiança):
- Detectado em **5+ empresas diferentes**
- **3+ evidências** por empresa
- Nome claro e identificável
- Categoria bem definida

**Revisão Manual** (Média Confiança):
- Detectado em **2-4 empresas**
- Evidências conflitantes
- Nome ambíguo

**Ignorar** (Baixa Confiança):
- Detectado em **1 empresa apenas**
- Evidências insuficientes
- Nome genérico/incompleto

---

### **FASE 5: Edge Function `discover-all-technologies`**

#### **5.1 Estrutura da Função**

```typescript
interface DiscoverAllTechnologiesRequest {
  companyName: string;
  cnpj: string;
  allUrls: string[];
  knownCompetitors?: Competitor[]; // Lista de 15 concorrentes conhecidos
}

interface TechnologyDiscovery {
  // Concorrentes conhecidos detectados
  knownCompetitors: Array<{
    competitor: string;
    products: Array<CompetitorProductDetection>;
  }>;
  
  // Tecnologias desconhecidas detectadas
  unknownTechnologies: Array<{
    name: string;
    category: string;
    evidences: Evidence[];
    confidence: number;
    classification: 'unknown_competitor' | 'custom_system' | 'proprietary' | 'open_source';
  }>;
  
  // Sistemas próprios detectados
  customSystems: Array<{
    name: string;
    indicators: string[]; // Padrões que indicam sistema próprio
    confidence: number;
    evidences: Evidence[];
  }>;
  
  // Tecnologias de código aberto
  openSource: Array<{
    name: string;
    category: string;
    evidences: Evidence[];
  }>;
}
```

#### **5.2 Algoritmo de Descoberta**

```typescript
async function discoverAllTechnologies(
  companyName: string,
  allUrls: string[],
  knownCompetitors: Competitor[]
): Promise<TechnologyDiscovery> {
  
  const discovery: TechnologyDiscovery = {
    knownCompetitors: [],
    unknownTechnologies: [],
    customSystems: [],
    openSource: [],
  };
  
  // 1. Analisar TODAS as URLs para extrair menções a sistemas/software
  const allMentions = await extractTechnologyMentions(companyName, allUrls);
  
  // 2. Classificar cada menção
  for (const mention of allMentions) {
    // 2.1 Verificar se é concorrente conhecido
    const knownMatch = findKnownCompetitor(mention, knownCompetitors);
    if (knownMatch) {
      addToKnownCompetitors(discovery, knownMatch, mention);
      continue;
    }
    
    // 2.2 Verificar se é sistema próprio
    const customIndicators = detectCustomSystem(mention, companyName);
    if (customIndicators.length >= 2) {
      addToCustomSystems(discovery, mention, customIndicators);
      continue;
    }
    
    // 2.3 Verificar se é código aberto conhecido
    const openSourceMatch = findOpenSource(mention);
    if (openSourceMatch) {
      addToOpenSource(discovery, openSourceMatch);
      continue;
    }
    
    // 2.4 Caso contrário, é tecnologia desconhecida
    addToUnknownTechnologies(discovery, mention);
  }
  
  // 3. Consolidar e calcular confianças
  consolidateDiscovery(discovery);
  
  return discovery;
}
```

---

### **FASE 6: Extração de Tecnologias (NER + Regex)**

#### **6.1 Padrões de Extração**

**Regex Patterns**:
```typescript
const TECHNOLOGY_PATTERNS = [
  // Explícito
  /(?:usamos?|utilizamos?|implementamos?|adotamos?|migramos?|trocamos?)\s+(?:o\s+)?(?:sistema|software|ERP|CRM|WMS|BI)\s+([A-Z][A-Za-z0-9\s]+)/gi,
  /(?:contratamos?|buscamos?|procuramos?)\s+(?:consultor|desenvolvedor|analista)\s+(?:de|para)\s+([A-Z][A-Za-z0-9\s]+)/gi,
  
  // Implícito
  /(?:integração|integrações)\s+(?:com|entre)\s+([A-Z][A-Za-z0-9\s]+)/gi,
  /(?:migração|migrações)\s+(?:para|de)\s+([A-Z][A-Za-z0-9\s]+)/gi,
  
  // Contextual
  /([A-Z][A-Za-z0-9\s]+)\s+(?:ERP|CRM|WMS|BI|Sistema|Software)/gi,
];
```

**Lista de Tecnologias Conhecidas** (Dicionário):
```typescript
const KNOWN_TECHNOLOGIES = {
  'ERP': ['SAP', 'Oracle', 'Microsoft Dynamics', 'Protheus', 'Datasul', 'Omie', 'Conta Azul', 'Odoo', 'ERPNext', ...],
  'CRM': ['Salesforce', 'HubSpot', 'RD Station', 'Pipedrive', 'Zoho', ...],
  'WMS': ['JDA', 'Manhattan', 'HighJump', ...],
  'BI': ['Tableau', 'Power BI', 'Qlik', 'SAP BI', ...],
  'Cloud': ['AWS', 'Azure', 'Google Cloud', ...],
  'RH': ['Senior RH', 'Folha', 'SAP SuccessFactors', ...],
  'Open Source': ['Odoo', 'ERPNext', 'Dolibarr', 'ERP5', ...],
};
```

---

### **FASE 7: Dicionário Dinâmico de Concorrentes**

#### **7.1 Banco de Dados de Descobertas**

```sql
CREATE TABLE competitor_discoveries (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  products TEXT[],
  category TEXT,
  first_discovered TIMESTAMP,
  discovery_count INTEGER DEFAULT 1,
  total_evidences INTEGER DEFAULT 0,
  confidence_score DECIMAL,
  totvs_alternative TEXT,
  status TEXT DEFAULT 'pending_review', -- pending_review, approved, rejected
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE technology_mentions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  technology_name TEXT,
  technology_type TEXT, -- known_competitor, unknown_competitor, custom_system, proprietary, open_source
  category TEXT,
  evidences JSONB,
  confidence DECIMAL,
  discovered_at TIMESTAMP DEFAULT NOW()
);
```

#### **7.2 Processo de Aprovação**

1. **Detecção Automática** → Salvar em `competitor_discoveries` com `status = 'pending_review'`
2. **Acumulação** → Aumentar `discovery_count` e `total_evidences`
3. **Auto-aprovação** → Se `discovery_count >= 5` e `confidence_score >= 70` → `status = 'approved'`
4. **Revisão Manual** → Admin revisa e aprova/rejeita
5. **Atualização de Lista** → Concorrentes aprovados são adicionados à `COMPETITORS_MATRIX`

---

### **FASE 8: Integração no Relatório Holístico**

#### **8.1 Prompt da AI Atualizado**

```
🏆 7. PRODUTOS DE COMPETIDORES DETECTADOS:
${knownCompetitors.map(...)}

🔍 7.1. TECNOLOGIAS DESCONHECIDAS DETECTADAS:
${unknownTechnologies.map(tech => `
   - ${tech.name} (${tech.category})
     Classificação: ${tech.classification}
     Confiança: ${tech.confidence}/100
     Evidências: ${tech.evidences.length}
     ${tech.evidences.slice(0, 2).map(e => `  • ${e.excerpt}`).join('\n')}
`).join('\n')}

🏗️ 7.2. SISTEMAS PRÓPRIOS DETECTADOS:
${customSystems.map(system => `
   - ${system.name}
     Confiança: ${system.confidence}/100
     Indicadores: ${system.indicators.join(', ')}
     Oportunidade: Alta - Empresa tem sistema próprio (pode substituir por TOTVS)
`).join('\n')}

💡 7.3. OPORTUNIDADES DE DISPLACEMENT:
${generateDisplacementOpportunities(knownCompetitors, unknownTechnologies, customSystems)}
```

#### **8.2 Oportunidades de Displacement Expandidas**

**Para Sistemas Próprios**:
- **Oportunidade**: Alta (sistema customizado = custos altos, manutenção difícil)
- **Estratégia**: "Sistema próprio tem custos altos de manutenção. TOTVS oferece suporte profissional, atualizações constantes, e menor TCO."
- **Produtos Sugeridos**: Baseado no segmento (ERP, CRM, etc.)

**Para Tecnologias Desconhecidas**:
- **Oportunidade**: Média (depende da confiança e categoria)
- **Estratégia**: "Software X detectado. TOTVS oferece solução equivalente com melhor integração e suporte local."
- **Produtos Sugeridos**: Baseado em categoria detectada

---

### **FASE 9: Interface na Aba Competitors**

#### **9.1 Visualização Expandida**

```
🏆 ANÁLISE DE COMPETIDORES E TECNOLOGIAS

📋 CONCORRENTES CONHECIDOS (15):
├─ SAP → SAP ERP, SAP BI
├─ Oracle → NetSuite
└─ ...

🔍 TECNOLOGIAS DESCONHECIDAS DETECTADAS:
├─ Sistema Y (ERP) - Confidence: 75%
│  ├─ Evidências: 3 (2 double, 1 triple)
│  └─ Status: 🔍 Descoberta nova (não está na lista)
├─ Software Z (CRM) - Confidence: 60%
│  └─ Status: 🔍 Descoberta nova (não está na lista)
└─ ...

🏗️ SISTEMAS PRÓPRIOS DETECTADOS:
├─ Sistema Metalife (Custom ERP) - Confidence: 90%
│  ├─ Indicadores: "Sistema próprio", "Desenvolvido internamente"
│  ├─ Evidências: 5
│  └─ Oportunidade: 🔥 ALTA - Substituir por Protheus
└─ ...

💰 OPORTUNIDADES TOTVS:
├─ 🔥 Protheus (Substituir Sistema Metalife)
│  └─ Motivo: Sistema próprio tem custos altos. Protheus oferece suporte profissional.
├─ 💡 TOTVS CRM (Substituir Software Z)
│  └─ Motivo: Integração nativa com ERP TOTVS
└─ ...
```

---

### **FASE 10: Expansão Contínua da Lista**

#### **10.1 Dashboard de Descobertas**

```
📊 DASHBOARD DE DESCOBERTAS

🆕 Descobertas Pendentes (Aguardando Revisão):
├─ Sistema ABC (ERP) - 8 empresas, 24 evidências
├─ Software XYZ (CRM) - 5 empresas, 15 evidências
└─ ...

✅ Aprovados Recentemente:
├─ Competidor Novo 1 - Adicionado à lista principal
└─ Competidor Novo 2 - Adicionado à lista principal

📈 Estatísticas:
├─ Total de Concorrentes Mapeados: 23 (15 originais + 8 descobertos)
├─ Sistemas Próprios Detectados: 12 empresas
└─ Tecnologias Desconhecidas: 45 menções únicas
```

#### **10.2 Critérios de Auto-aprovação**

```typescript
function shouldAutoApprove(discovery: CompetitorDiscovery): boolean {
  return (
    discovery.discoveryCount >= 5 && // Detectado em 5+ empresas
    discovery.totalEvidences >= 15 && // 15+ evidências totais
    discovery.confidenceScore >= 70 && // Confiança alta
    discovery.name.length >= 3 && // Nome não muito curto
    !isGenericName(discovery.name) // Nome não genérico
  );
}
```

---

## 📋 Resumo da Estratégia

### **Antes (Limitação)**
- ❌ Lista fixa de 15 concorrentes
- ❌ Não detecta sistemas próprios
- ❌ Não detecta concorrentes não mapeados
- ❌ Lista não expande automaticamente

### **Depois (Solução Completa)**
- ✅ Descoberta dinâmica de TODAS as tecnologias
- ✅ Classificação automática (conhecido/desconhecido/próprio)
- ✅ Detecção de sistemas próprios/customizados
- ✅ Expansão automática da lista
- ✅ Banco de dados de descobertas
- ✅ Processo de aprovação (automático + manual)
- ✅ Dashboard de descobertas

---

## 🚀 Plano de Implementação

### **Fase 1 (Semana 1-2)**: Base
- ✅ Edge Function `discover-all-technologies`
- ✅ Extração de tecnologias (regex + dicionário)
- ✅ Classificação básica

### **Fase 2 (Semana 3)**: Sistema Próprio
- ✅ Detecção de sistemas próprios
- ✅ Indicadores e padrões
- ✅ Integração na aba Competitors

### **Fase 3 (Semana 4)**: Expansão
- ✅ Banco de dados de descobertas
- ✅ Processo de aprovação
- ✅ Dashboard de descobertas

### **Fase 4 (Semana 5+)**: Refinamento
- ✅ Auto-aprovação inteligente
- ✅ Expansão contínua
- ✅ Validação e ajustes

---

## ❓ Perguntas Frequentes

**Q: Como garantir que não detectamos falsos positivos?**

**R**: 
- Sistema de confiança (high/medium/low)
- Múltiplas evidências necessárias
- Processo de aprovação (manual + automático)
- Threshold de auto-aprovação (5 empresas, 15 evidências)

**Q: E se o sistema próprio não tiver nome?**

**R**:
- Detectar indicadores genéricos ("sistema próprio", "desenvolvido internamente")
- Classificar como "proprietary system"
- Oportunidade de displacement ainda existe

**Q: Como expandir a lista inicial de 15?**

**R**:
- Detecções acumuladas automaticamente
- Processo de aprovação (manual + automático)
- Dashboard para revisão
- Lista cresce continuamente

---

## 🎯 Conclusão

Com essa estratégia, **não estamos limitados a 15 concorrentes**. O sistema:

1. **Descobre dinamicamente** todas as tecnologias mencionadas
2. **Classifica automaticamente** (conhecido/desconhecido/próprio)
3. **Expande a lista continuamente** através de descobertas
4. **Detecta sistemas próprios** que são oportunidades de displacement

**Resultado**: Análise 360° completa, sem limitações de lista fixa! 🚀

