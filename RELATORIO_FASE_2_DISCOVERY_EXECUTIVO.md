# Relatório Executivo — Fase 2 (Discovery) — STRATEVO ONE

## Remodelagem executiva do Deal, Dossiê e experiência do SDR

**Data:** Jan 2025

---

## 1. Resumo Executivo

A Fase 2 (Discovery) estabelece o **DealDetailsDialog** como **centro único do deal** e o **Dossiê Estratégico** como “cérebro estratégico” acessado **de dentro** do dialog, eliminando duplicidade cognitiva (“Criar Deal” vs “Abrir Prospecção” vs “Abrir Dossiê”).

**Princípio aplicado:** *Discovery não cria dados. Discovery decide.*

- **Clique no card** (qualquer estágio) → abre **sempre** o DealDetailsDialog.
- **No Discovery**, o dialog exibe três blocos: **A (Contexto read-only)**, **B (Decisão — Fit, Intenção, Risco, Comentário)** e **C (CTA Abrir Dossiê Estratégico)**.
- O Dossiê abre **apenas** a partir do CTA dentro do dialog (BLOCO C), em modo `discoveryOnly`, sem botão “Descartar” e com CTA de enriquecimento quando não há dados.
- **Ação GO:** botão **“GO — Avançar para [próximo estágio]”** só aparece quando **Fit** e **Intenção** estão definidos; ao clicar, o deal é movido para o próximo estágio via `useMoveDeal`.

Nenhuma alteração em tabelas, RLS, Leads Aprovados ou Quarentena.

---

## 2. Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/sdr/DraggableDealCard.tsx` | **Removidos** o botão “Abrir Dossiê Estratégico” do card e a prop `onOpenDossie`. O card só dispara `onClick(deal)` → abre DealDetailsDialog. |
| `src/components/sdr/KanbanColumn.tsx` | **Removida** a prop `onOpenDossie`. Repasse apenas de `onDealClick`. |
| `src/components/sdr/EnhancedKanbanBoard.tsx` | **Removidos** estado `dossieOpen`/`dossieDeal`, handler `handleOpenDossie` e a renderização do `QuarantineReportModal`. O Dossiê não é mais aberto a partir do Kanban. |
| `src/components/sdr/DealDetailsDialog.tsx` | **(1)** Quando `deal.stage === 'discovery'`: **BLOCO A** — contexto read-only (Empresa, CNPJ, Setor/CNAE, ICP Score, Temperatura, Website, LinkedIn) a partir de `deal.companies` e parsing de `deal.description`. **(2)** **BLOCO B** — “Decisão Estratégica — Discovery”: Fit do Produto, Intenção do Cliente, Risco Percebido, Comentário Executivo; persistência em tags (`discovery_fit_*`, `discovery_intencao_*`, `discovery_risco_*`, `discovery_comentario:...`). **(3)** **BLOCO C** — CTA “Abrir Dossiê Estratégico” que abre `QuarantineReportModal` com `companyId`, `companyName`, `discoveryOnly`; modal renderizado **dentro** do dialog. **(4)** Botão **“GO — Avançar para [próximo estágio]”** só quando Fit e Intenção definidos; usa `useMoveDeal`. Import de `QuarantineReportModal` e estado `dossieOpen`. |
| `src/components/icp/QuarantineReportModal.tsx` | **Sem alteração nesta etapa.** Mantém `discoveryOnly`, CTA “Executar Enriquecimento nesta etapa (Discovery)” quando sem dados e ocultação do “Descartar” em modo Discovery. |

---

## 3. Arquivos NÃO Alterados

- **Backend:** tabelas, RLS, migrations, Edge Functions.
- **Leads Aprovados:** `ApprovedLeads.tsx`, `QuarantineActionsMenu`, `QuarantineRowActions`, hooks de enriquecimento e quarentena.
- **Quarentena:** fluxo de aprovação/descarte e abertura do Dossiê a partir de Leads Aprovados.
- **useDeals, usePipelineStages, useMoveDeal, useLatestSTCReport:** sem mudança de contrato ou implementação.
- **TOTVSCheckCard:** inalterado.
- **DealFormDialog (“Criar Novo Deal”):** mantido como está; o protocolo proíbe alterar fluxos paralelos. A recomendação “não criar deal de novo no Discovery” é de experiência; o botão “+ Novo Deal” no Kanban permanece fora do escopo desta fase.

---

## 4. Fluxo Antes x Depois

| Aspecto | Antes | Depois |
|--------|--------|--------|
| Clique no card (Discovery) | Abria DealDetailsDialog **e** havia botão “Abrir Dossiê Estratégico” **no card**, abrindo o Dossiê à parte. | Clique no card → abre **só** DealDetailsDialog. Dossiê é aberto **apenas** pelo CTA “Abrir Dossiê Estratégico” **dentro** do dialog (BLOCO C). |
| Conteúdo do DealDetailsDialog (Discovery) | Detalhes gerais + seção “Discovery — Fit e Intenção” + botão “Criar Deal — avançar…”. | **BLOCO A** (contexto read-only) → **BLOCO B** (Fit, Intenção, Risco, Comentário) → **BLOCO C** (CTA Dossiê) → botão **“GO — Avançar para [próximo estágio]”**. |
| Persistência da decisão Discovery | Tags `discovery_fit_*`, `discovery_intencao_*`. | Tags `discovery_fit_*`, `discovery_intencao_*`, `discovery_risco_*`, `discovery_comentario:...` (comentário até 200 chars). |
| Condição para GO | Fit definido. | **Fit** e **Intenção** definidos. |
| Onde o Dossiê é aberto | No Kanban, a partir do card em Discovery. | No DealDetailsDialog, a partir do CTA do BLOCO C. |

---

## 5. Impacto na Experiência do SDR

1. **Um único lugar para trabalhar o deal:** Ao clicar no card em Discovery, o SDR entra no DealDetailsDialog e encontra contexto, decisão e dossiê no mesmo painel.
2. **Menos confusão:** Não há mais “Abrir Dossiê” no card vs “Abrir detalhes” no card; tudo passa pelo dialog.
3. **Decisão explícita:** Fit, Intenção, Risco e Comentário Executivo ficam visíveis e gravados em tags, sem nova tabela.
4. **GO/NO-GO claro:** O botão “GO — Avançar para [próximo estágio]” só aparece quando Fit e Intenção estão preenchidos, reforçando que Discovery é etapa de decisão.
5. **Dossiê no contexto:** O Dossiê é acessado por um CTA dentro do próprio deal, com fonte em `stc_verification_history.full_report` e CTA de enriquecimento sem execução automática.

---

## 6. Checklist de Governança

- [x] Nenhuma tabela nova criada.
- [x] Nenhuma alteração em RLS ou políticas.
- [x] Nenhuma alteração em Edge Functions ou serviços de backend.
- [x] Leads Aprovados e Quarentena não foram alterados.
- [x] Dossiê no Discovery só lê dados existentes e exibe CTA quando não há dados; não dispara enriquecimento automático.
- [x] Fit, Intenção, Risco e Comentário persistidos em tags do deal (`discovery_*`).
- [x] Ação GO apenas move o deal de estágio via `useMoveDeal`.
- [x] “Abrir Dossiê Estratégico” only inside DealDetailsDialog (BLOCO C), quando `stage === 'discovery'`.
- [x] Botão “Abrir Dossiê Estratégico” removido do card no Kanban.

---

## 7. Pendências para Fase 3

1. **“+ Novo Deal” no Discovery:** O protocolo indica que “Criar Deal novamente” não deve existir no Discovery. O botão “+ Novo Deal” no header do Pipeline continua disponível para todos os estágios; definir na Fase 3 se ele deve ser ocultado ou condicionado quando a visão for Discovery.
2. **CNPJ no BLOCO A:** Hoje o CNPJ é obtido de `companies.raw_data` ou do deal quando existir. Se a query de deals não trouxer `cnpj` de `companies`, avaliar incluir na projeção sem criar coluna nova.
3. **Enriquecimento no Discovery:** O CTA “Executar enriquecimento nesta etapa (Discovery)” apenas informa; não há botões/trigger para Apollo, Website+LinkedIn, 360°, Fit de Produtos. Fase 3 pode implementar acionamento manual desses enriquecimentos a partir do Dossiê ou do BLOCO C.
4. **Comentário Executivo:** Armazenado em tag `discovery_comentario:...` (até 200 caracteres). Se houver necessidade de textos maiores, avaliar uso de campo existente (ex.: `description` ou `notes`) com convenção, sem nova coluna.

---

**Fase 2 concluída. Relatório executivo gerado. Aguardando auditoria para liberação do próximo ciclo.**

> *Discovery não é formulário. Discovery é decisão. Deal é o centro. Dossiê é o cérebro.*
