# AUDITORIA: Integração Data Enrich → Dossiê Estratégico

**Data:** 2026-01-28  
**Escopo:** Verificação de leitura/mapeamento dos dados do Data Enrich (Lovable) no Dossiê Estratégico do STRATEVO.

---

## 1️⃣ Busca de Dados da Empresa

### Onde os dados da empresa são buscados no Dossiê?

No Dossiê Estratégico, os dados da **empresa** vêm da tabela **`companies`** do STRATEVO (Supabase), **não** da API Data Enrich (`get-company`).

**Código atual (DecisorsContactsTab + TOTVSCheckCard):**

- **DecisorsContactsTab** (`loadDecisorsData`):  
  - `supabase.from('companies').select('*').eq('id', companyId).single()`  
  - Usa `company.name`, `company.industry`, `raw_data` (apollo_organization, receita_federal, etc.).  
- **Nenhum componente do Dossiê** chama `getCompany(companyId)` da API Data Enrich para preencher a ficha da empresa.

**Chamada `get-company` existente:**

- **DataEnrichModal** (`src/components/dataEnrich/DataEnrichModal.tsx`): após `enrich-single` + polling, chama `getCompany(companyId)` e guarda em `setCompanyData(companyResult.company)` (estado local `Record<string, unknown> | null`).  
- Esse `companyData` **não é exibido** em nenhuma seção do modal (só título da empresa e domínio vêm do prop `company`).  
- **Não há** persistência dos campos de `get-company` na tabela `companies` do STRATEVO.

### Tabela: `companies` (Data Enrich) – checklist de campos

A API Data Enrich (Lovable) pode retornar, via `get-company`, um objeto `company` com vários campos. No STRATEVO **nenhum** desses campos é lido/mapeado para o Dossiê, pois o Dossiê não usa a resposta de `get-company`.

| Campo | Está sendo lido? | Observação |
|-------|------------------|------------|
| id | ☐ | Não mapeado no STRATEVO |
| name | ☐ | Não mapeado (Dossiê usa `companies` do STRATEVO) |
| trade_name | ☐ | Não mapeado |
| cnpj | ☐ | Não mapeado |
| domain | ☐ | Não mapeado |
| industry | ☐ | Não mapeado |
| description | ☐ | Não mapeado |
| employee_count | ☐ | Não mapeado |
| founding_year | ☐ | Não mapeado |
| logo_url | ☐ | Não mapeado |
| linkedin_url | ☐ | Não mapeado |
| website_score | ☐ | Não mapeado |
| trading_symbol | ☐ | Não mapeado |
| keywords | ☐ | Não mapeado |
| sic_codes | ☐ | Não mapeado |
| naics_codes | ☐ | Não mapeado |
| street, neighborhood, city, state, country, zip_code | ☐ | Não mapeados |
| enrichment_status | ☐ | Não mapeado |
| enrichment_sources | ☐ | Não mapeado |
| last_enriched_at | ☐ | Não mapeado |
| apollo_raw_data, linkedin_raw_data, lusha_raw_data | ☐ | Não mapeados |

**Resposta Pergunta 1:** A função que **poderia** buscar dados da empresa do Data Enrich é `getCompany(companyId)` em `dataEnrichApi.ts` (action `get-company`). Hoje ela é usada **apenas** no `DataEnrichModal`, que **não** seleciona nem exibe esses campos no Dossiê; o Dossiê usa somente a tabela `companies` do STRATEVO. Não existe função no Dossiê que leia e mapeie os campos da empresa vindos do Data Enrich.

---

## 2️⃣ Busca de Contatos/Decisores

### Onde os contatos são buscados no Dossiê?

- **Aba Decisores do Dossiê:** lê da tabela **`decision_makers`** do STRATEVO (`DecisorsContactsTab.loadDecisorsData()`):  
  `supabase.from('decision_makers').select('*').eq('company_id', companyId)`.
- Os contatos que **entram** em `decision_makers` vêm de:
  1. **DataEnrichModal:** após `getContacts(companyId)`, chama `persistDataEnrichContactsToDecisionMakers(company.id, list)` → insere em `decision_makers`.
  2. **EnrichmentOrchestrator** (botão "Extrair Decisores" na aba): grava decisores via outro fluxo (Apollo/Edge).

A API `get-contacts` é usada **somente** no `DataEnrichModal`. A interface **DataEnrichContact** em `dataEnrichApi.ts` declara um subconjunto dos campos da auditoria.

### Tabela: `contacts` (Data Enrich) – checklist

| Campo | Está na interface? | Usado no modal? | Persistido em decision_makers? |
|-------|-------------------|-----------------|---------------------------------|
| id | ✅ (DataEnrichContact.id) | ✅ (key) | ✅ (dentro de raw_apollo_data) |
| company_id | N/A (contexto) | — | ✅ (company_id STRATEVO) |
| full_name | ✅ | ✅ | ✅ (name) |
| first_name, last_name | ✅ | ✅ (fallback name) | ✅ (via name) |
| job_title | ✅ | ✅ | ✅ (title) |
| department | ✅ | — | ✅ |
| seniority | ✅ | — | ✅ |
| email | ✅ | ✅ | ✅ |
| email_verified | ✅ | ✅ | ✅ (email_status) |
| email_verification_source | ☐ | ☐ | ☐ |
| phone | ✅ | ✅ | ✅ |
| mobile_phone | ✅ | ✅ | ✅ (phone) |
| phone_verified | ☐ | ☐ | ☐ |
| linkedin_url | ✅ | ✅ | ✅ |
| linkedin_profile_id | ☐ | ☐ | ☐ |
| city | ✅ | — | ✅ |
| country | ✅ | — | ✅ |
| location | ☐ | ☐ | ☐ |
| connection_degree | ☐ | ☐ | ☐ |
| mutual_connections | ☐ | ☐ | ☐ |
| confidence_score | ✅ | ✅ | ✅ (raw_apollo_data) |
| data_sources | ✅ | ✅ | ✅ |
| apollo_raw_data, linkedin_raw_data, lusha_raw_data | ✅ | — | ✅ (raw_apollo_data) |

**Resposta Pergunta 2:** A função que busca contatos **do Data Enrich** é `getContacts(companyId)` em `dataEnrichApi.ts` (action `get-contacts`). É usada apenas no `DataEnrichModal`. Os campos efetivamente usados/exibidos no modal e persistidos são: id, full_name, first_name, last_name, job_title, email, email_verified, phone, mobile_phone, linkedin_url, city, country, data_sources, confidence_score, apollo_raw_data, linkedin_raw_data, lusha_raw_data. Os demais (email_verification_source, phone_verified, linkedin_profile_id, location, connection_degree, mutual_connections) não estão na interface nem na persistência.

---

## 3️⃣ Tabela de Empresas Similares (Data Enrich)

No STRATEVO existe a tabela **`similar_companies`** (Supabase), usada no Dossiê (ex.: `TOTVSCheckCard`, `SimilarCompaniesTab`, `STCAgent`), com filtro por `company_id` do STRATEVO. **Não existe** no código do STRATEVO chamada à API Data Enrich (Lovable) para uma tabela `similar_companies` do Data Enrich (ex.: action `get-similar-companies`). O Dossiê exibe empresas similares a partir da tabela **STRATEVO** `similar_companies` e de relatórios salvos (ex.: `similar_companies_report`), não a partir do Data Enrich.

**Resposta Pergunta 3:** O Dossiê exibe empresas similares via tabela STRATEVO `similar_companies` e dados de relatório. Não há integração com uma tabela `similar_companies` do Data Enrich (Lovable) via API.

---

## 4️⃣ Invalidação de Cache após Enriquecimento

- **DataEnrichModal:** após `persistDataEnrichContactsToDecisionMakers` **não** chama `queryClient.invalidateQueries`. O callback `onDecisorsLoaded` é chamado com os contatos, mas o componente que usa o modal não foi encontrado no grep (DataEnrichModal não aparece como importado/rendered em outro arquivo). Se o modal for usado em algum fluxo, a aba Decisores não invalida queries após persistência.
- **DecisorsContactsTab:** após o fluxo "Extrair Decisores" (EnrichmentOrchestrator) chama `loadDecisorsData()` e `setAnalysisData(refreshedData)` — ou seja, refetch manual, não invalidação por query key.
- **TOTVSCheckCard** e outros: usam `queryClient.invalidateQueries` para `company-data`, `stc-history`, `product-fit`, `sdr_deals`, `latest-stc-report`, etc. **Nenhum** deles invalida uma query key específica de “decisores” ou “data-enrich” após enriquecimento via Data Enrich.

**Resposta Pergunta 4:** Não existe invalidação de queries após enriquecimento pelo Data Enrich. O fluxo do EnrichmentOrchestrator na aba Decisores recarrega dados manualmente com `loadDecisorsData()`. Para o DataEnrichModal, não há `invalidateQueries` e não foi encontrado uso do modal no Dossiê (apenas navegação para `/leads/data-enrich?companyId=xxx`).

---

## 5️⃣ Mapeamento de Campos no UI do Dossiê

- **Dados da empresa no Dossiê:** vêm de `companies` (STRATEVO): name, industry, raw_data (apollo, receita_federal, etc.). Nenhum campo vem do `get-company` do Data Enrich.
- **Aba Decisores:** exibe decisores de `decision_makers`: name, title, email, email_status, phone, linkedin_url, seniority, department, city, country, raw_apollo_data, etc. Esses dados podem ter sido inseridos por `persistDataEnrichContactsToDecisionMakers` (quando o modal for usado) ou pelo EnrichmentOrchestrator.
- **DataEnrichModal (se usado):** exibe na tabela: Nome (full_name + confidence_score), Cargo (job_title), Email (email + email_verified), Telefone (phone/mobile_phone), LinkedIn (linkedin_url). Não exibe department, seniority, city, country, connection_degree, mutual_connections, etc.

**Resposta Pergunta 5:** No Dossiê Estratégico, os campos exibidos vêm de `companies` e `decision_makers` (STRATEVO). Nenhuma seção do card/modal do Dossiê mapeia explicitamente os campos retornados por `get-company` ou `get-contacts` do Data Enrich para a UI; os contatos do Data Enrich só aparecem no Dossiê depois de persistidos em `decision_makers` e lidos de lá.

---

## 6️⃣ Checklist de Conexão API

- [x] Existe chamada para `api-gateway` com action `get-company`? **SIM** — `dataEnrichApi.getCompany(companyId)`.
- [x] Existe chamada para `api-gateway` com action `get-contacts`? **SIM** — `dataEnrichApi.getContacts(companyId)`.
- [x] A resposta está sendo parseada corretamente? **SIM** — `GetCompanyResponse.company`, `GetContactsResponse.contacts`; tipagem via `DataEnrichContact`.
- [x] Os dados raw (apollo_raw_data, etc.) estão disponíveis? **SIM** — em `DataEnrichContact` e em `decision_makers.raw_apollo_data` após persistência.

---

## 7️⃣ Relatório Final

### 1. Campos da empresa NÃO mapeados (get-company → Dossiê / companies)

Todos. O Dossiê não usa a resposta de `get-company`. Lista completa: id, name, trade_name, cnpj, domain, industry, description, employee_count, founding_year, logo_url, linkedin_url, website_score, trading_symbol, keywords, sic_codes, naics_codes, street, neighborhood, city, state, country, zip_code, enrichment_status, enrichment_sources, last_enriched_at, apollo_raw_data, linkedin_raw_data, lusha_raw_data.

### 2. Campos de contato NÃO mapeados (get-contacts / persistência / UI)

- **Na interface TypeScript (DataEnrichContact):** email_verification_source, phone_verified, linkedin_profile_id, location, connection_degree, mutual_connections.
- **No modal (UI):** department, seniority, city, country, connection_degree, mutual_connections (não exibidos na tabela).
- **Na persistência (mapContactToRow):** state é fixo `null`; email_verification_source, phone_verified, linkedin_profile_id, location, connection_degree, mutual_connections não são gravados.

### 3. Erros de tipagem encontrados

- `GetCompanyResponse.company` é `Record<string, unknown>` — não há interface específica para o payload `company` do Data Enrich, o que dificulta uso type-safe no Dossiê.
- Em `dataEnrichToDecisionMakers`, `rawPayload` e `toInsert` usam `as any` em inserção no Supabase.

### 4. Chamadas API faltando

- **get-company:** existe mas não é usada para alimentar o Dossiê nem a tabela `companies`; só guardada em estado no modal.
- **get-contacts:** existe e é usada no modal; não há “sync” ao abrir o Dossiê (ex.: buscar contatos do Data Enrich ao carregar a aba).
- **get-similar-companies** (ou equivalente): não existe no `dataEnrichApi.ts`; empresas similares no Dossiê vêm só do STRATEVO.

### 5. Sugestões de correção

1. **Persistir dados da empresa do Data Enrich**  
   - Ao usar `getCompany(companyId)` (ex.: no modal ou em fluxo “Sync do Data Enrich”), mapear os campos relevantes para a tabela `companies` (ou para um snapshot do dossiê) e fazer `update` por `company_id`.  
   - Criar interface `DataEnrichCompany` com os campos da tabela companies do Data Enrich e usar em `getCompany` e no mapeamento.

2. **Estender DataEnrichContact e persistência**  
   - Incluir na interface: `email_verification_source`, `phone_verified`, `linkedin_profile_id`, `location`, `connection_degree`, `mutual_connections`.  
   - Em `mapContactToRow`, preencher esses campos (e `state` quando vier na API) na linha inserida em `decision_makers` (se o schema permitir).

3. **Invalidação de cache**  
   - Após `persistDataEnrichContactsToDecisionMakers` (e, se aplicável, após atualizar `companies` com `get-company`), chamar `queryClient.invalidateQueries` com uma query key usada pela aba Decisores e pelo bloco de empresa do Dossiê (ex.: `['company-data', companyId]`, `['decisors', companyId]` ou equivalente), para refetch automático ao fechar o modal ou ao voltar ao Dossiê.

4. **Sync ao abrir Dossiê (opcional)**  
   - Na abertura da aba Decisores (ou ao clicar “Atualizar do Data Enrich”), chamar `getContacts(companyId)` (com `companyId` do Lovable se houver mapeamento) e `persistDataEnrichContactsToDecisionMakers(company_id_stratevo, contacts)`, seguido de `loadDecisorsData()` ou `invalidateQueries`, para que enriquecimentos feitos no iframe apareçam no Dossiê sem precisar do modal.

5. **Uso do DataEnrichModal no Dossiê**  
   - Se o modal for usado a partir do Dossiê, passar `onDecisorsLoaded` que chame `loadDecisorsData()` e `setAnalysisData` (ou invalide a query de decisores) para atualizar a aba após “Extrair Decisores” e persistência.

---

*Fim do relatório de auditoria.*
