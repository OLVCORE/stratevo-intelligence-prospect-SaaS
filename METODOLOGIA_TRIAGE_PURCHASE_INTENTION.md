# 🎯 METODOLOGIA DE TRIAGE - PURCHASE INTENTION

## 📋 VISÃO GERAL

A **Verificação de Uso** (busca de evidências de consumo) **NÃO SE APLICA MAIS** em um ambiente multi-tenant genérico.

**NOVO OBJETIVO:** **TRIAGE** - Avaliar **Purchase Intention** (Intenção de Compra) através de análise 360° focada em **FIT** e **OPORTUNIDADE**.

---

## 🔄 MUDANÇA DE PARADIGMA

### **ANTES (TOTVS-específico):**
- ❌ Buscar evidências de uso de produtos TOTVS
- ❌ Se encontrar → NO-GO (não pode vender)
- ❌ Objetivo: Evitar prospectar clientes existentes

### **AGORA (Multi-tenant genérico):**
- ✅ Avaliar **Purchase Intention** (Intenção de Compra)
- ✅ Analisar **FIT** entre empresa investigada e produtos do tenant
- ✅ Identificar **OPORTUNIDADES** de negócio
- ✅ Objetivo: Qualificar leads baseado em potencial de compra

---

## 🎯 NOVA METODOLOGIA: TRIAGE 360°

### **1. ANÁLISE DE FIT ESTRUTURAL**

#### **A. Fit por Setor/Nicho**
```
Score de Fit Setorial = (
  Setor da Empresa ∈ Setores-Alvo do Tenant? → 100 pts : 0 pts
  + Nicho da Empresa ∈ Nichos-Alvo do Tenant? → 50 pts : 0 pts
  + CNAE Principal ∈ CNAEs-Alvo do Tenant? → 30 pts : 0 pts
)
```

**Métricas:**
- Setor: Match exato = 100%, Similar = 50%, Diferente = 0%
- Nicho: Match exato = 100%, Similar = 30%, Diferente = 0%
- CNAE: Match exato = 100%, CNAE relacionado = 50%, Não relacionado = 0%

---

#### **B. Fit por NCM (Nomenclatura Comum do Mercosul)**
```
Score de Fit NCM = (
  NCMs da Empresa ∩ NCMs-Alvo do Tenant → 100 pts por match
  + NCMs Relacionados → 50 pts por match
)
```

**Lógica:**
- Se tenant vende produtos com NCM específico
- E empresa investigada trabalha com esses NCMs
- → Alto potencial de compra

**Exemplo:**
- Tenant: Software para gestão de NCM 8471 (Computadores)
- Empresa: Importa/Exporta NCM 8471
- → **FIT ALTO** (empresa precisa de software para gerenciar esses produtos)

---

#### **C. Fit por Porte e Características**
```
Score de Fit Porte = (
  Porte da Empresa ∈ Portes-Alvo do Tenant? → 100 pts : 0 pts
  + Receita ∈ Faixa-Alvo do Tenant? → 50 pts : 0 pts
  + Funcionários ∈ Faixa-Alvo do Tenant? → 30 pts : 0 pts
)
```

**Métricas:**
- Porte: Micro/Pequena/Média/Grande → Match com ICP do tenant
- Receita: Faixa de receita-alvo do tenant
- Funcionários: Número de funcionários-alvo

---

### **2. ANÁLISE DE INTENÇÃO DE COMPRA**

#### **A. Sinais de Expansão/Crescimento**
```
Score de Intenção = Σ (Peso do Sinal × Relevância)
```

**Sinais (com pesos):**
- **Contratações recentes** (vagas abertas): 30 pts
- **Expansão geográfica** (novas filiais): 25 pts
- **Investimento em tecnologia** (vagas TI, notícias): 20 pts
- **Crescimento de receita** (notícias financeiras): 15 pts
- **Mudança de gestão** (novos executivos): 10 pts

**Fontes:**
- Portais de vagas (LinkedIn, Indeed, Gupy)
- Notícias de expansão/investimento
- Mudanças no quadro societário (Receita Federal)
- Sinais de digitalização

---

#### **B. Sinais de Dor/Pain Points**
```
Score de Dor = Σ (Intensidade da Dor × Relevância para Produto)
```

**Dores identificadas:**
- **Ineficiência operacional** (notícias sobre problemas): 25 pts
- **Necessidade de modernização** (artigos sobre transformação digital): 20 pts
- **Compliance/Regulamentação** (mudanças regulatórias): 15 pts
- **Escalabilidade** (crescimento rápido sem estrutura): 10 pts

**Como detectar:**
- Análise de notícias (palavras-chave: "problema", "desafio", "necessidade")
- Análise de vagas (busca por perfis que resolvem dores específicas)
- Análise de setor (tendências e desafios do setor)

---

#### **C. Sinais de Budget/Recursos**
```
Score de Budget = (
  Receita crescente → 30 pts
  + Investimentos recentes → 25 pts
  + Contratações estratégicas → 20 pts
  + Expansão → 15 pts
)
```

**Indicadores:**
- Receita em crescimento (últimos 2 anos)
- Investimentos em tecnologia/infraestrutura
- Contratações de cargos estratégicos (CIO, CTO, Diretor de TI)
- Expansão de operações

---

### **3. ANÁLISE DE TIMING**

#### **A. Momento Ideal de Abordagem**
```
Score de Timing = (
  Sinal de compra recente (< 90 dias) → 100 pts
  + Sinal de compra médio (90-180 dias) → 50 pts
  + Sinal de compra antigo (> 180 dias) → 20 pts
)
```

**Sinais de timing:**
- Vagas abertas recentes relacionadas ao produto
- Notícias de investimento/expansão recentes
- Mudanças organizacionais recentes
- Eventos do setor próximos

---

### **4. ANÁLISE DE COMPETIÇÃO**

#### **A. Verificação de Concorrentes**
```
Score de Concorrência = (
  Usa concorrente direto → -50 pts (mais difícil de converter)
  + Usa solução legada → +30 pts (oportunidade de migração)
  + Sem solução → +50 pts (greenfield)
)
```

**Lógica:**
- Se empresa usa concorrente direto → Menor prioridade
- Se empresa usa solução legada → Oportunidade de migração
- Se empresa não tem solução → Oportunidade greenfield (mais fácil)

---

## 📊 SISTEMA DE SCORING FINAL

### **Fórmula de Purchase Intention Score**

```
Purchase Intention Score (0-100) = (
  Fit Estrutural        × 30% +
  Intenção de Compra    × 35% +
  Timing                × 20% +
  Competição            × 15%
)
```

**Componentes:**

1. **Fit Estrutural (0-100):**
   - Fit Setor/Nicho: 0-100
   - Fit NCM: 0-100
   - Fit Porte: 0-100
   - **Média ponderada:** Setor (50%) + NCM (30%) + Porte (20%)

2. **Intenção de Compra (0-100):**
   - Sinais de Expansão: 0-30
   - Sinais de Dor: 0-25
   - Sinais de Budget: 0-20
   - Outros sinais: 0-25

3. **Timing (0-100):**
   - Recência dos sinais
   - Momento ideal de abordagem

4. **Competição (0-100):**
   - Uso de concorrente: -50
   - Solução legada: +30
   - Sem solução: +50

---

## 🎯 CLASSIFICAÇÃO FINAL (TRIAGE)

### **TIER 1: HOT LEAD (80-100 pontos)**
**Critérios:**
- ✅ Fit estrutural alto (setor + NCM + porte)
- ✅ Múltiplos sinais de intenção de compra
- ✅ Timing ideal (sinais recentes)
- ✅ Sem concorrente forte OU solução legada

**Ação:** Abordagem imediata, alta prioridade

---

### **TIER 2: WARM LEAD (60-79 pontos)**
**Critérios:**
- ✅ Fit estrutural médio-alto
- ✅ Alguns sinais de intenção
- ✅ Timing moderado
- ✅ Oportunidade identificada

**Ação:** Abordagem estruturada, nurturing

---

### **TIER 3: COLD LEAD (40-59 pontos)**
**Critérios:**
- ⚠️ Fit estrutural médio
- ⚠️ Poucos sinais de intenção
- ⚠️ Timing não ideal
- ⚠️ Concorrência presente

**Ação:** Monitoramento, abordagem futura

---

### **TIER 4: DISQUALIFIED (0-39 pontos)**
**Critérios:**
- ❌ Fit estrutural baixo
- ❌ Sem sinais de intenção
- ❌ Timing inadequado
- ❌ Concorrente forte instalado

**Ação:** Descartar ou arquivar para futuro

---

## 🔍 FONTES DE DADOS PARA TRIAGE

### **1. Dados Estruturais (Fit)**
- **Receita Federal:** Setor, CNAE, Porte, Natureza Jurídica
- **Tenant Config:** Setores-alvo, Nichos-alvo, CNAEs-alvo, NCMs-alvo
- **Empresa Investigada:** Dados cadastrais completos

### **2. Sinais de Intenção**
- **Portais de Vagas:** LinkedIn, Indeed, Gupy (vagas relacionadas)
- **Notícias:** Expansão, investimento, mudanças
- **Receita Federal:** Mudanças societárias, aumento de capital
- **Apollo/LinkedIn:** Contratações estratégicas, mudanças organizacionais

### **3. Análise de Concorrência**
- **Web Search:** Menções de concorrentes
- **Tecnologias:** Stack tecnológico atual
- **Notícias:** Parcerias com concorrentes

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### **1. Nova Edge Function: `triage-analysis`**

```typescript
// supabase/functions/triage-analysis/index.ts

interface TriageAnalysisRequest {
  company_id: string;
  company_name: string;
  cnpj: string;
  tenant_id: string;
}

interface TriageAnalysisResult {
  purchase_intention_score: number; // 0-100
  fit_structural: {
    sector_fit: number;
    niche_fit: number;
    cnae_fit: number;
    ncm_fit: number;
    size_fit: number;
  };
  purchase_intention: {
    expansion_signals: number;
    pain_points: number;
    budget_signals: number;
    total_score: number;
  };
  timing: {
    recency_score: number;
    ideal_moment: boolean;
  };
  competition: {
    uses_competitor: boolean;
    uses_legacy: boolean;
    greenfield: boolean;
    score: number;
  };
  tier: 'hot' | 'warm' | 'cold' | 'disqualified';
  recommendations: string[];
  next_actions: string[];
}
```

---

### **2. Componente de Triage na UI**

```typescript
// src/components/triage/TriageAnalysisCard.tsx

interface TriageAnalysisCardProps {
  companyId: string;
  companyName: string;
  cnpj: string;
}

// Exibe:
// - Purchase Intention Score (0-100)
// - Breakdown por componente (Fit, Intenção, Timing, Competição)
// - Tier (HOT/WARM/COLD/DISQUALIFIED)
// - Recomendações e próximas ações
```

---

### **3. Integração com Quarentena ICP**

```typescript
// Ao adicionar empresa na quarentena:
// 1. Buscar dados estruturais (Receita Federal)
// 2. Executar Triage Analysis
// 3. Classificar automaticamente por Tier
// 4. Exibir Purchase Intention Score
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1: Estrutura Base**
- [ ] Criar tabela `triage_analysis_results`
- [ ] Criar Edge Function `triage-analysis`
- [ ] Criar componente `TriageAnalysisCard`
- [ ] Integrar com Quarentena ICP

### **FASE 2: Análise de Fit**
- [ ] Implementar cálculo de Fit Setorial
- [ ] Implementar cálculo de Fit NCM
- [ ] Implementar cálculo de Fit Porte
- [ ] Buscar dados do tenant (setores, nichos, CNAEs, NCMs)

### **FASE 3: Sinais de Intenção**
- [ ] Buscar vagas relacionadas (portais)
- [ ] Analisar notícias de expansão/investimento
- [ ] Detectar mudanças societárias (Receita Federal)
- [ ] Identificar sinais de dor/pain points

### **FASE 4: Timing e Competição**
- [ ] Calcular recência dos sinais
- [ ] Verificar uso de concorrentes
- [ ] Identificar soluções legadas
- [ ] Classificar timing ideal

### **FASE 5: Scoring e Classificação**
- [ ] Implementar fórmula de Purchase Intention Score
- [ ] Classificar por Tier (HOT/WARM/COLD/DISQUALIFIED)
- [ ] Gerar recomendações automáticas
- [ ] Sugerir próximas ações

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Revisar configuração do Tenant:**
   - Setores-alvo
   - Nichos-alvo
   - CNAEs-alvo
   - NCMs-alvo
   - Portes-alvo

2. **Criar Edge Function `triage-analysis`:**
   - Implementar análise 360°
   - Calcular Purchase Intention Score
   - Classificar por Tier

3. **Atualizar UI:**
   - Substituir "Verificação de Uso" por "Triage - Purchase Intention"
   - Exibir score e breakdown
   - Mostrar recomendações e ações

4. **Integrar com fluxo existente:**
   - Quarentena ICP → Triage → Classificação automática
   - Leads Aprovados → Priorização por Tier

---

## 📊 EXEMPLO DE RESULTADO

```json
{
  "purchase_intention_score": 78,
  "tier": "warm",
  "fit_structural": {
    "sector_fit": 100,
    "niche_fit": 80,
    "cnae_fit": 100,
    "ncm_fit": 60,
    "size_fit": 100,
    "total": 88
  },
  "purchase_intention": {
    "expansion_signals": 25,
    "pain_points": 20,
    "budget_signals": 15,
    "total": 60
  },
  "timing": {
    "recency_score": 70,
    "ideal_moment": true
  },
  "competition": {
    "uses_competitor": false,
    "uses_legacy": true,
    "greenfield": false,
    "score": 30
  },
  "recommendations": [
    "Empresa está em processo de modernização (oportunidade de migração)",
    "Fit alto com setor e CNAE do tenant",
    "Sinais de expansão recentes indicam momento ideal"
  ],
  "next_actions": [
    "Abordar com proposta de migração de solução legada",
    "Enfatizar casos de sucesso no setor",
    "Agendar reunião com Diretor de TI"
  ]
}
```

---

**Última atualização:** 2025-01-19  
**Versão:** 1.0 (Triage - Purchase Intention)

