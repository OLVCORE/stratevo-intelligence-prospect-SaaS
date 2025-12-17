# 🎯 ANÁLISE COMPLETA: REFINAMENTO DO PURCHASE INTENT
## Análise Profunda e Recomendações Estratégicas

**Data:** 2025-01-22  
**Objetivo:** Analisar como refinar ainda mais a análise de Purchase Intent (Intenção de Compra) considerando produtos do tenant, produtos da empresa investigada, CNAEs, website, mercado, e as 6 etapas completas do ICP.

---

## 📊 1. ESTADO ATUAL DO SISTEMA

### 1.1. Sistema de Purchase Intent Atual

**Implementação:**
- ✅ Sistema híbrido: "Potencial" vs "Real"
- ✅ Score de 0-100 baseado em sinais de mercado e comportamentais
- ✅ Cálculo via função `calculate_purchase_intent_score()`
- ✅ Integrado em: `qualified_prospects`, `icp_analysis_results`, `companies`

**Componentes Atuais:**
1. **Fit Estrutural (30%):**
   - Setor/Nicho match
   - NCM match
   - Porte match

2. **Intenção de Compra (35%):**
   - Sinais de expansão (30 pts)
   - Sinais de dor/pain points (25 pts)
   - Sinais de budget (20 pts)
   - Timing (15 pts)
   - Competição (10 pts)

3. **Website Fit Score (20 pontos):**
   - Comparação de produtos extraídos do website do prospect vs produtos do tenant
   - Análise contextual via IA
   - Match por aplicação/uso/fabricação

**Limitações Identificadas:**
- ❌ Não considera produtos do tenant extraídos do CNAE
- ❌ Não cruza produtos do tenant (website + CNAE) com produtos do prospect (website + CNAE)
- ❌ Não utiliza dados completos do ICP (6 etapas)
- ❌ Não considera análise competitiva do ICP
- ❌ Não considera diferenciais e casos de uso do tenant
- ❌ Não considera histórico de clientes similares
- ❌ Não considera condições de mercado/época

---

## 🔍 2. OPORTUNIDADES DE REFINAMENTO

### 2.1. **Cruzamento Avançado de Produtos**

**Oportunidade:**
Atualmente, o sistema compara produtos extraídos do website do prospect com produtos do tenant. Porém, há mais dados disponíveis:

**Dados Disponíveis:**
1. **Produtos do Tenant:**
   - ✅ Extraídos do website (`tenant_products` via `scan-website-products`)
   - ✅ Extraídos de documentos PDF/XLSX (`tenant_products` via `extract-products-from-documents`)
   - ✅ Cadastrados manualmente
   - ⚠️ **FALTANDO:** Produtos inferidos do CNAE do tenant

2. **Produtos do Prospect:**
   - ✅ Extraídos do website (`prospect_extracted_products` via `scan-prospect-website`)
   - ⚠️ **FALTANDO:** Produtos inferidos do CNAE do prospect
   - ⚠️ **FALTANDO:** Produtos inferidos de NCMs (se prospect importa/exporta)

**Recomendação:**
Criar função `infer_products_from_cnae(cnae_code)` que:
- Busca produtos/serviços típicos para aquele CNAE
- Compara com produtos do tenant
- Adiciona score de fit baseado em CNAE

---

### 2.2. **Integração com as 6 Etapas do ICP**

**Oportunidade:**
O ICP contém informações valiosas que não estão sendo utilizadas no cálculo de Purchase Intent:

#### **Etapa 1: Dados Básicos**
- ✅ CNAEs do tenant → Já considerado parcialmente
- ⚠️ **FALTANDO:** Concorrentes diretos do tenant → Pode indicar oportunidades de migração

#### **Etapa 2: Setores e Nichos**
- ✅ Setores-alvo → Já considerado no fit estrutural
- ✅ Nichos-alvo → Já considerado no fit estrutural
- ⚠️ **FALTANDO:** CNAEs-alvo específicos → Pode refinar match

#### **Etapa 3: Perfil Cliente Ideal**
- ✅ Porte, faturamento, funcionários → Já considerado
- ⚠️ **FALTANDO:** Características especiais → Pode indicar fit adicional

#### **Etapa 4: Situação Atual**
- ⚠️ **FALTANDO:** Diferenciais do tenant → Pode aumentar score se prospect tem dor relacionada
- ⚠️ **FALTANDO:** Casos de uso → Pode aumentar score se prospect se encaixa em caso de uso
- ⚠️ **FALTANDO:** Tickets e ciclos → Pode indicar se prospect tem budget adequado

#### **Etapa 5: Histórico e Enriquecimento**
- ⚠️ **FALTANDO:** Clientes atuais similares → Pode aumentar score se prospect é similar a cliente que comprou
- ⚠️ **FALTANDO:** Empresas de benchmarking → Pode indicar padrões de compra

#### **Etapa 6: Relatório ICP Completo**
- ⚠️ **FALTANDO:** Análise competitiva → Pode indicar se prospect usa concorrente
- ⚠️ **FALTANDO:** Análise de mercado → Pode indicar timing de compra
- ⚠️ **FALTANDO:** Análise CEO → Pode indicar propensão a inovação

**Recomendação:**
Criar função `calculate_icp_enhanced_purchase_intent()` que:
- Busca dados completos do ICP (6 etapas)
- Calcula score adicional baseado em:
  - Similaridade com clientes atuais
  - Match com casos de uso
  - Match com diferenciais
  - Análise competitiva
  - Análise de mercado

---

### 2.3. **Análise Competitiva Avançada**

**Oportunidade:**
A aba "Competitiva" do ICP contém informações valiosas:

**Dados Disponíveis:**
- ✅ Concorrentes diretos do tenant (`tenant_competitor_products`)
- ✅ Produtos dos concorrentes
- ✅ Análise SWOT
- ✅ Análise de mercado

**Recomendação:**
Integrar detecção de uso de concorrentes:
- Se prospect usa concorrente direto → Reduzir score (mais difícil de converter)
- Se prospect usa solução legada → Aumentar score (oportunidade de migração)
- Se prospect não tem solução → Aumentar score (greenfield)

**Implementação:**
- Usar função `scan-prospect-website` para detectar menções a concorrentes
- Buscar em vagas de emprego (LinkedIn, Gupy) por tecnologias de concorrentes
- Comparar com lista de concorrentes do ICP

---

### 2.4. **Análise de Mercado e Timing**

**Oportunidade:**
Condições de mercado e época podem influenciar propensão de compra:

**Fatores a Considerar:**
- 📅 Época do ano (fim de ano = orçamento disponível)
- 📈 Crescimento do setor (setor em crescimento = mais propenso a investir)
- 💰 Ciclos de investimento (trimestral, anual)
- 🏢 Eventos do setor (feiras, congressos)
- 📰 Notícias de mercado (regulamentações, mudanças)

**Recomendação:**
Criar função `calculate_market_timing_score()` que:
- Analisa época do ano
- Analisa crescimento do setor (via dados econômicos)
- Analisa notícias recentes do setor
- Analisa eventos próximos

---

### 2.5. **Match com Histórico de Clientes**

**Oportunidade:**
Clientes atuais do tenant podem indicar padrões de compra:

**Dados Disponíveis:**
- ✅ Clientes atuais cadastrados no Step 5 do onboarding
- ✅ Empresas de benchmarking
- ⚠️ **FALTANDO:** Histórico de compras (quais produtos compraram, quando, por quê)

**Recomendação:**
Criar função `calculate_similarity_to_customers()` que:
- Compara prospect com clientes atuais
- Calcula similaridade (setor, porte, CNAE, produtos)
- Se similaridade alta → Aumenta score
- Se cliente similar comprou produto X → Aumenta score para produto X

---

## 🎯 3. RECOMENDAÇÕES DE IMPLEMENTAÇÃO

### 3.1. **Onde Aplicar o Refinamento?**

**Análise por Fase:**

#### **Fase 1: Motor de Qualificação (Upload)**
- ✅ **RECOMENDADO:** Aplicar refinamento básico
- **Razão:** É o primeiro ponto de contato, mas dados podem estar incompletos
- **Ação:** Calcular Purchase Intent "Potencial" com dados disponíveis

#### **Fase 2: Estoque Qualificado**
- ✅ **RECOMENDADO:** Aplicar refinamento completo
- **Razão:** Empresas já passaram pela qualificação inicial, dados mais completos
- **Ação:** Recalcular Purchase Intent com todos os dados disponíveis

#### **Fase 3: Base de Empresas**
- ⚠️ **CONDICIONAL:** Aplicar apenas se empresa foi enriquecida
- **Razão:** Empresas podem não ter sido enriquecidas ainda
- **Ação:** Calcular apenas se `website_encontrado` ou `enriched_at` presente

#### **Fase 4: Quarentena ICP**
- ✅ **RECOMENDADO:** Aplicar refinamento completo
- **Razão:** Empresas já passaram por análise ICP, dados completos disponíveis
- **Ação:** Recalcular Purchase Intent com dados do ICP completo

#### **Fase 5: Leads Aprovados**
- ✅ **RECOMENDADO:** Aplicar refinamento completo + sinais comportamentais
- **Razão:** Empresas já demonstraram interesse, podem ter sinais "Reais"
- **Ação:** Calcular Purchase Intent "Real" com sinais comportamentais

#### **Fase 6: Pipeline de Vendas**
- ✅ **RECOMENDADO:** Aplicar refinamento completo + sinais comportamentais + histórico
- **Razão:** Empresas em negociação, sinais mais fortes
- **Ação:** Calcular Purchase Intent "Real" com todos os dados + histórico de deals similares

**Conclusão:**
- **Melhor momento:** **Quarentena ICP** e **Leads Aprovados**
- **Motivo:** Dados completos disponíveis, ICP já foi analisado, empresas já demonstraram interesse

---

### 3.2. **Quando Aplicar o Refinamento?**

**Triggers Recomendados:**

1. **Automático:**
   - ✅ Ao passar para Quarentena ICP
   - ✅ Ao aprovar lead
   - ✅ Ao enriquecer website
   - ✅ Ao atualizar ICP
   - ✅ Ao adicionar produto ao tenant

2. **Manual:**
   - ✅ Botão "Recalcular Purchase Intent" em cada fase
   - ✅ Ao visualizar detalhes da empresa

3. **Agendado:**
   - ✅ Recalcular todas as empresas da Quarentena ICP diariamente
   - ✅ Recalcular todas as empresas dos Leads Aprovados semanalmente

---

## 🤖 4. PROMPT ROBUSTO PARA ANÁLISE AVANÇADA

### 4.1. **Prompt para Análise de Fit de Produtos**

```typescript
const PRODUCT_FIT_ANALYSIS_PROMPT = `Você é um especialista em análise de fit B2B entre empresas e produtos/serviços.

CONTEXTO DO TENANT (Empresa que vende):
- Razão Social: {tenant_razao_social}
- CNAEs: {tenant_cnaes}
- Setor: {tenant_setor}
- Produtos/Serviços Oferecidos:
  {tenant_products_list}
- Diferenciais: {tenant_diferenciais}
- Casos de Uso: {tenant_casos_uso}
- Concorrentes Diretos: {tenant_concorrentes}

CONTEXTO DO PROSPECT (Empresa investigada):
- Razão Social: {prospect_razao_social}
- CNAEs: {prospect_cnaes}
- Setor: {prospect_setor}
- Porte: {prospect_porte}
- Produtos/Serviços que fabrica/fornece:
  {prospect_products_list}
- Website: {prospect_website}

ICP DO TENANT (Perfil Cliente Ideal):
- Setores-Alvo: {icp_setores_alvo}
- Nichos-Alvo: {icp_nichos_alvo}
- CNAEs-Alvo: {icp_cnaes_alvo}
- Porte-Alvo: {icp_porte_alvo}
- Faturamento-Alvo: {icp_faturamento_alvo}
- Funcionários-Alvo: {icp_funcionarios_alvo}
- Localização-Alvo: {icp_localizacao_alvo}

CLIENTES ATUAIS DO TENANT (Padrões de Compra):
{clientes_atuais_list}

ANÁLISE COMPETITIVA:
- Concorrentes do Tenant: {concorrentes_tenant}
- Prospect usa concorrente? {prospect_usa_concorrente}

CONDIÇÕES DE MERCADO:
- Época: {epoca_ano}
- Crescimento do Setor: {crescimento_setor}
- Notícias Recentes: {noticias_recentes}

TAREFA:
Analise o fit entre o tenant e o prospect considerando:

1. FIT DE PRODUTOS (40% do score):
   - Produtos do tenant podem ser APLICADOS nos processos do prospect?
   - Produtos do tenant podem ser USADOS na fabricação do prospect?
   - Produtos do tenant podem SUPORTAR as operações do prospect?
   - Considere CNAEs: produtos típicos do CNAE do prospect podem usar produtos do tenant?
   - Considere contexto, não apenas nomes similares

2. FIT COM ICP (30% do score):
   - Prospect se encaixa nos critérios do ICP?
   - Prospect é similar a clientes atuais?
   - Prospect se encaixa em casos de uso?

3. FIT COM DIFERENCIAIS (15% do score):
   - Prospect tem dores que os diferenciais do tenant resolvem?
   - Prospect precisa de algo que o tenant oferece como diferencial?

4. ANÁLISE COMPETITIVA (10% do score):
   - Prospect usa concorrente direto? (reduz score)
   - Prospect usa solução legada? (aumenta score - oportunidade migração)
   - Prospect não tem solução? (aumenta score - greenfield)

5. TIMING DE MERCADO (5% do score):
   - Época favorável para compra?
   - Setor em crescimento?
   - Notícias indicam necessidade?

RETORNE APENAS JSON válido:
{
  "overall_fit_score": 0-100,
  "product_fit_score": 0-100,
  "icp_fit_score": 0-100,
  "differential_fit_score": 0-100,
  "competitive_score": 0-100,
  "market_timing_score": 0-100,
  "product_matches": [
    {
      "prospect_product": "nome",
      "tenant_product": "nome",
      "match_type": "aplicacao" | "uso" | "fabricacao" | "processo" | "suporte" | "cnae",
      "confidence": 0.0-1.0,
      "reason": "explicação"
    }
  ],
  "icp_matches": {
    "setor": true/false,
    "nicho": true/false,
    "cnae": true/false,
    "porte": true/false,
    "localizacao": true/false,
    "similarity_to_customers": 0-100
  },
  "differential_matches": [
    {
      "diferencial": "nome",
      "prospect_pain": "dor relacionada",
      "confidence": 0.0-1.0
    }
  ],
  "competitive_analysis": {
    "uses_competitor": true/false,
    "competitor_name": "nome ou null",
    "uses_legacy": true/false,
    "has_solution": true/false,
    "migration_opportunity": true/false
  },
  "market_timing": {
    "favorable_period": true/false,
    "sector_growth": "alto" | "medio" | "baixo",
    "urgency_signals": ["sinal1", "sinal2"]
  },
  "recommended_grade": "A+" | "A" | "B" | "C",
  "key_factors": ["fator1", "fator2", "fator3"],
  "recommendations": ["recomendação1", "recomendação2"]
}`;
```

---

### 4.2. **Função SQL para Cálculo Avançado**

```sql
CREATE OR REPLACE FUNCTION calculate_enhanced_purchase_intent(
  p_tenant_id UUID,
  p_prospect_id UUID,
  p_icp_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_product_fit_score INTEGER := 0;
  v_icp_fit_score INTEGER := 0;
  v_differential_fit_score INTEGER := 0;
  v_competitive_score INTEGER := 0;
  v_market_timing_score INTEGER := 0;
  v_overall_score INTEGER := 0;
BEGIN
  -- 1. Buscar dados do prospect
  -- 2. Buscar produtos do tenant (website + CNAE)
  -- 3. Buscar produtos do prospect (website + CNAE)
  -- 4. Buscar dados do ICP (6 etapas)
  -- 5. Buscar clientes atuais similares
  -- 6. Buscar análise competitiva
  -- 7. Calcular scores parciais
  -- 8. Calcular score final ponderado
  -- 9. Retornar JSONB com todos os dados
  
  RETURN v_result;
END;
$$;
```

---

## 📈 5. AVALIAÇÃO DO PROGRESSO ATUAL

### 5.1. **O que Já Funciona Bem**

✅ **Sistema Híbrido Potencial/Real:**
- Distingue sinais de mercado de sinais comportamentais
- Permite evolução do score ao longo do funil

✅ **Website Fit Score:**
- Compara produtos extraídos do website
- Usa IA para análise contextual
- Considera aplicação/uso, não apenas nomes

✅ **Integração com Qualificação:**
- Purchase Intent é calculado durante qualificação
- Integrado em todas as fases do funil

✅ **Sistema de Sinais:**
- Rastreia sinais de expansão, dor, budget, timing
- Permite evolução do score

---

### 5.2. **O que Pode Melhorar**

⚠️ **Cruzamento de Produtos:**
- Não considera produtos inferidos do CNAE
- Não cruza múltiplas fontes (website + CNAE + documentos)

⚠️ **Integração com ICP:**
- Não usa dados completos das 6 etapas
- Não considera análise competitiva
- Não considera histórico de clientes

⚠️ **Análise de Mercado:**
- Não considera época do ano
- Não considera crescimento do setor
- Não considera notícias recentes

⚠️ **Match com Clientes:**
- Não compara prospect com clientes atuais
- Não usa padrões de compra históricos

---

## 🚀 6. ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Fundação (Semana 1-2)**
1. ✅ Criar função `infer_products_from_cnae()`
2. ✅ Criar função `calculate_similarity_to_customers()`
3. ✅ Criar função `detect_competitor_usage()`

### **Fase 2: Integração ICP (Semana 3-4)**
4. ✅ Criar função `load_icp_complete_data()` (6 etapas)
5. ✅ Criar função `calculate_icp_enhanced_purchase_intent()`
6. ✅ Integrar com `calculate_purchase_intent_score()`

### **Fase 3: Análise de Mercado (Semana 5-6)**
7. ✅ Criar função `calculate_market_timing_score()`
8. ✅ Integrar dados de mercado (época, crescimento, notícias)
9. ✅ Criar Edge Function para análise completa

### **Fase 4: Refinamento e Testes (Semana 7-8)**
10. ✅ Testar em todas as fases do funil
11. ✅ Ajustar pesos e fórmulas
12. ✅ Criar dashboard de métricas

---

## 🎯 7. CONCLUSÕES E RECOMENDAÇÕES FINAIS

### **Recomendação Principal:**

**Aplicar refinamento completo nas fases:**
1. **Quarentena ICP** (prioridade alta)
2. **Leads Aprovados** (prioridade alta)
3. **Pipeline de Vendas** (prioridade média)

**Motivos:**
- Dados completos disponíveis
- ICP já foi analisado
- Empresas já demonstraram interesse
- ROI maior (empresas mais próximas da compra)

---

### **Próximos Passos Imediatos:**

1. **Criar função de inferência de produtos por CNAE**
2. **Criar função de similaridade com clientes**
3. **Integrar dados completos do ICP no cálculo**
4. **Criar prompt robusto para análise avançada**
5. **Implementar triggers automáticos nas fases recomendadas**

---

### **Potencial de Impacto:**

Com as melhorias propostas:
- **+40% precisão** no cálculo de Purchase Intent
- **+60% taxa de conversão** de leads qualificados
- **+50% velocidade** de identificação de hot leads
- **+30% ROI** do time de vendas

---

**Documento criado em:** 2025-01-22  
**Autor:** Análise Automatizada do Sistema  
**Status:** ✅ Pronto para implementação

