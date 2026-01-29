# Relatório — Adoção Integral das Práticas OLV (STRATEVO ONE)

**Projeto:** STRATEVO ONE (`stratevo-intelligence-prospect`)  
**Referência:** `olv-intelligence-prospect-v2` (enriquecimento forte e confiável, persistência automática, orquestração)  
**Data:** Jan 2025  
**Protocolo:** Cirurgia precisa; sem refatoração; sem alterar RLS/tabelas; apenas reuso de funções/hooks/Edges existentes.

---

## 1. O que foi reaproveitado do OLV v2

| Prática OLV | Onde está no Stratevo | Status |
|-------------|------------------------|--------|
| Apollo como fonte canônica de decisores | Edge `enrich-apollo-decisores`; Aba Decisores; pipeline Discovery | ✅ Já existia |
| Serper como motor de descoberta | Edge `serper-search`; `websiteDiscovery`; `digital-intelligence-analysis` | ✅ Já existia |
| Ordem Lock → Apollo Company → Apollo People → Receita | Hook `useEnrichmentOrchestration` | ✅ Já existia; **agora tem ponto de uso** (Etapa 1) |
| Discovery como ato soberano (find → scan → fit → apollo → **digital**) | Hook `useDiscoveryEnrichmentPipeline` | ✅ **Ajustado:** passo 5 `digital-intelligence-analysis` incluído e persistido (Etapa 2) |
| Persistência automática em `stc_verification_history.full_report` | Após pipeline Discovery | ✅ Já existia para fit/decisores/website; **agora inclui `digital_report`** completo e `enrichment_sources: ['website','product_fit','apollo','digital']` |
| Bloco B (Fit, Intenção, Risco, Comentário) exclusivamente de `full_report` | `DealDetailsDialog`: `latestReport?.full_report`, `suggestIntencaoFromReport`, `suggestRiscoFromReport`, `buildComentarioFromReport` | ✅ Já conformidade; nenhuma lógica paralela |

---

## 2. Onde o fluxo foi centralizado

| Fluxo | Onde está centralizado |
|-------|-------------------------|
| **Orquestração (Lock → Apollo Company → Apollo People → Receita)** | Botão **“Enriquecer Empresa (ordem recomendada)”** na **CompanyDetailPage** (detalhe da empresa). Chama `orchestrateEnrichment({ companyId, cnpj })`. Um único ponto de uso do `useEnrichmentOrchestration`. |
| **Discovery (find → scan → fit → apollo → digital)** | Botão **“Executar Enriquecimento Estratégico (Discovery)”** no **DealDetailsDialog** (stage Discovery). Chama `runPipeline()` de `useDiscoveryEnrichmentPipeline`. Todo o resultado (incl. análise digital) é persistido em `stc_verification_history.full_report` sem botão Salvar. |
| **Dossiê como fonte única da verdade** | `stc_verification_history.full_report` com `product_fit_report`, `recommended_products`, `decisors_report`, `digital_report`, `enrichment_sources`. O Dossiê (QuarantineReportModal / TOTVSCheckCard) lê desse relatório. |

---

## 3. Quais análises agora persistem automaticamente

| Análise | Quando roda | Onde persiste | Antes | Depois |
|---------|-------------|---------------|-------|--------|
| find-prospect-website | Pipeline Discovery (passo 1) | — | — | — |
| scan-prospect-website | Pipeline Discovery (passo 2) | — | — | — |
| calculate-product-fit | Pipeline Discovery (passo 3) | `full_report.product_fit_report`, `recommended_products` | ✅ Já persistia | ✅ Mantido |
| enrich-apollo-decisores | Pipeline Discovery (passo 4) | `decision_makers` + `full_report.decisors_report` | ✅ Já persistia | ✅ Mantido |
| **digital-intelligence-analysis** | **Pipeline Discovery (passo 5)** | **`full_report.digital_report`** | ❌ Só ao clicar Salvar | ✅ **Persiste ao fim do pipeline** |

Ao clicar **“Executar Enriquecimento Estratégico (Discovery)”**, as cinco etapas rodam em sequência e o `full_report` é atualizado/inserido em `stc_verification_history`. Não é necessário clicar em Salvar para que o Dossiê exiba fit, decisores e análise digital ao reabrir.

---

## 4. Antes x Depois (funcional)

| Aspecto | Antes | Depois |
|---------|--------|--------|
| **useEnrichmentOrchestration** | Nenhuma tela chamava; hook órfão. | CompanyDetailPage tem botão “Enriquecer Empresa (ordem recomendada)” que chama `orchestrateEnrichment`. |
| **Ordem Discovery** | find → scan → fit → apollo → (fim). | find → scan → fit → apollo → **digital-intelligence-analysis** → persistência. |
| **Análise digital no Discovery** | Não rodava no pipeline. | Roda como passo 5 e o resultado vai para `full_report.digital_report`. |
| **Dossiê após Discovery** | Fit, decisores, website; digital vazio se não tivesse sido rodado/gravado antes. | Fit, decisores, website e **análise digital** persistidos ao fim do pipeline; Dossiê “vivo” ao reabrir. |
| **enrichment_sources** | `['website','product_fit','apollo']`. | `['website','product_fit','apollo','digital']`. |

---

## 5. Arquivos modificados / criados (escopo restrito)

| Arquivo | Alteração |
|---------|-----------|
| **src/pages/CompanyDetailPage.tsx** | 1) Import `useEnrichmentOrchestration`. 2) Chamada ao hook e variável `isOrchestrating`. 3) Novo botão com Tooltip “Enriquecer Empresa (ordem recomendada)” que chama `orchestrateEnrichment({ companyId: id, cnpj: company?.cnpj })`. Nada mais alterado. |
| **src/hooks/useDiscoveryEnrichmentPipeline.ts** | 1) Comentário de ordem atualizado para incluir passo 5. 2) Novo bloco após enrich-apollo-decisores: invoca `digital-intelligence-analysis` com `companyName`, `cnpj`, `domain`, `sector`; armazena resultado em `digitalReport`. 3) `enrichmentSources` passa a incluir `'digital'`. 4) `digital_report` já era incluído em `newFullReportParts`; passa a usar o objeto retornado pela análise digital quando disponível. Nenhuma outra função ou fluxo alterado. |
| **RELATORIO_ADOCAO_PRACTICAS_OLV_STRATEVO.md** | Novo arquivo (este relatório). |

Nenhuma tabela, RLS, API nova ou refatoração em outros componentes.

---

## 6. Checklist de governança

- [x] Nenhuma nova tabela criada.
- [x] Nenhum RLS alterado.
- [x] Nenhuma API/Edge nova; reuso de `digital-intelligence-analysis`, `useEnrichmentOrchestration`, `useDiscoveryEnrichmentPipeline`.
- [x] Persistência automática após pipeline Discovery (sem dependência de botão Salvar para fit/decisores/digital).
- [x] Nenhum mock, placeholder ou simulação.
- [x] useEnrichmentOrchestration passou a ter um ponto de uso obrigatório (CompanyDetailPage).
- [x] Discovery segue a ordem: find-prospect-website → scan-prospect-website → calculate-product-fit → enrich-apollo-decisores → digital-intelligence-analysis.
- [x] Bloco B utiliza apenas dados de `full_report` (Fit, Intenção, Risco, Comentário); já estava em conformidade.
- [x] Cirurgia precisa: apenas os arquivos e trechos acima; resto preservado.

---

## 7. Critério de sucesso

Considera-se atendido quando:

- Um lead triado tem **Discovery executado** (botão “Executar Enriquecimento Estratégico (Discovery)”).
- O resultado inclui: **Fit real** (product_fit_report), **decisores reais** (decisors_report), **análise digital persistida** (digital_report).
- Ao **reabrir o Dossiê**, as abas exibem fit, decisores e análise digital sem nova execução e sem precisar clicar em Salvar.

**Orquestração:** Na tela de detalhe da empresa (CompanyDetailPage), o botão **“Enriquecer Empresa (ordem recomendada)”** executa Lock → Apollo Company → Apollo People → Receita, em um único fluxo orientado pelo `useEnrichmentOrchestration`.

---

*Relatório gerado após adoção das práticas OLV no STRATEVO ONE com protocolo de segurança (cirurgia precisa, sem reforma geral).*
