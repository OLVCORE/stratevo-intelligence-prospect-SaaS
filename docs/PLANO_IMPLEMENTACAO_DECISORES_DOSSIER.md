# Plano de Implementação — Decisores (Dossiê Estratégico)

**Escopo:** Apenas o modal do Dossiê Estratégico, aba Decisores. Nenhuma outra página ou fluxo.

---

## Relatório obrigatório (protocolo de segurança)

| Item | Resposta |
|------|----------|
| **Arquivos a modificar** | 4 (listados abaixo) |
| **Arquivos a criar** | 0 |
| **Linhas a alterar** | Pontuais; só trechos necessários |
| **Funcionalidades afetadas** | Apenas: Extrair Decisores + Apollo ID Manual na aba Decisores |
| **Risco de regressão** | Baixo (apenas adições e condições opcionais) |
| **Escopo restrito** | Sim — só DecisorsContactsTab, EnrichmentOrchestrator, tipos e Edge enrich-apollo-decisores |

---

## Arquivos que serão modificados

| # | Arquivo | Uso em outras páginas? | Alteração |
|---|---------|------------------------|-----------|
| 1 | `src/types/enrichment.ts` | Tipos usados por Orquestrador e DecisorsContactsTab | Adicionar campos opcionais (force_refresh, organization_found, reason_empty) |
| 2 | `supabase/functions/enrich-apollo-decisores/index.ts` | Só chamada pelo fluxo de decisores | force_refresh, normalizar domain, tentar domain antes de nome, país, resposta com reason_empty |
| 3 | `src/services/enrichment/EnrichmentOrchestrator.ts` | Usado por DecisorsContactsTab e CRMEnrichmentIntegration | Passar force_refresh no body; normalizar domain; mapear novos campos da resposta (opcionais) |
| 4 | `src/components/icp/tabs/DecisorsContactsTab.tsx` | Usado apenas em TOTVSCheckCard (Dossiê) | Enviar force_refresh quando Apollo ID manual; exibir toast quando reason_empty |

**Confirmado:** DecisorsContactsTab só é importado em `TOTVSCheckCard.tsx` (modal do Dossiê). Nenhuma outra página usa DecisorsContactsTab. EnrichmentOrchestrator é usado por CRMEnrichmentIntegration; as mudanças são opcionais (novos campos e parâmetro), sem alterar comportamento atual.

---

## Detalhamento das alterações

### 1. `src/types/enrichment.ts`

- **EnrichmentInput:** adicionar `force_refresh?: boolean`.
- **EnrichmentEdgeResponse:** adicionar `organization_found?: boolean`, `organization_id_used?: string | null`, `reason_empty?: string`.
- **EnrichmentResult:** adicionar `organizationFound?: boolean`, `organizationIdUsed?: string | null`, `reasonEmpty?: string`.

Sem remoção de campos nem alteração de assinaturas existentes.

### 2. `supabase/functions/enrich-apollo-decisores/index.ts`

- **Body:** ler `force_refresh?: boolean`. Se `force_refresh === true` e `apollo_org_id` está preenchido, **não** executar o bloco de idempotência (não chamar `can_run_enrichment` para early return).
- **Domain:** ao receber `domain`, normalizar (remover `https?://`, `www.`, path) e usar esse valor em todas as chamadas Apollo que usem domínio.
- **Busca de organização:** antes do loop por nome (`namesToTry`), se houver domain normalizado, chamar `organizations/search` com parâmetro de domínio (ex.: `q_organization_domains`); se retornar organizações, aplicar os mesmos filtros (país, cidade, etc.) e escolher uma; só se não achar, seguir para busca por nome.
- **País:** na busca de organizações, incluir filtro de país (ex.: Brazil) quando aplicável (ex.: quando temos city/state/cep ou contexto Brasil).
- **Resposta:** em **todos** os `return new Response(JSON.stringify({...}))` da função, incluir quando fizer sentido:
  - `organization_found: boolean`
  - `organization_id_used: string | null`
  - `reason_empty?: string` quando `decision_makers_total === 0` (valores: `org_not_found`, `no_people_in_apollo`, `idempotency_skip`, `apollo_key_missing`, etc.).

Não remover lógica existente; só adicionar condições e campos.

### 3. `src/services/enrichment/EnrichmentOrchestrator.ts`

- **normalizeEnrichmentInput:**  
  - Incluir `force_refresh` no objeto retornado (quando informado).  
  - Se `input.domain` existir, normalizar (remover protocolo, `www`, path) e usar esse valor no body enviado à Edge.
- **mapEdgeResponseToResult:**  
  - Preencher `organizationFound`, `organizationIdUsed`, `reasonEmpty` a partir de `organization_found`, `organization_id_used`, `reason_empty` da resposta da Edge.

Sem alterar assinatura de `enrichCompany` nem remover mapeamentos atuais.

### 4. `src/components/icp/tabs/DecisorsContactsTab.tsx`

- **runEnrichmentFlow(apolloOrgId?):** ao montar o `input` para `enrichCompany`, se `apolloOrgId` estiver definido, adicionar `force_refresh: true`.
- **Após `enrichCompany`:** se `result.reasonEmpty` existir, exibir toast (ou mensagem inline) com texto orientando o usuário (ex.: usar Apollo ID Manual ou preencher LinkedIn da empresa).

Sem remover chamadas nem alterar o fluxo atual; só adicionar parâmetro e feedback.

---

## O que NÃO será feito

- Não remover imports.
- Não renomear componentes, funções ou variáveis.
- Não refatorar nem “limpar” código fora do escopo acima.
- Não alterar outras abas do Dossiê (Fit Produtos, Digital, etc.).
- Não alterar CRMEnrichmentIntegration, CompanyGlobalSearch, TOTVSCheckCard (exceto se algum arquivo listado acima for importado por eles e a mudança for apenas em tipos/orquestrador, já opcionais).
- Não modificar tabelas, RLS ou migrations.
- Não alterar `mark_enrichment_done` (já só é chamado quando `decisores.length > 0`).

---

## Ordem de execução

1. `src/types/enrichment.ts` — tipos.
2. `supabase/functions/enrich-apollo-decisores/index.ts` — Edge.
3. `src/services/enrichment/EnrichmentOrchestrator.ts` — orquestrador.
4. `src/components/icp/tabs/DecisorsContactsTab.tsx` — aba Decisores.

Execução em seguida, com cirurgia precisa em cada arquivo.
