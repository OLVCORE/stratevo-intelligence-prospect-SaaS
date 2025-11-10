# 🔍 ANÁLISE COMPLETA: Todos os Caminhos de Enrichment Apollo

## 📍 LOCAIS ONDE APOLLO É CHAMADO:

### 1️⃣ QUARENTENA ICP - Individual (engrenagem)
**Arquivo:** `src/pages/Leads/ICPQuarantine.tsx`
**Linha:** ~299
**Função:** `enrichApolloMutation`
**Edge Function:** `enrich-apollo-decisores` ✅ CORRETO
**Status:** UNIFICADO ✅

### 2️⃣ QUARENTENA ICP - Em Massa
**Arquivo:** `src/pages/Leads/ICPQuarantine.tsx`
**Linha:** ~919-946
**Função:** `handleBulkEnrichApollo`
**Edge Function:** `enrich-apollo-decisores` ✅ CORRETO
**Status:** UNIFICADO ✅

### 3️⃣ GERENCIAR EMPRESAS - Individual (engrenagem)
**Arquivo:** `src/pages/CompaniesManagementPage.tsx`
**Linha:** ~736
**Função:** Apollo enrichment handler
**Edge Function:** `enrich-apollo-decisores` ✅ CORRETO
**Status:** UNIFICADO ✅

### 4️⃣ GERENCIAR EMPRESAS - Em Massa
**Arquivo:** `src/pages/CompaniesManagementPage.tsx`
**Função:** Batch enrichment
**Edge Function:** ❓ PRECISA VERIFICAR

### 5️⃣ DENTRO DO RELATÓRIO - Aba Decisores
**Arquivo:** `src/components/icp/tabs/DecisorsContactsTab.tsx`
**Linha:** ~681
**Função:** `linkedinMutation` → `performFullLinkedInAnalysis`
**Edge Function:** `enrich-apollo-decisores` ✅ CORRETO
**Status:** UNIFICADO ✅

### 6️⃣ APPROVED LEADS
**Arquivo:** `src/pages/ApprovedLeads.tsx` (se existir)
**Status:** ❓ PRECISA VERIFICAR

---

## 🔧 PRÓXIMOS PASSOS:

1. ✅ Verificar se há outros lugares chamando Apollo
2. ✅ Garantir que TODOS usam `enrich-apollo-decisores`
3. ✅ Garantir que TODOS passam `modes: ['people', 'company']`
4. ✅ Garantir que TODOS passam `company_id`

---

## 🚨 ERROS ENCONTRADOS:

1. ❌ `save-company` Edge Function com erro CORS
2. ❌ `company_previews` table não existe (404)
3. ❌ Leaflet map inicializado 2x

---

## 📋 AÇÕES NECESSÁRIAS:

- [ ] Unificar TODOS os caminhos de enrichment
- [ ] Corrigir erro CORS em save-company
- [ ] Verificar approved leads
- [ ] Testar cada caminho individualmente

