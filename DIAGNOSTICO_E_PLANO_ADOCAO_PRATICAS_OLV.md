# Diagnóstico e Plano de Adoção das Práticas OLV (Apollo, LinkedIn, Serper, Enriquecimentos)

**Projeto:** STRATEVO ONE (`stratevo-intelligence-prospect`)  
**Referência:** Práticas documentadas em `olv-intelligence-prospect-v2` (ANALISE_ENRIQUECIMENTOS_APOLLO_LINKEDIN_SERPER.md e ANALISE_ENRIQUECIMENTOS_COMPLETA_TECNICA.md)  
**Data:** Jan 2025

---

## 1. O que já está aplicado no Stratevo (igual ou equivalente ao OLV)

| Recurso / Prática | Stratevo | Comentário |
|-------------------|----------|------------|
| **Apollo — decisores** | ✅ | Edge `enrich-apollo-decisores` existe; persistência em `decision_makers` e `companies.raw_data`; Aba Decisores do Dossiê e Quarentena chamam essa Edge. |
| **Serper — descoberta** | ✅ | Edge `serper-search` existe (proxy para `google.serper.dev`); `SERPER_API_KEY` no backend. |
| **Serper no front** | ✅ | `src/services/websiteDiscovery.ts` usa `VITE_SERPER_API_KEY` e `https://google.serper.dev/search` para site oficial, LinkedIn, Instagram, Twitter, Facebook (igual ao OLV). |
| **discoverFullDigitalPresence** | ✅ | `src/services/websiteDiscovery.ts` — BrasilAPI → Serper (site oficial) → Serper LinkedIn/Instagram/Twitter/Facebook. Usado em `KeywordsSEOTabEnhanced`. |
| **Adapter Serper** | ✅ | `src/lib/adapters/search/serper.ts` chama a Edge `serper-search` com `type: 'search' \| 'news'`. |
| **digital-intelligence-analysis** | ✅ | Edge existe: `searchAllUrls` (~20 queries Serper) + `analyzeUrlWithAI` (OpenAI). `DigitalIntelligenceTab` invoca e lê `full_report.digital_report`. |
| **PhantomBuster LinkedIn** | ✅ | Edges `phantom-linkedin-decisors` e `phantom-linkedin-company` existem; serviço `phantomBusterEnhanced.ts` existe. |
| **officialWebsiteSearch** | ✅ | `src/services/officialWebsiteSearch.ts` existe. |
| **useEnrichmentOrchestration (definição)** | ✅ | Hook existe com ordem: Lock → Apollo Company → Apollo People → Receita. |
| **find-prospect-website + scan-prospect-website** | ✅ | Usados no pipeline de Discovery (`useDiscoveryEnrichmentPipeline`). |
| **Persistência Discovery em full_report** | ✅ | Fase 3: após “Executar Enriquecimento Estratégico”, o pipeline persiste `product_fit_report`, `decisors_report`, `digital_report`, `enrichment_sources` em `stc_verification_history.full_report`. |

Conclusão: a maior parte das **fontes** (Apollo, Serper, LinkedIn via Serper/PhantomBuster) e das **Edge Functions** (enrich-apollo-decisores, digital-intelligence-analysis, serper-search, etc.) já está no Stratevo. O que falta é **uso consciente** em telas e **persistência automática** em alguns fluxos.

---

## 2. O que NÃO está aplicado / Gaps

| Gap | Descrição | Impacto |
|-----|-----------|---------|
| **useEnrichmentOrchestration não é usado em nenhuma tela** | Nenhum componente importa `useEnrichmentOrchestration` nem chama `orchestrateEnrichment`. O hook existe mas não orquestra enriquecimento em lugar nenhum. | Quem enriquece hoje usa fluxos pontuais (DecisorsContactsTab, pipeline Discovery, botões “Extrair Decisores”, etc.) e não a ordem recomendada Lock → Apollo Company → Apollo People → Receita em uma única ação. |
| **Persistência automática pós digital-intelligence-analysis** | Quando o usuário roda “Analisar” na aba Digital, o resultado vai para o estado da aba e para `onDataChange`; a gravação em `stc_verification_history.full_report.digital_report` só ocorre quando o usuário clica em **Salvar** no SaveBar do Dossiê. | Se o usuário fechar o Dossiê sem salvar, a análise digital é perdida. No OLV, a prática desejável é persistir automaticamente após análise (ou deixar explícito que “Salvar” é obrigatório). |
| **Persistência automática pós simple-totvs-check / outras verificações** | Análogo: resultados de verificações TOTVS e de outras abas só entram no `full_report` quando o usuário salva. | Mesmo problema: perda de dados ao fechar sem salvar. |
| **Documentação centralizada das variáveis de enriquecimento** | OLV tem documentação clara de `APOLLO_API_KEY`, `SERPER_API_KEY`, `VITE_SERPER_API_KEY`, `PHANTOMBUSTER_API_KEY`, `PHANTOM_LINKEDIN_SEARCH_AGENT_ID`, `OPENAI_API_KEY`, `HUNTER_API_KEY` e onde cada uma é usada. Stratevo tem .env e Vercel, mas pode não ter um doc único “variáveis de enriquecimento” alinhado ao OLV. | Risco de falha em deploy ou onboarding por env incorreta ou incompleta. |
| **Ordem explícita “Apollo Company → Apollo People” em telas de enriquecimento em massa** | Em telas como Gerenciar Empresas ou Quarentena, quando há “Enriquecer em lote” ou “Multi-layer enrichment”, não está documentado nem garantido que a ordem Lock → Apollo Company → Apollo People → Receita seja seguida. | Pode haver chamadas em ordem subótima ou duplicada. |

---

## 3. Plano de adoção (o que fazer para alinhar às práticas OLV)

### 3.1 Prioridade alta

#### 3.1.1 Usar `useEnrichmentOrchestration` em pelo menos uma tela de enriquecimento

- **Onde:** Tela de “Enriquecimento em lote” / “Multi-layer” / “Gerenciar Empresas” ou Quarentena — a que hoje dispara Apollo e/ou Receita de forma avulsa.
- **O quê:** Importar `useEnrichmentOrchestration`, chamar `orchestrateEnrichment({ companyId, cnpj, onProgress })` quando o usuário clicar em “Enriquecer com ordem recomendada” (ou equivalente), e exibir o progresso (Lock → Apollo Company → Apollo People → Receita) conforme os steps do hook.
- **Implementação mínima:** Um botão “Enriquecer (ordem recomendada)” que chame `orchestrateEnrichment` e um indicador de etapas (opcional: lista de steps com status pending/running/success/error). Não é obrigatório mudar todos os botões existentes; basta **um** ponto de entrada que use a orquestração.

#### 3.1.2 Persistir `digital_report` após rodar digital-intelligence-analysis

- **Onde:** `DigitalIntelligenceTab` ou o fluxo que chama `supabase.functions.invoke('digital-intelligence-analysis', …)`.
- **O quê:** Após retorno bem-sucedido da Edge, além de atualizar estado e `onDataChange`, **gravar** em `stc_verification_history` o `full_report` atualizado com `digital_report` = resultado da análise (update no último registro por `company_id` ou insert se não existir), usando o mesmo padrão do pipeline de Discovery (Fase 3).
- **Benefício:** Ao reabrir o Dossiê, a aba Digital já mostra a análise sem novo consumo de APIs e sem depender do usuário ter clicado em Salvar.

### 3.2 Prioridade média

#### 3.2.1 Documentar variáveis de enriquecimento (igual ao OLV)

- **Criar/atualizar:** Um doc (ex.: `ENV_ENRIQUECIMENTOS_APOLLO_SERPER_LINKEDIN.md`) na raiz do Stratevo listando:
  - `APOLLO_API_KEY` — enrich-apollo-decisores, enrich-apollo
  - `SERPER_API_KEY` — serper-search, digital-intelligence-analysis, simple-totvs-check, process-discovery, detect-intent-signals-*, etc.
  - `VITE_SERPER_API_KEY` — websiteDiscovery, officialWebsiteSearch (chamadas Serper no browser)
  - `PHANTOMBUSTER_API_KEY`, `PHANTOM_LINKEDIN_SEARCH_AGENT_ID`, `LINKEDIN_SESSION_COOKIE` — phantom-linkedin-decisors, phantom-linkedin-company
  - `OPENAI_API_KEY` — digital-intelligence-analysis, detect-intent-signals-v3, simple-totvs-check, etc.
  - `HUNTER_API_KEY` — process-discovery, validação de domínio/e-mail
- **Uso:** Checklist para deploy (Vercel/Supabase) e onboarding de novos ambientes.

#### 3.2.2 Persistência automática para outras análises pesadas (opcional)

- **Onde:** Fluxos que chamam `simple-totvs-check`, `discover-all-technologies` ou equivalentes e cujo resultado deveria aparecer ao reabrir o Dossiê.
- **O quê:** Após sucesso, atualizar `stc_verification_history.full_report` com o trecho correspondente (ex.: `detection_report`, `keywords_seo_report`, etc.), no mesmo estilo do Discovery e do digital_report.
- **Benefício:** Menos perda de inteligência ao fechar sem salvar e experiência alinhada ao OLV.

### 3.3 Prioridade baixa

#### 3.3.1 Reuso do adapter Serper em mais fluxos

- **Situação:** Várias Edges chamam Serper direto (`fetch('https://google.serper.dev/...')`). No front, `websiteDiscovery` chama Serper direto com `VITE_SERPER_API_KEY`.
- **Prática OLV:** No front, quem precisa de “busca Google” pode usar o adapter `serper.ts` (que chama a Edge `serper-search`) para centralizar uso e evitar expor chave no client quando possível. Não é obrigatório; é melhoria de arquitetura.
- **Ação:** Onde fizer sentido, trocar chamadas diretas ao Serper no front pela Edge `serper-search` via adapter; manter `VITE_SERPER_API_KEY` apenas onde for necessário (ex.: websiteDiscovery se não quiser passar pelo backend).

#### 3.3.2 Garantir que PhantomBuster esteja documentado como “complemento” ao Apollo

- **Doc:** No mesmo `ENV_ENRIQUECIMENTOS_APOLLO_SERPER_LINKEDIN.md`, explicar que Apollo é a fonte canônica de decisores e PhantomBuster é opcional (agentes + sessão LinkedIn); quando não configurado, as Edges retornam fallback sem quebrar.

---

## 4. Checklist “Práticas OLV aplicadas no Stratevo”

Marque conforme for implementando:

- [ ] **Orquestração:** Alguma tela usa `useEnrichmentOrchestration` e chama `orchestrateEnrichment` para enriquecimento em ordem Lock → Apollo Company → Apollo People → Receita.
- [ ] **Digital:** Após rodar `digital-intelligence-analysis`, o resultado é persistido em `stc_verification_history.full_report.digital_report` sem obrigar o usuário a clicar em Salvar.
- [ ] **Docs de env:** Existe documento (ou seção em README/DEV) listando todas as variáveis de enriquecimento e em qual Edge/serviço são usadas.
- [ ] **Persistência pós-verificação (opcional):** simple-totvs-check e outras análises pesadas que alimentam o Dossiê atualizam `full_report` após sucesso.
- [ ] **Phantom/Apollo (opcional):** Documentado que Apollo é fonte canônica de decisores e PhantomBuster é complemento opcional.

---

## 5. Resumo executivo

- **Já temos no Stratevo:** Apollo (enrich-apollo-decisores), Serper (serper-search + websiteDiscovery + digital-intelligence-analysis), LinkedIn (Serper + PhantomBuster), discoverFullDigitalPresence, adapter Serper, useEnrichmentOrchestration (só a definição) e persistência do pipeline de Discovery em full_report (Fase 3).
- **O que falta para “adotar as práticas OLV”:**  
  1) **Usar** a orquestração em pelo menos uma tela de enriquecimento em lote.  
  2) **Persistir** automaticamente o resultado de digital-intelligence-analysis em full_report.digital_report.  
  3) **Documentar** as variáveis de enriquecimento (Apollo, Serper, Phantom, OpenAI, Hunter) e onde cada uma é usada.

Com esses três pontos, o Stratevo fica alinhado às práticas de enriquecimento e análise de websites do OLV, sem precisar reimplementar fontes nem Edge Functions.

---

*Documento gerado para o projeto stratevo-intelligence-prospect com base na análise dos enriquecimentos do olv-intelligence-prospect-v2.*
