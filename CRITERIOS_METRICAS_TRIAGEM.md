# 📊 CRITÉRIOS E MÉTRICAS DA TRIAGEM - INTENÇÃO DE COMPRA

## 🎯 VISÃO GERAL

A aba de **Triagem** (anteriormente "Verificação de Uso") agora funciona de forma **genérica e multi-tenant**, avaliando **Intenção de Compra** através de análise 360° focada em **FIT** e **OPORTUNIDADE**.

---

## 🔍 SISTEMA DE ANÁLISE 360°

### **1. FIT ESTRUTURAL (30% do Score)**

#### **A. Fit por Setor/Nicho**
- **Setor:** Empresa pertence aos setores-alvo do tenant?
- **Nicho:** Empresa pertence aos nichos-alvo do tenant?
- **CNAE:** CNAE principal está nos CNAEs-alvo do tenant?

**Score:** Match exato = 100%, Similar = 50%, Diferente = 0%

---

#### **B. Fit por NCM**
- **NCMs da Empresa:** Empresa trabalha com NCMs relacionados aos produtos do tenant?
- **Lógica:** Se tenant vende produtos com NCM específico e empresa trabalha com esses NCMs → FIT ALTO

**Score:** Match exato = 100%, Relacionado = 50%, Não relacionado = 0%

---

#### **C. Fit por Porte**
- **Porte:** Micro/Pequena/Média/Grande → Match com ICP do tenant?
- **Receita:** Faixa de receita-alvo do tenant?
- **Funcionários:** Número de funcionários-alvo?

**Score:** Dentro da faixa = 100%, Fora da faixa = 0%

---

### **2. INTENÇÃO DE COMPRA (35% do Score)**

#### **A. Sinais de Expansão/Crescimento**
- **Contratações recentes** (vagas abertas): 30 pts
- **Expansão geográfica** (novas filiais): 25 pts
- **Investimento em tecnologia** (vagas TI, notícias): 20 pts
- **Crescimento de receita** (notícias financeiras): 15 pts
- **Mudança de gestão** (novos executivos): 10 pts

**Fontes:**
- Portais de vagas (LinkedIn, Indeed, Gupy)
- Notícias de expansão/investimento
- Mudanças no quadro societário (Receita Federal)

---

#### **B. Sinais de Dor/Pain Points**
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
- **Receita crescente** (últimos 2 anos): 30 pts
- **Investimentos recentes** (tecnologia/infraestrutura): 25 pts
- **Contratações estratégicas** (CIO, CTO, Diretor de TI): 20 pts
- **Expansão de operações**: 15 pts

---

### **3. TIMING (20% do Score)**

#### **A. Momento Ideal de Abordagem**
- **Sinal recente** (< 90 dias): 100 pts
- **Sinal médio** (90-180 dias): 50 pts
- **Sinal antigo** (> 180 dias): 20 pts

**Sinais de timing:**
- Vagas abertas recentes relacionadas ao produto
- Notícias de investimento/expansão recentes
- Mudanças organizacionais recentes
- Eventos do setor próximos

---

### **4. COMPETIÇÃO (15% do Score)**

#### **A. Verificação de Concorrentes**
- **Usa concorrente direto:** -50 pts (mais difícil de converter)
- **Usa solução legada:** +30 pts (oportunidade de migração)
- **Sem solução:** +50 pts (greenfield - maior oportunidade)

**Lógica:**
- Se empresa usa concorrente direto → Menor prioridade
- Se empresa usa solução legada → Oportunidade de migração
- Se empresa não tem solução → Oportunidade greenfield (mais fácil)

---

## 📊 SISTEMA DE SCORING FINAL

### **Fórmula de Score de Intenção de Compra**

```
Score de Intenção de Compra (0-100) = (
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

## 🎯 CLASSIFICAÇÃO FINAL (TIER)

### **TIER 1: LEAD QUENTE (80-100 pontos)**
**Critérios:**
- ✅ Fit estrutural alto (setor + NCM + porte)
- ✅ Múltiplos sinais de intenção de compra
- ✅ Timing ideal (sinais recentes)
- ✅ Sem concorrente forte OU solução legada

**Ação:** Abordagem imediata, alta prioridade

---

### **TIER 2: LEAD MORNO (60-79 pontos)**
**Critérios:**
- ✅ Fit estrutural médio-alto
- ✅ Alguns sinais de intenção
- ✅ Timing moderado
- ✅ Oportunidade identificada

**Ação:** Abordagem estruturada, nurturing

---

### **TIER 3: LEAD FRIO (40-59 pontos)**
**Critérios:**
- ⚠️ Fit estrutural médio
- ⚠️ Poucos sinais de intenção
- ⚠️ Timing não ideal
- ⚠️ Concorrência presente

**Ação:** Monitoramento, abordagem futura

---

### **TIER 4: DESQUALIFICADO (0-39 pontos)**
**Critérios:**
- ❌ Fit estrutural baixo
- ❌ Sem sinais de intenção
- ❌ Timing inadequado
- ❌ Concorrente forte instalado

**Ação:** Descartar ou arquivar para futuro

---

## 📊 MÉTRICAS EXIBIDAS

### **1. Score de Intenção de Compra**
- **0-100 pontos:** Score geral de potencial de compra
- **Breakdown:** Fit Estrutural, Intenção, Timing, Competição

### **2. Classificação por Tier**
- **QUENTE:** 80-100 pontos
- **MORNO:** 60-79 pontos
- **FRIO:** 40-59 pontos
- **DESQUALIFICADO:** 0-39 pontos

### **3. Fit Estrutural Detalhado**
- Fit Setor: 0-100%
- Fit Nicho: 0-100%
- Fit CNAE: 0-100%
- Fit NCM: 0-100%
- Fit Porte: 0-100%

### **4. Sinais de Intenção**
- Contagem de sinais de expansão
- Contagem de pontos de dor identificados
- Contagem de sinais de budget
- Total de sinais encontrados

### **5. Análise de Timing**
- Score de recência (0-100)
- Momento ideal (sim/não)
- Data do sinal mais recente

### **6. Análise de Competição**
- Usa concorrente (sim/não)
- Usa solução legada (sim/não)
- Greenfield (sim/não)
- Score de competição (0-100)

---

## 🔍 FONTES DE DADOS

### **1. Dados Estruturais (Fit)**
- **Receita Federal:** Setor, CNAE, Porte, Natureza Jurídica
- **Configuração do Tenant:** Setores-alvo, Nichos-alvo, CNAEs-alvo, NCMs-alvo
- **Empresa Investigada:** Dados cadastrais completos

### **2. Sinais de Intenção**
- **Portais de Vagas:** LinkedIn, Indeed, Gupy
- **Notícias:** Expansão, investimento, mudanças
- **Receita Federal:** Mudanças societárias, aumento de capital
- **Apollo/LinkedIn:** Contratações estratégicas

### **3. Análise de Concorrência**
- **Web Search:** Menções de concorrentes
- **Tecnologias:** Stack tecnológico atual
- **Notícias:** Parcerias com concorrentes

---

## 🎯 FILTROS DISPONÍVEIS

### **Por Tier**
- **QUENTE:** Leads de alta prioridade
- **MORNO:** Leads de prioridade média
- **FRIO:** Leads para monitoramento
- **DESQUALIFICADO:** Leads descartados

### **Por Score**
- Filtrar por faixa de score (ex: 80-100, 60-79, etc.)

### **Por Fit Estrutural**
- Filtrar por fit setorial, CNAE, NCM, etc.

### **Por Sinais**
- Filtrar por tipo de sinal (expansão, dor, budget)

---

## 📋 STATUS FINAL

### **QUENTE - Alta Prioridade**
- Score 80-100
- Fit alto + Sinais fortes + Timing ideal
- Abordagem imediata

### **MORNO - Prioridade Média**
- Score 60-79
- Fit médio-alto + Alguns sinais
- Abordagem estruturada

### **FRIO - Monitoramento**
- Score 40-59
- Fit médio + Poucos sinais
- Monitoramento futuro

### **DESQUALIFICADO - Descartar**
- Score 0-39
- Fit baixo + Sem sinais
- Descartar ou arquivar

---

## 🔧 CONFIGURAÇÃO DO TENANT

A triagem usa os **dados configurados pelo tenant** em:
- `tenants.icp_sectors` (Setores-alvo)
- `tenants.icp_niches` (Nichos-alvo)
- `tenants.icp_cnaes` (CNAEs-alvo)
- `tenants.icp_ncms` (NCMs-alvo)
- `tenants.icp_faixa_porte` (Faixa de porte-alvo)
- `tenant_products` (Produtos do tenant)

**Tudo é configurável** baseado no perfil do tenant, não mais hardcoded.

---

## 📊 DASHBOARD DE MÉTRICAS

### **Card Principal**
- Score de Intenção de Compra (0-100)
- Tier (QUENTE/MORNO/FRIO/DESQUALIFICADO)
- Breakdown por componente

### **Breakdown Detalhado**
- Fit Estrutural: 0-100%
- Intenção de Compra: 0-100%
- Timing: 0-100%
- Competição: 0-100%

### **Recomendações**
- Lista de recomendações baseadas na análise
- Próximas ações sugeridas

---

## ✅ RESUMO DAS MUDANÇAS

### **ANTES (Verificação de Uso - TOTVS-específico):**
- ❌ Buscar evidências de uso de produtos TOTVS
- ❌ Double/Triple matching específico para TOTVS
- ❌ Produtos hardcoded
- ❌ Objetivo: Evitar prospectar clientes existentes

### **AGORA (Triagem - Intenção de Compra - Genérico):**
- ✅ Análise de Fit Estrutural (Setor/Nicho/CNAE/NCM/Porte)
- ✅ Análise de Intenção de Compra (sinais de expansão, dor, budget)
- ✅ Análise de Timing (momento ideal de abordagem)
- ✅ Análise de Competição (oportunidades de migração/greenfield)
- ✅ Sistema adaptável a qualquer setor/niche
- ✅ Objetivo: Qualificar leads por potencial de compra

---

## 🎯 GLOSSÁRIO

- **TRIAGEM:** Processo de classificação e priorização de leads baseado em análise 360°
- **INTENÇÃO DE COMPRA:** Probabilidade de uma empresa comprar os produtos/serviços do tenant
- **FIT ESTRUTURAL:** Alinhamento entre características da empresa e ICP do tenant
- **TIER:** Nível de prioridade (Quente/Morno/Frio/Desqualificado)
- **GREENFIELD:** Oportunidade de primeira implementação (empresa sem solução similar)
- **LEGADO:** Solução antiga que pode ser substituída
- **NCM:** Nomenclatura Comum do Mercosul (classificação de produtos)
- **CNAE:** Classificação Nacional de Atividades Econômicas

---

**Última atualização:** 2025-01-19  
**Versão:** 2.0 (Triagem - Intenção de Compra)

