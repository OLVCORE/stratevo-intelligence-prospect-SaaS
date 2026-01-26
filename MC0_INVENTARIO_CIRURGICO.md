# 🧊 MICROCICLO 0 — INVENTÁRIO CIRÚRGICO (SEM ALTERAR CÓDIGO)

**Data:** 2026-01-24  
**Objetivo:** Mapear exatamente onde cada enrichment roda, quem escreve em quais tabelas/campos, onde há duplicidade e reexecução, onde está o fluxo quebrado

---

## 📍 1. ONDE CADA ENRICHMENT RODA (CAMINHOS EXATOS)

### 1.1 FRONTEND - HANDLERS DE ENRICHMENT

#### **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`

**Handlers de Bulk (Ações em Massa):**
- **Linha 1516:** `handleBulkEnrichReceita()` → Loop `enrichReceitaMutation.mutateAsync(id)`
- **Linha 1545:** `handleBulkEnrichApollo()` → Loop `enrichApolloMutation.mutateAsync(id)`
- **Linha 1624:** `handleBulkEnrichWebsite()` → Loop `handleEnrichWebsite(company.id)`
- **Linha 1643:** `handleBulkEnrich360()` → Loop `enrich360Mutation.mutateAsync(id)`
- **Linha 1693:** `handleBulkVerification()` → Loop `enrichVerificationMutation.mutateAsync(id)`
- **Linha 1880:** `handleBulkDiscoverCNPJ()` → Loop `discoverCNPJMutation.mutateAsync(id)`

**Handlers Individuais (Menu Engrenagem):**
- **Linha 1434:** `handleEnrichReceita(id)` → `enrichReceitaMutation.mutateAsync(id)`
- **Linha 1438:** `handleEnrichApollo(id)` → `enrichApolloMutation.mutateAsync(id)`
- **Linha 1442:** `handleEnrichVerification(id)` → `enrichVerificationMutation.mutateAsync(id)`
- **Linha 1451:** `handleEnrich360(id)` → `enrich360Mutation.mutateAsync(id)`
- **Linha 1456:** `handleEnrichCompleto(id)` → `enrichCompletoMutation.mutateAsync(id)`
- **Linha 1285:** `handleEnrichWebsite(analysisId)` → `scan-prospect-website` Edge Function

**Mutations (useMutation hooks):**
- **Linha 410:** `enrichReceitaMutation` → `consultarReceitaFederal()` (service)
- **Linha 668:** `enrichApolloMutation` → `supabase.functions.invoke('enrich-apollo-decisores')`
- **Linha 775:** `enrichVerificationMutation` → `supabase.functions.invoke('usage-verification')`
- **Linha 836:** `enrich360Mutation` → `enrichment360Simplificado()` (service)
- **Linha 1460:** `discoverCNPJMutation` → `supabase.functions.invoke('discover-cnpj')`

**Cache Invalidação:**
- **Linha 717-719:** `queryClient.invalidateQueries(['approved-companies', 'icp-quarantine', 'companies'])`
- **Linha 246:** `useApprovedCompanies()` → Query `SELECT * FROM icp_analysis_results WHERE status='aprovada'`

---

### 1.2 EDGE FUNCTIONS (BACKEND)

#### **Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`
- **Linha 92:** Handler principal
- **Linha 151:** Busca Apollo Organization ID (SEMPRE, não verifica se já existe)
- **Linha 350:** Busca Apollo People (SEMPRE, não verifica se decisores já existem)
- **Linha 743:** INSERT/UPSERT em `decision_makers` (via upsert com `onConflict: 'apollo_person_id'`)
- **Linha 880:** UPDATE em `companies` (PRIMÁRIA)
- **Linha 924:** UPDATE em `icp_analysis_results` (SECUNDÁRIA) - **PROBLEMA: busca por `cnpj`, não por `id`**
- **Linha 996:** UPDATE em `qualified_prospects` (se `qualified_prospect_id` fornecido)

#### **Arquivo:** `supabase/functions/scan-prospect-website/index.ts`
- **Linha 24:** Handler principal
- **Linha 111:** SELECT `tenant_products` (para matching)
- **Linha 228:** Extração de produtos via OpenAI (SEMPRE, não verifica se já foram extraídos)
- **Linha 280:** INSERT em `prospect_extracted_products`
- **Linha 685:** UPDATE em `qualified_prospects` (website, linkedin_url, website_fit_score, website_products_match)
- **Linha 724:** UPDATE em `companies` (se `company_id` existir)

#### **Arquivo:** `supabase/functions/usage-verification/index.ts`
- **Linha 1300:** Handler principal
- **Linha 2354:** Retorna dados para frontend
- Frontend atualiza `icp_analysis_results` (linha 804-815 do ApprovedLeads.tsx)

#### **Arquivo:** `supabase/functions/reveal-lusha-contact/index.ts`
- **Linha 22:** Handler principal
- **Linha 156:** Retorna dados para frontend
- Frontend atualiza `decision_makers` (via `revealContact.ts`)

---

### 1.3 SERVICES (FRONTEND)

#### **Arquivo:** `src/services/receitaFederal.ts`
- **Linha 43:** `consultarReceitaFederal()` → Chama BrasilAPI diretamente (sem Edge Function)
- **Linha 178:** Persiste em `qualified_stock_enrichment` (se `saveEnrichment=true`)
- Frontend atualiza `icp_analysis_results` (linha 1414-1463 do ApprovedLeads.tsx)

#### **Arquivo:** `src/services/apolloEnrichment.ts`
- **Linha 45:** `enrichCompanyWithApollo()` → Chama Apollo API diretamente (CORS pode bloquear)
- **Linha 201:** INSERT/UPSERT em `decision_makers`
- **Linha 248:** UPDATE em `companies`

#### **Arquivo:** `src/services/enrichment360.ts`
- **Linha 1:** `enrichment360Simplificado()` → Cálculo local (não usa Edge Function)
- Frontend atualiza `icp_analysis_results` (linha 869-894 do ApprovedLeads.tsx)

---

### 1.4 HOOKS

#### **Arquivo:** `src/hooks/useApprovedCompanies.ts`
- **Linha 4:** `useApprovedCompanies()` → Query `SELECT * FROM icp_analysis_results WHERE status='aprovada'`
- **Linha 44:** `staleTime: 30000` (30 segundos)
- **Linha 45:** `refetchOnWindowFocus: true`

---

## 📝 2. WRITE MAP (QUEM ESCREVE ONDE)

### 2.1 TABELA: `companies`

**Quem escreve:**
1. **Edge Function:** `enrich-apollo-decisores/index.ts` (linha 880)
   - Campos: `linkedin_url`, `apollo_organization_id`, `industry`, `description`, `raw_data`
2. **Edge Function:** `scan-prospect-website/index.ts` (linha 724)
   - Campos: `website`, `domain`, `linkedin_url`, `raw_data`
3. **Service:** `apolloEnrichment.ts` (linha 248)
   - Campos: `industry`, `raw_data.apollo_organization`
4. **Frontend:** `ApprovedLeads.tsx` (não encontrado UPDATE direto em companies)

**Campos escritos:**
- `linkedin_url` (TEXT)
- `website` (TEXT)
- `domain` (TEXT)
- `apollo_organization_id` (TEXT)
- `industry` (TEXT)
- `description` (TEXT)
- `raw_data` (JSONB) - Receita, Apollo, 360°
- `cnpj_status` (TEXT) - 'ativa'|'inativo'|'pendente'

---

### 2.2 TABELA: `icp_analysis_results`

**Quem escreve:**
1. **Edge Function:** `enrich-apollo-decisores/index.ts` (linha 924)
   - **PROBLEMA:** Busca por `cnpj`, não por `id` (linha 896: `.eq('cnpj', companyRecord.cnpj)`)
   - Campos: `linkedin_url`, `apollo_id`, `decision_makers_count`, `raw_analysis`
2. **Frontend:** `ApprovedLeads.tsx` (linha 1414-1463)
   - Mutation: `enrichReceitaMutation` → UPDATE após `consultarReceitaFederal()`
   - Campos: `uf`, `municipio`, `porte`, `cnae_principal`, `raw_data.receita_federal`, `raw_analysis.cnae_descricao`
3. **Frontend:** `ApprovedLeads.tsx` (linha 804-815)
   - Mutation: `enrichVerificationMutation` → UPDATE após `usage-verification`
   - Campos: `is_cliente_totvs`, `totvs_check_date`, `totvs_evidences`, `raw_analysis.simple_totvs_check`
4. **Frontend:** `ApprovedLeads.tsx` (linha 869-894)
   - Mutation: `enrich360Mutation` → UPDATE após `enrichment360Simplificado()`
   - Campos: `raw_analysis.enriched_360`

**Campos escritos:**
- `linkedin_url` (TEXT)
- `apollo_id` (TEXT)
- `decision_makers_count` (INTEGER)
- `website_encontrado` (TEXT)
- `website_fit_score` (NUMERIC)
- `website_products_match` (JSONB)
- `uf`, `municipio`, `porte`, `cnae_principal` (TEXT)
- `raw_data` (JSONB) - Receita Federal, Apollo
- `raw_analysis` (JSONB) - Análises processadas

---

### 2.3 TABELA: `qualified_prospects`

**Quem escreve:**
1. **Edge Function:** `enrich-apollo-decisores/index.ts` (linha 996)
   - Campos: `enrichment_data.apollo`, `linkedin_url`
2. **Edge Function:** `scan-prospect-website/index.ts` (linha 685)
   - Campos: `website_encontrado`, `linkedin_url`, `website_fit_score`, `website_products_match`
3. **Frontend:** `QualifiedProspectsStock.tsx` (linha 1335-1341)
   - Handler: `handleBulkEnrichReceita` → UPDATE após `consultarReceitaFederal()`
   - Campos: `enrichment_data.receita_federal`, `cnae_principal`
4. **Trigger:** `trigger_update_qualified_prospect_sector` (migration `20260125000010`)
   - Campos: `setor` (calculado automaticamente de `cnae_principal`)

**Campos escritos:**
- `enrichment_data` (JSONB) - Receita Federal, Apollo
- `cnae_principal` (TEXT)
- `setor` (TEXT) - "Setor - Categoria" (via trigger)
- `website_encontrado` (TEXT)
- `linkedin_url` (TEXT)
- `website_fit_score` (NUMERIC)
- `website_products_match` (JSONB)

---

### 2.4 TABELA: `decision_makers`

**Quem escreve:**
1. **Edge Function:** `enrich-apollo-decisores/index.ts` (linha 743)
   - INSERT/UPSERT via `upsert(decisoresToInsert, { onConflict: 'apollo_person_id' })`
   - Campos: `company_id`, `apollo_person_id`, `name`, `title`, `linkedin_url`, `email`, `phone`, `raw_apollo_data`, `data_sources`
2. **Service:** `apolloEnrichment.ts` (linha 201)
   - INSERT/UPSERT via `upsert(decisor, { onConflict: 'company_id,full_name' })`
   - Campos: `company_id`, `name`, `title`, `linkedin_url`, `raw_data`
3. **Frontend:** `revealContact.ts` (linha 148)
   - UPDATE após `reveal-lusha-contact`
   - Campos: `phone`, `email`

**Campos escritos:**
- `company_id` (UUID) - FK para companies
- `apollo_person_id` (TEXT) - UNIQUE
- `name`, `title`, `seniority` (TEXT)
- `linkedin_url`, `email`, `phone`, `mobile_phone` (TEXT)
- `raw_apollo_data`, `raw_linkedin_data` (JSONB)
- `data_sources` (JSONB) - ['apollo', 'linkedin', 'lusha']

---

### 2.5 TABELA: `prospect_extracted_products`

**Quem escreve:**
1. **Edge Function:** `scan-prospect-website/index.ts` (linha 280)
   - INSERT após extração via OpenAI
   - Campos: `qualified_prospect_id`, `tenant_id`, `nome`, `descricao`, `categoria`, `subcategoria`, `fonte`, `url_origem`, `confianca_extracao`

**Campos escritos:**
- `qualified_prospect_id` (UUID) - FK para qualified_prospects
- `nome`, `descricao`, `categoria`, `subcategoria` (TEXT)
- `fonte` (TEXT) - 'website' ou 'linkedin'
- `confianca_extracao` (NUMERIC)

---

## 📖 3. READ MAP (QUEM LÊ ONDE)

### 3.1 TABELA: `icp_analysis_results`

**Quem lê:**
1. **Hook:** `useApprovedCompanies.ts` (linha 13)
   - Query: `SELECT * FROM icp_analysis_results WHERE status='aprovada'`
   - Usado por: `ApprovedLeads.tsx` (linha 246)
2. **Frontend:** `ApprovedLeads.tsx` (linha 671, 733, 778, 839, 1463)
   - SELECT antes de mutations (buscar dados atuais)
3. **Componentes:**
   - `ExpandedCompanyCard.tsx` (linha 91) - Lê `raw_data`, `raw_analysis`
   - `ExpandableCompaniesTableBR.tsx` (linha 96) - Lê `raw_data.decision_makers`

**Campos lidos:**
- `linkedin_url`, `website_encontrado`, `apollo_id`
- `decision_makers_count`
- `website_fit_score`, `website_products_match`
- `raw_data` (Receita Federal, Apollo)
- `raw_analysis` (Análises processadas)

---

### 3.2 TABELA: `companies`

**Quem lê:**
1. **Edge Function:** `enrich-apollo-decisores/index.ts` (linha 885)
   - SELECT após UPDATE (buscar `cnpj` para atualizar `icp_analysis_results`)
2. **Componentes:**
   - `CompanyDetailPage.tsx` - Lê dados completos da empresa
   - `ExpandedCompanyCard.tsx` (linha 101) - Lê `linkedin_url`, `website`, `apollo_id`
   - `EnrichedCompanyResult.tsx` (linha 112) - Lê `industry`, `employees`, `website`

**Campos lidos:**
- `linkedin_url`, `website`, `domain`
- `apollo_organization_id`, `industry`, `description`
- `raw_data` (Receita, Apollo, 360°)
- `cnpj` (para buscar `icp_analysis_results`)

---

### 3.3 TABELA: `decision_makers`

**Quem lê:**
1. **Componentes:**
   - `CompanyDetailPage.tsx` - SELECT `* FROM decision_makers WHERE company_id = ?`
   - `DecisorsContactsTab.tsx` - Lê decisores para exibição
   - `ExpandableCompaniesTableBR.tsx` (linha 96) - Lê `raw_data.decision_makers` (cache simplificado)

**Campos lidos:**
- `name`, `title`, `seniority`
- `linkedin_url`, `email`, `phone`
- `raw_apollo_data`, `raw_linkedin_data`

---

### 3.4 TABELA: `tenant_products`

**Quem lê:**
1. **Edge Function:** `scan-prospect-website/index.ts` (linha 111)
   - SELECT para matching de produtos
2. **Frontend:** `WebsiteFitAnalysisCard.tsx` (linha 120)
   - SELECT para exibição e matching
3. **Frontend:** `Step1DadosBasicos.tsx` (linha 262)
   - SELECT para exibição no onboarding

**Campos lidos:**
- `nome`, `descricao`, `categoria`, `subcategoria`
- `setores_alvo`, `cnaes_alvo`

---

### 3.5 TABELA: `prospect_extracted_products`

**Quem lê:**
1. **Frontend:** `WebsiteFitAnalysisCard.tsx` (linha 108)
   - SELECT `* FROM prospect_extracted_products WHERE qualified_prospect_id = ?`

**Campos lidos:**
- `nome`, `descricao`, `categoria`, `subcategoria`

---

## 🔴 4. TOP 10 PONTOS DE REEXECUÇÃO/CUSTO

### 🔴 #1: Apollo Organization ID - Busca Sempre (CRÍTICO)
**Local:** `enrich-apollo-decisores/index.ts` linha 151-350  
**Problema:** Busca Organization ID via Apollo API mesmo se `companies.apollo_organization_id` já existe  
**Custo:** ~1 crédito Apollo por chamada  
**Frequência:** Cada clique em "Enriquecer Apollo"  
**Evidência:** Não há verificação prévia de `apollo_organization_id` antes de buscar

---

### 🔴 #2: Apollo People - Extração Sempre (CRÍTICO)
**Local:** `enrich-apollo-decisores/index.ts` linha 350-600  
**Problema:** Busca decisores via Apollo API mesmo se `decision_makers` já tem registros para `company_id`  
**Custo:** ~2-4 créditos Apollo por chamada  
**Frequência:** Cada clique em "Enriquecer Apollo"  
**Evidência:** Não há verificação prévia de `SELECT COUNT(*) FROM decision_makers WHERE company_id = ?`

---

### 🔴 #3: Website Scraping - Extração Sempre (CRÍTICO)
**Local:** `scan-prospect-website/index.ts` linha 228-300  
**Problema:** Extrai produtos via OpenAI mesmo se `prospect_extracted_products` já tem dados  
**Custo:** ~$0.01-0.02 por extração (OpenAI)  
**Frequência:** Cada clique em "Enriquecer Website"  
**Evidência:** Não há verificação prévia de `SELECT * FROM prospect_extracted_products WHERE qualified_prospect_id = ?`

---

### 🔴 #4: LinkedIn SERPER - Busca Sempre (IMPORTANTE)
**Local:** `scan-prospect-website/index.ts` linha 353-458  
**Problema:** Busca LinkedIn via SERPER mesmo se `linkedin_url` já existe em `companies` ou `icp_analysis_results`  
**Custo:** ~$0.001 por busca SERPER  
**Frequência:** Cada chamada `scan-prospect-website`  
**Evidência:** Não há verificação prévia de `linkedin_url` antes de buscar

---

### 🔴 #5: Receita Federal - Busca Sempre (IMPORTANTE)
**Local:** `ApprovedLeads.tsx` linha 1414-1463  
**Problema:** Chama `consultarReceitaFederal()` mesmo se `raw_data.receita_federal` já existe  
**Custo:** Grátis (BrasilAPI), mas desperdiça tempo  
**Frequência:** Cada clique em "Enriquecer Receita"  
**Evidência:** Não há verificação prévia de `raw_data.receita_federal`

---

### 🔴 #6: Update icp_analysis_results por CNPJ (CRÍTICO - BUG)
**Local:** `enrich-apollo-decisores/index.ts` linha 896  
**Problema:** UPDATE em `icp_analysis_results` busca por `cnpj` em vez de `id`  
**Custo:** Pode atualizar registro errado se houver CNPJ duplicado  
**Frequência:** Cada chamada Apollo  
**Evidência:** `.eq('cnpj', companyRecord.cnpj)` em vez de `.eq('id', analysisId)`

---

### 🔴 #7: decision_makers_count Não Sincroniza (CRÍTICO - BUG)
**Local:** `enrich-apollo-decisores/index.ts` linha 918-922  
**Problema:** `decision_makers_count` é calculado de `raw_data.apollo_decisores_count`, não de COUNT real  
**Custo:** Dados incorretos na tela  
**Frequência:** Cada chamada Apollo  
**Evidência:** Não há `SELECT COUNT(*) FROM decision_makers WHERE company_id = ?`

---

### 🔴 #8: Cache Invalidação Excessiva (IMPORTANTE)
**Local:** `ApprovedLeads.tsx` linha 717-719  
**Problema:** Invalida 3 queries diferentes após cada enrichment  
**Custo:** Refetch desnecessário  
**Frequência:** Cada enrichment  
**Evidência:** `invalidateQueries(['approved-companies', 'icp-quarantine', 'companies'])`

---

### 🔴 #9: Matching Sem Validação Prévia (CRÍTICO)
**Local:** `scan-prospect-website/index.ts` linha 473-592  
**Problema:** Calcula matching mesmo se `tenant_products` está vazio  
**Custo:** Score sempre = 0 sem motivo claro  
**Frequência:** Cada chamada `scan-prospect-website`  
**Evidência:** Não há verificação prévia de `tenant_products.length > 0`

---

### 🔴 #10: Lusha Apenas Manual (PERDA DE ACURÁCIA)
**Local:** `reveal-lusha-contact/index.ts`  
**Problema:** Lusha só é chamado manualmente, não há fallback automático Apollo → Lusha  
**Custo:** Perda de acurácia (80-90% mencionado pelo usuário)  
**Frequência:** Nunca automático  
**Evidência:** Não há integração automática Apollo → Lusha

---

## 🔍 5. FLUXO QUEBRADO IDENTIFICADO

### 5.1 Apollo → icp_analysis_results (BUG CRÍTICO)

**Fluxo Atual:**
1. `enrich-apollo-decisores` recebe `company_id`
2. Atualiza `companies` (linha 880) ✅
3. Busca `companies.cnpj` (linha 887)
4. Atualiza `icp_analysis_results` por `cnpj` (linha 896) ❌

**Problema:**
- Se `company_id` não existe, `icp_analysis_results` não é atualizado
- Se há múltiplos registros com mesmo CNPJ, pode atualizar registro errado
- Deveria atualizar por `id` quando `analysis_id` for fornecido

**Evidência:**
```typescript
// enrich-apollo-decisores/index.ts linha 896
.eq('cnpj', companyRecord.cnpj)  // ❌ Busca por CNPJ, não por ID
```

---

### 5.2 Decisores → decision_makers_count (BUG CRÍTICO)

**Fluxo Atual:**
1. Decisores são salvos em `decision_makers` (linha 743) ✅
2. `decision_makers_count` é calculado de `raw_data.apollo_decisores_count` (linha 919) ❌
3. Atualiza `icp_analysis_results.decision_makers_count` (linha 921)

**Problema:**
- `decision_makers_count` não reflete COUNT real de `decision_makers`
- Se decisores foram adicionados manualmente ou via outra fonte, count está errado

**Evidência:**
```typescript
// enrich-apollo-decisores/index.ts linha 919
const decisoresCount = companyRecord.raw_data?.apollo_decisores_count || 0;
// ❌ Deveria ser: SELECT COUNT(*) FROM decision_makers WHERE company_id = ?
```

---

### 5.3 Matching → Score = 0 (BUG CRÍTICO)

**Fluxo Atual:**
1. `scan-prospect-website` busca `tenant_products` (linha 111)
2. Extrai produtos do website via OpenAI (linha 228)
3. Calcula matching (linha 473-592)
4. Se `tenant_products.length === 0`, matching não executa → Score = 0

**Problema:**
- Não há validação prévia de `tenant_products.length > 0`
- Não há logs claros do motivo do score = 0
- Usuário não sabe se problema é tenant sem produtos ou matching falhou

**Evidência:**
```typescript
// scan-prospect-website/index.ts linha 473
if (extractedProducts.length > 0 && tenantProductsList.length > 0 && openaiKey) {
  // Matching executa
} else {
  // Score = 0 sem motivo claro
}
```

---

## 📊 6. RESUMO EXECUTIVO

### 6.1 Pontos de Escrita (WRITE MAP)

| Tabela | Quem Escreve | Campos Principais | Problema |
|--------|--------------|-------------------|----------|
| `companies` | `enrich-apollo-decisores`, `scan-prospect-website`, `apolloEnrichment.ts` | `linkedin_url`, `apollo_organization_id`, `raw_data` | ✅ OK |
| `icp_analysis_results` | `enrich-apollo-decisores`, `ApprovedLeads.tsx` | `linkedin_url`, `decision_makers_count`, `raw_data` | ❌ Busca por CNPJ |
| `qualified_prospects` | `enrich-apollo-decisores`, `scan-prospect-website`, `QualifiedProspectsStock.tsx` | `enrichment_data`, `website_fit_score` | ✅ OK |
| `decision_makers` | `enrich-apollo-decisores`, `apolloEnrichment.ts`, `revealContact.ts` | `name`, `title`, `linkedin_url`, `email` | ✅ OK |
| `prospect_extracted_products` | `scan-prospect-website` | `nome`, `categoria`, `descricao` | ✅ OK |

### 6.2 Pontos de Leitura (READ MAP)

| Tabela | Quem Lê | Campos Principais | Problema |
|--------|---------|-------------------|----------|
| `icp_analysis_results` | `useApprovedCompanies`, `ApprovedLeads.tsx`, componentes | `linkedin_url`, `decision_makers_count`, `raw_data` | ✅ OK |
| `companies` | `enrich-apollo-decisores`, componentes | `linkedin_url`, `apollo_organization_id`, `cnpj` | ✅ OK |
| `decision_makers` | `CompanyDetailPage`, `DecisorsContactsTab` | `name`, `title`, `linkedin_url`, `email` | ✅ OK |
| `tenant_products` | `scan-prospect-website`, `WebsiteFitAnalysisCard` | `nome`, `categoria`, `setores_alvo` | ✅ OK |
| `prospect_extracted_products` | `WebsiteFitAnalysisCard` | `nome`, `categoria`, `descricao` | ✅ OK |

### 6.3 Top 10 Reexecuções/Custos

1. 🔴 Apollo Organization ID - Busca sempre (~1 crédito)
2. 🔴 Apollo People - Extração sempre (~2-4 créditos)
3. 🔴 Website Scraping - Extração sempre (~$0.01-0.02)
4. 🔴 LinkedIn SERPER - Busca sempre (~$0.001)
5. 🔴 Receita Federal - Busca sempre (grátis, mas desperdiça tempo)
6. 🔴 Update por CNPJ - Bug crítico (pode atualizar registro errado)
7. 🔴 decision_makers_count - Não sincroniza (dados incorretos)
8. 🔴 Cache invalidação excessiva (refetch desnecessário)
9. 🔴 Matching sem validação (score = 0 sem motivo)
10. 🔴 Lusha apenas manual (perda de acurácia)

---

## ✅ ENTREGÁVEL MC0

**Relatório textual objetivo com:**
- ✅ Onde cada enrichment roda (caminhos exatos)
- ✅ WRITE MAP (quem escreve onde)
- ✅ READ MAP (quem lê onde)
- ✅ TOP 10 pontos de reexecução/custo
- ✅ Fluxo quebrado identificado

**Nenhuma alteração de código, nenhum commit.**

🛑 **PARAR e aguardar aprovação humana para o MC1.**
