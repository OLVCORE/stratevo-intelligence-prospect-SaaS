# Relatório Completo — Abas, Relatórios e Inteligência por Fonte de Dados

**Objetivo:** Documentar como cada aba e relatório funciona, de onde vêm os dados (APIs, onboarding, tenant), onde a inteligência se perde e como usar todo o potencial das APIs já configuradas (.env / Vercel) para gerar relatórios vivos e completos.

**Referência de tenant de exemplo:** OLV INTERNACIONAL (CNPJ 67.867.580/0001-90), onboarding com 25 produtos extraídos do website, 14 concorrentes, setores/nichos, ICP e Diferenciais.

**Data:** Jan 2025

---

## 1. Resumo executivo

| Situação | Onde ocorre | Causa raiz provável |
|----------|-------------|----------------------|
| **Fit 0% e “Nenhum produto cadastrado no catálogo do tenant”** | Dossiê (aba Fit Produtos) ao abrir para um *prospect* (ex.: UNI LUVAS) | `calculate-product-fit` busca em `tenant_products WHERE tenant_id = ?`. Ou o tenant em contexto no Dossiê não é o mesmo do onboarding, ou os 25 produtos estão em outro `tenant_id`/tabela, ou o schema (`is_active` vs `ativo`) não casa. |
| **Decisores/Leads 0 no Dossiê** | Aba Decisores | Enriquecimento não foi executado para aquele prospect (Apollo/LinkedIn). O botão “Executar Enriquecimento Estratégico (Discovery)” no deal em Discovery chama find-website → scan-website → enrich-apollo; o Dossiê aberto pela Quarentena/Leads não dispara esse pipeline automaticamente. |
| **“Nenhum dado de enriquecimento nesta etapa”** | Banner amarelo no Dossiê | O Dossiê exibe isso quando não há `full_report` em `stc_verification_history` para aquele `company_id`/empresa. O pipeline de Discovery (ou Verificação em Lote na tabela de leads) é que grava esse relatório. |
| **Scraping do prospect não comparado com onboarding** | Fit / Recomendações | O desenho correto é: 1) tenant tem produtos em `tenant_products` (onboarding / “Extrair Produtos”); 2) prospect tem website e/ou produtos em `prospect_extracted_products` ou no resultado de `scan-prospect-website`; 3) `calculate-product-fit` e o MC-5 matching em `scan-prospect-website` comparam prospect vs tenant. Se `tenant_products` está vazio no contexto usado pela Edge Function, o resultado é 0% e “Nenhum produto cadastrado”. |
| **Modal Discovery não abria** | DealDetailsDialog | `useMemo` era chamado depois de `if (!deal) return null`, violando as regras de Hooks. **Corrigido:** `useMemo(hasAtLeastOneEnrichedSource)` foi movido para antes do early return. |

---

## 2. Fluxo de dados: Onboarding → Catálogo → Relatórios

```
[Onboarding – Dados Básicos]
  ├─ CNPJ → Receita Federal (BrasilAPI/Receita) → razão social, CNAE, capital, endereço
  ├─ Website → "Extrair Produtos" / "360º Completo"
  │     └─ Edge Function: scan-website-products ou scan-website-products-360
  │     └─ INSERE em: tenant_products (tenant_id = tenant.id)
  └─ "25 produtos extraídos" = leitura de tenant_products WHERE tenant_id = tenant.id

[Catálogo de Produtos] (Configuração ICP / Produtos)
  └─ useTenantProducts() → tenant_products WHERE tenant_id = tenant.id AND is_active = true
  └─ Exibe os mesmos 25 produtos se o tenant em contexto for o mesmo do onboarding.

[Dossiê para um PROSPECT (ex.: UNI LUVAS)]
  ├─ Contexto: company_id = prospect, tenant = useTenant() = tenant logado (ex.: OLV)
  ├─ Fit Produtos: useProductFit(companyId=prospect, tenantId=tenant.id)
  │     └─ Edge Function: calculate-product-fit(company_id=prospect, tenant_id=OLV)
  │     └─ Backend: SELECT * FROM tenant_products WHERE tenant_id = OLV AND (is_active|ativo)=true
  │     └─ Se retorno vazio → "Nenhum produto ativo encontrado para o tenant" → fit 0%
  └─ Decisores: enrich-apollo-decisores(company_id=prospect, …) → decision_makers + full_report.decisors_report
  └─ Digital / Outros: full_report.digital_report etc., preenchidos ao “Salvar” ou ao rodar verificações.
```

Conclusão: a inteligência de fit e de “produtos recomendados” depende de **tenant_products** estar populado para o **mesmo tenant_id** que o front envia ao abrir o Dossiê. Se o tenant em contexto for outro (ou se os produtos do onboarding foram gravados com outro identificador), o Fit fica 0% e as sugestões vazias.

---

## 3. Funcionamento por aba / relatório

### 3.1 Dossiê Estratégico de Prospecção (TOTVSCheckCard dentro de QuarantineReportModal)

O Dossiê é aberto a partir de:

- **Leads Aprovados / Quarentena:** ação “Verificação de Uso (STC)” ou equivalente.
- **Discovery (Pipeline SDR):** “Abrir Dossiê Estratégico” no DealDetailsDialog.

Em todos os casos, o tenant em uso é o do `useTenant()` (tenant selecionado no header, ex.: OLV INTERNACIONAL).

| Aba | Fonte de dados | API / Tabela | Status típico | Observação |
|-----|----------------|--------------|---------------|------------|
| **TOTVS / Fit Produtos** | `useProductFit` → `calculate-product-fit` | Edge Function `calculate-product-fit`; lê `companies`, `tenant_products`, `icp_profiles_metadata` | Quebrado quando aparece “Nenhum produto cadastrado no catálogo do tenant” | Garantir que `tenant_id` enviado é o do tenant que fez onboarding e que `tenant_products` tem linha com esse `tenant_id` e `is_active`/`ativo` true. |
| **Decisores** | `DecisorsContactsTab`: loadDecisorsData + “Extrair Decisores” | `enrich-apollo-decisores`; tabelas `decision_makers`, `companies`; salva em `full_report.decisors_report` | Vazio até o usuário clicar “Extrair Decisores” (ou até o pipeline de Discovery rodar enrich-apollo para esse prospect) | Apollo consome créditos; chamada explícita necessária. |
| **Digital** | `DigitalIntelligenceTab`; prioridade `full_report.digital_report` | Leitura/escrita em `stc_verification_history.full_report.digital_report`; pode usar análises de site/technologies | Depende de ter sido rodada alguma verificação digital e de ter sido salvo no `full_report` | Melhor resultado quando scan-website ou 360° já rodaram para o prospect. |
| **Competitors** | `CompetitorsTab` | `full_report.competitors_report`; Edge Functions tipo `process-competitors`, `search-competitors-serper` | Preenchido quando há execução de busca de concorrentes para o prospect | Concorrentes do *tenant* (ex.: 14 de OLV) vêm do ICP/onboarding; concorrentes do *prospect* vêm dessas funções. |
| **Similar** | `SimilarCompaniesTab` | `full_report.similar_companies_report`; lógica de similaridade (CNAE, setor, embedding) | Sob demanda ou quando há rotina que gera esse trecho do relatório | |
| **Clients** | `ClientDiscoveryTab` | `full_report.clients_report`; ex.: `client-discovery-wave7` | Sob demanda | |
| **360° / analysis** | `Analysis360Tab` | `full_report.analysis_report`; pode usar `enrichment_360`, `enrich-company-360` | Depende de enriquecimento 360° já executado para o prospect | |
| **Products** | `RecommendedProductsTab` | Alimentado pelo mesmo motor de fit (`product_fit_report` / `calculate-product-fit`) e `tenant_products` | Mesmo problema do Fit: se `tenant_products` estiver vazio no backend, não há recomendações | |
| **Oportunidades** | `OpportunitiesTab` | `full_report.opportunities_report`; resume análises das outras abas | Derivado das outras abas; fica pobre se Fit/Decisores/Digital estiverem vazios | |
| **Intenção** | `IntentSignalsCardV3` | Company + APIs tipo `detect-intent-signals-v3` | Sob demanda | |
| **Executive** | Resumo executivo | Agregação de `full_report` | Só fica “vivo” quando pelo menos algumas abas foram preenchidas e salvas | |

### 3.2 Scraping do website do prospect vs onboarding do tenant

- **Onboarding do tenant (ex.: OLV):**  
  “Extrair Produtos” / “360º Completo” usa `scan-website-products` ou `scan-website-products-360` com o **website do tenant** e grava em **tenant_products** com `tenant_id` do tenant.  
  No exemplo, “25 produtos extraídos” são esses registros.

- **Prospect (ex.: UNI LUVAS):**  
  O pipeline “Executar Enriquecimento Estratégico (Discovery)” chama:
  1. `find-prospect-website` (razão social, CNPJ do prospect),
  2. `scan-prospect-website` (tenant_id, company_id do prospect, website_url),
  3. `enrich-apollo-decisores` (company_id do prospect, etc.).

  Dentro de `scan-prospect-website` já existe lógica de matching (MC-5) que:
  - busca `tenant_products` por `tenant_id`;
  - compara com produtos extraídos do site do prospect;
  - se `tenant_products` estiver vazio, o matching é skipped e o score fica zero.

Ou seja: a comparação “scraping do prospect ↔ produtos do tenant” existe na Edge Function `scan-prospect-website`, mas **só funciona se** `tenant_products` tiver dados para o `tenant_id` passado (o mesmo do tenant em contexto no app).

Para a IA gerar recomendações “comparando prospect com onboarding”:

1. **Tenant:** produtos em `tenant_products` (tenant_id correto).
2. **Prospect:** website encontrado e escaneado (`find-prospect-website` + `scan-prospect-website`), e/ou produtos em `prospect_extracted_products` se houver.
3. **Motor de fit:** `calculate-product-fit` (e o MC-5 dentro de `scan-prospect-website`) usa `tenant_products` + dados da empresa prospect.  
Se (1) falhar, tanto o Fit no Dossiê quanto as sugestões de produto ficam vazias ou 0%.

### 3.3 ICP Principal e relatórios de configuração ICP

Esses relatórios falam do **tenant** (ex.: OLV), não do prospect. Por isso conseguem mostrar dados ricos quando o onboarding e a configuração ICP estão completos.

| Seção / Relatório | Fonte de dados | Status |
|-------------------|----------------|--------|
| **Perfil do Tenant / Resumo Executivo** | `icp_profiles_metadata`, setores, nichos, faturamento alvo, funcionários, concorrentes do tenant | Funciona quando o ICP foi gerado e vinculado ao tenant (ex.: 14 concorrentes, setor Manufatura, nichos, etc.). |
| **Concorrentes Diretos** | Cadastro de concorrentes do tenant (onboarding etapa 5 ou Configuração ICP) | Ex.: 14 concorrentes com CNPJ, setor, capital — vêm do que foi cadastrado/sincronizado para aquele tenant. |
| **Matriz BCG** | Nichos, clientes base, benchmarking; às vezes `strategic_action_plans` ou lógica local | “0 clientes, 0 benchmarking” é esperado se o tenant não cadastrou clientes/benchmark; o eixo de “1 nicho” reflete o dado de nichos do ICP. |
| **Comparação Produtos / Análise Competitiva** | `tenant_products` (produtos do tenant) + `tenant_competitor_products` (produtos dos concorrentes) | “25 seus produtos • 96 concorrentes” depende de produto extraído/cadastrado no tenant e de produtos dos concorrentes terem sido carregados (ex.: via scan ou cadastro). |
| **Plano Estratégico** | Tabela `strategic_action_plans` | Erro “Could not find the table 'public.strategic_action_plans'” indica que a tabela não existe no projeto; por isso “Plano Estratégico não gerado”. |

Ou seja: a “inteligência” do ICP e dos relatórios do tenant **está** sendo usada onde os dados vêm de onboarding/ICP (concorrentes, setores, nichos, produtos do tenant). O que quebra no Dossiê é a parte que depende de **tenant_products + prospect** (fit, decisores, digital, etc.) quando o contexto do tenant ou da gravação dos produtos está incorreto.

---

## 4. APIs e variáveis de ambiente (.env / Vercel)

APIs e variáveis que influenciam diretamente as abas e relatórios acima:

| API / Serviço | Variável (ex.) | Uso |
|---------------|-----------------|-----|
| **calculate-product-fit** | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY | Fit de produtos no Dossiê; lê `companies`, `tenant_products`, `icp_profiles_metadata`. |
| **find-prospect-website** | SERPER_API_KEY (ou similar) | Descobrir website do prospect no pipeline de Discovery. |
| **scan-prospect-website** | SUPABASE_*, OPENAI_API_KEY; pode usar Serper | Scraping do prospect + MC-5 matching com `tenant_products`. |
| **scan-website-products** / **scan-website-products-360** | SUPABASE_*, OPENAI_API_KEY | Extrair produtos do **tenant** no onboarding → gravar em `tenant_products`. |
| **enrich-apollo-decisores** | APOLLO_API_KEY (ou integração Apollo) | Decisores/contatos no Dossiê e no pipeline de Discovery. |
| **Receita Federal / BrasilAPI** | Conforme implementação (BrasilAPI, ReceitaWS, etc.) | Dados cadastrais no onboarding e no enriquecimento de empresas. |
| **PhantomBuster / LinkedIn** | Configuração própria do PhantomBuster | Alternativa/complemento a Apollo para Decisores. |
| **Detecção de intenção** | Conforme `detect-intent-signals-v3` | Aba Intenção no Dossiê. |

Para “usar todo o potencial” das APIs já configuradas no .env/Vercel:

1. Garantir que **tenant_id** em todas as chamadas de Dossiê/Discovery seja o do tenant que tem produtos em `tenant_products` (em geral o tenant logado).
2. Garantir que **tenant_products** esteja populado para esse tenant (onboarding “Extrair Produtos” ou 360º já executado e persistido).
3. Garantir que o pipeline “Executar Enriquecimento Estratégico (Discovery)” seja de fato acionado quando o usuário quer enriquecer o prospect (find-website → scan-prospect-website → enrich-apollo), e que o resultado seja refletido em `full_report` (salvando no `stc_verification_history` quando aplicável).

---

## 5. Onde a inteligência se perde — checklist de verificação

1. **tenant_products vazio para o tenant do contexto**
   - No Supabase: `SELECT tenant_id, COUNT(*) FROM tenant_products WHERE tenant_id = '<id_do_tenant_OLV>' GROUP BY tenant_id;`
   - Se 0 linhas: ou o onboarding salvou em outro `tenant_id`, ou a extração não gravou em `tenant_products`. Ajustar onboarding/scan-website-products para gravar sempre com o `tenant_id` que o app usa no header/contexto.

2. **Schema `tenant_products`: is_active vs ativo**
   - `calculate-product-fit` tenta primeiro `is_active = true`, depois `ativo = true`. Se a tabela tiver outro nome de coluna ou sempre null, a query pode retornar vazio. Conferir migrações e colunas reais em `tenant_products`.

3. **Dossiê aberto com outro tenant**
   - Se o usuário trocou de tenant no header após o onboarding, o Dossiê usa o tenant atual. Os 25 produtos só aparecem no fit se forem do tenant atual. Comportamento esperado; a recomendação é deixar explícito “Fit em relação ao tenant X” e garantir que o tenant ativo seja o desejado ao abrir o Dossiê.

4. **Enriquecimento não executado para o prospect**
   - Decisores 0, Digital vazio e “Nenhum dado de enriquecimento” são esperados até que:
     - no Discovery: o usuário clique em “Executar Enriquecimento Estratégico (Discovery)”, ou
     - na tabela de leads: rode “Enriquecer Website & LinkedIn” / “Processar Verificação em Lote” (conforme desenho atual).
   - Não há enriquecimento automático ao abrir o Dossiê; isso é por desenho (custo e governança).

5. **Scraping do prospect não “comparado” com onboarding na UI**
   - A comparação ocorre no backend (`scan-prospect-website` MC-5, `calculate-product-fit`). Na UI, ela aparece como Fit de Produtos e Produtos Recomendados. Se o backend retorna 0% por `tenant_products` vazio, a UI só pode mostrar vazio. Corrigir o backend/tenant_id resolve.

6. **Tabela strategic_action_plans inexistente**
   - O “Plano Estratégico não gerado” e o 404 em `strategic_action_plans` indicam que essa tabela não existe no schema. É preciso criar a tabela (e, se houver, a Edge Function que a utiliza) para esse relatório passar a funcionar.

---

## 6. Recomendações para relatórios vivos e completos

| Prioridade | Ação |
|------------|------|
| **Alta** | Confirmar em produção/staging que, para o tenant OLV, existe registros em `tenant_products` com `tenant_id = <id_OLV>` e que `calculate-product-fit` recebe exatamente esse `tenant_id` quando o Dossiê é aberto para um prospect. Ajustar onboarding ou origem de `tenant_id` se necessário. |
| **Alta** | Padronizar em `tenant_products` uma única coluna de ativo (`is_active` ou `ativo`) e garantir que o onboarding e `calculate-product-fit` usem a mesma. |
| **Média** | No Dossiê (ou no Discovery), explicitar de qual tenant é o “catálogo de produtos” usado no Fit (ex.: “Fit em relação a: OLV INTERNACIONAL”) e garantir que o tenant do header seja o esperado. |
| **Média** | Garantir que, após “Executar Enriquecimento Estratégico (Discovery)”, o resultado do scan e do Apollo seja persistido em `stc_verification_history.full_report` (product_fit_report, decisors_report, digital_report conforme aplicável), para que “pelo menos 1 fonte enriquecida” e as abas do Dossiê se preencham. |
| **Média** | Se o produto deseja “Plano Estratégico” na configuração ICP: criar a tabela `strategic_action_plans` (e funções que a usam) ou desligar/ocultar essa funcionalidade até existir. |
| **Baixa** | Revisar erros 400 em `sdr_deals` (filtros, colunas, RLS) para que a lista de deals e o contexto do Discovery carreguem corretamente, evitando telas em branco ou modais que não abrem por falha de dados. |

---

## 7. Exemplo de tenant (OLV) — o que já funciona hoje

Conforme o exemplo de onboarding e relatórios que você descreveu:

- **Dados Básicos:** CNPJ, Receita, website, “25 produtos extraídos” → extração e (quando gravada em `tenant_products` com o tenant_id certo) catálogo.
- **Setores e Nichos:** Manufatura, 9 nichos.
- **Cliente Ideal (ICP):** Sudeste, 50–500 funcionários, R$ 20M–R$ 50M, Médio/Grande.
- **Diferenciais:** Vários itens de texto.
- **Concorrentes:** 14 cadastrados (CNPJ, setor, capital, etc.).
- **ICP Benchmarking:** “ICP gerado com sucesso”.
- **Catálogo de Produtos:** 25 produtos, origem “Website”, exibidos quando o contexto é o tenant OLV e a query em `tenant_products` retorna dados.
- **Comparação Produtos / Matriz BCG / Diferenciais no ICP:** alimentados por esses dados do tenant e por produtos de concorrentes quando existirem.

Ou seja: para **qualquer tenant** que passe pelo mesmo fluxo de onboarding (CNPJ, Extrair Produtos, Setores, Nichos, Diferenciais, Concorrentes, ICP Benchmarking), esses relatórios do **Perfil do Tenant** tendem a funcionar desde que:

1. Os dados sejam salvos nas tabelas corretas e com o `tenant_id` que o app usa.
2. Produtos do tenant estejam em `tenant_products` com esse `tenant_id`.

O que ainda falha em muitos casos é a **camada prospect**: Fit, Decisores, Digital e recomendações no Dossiê para uma **empresa investigada**, porque aí entram `tenant_products` (para o tenant certo) + enriquecimento do prospect (website, Apollo, etc.). Este relatório indica exatamente onde verificar e o que corrigir nessa camada.

---

*Relatório gerado para auditoria técnica e restauração da inteligência nos relatórios e abas. Recomenda-se validar em ambiente de staging com um tenant que já tenha onboarding completo (ex.: OLV) e um prospect com website conhecido, repetindo os passos de verificação da seção 5.*
