# Relatório Técnico — Fase 3 Discovery: Correção Estrutural de Tenant, Fit de Produtos e Persistência de Inteligência

**Projeto:** STRATEVO ONE  
**Data:** Jan 2025  
**Escopo:** Correção cirúrgica sem refatoração recreativa, sem regressão, sem UI fake; resultado visível na tela (Fit > 0%, Dossiê preenchido, decisores e pré-sugestões no Bloco B).

---

## 1. Resumo executivo do problema corrigido

O Discovery e o Dossiê exibiam **Fit 0%**, **“Nenhum produto cadastrado no catálogo do tenant”** e **“Nenhum dado de enriquecimento”** mesmo quando o tenant tinha produtos em `tenant_products` e o prospect tinha website válido. As causas endereçadas foram:

1. **Mensagem de catálogo vazio pouco clara:** o sistema mostrava o texto técnico da API em vez de uma mensagem objetiva para o usuário.
2. **Pipeline incompleto:** “Executar Enriquecimento Estratégico (Discovery)” chamava find-website → scan-website → Apollo, mas **não** chamava `calculate-product-fit` nem persistia o resultado no Dossiê.
3. **Ausência de persistência:** o pipeline não gravava em `stc_verification_history.full_report`; ao reabrir o Dossiê, as abas continuavam vazias e o banner “Nenhum dado de enriquecimento” permanecia.
4. **Backend já ajustado (Etapa 2 prévia):** `calculate-product-fit` já tinha leitura normalizada de ativo (`is_active` → `ativo` → fail-safe “todos do tenant”) e fail-safe sem nova coluna/schema.

Com as alterações desta fase, o **tenant_id** segue sendo o do tenant ativo (`useTenant()`), o **Fit** usa o catálogo correto (e exibe mensagem clara quando o catálogo está vazio), o **pipeline** chama `calculate-product-fit` na ordem correta e **persiste** automaticamente em `stc_verification_history.full_report`, permitindo que o Dossiê e o Bloco B mostrem Fit, produtos recomendados, decisores e pré-sugestões assim que o enriquecimento é executado.

---

## 2. Lista exata de arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/totvs/TOTVSCheckCard.tsx` | Etapa 1: quando `overall_justification` indica catálogo vazio (“Nenhum produto” + “tenant”/“catálogo”), exibir a mensagem canônica *“Este tenant não possui catálogo de produtos configurado para cálculo de Fit.”* em vez do texto bruto da API. |
| `src/hooks/useDiscoveryEnrichmentPipeline.ts` | Etapas 3 e 4: (a) inserir passo **3** `calculate-product-fit` entre scan-prospect-website e enrich-apollo-decisores; (b) após os 4 passos, montar `full_report` com `product_fit_report`, `recommended_products`, `decisors_report`, `digital_report`, `enrichment_sources` e fazer **update** no último registro de `stc_verification_history` por `company_id`, ou **insert** se não houver registro; (c) invalidar queries `stc-latest`, `stc-history` e `product-fit`. |

**Não alterados nesta fase (já corretos ou pré-ajustados):**

- `supabase/functions/calculate-product-fit/index.ts` — Etapa 2 já aplicada (leitura ativo: `is_active` → `ativo` → fail-safe todos do tenant; sem nova coluna/schema).
- `src/components/sdr/DealDetailsDialog.tsx` — já usa `tenantId` de `useTenant()`, `useProductFit(companyId, tenantId)`, `useDiscoveryEnrichmentPipeline(companyId, tenantId)` e pré-sugestões do Bloco B a partir de `latestReport?.full_report` e `productFit`; sem mudanças.
- Nenhuma nova tabela, RLS ou pipeline paralelo.

---

## 3. APIs acionadas e ordem de execução

Ao clicar em **“Executar Enriquecimento Estratégico (Discovery)”**, a ordem é:

| # | API / Ação | Input principal | Output / Efeito |
|---|------------|------------------|------------------|
| 1 | `find-prospect-website` | `razao_social`, `cnpj`, `tenant_id` | `website` do prospect (quando ainda não havia URL). |
| 2 | `scan-prospect-website` | `tenant_id`, `company_id`, `website_url`, `razao_social`, `cnpj` | Scraping do site, matching MC-5 com `tenant_products`, dados preliminares de fit. |
| 3 | `calculate-product-fit` | `company_id`, `tenant_id` | `fit_score`, `fit_level`, `products_recommendation`, `analysis.overall_justification`; usado para `product_fit_report` e `recommended_products` no `full_report`. |
| 4 | `enrich-apollo-decisores` | `company_id`, `company_name`, `domain`, etc. | Decisores gravados em `decision_makers`; em seguida o pipeline lê `decision_makers` por `company_id` e monta `decisors_report`. |

Após o passo 4, o pipeline:

- Monta `full_report` com: `product_fit_report`, `recommended_products`, `decisors_report` (de `decision_makers`), `digital_report` (ex.: `{ website }`), `enrichment_sources: ["website","product_fit","apollo"]`.
- Busca o último registro em `stc_verification_history` por `company_id`; se existir, faz **update** em `full_report` (merge com o existente); se não existir, faz **insert** com `company_id`, `company_name`, `cnpj`, `status`, etc. e esse `full_report`.
- Invalida as queries `['stc-latest', companyId]`, `['stc-history', companyId]` e `['product-fit', companyId, tenantId]`.

---

## 4. Antes x Depois (comportamento funcional)

| Aspecto | Antes | Depois |
|---------|--------|--------|
| Mensagem quando tenant sem catálogo | Texto da API: “Nenhum produto cadastrado no catálogo do tenant” / “Nenhum produto ativo encontrado para o tenant”. | Mensagem única e clara: *“Este tenant não possui catálogo de produtos configurado para cálculo de Fit.”* |
| Passo calculate-product-fit no pipeline | Não era chamado. | Chamado como passo **3**, entre scan-prospect-website e enrich-apollo-decisores, com mesmo `tenant_id` do tenant ativo. |
| Persistência no Dossiê | Nenhuma; o pipeline não gravava em `stc_verification_history`. | Após os 4 passos, grava/atualiza `full_report` em `stc_verification_history` (update no último por `company_id` ou insert). |
| Banner “Nenhum dado de enriquecimento” | Aparecia ao reabrir o Dossiê após enriquecimento. | Deixa de aparecer quando há `product_fit_report`, `decisors_report` ou `digital_report` em `full_report` (condição “pelo menos 1 fonte enriquecida” no Bloco B). |
| Fit > 0% e produtos recomendados | Só apareciam se o usuário já tivesse salvo o Dossiê manualmente com fit. | Aparecem após “Executar Enriquecimento Estratégico”, pois o pipeline chama `calculate-product-fit` e persiste `product_fit_report` e `recommended_products`. |
| Decisores no Dossiê | Só após salvar manualmente ou rodar enrich-apollo pela aba Decisores. | Preenchidos após o pipeline (Apollo grava em `decision_makers` e o pipeline monta `decisors_report` a partir deles). |
| Bloco B (Fit, Intenção, Risco, Comentário) | Pré-sugestões dependiam de `latestReport?.full_report` e `productFit` já preenchidos. | Passam a dispor de dados reais após o pipeline, pois `full_report` é persistido com `product_fit_report`, `decisors_report`, `digital_report` e `enrichment_sources`. |

---

## 5. Evidências de que os critérios de sucesso foram atendidos

- **Fit > 0% quando há produtos:** o pipeline chama `calculate-product-fit(company_id, tenant_id)` com o tenant ativo; o backend usa `tenant_products` com fallback de ativo já implementado. O resultado é persistido em `full_report.product_fit_report` e as queries de product-fit e stc-latest são invalidadas, de modo que a UI exibe o novo Fit.
- **Produtos recomendados visíveis:** `product_fit_report` (e `recommended_products` derivado) é salvo em `full_report`; o Dossiê e o Bloco B leem de `latestReport.full_report`, portanto as recomendações aparecem após o enriquecimento.
- **Decisores preenchidos:** o pipeline chama `enrich-apollo-decisores` e, em seguida, lê `decision_makers` por `company_id` para montar `decisors_report`; esse objeto é incluído em `full_report`, que a aba Decisores do Dossiê utiliza.
- **Dossiê deixa de ficar vazio após enriquecimento:** a persistência em `stc_verification_history.full_report` com `product_fit_report`, `decisors_report`, `digital_report` e `enrichment_sources` faz com que `hasAtLeastOneEnrichedSource` seja verdadeiro e o banner “Nenhum dado de enriquecimento” não seja exibido quando há pelo menos uma dessas fontes.
- **Sem UI fake:** não há mock, placeholder ou dados inventados; tudo vem das APIs já configuradas e da escrita em `decision_makers` e `stc_verification_history`.

---

## 6. Checklist de governança (sem regressão)

- [x] Apenas as alterações descritas no prompt cirúrgico foram aplicadas.
- [x] Nenhum componente, hook, modal ou fluxo validado foi removido ou refatorado de forma ampla.
- [x] Nenhuma nova tabela criada; RLS não foi alterado.
- [x] Nenhum pipeline paralelo ou API nova; uso exclusivo das já configuradas (.env/Vercel).
- [x] Sem mock, placeholder ou lógica simulada; sem inventar dados quando a API retorna vazio.
- [x] Enriquecimento only por ação explícita (“Executar Enriquecimento Estratégico (Discovery)”).
- [x] `tenant_id` em Discovery e Dossiê é o do tenant ativo (`useTenant()`); repasse explícito em `useProductFit` e `useDiscoveryEnrichmentPipeline` já existia e foi mantido.
- [x] Leitura de produtos ativos em `calculate-product-fit` permanece com a lógica já ajustada (Etapa 2): `is_active` → `ativo` → fail-safe todos do tenant; sem nova coluna e sem mudança de schema.

---

*Relatório gerado para auditoria técnica da Fase 3 Discovery. Critério de sucesso: prospect com website válido + tenant com produtos em `tenant_products` → Fit > 0%, produtos recomendados visíveis, decisores preenchidos e Dossiê populado após enriquecimento.*
