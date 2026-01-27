# Relatório de Mapeamento: Dossiê Estratégico, Enriquecimentos na Tabela de Leads e Reorganização Cirúrgica

**Contexto:** Mapeamento profundo para reorganização cirúrgica. **Nenhuma alteração de código, configuração ou execução.** Fase exclusivamente de levantamento para decisão de desativação/reposição e acionamento no funil.

---

## 1. Onde tudo está hoje

| Onde | Arquivo / Componente | O que dispara |
|------|----------------------|---------------|
| **Ações em Massa** (dropdown "Ações em Massa (N)") | `src/components/icp/QuarantineActionsMenu.tsx` | Handlers passados por `ApprovedLeads.tsx` |
| **Menu individual** (engrenagem na linha) | `src/components/icp/QuarantineRowActions.tsx` | Item azul "Verificação de Uso (STC)" → `setShowReport(true)` |
| **Modal Dossiê Estratégico de Prospecção** | `src/components/icp/QuarantineReportModal.tsx` | Conteúdo: `UsageVerificationCard` = `TOTVSCheckCard` |
| **Conteúdo do Dossiê (11 abas)** | `src/components/totvs/TOTVSCheckCard.tsx` | TabsContent por valor: detection, decisors, digital, competitors, similar, clients, analysis, products, opportunities, intent, executive |
| **Página Leads Aprovados** | `src/pages/Leads/ApprovedLeads.tsx` | Liga `QuarantineActionsMenu` e `QuarantineRowActions` aos handlers e às mutations |

---

## 2. Enriquecimentos na etapa de Leads Aprovados (fora Receita Federal)

Exceto **Receita Federal** (considerada necessária nesta etapa), segue o que cada ação faz, como é acionada e onde está implementada.

### 2.1 Ações em Massa – tabela resumida

| Ação no menu | Handler em ApprovedLeads | Mecanismo (passo a passo) | Informações que deveriam produzir | Arquivos principais | Valor nesta etapa (diagnóstico) |
|--------------|---------------------------|----------------------------|-----------------------------------|----------------------|----------------------------------|
| **Preview das Selecionadas** | `onPreviewSelected` | Abre modal de preview com as empresas selecionadas. Sem API. | Visualização rápida dos leads marcados. | `QuarantineActionsMenu.tsx`, `ApprovedLeads.tsx` (estado + handler) | **Manter.** Leve, sem custo. |
| **Exportar CSV** | `onExportSelected` | Gera CSV a partir dos dados já carregados na tabela. | Arquivo CSV para as selecionadas. | Idem | **Manter.** |
| **Exportar PDF** | `onExportSelected` | Mesmo handler do CSV; geração PDF. | PDF das selecionadas. | Idem | **Manter.** |
| **Atualizar Relatórios** | `onRefreshSelected` | Chama `refetch` / refresh dos dados da quarentena. | Dados da tabela atualizados. | Idem | **Manter.** |
| **Re-Verificar Tudo (V2)** | `onReverifyAllV2` | Hook `useReverifyAllCompanies`: reprocessa empresas (ex.: usage-verification ou equivalente) para todas as `totalCompanies` passadas. | Relatórios STC/verificação atualizados em lote. | `ApprovedLeads.tsx`, `useReverifyAllCompanies`, `QuarantineActionsMenu.tsx` | **Reposicionar.** Envolve verificação pesada em massa; ideal no funil/Discovery sob demanda. |
| **Processar Verificação em Lote** | `handleBulkVerification` | 1) `usage-verification` (Edge Function) por empresa; 2) `enrich-apollo-decisores`; 3) monta `full_report` (detection, decisors, digital); 4) `insert` em `stc_verification_history`. | GO/NO-GO, decisores, dados digitais e relatório completo por empresa. | `ApprovedLeads.tsx` (linhas ~1695–1782), `supabase/functions/usage-verification`, `supabase/functions/enrich-apollo-decisores` | **Mover para o funil.** Agrupa Verifica + Decisores + Digital; alto custo e uso de créditos; faz sentido quando o lead já está em Discovery. |
| **Descobrir CNPJ** | `handleBulkDiscoverCNPJ` | Mutation `discoverCNPJMutation`: Edge Function `discover-cnpj` com `company_name` e `domain`; atualiza `icp_analysis_results` com o CNPJ encontrado. | CNPJ quando não existia. | `ApprovedLeads.tsx` (discoverCNPJMutation ~1478, handleBulkDiscoverCNPJ ~1882), `supabase/functions/discover-cnpj` | **Manter na tabela.** Pré-requisito barato para Receita e outros enriquecimentos. |
| **Receita Federal** | `handleBulkEnrichReceita` | Mutation `enrichReceitaMutation`: serviço `consultarReceitaFederal(analysis.cnpj)` (BrasilAPI/Receita); atualiza `icp_analysis_results` (uf, municipio, porte, cnae, raw_data.receita_federal, etc.) e, se houver, `companies.cnpj_status`. | Dados cadastrais oficiais (CNAE, endereço, porte, situação etc.). | `ApprovedLeads.tsx`, `src/services/receitaFederal.ts` | **Manter.** Necessário para qualificação, conforme combinado. |
| **Apollo (Decisores)** | `handleBulkEnrichApollo` | Mutation `enrichApolloMutation`: `supabase.functions.invoke('enrich-apollo-decisores', { company_id, analysis_id, company_name, domain, … })`. Consome créditos Apollo. | Decisores (nomes, cargos, emails, LinkedIn) por empresa. | `ApprovedLeads.tsx` (~668–702, 1587), `supabase/functions/enrich-apollo-decisores` | **Mover para o funil.** Alto custo; ideal só no momento do contato/Discovery. |
| **360° Completo** | `handleBulkEnrich360` | Mutation `enrich360Mutation`: serviço `enrichment360Simplificado(...)` (sem Edge Function); grava em `icp_analysis_results.raw_data.enrichment_360` (scores, analysis, calculated_at). | Scores de presença digital, maturidade, saúde e análise 360°. | `ApprovedLeads.tsx` (~838–905, 1679), `src/services/enrichment360.ts` | **Reposicionar.** Pode ser útil na qualificação se for “leve”; se depender de scan/APIs pesadas, melhor no funil. |
| **Enriquecer Website & LinkedIn** | `handleBulkEnrichWebsite` | Para cada empresa: `handleEnrichWebsite(id)`. Esse handler: 1) `find-prospect-website` (fetch direto à Edge Function); 2) `scan-prospect-website` (tenant_id, company_id, cnpj, website_url…) e persistência dos resultados. | Website encontrado, fit de site, produtos/tecnologias detectadas, LinkedIn quando aplicável. | `ApprovedLeads.tsx` (~1287–133x, 1626–1664), `supabase/functions/find-prospect-website`, `supabase/functions/scan-prospect-website` | **Mover para o funil.** Custo e tempo altos; valor máximo quando o lead está em Discovery. |
| **Aprovar e Mover para Pool** | `onBulkApprove` | Fluxo de aprovação e movimento para pool/pipeline. | Leads aprovados indo para o próximo estágio. | `ApprovedLeads.tsx`, `QuarantineActionsMenu.tsx` | **Manter.** Core do fluxo. |
| **Restaurar Descartadas** | `onRestoreDiscarded` | Restaura itens descartados (lógica específica do módulo). | Leads de volta à base de aprovados. | Idem | **Manter.** |
| **Deletar Selecionadas** | `handleDelete` → `onDeleteSelected` | Remoção em lote dos itens selecionados. | Limpeza da lista. | Idem | **Manter.** |

### 2.2 Menu individual (engrenagem) – itens que acionam enriquecimento / relatório

| Item do menu | O que faz | Abre Dossiê? | Observação |
|--------------|-----------|----------------|------------|
| **Ver Detalhes** | `handlePreview` → abre preview da empresa | Não | Mantém. |
| **Editar/Salvar Dados** | Navega para `/search?companyId=…` ou avisa que precisa aprovar | Não | Mantém. |
| **Verificação de Uso (STC)** | `setShowReport(true)` | **Sim** — abre o modal Dossiê Estratégico (`QuarantineReportModal` com `TOTVSCheckCard`) | Este é o gatilho do Dossiê na etapa de leads. Objetivo da cirurgia: esse “disparo” do Dossiê passar a existir principalmente no funil (Discovery), não na tabela de leads. |
| **Ver Relatório Completo** | `onOpenExecutiveReport()` → relatório executivo | Não (outro modal) | Pode permanecer ou ser acessível também a partir do funil. |
| **Atualizar relatório** | `onRefresh(company.id)` | Não | Mantém. |
| **Criar Estratégia** | Navega para `/account-strategy?company=…` | Não | Mantém. |
| **Enriquecer Website & LinkedIn** | `onEnrichWebsite(company.id)` | Não | Mesmo fluxo que “Enriquecer Website & LinkedIn” em massa: `find-prospect-website` + `scan-prospect-website`. Mover esse tipo de ação para o funil. |
| **Calcular Intenção de Compra** | `onCalculatePurchaseIntent(company.id)` | Não | Avaliar se fica só no funil ou também na tabela (custo vs. uso). |
| **Abrir Website** | Abre URL do website | Não | Mantém. |
| **Deletar Permanentemente** | `onDelete(company.id)` | Não | Mantém. |

---

## 3. Relatório por aba do Dossiê Estratégico de Prospecção

O Dossiê é o `TOTVSCheckCard` dentro de `QuarantineReportModal`. Cada aba é um `TabsContent` com um componente e fontes de dados próprias.

### 3.1 Aba 1 – Fit Produtos (valor da tab: `detection`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Fit de Produtos” / “Verificação de Uso” (primeira aba). |
| **Componente** | `ProductFitScoreCard` + `ProductRecommendationsList`; dados vêm de `useProductFit`. |
| **Mecanismo (passo a passo)** | 1) `useProductFit({ companyId, tenantId, enabled })` chama a Edge Function `calculate-product-fit` com `company_id` e `tenant_id`. 2) Se `companyId` ou `tenantId` faltam, o hook devolve score 0 e erro “companyId e tenantId são obrigatórios”. 3) “Verificar Agora” chama `handleVerify`: limpa cache (simple_totvs_checks, stc_verification_history), remove/invalida queries `product-fit` e `latest-stc-report`, `setEnabled(true)` e faz `refetch()` do `useProductFit` (ou seja, nova chamada a `calculate-product-fit`). 4) Dados podem ser lidos de `latestReport.full_report.product_fit_report` quando já existem. |
| **Informações que deveriam produzir** | Score de fit (0–100), nível (high/medium/low), confiança, justificativa geral, match CNAE/setor, lista de produtos recomendados com score e justificativa. |
| **Arquivos envolvidos** | `src/hooks/useProductFit.ts`, `src/components/totvs/TOTVSCheckCard.tsx` (detection + handleVerify), `src/components/totvs/ProductFitScoreCard.tsx`, `src/components/totvs/ProductRecommendationsList.tsx`, `supabase/functions/calculate-product-fit/index.ts`. Persistência/leitura: `stc_verification_history.full_report.product_fit_report` e/ou resposta da Edge Function. |
| **Valor para a operação** | **Alto** quando funciona: é o “motor de fit” que compara empresa vs. catálogo do tenant. Hoje quebra se tenant não tem produtos cadastrados ou se `tenantId`/`companyId` não chegam corretamente ao Dossiê (“Nenhum produto cadastrado no catálogo do tenant”; fit 0%). |
| **Onde faz mais sentido** | Tanto na qualificação (se o fit for usado para filtrar na tabela) quanto no Discovery (para priorizar e abordar). O problema atual é técnico (dados do tenant + fluxo), não o lugar onde a aba está. |

### 3.2 Aba 2 – Decisores (valor da tab: `decisors`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Decisores” / “Decisores & Contatos”. |
| **Componente** | `DecisorsContactsTab`. |
| **Mecanismo (passo a passo)** | 1) Carrega dados salvos (`savedData` / `full_report.decisors_report`) ou chama `loadDecisorsData()` (busca organização Apollo e decisores no banco). 2) “Extrair Decisores”: chama Edge Function `enrich-apollo-decisores` (company_id, company_name, domain, apollo_org_id, …). 3) Alternativa: PhantomBuster via `performFullLinkedInAnalysis(companyName, linkedinUrl, domain, companyId)`. 4) Contatos podem ser revelados via `revealCorporateContact` / `revealPersonalContact`. 5) Resultado é passado a `onDataChange` e salvo em `stc_verification_history.full_report.decisors_report` (e/ou tabelas de decisores). |
| **Informações que deveriam produzir** | Lista de decisores (nome, cargo, email, telefone, LinkedIn), URL da empresa no LinkedIn, métricas (total leads, decisores, emails). |
| **Arquivos envolvidos** | `src/components/icp/tabs/DecisorsContactsTab.tsx`, `src/services/phantomBusterEnhanced.ts`, `src/services/revealContact.ts`, `supabase/functions/enrich-apollo-decisores/index.ts`. Banco: `companies`, `decision_makers` (ou equivalente), `stc_verification_history.full_report`. |
| **Valor para a operação** | **Alto** no momento do contato (Discovery): identifica quem abordar e como. Na tabela de leads, em massa, custo e uso de créditos são altos. |
| **Onde faz mais sentido** | **Funil (Discovery).** Manter a aba no Dossiê, mas o Dossiê deve ser acionado principalmente a partir do funil; na tabela de leads, o item “Verificação de Uso (STC)” que abre o Dossiê pode ser escondido ou substituído por um atalho “Abrir no funil”. |

### 3.3 Aba 3 – Digital (valor da tab: `digital`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Digital” / “Digital Intelligence”. |
| **Componente** | `DigitalIntelligenceTab`. |
| **Mecanismo (passo a passo)** | Usa `companyId`, `companyName`, `cnpj`, `domain` (ou `discoveredWebsite`), setor e tenant; lê/escreve `savedData` / `full_report.digital_report`. Pode usar análises de presença digital, tecnologias, SEO. Fluxo exato depende de quais Edge Functions ou serviços o `DigitalIntelligenceTab` chama internamente. |
| **Informações que deveriam produzir** | Presença digital, tecnologias usadas, indicadores de maturidade digital, dados úteis para abordagem. |
| **Arquivos envolvidos** | `src/components/intelligence/DigitalIntelligenceTab.tsx` (ou em `icp/tabs`), `TOTVSCheckCard.tsx` (value="digital"). Persistência: `stc_verification_history.full_report.digital_report`. |
| **Valor para a operação** | **Médio–alto** quando o lead está sendo trabalhado (contexto para pitch e timing). Em massa na tabela tende a ser caro. |
| **Onde faz mais sentido** | **Funil (Discovery).** |

### 3.4 Aba 4 – Competitors (valor da tab: `competitors`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Competitors”. |
| **Componente** | `CompetitorsTab`. |
| **Mecanismo (passo a passo)** | Recebe `companyId`, `companyName`, `cnpj`, `domain`, `tenantId`, `similarCompanies` compartilhadas; lê/escreve `full_report.competitors_report`. Provavelmente usa ou pode usar Edge Functions como `process-competitors`, `search-competitors`, etc. |
| **Informações que deveriam produzir** | Lista de concorrentes, posicionamento, oportunidades de displacement. |
| **Arquivos envolvidos** | `src/components/icp/tabs/CompetitorsTab.tsx`, `TOTVSCheckCard.tsx`. `supabase/functions/process-competitors`, `search-competitors*` se existirem. |
| **Valor para a operação** | **Médio** na preparação de abordagem e em contas maiores. |
| **Onde faz mais sentido** | **Funil (Discovery)** ou em estágios mais avançados. |

### 3.5 Aba 5 – Similar (valor da tab: `similar`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Similar” / “Empresas Similares”. |
| **Componente** | `SimilarCompaniesTab`. |
| **Mecanismo (passo a passo)** | Usa `companyId`, `companyName`, `cnpj`, `tenantId`, `tenantSectorCode`, `tenantNicheCode`; dados em `full_report.similar_companies_report`. Pode chamar lógica de similaridade (embedding, CNAE/setor, etc.). |
| **Informações que deveriam produzir** | Empresas similares para referência de mercado e argumentação. |
| **Arquivos envolvidos** | `src/components/intelligence/SimilarCompaniesTab.tsx`, `TOTVSCheckCard.tsx`. Funções como `discover-similar-companies`, `mc9-similar-companies` se usadas. |
| **Valor para a operação** | **Médio** para estratégia e mensagem. |
| **Onde faz mais sentido** | **Funil (Discovery)** ou sob demanda. |

### 3.6 Aba 6 – Clients (valor da tab: `clients`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Clients” / “Client Discovery”. |
| **Componente** | `ClientDiscoveryTab`. |
| **Mecanismo (passo a passo)** | Usa `companyId`, `companyName`, `cnpj`, tenant; lê/escreve `full_report.clients_report`. Pode usar `client-discovery-wave7` ou equivalente. |
| **Informações que deveriam produzir** | Clientes da empresa alvo, casos de uso, prova social. |
| **Arquivos envolvidos** | `src/components/icp/tabs/ClientDiscoveryTab.tsx`, `supabase/functions/client-discovery-wave7` se existir. |
| **Valor para a operação** | **Médio** para abordagem e storytelling. |
| **Onde faz mais sentido** | **Funil (Discovery).** |

### 3.7 Aba 7 – 360° (valor da tab: `analysis`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “360°” / “Análise 360°”. |
| **Componente** | `Analysis360Tab`. |
| **Mecanismo (passo a passo)** | Usa `companyId`, `companyName`, `stcResult` (fit/detection), `similarCompanies`, tenant; lê/escreve `full_report.analysis_report`. Pode consumir `raw_data.enrichment_360` ou chamar `enrich-company-360` / `generate-360-analysis`. |
| **Informações que deveriam produzir** | Visão consolidada 360° (scores, maturidade, oportunidades/ameaças). |
| **Arquivos envolvidos** | `src/components/intelligence/Analysis360Tab.tsx`, `TOTVSCheckCard.tsx`. `supabase/functions/enrich-company-360`, `generate-360-analysis`; `companies.raw_data.enrichment_360` ou análogo. |
| **Valor para a operação** | **Alto** para preparação de reunião e priorização no funil. |
| **Onde faz mais sentido** | **Funil (Discovery).** |

### 3.8 Aba 8 – Products (valor da tab: `products`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Products” / “Produtos Recomendados”. |
| **Componente** | `RecommendedProductsTab`. |
| **Mecanismo (passo a passo)** | Usa dados do fit/detection (`stcResult`), `similarCompanies`, tenant; lê/escreve `full_report.products_report`. Alimentado pelo mesmo motor de fit (CNAE, setor, tenant_products). |
| **Informações que deveriam produzir** | Produtos do tenant recomendados para aquela empresa, com justificativa. |
| **Arquivos envolvidos** | `src/components/icp/tabs/RecommendedProductsTab.tsx`, `TOTVSCheckCard.tsx`, dados de `calculate-product-fit` e catálogo do tenant. |
| **Valor para a operação** | **Alto** se o motor de fit estiver estável; complementa a aba Fit Produtos. |
| **Onde faz mais sentido** | **Funil (Discovery)** e, quando o motor for confiável, pode refletir na tabela (ex.: coluna de fit). |

### 3.9 Aba 9 – Oportunidades (valor da tab: `opportunities`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Oportunidades”. |
| **Componente** | `OpportunitiesTab`. |
| **Mecanismo (passo a passo)** | Usa `companyName`, setor, `stcResult`, tenant; lê/escreve `full_report.opportunities_report`. Geralmente resume oportunidades de venda com base no que já foi analisado. |
| **Informações que deveriam produzir** | Oportunidades identificadas, próximos passos sugeridos. |
| **Arquivos envolvidos** | `src/components/icp/tabs/OpportunitiesTab.tsx`, `TOTVSCheckCard.tsx`. |
| **Valor para a operação** | **Médio–alto** no Discovery para focar o discurso. |
| **Onde faz mais sentido** | **Funil (Discovery).** |

### 3.10 Aba 10 – Intenção (valor da tab: `intent`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Intenção” / “Sinais de Intenção v3.0”. |
| **Componente** | `IntentSignalsCardV3`. |
| **Mecanismo (passo a passo)** | Recebe objeto company (id, name, cnpj, domain, region, sector, niche). Provavelmente usa ou pode usar `detect-intent-signals-v3` ou similar para sinais de compra. |
| **Informações que deveriam produzir** | Sinais de intenção de compra, temperatura, recomendação de abordagem. |
| **Arquivos envolvidos** | `src/components/competitive/IntentSignalsCardV3.tsx`, `TOTVSCheckCard.tsx`. `supabase/functions/detect-intent-signals-v3` etc. |
| **Valor para a operação** | **Alto** para timing e priorização no funil. |
| **Onde faz mais sentido** | **Funil (Discovery).** |

### 3.11 Aba 11 – Executive (valor da tab: `executive`)

| Aspecto | Descrição |
|---------|-----------|
| **Nome na UI** | “Executive” / “Sumário Executivo”. |
| **Componente** | `ExecutiveSummaryTab`. |
| **Mecanismo (passo a passo)** | Agrega `stcResult`, contagem de similares, competidores, clientes, maturity score, tenant; lê/escreve `full_report.executive_report`. Não chama API própria; consolida o que já foi calculado nas outras abas. |
| **Informações que deveriam produzir** | Resumo executivo, recomendação de abordagem, próximos passos. |
| **Arquivos envolvidos** | `src/components/icp/tabs/ExecutiveSummaryTab.tsx`, `TOTVSCheckCard.tsx`. |
| **Valor para a operação** | **Alto** para quem toma decisão (AE/gerente) no momento do contato. |
| **Onde faz mais sentido** | **Funil (Discovery)**; é a “síntese” do Dossiê. |

---

## 4. Esboço da reorganização cirúrgica (sem implementar)

### 4.1 Princípio

- **Na tabela de Leads Aprovados:** qualificação com dados baratos e necessários (Receita Federal, Descobrir CNPJ, setor/segmento, fit quando for um único motor estável e barato).
- **No funil (Discovery):** enriquecimento “pesado” (Website & LinkedIn, Apollo, Verificação em Lote, 360°, decisores, digital, etc.) e o **Dossiê Estratégico** como painel principal de inteligência por lead.

### 4.2 O que desativar ou remover da etapa “Leads Aprovados”

- **No menu “Ações em Massa”:**
  - Ocultar ou remover: **Processar Verificação em Lote**, **Apollo (Decisores)**, **360° Completo**, **Enriquecer Website & LinkedIn**.
  - Avaliar: **Re-Verificar Tudo (V2)** — se for pesado, mover para o funil ou deixar apenas como ação explícita “avançada” com aviso de custo.
- **No menu individual (engrenagem):**
  - **Verificação de Uso (STC):** não “deletar” a ação, mas **redirecionar** para o funil: ao clicar, abrir o lead no Pipeline/Discovery e abrir o Dossiê a partir dali; ou exibir um CTA “Abrir no Funil e ver Dossiê” em vez de abrir o Dossiê direto na tabela.
  - **Enriquecer Website & LinkedIn:** remover ou mover para o funil (reaproveitar o mesmo handler quando o contexto for “lead no Discovery”).

### 4.3 O que manter na etapa “Leads Aprovados”

- Preview, Exportar CSV/PDF, Atualizar Relatórios.
- **Descobrir CNPJ** e **Receita Federal.**
- Aprovar e Mover para Pool, Restaurar Descartadas, Deletar Selecionadas.
- Ver Detalhes, Editar/Salvar Dados, Ver Relatório Completo, Atualizar relatório, Criar Estratégia, Abrir Website, Deletar (e, se fizer sentido, Calcular Intenção de Compra apenas como opção explícita).

### 4.4 Onde o Dossiê e os enriquecimentos pesados passam a ser acionados

- **Etapa de movimento de funil:** ao **“Mover para Pipeline”** (ou equivalente), o lead passa a existir no **Pipeline de Vendas**.
- **Discovery:** na etapa de Discovery (ou na primeira etapa em que o lead é “trabalhado”), o sistema deve:
  - Oferecer um botão/clique **“Abrir Dossiê Estratégico”** (ou “Verificação de Uso (STC)” no contexto do funil).
  - Abrir o mesmo modal/página de Dossiê (`QuarantineReportModal` + `TOTVSCheckCard` ou uma versão reutilizável por `company_id`), mas com contexto “lead no funil” em vez de “lead na tabela de aprovados”.
- **Acionamento “a qualquer momento”:** os dados já gravados no Supabase (`stc_verification_history.full_report`, `companies.raw_data`, `decision_makers`, etc.) são **lidos** sempre que o Dossiê for aberto, em qualquer etapa do funil. Ou seja:
  - Não é obrigatório rodar de novo Verificação / Decisores / Digital; o front só precisa abrir o Dossiê e carregar por `company_id` (e, se existir, `stc_verification_history` ou tabelas equivalentes).
  - Se algum dado faltar, o próprio Dossiê pode expor “Executar Verificação”, “Extrair Decisores”, “Enriquecer Website”, etc., **nesse** contexto (funil), consumindo créditos apenas quando o usuário decidir enriquecer aquele lead.

### 4.5 Como os dados gravados no Supabase são acionados a qualquer momento no funil

- **Onde está hoje:** Relatórios e enriquecimentos são gravados em:
  - `stc_verification_history` (por `company_id`): `full_report` com abas (detection, decisors_report, digital_report, competitors_report, similar_companies_report, clients_report, analysis_report, products_report, opportunities_report, executive_report, product_fit_report).
  - `companies`: `raw_data` (receita_federal, enrichment_360, linkedin_url, website, etc.), e tabelas relacionadas (`decision_makers`, etc.).
- **No funil:** Qualquer tela que abra o Dossiê (ou um painel “Inteligência” por lead) deve:
  1. Receber `company_id` (ou equivalente do lead/oportunidade no pipeline).
  2. Buscar `stc_verification_history` por `company_id` (ordenado por `created_at` desc, limite 1) e, se existir, usar `full_report` para preencher as abas do Dossiê.
  3. Buscar `companies` por id para `raw_data`, `linkedin_url`, `website`, etc.
  4. Se faltar dado em alguma aba, exibir “Executar agora” para aquela aba (Fit, Decisores, Digital, etc.), disparando a Edge Function ou serviço correspondente **nesse** contexto (funil), e depois persistindo no mesmo Supabase. Assim, na próxima abertura do Dossiê (na tabela ou no funil), os dados já estarão lá.
- **Conclusão:** Não é preciso “mover” dados; basta **mover o ponto de abertura do Dossiê** para o funil (Discovery) e garantir que o Dossiê leia sempre por `company_id` a partir das mesmas tabelas. Os relatórios pertinentes ficam disponíveis a qualquer momento porque já estão no banco.

### 4.6 Ordem sugerida para a cirurgia (quando for implementar)

1. **Ajustes técnicos já identificados:** CORS e 400 nas Edge Functions (`scan-prospect-website`, `usage-verification`, etc.) e garantia de que `tenant_products`/`tenantId` alimentam corretamente o Fit de Produtos.
2. **Desativar/ocultar** no `QuarantineActionsMenu` os itens de enriquecimento pesado (Processar Verificação em Lote, Apollo, 360°, Website & LinkedIn) e, no menu da engrenagem, o item “Enriquecer Website & LinkedIn” e o comportamento atual de “Verificação de Uso (STC)” que abre o Dossiê na tabela.
3. **No funil (Discovery):** garantir que exista um ponto de entrada (botão/aba “Dossiê” ou “Verificação de Uso (STC)”) que abra o mesmo Dossiê por `company_id`, carregando dados já persistidos (4.5) e permitindo disparar enriquecimentos sob demanda.
4. **Motor de fit:** tratar “Fit de produtos não funciona” e “decisores não puxam nada” como prioridade dentro do Dossiê (e nas Edge Functions/APIs que o alimentam), para que o Dossiê seja de fato o “motor de fit robusto e efetivo” no momento do contato.

---

## 5. Resumo: enriquecimentos x etapa

| Enriquecimento | Manter na tabela de leads? | Onde deve viver depois da cirurgia |
|----------------|----------------------------|-------------------------------------|
| Receita Federal | **Sim** | Tabela de Leads Aprovados |
| Descobrir CNPJ | **Sim** | Tabela de Leads Aprovados |
| Preview / Exportar / Atualizar / Aprovar / Restaurar / Deletar | **Sim** | Tabela de Leads Aprovados |
| Processar Verificação em Lote (Verifica + Decisores + Digital) | **Não** | Funil (Discovery), via Dossiê ou fluxo equivalente |
| Apollo (Decisores) | **Não** | Funil (Discovery), aba Decisores do Dossiê |
| 360° Completo | **Não** (ou opcional com aviso) | Funil (Discovery), aba 360° do Dossiê |
| Enriquecer Website & LinkedIn | **Não** | Funil (Discovery), acionado pelo Dossiê ou pela etapa |
| Re-Verificar Tudo (V2) | **Avaliar** (custo/tempo) | Preferencialmente funil ou ação “avançada” com aviso |
| **Modal Dossiê Estratégico** (aberto por “Verificação de Uso (STC)”) | **Não** como ação principal na tabela | **Sim** no funil (Discovery): “Abrir Dossiê” por lead; dados lidos do Supabase a qualquer momento |

---

*Documento apenas de mapeamento e planejamento. Nenhuma alteração de código, configuração ou execução foi feita.*
