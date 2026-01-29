# Relatório Fase 3 — Discovery Inteligente

**Objetivo:** Restaurar a inteligência real do Discovery (não só UI): critérios reais no Bloco B, pipeline de enriquecimento acionável no Bloco C, GO/NO-GO com base em dados e sugestões para o SDR.

**Data:** Jan 2025

---

## 1. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDiscoveryEnrichmentPipeline.ts` | **Novo.** Hook que orquestra o pipeline de enriquecimento (find-website → scan-website → enrich-apollo-decisores), executado apenas por ação explícita. |
| `src/components/sdr/DealDetailsDialog.tsx` | Integração do pipeline e da inteligência: uso de `useTenant`, `useLatestSTCReport`, `useProductFit`, `useDiscoveryEnrichmentPipeline`; pré-sugestões no Bloco B; botão “Executar Enriquecimento Estratégico (Discovery)” no Bloco C; regra GO com “pelo menos 1 fonte enriquecida”; seção “Sugestões para o SDR”; mensagem quando GO não está habilitado. |

---

## 2. Funções criadas / reutilizadas

### Criadas (frontend)

- **`useDiscoveryEnrichmentPipeline({ companyId, tenantId })`**  
  Retorna `{ runPipeline, isRunning, error }`. Ao chamar `runPipeline()`:
  1. Lê `companies` por `company_id` e extrai `razao_social`, `cnpj`, `raw_data.receita_federal` (city, state, cep, fantasia).
  2. Se não houver website: chama `find-prospect-website(razao_social, cnpj, tenant_id)` e usa o `website` retornado.
  3. Se houver website: chama `scan-prospect-website(tenant_id, company_id, website_url, razao_social, cnpj)`.
  4. Chama `enrich-apollo-decisores` com `company_id`, `company_name`, `domain`, `city`, `state`, `industry`, `cep`, `fantasia`.
  5. Ao final, invalida `stc-latest`, `stc-history` e `product-fit` para refetch dos Blocos B/C.

- **`fitLevelToDiscovery(fitLevel)`**  
  Mapeia `'high'|'medium'|'low'` do Product Fit para `'alto'|'medio'|'baixo'` do Bloco B.

- **`suggestIntencaoFromReport(fullReport)`**  
  Deriva Intenção a partir de `full_report.decisors_report` (≥2 decisores → ativa; 1 → estrategica; 0 → exploratoria).

- **`suggestRiscoFromReport(fullReport)`**  
  Deriva Risco a partir de `full_report.digital_report` (website + LinkedIn → baixo; um deles → medio; nenhum → alto).

- **`buildComentarioFromReport(fullReport, fitLevel)`**  
  Gera texto executivo (máx. 200 caracteres) a partir de fit, número de decisores e presença de website.

### Reutilizadas (sem alteração de contrato)

- **`useLatestSTCReport(companyId, companyName)`** — `src/hooks/useSTCHistory.ts`
- **`useProductFit({ companyId, tenantId, enabled })`** — `src/hooks/useProductFit.ts`
- **`useTenant()`** — `src/contexts/TenantContext.tsx`
- **Edge Functions:** `find-prospect-website`, `scan-prospect-website`, `enrich-apollo-decisores`

---

## 3. APIs acionadas

| API | Quando |
|-----|--------|
| `find-prospect-website` | No pipeline, quando a empresa não tem website; body: `razao_social`, `cnpj`, `tenant_id`. |
| `scan-prospect-website` | No pipeline, quando há website (próprio ou retornado por find); body: `tenant_id`, `company_id`, `website_url`, `razao_social`, `cnpj`. |
| `enrich-apollo-decisores` | Sempre no pipeline; body: `company_id`, `company_name`, `domain`, `city`, `state`, `industry`, `cep`, `fantasia`, `modes: ['people','company']`. |
| `calculate-product-fit` | Indiretamente via `useProductFit`, quando o deal está em discovery e há `company_id` e `tenantId`; usado para Bloco B (Fit) e sugestões SDR. |
| Supabase `companies` | Leitura no pipeline e em `useLatestSTCReport`/`useProductFit`; nenhuma migração ou RLS alterada. |

---

## 4. O que foi ativado

- **Bloco B — Decisão Estratégica**
  - Fit, Intenção e Risco passam a ser **pré-sugeridos** com base em `full_report` e `useProductFit`, mantendo override manual.
  - Comentário Executivo é **gerado por regras** a partir de fit, decisores e website (até 200 caracteres), editável pelo SDR.
  - Dropdowns e textarea continuam editáveis; a pré-sugestão só preenche quando o valor atual está vazio (não sobrescreve edição do usuário).

- **Bloco C — Dossiê e Inteligência**
  - Botão **“Executar Enriquecimento Estratégico (Discovery)”** que dispara o pipeline (find-website → scan-website → enrich-apollo-decisores).
  - Botão desabilitado quando não há `company_id`, não há `tenantId` ou o pipeline está em execução.
  - Texto explicativo atualizado: GO exige Fit, Intenção, Comentário e ao menos uma fonte enriquecida.

- **GO/NO-GO**
  - O botão **GO** só é exibido quando:
    - Fit do Produto está definido;
    - Intenção do Cliente está definida;
    - Comentário Executivo está preenchido (trim);
    - Existe **pelo menos uma fonte enriquecida**: `full_report` com ao menos um de `product_fit_report`, `decisors_report` ou `digital_report` com conteúdo.
  - Quando em discovery e GO não está habilitado, é exibida mensagem orientando o preenchimento e a execução do enriquecimento.

- **Sugestões para o SDR**
  - Após enriquecimento, quando há ao menos uma fonte enriquecida e há `products_recommendation`:
    - **Produto/serviço:** primeiro item de `product_fit_report.products_recommendation` (nome ou justificativa).
    - **Abordagem:** texto por nível de fit (alto / médio / baixo).
    - **Roteiro 1º contato:** abertura, gancho e proposta em uma frase, derivados de regras fixas no frontend (sem nova tabela nem Edge Function de sugestões).

---

## 5. O que foi mantido intacto

- Nenhuma alteração em **tabelas**, **RLS** ou **migrations**.
- Fluxos de **Leads Aprovados**, **Quarentena** e **Pipeline** fora do Discovery inalterados.
- **Persistência do Discovery** continua via tags do deal (`discovery_fit_*`, `discovery_intencao_*`, `discovery_risco_*`, `discovery_comentario:*`), sem novos campos em banco.
- **QuarantineReportModal**, **TOTVSCheckCard**, **DecisorsContactsTab** e demais pontos que usam `full_report` ou Edge Functions seguem como estavam.
- **Enriquecimento** só ocorre após clique em “Executar Enriquecimento Estratégico (Discovery)”; não há enriquecimento automático ao abrir o deal.

---

## 6. Pontos de atenção

- **Tenant:** o DealDetailsDialog usa `useTenant()`. Garantir que ele seja renderizado dentro de `TenantProvider` (já é o caso quando o dialog é aberto a partir do pipeline/SDR dentro do App).
- **Normalização RF:** o pipeline usa apenas dados já presentes em `companies` e `raw_data.receita_federal`. Se a empresa não tiver RF preenchido, o Apollo é chamado com city/state/cep/fantasia vazios ou fallbacks; uma futura Fase pode incluir chamada explícita a `enrich-receita-federal` antes do pipeline quando RF estiver ausente.
- **LinkedIn:** o pipeline atual não chama Phantom/LinkedIn; apenas find-website, scan-website e Apollo. Inclusão de etapa LinkedIn pode ser feita em ciclo posterior.
- **Sugestões SDR:** produto, abordagem e roteiro são derivados no frontend a partir de `product_fit_report` e regras fixas. Uma Edge Function “discovery-suggestions” (ou modelo de linguagem) pode ser adicionada depois para textos mais ricos, sem mudança de esquema.

---

## 7. Pendências para Fase 4

- Considerar chamada a **enrich-receita-federal** (ou equivalente) quando `companies.raw_data.receita_federal` estiver vazio, antes de find-website e Apollo.
- Considerar etapa **LinkedIn/Phantom** no pipeline, opcional e após website.
- Avaliar **Edge Function ou LLM** para Comentário Executivo e sugestões SDR (produto, abordagem, roteiro) em linguagem natural.
- Testes E2E do fluxo Discovery (enriquecimento → pré-sugestões → GO) em ambiente de staging.

---

*Após este relatório, aguarde auditoria executiva para liberação do próximo ciclo.*
