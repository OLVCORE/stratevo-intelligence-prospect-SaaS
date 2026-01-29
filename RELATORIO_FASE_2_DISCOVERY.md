# Relatório Técnico — Fase 2 (Discovery) — STRATEVO ONE

**Contexto:** Implementação da Fase 2 (Discovery) conforme protocolo executivo. Sem alteração de tabelas, RLS ou lógica de Leads Aprovados; apenas evolução do fluxo no Pipeline/Kanban e no Dossiê Estratégico quando aberto a partir do estágio Discovery.

**Data:** Jan 2025

---

## 1. Resumo Executivo

A Fase 2 introduz no **Pipeline de Vendas (Kanban)** o uso do Dossiê Estratégico a partir do estágio **Discovery**, controles de **Fit** e **Intenção** para decisão executiva, e a ação **“Criar Deal”** (GO) para avançar o lead ao próximo estágio do funil quando o Fit está definido.

- **Botão “Abrir Dossiê Estratégico”** no card do Lead quando `stage === 'discovery'`, abrindo o `QuarantineReportModal` em modo somente leitura (Discovery), com `companyId` e `companyName` do deal.
- **Dossiê no Discovery:** leitura de `stc_verification_history.full_report` e exibição via `useLatestSTCReport`; quando não há dados, exibe CTA “Executar Enriquecimento nesta etapa (Discovery)” **sem** executar enriquecimento automaticamente.
- **Fit** (Baixo | Médio | Alto) e **Intenção** (Exploratória | Ativa | Estratégica) persistidos em **tags** do deal (`discovery_fit_*`, `discovery_intencao_*`), sem novas tabelas.
- **Ação “Criar Deal”** disponível somente quando o deal está em Discovery e o Fit está definido; ao acionar, o deal é movido para o próximo estágio do funil (via `useMoveDeal`), mantendo o lead rastreável.

Nenhuma alteração estrutural no backend; todas as mudanças restringem-se ao frontend (Pipeline, cards, modal do Dossiê, detalhes do deal).

---

## 2. Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/sdr/DraggableDealCard.tsx` | Nova prop `onOpenDossie?: (deal: Deal) => void`. Botão “Abrir Dossiê Estratégico” visível quando `deal.stage === 'discovery'` e `onOpenDossie` definido; ícone Brain. |
| `src/components/sdr/KanbanColumn.tsx` | Nova prop `onOpenDossie?: (deal: Deal) => void` repassada a cada `DraggableDealCard`. |
| `src/components/sdr/EnhancedKanbanBoard.tsx` | Estado `dossieOpen`, `dossieDeal`; handler `handleOpenDossie`; renderização de `QuarantineReportModal` quando o Dossiê é aberto a partir do Discovery (`companyId`, `companyName` do deal, `discoveryOnly={true}`). |
| `src/components/icp/QuarantineReportModal.tsx` | Nova prop `discoveryOnly?: boolean`. Quando `discoveryOnly`: botão “Descartar” oculto; bloco CTA exibido quando `!latestReport?.full_report` (“Executar Enriquecimento nesta etapa (Discovery)”). |
| `src/components/sdr/DealDetailsDialog.tsx` | Seção **Discovery — Fit e Intenção** na aba Detalhes quando `deal.stage === 'discovery'`: dois `Select` (Fit: Baixo/Médio/Alto; Intenção: Exploratória/Ativa/Estratégica). Persistência em `tags` do deal (`discovery_fit_*`, `discovery_intencao_*`) via `useUpdateDeal`. Botão **“Criar Deal — avançar para [próximo estágio]”** visível apenas quando Fit definido e próximo estágio existe; ao clicar, `useMoveDeal` move o deal para o próximo estágio. Uso de `usePipelineStages` para obter o próximo estágio. |

---

## 3. Arquivos NÃO Alterados

- **Backend:** Nenhuma alteração em tabelas, RLS, Edge Functions ou políticas.
- **Leads Aprovados:** `ApprovedLeads.tsx`, `QuarantineActionsMenu`, `QuarantineRowActions`, hooks de enriquecimento e de quarentena permanecem como estão.
- **Tabelas:** `sdr_deals`, `sdr_pipeline_stages`, `stc_verification_history`, `companies` — sem mudanças de schema.
- **useDeals / usePipelineStages / useMoveDeal / useLatestSTCReport:** Sem alteração de contrato ou de implementação (apenas consumo nos componentes indicados).
- **TOTVSCheckCard:** Não alterado; continua recebendo `latestReport` e exibindo/executando conforme já existente. O CTA de enriquecimento no Discovery foi implementado no próprio `QuarantineReportModal` quando `discoveryOnly` e sem `full_report`.

---

## 4. Fluxo Antes x Depois

| Aspecto | Antes | Depois |
|--------|--------|--------|
| Abertura do Dossiê no Pipeline | Não havia; Dossiê era aberto somente a partir de Leads Aprovados (STC/Verificação de Uso). | No card do deal em estágio Discovery surge o botão “Abrir Dossiê Estratégico”; ao clicar, abre o `QuarantineReportModal` em modo Discovery (`companyId`/`companyName` do deal, `discoveryOnly`). |
| Dados exibidos no Dossiê (Discovery) | N/A | `useLatestSTCReport(companyId, companyName)` → `stc_verification_history.full_report`; se vazio, CTA “Executar Enriquecimento nesta etapa (Discovery)” sem execução automática. |
| Fit e Intenção no Discovery | Não existiam. | Na aba Detalhes do deal (quando `stage === 'discovery'`), seção “Discovery — Fit e Intenção” com Fit (Baixo/Médio/Alto) e Intenção (Exploratória/Ativa/Estratégica), persistidos em `tags` do deal. |
| Avançar deal após Discovery | Apenas drag-and-drop entre colunas ou ações já existentes. | Botão “Criar Deal — avançar para [próximo estágio]” na aba Detalhes, só quando Fit definido; ao clicar, o deal é movido para o próximo estágio do funil (GO). |
| Ações Aprovar/Descartar no modal | Sempre visíveis no `QuarantineReportModal`. | Em uso “só Discovery” (`discoveryOnly`), o botão “Descartar” não é exibido. |

---

## 5. Pontos de Atenção

1. **Tags do deal:** Fit e Intenção usam as tags `discovery_fit_baixo|medio|alto` e `discovery_intencao_exploratoria|ativa|estrategica`. Outras tags do deal são preservadas. Qualquer lógica futura que dependa de `tags` deve considerar esses prefixos.
2. **Estágio “discovery”:** O código usa `deal.stage === 'discovery'`. O estágio efetivo vem de `sdr_pipeline_stages.key`; se o key do estágio de Discovery mudar no banco, será necessário ajustar essa comparação (ou passar a usar o `key` vindo dos estágios).
3. **Próximo estágio:** O “Criar Deal” avança para o próximo estágio na lista ordenada por `order_index` dos estágios não fechados. Se não houver próximo estágio, o botão não é exibido.
4. **QuarantineReportModal com `analysisId` vazio:** No fluxo Discovery, o modal é aberto com `analysisId=""`. O modo `discoveryOnly` desativa “Descartar” e exibe o CTA quando não há relatório; nenhuma ação de aprovação em lote ou análise de quarentena é usada nesse contexto.
5. **Enriquecimentos pesados (Apollo, Website+LinkedIn, 360°, Fit de Produtos):** O escopo da Fase 2 não implementa botões/trigger desses enriquecimentos dentro do Discovery; o CTA apenas informa que “Executar Enriquecimento nesta etapa (Discovery)” é o caminho desejado, sem acionar automaticamente nenhuma função.

---

## 6. Checklist de Governança

- [x] Nenhuma tabela nova criada.
- [x] Nenhuma alteração em RLS ou políticas de segurança.
- [x] Nenhuma alteração em Edge Functions ou serviços de backend.
- [x] Fluxo de Leads Aprovados e de Quarentena permanece intacto.
- [x] Dossiê no Discovery apenas lê dados existentes (`full_report`, `companies`) e exibe CTA quando não há dados.
- [x] Fit e Intenção persistidos em campo já existente (`tags` do deal).
- [x] “Criar Deal” apenas move o deal de estágio via `useMoveDeal`, sem criar entidade nova de deal.
- [x] Botão “Abrir Dossiê Estratégico” só aparece no estágio Discovery e quando o callback é fornecido pelo Kanban.

---

## 7. Conclusão

**Fase 2 concluída. Relatório gerado. Aguardando auditoria para liberação do próximo ciclo.**
