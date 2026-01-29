# Conexão dos Fios — Dossiê, Apollo, Fit e Company Details

**Objetivo:** Documentar como os “fios” estão ligados entre Apollo, decisores, Company details (estilo Klabin), fit de produtos e Dossiê, e o que foi ajustado para tudo aparecer e o fit não ficar em 0% sem motivo.

---

## 1. Company Details Apollo (estilo página Klabin) no Dossiê

**O que deve aparecer no Dossiê (aba Decisores):**

- **Empresa:** descrição, industry, keywords, employees, founding year, SIC/NAICS, links (site, LinkedIn, etc.)
- **Decisores:** nome, job title, email access, phone access, location, department, LinkedIn

**Onde esses dados vêm:**

| Dado | Fonte | Onde é guardado |
|------|--------|------------------|
| Company details (segmento, keywords, employees, SIC/NAICS, description) | Edge `enrich-apollo-decisores` → API Apollo Organization | `companies.raw_data.apollo_organization` |
| Decisores (pessoas) | Edge `enrich-apollo-decisores` → API Apollo People | Tabela `decision_makers` + refletido em `full_report.decisors_report` |

**Ajustes feitos:**

1. **Pipeline Discovery** (`useDiscoveryEnrichmentPipeline.ts`): depois do passo 4 (enrich-apollo-decisores), o pipeline lê de novo a empresa para pegar `raw_data.apollo_organization` e monta `decisors_report = { decisors, companyApolloOrg }`. Assim o Dossiê passa a ter os “Company details” Apollo (estilo Klabin) em `full_report.decisors_report.companyApolloOrg`.

2. **Aba Decisores** (`DecisorsContactsTab.tsx`): quando o `savedData` (vindo de `full_report.decisors_report`) tem decisores mas **não** tem `companyApolloOrg`, a aba chama `loadDecisorsData()` e preenche `companyApolloOrg` a partir de `companies.raw_data.apollo_organization`. Com isso, ao reabrir o Dossiê, o bloco “Company details” continua preenchido mesmo que o relatório antigo só tivesse `decisors`.

3. **Persistência no Dossiê:** ao salvar, o parent (TOTVSCheckCard) grava `tabDataRef.current.decisors` em `full_report.decisors_report`. O tab envia em `onDataChange` o objeto completo `{ decisors, companyApolloOrg, companyData }`, então o que é salvo e reaberto já inclui Company details.

---

## 2. Apollo Org ID manual (campo “colar URL ou ID”)

**Comportamento atual:**

- **ApolloOrgIdDialog:** aceita URL completa (ex.: `https://app.apollo.io/#/organizations/54a126fa69702d9313ca6100?overrideScoreId=...`) ou só o ID. O regex `/organizations\/([a-f0-9]{24})/i` extrai o ID de 24 caracteres hexadecimais; parâmetros de query (`?overrideScoreId=...`) são ignorados e não quebram a extração.
- **CompanyDetailPage** e **DecisorsContactsTab:** ao chamar a Edge, enviam no body `apollo_org_id: apolloOrgId || company.apollo_organization_id`. Quando o usuário confirma no dialog, `onEnrich(cleanId)` é chamado com o ID já extraído; o parent faz `update({ apollo_organization_id: apolloOrgId })` na empresa e em seguida chama `enrich-apollo-decisores` com esse `apollo_org_id`.
- **Edge `enrich-apollo-decisores`:** se receber `apollo_org_id`, usa esse ID direto como `organizationId` e busca organização e pessoas no Apollo.

**Se “não estiver funcionando”:**

- Verificar se a empresa não caiu em **idempotência**: a Edge usa `can_run_enrichment` para `apollo_org` e `decision_makers`. Se a empresa já foi marcada como enriquecida, a Edge pode retornar “já enriquecido” mesmo com ID manual. Nesse caso, é preciso revisar se, quando há `apollo_org_id` manual, a Edge deve ignorar idempotência (ex.: parâmetro `force_refresh` ou regra “se veio apollo_org_id, sempre rodar”).
- Conferir no DevTools se o body da chamada à Edge contém `apollo_org_id` e se o valor é o ID de 24 caracteres.

---

## 3. Fit 0% — motor tenant × prospect

**Como o fit é calculado:**

- A Edge **calculate-product-fit** compara:
  - **Catálogo do tenant:** produtos em `tenant_products` para o `tenant_id` informado (`is_active = true` ou ativo equivalente).
  - **Empresa prospect:** dados da `companies` (CNAE, setor, website, etc.) e, quando houver, análise de website em `website_analysis` / `raw_data.website_analysis`.

- Se **não existir nenhum produto** em `tenant_products` para esse `tenant_id`, a Edge devolve `fit_score: 0` e `overall_justification: 'Nenhum produto cadastrado no catálogo do tenant'`.

**Por que pode dar 0%:**

1. **Tenant sem produtos:** o tenant ativo não tem linhas em `tenant_products` (ou nenhuma com `is_active = true`). O motor está certo em retornar 0%; o “fio” correto é **cadastrar produtos do tenant** ( onboarding / catálogo do tenant ).
2. **tenant_id errado na pipeline:** o Discovery usa `useDiscoveryEnrichmentPipeline({ companyId, tenantId })`. Quem chama esse hook precisa passar o **tenant_id do tenant ativo** (o mesmo cujo catálogo se usa em `tenant_products`).
3. **scan-prospect-website e calculate-product-fit:** ambos usam `tenant_id` e `tenant_products`. O “fio” que compara oferta do tenant × prospect está nas Edges; a pipeline só precisa receber e repassar o `tenant_id` certo.

**Resumo:** Fit 0% significa “não há oferta do tenant para comparar” ou “tenant_id/tenant_products não batem”. Para ter fit > 0%, é obrigatório que o tenant tenha produtos em `tenant_products` e que a pipeline use esse mesmo `tenant_id`.

---

## 4. Critério de busca Apollo (nome + cidade + estado + CEP)

A Edge **enrich-apollo-decisores** usa, quando **não** há `apollo_org_id`:

- **Nome:** primeiro termo, segundo termo e nome completo (ex.: “Klabin” → tentativas com primeiras palavras e nome inteiro).
- **Filtros de local:** `city`, `state`, `cep` e `fantasia` são enviados no body pelo front (CompanyDetailPage / DecisorsContactsTab) a partir de:
  - `receita_federal` em `raw_data`, ou
  - campos diretos da empresa (`city`, `state`, `zip_code`, `fantasy_name`).

Ordem de uso na busca: 1) `apollo_org_id` se vier no body; 2) LinkedIn URL da empresa; 3) nome (primeira palavra → segunda → completo) + filtros de local. CEP está no fluxo desde que o front envie `cep` no body (já previsto).

---

## 5. Fallback Apollo → LinkedIn → Lusha

- **Apollo:** fonte principal de organização e pessoas; Edge `enrich-apollo-decisores` busca org + people e grava em `companies.raw_data.apollo_organization` e em `decision_makers`.
- **LinkedIn:** usado na aba Decisores para perfil por decisor (link de perfil). O Dossiê já tem suporte para exibir e abrir LinkedIn por decisor; a prioridade é Apollo, e LinkedIn complementa no contato/perfil.
- **Lusha:** já integrado na própria Edge `enrich-apollo-decisores`: após salvar decisores, a Edge chama a API Lusha para VIPs (C-Level, Diretor, etc.) que estejam sem email ou telefone e atualiza `decision_makers` com o que a Lusha devolver. Basta `LUSHA_API_KEY` configurada nos secrets do Supabase.

Ordem efectiva: **Apollo** (org + people) → depois **Lusha** (complemento de email/telefone para VIPs). LinkedIn entra na UI (links de perfil e ações do usuário), não como segunda fonte automática de dados na mesma Edge.

---

## 6. Checklist rápido “os fios estão ligados?”

| Verificação | Onde olhar |
|-------------|------------|
| Company details (Klabin-style) no Dossiê | Aba Decisores: bloco com nome da empresa, industry, keywords, employees, description. Se vier só decisores e não vier esse bloco, a aba completa com `loadDecisorsData()` a partir de `companies.raw_data.apollo_organization`. |
| Apollo Org ID manual | Colar URL da Klabin no dialog “Apollo ID Manual” → confirma → DevTools: body da `enrich-apollo-decisores` deve ter `apollo_org_id` com 24 caracteres. Empresa deve ter `apollo_organization_id` atualizado. |
| Fit 0% sempre | Verificar se o tenant ativo tem produtos em `tenant_products` e se o `tenant_id` passado ao Discovery é o desse tenant. |
| Decisores vazios no Dossiê | Garantir que “Extrair Decisores” ou o passo 4 do Discovery foi executado para essa empresa (e que a Edge não retornou por idempotência quando não deveria). |

---

## 7. Botão “Executar ação” (Agendar demo) — IA Sugestões

**Problema:** O botão “Executar ação” ao lado de “Agendar demo personalizada” na aba **IA Sugestões** do deal não fazia nada.

**Ajuste:** No `DealQuickActions`, o botão chama `onExecuteAction(suggestion)` quando há callback. No `DealDetailsDialog`, foi definido `handleExecuteSuggestion`: se a sugestão for do tipo `meeting` ou o texto da ação contiver “demo”, a aba ativa é trocada para **Detalhes**. Assim, ao clicar em “Executar ação” em “Agendar demo personalizada”, o usuário vai para a aba Detalhes, onde pode preencher **Data Esperada de Fechamento** e usar o **GO - Avançar para Proposta**.

---

## 8. Motor de scraping do website da empresa analisada (prospect)

**Fluxo já existente:**

1. **Pipeline Discovery** (passo 1): `find-prospect-website` descobre o site quando a empresa ainda não tem website.
2. **Pipeline Discovery** (passo 2): `scan-prospect-website` recebe `company_id`, `tenant_id` e `website_url` (ou usa o site da empresa quando só `company_id` vem). Se a empresa **não** estiver em `qualified_prospects`, entra o **modo company-only**: os produtos extraídos são gravados em **`companies.raw_data.produtos_extracted`**.
3. **calculate-product-fit** (passo 3) lê **`companies.raw_data.produtos_extracted`** e usa no prompt como “Produtos/Serviços extraídos do website da empresa”.

O Fit 0% quando “Este tenant não possui catálogo de produtos” continua sendo apenas **falta de produtos do tenant** em `tenant_products` (cadastro no onboarding/ICP do tenant).

---

*Documento criado para clarear a conexão entre Dossiê, Apollo, Company details, fit, botão Executar ação e fallbacks Apollo/LinkedIn/Lusha.*
