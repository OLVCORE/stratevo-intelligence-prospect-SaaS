# 🚨 AUDITORIA TÉCNICA COMPLETA - ARQUITETURA DE ENRIQUECIMENTO STRATEVO ONE

**Data:** 2026-01-24  
**Objetivo:** Mapear arquitetura real, identificar quebras de fluxo canônico, perda de inteligência, falhas de persistência e redundância de execução

---

## 📊 MISSÃO 1 — MAPA REAL DO BANCO DE DADOS

### 1.1 TABELAS PRINCIPAIS (ATIVAS)

#### ✅ **companies** (FONTE DA VERDADE - Empresas)
- **Finalidade:** Armazena dados canônicos de empresas
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Edge Functions: `enrich-apollo`, `enrich-apollo-decisores`, `enrich-company-360`
  - Frontend: `CompaniesManagementPage`, `ApprovedLeads` (via mutations)
  - Services: `apolloEnrichment.ts`, `receitaFederal.ts`
- **Quem lê:**
  - `CompaniesManagementPage` (SELECT * FROM companies)
  - `ApprovedLeads` (via `company_id` em `icp_analysis_results`)
  - `CompanyDetailPage`
- **Campos de Enriquecimento:**
  - `raw_data` (JSONB) - Receita Federal, Apollo, 360°
  - `linkedin_url` (TEXT)
  - `website` (TEXT)
  - `apollo_organization_id` (TEXT)
  - `industry` (TEXT)
  - `description` (TEXT)

---

#### ✅ **icp_analysis_results** (FONTE DA VERDADE - Leads Aprovados)
- **Finalidade:** Análises ICP e leads aprovados (status='aprovada')
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Edge Functions: `enrich-apollo-decisores` (atualiza por CNPJ ⚠️)
  - Frontend: `ApprovedLeads.tsx` (mutations: Receita, Apollo, 360°, Website)
  - Motor de Qualificação: `qualify-prospects-bulk`
- **Quem lê:**
  - `ApprovedLeads.tsx` (via `useApprovedCompanies` hook)
  - `ICPQuarantine.tsx`
- **Campos de Enriquecimento:**
  - `raw_data` (JSONB) - Receita Federal, Apollo
  - `raw_analysis` (JSONB) - Análises processadas
  - `website_encontrado` (TEXT)
  - `website_fit_score` (NUMERIC)
  - `website_products_match` (JSONB)
  - `linkedin_url` (TEXT)
  - `apollo_id` (TEXT)
  - `decision_makers_count` (INTEGER)

---

#### ✅ **qualified_prospects** (Estoque Qualificado)
- **Finalidade:** Empresas qualificadas no estoque
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Motor de Qualificação: `qualify-prospects-bulk`
  - Frontend: `QualifiedProspectsStock.tsx` (enriquecimento Receita)
  - Edge Functions: `scan-prospect-website`
- **Quem lê:**
  - `QualifiedProspectsStock.tsx`
- **Campos de Enriquecimento:**
  - `enrichment_data` (JSONB) - Receita Federal, Apollo
  - `website_encontrado` (TEXT)
  - `website_fit_score` (NUMERIC)
  - `website_products_match` (JSONB)
  - `linkedin_url` (TEXT)
  - `setor` (TEXT) - "Setor - Categoria"

---

#### ✅ **decision_makers** (FONTE DA VERDADE - Decisores)
- **Finalidade:** Decisores/pessoas de contato das empresas
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Edge Functions: `enrich-apollo-decisores` (INSERÇÃO via upsert)
  - Edge Functions: `enrich-apollo` (INSERÇÃO em `people` + link em `company_people`)
  - Services: `apolloEnrichment.ts` (INSERÇÃO direta)
- **Quem lê:**
  - `CompanyDetailPage` (SELECT * FROM decision_makers WHERE company_id = ?)
  - Relatórios ICP (abas de decisores)
- **Campos Principais:**
  - `company_id` (UUID) - FK para companies
  - `apollo_person_id` (TEXT) - UNIQUE
  - `name`, `title`, `seniority`
  - `email`, `phone`, `mobile_phone`
  - `linkedin_url`
  - `raw_apollo_data` (JSONB)
  - `raw_linkedin_data` (JSONB)
  - `data_sources` (JSONB) - ['apollo', 'linkedin', 'lusha']

**PROBLEMA IDENTIFICADO:**
- Edge Function `enrich-apollo-decisores` salva decisores em `decision_makers`
- Mas NÃO atualiza `icp_analysis_results.decision_makers_count` corretamente
- Busca por CNPJ em vez de `id`, pode atualizar registro errado

---

#### ✅ **tenant_products** (Produtos do Tenant)
- **Finalidade:** Catálogo de produtos/serviços do tenant (onboarding)
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Onboarding: `Step1DadosBasicos.tsx` (upload manual)
  - Edge Functions: `scan-website-products`, `scan-website-products-360` (extração automática)
  - Edge Functions: `extract-products-from-documents` (PDF/XLSX)
- **Quem lê:**
  - `WebsiteFitAnalysisCard.tsx` (SELECT * FROM tenant_products WHERE tenant_id = ?)
  - `ProductComparisonMatrix.tsx`
  - `scan-prospect-website` (para matching)
- **Campos Principais:**
  - `nome`, `descricao`, `categoria`, `subcategoria`
  - `cnaes_alvo`, `setores_alvo`, `portes_alvo`
  - `diferenciais`, `casos_uso`, `dores_resolvidas`

---

#### ✅ **prospect_extracted_products** (Produtos Extraídos de Prospects)
- **Finalidade:** Produtos extraídos de websites de empresas prospectadas
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Edge Functions: `scan-prospect-website` (INSERÇÃO após extração IA)
- **Quem lê:**
  - `WebsiteFitAnalysisCard.tsx` (SELECT * FROM prospect_extracted_products WHERE qualified_prospect_id = ?)
- **Campos Principais:**
  - `qualified_prospect_id` (UUID) - FK para qualified_prospects
  - `nome`, `descricao`, `categoria`, `subcategoria`
  - `fonte` (TEXT) - 'website' ou 'linkedin'
  - `confianca_extracao` (NUMERIC)

---

#### ✅ **stc_verification_history** (Relatórios STC)
- **Finalidade:** Histórico de verificações de uso TOTVS (GO/NO-GO)
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Edge Functions: `usage-verification` (INSERÇÃO após verificação)
  - Frontend: `QuarantineReportModal.tsx` (salva full_report)
- **Quem lê:**
  - `QuarantineReportModal.tsx` (carrega último relatório)
  - `TOTVSCheckCard.tsx`
- **Campos Principais:**
  - `full_report` (JSONB) - Relatório completo com todas as abas
  - `status` (TEXT) - 'go' ou 'no-go'
  - `evidences` (JSONB)
  - `__status` (JSONB) - Status de cada aba: { tabKey: { status: 'completed'|'processing'|'draft' } }

---

#### ✅ **cnae_classifications** (Classificação CNAE)
- **Finalidade:** Mapeamento CNAE → Setor → Categoria
- **Status:** ✅ ATIVA
- **Quem escreve:**
  - Migration: `20250226000002_populate_cnae_classifications_COMPLETE.sql` (1327 registros)
- **Quem lê:**
  - Triggers: `trigger_update_company_sector_from_cnae`, `trigger_update_qualified_prospect_sector`
  - Frontend: `getCNAEClassificationForCompany`, `getCNAEClassificationForProspect`
- **Campos Principais:**
  - `cnae_code` (VARCHAR) - UNIQUE
  - `setor_industria` (VARCHAR)
  - `categoria` (VARCHAR)

---

#### ⚠️ **people** (Pessoas - DUPLICADO?)
- **Finalidade:** Pessoas/decisores (estrutura alternativa?)
- **Status:** ⚠️ VERIFICAR SE ESTÁ EM USO
- **Quem escreve:**
  - Edge Functions: `enrich-apollo` (INSERÇÃO)
- **Quem lê:**
  - Não encontrado uso direto no frontend
- **Observação:** Pode ser duplicação de `decision_makers`

---

#### ⚠️ **company_people** (Link Company-People)
- **Finalidade:** Tabela de relacionamento companies ↔ people
- **Status:** ⚠️ VERIFICAR SE ESTÁ EM USO
- **Observação:** Pode ser redundante se `decision_makers` já tem `company_id`

---

### 1.2 TABELAS SECUNDÁRIAS

#### ✅ **qualified_stock_enrichment**
- **Finalidade:** Cache de enriquecimentos do estoque qualificado
- **Status:** ✅ ATIVA (mas pode não estar sendo usada)
- **Observação:** Trigger de `qualified_prospects` busca dados aqui como fallback

#### ✅ **tenant_competitor_products**
- **Finalidade:** Produtos extraídos de concorrentes
- **Status:** ✅ ATIVA
- **Uso:** Análise competitiva

#### ✅ **linkedin_accounts**, **linkedin_connections**, **linkedin_leads**
- **Finalidade:** Integração LinkedIn
- **Status:** ✅ ATIVAS
- **Observação:** Não encontrado uso direto no enriquecimento de Leads Aprovados

---

## 🔹 MISSÃO 2 — FONTES DE DADOS (ONDE CADA COISA GRAVA)

### 2.1 APOLLO

#### **Funções que Chamam Apollo:**

1. **Edge Function:** `enrich-apollo-decisores`
   - **Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`
   - **Chamado por:** `ApprovedLeads.tsx` → `enrichApolloMutation`
   - **API Externa:** Apollo.io GraphQL API
   - **Endpoint:** `https://api.apollo.io/v1/organizations/search`, `https://api.apollo.io/v1/people/search`

2. **Edge Function:** `enrich-apollo`
   - **Arquivo:** `supabase/functions/enrich-apollo/index.ts`
   - **Chamado por:** `useEnrichmentOrchestration`, `useCompanyActions`
   - **API Externa:** Apollo.io GraphQL API

3. **Service Frontend:** `apolloEnrichment.ts`
   - **Arquivo:** `src/services/apolloEnrichment.ts`
   - **Função:** `enrichCompanyWithApollo()`
   - **API Externa:** Apollo.io REST API (chamada direta do frontend - CORS pode bloquear)

#### **Tabelas Onde Apollo Grava:**

1. **`companies`** (PRIMÁRIA)
   ```sql
   UPDATE companies SET
     linkedin_url = organizationData.linkedin_url,
     apollo_organization_id = organizationData.id,
     industry = organizationData.industry,
     description = organizationData.short_description,
     raw_data = { ...raw_data, apollo: { organization, decisores } }
   WHERE id = company_id
   ```

2. **`decision_makers`** (INSERÇÃO)
   ```sql
   INSERT INTO decision_makers (
     company_id, apollo_person_id, name, title, linkedin_url,
     email, phone, raw_apollo_data, data_sources
   ) VALUES (...)
   ON CONFLICT (apollo_person_id) DO UPDATE ...
   ```

3. **`icp_analysis_results`** (SECUNDÁRIA - PROBLEMA!)
   ```sql
   UPDATE icp_analysis_results SET
     linkedin_url = companyRecord.linkedin_url,
     apollo_id = companyRecord.apollo_id,
     decision_makers_count = decisoresCount,
     raw_analysis = { ...raw_analysis, apollo: { ... } }
   WHERE cnpj = companyRecord.cnpj  -- ⚠️ BUSCA POR CNPJ, NÃO POR ID!
   ```

4. **`qualified_prospects`** (SE qualified_prospect_id fornecido)
   ```sql
   UPDATE qualified_prospects SET
     linkedin_url = organizationData.linkedin_url,
     enrichment_data = { ...enrichment_data, apollo: { ... } }
   WHERE id = qualified_prospect_id
   ```

#### **O Que É Salvo:**

- **Empresa:**
  - `linkedin_url`, `apollo_organization_id`, `industry`, `description`
  - `raw_data.apollo_organization` (dados completos)
  - `raw_data.decision_makers` (lista simplificada)

- **Decisores:**
  - `name`, `title`, `seniority`, `linkedin_url`
  - `email`, `phone`, `mobile_phone` (quando disponível)
  - `raw_apollo_data` (dados completos)
  - `data_sources: ['apollo']`

#### **Reaproveitamento:**

❌ **NÃO HÁ REAPROVEITAMENTO**
- Edge Function `enrich-apollo-decisores` **SEMPRE** chama Apollo API
- Não verifica se `apollo_organization_id` já existe
- Não verifica se `decision_makers` já foram extraídos
- Não verifica se `raw_data.apollo` já existe

**Custo:** Cada chamada consome créditos Apollo mesmo se dados já existem

---

### 2.2 LINKEDIN

#### **Como É Feita a Busca:**

1. **Via Apollo** (quando Apollo é chamado)
   - Apollo retorna `linkedin_url` da organização
   - Salvo em `companies.linkedin_url` e `icp_analysis_results.linkedin_url`

2. **Via Website Scraping**
   - Edge Function: `scan-prospect-website`
   - Extrai LinkedIn do HTML do website (rodapé, header)
   - Busca via SERPER se não encontrar no HTML
   - Salvo em `qualified_prospects.linkedin_url`

3. **Via Busca Manual** (não encontrado no código atual)

#### **Onde LinkedIn É Persistido:**

1. **`companies.linkedin_url`** (TEXT)
2. **`icp_analysis_results.linkedin_url`** (TEXT)
3. **`qualified_prospects.linkedin_url`** (TEXT)
4. **`decision_makers.linkedin_url`** (TEXT)
5. **`companies.raw_data.apollo_organization.linkedin_url`** (JSONB)
6. **`icp_analysis_results.raw_analysis.apollo.linkedin_url`** (JSONB)

**PROBLEMA:** LinkedIn está em **6 lugares diferentes**, sem sincronismo

#### **Fallback:**

✅ **EXISTE FALLBACK PARCIAL:**
- Se Apollo não encontrar LinkedIn, `scan-prospect-website` tenta extrair do HTML
- Se HTML não tiver, busca via SERPER

❌ **NÃO HÁ FALLBACK LUSHA:**
- Lusha não é usado para buscar LinkedIn (apenas email/telefone)

---

### 2.3 LUSHA

#### **Entra em Qual Momento:**

- **Edge Function:** `reveal-lusha-contact`
- **Arquivo:** `supabase/functions/reveal-lusha-contact/index.ts`
- **Chamado por:** `revealContact.ts` → `revealPersonalContact()`
- **Quando:** Apenas quando usuário clica em "Revelar Contato" de um decisor VIP

#### **Complementa Quem:**

- **Complementa:** Apollo (quando Apollo não retorna email/telefone pessoal)
- **NÃO complementa:** LinkedIn (Lusha não busca LinkedIn)

#### **Onde Grava:**

1. **`decision_makers`**
   ```sql
   UPDATE decision_makers SET
     phone = lushaData.mobile,
     email = lushaData.personal_email
   WHERE id = decisorId
   ```

2. **NÃO grava em:** `companies`, `icp_analysis_results`, `qualified_prospects`

**PROBLEMA:** Lusha só é chamado manualmente, não há integração automática

---

### 2.4 WEBSITE SCRAPING

#### **Ainda Existe?**

✅ **SIM** - Edge Function `scan-prospect-website` está ativa

#### **Onde Ocorre:**

- **Edge Function:** `scan-prospect-website`
- **Arquivo:** `supabase/functions/scan-prospect-website/index.ts`
- **Chamado por:** `ApprovedLeads.tsx` → `handleEnrichWebsite()`

#### **Onde Produtos/Serviços São Salvos:**

1. **`prospect_extracted_products`** (PRIMÁRIA)
   ```sql
   INSERT INTO prospect_extracted_products (
     qualified_prospect_id, tenant_id, nome, descricao, categoria, subcategoria, fonte, url_origem
   ) VALUES (...)
   ```

2. **`qualified_prospects.website_products_match`** (JSONB)
   - Array de matches: `[{ prospect_product, tenant_product, match_type, confidence }]`

3. **`qualified_prospects.website_fit_score`** (NUMERIC)
   - Score 0-20 baseado em matches encontrados

**PROBLEMA:** Produtos são extraídos, mas matching pode retornar 0 se:
- `tenant_products` está vazio (tenant não fez onboarding)
- IA não encontra matches (falha na análise contextual)
- Fallback simples não encontra matches por categoria/palavras-chave

---

### 2.5 RECEITA FEDERAL / BRASILAPI / RECEITAWS

#### **Quais Dados Entram:**

- **BrasilAPI:** Dados completos (48 campos)
- **ReceitaWS:** Dados completos (desabilitado por CORS)

#### **Onde São Persistidos:**

1. **`icp_analysis_results`**
   ```sql
   UPDATE icp_analysis_results SET
     uf = result.data.uf,
     municipio = result.data.municipio,
     porte = result.data.porte,
     cnae_principal = finalCnaePrincipal,
     raw_data = { ...raw_data, receita_federal: result.data },
     raw_analysis = { ...raw_analysis, cnae_descricao: finalCnaeDescription }
   WHERE id = analysisId
   ```

2. **`companies`** (se `company_id` existir)
   ```sql
   UPDATE companies SET cnpj_status = 'ativa'|'inativo'|'pendente'
   WHERE id = company_id
   ```

3. **`qualified_prospects`** (via trigger após salvar `enrichment_data`)
   ```sql
   -- Trigger atualiza automaticamente:
   UPDATE qualified_prospects SET
     setor = "Setor - Categoria",
     cnae_principal = cnaeCode
   WHERE id = prospectId
   ```

#### **Alimentam Relatórios/Decisores/Empresa:**

✅ **SIM:**
- Alimenta campos diretos: `uf`, `municipio`, `porte`, `cnae_principal`
- Alimenta `raw_data.receita_federal` (usado em relatórios)
- **NÃO alimenta decisores diretamente** (mas fornece dados para Apollo buscar)

---

## 🔄 MISSÃO 3 — FLUXO CANÔNICO (OU A AUSÊNCIA DELE)

### 3.1 FONTE DA VERDADE - EMPRESA

**RESPOSTA:** ❌ **NÃO EXISTE FONTE DA VERDADE ÚNICA**

**Duplicações Identificadas:**

1. **`companies`** (schema principal)
   - Campos: `name`, `cnpj`, `domain`, `website`, `linkedin_url`, `industry`
   - `raw_data` (JSONB) - Receita, Apollo, 360°

2. **`icp_analysis_results`** (análises ICP)
   - Campos: `razao_social`, `cnpj`, `website`, `linkedin_url`, `uf`, `municipio`
   - `raw_data` (JSONB) - Receita, Apollo
   - `raw_analysis` (JSONB) - Análises processadas

3. **`qualified_prospects`** (estoque qualificado)
   - Campos: `razao_social`, `cnpj`, `website_encontrado`, `linkedin_url`, `cidade`, `estado`
   - `enrichment_data` (JSONB) - Receita, Apollo

**PROBLEMA:** Dados da mesma empresa em 3 tabelas diferentes, sem sincronismo garantido

---

### 3.2 FONTE DA VERDADE - PESSOA / DECISOR

**RESPOSTA:** ⚠️ **PARCIALMENTE CANÔNICO**

**Tabela Canônica:** `decision_makers`
- **FK:** `company_id` → `companies.id`
- **Identificador Único:** `apollo_person_id` (UNIQUE)

**Duplicações Identificadas:**

1. **`decision_makers`** (PRIMÁRIA)
   - Campos completos: 42+ campos
   - `raw_apollo_data`, `raw_linkedin_data`

2. **`people`** (SECUNDÁRIA - VERIFICAR SE ESTÁ EM USO)
   - Estrutura similar a `decision_makers`
   - Link via `company_people`

3. **`companies.raw_data.decision_makers`** (CACHE SIMPLIFICADO)
   - Array simplificado: `[{ name, title, linkedin_url, email, classification }]`
   - Usado apenas para exibição rápida

**PROBLEMA:** `people` pode ser redundante se `decision_makers` já cobre tudo

---

### 3.3 ONDE DEVERIA REUTILIZAR MAS NÃO REUTILIZA

1. **Apollo Organization ID:**
   - ❌ Sistema sempre busca Apollo por nome, mesmo se `apollo_organization_id` já existe
   - ✅ **DEVERIA:** Verificar se `companies.apollo_organization_id` existe antes de buscar

2. **LinkedIn URL:**
   - ❌ Sistema busca LinkedIn via SERPER mesmo se `linkedin_url` já existe
   - ✅ **DEVERIA:** Verificar se `companies.linkedin_url` ou `icp_analysis_results.linkedin_url` já existe

3. **Decisores:**
   - ❌ Sistema sempre chama Apollo mesmo se `decision_makers` já tem dados
   - ✅ **DEVERIA:** Verificar se `decision_makers` já tem registros para `company_id` antes de chamar Apollo

4. **Produtos Extraídos:**
   - ❌ Sistema sempre extrai produtos do website mesmo se `prospect_extracted_products` já tem dados
   - ✅ **DEVERIA:** Verificar se produtos já foram extraídos antes de chamar IA

5. **Receita Federal:**
   - ⚠️ **PARCIALMENTE:** `batch-enrich-receitaws` verifica se `raw_data.receita` existe
   - ❌ Mas `ApprovedLeads` não verifica antes de chamar

---

### 3.4 ONDE REEXECUTA TUDO DO ZERO

1. **Apollo Decisores:**
   - ❌ **SEMPRE** chama Apollo API, mesmo se decisores já existem
   - ❌ **SEMPRE** busca Organization ID, mesmo se `apollo_organization_id` já existe
   - **Custo:** ~3-5 créditos Apollo por chamada

2. **Website Scraping:**
   - ❌ **SEMPRE** extrai produtos via IA, mesmo se `prospect_extracted_products` já tem dados
   - **Custo:** ~$0.01-0.02 por extração (OpenAI)

3. **LinkedIn:**
   - ❌ **SEMPRE** busca via SERPER, mesmo se `linkedin_url` já existe
   - **Custo:** ~$0.001 por busca SERPER

---

## 🎯 MISSÃO 4 — MATCHING DE PRODUTOS (CRÍTICO)

### 4.1 DE ONDE VEM PRODUTOS DO TENANT

**RESPOSTA:** ✅ **TABELA `tenant_products`**

**Como É Lido:**

1. **Onboarding:**
   - `Step1DadosBasicos.tsx` → `loadTenantProducts()`
   - Query: `SELECT * FROM tenant_products WHERE tenant_id = ? AND ativo = true`

2. **Website Fit Analysis:**
   - `WebsiteFitAnalysisCard.tsx` → `loadProducts()`
   - Query: `SELECT id, nome, descricao, categoria, subcategoria FROM tenant_products WHERE tenant_id = ? AND ativo = true`

3. **Scan Prospect Website:**
   - Edge Function `scan-prospect-website`
   - Query: `SELECT nome, categoria, descricao FROM tenant_products WHERE tenant_id = ?`

**Status:** ✅ **FUNCIONANDO** - Produtos do tenant são lidos corretamente

---

### 4.2 PRODUTOS DA EMPRESA INVESTIGADA

**RESPOSTA:** ✅ **EXTRAÍDOS E SALVOS**

**Como São Extraídos:**

1. **Edge Function:** `scan-prospect-website`
   - Escaneia homepage do website
   - Usa OpenAI para extrair produtos do HTML
   - Salva em `prospect_extracted_products`

2. **Processo:**
   - Coleta HTML da homepage
   - Envia para OpenAI com prompt de extração
   - Parseia JSON retornado
   - Insere em `prospect_extracted_products`

**Status:** ✅ **FUNCIONANDO** - Produtos são extraídos e salvos

---

### 4.3 POR QUE SCORE SEMPRE RETORNA 0

**DIAGNÓSTICO COMPLETO:**

#### **Cenário 1: Tenant Não Tem Produtos**
- **Causa:** `tenant_products` está vazio (tenant não fez onboarding)
- **Verificação:**
  ```typescript
  // scan-prospect-website/index.ts linha 111
  const { data: tenantProducts } = await supabase
    .from('tenant_products')
    .select('nome, categoria, descricao')
    .eq('tenant_id', tenant_id);
  ```
- **Resultado:** `tenantProductsList.length === 0` → Matching não executa → Score = 0

#### **Cenário 2: IA Não Encontra Matches**
- **Causa:** Análise contextual da OpenAI não encontra compatibilidade
- **Verificação:**
  ```typescript
  // scan-prospect-website/index.ts linha 473-592
  if (extractedProducts.length > 0 && tenantProductsList.length > 0 && openaiKey) {
    // Chama OpenAI para análise contextual
    // Se OpenAI retorna matches vazios → compatibleProducts = []
  }
  ```
- **Resultado:** `compatibleProducts.length === 0` → Score = 0

#### **Cenário 3: Fallback Simples Falha**
- **Causa:** Comparação por categoria/palavras-chave não encontra matches
- **Verificação:**
  ```typescript
  // scan-prospect-website/index.ts linha 595-637
  // Fallback: comparação simples
  // Se não encontra matches → compatibleProducts = []
  ```
- **Resultado:** `compatibleProducts.length === 0` → Score = 0

#### **Cenário 4: Produtos Não Foram Extraídos**
- **Causa:** Website não tem produtos ou extração falhou
- **Verificação:**
  ```typescript
  // scan-prospect-website/index.ts linha 217-226
  if (pagesContent.length === 0) {
    return { success: false, error: 'Nenhum conteúdo encontrado' };
  }
  ```
- **Resultado:** `extractedProducts.length === 0` → Matching não executa → Score = 0

#### **Cenário 5: Tenant Products Não Está Sendo Lido**
- **Causa:** Query falha ou RLS bloqueia
- **Verificação Necessária:** Adicionar logs para confirmar se `tenantProductsList` está populado

---

### 4.4 IDENTIFICAÇÃO DA PARTE QUEBRADA

**PARTE QUEBRADA IDENTIFICADA:**

1. **Falta de Validação Prévia:**
   - ❌ Sistema não verifica se `tenant_products` tem dados antes de calcular matching
   - ❌ Sistema não verifica se `prospect_extracted_products` tem dados antes de calcular matching

2. **Falta de Logs:**
   - ❌ Não há logs claros mostrando:
     - Quantos produtos do tenant foram encontrados
     - Quantos produtos do prospect foram extraídos
     - Por que matching retornou 0

3. **Falta de Fallback Visual:**
   - ❌ Se matching = 0, não mostra ao usuário o motivo (tenant sem produtos? prospect sem produtos? IA falhou?)

---

## 👥 MISSÃO 5 — DECISORES (CRÍTICO)

### 5.1 QUAL TABELA DEVERIA CONTER DECISORES

**RESPOSTA:** ✅ **`decision_makers`**

**Estrutura:**
- `company_id` (FK para companies)
- `apollo_person_id` (UNIQUE)
- 42+ campos de dados pessoais e profissionais

---

### 5.2 POR QUE ESTÁ VAZIA

**DIAGNÓSTICO:**

#### **Cenário 1: Apollo Não Está Sendo Chamado**
- **Verificação:** Edge Function `enrich-apollo-decisores` pode não estar sendo invocada
- **Status:** ⚠️ **VERIFICAR** - Logs mostram que é chamado, mas pode falhar silenciosamente

#### **Cenário 2: Apollo Retorna Dados Mas Não São Salvos**
- **Verificação:**
  ```typescript
  // enrich-apollo-decisores/index.ts linha 732-801
  // Upsert em decision_makers
  // Se erro, pode não salvar mas não falhar a requisição
  ```
- **Status:** ⚠️ **POSSÍVEL** - Erros podem ser ignorados

#### **Cenário 3: company_id Não Existe**
- **Verificação:**
  ```typescript
  // enrich-apollo-decisores/index.ts linha 884-938
  // Atualiza icp_analysis_results apenas se companyRecord.cnpj existir
  // Mas decisores são salvos em decision_makers que requer company_id
  ```
- **Status:** 🔴 **PROVÁVEL** - Se `company_id` não existe, decisores não são salvos

#### **Cenário 4: RLS Bloqueia Inserção**
- **Verificação:** Tabela `decision_makers` tem RLS habilitado
- **Status:** ⚠️ **POSSÍVEL** - Service role key deve estar sendo usada

---

### 5.3 BOTÃO "EXTRAIR DECISORES" CHAMA O QUÊ

**RESPOSTA:**

1. **Menu Individual (Engrenagem):**
   - ❌ **NÃO EXISTE** botão "Extrair Decisores" no menu individual
   - Disponível apenas via `UnifiedEnrichButton` quando 1 empresa selecionada

2. **Ações em Massa:**
   - ✅ **EXISTE:** "Apollo" no dropdown `QuarantineActionsMenu`
   - Chama: `handleBulkEnrichApollo()` → `enrichApolloMutation.mutateAsync()`
   - Que chama: `supabase.functions.invoke('enrich-apollo-decisores')`

3. **UnifiedEnrichButton:**
   - ✅ **EXISTE:** Botão unificado quando 1 empresa selecionada
   - Chama: `handleEnrichApollo()` → `enrichApolloMutation.mutateAsync()`

---

### 5.4 FALLBACK EXISTE?

**RESPOSTA:** ❌ **NÃO HÁ FALLBACK AUTOMÁTICO**

**Ordem de Execução Atual:**
1. Apollo (única fonte automática)
2. Lusha (apenas manual, botão "Revelar Contato")
3. LinkedIn (não extrai decisores, apenas URL da empresa)

**Falta:**
- ❌ Fallback automático: Apollo → Lusha → LinkedIn scraping
- ❌ Verificação se decisores já existem antes de chamar Apollo

---

### 5.5 CLASSIFICAÇÃO EXISTE?

**RESPOSTA:** ✅ **SIM, MAS PODE NÃO ESTAR FUNCIONANDO**

**Classificação Implementada:**

1. **No Código:**
   ```typescript
   // enrich-apollo-decisores/index.ts linha 28-90
   function classifyBuyingPower(title: string): 'decision-maker' | 'influencer' | 'user'
   ```

2. **Campos Salvos:**
   - `is_decision_maker` (BOOLEAN) - sempre `true` ⚠️
   - `seniority` (TEXT) - 'C-Level', 'VP', 'Director', etc.
   - **NÃO há campo `classification` ou `buying_power` sendo salvo corretamente**

**PROBLEMA:** Classificação é calculada mas pode não estar sendo persistida corretamente

---

## 📋 MISSÃO 6 — RELATÓRIO & ABAS

### 6.1 O QUE DEFINE QUE UMA ABA ESTÁ "LIBERADA"

**RESPOSTA:** ⚠️ **BASEADO EM STATUS, MAS PODE ESTAR QUEBRADO**

**Sistema de Status:**

1. **Hook:** `useReportAutosave`
   - **Arquivo:** `src/components/icp/tabs/useReportAutosave.ts`
   - **Status:** `'draft' | 'processing' | 'completed' | 'error'`
   - **Armazenado em:** `stc_verification_history.full_report.__status[tabKey].status`

2. **Lógica de Liberação:**
   ```typescript
   const getStatus = (): 'draft' | 'processing' | 'completed' | 'error' =>
     fullReport?.__status?.[tabKey]?.status ?? 'draft';
   ```

**PROBLEMA IDENTIFICADO:**
- Abas podem estar "liberadas" (status='completed') mesmo sem dados reais
- Status é setado como 'completed' mesmo se API falhou silenciosamente

---

### 6.2 POR QUE ABAS LIBERAM SEM DADOS

**CAUSAS IDENTIFICADAS:**

1. **Status Setado Antes de Validar Dados:**
   - Status pode ser setado como 'completed' mesmo se `data` está vazio
   - Não há validação: `if (data && Object.keys(data).length > 0)`

2. **Cache de Dados Vazios:**
   - `full_report[tabKey] = { data: {}, cache_key: null }`
   - Status pode ser 'completed' com `data: {}`

3. **Falhas Silenciosas:**
   - Se API falha, status pode não ser setado como 'error'
   - Aba fica como 'draft' ou 'completed' sem dados

---

### 6.3 RELATÓRIO TEM PERSISTÊNCIA REAL?

**RESPOSTA:** ✅ **SIM, MAS PARCIAL**

**Persistência:**

1. **Tabela:** `stc_verification_history`
2. **Campo:** `full_report` (JSONB)
3. **Estrutura:**
   ```json
   {
     "totvs": { "data": {...}, "cache_key": "..." },
     "decisores": { "data": {...}, "cache_key": "..." },
     "keywords": { "data": {...}, "cache_key": "..." },
     "__status": {
       "totvs": { "status": "completed" },
       "decisores": { "status": "completed" }
     }
   }
   ```

**PROBLEMA:**
- ✅ Dados são persistidos
- ❌ Mas podem estar vazios (`data: {}`)
- ❌ Status pode estar 'completed' sem dados reais

---

## 💰 MISSÃO 7 — CUSTO & REDUNDÂNCIA

### 7.1 ONDE CHAMADAS EXTERNAS SÃO REPETIDAS

1. **Apollo (CRÍTICO):**
   - ❌ **SEMPRE** chama API mesmo se `apollo_organization_id` já existe
   - ❌ **SEMPRE** busca decisores mesmo se `decision_makers` já tem dados
   - **Custo:** ~3-5 créditos Apollo por chamada
   - **Frequência:** Cada vez que usuário clica "Enriquecer Apollo"

2. **Website Scraping:**
   - ❌ **SEMPRE** extrai produtos mesmo se `prospect_extracted_products` já tem dados
   - **Custo:** ~$0.01-0.02 por extração (OpenAI)
   - **Frequência:** Cada vez que usuário clica "Enriquecer Website"

3. **LinkedIn (SERPER):**
   - ❌ **SEMPRE** busca via SERPER mesmo se `linkedin_url` já existe
   - **Custo:** ~$0.001 por busca
   - **Frequência:** Cada vez que `scan-prospect-website` é chamado

4. **Receita Federal:**
   - ⚠️ **PARCIALMENTE:** `batch-enrich-receitaws` verifica se dados já existem
   - ❌ Mas `ApprovedLeads` não verifica antes de chamar

---

### 7.2 ONDE NÃO HÁ CACHE NEM PERSISTÊNCIA

1. **Apollo Organization ID:**
   - ❌ Não há cache de buscas por nome → sempre busca na API

2. **LinkedIn URL:**
   - ❌ Não há cache de buscas SERPER → sempre busca na API

3. **Produtos Extraídos:**
   - ⚠️ Há persistência (`prospect_extracted_products`), mas não há verificação antes de extrair

---

### 7.3 ONDE CRÉDITOS ESTÃO SENDO QUEIMADOS SEM RETORNO

1. **Apollo - Decisores Já Extraídos:**
   - **Custo:** 3-5 créditos
   - **Frequência:** Cada clique em "Enriquecer Apollo"
   - **Retorno:** Zero se decisores já existem

2. **Apollo - Organization ID Já Existe:**
   - **Custo:** 1 crédito (busca organization)
   - **Frequência:** Cada chamada Apollo
   - **Retorno:** Zero se `apollo_organization_id` já existe

3. **OpenAI - Produtos Já Extraídos:**
   - **Custo:** ~$0.01-0.02
   - **Frequência:** Cada chamada `scan-prospect-website`
   - **Retorno:** Zero se produtos já foram extraídos

---

## 📊 DIAGRAMA TEXTUAL DO FLUXO ATUAL (REAL)

```
┌─────────────────────────────────────────────────────────────┐
│                    LEADS APROVADOS                          │
│              (icp_analysis_results WHERE status='aprovada') │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Usuário clica "Enriquecer Apollo"
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: ApprovedLeads.tsx                               │
│  → enrichApolloMutation.mutateAsync(analysisId)            │
│  → Busca company_id (pode não existir!)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ supabase.functions.invoke('enrich-apollo-decisores')
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Edge Function: enrich-apollo-decisores/index.ts            │
│  → SEMPRE chama Apollo API (não verifica cache)            │
│  → Busca Organization ID (não verifica se já existe)       │
│  → Busca Decisores (não verifica se já existem)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Apollo API retorna dados
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Persistência:                                              │
│  1. companies (PRIMÁRIA) ✅                                 │
│     → UPDATE companies SET linkedin_url, apollo_id, ...     │
│     → INSERT INTO decision_makers ✅                         │
│                                                              │
│  2. icp_analysis_results (SECUNDÁRIA) ⚠️                    │
│     → UPDATE icp_analysis_results WHERE cnpj = ? ⚠️        │
│     → PROBLEMA: Busca por CNPJ, não por ID!                 │
│     → PROBLEMA: Se company_id não existe, não atualiza!      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Frontend recarrega dados
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  useApprovedCompanies Hook                                  │
│  → SELECT * FROM icp_analysis_results WHERE status='aprovada'│
│  → Lê linkedin_url, decision_makers_count                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Dados podem não aparecer se:
                            │ - company_id não existia
                            │ - UPDATE por CNPJ atualizou registro errado
                            │ - Cache não foi invalidado
                            ▼
                    [DADOS NÃO APARECEM NA TABELA]
```

---

## ❌ LISTA OBJETIVA DO QUE ESTÁ QUEBRADO

### 🔴 CRÍTICO (Bloqueia Funcionalidade)

1. **Apollo não atualiza `icp_analysis_results` corretamente**
   - Busca por `cnpj` em vez de `id`
   - Se `company_id` não existe, dados não são salvos em `icp_analysis_results`
   - Tabela lê de `icp_analysis_results`, então dados não aparecem

2. **Matching de produtos sempre retorna 0**
   - Não há validação se `tenant_products` tem dados
   - Não há validação se `prospect_extracted_products` tem dados
   - Não há logs claros do motivo do score = 0

3. **Decisores não aparecem na tabela**
   - Decisores são salvos em `decision_makers`
   - Mas `icp_analysis_results.decision_makers_count` pode não ser atualizado
   - Tabela não mostra coluna dedicada para decisores

4. **Falta de reaproveitamento de dados**
   - Apollo sempre chama API mesmo se dados já existem
   - Website sempre extrai produtos mesmo se já foram extraídos
   - LinkedIn sempre busca mesmo se URL já existe

---

### 🟡 IMPORTANTE (Causa Custo Desnecessário)

5. **Redundância de chamadas Apollo**
   - Não verifica `apollo_organization_id` antes de buscar
   - Não verifica `decision_makers` antes de extrair
   - **Custo:** 3-5 créditos Apollo por chamada desnecessária

6. **Redundância de extração de produtos**
   - Não verifica `prospect_extracted_products` antes de extrair
   - **Custo:** ~$0.01-0.02 por extração desnecessária

7. **Redundância de busca LinkedIn**
   - Não verifica `linkedin_url` antes de buscar via SERPER
   - **Custo:** ~$0.001 por busca desnecessária

---

### 🟢 DESEJÁVEL (Melhora UX)

8. **Inconsistência entre ações em massa e individuais**
   - Apollo não está no menu individual
   - Receita não está no menu individual

9. **Falta de fallback automático**
   - Apollo → Lusha → LinkedIn (manual apenas)

10. **Abas liberam sem dados**
    - Status 'completed' mesmo com `data: {}`
    - Não há validação de dados antes de setar status

---

## 🧱 PONTOS ONDE A ARQUITETURA FOI PERDIDA

### 1. **Falta de Fonte da Verdade Única**

**Problema:**
- Dados de empresa em 3 tabelas: `companies`, `icp_analysis_results`, `qualified_prospects`
- Sem sincronismo garantido entre tabelas
- Mesma empresa pode ter dados diferentes em cada tabela

**Solução Necessária:**
- Definir `companies` como fonte da verdade
- `icp_analysis_results` e `qualified_prospects` devem referenciar `companies` via `company_id`
- Sincronização automática via triggers

---

### 2. **Falta de Cache/Reaproveitamento**

**Problema:**
- Sistema sempre chama APIs externas, mesmo se dados já existem
- Não há verificação prévia de dados existentes
- Não há cache de buscas (ex: Organization ID por nome)

**Solução Necessária:**
- Verificar dados existentes antes de chamar APIs
- Implementar cache de buscas (ex: `apollo_organization_cache`)
- Reutilizar dados já enriquecidos

---

### 3. **Falta de Sincronismo Entre Fontes**

**Problema:**
- LinkedIn em 6 lugares diferentes
- Apollo em 4 lugares diferentes
- Sem sincronismo automático

**Solução Necessária:**
- Trigger de sincronização: quando `companies.linkedin_url` muda, atualizar `icp_analysis_results.linkedin_url`
- Função de sincronização centralizada

---

### 4. **Falta de Validação de Dados**

**Problema:**
- Status 'completed' mesmo com dados vazios
- Matching retorna 0 sem logs claros do motivo
- Decisores não aparecem sem indicação do motivo

**Solução Necessária:**
- Validação antes de setar status
- Logs detalhados de cada etapa
- Mensagens claras ao usuário sobre o motivo de falhas

---

## 🔁 ONDE DEVERIA HAVER SINCRONISMO E NÃO HÁ

1. **LinkedIn URL:**
   - `companies.linkedin_url` ≠ `icp_analysis_results.linkedin_url` ≠ `qualified_prospects.linkedin_url`
   - **Deveria:** Sincronização automática via trigger

2. **Apollo Organization ID:**
   - `companies.apollo_organization_id` não sincroniza com `icp_analysis_results.apollo_id`
   - **Deveria:** Sincronização automática

3. **Decisores:**
   - `decision_makers` não sincroniza `decision_makers_count` em `icp_analysis_results`
   - **Deveria:** Trigger que conta decisores e atualiza `decision_makers_count`

4. **Website:**
   - `companies.website` ≠ `icp_analysis_results.website_encontrado` ≠ `qualified_prospects.website_encontrado`
   - **Deveria:** Sincronização automática

---

## 🎯 LISTA CLARA DO QUE PRECISA SER RECONSTRUÍDO

### 1. **Motor de Sincronismo Canônico**

**Requisitos:**
- `companies` como fonte da verdade
- Triggers de sincronização: `companies` → `icp_analysis_results`, `qualified_prospects`
- Função centralizada de sincronização

---

### 2. **Sistema de Cache/Reaproveitamento**

**Requisitos:**
- Verificar dados existentes antes de chamar APIs
- Cache de buscas (Organization ID, LinkedIn URL)
- Reutilizar dados já enriquecidos

---

### 3. **Motor de Matching Profissional**

**Requisitos:**
- Validação prévia: tenant tem produtos? prospect tem produtos?
- Logs detalhados de cada etapa
- Fallback visual quando matching = 0 (mostrar motivo)

---

### 4. **Extração Assertiva de Decisores**

**Requisitos:**
- Verificar se decisores já existem antes de chamar Apollo
- Fallback automático: Apollo → Lusha → LinkedIn scraping
- Garantir que `decision_makers_count` seja atualizado corretamente

---

### 5. **Redução de Custo e Chamadas**

**Requisitos:**
- Verificar `apollo_organization_id` antes de buscar
- Verificar `linkedin_url` antes de buscar
- Verificar `prospect_extracted_products` antes de extrair
- Verificar `decision_makers` antes de extrair

---

## 🛑 CONCLUSÃO

### ✅ O Que Está Funcionando

- Estrutura de tabelas existe
- Edge Functions estão implementadas
- Frontend tem UI rica
- Dados são persistidos (mas podem não aparecer)

### 🔴 O Que Está Quebrado

1. **Apollo não atualiza `icp_analysis_results` corretamente**
2. **Matching sempre retorna 0** (falta validação e logs)
3. **Decisores não aparecem** (falta sincronismo)
4. **Falta reaproveitamento** (sempre chama APIs)
5. **Falta sincronismo** (dados em múltiplas tabelas sem sincronização)

### 🧱 Arquitetura Perdida

1. **Falta fonte da verdade única**
2. **Falta cache/reaproveitamento**
3. **Falta sincronismo entre fontes**
4. **Falta validação de dados**

---

## 📋 PLANO DE AÇÃO PRIORIZADO

### 🔴 FASE 1: CORREÇÕES CRÍTICAS (Bloqueiam Funcionalidade)
**Prazo:** 1-2 semanas  
**Impacto:** Alto - Desbloqueia funcionalidades principais

#### 1.1 Corrigir Atualização de `icp_analysis_results` no Apollo
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 4-6 horas  
**Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`

**Ações:**
- [ ] Mudar busca de `WHERE cnpj = ?` para `WHERE id = analysisId`
- [ ] Garantir que `company_id` seja criado/vinculado antes de atualizar `icp_analysis_results`
- [ ] Adicionar validação: se `company_id` não existe, criar registro em `companies` primeiro
- [ ] Testar com leads aprovados que não têm `company_id`

**Código a Modificar:**
```typescript
// Linha ~884-938: Trocar lógica de UPDATE
// ANTES:
UPDATE icp_analysis_results SET ... WHERE cnpj = companyRecord.cnpj

// DEPOIS:
UPDATE icp_analysis_results SET ... WHERE id = analysisId
```

---

#### 1.2 Corrigir Matching de Produtos (Validação + Logs)
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 6-8 horas  
**Arquivo:** `supabase/functions/scan-prospect-website/index.ts`

**Ações:**
- [ ] Adicionar validação prévia: verificar se `tenant_products` tem dados
- [ ] Adicionar validação prévia: verificar se `prospect_extracted_products` já tem dados
- [ ] Adicionar logs detalhados em cada etapa:
  - Quantos produtos do tenant foram encontrados
  - Quantos produtos do prospect foram extraídos
  - Por que matching retornou 0 (tenant sem produtos? prospect sem produtos? IA falhou?)
- [ ] Adicionar fallback visual no frontend: mostrar motivo quando score = 0

**Código a Adicionar:**
```typescript
// Antes de calcular matching:
if (!tenantProductsList || tenantProductsList.length === 0) {
  console.warn('[MATCHING] Tenant não tem produtos cadastrados');
  return { score: 0, reason: 'tenant_no_products' };
}

if (!extractedProducts || extractedProducts.length === 0) {
  console.warn('[MATCHING] Nenhum produto extraído do prospect');
  return { score: 0, reason: 'prospect_no_products' };
}
```

---

#### 1.3 Garantir Sincronismo de `decision_makers_count`
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 4-6 horas  
**Arquivos:** 
- `supabase/functions/enrich-apollo-decisores/index.ts`
- `supabase/migrations/` (criar trigger)

**Ações:**
- [ ] Criar trigger que atualiza `icp_analysis_results.decision_makers_count` quando `decision_makers` muda
- [ ] Garantir que Edge Function atualize `decision_makers_count` após inserir decisores
- [ ] Adicionar validação: se `decision_makers_count` não foi atualizado, logar erro

**Trigger a Criar:**
```sql
CREATE OR REPLACE FUNCTION update_decision_makers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE icp_analysis_results
  SET decision_makers_count = (
    SELECT COUNT(*) FROM decision_makers WHERE company_id = NEW.company_id
  )
  WHERE company_id = NEW.company_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_decision_makers_count
AFTER INSERT OR UPDATE OR DELETE ON decision_makers
FOR EACH ROW EXECUTE FUNCTION update_decision_makers_count();
```

---

### 🟡 FASE 2: REDUÇÃO DE CUSTO (Economia Imediata)
**Prazo:** 1 semana  
**Impacto:** Médio - Reduz custos operacionais significativamente

#### 2.1 Implementar Reaproveitamento de Apollo
**Prioridade:** 🟡 ALTA  
**Esforço:** 6-8 horas  
**Arquivo:** `supabase/functions/enrich-apollo-decisores/index.ts`

**Ações:**
- [ ] Verificar se `companies.apollo_organization_id` já existe antes de buscar
- [ ] Se existe, usar `apollo_organization_id` diretamente (não buscar por nome)
- [ ] Verificar se `decision_makers` já tem registros para `company_id` antes de buscar
- [ ] Se já existem decisores, retornar dados existentes (não chamar API)

**Código a Adicionar:**
```typescript
// Antes de chamar Apollo:
const existingCompany = await supabase
  .from('companies')
  .select('apollo_organization_id')
  .eq('id', company_id)
  .single();

if (existingCompany.data?.apollo_organization_id) {
  // Usar organization ID existente
  organizationId = existingCompany.data.apollo_organization_id;
} else {
  // Buscar por nome (lógica atual)
}

// Verificar decisores existentes:
const existingDecisores = await supabase
  .from('decision_makers')
  .select('id')
  .eq('company_id', company_id);

if (existingDecisores.data && existingDecisores.data.length > 0) {
  // Retornar decisores existentes (não chamar API)
  return { success: true, decisores: existingDecisores.data };
}
```

**Economia Estimada:** 3-5 créditos Apollo por chamada evitada

---

#### 2.2 Implementar Reaproveitamento de Website Scraping
**Prioridade:** 🟡 ALTA  
**Esforço:** 4-6 horas  
**Arquivo:** `supabase/functions/scan-prospect-website/index.ts`

**Ações:**
- [ ] Verificar se `prospect_extracted_products` já tem dados para `qualified_prospect_id`
- [ ] Se já existem produtos extraídos, retornar dados existentes (não chamar IA)
- [ ] Adicionar flag `force_re_extract` para permitir re-extração quando necessário

**Economia Estimada:** $0.01-0.02 por extração evitada

---

#### 2.3 Implementar Reaproveitamento de LinkedIn
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 3-4 horas  
**Arquivo:** `supabase/functions/scan-prospect-website/index.ts`

**Ações:**
- [ ] Verificar se `companies.linkedin_url` ou `icp_analysis_results.linkedin_url` já existe
- [ ] Se existe, usar URL existente (não buscar via SERPER)
- [ ] Sincronizar `linkedin_url` entre tabelas

**Economia Estimada:** $0.001 por busca SERPER evitada

---

### 🟢 FASE 3: ARQUITETURA CANÔNICA (Fundação Sólida)
**Prazo:** 2-3 semanas  
**Impacto:** Alto - Previne problemas futuros

#### 3.1 Criar Fonte da Verdade Única (`companies`)
**Prioridade:** 🟢 ALTA  
**Esforço:** 8-12 horas  
**Arquivos:** 
- `supabase/migrations/` (criar triggers)
- Edge Functions (ajustar lógica)

**Ações:**
- [ ] Definir `companies` como fonte da verdade
- [ ] Criar triggers de sincronização: `companies` → `icp_analysis_results`
- [ ] Criar triggers de sincronização: `companies` → `qualified_prospects`
- [ ] Ajustar Edge Functions para sempre atualizar `companies` primeiro
- [ ] Migrar dados existentes: garantir que todos os leads aprovados tenham `company_id`

**Triggers a Criar:**
```sql
-- Sincronizar LinkedIn URL
CREATE OR REPLACE FUNCTION sync_linkedin_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.linkedin_url IS NOT NULL THEN
    UPDATE icp_analysis_results
    SET linkedin_url = NEW.linkedin_url
    WHERE company_id = NEW.id;
    
    UPDATE qualified_prospects
    SET linkedin_url = NEW.linkedin_url
    WHERE company_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_linkedin_url
AFTER UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION sync_linkedin_url();
```

---

#### 3.2 Implementar Sistema de Cache
**Prioridade:** 🟢 MÉDIA  
**Esforço:** 6-8 horas  
**Arquivos:** 
- `supabase/migrations/` (criar tabela de cache)
- Edge Functions (usar cache)

**Ações:**
- [ ] Criar tabela `enrichment_cache`:
  - `cache_key` (TEXT, UNIQUE) - ex: "apollo_org_12345"
  - `cache_data` (JSONB) - dados em cache
  - `expires_at` (TIMESTAMP) - expiração do cache
- [ ] Implementar lógica de cache nas Edge Functions
- [ ] Adicionar TTL: cache expira em 30 dias

**Tabela a Criar:**
```sql
CREATE TABLE enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enrichment_cache_key ON enrichment_cache(cache_key);
CREATE INDEX idx_enrichment_cache_expires ON enrichment_cache(expires_at);
```

---

#### 3.3 Implementar Validação de Dados
**Prioridade:** 🟢 MÉDIA  
**Esforço:** 4-6 horas  
**Arquivos:** 
- `src/components/icp/tabs/useReportAutosave.ts`
- Edge Functions (validação antes de setar status)

**Ações:**
- [ ] Validar dados antes de setar status 'completed'
- [ ] Se `data` está vazio, setar status 'error' ou 'draft'
- [ ] Adicionar logs quando validação falha
- [ ] Mostrar mensagem ao usuário quando dados não estão disponíveis

---

### 🔵 FASE 4: MELHORIAS DE UX (Opcional)
**Prazo:** 1 semana  
**Impacto:** Baixo - Melhora experiência do usuário

#### 4.1 Adicionar Botões de Enriquecimento no Menu Individual
**Prioridade:** 🔵 BAIXA  
**Esforço:** 2-3 horas  
**Arquivo:** `src/components/icp/ApprovedLeads.tsx`

**Ações:**
- [ ] Adicionar "Apollo" no menu individual (engrenagem)
- [ ] Adicionar "Receita Federal" no menu individual
- [ ] Adicionar "Website" no menu individual

---

#### 4.2 Implementar Fallback Automático de Decisores
**Prioridade:** 🔵 BAIXA  
**Esforço:** 8-10 horas  
**Arquivos:** 
- `supabase/functions/enrich-decisores-fallback/index.ts` (nova função)

**Ações:**
- [ ] Criar Edge Function que tenta: Apollo → Lusha → LinkedIn scraping
- [ ] Chamar automaticamente quando Apollo não retorna decisores
- [ ] Consolidar dados de múltiplas fontes

---

## 📊 ESTIMATIVA DE ESFORÇO TOTAL

| Fase | Esforço | Prazo | Impacto |
|------|---------|-------|---------|
| Fase 1: Correções Críticas | 14-20 horas | 1-2 semanas | 🔴 Alto |
| Fase 2: Redução de Custo | 13-18 horas | 1 semana | 🟡 Médio |
| Fase 3: Arquitetura Canônica | 18-26 horas | 2-3 semanas | 🟢 Alto |
| Fase 4: Melhorias de UX | 10-13 horas | 1 semana | 🔵 Baixo |
| **TOTAL** | **55-77 horas** | **5-7 semanas** | - |

---

## 🎯 ROADMAP DE IMPLEMENTAÇÃO RECOMENDADO

### Semana 1-2: Fase 1 (Correções Críticas)
**Objetivo:** Desbloquear funcionalidades principais

1. **Dia 1-2:** Corrigir atualização de `icp_analysis_results` no Apollo
2. **Dia 3-5:** Corrigir matching de produtos (validação + logs)
3. **Dia 6-7:** Garantir sincronismo de `decision_makers_count`
4. **Dia 8-10:** Testes e validação das correções

**Resultado Esperado:**
- ✅ Apollo atualiza `icp_analysis_results` corretamente
- ✅ Matching de produtos funciona e mostra logs claros
- ✅ Decisores aparecem na tabela com contagem correta

---

### Semana 3: Fase 2 (Redução de Custo)
**Objetivo:** Reduzir custos operacionais

1. **Dia 1-3:** Implementar reaproveitamento de Apollo
2. **Dia 4-5:** Implementar reaproveitamento de Website Scraping
3. **Dia 6-7:** Implementar reaproveitamento de LinkedIn

**Resultado Esperado:**
- ✅ 50-70% de redução em chamadas Apollo desnecessárias
- ✅ 50-70% de redução em extrações de produtos desnecessárias
- ✅ 50-70% de redução em buscas LinkedIn desnecessárias

---

### Semana 4-6: Fase 3 (Arquitetura Canônica)
**Objetivo:** Criar fundação sólida

1. **Semana 4:** Criar fonte da verdade única (`companies`)
2. **Semana 5:** Implementar sistema de cache
3. **Semana 6:** Implementar validação de dados

**Resultado Esperado:**
- ✅ `companies` é fonte da verdade única
- ✅ Sincronização automática entre tabelas
- ✅ Cache reduz chamadas externas
- ✅ Validação previne dados vazios

---

### Semana 7: Fase 4 (Melhorias de UX) - Opcional
**Objetivo:** Melhorar experiência do usuário

1. **Dia 1-2:** Adicionar botões de enriquecimento no menu individual
2. **Dia 3-5:** Implementar fallback automático de decisores

**Resultado Esperado:**
- ✅ UX mais intuitiva
- ✅ Fallback automático aumenta taxa de sucesso

---

## 💰 IMPACTO FINANCEIRO ESTIMADO

### Redução de Custos (Fase 2)

**Apollo:**
- Antes: 3-5 créditos por chamada (mesmo se dados já existem)
- Depois: 0 créditos se dados já existem
- **Economia:** 50-70% das chamadas Apollo (~$50-200/mês dependendo do volume)

**OpenAI (Website Scraping):**
- Antes: $0.01-0.02 por extração (mesmo se produtos já foram extraídos)
- Depois: $0 se produtos já foram extraídos
- **Economia:** 50-70% das extrações (~$10-50/mês dependendo do volume)

**SERPER (LinkedIn):**
- Antes: $0.001 por busca (mesmo se LinkedIn já existe)
- Depois: $0 se LinkedIn já existe
- **Economia:** 50-70% das buscas (~$5-20/mês dependendo do volume)

**Total Estimado:** $65-270/mês de economia

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Após Fase 1 (Correções Críticas)
- [ ] Apollo atualiza `icp_analysis_results` corretamente (testar com leads sem `company_id`)
- [ ] Matching de produtos retorna score > 0 quando há produtos compatíveis
- [ ] Logs mostram motivo quando matching = 0
- [ ] `decision_makers_count` é atualizado automaticamente quando decisores são inseridos
- [ ] Decisores aparecem na tabela `ApprovedLeads`

### Após Fase 2 (Redução de Custo)
- [ ] Apollo não chama API se `apollo_organization_id` já existe
- [ ] Apollo não chama API se `decision_makers` já tem dados
- [ ] Website scraping não extrai produtos se `prospect_extracted_products` já tem dados
- [ ] LinkedIn não busca via SERPER se `linkedin_url` já existe
- [ ] Métricas mostram redução de 50%+ em chamadas externas

### Após Fase 3 (Arquitetura Canônica)
- [ ] `companies` é atualizado primeiro em todas as Edge Functions
- [ ] Triggers sincronizam `icp_analysis_results` e `qualified_prospects` automaticamente
- [ ] Cache reduz chamadas externas em 30%+
- [ ] Status 'completed' só é setado quando dados realmente existem
- [ ] Validação previne dados vazios em relatórios

---

## 📝 NOTAS FINAIS

### Priorização Recomendada
1. **URGENTE:** Fase 1 (Correções Críticas) - Bloqueia funcionalidades
2. **IMPORTANTE:** Fase 2 (Redução de Custo) - Economia imediata
3. **DESEJÁVEL:** Fase 3 (Arquitetura Canônica) - Previne problemas futuros
4. **OPCIONAL:** Fase 4 (Melhorias de UX) - Nice to have

### Riscos Identificados
- **Migração de dados:** Pode haver leads aprovados sem `company_id` - precisa migração
- **RLS (Row Level Security):** Verificar se triggers e Edge Functions têm permissões corretas
- **Performance:** Triggers podem impactar performance se houver muitos updates - monitorar

### Próximos Passos Imediatos
1. Revisar este plano com o time
2. Priorizar Fase 1 (começar hoje)
3. Criar issues no projeto para cada item
4. Começar implementação da Fase 1.1 (corrigir Apollo)

---

**Auditoria concluída. Plano de ação detalhado criado. Pronto para implementação.**
