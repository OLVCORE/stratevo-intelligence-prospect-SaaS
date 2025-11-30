# 📊 CRITÉRIOS E MÉTRICAS DA ABA DE VERIFICAÇÃO

## 🎯 VISÃO GERAL

A aba de **Verificação de Uso** agora funciona de forma **genérica e multi-tenant**, detectando uso de **produtos configurados pelo tenant** em vez de produtos específicos da TOTVS.

---

## 🔍 SISTEMA DE MATCHING (GENÉRICO)

### **Triple Match** (Evidência Máxima)
**Critério:** Empresa + Produto do Tenant + Contexto de Uso (tudo na mesma matéria)

**Exemplo:**
- ✅ "Klabin busca desenvolvedor com experiência em Protheus"
- ✅ "Empresa X implementa sistema RM da TOTVS"
- ✅ "Vaga: Analista de sistemas com conhecimento em Winthor"

**Peso:** 100 pontos (NO-GO automático se encontrado)

---

### **Double Match** (Evidência Forte)
**Critério:** Empresa + Produto do Tenant OU Empresa + Menção Genérica (na mesma matéria)

**Variação 1:** Empresa + Produto específico
- ✅ "Klabin utiliza RM para gestão financeira"
- ✅ "Vaga na Empresa X: Conhecimento em Protheus"

**Variação 2:** Empresa + Menção genérica em contexto válido
- ✅ "Klabin busca sistema ERP"
- ✅ "Empresa X contrata consultoria para implementação de sistema"

**Peso:** 50-84 pontos (NO-GO se score total >= 50%)

---

### **Single Match** (Evidência Fraca)
**Critério:** Menção isolada sem contexto claro

**Exemplo:**
- ⚠️ "Lista de empresas: Vale, Suzano, Klabin, TOTVS..." (lista genérica)
- ⚠️ "Cotações de ações" (sem contexto de uso)

**Peso:** 1-49 pontos (GO - pode prosseguir)

---

## 📈 SISTEMA DE SCORING

### **Fórmula de Cálculo**

```
Score Total = Σ (Peso da Evidência × Boost de Segmento) + Bônus de Intenção
```

**Componentes:**

1. **Peso Base da Evidência:**
   - Triple Match: 100 pontos
   - Double Match: 50 pontos
   - Single Match: 10 pontos

2. **Boost de Segmento:**
   - Produto **Primário** para o setor: +20 pontos
   - Produto **Relevante** para o setor: +10 pontos
   - Produto não relacionado: 0 pontos

3. **Bônus de Intenção:**
   - Evidência com sinais de compra: +20 pontos
   - Palavras-chave: "contratação", "implementação", "migração", "vaga"

4. **Fonte Oficial (Auto NO-GO):**
   - CVM, B3, TJSP: Peso 100 (NO-GO automático)

---

## 🎯 CLASSIFICAÇÃO FINAL

### **NO-GO (85-100%)**
**Critérios:**
- ✅ Triple Match encontrado
- ✅ Fonte oficial (CVM, B3, TJSP) com menção
- ✅ Score total >= 85 pontos

**Ação:** Empresa é **cliente** ou está em processo de implementação

---

### **NO-GO (50-84%)**
**Critérios:**
- ✅ Double Match encontrado
- ✅ Score total entre 50-84 pontos
- ✅ Múltiplas evidências de uso

**Ação:** Empresa provavelmente **usa** produtos do tenant

---

### **GO (0-49%)**
**Critérios:**
- ✅ Apenas Single Matches
- ✅ Score total < 50 pontos
- ✅ Sem evidências fortes

**Ação:** Empresa **não é cliente** - pode prosseguir com prospecção

---

## 📊 MÉTRICAS EXIBIDAS

### **1. Contadores de Evidências**
- **Triple Matches:** Número de evidências máximas
- **Double Matches:** Número de evidências fortes
- **Single Matches:** Número de evidências fracas
- **Total:** Soma de todas as evidências

### **2. Score de Confiança**
- **Alta (High):** 85-100% - Evidências muito fortes
- **Média (Medium):** 50-84% - Evidências moderadas
- **Baixa (Low):** 0-49% - Poucas ou fracas evidências

### **3. Produtos Detectados**
- Lista de produtos do tenant mencionados nas evidências
- Agrupados por frequência de menção

### **4. Fontes Consultadas**
- **9 Fases de Busca:**
  1. Portais de Vagas (4 fontes) - 15s
  2. Cases Oficiais (3 fontes) - 8s
  3. Fontes Oficiais (10 fontes) - 10s
  4. Notícias Premium (29 fontes) - 12s
  5. Portais Tech (7 fontes) - 8s
  6. Vídeos (2 fontes) - 5s
  7. Redes Sociais (3 fontes) - 5s
  8. Parceiros (1 fonte) - 3s
  9. Google News (1 fonte) - 5s

**Total:** ~71 segundos | 60+ fontes consultadas

---

## 🔄 VALIDAÇÃO DE EVIDÊNCIAS

### **Validação Básica**
- Verifica menção da empresa + produto na mesma matéria
- Rejeita falsos positivos (listas genéricas, cotações, etc.)

### **Validação por IA** (Opcional)
- Análise de contexto completo da URL
- Leitura de conteúdo completo da página
- Classificação de relevância mais precisa

---

## 🎯 FILTROS DISPONÍVEIS

### **Por Tipo de Match**
- **Todos:** Mostra todas as evidências
- **Apenas Triple:** Mostra apenas evidências máximas

### **Por Fonte**
- Filtra por tipo de fonte (Portais de Vagas, Notícias, etc.)

### **Por Produto**
- Filtra por produto específico detectado

### **Por Data**
- Filtra evidências por período

### **Por Relevância**
- Ordena por score, data, ou fonte

---

## 📋 STATUS FINAL

### **GO - Não é Cliente**
- Score < 50%
- Apenas Single Matches
- Pode prosseguir com prospecção

### **NO-GO - É Cliente**
- Score >= 50%
- Triple ou Double Matches encontrados
- Evidências de uso confirmadas

### **REVISAR - Necessita Análise Manual**
- Score entre 40-60%
- Evidências conflitantes
- Requer decisão humana

---

## 🔧 CONFIGURAÇÃO DO TENANT

A verificação usa os **produtos configurados pelo tenant** em:
- `tenant_products` (tabela de produtos do tenant)
- `tenant_search_configs` (termos de busca configurados)

**Produtos são detectados dinamicamente** baseado na configuração do tenant, não mais hardcoded para TOTVS.

---

## 📊 DASHBOARD DE MÉTRICAS

### **Hero Status Card**
- Status final (GO/NO-GO/REVISAR)
- Score de confiança
- Contadores de matches

### **Intent Dashboard**
- Sinais de intenção de compra
- Palavras-chave de intenção detectadas
- Score de intenção (0-100)

### **Metrics Dashboard**
- Comparação com análises anteriores
- Tendência de evidências ao longo do tempo
- Distribuição por fonte

---

## ✅ RESUMO DAS MUDANÇAS

### **ANTES (TOTVS-específico):**
- ❌ Double/Triple matching apenas para produtos TOTVS
- ❌ Produtos hardcoded (Protheus, RM, Winthor, etc.)
- ❌ Validação específica para TOTVS

### **AGORA (Genérico Multi-tenant):**
- ✅ Double/Triple matching para **qualquer produto do tenant**
- ✅ Produtos configuráveis por tenant
- ✅ Validação genérica baseada em contexto
- ✅ Sistema adaptável a qualquer setor/niche

---

## 🎯 PRÓXIMOS PASSOS

1. **Configurar produtos do tenant** na aba de configuração
2. **Definir termos de busca** específicos do setor
3. **Ajustar boost de segmento** para produtos primários/relevantes
4. **Revisar evidências** manualmente quando necessário

---

**Última atualização:** 2025-01-19  
**Versão:** 2.0 (Multi-tenant Genérico)

