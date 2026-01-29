# Análise e Recomendação: Decisores no Dossiê Estratégico

**Foco:** área de Decisores e Contatos no modal do Dossiê Estratégico de Prospecção (LinkedIn → Apollo → Lusha → Hunter).  
**Objetivo:** entender por que os decisores não aparecem (0 encontrados) e recomendar ações para enriquecer com dados reais, sem alterar outras partes do sistema.

---

## 1. Fluxo atual (como está implementado)

### 1.1 Front (DecisorsContactsTab + EnrichmentOrchestrator)

1. Usuário clica em **"Extrair Decisores"** ou abre **"Apollo ID Manual"** e informa URL/ID do Apollo.
2. `runEnrichmentFlow(apolloOrgId?)` monta o input:
   - `company_id`, `company_name`
   - `domain` = `companies.domain` ou `companies.website`
   - `linkedin_url` = `companies.linkedin_url` ou `raw_data.linkedin_url` ou `raw_data.apollo_organization.linkedin_url`
   - `apollo_org_id` = valor do modal **ou** `companies.apollo_organization_id`
   - `city`, `state`, `industry`, `cep`, `fantasia` = de `raw_data.receita_federal` e da company
3. Chama a Edge Function **`enrich-apollo-decisores`** com esse body.
4. Após a resposta, chama `loadDecisorsData()`: lê `decision_makers` e `companies.raw_data` (apollo_organization) e atualiza a aba.

### 1.2 Edge Function (enrich-apollo-decisores)

**Ordem de execução:**

1. **Idempotência (RPC `can_run_enrichment`):**
   - `apollo_org`: bloqueia se `companies.apollo_organization_id` já existir ou se `enrichment_state.apollo_org_enriched = true`.
   - `decision_makers`: bloqueia se existir pelo menos 1 linha em `decision_makers` para a company **ou** se `enrichment_state.decision_makers_enriched = true`.
   - Se **ambos** estiverem bloqueados, a Edge retorna cedo com "already enriched". Se só um estiver bloqueado (ex.: Apollo Org já preenchido, 0 decisores), a Edge **continua** e tenta buscar pessoas.

2. **Resolução do Organization ID (Apollo):**
   - **Prioridade 1:** `apollo_org_id` do body (ID manual).
   - **Prioridade 2:** LinkedIn URL → `POST https://api.apollo.io/v1/organizations/search` com `q_keywords: linkedinSlug` (ex.: "samtronic"); escolhe org cujo `linkedin_url` bate.
   - **Prioridade 3:** Nome da empresa → `organizations/search` com `q_organization_name: primeira palavra`, depois segunda, depois nome completo; aplica filtros (LinkedIn URL, domain, CEP, cidade/estado, Brasil) para escolher a org correta.

3. **Dados da organização:**  
   Se tiver `organizationId`, chama `GET https://api.apollo.io/v1/organizations/{id}` e guarda em `organizationData`.

4. **Busca de pessoas:**  
   `POST https://api.apollo.io/v1/mixed_people/search` com:
   - `organization_ids: [organizationId]` se tiver org ID, **ou**
   - `q_organization_domains: domain` se não tiver org ID mas tiver domain, **ou**
   - `q_keywords: companyName` como fallback.

5. **Persistência:**  
   Insere/upsert em `decision_makers`, atualiza `companies.raw_data.apollo_organization`, `companies.apollo_organization_id`, `enrichment_state`, e opcionalmente complementa contatos via Lusha.

---

## 2. Por que os decisores podem estar em zero

### 2.1 Idempotência bloqueando reexecução

- **Apollo Org:** Se em algum momento a company recebeu `apollo_organization_id` (manual ou por uma busca anterior), `can_run_enrichment('apollo_org')` retorna `can_run: false`. A Edge ainda pode seguir para decisores se `can_run_enrichment('decision_makers')` for true (0 decisores e state não marcado como enriched).
- **Decision makers:** Só bloqueia se já existir **ao menos 1** decisor para a company **ou** se `decision_makers_enriched = true`. Se uma execução anterior tiver marcado `decision_makers_enriched = true` mesmo com 0 pessoas salvas, as próximas execuções serão bloqueadas e nunca trarão decisores.

Conclusão: vale checar no banco, para a company em questão (ex.: Samtronic), os valores de `companies.apollo_organization_id`, `companies.enrichment_state` e a contagem em `decision_makers`. Se `decision_makers_enriched` estiver true com 0 decisores, isso explica o bloqueio.

### 2.2 APOLLO_API_KEY

- A Edge usa `Deno.env.get('APOLLO_API_KEY')`. Se a chave não estiver configurada nos **Secrets** da Edge no Supabase, a função falha antes de chamar a API.
- Se a chave estiver incorreta ou expirada, a API pode retornar 401/403 e a Edge pode não estar devolvendo essa informação de forma clara para o front.

Recomendação: confirmar em **Supabase → Edge Functions → enrich-apollo-decisores → Secrets** que `APOLLO_API_KEY` existe e é a chave correta do Apollo (incluindo plano com acesso a organization/people search).

### 2.3 Organization ID nunca resolvido

Para a empresa não ser encontrada no Apollo (e portanto `organizationId` ficar null):

- **LinkedIn URL vazia:**  
  Se `companies.linkedin_url` e `raw_data.linkedin_url` estiverem vazios, a busca por LinkedIn slug não roda. Para Samtronic, isso depende de ter sido preenchido por outro fluxo (ex.: scan-prospect-website, find-prospect-website, ou cadastro manual).

- **Busca por nome falhando:**  
  `organizations/search` com `q_organization_name` pode não retornar a empresa se:
  - O nome no banco for muito longo ou com caracteres especiais (ex.: "Samtronic Indústria e Comércio Ltda.").
  - A empresa não existir na base do Apollo com esse nome.
  - Apollo exige filtros adicionais (ex.: país) que não estamos enviando.

- **Domain mal formatado:**  
  Se `domain` for enviado como `https://www.samtronic.com.br`, a API do Apollo pode esperar só `samtronic.com.br`. O front envia `domain` como vem de `companies.domain` ou `companies.website`; pode ser necessário normalizar (remover protocolo e path) antes de enviar.

- **Filtros Brasil (city, state, CEP, fantasia):**  
  Se a Receita não tiver sido consultada ou não estiver em `raw_data.receita_federal`, `city`, `state`, `cep`, `fantasia` vêm vazios e o refinamento da org (cidade/estado/CEP/fantasia) não ajuda; pode ficar apenas “primeira da lista” ou nenhuma match.

### 2.4 Apollo ID manual

- Se o usuário cola a URL do Apollo (ex.: `https://app.apollo.io/#/organizations/XXXXX/people`) ou o ID no modal, o front extrai o ID e envia como `apollo_org_id`. A Edge usa esse ID diretamente.
- Possíveis problemas:
  - ID inválido ou de outra conta/organização.
  - Empresa no Apollo sem pessoas indexadas (mixed_people/search retorna 0).
  - Resposta da API (401, 403, 404) não estar sendo mapeada para uma mensagem clara no front (ex.: “Chave inválida” ou “Empresa não encontrada no Apollo”).

### 2.5 Resposta da Edge pouco informativa

- Quando a organização não é encontrada ou a API falha, a Edge pode estar retornando sucesso com 0 decisores sem explicar o motivo (ex.: “org não encontrada”, “domain não encontrado”, “APOLLO_API_KEY ausente”). Isso dificulta saber se o problema é configuração, dados da company ou limite do Apollo.

---

## 3. Como plataformas grandes costumam enriquecer (referência)

- **LinkedIn:** Fonte primária de “empresa + pessoas”. Muitos fluxos primeiro resolvem a página da empresa no LinkedIn (por nome/domínio) e depois usam esse identificador em outros sistemas.
- **Apollo:**  
  - Organizações: busca por nome, domínio, LinkedIn; filtros por país, cidade, tamanho.  
  - Pessoas: filtro por organização (ID ou domínio). Parâmetros como `q_organization_domains_list` (lista de domínios) são comuns na documentação atual.  
  - Boas práticas: normalizar domínio (sem protocolo/path), enviar país (ex.: Brazil) quando possível e usar organization_id quando já conhecido (mais estável que nome).
- **Lusha / Hunter:** Usados em geral **depois** de ter a pessoa (nome, LinkedIn, empresa) para enriquecer email/telefone. Ou seja: primeiro resolver empresa e lista de pessoas (Apollo/LinkedIn), depois complementar contatos.

No nosso fluxo, já estamos alinhados a essa ideia (LinkedIn → Apollo org → pessoas → Lusha opcional). O que falta é garantir: chave Apollo válida, dados da company bem preenchidos (domain, LinkedIn, Receita), normalização de domain e respostas de erro claras.

---

## 4. Checklist de verificação (antes de implementar)

Fazer esta checagem **sem alterar código** (e depois usar o resultado para priorizar correções):

1. **Secrets da Edge**
   - [ ] `APOLLO_API_KEY` definida em **Supabase → Edge Functions → enrich-apollo-decisores → Secrets**.
   - [ ] Mesma chave com permissão de Organization Search e People Search no Apollo.

2. **Banco (company Samtronic ou a que está com 0 decisores)**
   - [ ] `companies.apollo_organization_id`: preenchido ou null?
   - [ ] `companies.linkedin_url` e `raw_data.linkedin_url`: preenchidos?
   - [ ] `companies.website` / `companies.domain`: qual valor exato? (ex.: `https://www.samtronic.com.br` ou `samtronic.com.br`)
   - [ ] `companies.enrichment_state`: `apollo_org_enriched` e `decision_makers_enriched` estão true/false?
   - [ ] Contagem: `SELECT COUNT(*) FROM decision_makers WHERE company_id = '<id_da_company>';` → 0 ou > 0?

3. **Apollo ID manual**
   - [ ] Ao colar URL do Apollo e clicar em buscar, o modal chama `onEnrich(cleanId)` e o body da Edge inclui `apollo_org_id` com o ID de 24 caracteres?
   - [ ] No Apollo (app.apollo.io), a empresa em questão tem aba “People” com resultados? Se não tiver, a API também pode retornar 0.

4. **Logs da Edge**
   - [ ] No Supabase (Logs da função `enrich-apollo-decisores`), em uma execução com “Extrair Decisores” ou “Apollo ID Manual”, verificar:
     - Se aparece "SKIPPED (idempotency)" e por qual tipo (apollo_org / decision_makers).
     - Se aparece "Organização encontrada" ou "Organização não encontrada".
     - Se aparece "Coleta finalizada: X pessoas" (X = 0 ou > 0).
     - Qualquer linha com status 401/403/404 da API Apollo.

---

## 5. Recomendações técnicas (para implementar depois)

As ações abaixo são só recomendação; a implementação deve ser feita em seguida, com foco **apenas** na área de decisores e no modal do Dossiê, sem mudar outras partes do sistema.

### 5.1 Configuração e dados

1. **Garantir APOLLO_API_KEY** nas secrets da Edge e documentar no projeto onde configurar (ex.: README ou doc de deploy).
2. **Normalizar `domain` antes de enviar à Edge:**  
   Remover `https://`, `http://`, `www.` e path; enviar só host (ex.: `samtronic.com.br`). Pode ser no front (EnrichmentOrchestrator/DecisorsContactsTab) ou na Edge; um único lugar evita duplicação.
3. **Preencher LinkedIn da empresa quando possível:**  
   Reaproveitar o fluxo existente (ex.: find-prospect-website ou scan-prospect-website que já busca LinkedIn) para que, ao abrir o Dossiê, a company já tenha `linkedin_url` quando disponível. Assim a Edge pode usar “busca por LinkedIn” em vez de depender só de nome.

### 5.2 Idempotência e “forçar nova busca”

4. **Permitir reexecução quando o usuário informa Apollo ID manual:**  
   Se o body tiver `apollo_org_id` preenchido (vindo do modal), a Edge pode **não** aplicar o bloqueio de idempotência para `apollo_org` (e opcionalmente para `decision_makers`), ou usar um parâmetro explícito tipo `force_refresh: true` apenas quando vier do “Apollo ID Manual”. Assim, mesmo que a company já tenha `apollo_organization_id`, uma nova busca com ID manual atualiza org e pessoas.
5. **Não marcar `decision_makers_enriched = true` quando 0 pessoas forem salvas:**  
   Só chamar `mark_enrichment_done(..., 'decision_makers', ...)` quando `decision_makers_inserted > 0`. Caso contrário, uma execução que retorna 0 pessoas (por falha de API ou empresa sem pessoas no Apollo) bloqueia para sempre novas tentativas.

### 5.3 Busca de organização no Apollo

6. **Incluir país na busca de organizações:**  
   Enviar filtro de país (ex.: Brazil) em `organizations/search` quando disponível, para reduzir falsos positivos e melhorar o match.
7. **Tentar domínio antes de nome:**  
   Se tiver `domain` normalizado, fazer uma busca por domínio (parâmetro que a API Apollo usar para organizações, ex.: `q_organization_domains` ou equivalente na documentação atual) **antes** de tentar por `q_organization_name`, pois domínio costuma ser mais estável.
8. **Ajustar nome enviado ao Apollo:**  
   Para empresas brasileiras, testar também só a “primeira palavra” ou “nome fantasia” (ex.: “Samtronic”) além do nome completo, e garantir que caracteres especiais (acentos, “Ltda.”, “S/A”) não quebrem a busca (normalizar ou enviar várias variantes).

### 5.4 Resposta e UX

9. **Resposta da Edge mais explícita:**  
   Incluir na resposta JSON, quando aplicável:
   - `organization_found: true/false`
   - `organization_id_used: string | null`
   - `reason_empty: string` quando `decision_makers_total === 0` (ex.: "org_not_found", "apollo_key_missing", "no_people_in_apollo", "idempotency_skip").
   Assim o front pode mostrar mensagens como “Empresa não encontrada no Apollo” ou “Configure a chave APOLLO_API_KEY”.
10. **Exibir no modal/aba de Decisores:**  
    Mensagem específica quando a resposta indicar `reason_empty` (ex.: orientar a preencher LinkedIn da empresa, ou usar “Apollo ID Manual” com a URL da empresa no Apollo).

### 5.5 Tabelas e dados já existentes

11. **Reaproveitar `companies.apollo_organization_id` e `raw_data.apollo_organization`:**  
    O front já lê isso em `loadDecisorsData()`. Garantir que, após uma extração bem-sucedida, esses campos sejam preenchidos e que a aba mostre “Company details” (industry, keywords, employees) quando existirem. Nenhuma mudança estrutural nas tabelas; só garantir que a Edge persista e o front continue lendo.
12. **Conferir schema de `decision_makers`:**  
    Verificar se as colunas usadas na Edge (ex.: `apollo_organization_id`, `people_auto_score_value`, `company_name`, etc.) existem na migration atual e se há RLS permitindo insert/update pela Edge (service role). Qualquer falha de coluna ou RLS pode fazer a Edge “achar” pessoas mas não salvar.

---

## 6. Ordem sugerida de execução

1. **Fazer o checklist da seção 4** (Secrets, banco, Apollo ID manual, logs) e anotar o que falhar.
2. **Corrigir configuração e dados** (5.1 e 5.2): chave Apollo, normalização de domain, idempotência quando ID manual e não marcar `decision_makers_enriched` quando 0 pessoas.
3. **Melhorar resolução de organização e resposta** (5.3 e 5.4): país, domínio antes de nome, `reason_empty` e mensagens no front.
4. **Revalidar** com a mesma company (ex.: Samtronic) e, se possível, com uma que já tenha LinkedIn e domain preenchidos e que exista no Apollo com pessoas listadas.

---

## 7. Escopo e não escopo

- **Escopo:** apenas o fluxo de Decisores no Dossiê Estratégico (Extrair Decisores, Apollo ID Manual, leitura de `decision_makers` e Company details). Inclui: front da aba Decisores, EnrichmentOrchestrator, Edge `enrich-apollo-decisores` e RPC/idempotência que afetam esse fluxo.
- **Fora do escopo:** outras abas do Dossiê, pipeline de enriquecimento em massa, Fit de Produtos, scan-website-products, e qualquer outra área do sistema que não seja a “quadrante de decisores” e a página da empresa (dados Apollo) nesse modal.

Com isso, a análise e as recomendações ficam prontas para uma execução técnica focada e segura, sem impactar o que já foi construído nas demais partes da plataforma.
