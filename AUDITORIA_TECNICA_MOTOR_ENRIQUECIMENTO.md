# 🚨 AUDITORIA TÉCNICA COMPLETA - MOTOR DE ENRIQUECIMENTO STRATEVO ONE

**Data:** 2026-01-24  
**Escopo:** Leads Aprovados - Ações em Massa e Individuais  
**Objetivo:** Mapear arquivo-a-arquivo cada ação, identificar pontos quebrados e inconsistências

---

## 📋 1. VISÃO GERAL DO SISTEMA ATUAL

### 1.1 Estrutura de Dados

**Tabela Principal:** `icp_analysis_results`
- **Status:** `'aprovada'` = Leads Aprovados
- **Campos de Enriquecimento:**
  - `raw_data` (JSONB) - Dados brutos (Receita Federal, Apollo, etc.)
  - `raw_analysis` (JSONB) - Análises processadas
  - `website_encontrado` (TEXT) - Website oficial
  - `website_fit_score` (NUMERIC) - Score de fit do website
  - `website_products_match` (JSONB) - Produtos compatíveis
  - `linkedin_url` (TEXT) - URL do LinkedIn
  - `apollo_id` (TEXT) - ID da organização Apollo
  - `decision_makers_count` (INTEGER) - Quantidade de decisores
  - `purchase_intent_score` (NUMERIC) - Score de intenção de compra

**Hook de Leitura:** `useApprovedCompanies`
- **Arquivo:** `src/hooks/useApprovedCompanies.ts`
- **Query:** `SELECT * FROM icp_analysis_results WHERE status = 'aprovada'`
- **Cache Key:** `['approved-companies']`
- **Stale Time:** 30 segundos

---

## 📦 2. MAPEAMENTO COMPLETO: AÇÕES → ARQUIVOS → APIs → CAMPOS

### 2.1 AÇÕES EM MASSA (Dropdown `QuarantineActionsMenu`)

#### ✅ **2.1.1 Receita Federal (Bulk)**

**Frontend:**
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Handler:** `handleBulkEnrichReceita()` (linha 1516)
- **Método:** Loop sequencial chamando `enrichReceitaMutation.mutateAsync(id)`

**Service:**
- **Arquivo:** `src/services/receitaFederal.ts`
- **Função:** `consultarReceitaFederal(cnpj)`
- **API Externa:** BrasilAPI (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`)
- **Fallback:** ReceitaWS (desabilitado por CORS)

**Persistência:**
- **Tabela:** `icp_analysis_results`
- **Campos Atualizados:**
  ```sql
  UPDATE icp_analysis_results SET
    uf = result.data?.uf,
    municipio = result.data?.municipio,
    porte = result.data?.porte,
    cnae_principal = finalCnaePrincipal,
    raw_data = { ...rawData, receita_federal: result.data },
    raw_analysis = { ...existingRawAnalysis, cnae_descricao: finalCnaeDescription }
  WHERE id = analysisId
  ```
- **Tabela Secundária:** `companies` (se `company_id` existir)
  ```sql
  UPDATE companies SET cnpj_status = 'ativa'|'inativo'|'pendente'
  WHERE id = company_id
  ```

**Status:** ✅ **FUNCIONANDO** - Dados são salvos corretamente

---

#### ⚠️ **2.1.2 Apollo Decisores (Bulk)**

**Frontend:**
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Handler:** `handleBulkEnrichApollo()` (linha 1545)
- **Método:** Loop sequencial com modal de progresso
- **Chama:** `enrichApolloMutation.mutateAsync(company.id)`

**Edge Function:**
- **Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`
- **Endpoint:** `supabase.functions.invoke('enrich-apollo-decisores')`
- **API Externa:** Apollo.io GraphQL API
- **Parâmetros Enviados:**
  ```typescript
  {
    company_id: targetCompanyId,
    company_name: analysis.company_name,
    domain: analysis.website || analysis.domain,
    modes: ['people', 'company'],
    city, state, industry, cep, fantasia
  }
  ```

**Persistência:**
- **Tabela:** `companies` (PRIMÁRIA)
  ```sql
  UPDATE companies SET
    linkedin_url = organizationData.linkedin_url,
    apollo_organization_id = organizationData.id,
    raw_data = { ...raw_data, apollo: { ... } }
  WHERE id = company_id
  ```
- **Tabela:** `decision_makers` (INSERÇÃO)
  ```sql
  INSERT INTO decision_makers (company_id, name, title, linkedin_url, email, classification)
  VALUES (...)
  ```
- **Tabela:** `icp_analysis_results` (SECUNDÁRIA - PROBLEMA!)
  ```sql
  UPDATE icp_analysis_results SET
    linkedin_url = companyRecord.linkedin_url,
    apollo_id = companyRecord.apollo_id,
    decision_makers_count = decisoresCount,
    raw_analysis = { ...raw_analysis, apollo: { ... } }
  WHERE cnpj = companyRecord.cnpj  -- ⚠️ BUSCA POR CNPJ, NÃO POR ID!
  ```

**PROBLEMA CRÍTICO #1:**
- Edge Function atualiza `icp_analysis_results` **POR CNPJ**, não por `id`
- Se houver múltiplos registros com mesmo CNPJ, pode atualizar o errado
- Se `company_id` não existir, dados NÃO são salvos em `icp_analysis_results`

**Status:** ⚠️ **PARCIALMENTE FUNCIONANDO** - Dados salvos em `companies`, mas podem não aparecer na tabela se `company_id` não existir

---

#### ✅ **2.1.3 Website & LinkedIn (Bulk)**

**Frontend:**
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Handler:** `handleBulkEnrichWebsite()` (linha 1624)
- **Método:** Loop sequencial chamando `handleEnrichWebsite(company.id)`

**Fluxo:**
1. **Edge Function 1:** `find-prospect-website`
   - Busca website oficial via Google Search
   - **Retorna:** `{ success: true, website: "..." }`

2. **Edge Function 2:** `scan-prospect-website`
   - Escaneia website e extrai produtos
   - Calcula `website_fit_score`
   - Extrai LinkedIn do HTML
   - **Retorna:** `{ success: true, website_fit_score, website_products_match, linkedin_url }`

**Persistência:**
- **Tabela:** `icp_analysis_results`
  ```sql
  UPDATE icp_analysis_results SET
    website_encontrado = websiteData.website,
    website_fit_score = scanData.website_fit_score,
    website_products_match = scanData.website_products_match,
    linkedin_url = scanData.linkedin_url
  WHERE id = analysisId
  ```

**Status:** ✅ **FUNCIONANDO** - Dados são salvos corretamente

---

#### ✅ **2.1.4 Enriquecimento 360° (Bulk)**

**Frontend:**
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Handler:** `handleBulkEnrich360()` (linha 1664)
- **Método:** Loop sequencial chamando `enrich360Mutation.mutateAsync(id)`

**Service:**
- **Arquivo:** `src/services/enrichment360.ts`
- **Função:** `enrichment360Simplificado()`
- **Tipo:** Cálculo local (NÃO usa Edge Function)
- **Validação:** Bloqueia se não estiver em contexto permitido

**Persistência:**
- **Tabela:** `icp_analysis_results`
  ```sql
  UPDATE icp_analysis_results SET
    raw_data = {
      ...rawData,
      enrichment_360: {
        scores: { digital_presence, digital_maturity, tech_sophistication, overall_health },
        analysis: { hasWebsite, hasLinkedIn, ... }
      }
    }
  WHERE id = analysisId
  ```

**Status:** ✅ **FUNCIONANDO** - Dados são salvos corretamente

---

#### ⚠️ **2.1.5 Verificação de Uso / STC (Bulk)**

**Frontend:**
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Handler:** `handleBulkVerification()` (linha 1693)
- **Método:** Loop sequencial com confirmação

**Edge Function:**
- **Arquivo:** `supabase/functions/usage-verification/index.ts`
- **Endpoint:** `supabase.functions.invoke('usage-verification')`
- **API Externa:** 70 fontes (30 portais vagas, 26 notícias, 6 vídeos/social, 1 parceiro)

**Persistência:**
- **Tabela:** `icp_analysis_results`
  ```sql
  UPDATE icp_analysis_results SET
    is_cliente_totvs = (data.status === 'no-go'),
    totvs_check_date = NOW(),
    totvs_evidences = data.evidences,
    raw_analysis = { ...raw_analysis, simple_totvs_check: data }
  WHERE id = analysisId
  ```
- **Tabela:** `stc_verification_history` (INSERÇÃO)
  ```sql
  INSERT INTO stc_verification_history (
    company_id, company_name, cnpj, status, confidence,
    triple_matches, double_matches, single_matches,
    total_score, evidences, full_report
  ) VALUES (...)
  ```

**Status:** ✅ **FUNCIONANDO** - Dados são salvos corretamente

---

#### ✅ **2.1.6 Descobrir CNPJ (Bulk)**

**Frontend:**
- **Arquivo:** `src/pages/Leads/ApprovedLeads.tsx`
- **Handler:** `handleBulkDiscoverCNPJ()` (linha 1880)
- **Método:** Loop sequencial chamando `discoverCNPJMutation.mutateAsync(company.id)`

**Edge Function:**
- **Arquivo:** `supabase/functions/discover-cnpj/index.ts`
- **API Externa:** Múltiplas fontes (ReceitaWS, BrasilAPI, Google Search)

**Persistência:**
- **Tabela:** `icp_analysis_results`
  ```sql
  UPDATE icp_analysis_results SET cnpj = discoveredCnpj WHERE id = analysisId
  ```

**Status:** ✅ **FUNCIONANDO**

---

### 2.2 AÇÕES INDIVIDUAIS (Menu da Engrenagem - `QuarantineRowActions`)

#### ✅ **2.2.1 Ver Detalhes**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx` (linha 196)
- **Ação:** `onPreview(company)` → Abre modal `ExpandedCompanyCard`

**Status:** ✅ **FUNCIONANDO** - Apenas visualização

---

#### ⚠️ **2.2.2 Editar/Salvar Dados**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx` (linha 213)
- **Ação:** Navega para `/search?companyId=${company.company_id}`
- **Problema:** Se `company_id` não existir, mostra toast mas não navega

**Status:** ⚠️ **DEPENDENTE DE company_id**

---

#### ✅ **2.2.3 Verificação de Uso (STC)**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx` (linha 240)
- **Ação:** Abre modal `QuarantineReportModal`
- **Execução:** Usuário clica "Verificar Agora" dentro do modal

**Status:** ✅ **FUNCIONANDO** - Mesma lógica do bulk

---

#### ✅ **2.2.4 Enriquecer Website & LinkedIn (Individual)**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx` (linha 361)
- **Ação:** `onEnrichWebsite(company.id)`
- **Handler:** `handleEnrichWebsite()` em `ApprovedLeads.tsx` (linha 1285)

**Status:** ✅ **FUNCIONANDO** - Mesma lógica do bulk

---

#### ⚠️ **2.2.5 Apollo Decisores (Individual)**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx`
- **Ação:** Não está no menu individual! ⚠️
- **Disponível via:** `UnifiedEnrichButton` (quando 1 empresa selecionada)

**Status:** ⚠️ **INCONSISTÊNCIA** - Disponível apenas via botão unificado, não no menu da engrenagem

---

#### ✅ **2.2.6 Receita Federal (Individual)**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx`
- **Ação:** Não está no menu individual! ⚠️
- **Disponível via:** `UnifiedEnrichButton`

**Status:** ⚠️ **INCONSISTÊNCIA** - Disponível apenas via botão unificado

---

#### ✅ **2.2.7 Calcular Intenção de Compra**

**Frontend:**
- **Arquivo:** `src/components/icp/QuarantineRowActions.tsx` (linha 383)
- **Ação:** `onCalculatePurchaseIntent(company.id)`
- **Handler:** `handleCalculatePurchaseIntent()` em `ApprovedLeads.tsx` (linha 1362)

**Edge Function:**
- **Arquivo:** `supabase/functions/calculate-enhanced-purchase-intent/index.ts`

**Persistência:**
- **Tabela:** `icp_analysis_results`
  ```sql
  UPDATE icp_analysis_results SET purchase_intent_score = calculatedScore WHERE id = analysisId
  ```

**Status:** ✅ **FUNCIONANDO**

---

## 🔴 3. PONTOS QUEBRADOS OU INCOMPLETOS

### 3.1 PROBLEMA CRÍTICO #1: Apollo não atualiza `icp_analysis_results` corretamente

**Localização:**
- **Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts` (linha 924)
- **Problema:**
  ```typescript
  // ❌ BUSCA POR CNPJ, NÃO POR ID!
  await supabaseClient
    .from('icp_analysis_results')
    .update(updateIcpData)
    .eq('cnpj', companyRecord.cnpj);  // ⚠️ Pode atualizar registro errado!
  ```

**Impacto:**
- Se `company_id` não existir, dados são salvos apenas em `companies`
- Tabela `Leads Aprovados` lê de `icp_analysis_results`, então dados não aparecem
- Se houver múltiplos registros com mesmo CNPJ, pode atualizar o registro errado

**Solução Necessária:**
- Passar `analysis_id` ou `qualified_prospect_id` para Edge Function
- Atualizar `icp_analysis_results` por `id` em vez de `cnpj`

---

### 3.2 PROBLEMA CRÍTICO #2: Inconsistência entre Ações em Massa e Individuais

**Problema:**
- **Apollo** e **Receita Federal** não estão no menu individual (`QuarantineRowActions`)
- Disponíveis apenas via `UnifiedEnrichButton` (quando 1 empresa selecionada)
- Usuário precisa selecionar empresa para ver opções

**Impacto:**
- UX confusa - ações diferentes em contextos diferentes
- Usuário não sabe onde encontrar enriquecimento individual

**Solução Necessária:**
- Adicionar "Enriquecer Apollo" e "Enriquecer Receita" no menu da engrenagem
- Ou padronizar: todas as ações em massa devem estar no menu individual

---

### 3.3 PROBLEMA #3: Dados não aparecem na tabela após enriquecimento

**Causa Raiz:**
1. **Cache não invalidado:** `queryClient.invalidateQueries()` pode não estar sendo chamado
2. **Campo errado:** Tabela lê de `raw_data.apollo`, mas Edge Function salva em `raw_analysis.apollo`
3. **Busca por CNPJ:** Edge Function atualiza por `cnpj`, pode atualizar registro errado

**Verificação Necessária:**
- Confirmar se `queryClient.invalidateQueries({ queryKey: ['approved-companies'] })` está sendo chamado após cada enriquecimento
- Verificar se campos `linkedin_url`, `website_encontrado` estão sendo lidos corretamente na renderização

---

### 3.4 PROBLEMA #4: Falta de Fallback entre Fontes

**Problema:**
- **LinkedIn:** Apenas Apollo busca LinkedIn
- **Website:** Apenas `find-prospect-website` busca website
- **Decisores:** Apenas Apollo busca decisores
- Não há fallback: LinkedIn → Apollo → Lusha

**Impacto:**
- Se Apollo falhar, não há alternativa
- Dados podem ficar incompletos sem opção de recuperação

**Solução Necessária:**
- Implementar motor de matching com fallback:
  1. Tentar Apollo (se `apollo_organization_id` existir)
  2. Tentar Lusha (se Apollo falhar)
  3. Tentar busca manual (se ambos falharem)

---

## 🎨 4. PROBLEMAS DE UI/UX

### 4.1 Overflow dos Dropdowns

**Componente:** `QuarantineActionsMenu` e `QuarantineRowActions`
- **Arquivo:** `src/components/ui/dropdown-menu.tsx` (Radix UI)
- **Problema:** Menus cortam fora da viewport quando próximos ao topo/bottom da tela
- **Causa:** Falta de `side` ou `alignOffset` dinâmico

**Solução Necessária:**
- Adicionar `side="bottom"` ou `side="top"` baseado na posição do viewport
- Usar `alignOffset` para ajustar posição horizontal
- Considerar `Portal` para renderizar fora do container pai

---

### 4.2 Responsividade

**Problema:**
- Dropdowns podem ficar cortados em telas pequenas
- Tabela não é responsiva (muitas colunas)

**Solução Necessária:**
- Implementar scroll horizontal na tabela
- Colapsar colunas menos importantes em mobile
- Usar `Popover` em vez de `DropdownMenu` para mais controle de posicionamento

---

## 📊 5. TABELA "LEADS APROVADOS" - DIAGNÓSTICO

### 5.1 Fonte de Dados

**Hook:** `useApprovedCompanies`
- **Query:** `SELECT * FROM icp_analysis_results WHERE status = 'aprovada'`
- **Campos Selecionados:**
  - Todos os campos (`*`)
  - `website_encontrado`, `website_fit_score`, `website_products_match`
  - `linkedin_url`, `purchase_intent_score`

### 5.2 Renderização de Colunas

**Arquivo:** `src/pages/Leads/ApprovedLeads.tsx` (linha 2500+)

**Colunas Exibidas:**
1. **Empresa:** `company.razao_social` + `company.cnpj`
2. **CNPJ:** `company.cnpj`
3. **Origem:** `getCompanyOriginString(company)` → Lê de `source_name`
4. **Status CNPJ:** `rawData.receita_federal.situacao`
5. **CNAE:** `resolveCompanyCNAE(company)` → Lê de múltiplas fontes
6. **Setor:** `getCNAEClassificationForCompany(company)` → Lê de `cnae_classifications`
7. **UF:** `getCompanyUF(company)` → Lê de `raw_data.receita_federal.uf`
8. **Cidade:** `getCompanyCity(company)` → Lê de `raw_data.receita_federal.municipio`
9. **ICP Score:** `company.icp_score`
10. **Status Enriquecimento:** `QuarantineEnrichmentStatusBadge` → Lê de `raw_data` e `raw_analysis`

### 5.3 Campos que NÃO Aparecem na Tabela

**Problema Identificado:**
- **LinkedIn URL:** Não há coluna dedicada (apenas no badge de enriquecimento)
- **Website:** Não há coluna dedicada (apenas no badge de enriquecimento)
- **Decisores:** Não há coluna dedicada (apenas contagem no badge)
- **Apollo ID:** Não aparece em lugar nenhum

**Impacto:**
- Usuário não vê dados enriquecidos diretamente na tabela
- Precisa abrir modal ou relatório para ver LinkedIn/Website/Decisores

---

## 🔧 6. GARGALOS TÉCNICOS REAIS

### 6.1 Cache/Invalidation

**Problema:**
- `queryClient.invalidateQueries()` é chamado, mas pode não estar funcionando
- `staleTime: 30000` pode estar causando dados desatualizados

**Verificação Necessária:**
- Adicionar logs para confirmar invalidation
- Reduzir `staleTime` ou forçar `refetch()` após enriquecimento

---

### 6.2 Ordem de Execução

**Problema:**
- Não há ordem garantida entre enriquecimentos
- Apollo pode executar antes de Receita Federal (que fornece dados necessários)

**Solução Necessária:**
- Implementar dependências: Apollo requer Receita Federal primeiro
- Validar pré-requisitos antes de executar enriquecimento

---

### 6.3 Tratamento de Erros

**Problema:**
- Erros são logados mas não sempre mostrados ao usuário
- Falhas silenciosas podem ocorrer

**Solução Necessária:**
- Garantir que todos os erros mostrem toast
- Implementar retry automático para falhas temporárias

---

## 📋 7. LISTA PRIORITÁRIA DE CORREÇÕES

### 🔴 CRÍTICO (Bloqueia Funcionalidade)

1. **Corrigir atualização de Apollo em `icp_analysis_results`**
   - Mudar busca de `cnpj` para `id` ou `analysis_id`
   - Garantir que dados sejam salvos mesmo sem `company_id`

2. **Adicionar Apollo e Receita no menu individual**
   - Incluir no `QuarantineRowActions`
   - Padronizar com ações em massa

3. **Garantir invalidation de cache após enriquecimento**
   - Adicionar `refetch()` explícito após cada UPDATE
   - Verificar se `queryClient.invalidateQueries()` está funcionando

### 🟡 IMPORTANTE (Melhora UX)

4. **Corrigir overflow de dropdowns**
   - Implementar posicionamento dinâmico
   - Usar Portal se necessário

5. **Adicionar colunas na tabela**
   - LinkedIn URL (coluna dedicada)
   - Website (coluna dedicada)
   - Decisores (contagem ou badge)

6. **Implementar fallback entre fontes**
   - LinkedIn → Apollo → Lusha
   - Website → Múltiplas fontes

### 🟢 DESEJÁVEL (Otimização)

7. **Melhorar tratamento de erros**
   - Toasts para todos os erros
   - Retry automático

8. **Implementar dependências entre enriquecimentos**
   - Validar pré-requisitos
   - Ordem de execução garantida

---

## 🎯 8. PRÉ-REQUISITOS PARA ATIVAR ENRIQUECIMENTO 100% FUNCIONAL

### 8.1 Correções Obrigatórias

1. ✅ Edge Function Apollo deve atualizar `icp_analysis_results` por `id`, não por `cnpj`
2. ✅ Garantir que `company_id` seja sempre passado para Edge Functions
3. ✅ Adicionar `analysis_id` como parâmetro alternativo se `company_id` não existir
4. ✅ Invalidar cache e forçar `refetch()` após cada enriquecimento
5. ✅ Padronizar menu individual com ações em massa

### 8.2 Validações Necessárias

1. ✅ Verificar se `linkedin_url` está sendo salvo em `icp_analysis_results.linkedin_url`
2. ✅ Verificar se `website_encontrado` está sendo salvo corretamente
3. ✅ Verificar se `raw_data.apollo` e `raw_analysis.apollo` estão consistentes
4. ✅ Confirmar que `queryClient.invalidateQueries()` está funcionando

### 8.3 Testes Obrigatórios

1. ✅ Enriquecer Apollo em empresa SEM `company_id` → Verificar se dados aparecem na tabela
2. ✅ Enriquecer Apollo em empresa COM `company_id` → Verificar se dados aparecem na tabela
3. ✅ Enriquecer Website → Verificar se `linkedin_url` aparece na tabela
4. ✅ Enriquecer em massa → Verificar se todas as empresas são atualizadas
5. ✅ Verificar cache → Confirmar que dados são atualizados imediatamente após enriquecimento

---

## 📝 9. CONCLUSÃO

### 9.1 O Que Está Funcionando

✅ Receita Federal (individual e bulk)  
✅ Website & LinkedIn (individual e bulk)  
✅ Enriquecimento 360° (individual e bulk)  
✅ Verificação de Uso / STC (individual e bulk)  
✅ Descobrir CNPJ (bulk)

### 9.2 O Que Está Quebrado

🔴 Apollo não atualiza `icp_analysis_results` corretamente (busca por CNPJ)  
🔴 Apollo e Receita não estão no menu individual  
🔴 Dados podem não aparecer na tabela após enriquecimento (cache/invalidation)  
🟡 Overflow de dropdowns  
🟡 Falta de colunas dedicadas para LinkedIn/Website/Decisores

### 9.3 Próximos Passos

1. **Corrigir Apollo** (CRÍTICO)
2. **Padronizar menus** (CRÍTICO)
3. **Garantir invalidation** (CRÍTICO)
4. **Corrigir UI/UX** (IMPORTANTE)
5. **Implementar fallback** (DESEJÁVEL)

---

**FIM DO RELATÓRIO**
