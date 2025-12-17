# 📊 Website Fit Score e Preservação de Dados na Migração

## 🔍 O QUE É O WEBSITE FIT SCORE?

O **Website Fit Score** é um score de 0 a 20 pontos que indica o quão compatível os produtos/serviços do **prospect** são com os produtos/serviços do **tenant** (sua empresa).

### Como é Calculado:

1. **Edge Function:** `scan-prospect-website`
2. **Processo:**
   - Escaneia o website do prospect
   - Extrai produtos/serviços usando IA (OpenAI GPT-4o-mini)
   - Compara com produtos do tenant
   - Calcula matches usando análise contextual de IA
   - Retorna score de 0-20 pontos

### Quando é Acionado:

1. **Manual:** Quando você clica em "Enriquecer Website" na tabela de Quarentena ICP
2. **Automático:** Durante o processo de qualificação em massa (se configurado)
3. **Via API:** Quando a Edge Function `scan-prospect-website` é chamada

### O que o Score Traz:

- **0-5 pontos:** Baixa compatibilidade
- **6-10 pontos:** Compatibilidade moderada
- **11-15 pontos:** Boa compatibilidade
- **16-20 pontos:** Alta compatibilidade

### Dados Retornados:

```json
{
  "website_fit_score": 15,
  "website_products_match": [
    {
      "prospect_product": "Luvas de Proteção",
      "tenant_product": "Grip Defender",
      "match_type": "aplicacao",
      "confidence": 0.85,
      "reason": "Produtos de proteção para uso industrial"
    }
  ],
  "linkedin_url": "https://linkedin.com/company/...",
  "products_found": 32
}
```

---

## 🔄 PRESERVAÇÃO DE DADOS NA MIGRAÇÃO

### Problema Identificado:

Quando empresas são enriquecidas na **Base de Empresas** e depois migradas para **Quarentena ICP**, os dados enriquecidos (website_fit_score, website_products_match, etc.) não estavam sendo preservados.

### Causa Raiz:

1. O normalizador não estava lendo todos os dados de `raw_data`
2. A migração manual não estava usando o normalizador universal
3. Dados enriquecidos estavam apenas em campos diretos, não em `raw_data`

### Solução Implementada:

#### 1. **Normalizador Melhorado** (`companyDataNormalizer.ts`):

```typescript
// ✅ Agora lê de múltiplas fontes (campos diretos → raw_data → raw_analysis)
website_fit_score: company.website_fit_score ?? rawData?.website_fit_score ?? null,
website_products_match: company.website_products_match || rawData?.website_products_match || [],
```

#### 2. **Migração Usando Normalizador** (`CompaniesManagementPage.tsx`):

```typescript
// ✅ ANTES: Migração manual (perdia dados)
const insertData = { /* campos manuais */ };

// ✅ AGORA: Usa normalizador universal (preserva TUDO)
const normalized = normalizeFromCompanies(fullCompany);
const insertData = prepareForICPInsertion(normalized, tenantId);
```

#### 3. **Preservação em `raw_analysis`**:

Todos os dados enriquecidos são preservados em `raw_analysis`:

```typescript
raw_analysis: {
  ...normalized.raw_analysis,
  website_enrichment: {
    website_encontrado: normalized.website_encontrado,
    website_fit_score: normalized.website_fit_score,
    website_products_match: normalized.website_products_match,
    linkedin_url: normalized.linkedin_url,
  },
  migrated_from_companies: true,
  migrated_at: new Date().toISOString(),
}
```

---

## ✅ GARANTIAS DE PRESERVAÇÃO

Agora, quando uma empresa é migrada de **Base de Empresas** para **Quarentena ICP**, os seguintes dados são **100% preservados**:

- ✅ `website_encontrado`
- ✅ `website_fit_score`
- ✅ `website_products_match`
- ✅ `linkedin_url`
- ✅ `purchase_intent_score`
- ✅ `purchase_intent_type`
- ✅ `fit_score`
- ✅ `grade`
- ✅ `totvs_status`
- ✅ Todos os dados de `raw_data` (enriquecimentos Apollo, Receita Federal, etc.)

---

## 🎯 FLUXO COMPLETO

1. **Base de Empresas:**
   - Empresa é enriquecida (Receita Federal, Apollo, Website, etc.)
   - Dados salvos em `companies` (campos diretos + `raw_data`)

2. **Migração para Quarentena ICP:**
   - Normalizador lê TODOS os dados (campos diretos + `raw_data`)
   - Prepara dados usando `prepareForICPInsertion()`
   - Insere em `icp_analysis_results` com TODOS os dados preservados

3. **Quarentena ICP:**
   - Normalizador lê dados de `icp_analysis_results`
   - Exibe TODOS os dados enriquecidos corretamente
   - Não é necessário re-enriquecer

---

## 🔧 COMO VERIFICAR SE ESTÁ FUNCIONANDO

1. Enriqueça uma empresa na **Base de Empresas** (Website, Apollo, etc.)
2. Verifique os dados na tabela
3. Migre para **Quarentena ICP**
4. Verifique se os dados aparecem corretamente na Quarentena
5. **NÃO deve ser necessário re-enriquecer**

---

## 📝 NOTAS TÉCNICAS

- O `website_fit_score` é calculado pela Edge Function `scan-prospect-website`
- O score é salvo em `qualified_prospects` e `icp_analysis_results`
- O normalizador garante que dados sejam lidos de múltiplas fontes
- A migração agora usa o normalizador universal para garantir preservação total

