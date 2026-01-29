# Dossiê Estratégico: Fit de Produtos e Decisores — Passo a Passo

Guia minucioso, em português, para gerar corretamente os dois relatórios do Dossiê Estratégico: **Fit de Produtos** (matching IA) e **Decisores e Contatos**.

---

## Parte 1 — Fit de Produtos (matching e recomendações da IA)

### O que você vê na tela

No Dossiê Estratégico, na aba **Fit de Produtos**, existem **dois quadros lado a lado**:

| Quadro | Conteúdo | Fonte dos dados |
|--------|----------|------------------|
| **Produtos do tenant (catálogo)** | Produtos/serviços que a **sua empresa** pode oferecer | Tabela `tenant_products` (cadastrados no onboarding do tenant) |
| **Produtos do prospect (extraídos)** | O que a **empresa prospectada** fabrica/vende/oferece | `companies.raw_data.produtos_extracted` (extraídos do site do prospect) |

O botão **"Gerar Fit de Produtos"** usa esses dois conjuntos + dados da empresa (CNAE, setor, porte, etc.) para a **IA calcular o match** e recomendar quais produtos do tenant oferecer ao prospect.

---

### Pré-requisitos obrigatórios

1. **Tenant com catálogo preenchido**  
   O tenant precisa ter ao menos um produto ativo em `tenant_products` (cadastrado na Etapa 1 do onboarding, botões "Extrair Produtos" ou "360º Completo").

2. **Prospect com empresa válida**  
   A empresa (company) deve existir em `companies` com `company_id` válido.

3. **Para o fit ser rico:**  
   - Website do prospect preenchido em `companies.website` ou `companies.domain`.  
   - Produtos do prospect já extraídos (quadro da direita preenchido). Se não estiver, o fit ainda roda, mas usa só CNAE/setor/porte; a IA não enxerga “o que o prospect vende”.

---

### Fluxo recomendado (ordem cronológica)

#### Opção A — Passo a passo manual (controle total)

| # | Ação do usuário | O que acontece nos bastidores |
|---|------------------|-------------------------------|
| 1 | Abrir o deal no **Discovery** e clicar em **"Abrir Dossiê Estratégico"** | Abre o modal do Dossiê com abas (Verificação, Fit de Produtos, Decisores, etc.). |
| 2 | Ir na aba **"Fit de Produtos"** | Exibe os dois quadros: tenant (esquerda) e prospect (direita). |
| 3 | Se o **website do prospect** estiver vazio: clicar em **"Descobrir Website"** (ou informar/editar o site no ícone de lápis) | Chama a Edge Function `find-prospect-website` (razão social + CNPJ) e grava o resultado em `companies.website`. |
| 4 | Clicar em **"Extrair Produtos do Prospect"** | Chama a Edge Function `scan-website-products` com `company_id`, `website_url` e `mode: 'prospect'`. O resultado é salvo em `companies.raw_data.produtos_extracted` e o quadro da direita é preenchido. |
| 5 | Clicar em **"Gerar Fit de Produtos"** | (Detalhado na seção “O que acontece ao clicar Gerar Fit” abaixo.) |

#### Opção B — Tudo em uma vez (pipeline automático)

| # | Ação do usuário | O que acontece nos bastidores |
|---|------------------|-------------------------------|
| 1 | No **card “Dossiê e Inteligência”** (dentro do deal), clicar em **"Executar Enriquecimento Estratégico (Discovery)"** | O hook `useDiscoveryEnrichmentPipeline` executa, em ordem: 1) find-prospect-website, 2) scan-website-products (prospect), 3) calculate-product-fit, 4) enrich-apollo-decisores, 5) digital-intelligence-analysis e 6) gravação do `full_report` em `stc_verification_history`. |
| 2 | Ao final, abrir o **Dossiê Estratégico** e ir na aba **Fit de Produtos** | Os quadros e o relatório de fit já estarão preenchidos (e o fit já estará salvo em `full_report.product_fit_report`). |

---

### O que acontece ao clicar em "Gerar Fit de Produtos"

1. **Front (TOTVSCheckCard)**  
   - Chama `handleGerarFit`.  
   - Invoca a Edge Function `calculate-product-fit` com `body: { company_id, tenant_id }`.  
   - Desabilita o botão e exibe loading até a resposta.  
   - Após sucesso: invalida/refetch das queries `product-fit`, `stc-history`, `stc-latest` para atualizar a UI.

2. **Edge Function `calculate-product-fit`** (resumo do fluxo interno):

   | Etapa | Ação |
   |-------|------|
   | 1 | Valida `company_id` e `tenant_id`. |
   | 2 | Busca a empresa em `companies` (nome, CNPJ, CNAE, setor, porte, website, capital_social, funcionários, cidade, UF, etc.). |
   | 3 | Busca produtos do tenant em `tenant_products` (`tenant_id`, ativos; ordenação por nome). Se não houver nenhum, retorna erro amigável: "Nenhum produto ativo encontrado para o tenant". |
   | 4 | Busca ICP do tenant em `icp_profiles_metadata` (critérios, setores-alvo, CNAEs-alvo) e dados de onboarding (persona, diferenciais). |
   | 5 | Monta resumo dos produtos do tenant (id, nome, descrição, categoria, cnaes_alvo, setores_alvo, casos_uso, dores_resolvidas, etc.). |
   | 6 | Lê **produtos do prospect** de `companies.raw_data.produtos_extracted` (preenchido pelo "Extrair Produtos do Prospect" ou pelo pipeline). Monta texto para o prompt. |
   | 7 | Monta o prompt da IA com: produtos do tenant, diferenciais/ICP, dados da empresa prospectada, CNAE, setor, website (e, se houver, lista de produtos extraídos do prospect). |
   | 8 | Se existir `OPENAI_API_KEY`: chama OpenAI (gpt-4o-mini, JSON) para obter `fit_score`, `overall_justification`, `products_recommendation` (por produto: product_id, product_name, fit_score, recommendation high/medium/low, justification, strengths, weaknesses), `cnae_match`, `sector_match`, `website_analysis_summary`. |
   | 9 | Se não houver OpenAI ou der erro: usa **fallback** `performBasicFitAnalysis` (regras por CNAE, setor, porte e casos de uso). |
   | 10 | Retorna JSON padronizado: `fit_score`, `fit_level` (high/medium/low), `products_recommendation`, `analysis` (tenant_products_count, cnae_match, sector_match, overall_justification), `metadata` (analyzed_at, ai_model, confidence). |

3. **Exibição e salvamento**  
   - O **ProductFitScoreCard** mostra o score geral, nível (alto/médio/baixo) e a justificativa.  
   - A lista **ProductRecommendationsList** mostra cada produto recomendado com score e justificativa.  
   - Se o usuário **salvar o relatório** (botão Salvar do Dossiê), o resultado do fit fica em `stc_verification_history.full_report.product_fit_report`. O pipeline automático já persiste esse bloco ao final da execução.

---

### Resumo rápido — Fit de Produtos

- **Quadros:** tenant = catálogo (`tenant_products`); prospect = extraídos do site (`companies.raw_data.produtos_extracted`).  
- **Ordem sugerida:** (1) Ter website do prospect → (2) Extrair produtos do prospect → (3) Gerar Fit de Produtos.  
- **Botão "Gerar Fit"** dispara `calculate-product-fit`, que usa tenant + prospect + CNAE/setor/ICP e IA (ou fallback) para produzir score e recomendações por produto.  
- **Persistência:** em `full_report.product_fit_report` (ao salvar o relatório ou ao rodar o pipeline).

---

## Parte 2 — Decisores e Contatos (busca e relatório de decisores)

### O que você vê na tela

Na aba **"Decisores e Contatos"** do Dossiê Estratégico aparecem:

- Dados da **empresa no Apollo** (nome, indústria, funcionários, keywords, etc.), quando disponíveis.  
- Lista de **decisores** (nome, cargo, departamento, seniority, e-mail, telefone, LinkedIn) vindos da tabela `decision_makers` e/ou do relatório salvo.

Botões principais:

- **Recarregar** — Lê de novo do banco (`decision_makers` + `companies.raw_data` para Apollo Organization).  
- **Informar Apollo Org ID** (modal) — Permite informar/ajustar o ID da organização no Apollo e refazer a busca.  
- **Extrair Decisores** — Dispara o fluxo de enriquecimento (Apollo + fallbacks).  
- **Enriquecer Contatos (Apollo + Hunter + Phantom)** — Após ter decisores, complementa e-mails/telefones (revelação de contato).

---

### Pré-requisitos

1. **Empresa existente**  
   `company_id` e `company_name` válidos (deal vinculado à company).

2. **Para melhor resultado na busca de decisores:**  
   - **Domain/website** da empresa em `companies.website` ou `companies.domain` (usado pela Edge como `q_organization_domains` quando não há Apollo Org ID).  
   - Ou **Apollo Organization ID** preenchido (manual pelo modal ou já gravado em `companies.apollo_organization_id`).  
   - Dados da Receita Federal em `companies.raw_data.receita_federal` (município, UF, CEP, fantasia) melhoram o fallback por nome + localização.

---

### Fluxo recomendado (ordem cronológica)

| # | Ação do usuário | O que acontece nos bastidores |
|---|------------------|-------------------------------|
| 1 | Garantir **website/domain** do prospect | Se estiver vazio: use "Descobrir Website" no Dossiê (ou no card de Fit) ou edite manualmente. Isso preenche `companies.website`/`domain`, usado pela Edge para buscar a organização no Apollo. |
| 2 | (Opcional) Abrir o modal **"Informar Apollo Org ID"** | Se você já tiver o ID da empresa no Apollo (URL do tipo `.../organizations/XXXXX/people`), informe. O sistema grava em `companies.apollo_organization_id` e usa esse ID na próxima extração. |
| 3 | Clicar em **"Extrair Decisores"** | Chama `handleExtractDecisionMakers` → `runEnrichmentFlow`. O **EnrichmentOrchestrator** monta o input (company_id, company_name, domain, apollo_org_id, city, state, industry, cep, fantasia) e invoca a Edge Function **`enrich-apollo-decisores`**. |
| 4 | Edge **enrich-apollo-decisores** | Usa, nessa prioridade: (1) `apollo_org_id` se existir, (2) busca por `domain`, (3) fallback por nome + cidade/estado/CEP/fantasia. Busca pessoas da organização no Apollo, grava em `decision_makers` e atualiza `companies.raw_data` com dados da organização (Apollo Organization). |
| 5 | Clicar em **"Recarregar"** | Chama `loadDecisorsData()`: lê `decision_makers` por `company_id` e `companies.raw_data` (apollo_organization, etc.), formata e atualiza a lista na aba. |
| 6 | (Opcional) **Enriquecer Contatos** | Após ter decisores na lista, este botão aciona fluxos adicionais (Apollo + Hunter + Phantom) para revelar e-mails/telefones e atualizar os registros. |

---

### O que acontece ao clicar em "Extrair Decisores"

1. **Front (DecisorsContactsTab)**  
   - `handleExtractDecisionMakers` → `runEnrichmentFlow(apolloOrgId?)`.  
   - Se o usuário tiver informado Apollo Org ID no modal, esse ID é gravado em `companies.apollo_organization_id` e enviado no body.  
   - Monta `EnrichmentInput`: company_id, company_name, domain (website), linkedin_url, apollo_org_id (ou extraído da apollo_url), city, state, industry, cep, fantasia.  
   - Chama `enrichCompany(supabase, input)` (EnrichmentOrchestrator).  
   - Exibe toasts de progresso; ao final, aguarda ~1,5 s e chama `loadDecisorsData()` para atualizar a lista.

2. **EnrichmentOrchestrator**  
   - Normaliza o input (extrai `apollo_org_id` da URL se necessário).  
   - Invoca a Edge Function `enrich-apollo-decisores` com esse body.

3. **Edge Function `enrich-apollo-decisores`** (resumo)  
   - Lê `company_id`, `domain`, `apollo_org_id`, cidade, estado, CEP, fantasia, etc.  
   - Se houver `apollo_org_id`, busca a organização diretamente no Apollo.  
   - Se não, usa `domain` para buscar organização por domínio.  
   - Fallback: busca por nome + filtros geográficos (Brasil).  
   - Obtém pessoas (decisores) da organização, grava em `decision_makers` (com `company_id`) e atualiza `companies.raw_data` (e opcionalmente `apollo_organization_id`).  

4. **Persistência**  
   - Decisores ficam em **`decision_makers`** (por company_id).  
   - Dados da organização Apollo ficam em **`companies.raw_data.apollo_organization`** (ou enriched_apollo).  
   - O **full_report** do Dossiê (ao salvar ou ao rodar o pipeline) pode incluir `decisors_report` (decisors + companyApolloOrg) em `stc_verification_history.full_report`.

---

### Resumo rápido — Decisores

- **Ordem sugerida:** (1) Ter website/domain do prospect → (2) Opcional: informar Apollo Org ID → (3) Extrair Decisores → (4) Recarregar para ver a lista → (5) Opcional: Enriquecer Contatos.  
- **Fonte dos dados exibidos:** tabela `decision_makers` + `companies.raw_data` (Apollo Organization).  
- **"Extrair Decisores"** = uma chamada ao orquestrador que chama a Edge `enrich-apollo-decisores`; a Edge usa apollo_org_id ou domain ou nome+filtros para buscar a organização e as pessoas e gravar em `decision_makers`.

---

## Ordem geral recomendada no Dossiê (os dois relatórios)

1. **Website** — Descobrir ou editar o website do prospect.  
2. **Fit de Produtos** — Extrair produtos do prospect → Gerar Fit de Produtos (ou rodar o pipeline inteiro).  
3. **Decisores** — Opcional: informar Apollo Org ID → Extrair Decisores → Recarregar → opcionalmente Enriquecer Contatos.  
4. **Salvar** — Salvar o relatório do Dossiê para persistir `full_report` (product_fit_report, decisors_report, etc.) em `stc_verification_history`.

Se usar **"Executar Enriquecimento Estratégico (Discovery)"**, os passos 1–3 (website, produtos do prospect, fit e decisores) são executados em sequência pelo pipeline, e o passo 4 (persistência do full_report) é feito automaticamente ao final.
