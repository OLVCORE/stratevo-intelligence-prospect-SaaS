# 🎯 ESTRATÉGIA DE ADAPTAÇÃO: Multi-Tenant + 260 Setores

## 📊 CONTEXTO DA MUDANÇA

### ANTES (TOTVS Exclusivo):
- ✅ Plataforma exclusiva para TOTVS
- ✅ Foco em software/tecnologia
- ✅ Produtos fixos (Protheus, Fluig, RM, etc.)
- ✅ Termos de busca hardcoded ("TOTVS", "Protheus", etc.)

### AGORA (Multi-Tenant + 260 Setores):
- 🌐 Plataforma multi-tenant (qualquer empresa pode usar)
- 🌐 260 setores da economia (agro, saúde, construção, varejo, etc.)
- 🌐 Produtos/serviços configuráveis por tenant
- 🌐 Termos de busca dinâmicos baseados no tenant

---

## 🔄 ESTRATÉGIA DE ADAPTAÇÃO POR ABA

### ABA 1: 🔍 **VERIFICAÇÃO DE USO** (ex-TOTVS Check)

#### ANTES:
```typescript
// Hardcoded para TOTVS
const searchTerms = ["TOTVS", "Protheus", "Fluig", "RM"];
const companyName = "TOTVS";
```

#### AGORA (Genérico):
```typescript
// Configurável por tenant
interface TenantConfig {
  company_name: string;           // Nome da empresa do tenant
  products: Product[];            // Produtos/serviços do tenant
  search_terms: string[];         // Termos de busca personalizados
  aliases: string[];              // Variações do nome
  sector_code: string;            // Setor do tenant
  niche_code?: string;            // Nicho do tenant
}

// Busca dinâmica baseada no tenant
const searchTerms = [
  tenant.company_name,
  ...tenant.products.map(p => p.name),
  ...tenant.search_terms,
  ...tenant.aliases
];
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Edge Function:** `simple-totvs-check` → `simple-usage-check`
   - Recebe `tenant_id` como parâmetro
   - Busca configuração do tenant
   - Gera termos de busca dinamicamente
   - Mantém mesma robustez (70 fontes, 9 fases)

2. ✅ **Componente:** `TOTVSCheckCard` → `UsageVerificationCard`
   - Props: `tenantId` ao invés de hardcoded "TOTVS"
   - Título dinâmico: "Verificação {tenant.company_name}"
   - Produtos detectados são do tenant, não apenas TOTVS

3. ✅ **Banco de Dados:**
   - Tabela `tenant_products` (produtos/serviços do tenant)
   - Tabela `tenant_search_config` (termos, aliases, configurações)
   - Campo `tenant_id` em `stc_verification_history`

#### ROBUSTEZ MANTIDA:
- ✅ Mesmas 70 fontes premium
- ✅ Mesmas 9 fases de verificação
- ✅ Mesma validação IA (GPT-4o-mini)
- ✅ Mesmo sistema de evidências (Triple/Double/Single Match)
- ✅ Mesma barra de progresso
- ✅ Mesmo sistema de salvamento

---

### ABA 2: 👥 **DECISORES**

#### ANTES:
```typescript
// Busca genérica de decisores
const decisionMakers = await apollo.searchDecisionMakers(company);
```

#### AGORA (Multi-Setor):
```typescript
// Busca contextualizada por setor
interface SectorDecisionMakerConfig {
  sector_code: string;
  typical_roles: string[];        // Ex: ["CEO", "CTO"] para tech, ["Diretor Médico"] para saúde
  keywords: string[];              // Termos específicos do setor
  hierarchy_levels: number;        // Níveis hierárquicos típicos
}

// Busca adaptada ao setor
const config = await getSectorConfig(tenant.sector_code);
const decisionMakers = await apollo.searchDecisionMakers(company, {
  roles: config.typical_roles,
  keywords: config.keywords,
  sector: tenant.sector_code
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `sector_decision_maker_configs`
   - Configuração de cargos típicos por setor
   - Keywords específicas do setor
   - Hierarquia organizacional típica

2. ✅ **Componente:** Adapta busca Apollo baseada no setor
   - Para saúde: busca "Diretor Médico", "Coordenador de Enfermagem"
   - Para construção: busca "Engenheiro Responsável", "Diretor de Obras"
   - Para agro: busca "Diretor Agrícola", "Gerente de Fazenda"

#### ROBUSTEZ MANTIDA:
- ✅ Mesma integração Apollo.io
- ✅ Mesma extração LinkedIn
- ✅ Mesma estrutura de dados
- ✅ Mesmo enriquecimento

---

### ABA 3: 🌐 **DIGITAL INTELLIGENCE**

#### ANTES:
```typescript
// Análise focada em tech stack
const techStack = analyzeTechStack(company);
```

#### AGORA (Multi-Setor):
```typescript
// Análise adaptada ao setor
interface SectorDigitalConfig {
  sector_code: string;
  relevant_metrics: string[];      // Ex: ["e-commerce", "app mobile"] para varejo
  tech_categories: string[];       // Categorias relevantes por setor
  digital_maturity_indicators: string[];
}

// Análise contextualizada
const config = await getSectorDigitalConfig(tenant.sector_code);
const analysis = analyzeDigitalPresence(company, {
  sector: tenant.sector_code,
  relevantMetrics: config.relevant_metrics,
  techCategories: config.tech_categories
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `sector_digital_configs`
   - Métricas relevantes por setor
   - Categorias de tecnologia por setor
   - Indicadores de maturidade digital por setor

2. ✅ **Componente:** Adapta análise baseada no setor
   - Para varejo: foca em e-commerce, marketplaces, apps mobile
   - Para saúde: foca em telemedicina, prontuário eletrônico, agendamento online
   - Para agro: foca em IoT, sensores, gestão de fazenda digital

#### ROBUSTEZ MANTIDA:
- ✅ Mesma análise IA (GPT-4o-mini)
- ✅ Mesma extração de dados web
- ✅ Mesma estrutura de resultados
- ✅ Mesmo sistema de scoring

---

### ABA 4: 🎯 **COMPETITORS**

#### ANTES:
```typescript
// Competidores hardcoded (SAP, Oracle, Microsoft para TOTVS)
const competitors = ["SAP", "Oracle", "Microsoft"];
```

#### AGORA (Multi-Setor):
```typescript
// Competidores descobertos dinamicamente
interface CompetitorDiscoveryConfig {
  tenant_id: UUID;
  sector_code: string;
  niche_code?: string;
  competitor_keywords: string[];   // Termos para identificar competidores
  market_position: string;          // Líder, Desafiante, Seguidor, Nicho
}

// Descoberta dinâmica
const config = await getTenantCompetitorConfig(tenant_id);
const competitors = await discoverCompetitors(company, {
  sector: config.sector_code,
  keywords: config.competitor_keywords,
  tenantProducts: tenant.products
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `tenant_competitor_configs`
   - Competidores conhecidos do tenant
   - Keywords para identificar competidores
   - Posicionamento de mercado

2. ✅ **Edge Function:** `discover-all-technologies` → genérica
   - Descobre tecnologias usadas pela empresa
   - Compara com produtos do tenant
   - Identifica competidores no mesmo setor

3. ✅ **Componente:** Mostra competidores do setor, não apenas tech
   - Para saúde: mostra outros hospitais/clínicas
   - Para construção: mostra outras construtoras
   - Para agro: mostra outras empresas agrícolas

#### ROBUSTEZ MANTIDA:
- ✅ Mesma descoberta de tecnologias
- ✅ Mesma análise de market share
- ✅ Mesma estrutura de dados
- ✅ Mesmo sistema de comparação

---

### ABA 5: 🏢 **SIMILAR COMPANIES**

#### ANTES:
```typescript
// Busca empresas similares genéricas
const similar = await findSimilarCompanies(company);
```

#### AGORA (Multi-Setor):
```typescript
// Busca contextualizada por setor/nicho
interface SimilarCompanyConfig {
  sector_code: string;
  niche_code?: string;
  similarity_factors: string[];    // Ex: ["CNAE", "porte", "localização"]
  weight_factors: Record<string, number>;  // Pesos por fator
}

// Busca adaptada
const config = await getSectorSimilarConfig(tenant.sector_code);
const similar = await findSimilarCompanies(company, {
  sector: config.sector_code,
  niche: config.niche_code,
  factors: config.similarity_factors,
  weights: config.weight_factors
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `sector_similarity_configs`
   - Fatores de similaridade por setor
   - Pesos por fator
   - Thresholds de similaridade

2. ✅ **Componente:** Adapta busca baseada no setor
   - Para saúde: similaridade por especialidade, porte, região
   - Para construção: similaridade por tipo de obra, porte, região
   - Para agro: similaridade por cultura, área, região

#### ROBUSTEZ MANTIDA:
- ✅ Mesma busca multi-estratégia
- ✅ Mesmo enriquecimento automático
- ✅ Mesma estrutura de dados
- ✅ Mesmo sistema de scoring

---

### ABA 6: 👥 **CLIENT DISCOVERY**

#### ANTES:
```typescript
// Busca clientes genérica
const clients = await discoverClients(company);
```

#### AGORA (Multi-Setor):
```typescript
// Busca contextualizada por setor
interface ClientDiscoveryConfig {
  sector_code: string;
  discovery_strategies: string[];   // Ex: ["cases", "portfolio", "testimonials"]
  sector_specific_paths: string[];  // Ex: ["/clientes", "/cases", "/portfolio"]
  keywords: string[];               // Termos específicos do setor
}

// Busca adaptada
const config = await getSectorClientConfig(tenant.sector_code);
const clients = await discoverClients(company, {
  sector: config.sector_code,
  strategies: config.discovery_strategies,
  paths: config.sector_specific_paths,
  keywords: config.keywords
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `sector_client_discovery_configs`
   - Estratégias de descoberta por setor
   - Paths específicos do setor
   - Keywords por setor

2. ✅ **Componente:** Adapta busca baseada no setor
   - Para saúde: busca em "/pacientes", "/depoimentos", "/especialidades"
   - Para construção: busca em "/obras", "/projetos", "/clientes"
   - Para agro: busca em "/fazendas", "/culturas", "/clientes"

#### ROBUSTEZ MANTIDA:
- ✅ Mesma integração Jina AI
- ✅ Mesma integração Serper
- ✅ Mesma integração LinkedIn
- ✅ Mesmo sistema de filtragem

---

### ABA 7: 📊 **360° ANALYSIS**

#### ANTES:
```typescript
// Análise genérica 360°
const analysis = await analyze360(company);
```

#### AGORA (Multi-Setor):
```typescript
// Análise contextualizada por setor
interface Sector360Config {
  sector_code: string;
  analysis_dimensions: string[];   // Dimensões relevantes por setor
  sector_specific_metrics: Record<string, any>;
  benchmarks: Record<string, number>;  // Benchmarks do setor
}

// Análise adaptada
const config = await getSector360Config(tenant.sector_code);
const analysis = await analyze360(company, {
  sector: config.sector_code,
  dimensions: config.analysis_dimensions,
  metrics: config.sector_specific_metrics,
  benchmarks: config.benchmarks
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `sector_360_configs`
   - Dimensões de análise por setor
   - Métricas específicas do setor
   - Benchmarks do setor

2. ✅ **Componente:** Adapta análise baseada no setor
   - Para saúde: foca em certificações, especialidades, equipamentos
   - Para construção: foca em obras concluídas, certificações, segurança
   - Para agro: foca em área cultivada, certificações, sustentabilidade

#### ROBUSTEZ MANTIDA:
- ✅ Mesma análise holística
- ✅ Mesma estrutura de dados
- ✅ Mesmas visualizações
- ✅ Mesmo sistema de scoring

---

### ABA 8: 📦 **RECOMMENDED PRODUCTS**

#### ANTES:
```typescript
// Produtos hardcoded (TOTVS)
const products = ["Protheus", "Fluig", "RM"];
```

#### AGORA (Multi-Tenant):
```typescript
// Produtos configuráveis por tenant
interface TenantProduct {
  id: UUID;
  tenant_id: UUID;
  name: string;
  category: string;
  description: string;
  sector_fit: string[];            // Setores onde se encaixa
  niche_fit?: string[];            // Nichos onde se encaixa
  use_cases: string[];
  roi_months: number;
  pricing_tier: 'basic' | 'standard' | 'advanced';
}

// Recomendação baseada no tenant
const tenantProducts = await getTenantProducts(tenant_id);
const recommendations = await recommendProducts(company, {
  tenantProducts: tenantProducts,
  sector: tenant.sector_code,
  niche: tenant.niche_code
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `tenant_products` (já existe parcialmente)
   - Produtos/serviços do tenant
   - Categorização por setor/nicho
   - Use cases e ROI

2. ✅ **Edge Function:** `generate-product-gaps` → genérica
   - Analisa gaps da empresa
   - Compara com produtos do tenant
   - Recomenda baseado em fit

3. ✅ **Componente:** Mostra produtos do tenant, não apenas TOTVS
   - Para tenant de saúde: mostra serviços médicos, equipamentos
   - Para tenant de construção: mostra materiais, serviços de engenharia
   - Para tenant de agro: mostra sementes, fertilizantes, equipamentos

#### ROBUSTEZ MANTIDA:
- ✅ Mesma análise IA (GPT-4o-mini)
- ✅ Mesma estrutura de recomendação
- ✅ Mesmo sistema de scoring (fit score)
- ✅ Mesmas estratégias (cross-sell, upsell, new sale)

---

### ABA 9: 🎯 **OPORTUNIDADES**

#### ANTES:
```typescript
// Oportunidades baseadas em produtos TOTVS
const opportunities = analyzeTOTVSOpportunities(company);
```

#### AGORA (Multi-Tenant):
```typescript
// Oportunidades baseadas em produtos do tenant
interface OpportunityAnalysisConfig {
  tenant_id: UUID;
  sector_code: string;
  opportunity_matrix: Record<string, any>;  // Matriz de oportunidades por setor
}

// Análise adaptada
const config = await getTenantOpportunityConfig(tenant_id);
const opportunities = await analyzeOpportunities(company, {
  tenantProducts: tenant.products,
  sector: config.sector_code,
  matrix: config.opportunity_matrix
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `tenant_opportunity_configs`
   - Matriz de oportunidades por tenant
   - Produtos Primários vs Relevantes
   - Use cases por setor

2. ✅ **Componente:** Adapta análise baseada no tenant
   - Mostra produtos do tenant em uso
   - Mostra oportunidades primárias (produtos Primários não detectados)
   - Mostra oportunidades relevantes (produtos Relevantes não detectados)
   - Calcula potencial baseado no tenant

#### ROBUSTEZ MANTIDA:
- ✅ Mesma análise de gaps
- ✅ Mesma estrutura de oportunidades
- ✅ Mesmo sistema de priorização
- ✅ Mesmas estratégias de abordagem

---

### ABA 10: 📋 **EXECUTIVE SUMMARY**

#### ANTES:
```typescript
// Resumo genérico
const summary = generateExecutiveSummary(company, stcResult);
```

#### AGORA (Multi-Tenant):
```typescript
// Resumo contextualizado por tenant
interface ExecutiveSummaryConfig {
  tenant_id: UUID;
  sector_code: string;
  summary_sections: string[];      // Seções relevantes por setor
  key_metrics: string[];           // Métricas-chave por setor
}

// Resumo adaptado
const config = await getTenantSummaryConfig(tenant_id);
const summary = await generateExecutiveSummary(company, {
  tenant: tenant,
  sector: config.sector_code,
  sections: config.summary_sections,
  metrics: config.key_metrics
});
```

#### MUDANÇAS NECESSÁRIAS:
1. ✅ **Tabela:** `tenant_summary_configs`
   - Seções relevantes por tenant/setor
   - Métricas-chave por setor
   - Template de resumo por setor

2. ✅ **Componente:** Adapta resumo baseado no tenant
   - Para saúde: foca em certificações, especialidades, equipamentos
   - Para construção: foca em obras, certificações, segurança
   - Para agro: foca em área, certificações, sustentabilidade

#### ROBUSTEZ MANTIDA:
- ✅ Mesma estrutura de resumo
- ✅ Mesmas métricas consolidadas
- ✅ Mesmo sistema de visualização
- ✅ Mesmo formato de exportação

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS NECESSÁRIA

### Novas Tabelas:

```sql
-- Configuração de produtos do tenant
CREATE TABLE tenant_products (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  sector_fit TEXT[],
  niche_fit TEXT[],
  use_cases TEXT[],
  roi_months INTEGER,
  pricing_tier VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Configuração de busca do tenant
CREATE TABLE tenant_search_configs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  search_terms TEXT[] NOT NULL,
  aliases TEXT[],
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Configuração de setor (genérica, reutilizável)
CREATE TABLE sector_configs (
  sector_code VARCHAR(50) PRIMARY KEY,
  sector_name VARCHAR(100) NOT NULL,
  decision_maker_config JSONB,
  digital_config JSONB,
  competitor_config JSONB,
  similarity_config JSONB,
  client_discovery_config JSONB,
  analysis_360_config JSONB,
  summary_config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Configuração de competidores do tenant
CREATE TABLE tenant_competitor_configs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  competitor_keywords TEXT[],
  known_competitors TEXT[],
  market_position VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 ADAPTAÇÕES TÉCNICAS NECESSÁRIAS

### 1. Edge Functions:

#### `simple-usage-check` (ex `simple-totvs-check`):
```typescript
// Recebe tenant_id
export async function handler(req: Request) {
  const { companyId, tenantId } = await req.json();
  
  // Busca configuração do tenant
  const tenant = await getTenant(tenantId);
  const config = await getTenantSearchConfig(tenantId);
  
  // Gera termos de busca dinamicamente
  const searchTerms = [
    tenant.company_name,
    ...config.search_terms,
    ...tenant.products.map(p => p.name)
  ];
  
  // Executa busca (mesma lógica robusta)
  const results = await searchIn70Sources(searchTerms, company);
  
  return results;
}
```

### 2. Componentes React:

#### `UsageVerificationCard` (ex `TOTVSCheckCard`):
```typescript
interface UsageVerificationCardProps {
  companyId: string;
  tenantId: string;  // Novo: tenant_id
  // ... outras props
}

export function UsageVerificationCard({ companyId, tenantId, ...props }) {
  const { data: tenant } = useTenant(tenantId);
  const { data: config } = useTenantConfig(tenantId);
  
  // Usa configuração do tenant ao invés de hardcoded
  const searchTerms = useMemo(() => [
    tenant?.company_name,
    ...config?.search_terms || [],
    ...tenant?.products?.map(p => p.name) || []
  ], [tenant, config]);
  
  // Resto do componente igual, mas usando dados dinâmicos
}
```

### 3. Hooks:

#### `useTenantConfig`:
```typescript
export function useTenantConfig(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenant_search_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      return data;
    }
  });
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Infraestrutura (Semana 1-2)
- [ ] Criar tabelas de configuração (`tenant_products`, `tenant_search_configs`, `sector_configs`)
- [ ] Criar migrations SQL
- [ ] Criar hooks React (`useTenantConfig`, `useTenantProducts`)
- [ ] Criar serviços de configuração (`getTenantConfig`, `getSectorConfig`)

### FASE 2: Edge Functions (Semana 2-3)
- [ ] Renomear `simple-totvs-check` → `simple-usage-check`
- [ ] Adaptar para receber `tenant_id`
- [ ] Adaptar para usar configuração dinâmica
- [ ] Testar com múltiplos tenants

### FASE 3: Componentes (Semana 3-4)
- [ ] Renomear `TOTVSCheckCard` → `UsageVerificationCard`
- [ ] Adaptar todas as 10 abas para usar `tenant_id`
- [ ] Adaptar para usar configuração dinâmica
- [ ] Manter mesma robustez e UX

### FASE 4: Configurações por Setor (Semana 4-5)
- [ ] Popular `sector_configs` com dados dos 260 setores
- [ ] Criar interface de configuração para tenants
- [ ] Testar com diferentes setores

### FASE 5: Testes e Validação (Semana 5-6)
- [ ] Testar com tenant de saúde
- [ ] Testar com tenant de construção
- [ ] Testar com tenant de agro
- [ ] Validar robustez mantida

---

## 🎯 PRINCÍPIOS DE ADAPTAÇÃO

### ✅ MANTER:
1. **Robustez:** Mesmas 70 fontes, mesma validação IA
2. **Estrutura:** Mesma arquitetura de componentes
3. **UX:** Mesma experiência do usuário
4. **Performance:** Mesma velocidade e eficiência

### 🔄 ADAPTAR:
1. **Configuração:** De hardcoded para dinâmica
2. **Termos:** De fixos para baseados no tenant
3. **Produtos:** De TOTVS para produtos do tenant
4. **Contexto:** De tech para qualquer setor

### ➕ ADICIONAR:
1. **Multi-tenancy:** Isolamento de dados por tenant
2. **Configurabilidade:** Interface para configurar produtos/termos
3. **Setorização:** Lógica específica por setor
4. **Flexibilidade:** Suporte a 260 setores

---

## 📊 RESUMO POR ABA

| Aba | Adaptação | Robustez | Status |
|-----|-----------|----------|--------|
| 1. Verificação | Config dinâmica | ✅ Mantida | 🔄 A adaptar |
| 2. Decisores | Config por setor | ✅ Mantida | 🔄 A adaptar |
| 3. Digital | Config por setor | ✅ Mantida | 🔄 A adaptar |
| 4. Competitors | Config por tenant | ✅ Mantida | 🔄 A adaptar |
| 5. Similar | Config por setor | ✅ Mantida | 🔄 A adaptar |
| 6. Clients | Config por setor | ✅ Mantida | 🔄 A adaptar |
| 7. 360° | Config por setor | ✅ Mantida | 🔄 A adaptar |
| 8. Products | Config por tenant | ✅ Mantida | 🔄 A adaptar |
| 9. Oportunidades | Config por tenant | ✅ Mantida | 🔄 A adaptar |
| 10. Executive | Config por tenant | ✅ Mantida | 🔄 A adaptar |

---

**Última atualização:** 19/01/2025  
**Status:** 📋 Plano de adaptação completo

