# Página Apollo Organization – Análise e Absorção 100% na Plataforma

## 1. URL de referência

- **Exemplo:** `https://app.apollo.io/#/organizations/5db3358b085ffb0098b4cb22?overrideScoreId=6817a0c271e3660001113e10`
- **Organization ID:** `5db3358b085ffb0098b4cb22` (24 caracteres, estilo MongoDB ObjectId)
- **overrideScoreId:** parâmetro de scoring da Apollo (opcional; não necessário para ingestão)

A página da Apollo no app mostra, em resumo:
- Dados da **organização** (nome, indústria, site, LinkedIn, descrição, funcionários, tecnologias, etc.)
- Lista de **pessoas** vinculadas à organização (decisores, cargos, emails, telefones, LinkedIn, scores)

Tudo isso é acessível via **API REST** da Apollo, não por scraping da página.

---

## 2. API Apollo – URLs oficiais (documentação)

Documentação atual: [Apollo API Reference](https://docs.apollo.io/reference/get-complete-organization-info), [Developer Hub](https://apolloio.github.io/apollo-api-docs/).

- **Base URL:** `https://api.apollo.io/api/v1` (obrigatório o segmento `/api/`).
- **Chave:** header `X-Api-Key`. O endpoint **Get Complete Organization Info** exige **API key do tipo Master**; sem isso retorna `403`.

| Recurso | Método | URL oficial | Uso na plataforma |
|--------|--------|-------------|-------------------|
| Organização por ID | GET | `https://api.apollo.io/api/v1/organizations/{id}` | Dados completos da empresa (página “organization”) |
| Busca de organizações | POST | `https://api.apollo.io/api/v1/mixed_companies/search` | Buscar org por nome/domínio/LinkedIn quando não temos ID |
| Busca de pessoas | POST | `https://api.apollo.io/api/v1/mixed_people/api_search` | Lista de pessoas (endpoint atual; `mixed_people/search` está **deprecado**) |

**Importante:** No código estava em uso `https://api.apollo.io/v1/...` (sem `/api/`). A documentação atual usa `https://api.apollo.io/api/v1/...`. As chamadas foram ajustadas para usar a base correta.

---

## 3. Campos da organização (GET organization)

O que a página da organização mostra vem, em grande parte, do **GET Complete Organization Info**. Abaixo, os campos que a API pode retornar e como absorvemos na nossa plataforma.

### 3.1 Onde guardamos

- **Tabela `companies`:**
  - Campos diretos: `industry`, `description`, `linkedin_url`, `apollo_id` (e onde existir `apollo_organization_id`).
  - Objeto completo: `raw_data.apollo_organization` (incluindo `raw_apollo_data` = resposta bruta da API).

### 3.2 Mapeamento organização → plataforma

| Campo Apollo (organization) | Onde absorvemos | Observação |
|-----------------------------|-----------------|------------|
| `id` | `companies.apollo_id` / `apollo_organization_id`, `raw_data.apollo_organization.id` | ID usado na URL da página |
| `name` | `companies.name` (se for caso de criar/atualizar), `raw_data.apollo_organization.name` | Nome da empresa |
| `primary_domain` | Normalizar para domínio; usar em buscas e matching | Domínio principal |
| `website_url` | `raw_data.apollo_organization.website_url` | Site |
| `linkedin_url` | `companies.linkedin_url`, `raw_data.apollo_organization.linkedin_url` | LinkedIn da empresa |
| `industry` | `companies.industry`, `raw_data.apollo_organization.industry` | Setor |
| `sub_industry` | `raw_data.apollo_organization.sub_industry` | Sub-setor |
| `short_description` | `companies.description`, `raw_data.apollo_organization.short_description` | Descrição curta |
| `keywords` | `raw_data.apollo_organization.keywords` (array) | Palavras-chave |
| `estimated_num_employees` | `raw_data.apollo_organization.estimated_num_employees` | Faixa de funcionários |
| `twitter_url`, `facebook_url` | `raw_data.apollo_organization` | Redes sociais |
| `technologies` | `raw_data.apollo_organization.technologies` | Stack tecnológica |
| `phone` | `raw_data.apollo_organization.phone` | Telefone corporativo |
| `sic_codes`, `naics_codes` | `raw_data.apollo_organization` | Códigos de atividade |
| `retail_location_count`, `raw_location_count` | `raw_data.apollo_organization` | Número de localizações |
| `city`, `state`, `country`, `postal_code` | `raw_data.apollo_organization` | Endereço |
| `revenue` (se existir) | `raw_data.apollo_organization.revenue` | Receita |
| `funding` (se existir) | `raw_data.apollo_organization` | Dados de funding |
| Qualquer outro campo da resposta | `raw_data.apollo_organization.raw_apollo_data` | Absorção 100% via JSON bruto |

Ou seja: **absorção 100%** = persistir a resposta completa em `raw_data.apollo_organization.raw_apollo_data` e, em cima disso, preencher os campos normais da `companies` e os que usamos na UI em `raw_data.apollo_organization`.

---

## 4. Campos das pessoas (lista da página)

A lista de pessoas da organização na Apollo equivale à **busca de pessoas** filtrada por `organization_ids: [id]`. Cada item é um “person” com dados de contato e score.

### 4.1 Onde guardamos

- **Tabela `decision_makers`:**
  - Campos mapeados: `name`, `title`, `linkedin_url`, `email`, `phone`, `company_id`, `apollo_organization_id`, `apollo_person_id`, etc.
  - Objeto completo: `raw_apollo_data` (resposta bruta da pessoa).

### 4.2 Mapeamento pessoa → plataforma

| Campo Apollo (person) | Coluna / uso na plataforma | Observação |
|------------------------|----------------------------|------------|
| `id` | `decision_makers.apollo_person_id` | ID da pessoa na Apollo |
| `first_name`, `last_name`, `name` | `decision_makers.name`, `first_name`, `last_name` | Nome |
| `title` | `decision_makers.title` | Cargo (ex.: na página) |
| `linkedin_url` | `decision_makers.linkedin_url` | Perfil LinkedIn |
| `email`, `email_status` | `decision_makers.email`, `email_status` | Email e status |
| `phone_numbers` | `decision_makers.phone`, `mobile_phone` | Telefones |
| `city`, `state`, `country` | `decision_makers.city`, `state`, `country` | Localização |
| `organization_id`, `organization_name` | `apollo_organization_id`, `company_name` | Vínculo com a organização |
| `seniority`, `departments` | `decision_makers.seniority`, `departments` | Senioridade e departamentos |
| `photo_url`, `headline` | `decision_makers.photo_url`, `headline` | Foto e headline LinkedIn |
| `employment_history` | `raw_apollo_data` | Histórico de emprego |
| `auto_score` / `person_score` | `people_auto_score_value`, `people_auto_score_label` | Score Apollo (ex.: na página) |
| Qualquer outro campo | `decision_makers.raw_apollo_data` | Absorção 100% por pessoa |

Assim, **absorção 100%** das pessoas = gravar todos os campos que a API retorna em `raw_apollo_data` e preencher as colunas que a UI e os relatórios usam.

### 4.3 Sincronização Apollo ↔ tabela decision_makers ↔ dossiê (aba Decisores)

Para o relatório não ficar em branco, os três níveis precisam estar alinhados:

- **1. Apollo API:** resposta de pessoas (mixed_people/search) com id, name, title, linkedin_url, email, phone_numbers, city, state, country, seniority, departments, photo_url, headline, auto_score, etc.
- **2. Tabela decision_makers:** colunas do schema real: name, title, seniority, departments (JSONB), raw_apollo_data (JSONB), company_name, people_auto_score_value, etc. A Edge já grava nesses nomes.
- **3. Dossiê (DecisorsContactsTab):** `loadDecisorsData()` deve ler com `raw_apollo_data` (não raw_data), name/title (não só full_name/position), seniority (não só seniority_level), departments, e incluir id em cada decisor para ações (Revelar).

Ajuste aplicado no código: o mapeamento em `loadDecisorsData` passou a usar `d.raw_apollo_data || d.raw_data`, `d.name || d.full_name`, `d.title || d.position`, `d.seniority || d.seniority_level`, `d.departments` e `d.id`.

---

## 5. Fluxo para “absorver 100%” a partir da URL da página

1. **Extrair Organization ID da URL**  
   Ex.: `https://app.apollo.io/#/organizations/5db3358b085ffb0098b4cb22` → `5db3358b085ffb0098b4cb22`.

2. **Chamar a API com a base correta:**
   - GET `https://api.apollo.io/api/v1/organizations/5db3358b085ffb0098b4cb22`  
   → Resposta = todos os campos da organização.

3. **Persistir organização:**
   - Atualizar/criar `companies` com campos diretos e `raw_data.apollo_organization` (incluindo `raw_apollo_data` = corpo completo da resposta).

4. **Buscar pessoas da organização:**
   - POST `https://api.apollo.io/api/v1/mixed_people/search` (ou o endpoint documentado equivalente) com `organization_ids: ["5db3358b085ffb0098b4cb22"]`, paginando.

5. **Persistir pessoas:**
   - Para cada pessoa: upsert em `decision_makers` com colunas mapeadas + `raw_apollo_data` = objeto completo retornado pela API.

6. **OverrideScoreId**  
   O parâmetro `overrideScoreId` da URL é interno da Apollo (scoring). Não é necessário para replicar os dados na nossa plataforma; podemos ignorá-lo na absorção.

---

## 6. Checklist – Por que “nenhum dos dois funcionou”

- [ ] **URL da API:** Usar base `https://api.apollo.io/api/v1` (com `/api/`). Código ajustado para essa base.
- [ ] **Chave API:** Conta Apollo deve ter **API key do tipo Master**; sem isso GET organization pode retornar 403.
- [ ] **Organization ID:** Usar exatamente o ID da URL (ex.: `5db3358b085ffb0098b4cb22`), sem alterar.
- [ ] **Idempotência:** Se estiver usando “Apollo ID manual”, enviar `force_refresh: true` para ignorar cache/idempotência e forçar nova busca.
- [ ] **Domain:** Enviar domínio já normalizado (sem `https://`, `www`, path) quando for buscar por domínio.

---

## 7. Resumo

- A **página** `https://app.apollo.io/#/organizations/{id}` reflete **organização + pessoas** que vêm da **API** Apollo.
- **Absorver 100%** = usar a **base URL correta** (`api.apollo.io/api/v1`), chamar **GET organization** e **POST mixed_people/search** (ou equivalente), e persistir:
  - Organização: em `companies` + `raw_data.apollo_organization` (com `raw_apollo_data` = resposta bruta).
  - Pessoas: em `decision_makers` com colunas mapeadas + `raw_apollo_data` por pessoa.
- Com isso, todos os campos que a página mostra (e os que a API retorna a mais) ficam armazenados na nossa plataforma e podem ser usados em relatórios e no dossiê.

---

## 8. O que falta para o sistema funcionar definitivamente

O código já está implementado (Edge com `api/v1`, `force_refresh`, `reason_empty`; Orchestrator com domain normalizado e mapeamento; DecisorsContactsTab com `force_refresh` no ID manual e toast de `reason_empty`). Para trazer todos os dados da Apollo de ponta a ponta:

| # | O que fazer | Onde / como |
|---|-------------|-------------|
| 1 | **Deploy da Edge** | Rodar `supabase functions deploy enrich-apollo-decisores` (ou deploy pelo painel) para que a API use a base `api/v1` e toda a lógica nova. |
| 2 | **Secret no Supabase** | No Supabase: **Project Settings → Edge Functions → Secrets**. Garantir que existe **APOLLO_API_KEY** com o valor da chave Master (a mesma do portal Apollo, ex.: "OLV Intelligent Prospecting System master -"). |
| 3 | **Testar o fluxo** | Abrir um dossiê → aba **Decisores** → botão **"Apollo ID manual"** (ou equivalente) → colar o Organization ID (ex.: `5db3358b085ffb0098b4cb22`) → **Extrair Decisores**. Verificar se organização e pessoas aparecem e são salvas. |
| 4 | **Se der 404** | Ver seção 9: trocar para `mixed_companies/search` ou `mixed_people/api_search` se a Apollo tiver descontinuado os paths atuais. |

Resumo: **código pronto**; falta **deploy da Edge**, **APOLLO_API_KEY nos secrets** e **um teste real** com o ID da organização. A chave Master no Apollo já está ativa (confirmado pelo uso de créditos).

---

## 9. Se ainda falhar (404 / 403)

- **403 em GET organization:** A documentação exige **API key do tipo Master**. Verifique em Apollo → Settings → API Keys e use uma chave “Master”.
- **404 em organizations/search:** Alguns documentos Apollo referem busca de empresas como `POST .../mixed_companies/search`. O código atual usa `.../organizations/search`; se a Apollo descontinuar esse path, trocar para `mixed_companies/search` e ajustar o body conforme a referência.
- **Pessoas vazias com api_search:** O código já usa `mixed_people/api_search` (o antigo `mixed_people/search` está deprecado). Quando há `organizationId`, enviamos também `q_organization_domains_list` com o domínio da organização (GET organization) para garantir filtro por empresa.

Referências:
- [Get Complete Organization Info](https://docs.apollo.io/reference/get-complete-organization-info)
- [Organization Search](https://docs.apollo.io/reference/organization-search)
- [People API Search](https://docs.apollo.io/reference/people-api-search)
