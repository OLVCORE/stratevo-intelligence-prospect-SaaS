# 🚀 ESTRATÉGIA COMPLETA: TURBINAR PROSPECÇÃO AVANÇADA V2.0

## 📊 SITUAÇÃO ATUAL

### ✅ O QUE JÁ TEMOS (Base Sólida):
1. **CNAE Enriquecido** → Setor/Indústria + Categoria (1327 registros)
2. **Filtros Robustos** → CNAE, NCM, Características Especiais, Porte, Localização
3. **APIs Integradas:**
   - ✅ EmpresaQui (busca por CNAE/localização)
   - ✅ Apollo.io (decisores e contatos)
   - ✅ Hunter.io (e-mails corporativos)
   - ✅ ReceitaWS/BrasilAPI (dados cadastrais)
   - ⚠️ SERPER (removido - retornava produtos/listas)

### ⚠️ LIMITAÇÕES IDENTIFICADAS:
1. **EmpresaQui** → Principal fonte, mas pode ter limitações de cobertura
2. **Apollo** → CORS issues, uso parcial
3. **Hunter** → Apenas e-mails, sem verificação robusta
4. **Falta de Multi-Source** → Dependência de uma única fonte principal
5. **Sem Scoring Inteligente** → Não prioriza empresas por relevância real
6. **Sem Validação de Atividade** → Pode trazer empresas inativas/baixadas

---

## 🎯 ESTRATÉGIA: 5 PILARES DE TURBINAMENTO

### **PILAR 1: MULTI-SOURCE INTELLIGENCE** 🔄
**Objetivo:** Não depender de uma única fonte. Combinar múltiplas fontes para máxima cobertura.

#### **1.1. Fontes Primárias (Estruturais)**
```
┌─────────────────────────────────────────────────┐
│ FONTE 1: EmpresaQui (Atual)                    │
│ ✅ Busca por CNAE, localização, porte          │
│ ⚠️ Limitação: Cobertura pode ser limitada      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ FONTE 2: BaseCNPJ / PesquisaEmpresas (NOVO)     │
│ ✅ 68+ milhões de empresas                      │
│ ✅ Filtros avançados por CNAE, localização     │
│ ✅ Dados atualizados da Receita Federal         │
│ 💰 Custo: API ou planos mensais                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ FONTE 3: Consultar.IO API (NOVO)               │
│ ✅ API RESTful completa                         │
│ ✅ Dados cadastrais + situação                  │
│ ✅ Busca por múltiplos critérios                │
│ 💰 Custo: Planos por requisição                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ FONTE 4: Oportunidados API (NOVO)              │
│ ✅ Informações detalhadas de empresas           │
│ ✅ Atividade econômica, localização            │
│ ✅ Integração direta                           │
│ 💰 Custo: Verificar planos                      │
└─────────────────────────────────────────────────┘
```

#### **1.2. Fontes Secundárias (Enriquecimento)**
```
┌─────────────────────────────────────────────────┐
│ ENRIQUECIMENTO 1: ReceitaWS (Atual)            │
│ ✅ Dados oficiais (CNPJ, razão social)         │
│ ✅ Situação cadastral, capital social           │
│ ✅ Endereço completo                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ENRIQUECIMENTO 2: BrasilAPI (Expandir)         │
│ ✅ CNPJ V2 (dados completos)                    │
│ ✅ CEP V2 (geocoding preciso)                  │
│ ✅ NCM (importação/exportação)                 │
│ ⚠️ ATUAL: Apenas CNPJ básico                  │
│ 🎯 EXPANDIR: Usar todas as features            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ENRIQUECIMENTO 3: LinkedIn (PhantomBuster)     │
│ ✅ Perfil da empresa                           │
│ ✅ Funcionários e decisores                    │
│ ✅ Atualizações e posts                        │
│ ⚠️ ATUAL: Configurado mas subutilizado         │
│ 🎯 EXPANDIR: Integração completa               │
└─────────────────────────────────────────────────┘
```

#### **1.3. Estratégia de Orquestração**
```typescript
// PSEUDO-CODE: Multi-Source Strategy
async function buscarEmpresasMultiSource(filtros) {
  const resultados = [];
  
  // FASE 1: Busca Paralela em Múltiplas Fontes
  const [empresaQui, baseCNPJ, consultarIO] = await Promise.allSettled([
    buscarViaEmpresaQui(filtros),
    buscarViaBaseCNPJ(filtros),      // NOVO
    buscarViaConsultarIO(filtros),   // NOVO
  ]);
  
  // FASE 2: Deduplicação Inteligente (por CNPJ)
  const empresasUnicas = deduplicarPorCNPJ([
    ...empresaQui.value || [],
    ...baseCNPJ.value || [],
    ...consultarIO.value || [],
  ]);
  
  // FASE 3: Enriquecimento Paralelo
  const empresasEnriquecidas = await Promise.allSettled(
    empresasUnicas.map(empresa => enriquecerEmpresa(empresa))
  );
  
  // FASE 4: Validação e Filtragem
  return empresasEnriquecidas
    .filter(e => e.status === 'fulfilled')
    .map(e => e.value)
    .filter(validarEmpresaAtiva)
    .filter(aplicarFiltrosAvancados);
}
```

---

### **PILAR 2: SCORING INTELIGENTE** 🎯
**Objetivo:** Priorizar empresas por relevância real, não apenas quantidade.

#### **2.1. Score de Relevância (0-100)**
```typescript
interface ScoreRelevancia {
  // Dados Básicos (30 pontos)
  temCNPJ: boolean;              // +10 pontos
  situacaoAtiva: boolean;        // +10 pontos
  temSite: boolean;              // +10 pontos
  
  // Enriquecimento (40 pontos)
  temLinkedIn: boolean;          // +10 pontos
  temDecisores: boolean;          // +15 pontos
  temEmails: boolean;             // +15 pontos
  
  // Match com Filtros (30 pontos)
  matchCNAE: number;             // +10 pontos (exato) ou +5 (parcial)
  matchLocalizacao: number;      // +10 pontos (cidade) ou +5 (estado)
  matchPorte: number;            // +10 pontos
  matchCaracteristicas: number;  // +5 pontos por característica
}

// Exemplo:
// Empresa A: CNPJ ✅ + Site ✅ + LinkedIn ✅ + Decisores ✅ + Match CNAE exato
// Score: 10 + 10 + 10 + 10 + 15 + 10 = 65 pontos

// Empresa B: CNPJ ✅ + Site ✅ (sem LinkedIn, sem decisores, match parcial)
// Score: 10 + 10 + 10 = 30 pontos

// Resultado: Empresa A aparece primeiro (mais relevante)
```

#### **2.2. Score de Qualidade de Dados**
```typescript
interface ScoreQualidade {
  completude: number;        // % de campos preenchidos
  atualizacao: number;       // Data da última atualização
  confiabilidade: number;    // Fonte dos dados (oficial = maior)
  consistencia: number;      // Dados consistentes entre fontes
}

// Empresas com score > 70 aparecem primeiro
// Empresas com score < 40 são marcadas como "dados incompletos"
```

#### **2.3. Score de Fit com ICP (Opcional - Fase 2)**
```typescript
// Se o tenant tiver ICP configurado, calcular fit
interface ScoreICP {
  matchSetor: number;           // Setor alvo do tenant
  matchPorte: number;           // Porte ideal
  matchLocalizacao: number;     // Região preferida
  matchCaracteristicas: number; // Características desejadas
}

// Score Total = (Relevância * 0.5) + (Qualidade * 0.3) + (ICP * 0.2)
```

---

### **PILAR 3: VALIDAÇÃO E FILTRAGEM AVANÇADA** ✅
**Objetivo:** Garantir que apenas empresas reais, ativas e relevantes sejam retornadas.

#### **3.1. Validação de Situação Cadastral**
```typescript
async function validarEmpresaAtiva(cnpj: string): Promise<boolean> {
  // 1. Consultar ReceitaWS
  const dados = await consultarReceitaWS(cnpj);
  
  // 2. Validar situação
  const situacoesValidas = ['ATIVA', 'BAIXADA', 'SUSPENSA'];
  if (!situacoesValidas.includes(dados.situacao_cadastral)) {
    return false;
  }
  
  // 3. Se BAIXADA, verificar data (últimos 6 meses = ainda relevante)
  if (dados.situacao_cadastral === 'BAIXADA') {
    const dataBaixa = new Date(dados.data_situacao_cadastral);
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
    
    return dataBaixa > seisMesesAtras; // Baixada recentemente = ainda relevante
  }
  
  return true;
}
```

#### **3.2. Validação de Atividade Real**
```typescript
async function validarAtividadeReal(empresa: Empresa): Promise<boolean> {
  const checks = [];
  
  // Check 1: Site responde (não é 404)
  if (empresa.site) {
    const siteAtivo = await verificarSiteAtivo(empresa.site);
    checks.push(siteAtivo);
  }
  
  // Check 2: LinkedIn atualizado (últimos 6 meses)
  if (empresa.linkedin) {
    const linkedinAtivo = await verificarLinkedInAtivo(empresa.linkedin);
    checks.push(linkedinAtivo);
  }
  
  // Check 3: Capital social > 0 (não é empresa fantasma)
  if (empresa.capital_social && empresa.capital_social > 0) {
    checks.push(true);
  }
  
  // Check 4: Tem funcionários estimados > 0
  if (empresa.funcionarios_estimados && empresa.funcionarios_estimados > 0) {
    checks.push(true);
  }
  
  // Precisa passar em pelo menos 2 checks
  return checks.filter(Boolean).length >= 2;
}
```

#### **3.3. Filtragem por CNAE Inteligente**
```typescript
// Agora que temos Setor/Categoria, podemos filtrar melhor
function filtrarPorCNAEInteligente(empresas: Empresa[], filtros: Filtros) {
  if (!filtros.cnaesAlvo || filtros.cnaesAlvo.length === 0) {
    return empresas;
  }
  
  return empresas.filter(empresa => {
    // 1. Match exato de CNAE
    if (filtros.cnaesAlvo.includes(empresa.cnae_principal)) {
      return true;
    }
    
    // 2. Match por Setor/Indústria (usando nossa tabela!)
    const classificacao = await getCnaeClassification(empresa.cnae_principal);
    if (classificacao) {
      // Se o usuário busca "Tecnologia da Informação", aceitar qualquer CNAE desse setor
      const setoresBuscados = filtros.cnaesAlvo.map(cnae => {
        const cls = await getCnaeClassification(cnae);
        return cls?.setor_industria;
      }).filter(Boolean);
      
      if (setoresBuscados.includes(classificacao.setor_industria)) {
        return true;
      }
    }
    
    return false;
  });
}
```

---

### **PILAR 4: ENRIQUECIMENTO MULTI-CAMADA** 🔍
**Objetivo:** Coletar o máximo de dados possível de cada empresa encontrada.

#### **4.1. Camada 1: Dados Cadastrais (Obrigatório)**
```
✅ CNPJ (14 dígitos válido)
✅ Razão Social
✅ Nome Fantasia
✅ Situação Cadastral
✅ Endereço Completo (CEP, rua, cidade, UF)
✅ Capital Social
✅ Data de Abertura
```

#### **4.2. Camada 2: Dados Digitais (Alta Prioridade)**
```
✅ Website (validado e ativo)
✅ LinkedIn Company Page
✅ E-mails corporativos (via Hunter.io)
✅ Telefones (validados)
```

#### **4.3. Camada 3: Decisores e Contatos (Média Prioridade)**
```
✅ Decisores via Apollo.io:
   - Nome completo
   - Cargo/título
   - LinkedIn pessoal
   - E-mail (se disponível)
   
✅ Funcionários via LinkedIn (PhantomBuster):
   - Lista de funcionários
   - Cargos principais
   - Tempo na empresa
```

#### **4.4. Camada 4: Dados Financeiros e Comerciais (Baixa Prioridade)**
```
✅ Faturamento estimado (Apollo ou estimativa por porte)
✅ Número de funcionários (Apollo ou ReceitaWS)
✅ Indicadores financeiros (se disponível via APIs pagas)
```

#### **4.5. Camada 5: Dados Contextuais (Opcional - Fase 2)**
```
✅ Tech Stack (BuiltWith/Wappalyzer)
✅ Presença em Marketplaces (Mercado Livre, Amazon, etc.)
✅ Redes Sociais (Instagram, Facebook)
✅ Notícias recentes (Google News)
✅ Processos judiciais (JusBrasil - se disponível)
```

#### **4.6. Estratégia de Enriquecimento Paralelo**
```typescript
async function enriquecerEmpresaMultiCamada(empresa: Empresa): Promise<EmpresaEnriquecida> {
  // Executar todas as camadas em paralelo (com timeout)
  const [cadastral, digital, decisores, financeiro] = await Promise.allSettled([
    enriquecerCadastral(empresa.cnpj),           // Camada 1
    enriquecerDigital(empresa.site),             // Camada 2
    enriquecerDecisores(empresa.razao_social),  // Camada 3
    enriquecerFinanceiro(empresa.cnpj),          // Camada 4
  ]);
  
  // Consolidar resultados
  return {
    ...empresa,
    ...cadastral.value,
    ...digital.value,
    decisores: decisores.value || [],
    ...financeiro.value,
  };
}
```

---

### **PILAR 5: OTIMIZAÇÃO DE PERFORMANCE** ⚡
**Objetivo:** Buscar muitas empresas rapidamente, sem travar o sistema.

#### **5.1. Estratégia de Batching**
```typescript
// Em vez de buscar 100 empresas sequencialmente (lento)
// Buscar em lotes de 10 em paralelo (rápido)

const BATCH_SIZE = 10;
const empresas = [];

for (let i = 0; i < candidatas.length; i += BATCH_SIZE) {
  const batch = candidatas.slice(i, i + BATCH_SIZE);
  
  const resultados = await Promise.allSettled(
    batch.map(empresa => enriquecerEmpresa(empresa))
  );
  
  empresas.push(...resultados.filter(r => r.status === 'fulfilled'));
  
  // Rate limiting: aguardar 1s entre batches
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

#### **5.2. Cache Inteligente**
```typescript
// Cachear resultados de empresas já buscadas
// Reduzir chamadas desnecessárias às APIs

interface CacheEmpresa {
  cnpj: string;
  dados: EmpresaEnriquecida;
  timestamp: number;
  ttl: number; // Time to live (ex: 7 dias)
}

// Antes de buscar, verificar cache
const cached = await getFromCache(empresa.cnpj);
if (cached && !isExpired(cached)) {
  return cached.dados;
}

// Se não estiver em cache, buscar e salvar
const dados = await enriquecerEmpresa(empresa);
await saveToCache(empresa.cnpj, dados);
```

#### **5.3. Priorização de Fontes**
```typescript
// Tentar fontes mais rápidas primeiro
// Se falhar, tentar fontes mais lentas como fallback

async function buscarEmpresaPriorizada(cnpj: string) {
  // Tentar 1: ReceitaWS (rápido, gratuito)
  try {
    return await consultarReceitaWS(cnpj);
  } catch (e) {
    // Tentar 2: BrasilAPI (rápido, gratuito)
    try {
      return await consultarBrasilAPI(cnpj);
    } catch (e) {
      // Tentar 3: Consultar.IO (mais lento, pode ser pago)
      return await consultarIO(cnpj);
    }
  }
}
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO (FASES)

### **FASE 1: FUNDAÇÃO (Sprint 1-2)** 🏗️
**Objetivo:** Estabelecer base sólida multi-source

#### **Tarefas:**
1. ✅ **Integrar BaseCNPJ ou PesquisaEmpresas API**
   - Adicionar como fonte secundária
   - Testar cobertura vs EmpresaQui
   - Implementar deduplicação por CNPJ

2. ✅ **Expandir BrasilAPI**
   - Usar CNPJ V2 (dados completos)
   - Usar CEP V2 (geocoding preciso)
   - Usar NCM (importação/exportação)

3. ✅ **Implementar Scoring Básico**
   - Score de Relevância (0-100)
   - Score de Qualidade de Dados
   - Ordenar resultados por score

4. ✅ **Validação de Situação Cadastral**
   - Filtrar apenas empresas ATIVAS
   - Aceitar BAIXADAS recentes (< 6 meses)

**Resultado Esperado:**
- 2-3x mais empresas encontradas
- Dados mais completos
- Resultados ordenados por relevância

---

### **FASE 2: ENRIQUECIMENTO (Sprint 3-4)** 🔍
**Objetivo:** Coletar dados completos de cada empresa

#### **Tarefas:**
1. ✅ **Enriquecimento Multi-Camada**
   - Implementar todas as 5 camadas
   - Execução paralela com timeouts
   - Fallback entre fontes

2. ✅ **Integração PhantomBuster Completa**
   - LinkedIn company scraping
   - LinkedIn people scraping
   - Atualizações e posts

3. ✅ **Validação de Atividade Real**
   - Verificar site ativo
   - Verificar LinkedIn atualizado
   - Filtrar empresas fantasma

4. ✅ **Filtragem por CNAE Inteligente**
   - Usar Setor/Categoria na filtragem
   - Match parcial por setor
   - Priorizar match exato

**Resultado Esperado:**
- 80%+ de empresas com dados completos
- Decisores encontrados para 60%+ das empresas
- E-mails válidos para 50%+ das empresas

---

### **FASE 3: INTELIGÊNCIA (Sprint 5-6)** 🧠
**Objetivo:** Adicionar camada de inteligência e predição

#### **Tarefas:**
1. ✅ **Score de Fit com ICP**
   - Calcular match com perfil do tenant
   - Priorizar empresas que "fazem sentido"
   - Ordenar por fit score

2. ✅ **Cache Inteligente**
   - Implementar cache de empresas
   - TTL de 7 dias
   - Invalidar cache quando necessário

3. ✅ **Otimização de Performance**
   - Batching de enriquecimento
   - Priorização de fontes
   - Rate limiting inteligente

4. ✅ **Dashboard de Métricas**
   - Taxa de sucesso por fonte
   - Tempo médio de busca
   - Qualidade dos dados coletados

**Resultado Esperado:**
- Busca 3x mais rápida
- 90%+ de cache hit rate
- Resultados mais relevantes para o tenant

---

### **FASE 4: AVANÇADO (Sprint 7-8)** 🚀
**Objetivo:** Features avançadas de prospecção

#### **Tarefas:**
1. ✅ **Dados Contextuais**
   - Tech Stack (BuiltWith)
   - Presença em Marketplaces
   - Redes Sociais
   - Notícias recentes

2. ✅ **Alertas Proativos**
   - Empresas que abriram recentemente
   - Empresas que contrataram (job postings)
   - Empresas que receberam funding
   - Mudanças de endereço/telefone

3. ✅ **Análise de Fit Preditivo**
   - Machine Learning básico
   - Predição de interesse
   - Recomendações personalizadas

**Resultado Esperado:**
- Prospecção proativa (não apenas reativa)
- Insights acionáveis
- Recomendações inteligentes

---

## 📊 MÉTRICAS DE SUCESSO

### **KPIs Principais:**
1. **Cobertura:** % de empresas encontradas vs. esperadas
   - Meta: 80%+ de cobertura

2. **Completude:** % de campos preenchidos por empresa
   - Meta: 70%+ de completude média

3. **Qualidade:** % de empresas com dados validados
   - Meta: 90%+ de qualidade

4. **Velocidade:** Tempo médio de busca
   - Meta: < 30 segundos para 20 empresas

5. **Relevância:** % de empresas com score > 70
   - Meta: 60%+ de relevância

---

## 💰 CUSTOS ESTIMADOS

### **APIs Gratuitas (Atuais):**
- ✅ ReceitaWS: Gratuito (com limites)
- ✅ BrasilAPI: Gratuito
- ✅ EmpresaQui: Já configurado
- ✅ Apollo.io: Já configurado
- ✅ Hunter.io: Já configurado

### **APIs Pagas (Novas - Opcionais):**
- 💰 BaseCNPJ: ~R$ 200-500/mês (planos variados)
- 💰 PesquisaEmpresas: ~R$ 150-400/mês
- 💰 Consultar.IO: ~R$ 0,10-0,50 por requisição
- 💰 Oportunidados: Verificar planos

### **Recomendação:**
- **Fase 1:** Usar apenas APIs gratuitas + já configuradas
- **Fase 2:** Avaliar ROI antes de adicionar APIs pagas
- **Fase 3:** Adicionar APIs pagas apenas se ROI positivo

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Esta Semana:**
1. ✅ Expandir uso do BrasilAPI (CNPJ V2, CEP V2, NCM)
2. ✅ Implementar scoring básico de relevância
3. ✅ Validação de situação cadastral
4. ✅ Filtragem por CNAE inteligente (usando Setor/Categoria)

### **Próxima Semana:**
1. ✅ Integrar BaseCNPJ ou PesquisaEmpresas (testar cobertura)
2. ✅ Enriquecimento multi-camada completo
3. ✅ Integração PhantomBuster completa
4. ✅ Cache inteligente

### **Próximo Mês:**
1. ✅ Score de Fit com ICP
2. ✅ Otimização de performance
3. ✅ Dashboard de métricas
4. ✅ Dados contextuais (Tech Stack, Marketplaces)

---

## 🚀 CONCLUSÃO

Com os dados enriquecidos de CNAE (Setor/Categoria) que acabamos de implementar, agora temos a base perfeita para:

1. **Buscar empresas de forma mais inteligente** (por Setor, não apenas CNAE exato)
2. **Filtrar resultados com mais precisão** (usando Categoria: Fabricante, Serviços, etc.)
3. **Priorizar empresas relevantes** (scoring baseado em múltiplos critérios)
4. **Enriquecer dados de forma completa** (multi-camada, multi-fonte)

**A estratégia está pronta. Agora é implementar fase por fase!** 🎯

