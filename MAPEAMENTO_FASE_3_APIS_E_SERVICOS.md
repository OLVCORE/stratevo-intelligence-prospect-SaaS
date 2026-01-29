# Mapeamento Fase 3 — APIs e Serviços de Enriquecimento (Discovery Inteligente)

**Objetivo:** Inventário técnico para restauração da inteligência estratégica do Discovery, sem alterar tabelas/RLS.

**Data:** Jan 2025

---

## 1. Edge Functions reutilizáveis para o pipeline

| Função | Uso no Discovery | Parâmetros típicos | Retorno / efeito |
|--------|-------------------|--------------------|-------------------|
| `find-prospect-website` | Etapa 2 — buscar website oficial | `razao_social`, `cnpj`, `tenant_id` | `{ success, website, confidence }` |
| `scan-prospect-website` | Etapa 2 — scraping + produtos | `tenant_id`, `company_id` ou `qualified_prospect_id`, `website_url`, `razao_social`, `cnpj` | Atualiza empresa; extrai produtos; busca LinkedIn da empresa |
| `enrich-apollo-decisores` | Etapa 4 — decisores Apollo | `company_id`, `company_name`, `domain`, `city`, `state`, `industry`, `cep`, `fantasia`, `apollo_org_id?`, `modes: ['people','company']` | Salva decisores em `decision_makers`; enriquece empresa |
| `calculate-product-fit` | Fit do Produto (Bloco B) | `company_id`, `tenant_id` | `fit_score`, `fit_level`, `products_recommendation`; usado por `useProductFit` |
| `enrich-receita-federal` / `enrich-receitaws` | Etapa 1 — normalização (se company sem dados RF) | Por company/cnpj | Preenche `companies.raw_data.receita_federal` ou equivalente |
| `phantom-linkedin-decisors` | Decisores via Phantom/LinkedIn | (conforme contrato da função) | Decisores/contatos LinkedIn |
| `detect-intent-signals-v3` | Sinais de intenção (Bloco B) | (conforme contrato) | Sinais para “Intenção do Cliente” |
| `digital-intelligence-analysis` | Saúde digital / risco (Bloco B) | (conforme contrato) | Auxilia “Risco Percebido” |

---

## 2. Serviços e hooks no frontend

| Arquivo | Uso no Discovery |
|--------|-------------------|
| `src/lib/utils/companyDataNormalizer.ts` | Normalização: `nome_fantasia`, `municipio`, `uf` a partir de `companies` / `raw_data.receita_federal` |
| `src/hooks/useProductFit.ts` | Fit de produtos: chama `calculate-product-fit`; resultado em `fit_score`, `fit_level` → mapear para Baixo/Médio/Alto |
| `src/hooks/useSTCHistory.ts` (`useLatestSTCReport`) | Último relatório por `company_id`/`company_name` em `stc_verification_history.full_report` |
| `src/services/phantomBusterEnhanced.ts` | `performFullLinkedInAnalysis(companyName, linkedinCompanyUrl, companyDomain, companyId, city?, state?, industry?)` — filtros para busca LinkedIn |
| `src/services/apolloEnrichment.ts` | `enrichCompanyWithApollo(companyId, companyName, domain?, context?)` — enriquecimento Apollo genérico |
| `src/components/icp/tabs/DecisorsContactsTab.tsx` | Lógica de chamada a `enrich-apollo-decisores` com `city`, `state`, `cep`, `fantasia` vindos de `companies` + `raw_data.receita_federal` |

---

## 3. Fontes de dados para sugestões (Bloco B)

| Fonte | O que fornece | Uso em Fit / Intenção / Risco / Comentário |
|-------|----------------|--------------------------------------------|
| `stc_verification_history.full_report.product_fit_report` | `fit_score`, `fit_level`, `analysis` | **Fit:** baixo ↔ 0–33, medio ↔ 34–66, alto ↔ 67–100 |
| `stc_verification_history.full_report.decisors_report` | Decisores e contatos | **Intenção:** mais decisores ≈ mais “Ativa”; **Risco:** sem decisores ≈ maior risco |
| `stc_verification_history.full_report.digital_report` | Presença digital | **Risco:** sem website/LinkedIn ≈ risco alto |
| `companies.raw_data.receita_federal` | Situação, CNAE, porte | **Risco:** inativa ou inconsistente ≈ risco alto |
| `detect-intent-signals-v3` (se já usado no dossiê) | Sinais de compra/expansão | **Intenção:** Exploratória / Ativa / Estratégica |
| Texto livre (IA ou template) | — | **Comentário Executivo:** gerado por regras/IA a partir das fontes acima; editável pelo SDR |

---

## 4. Pipeline orquestrado (ordem canônica)

1. **Normalização**  
   Ler `companies` por `company_id`; se faltar RF, chamar `enrich-receita-federal` (ou equivalente). Obter: nome curto, fantasia, cidade, estado, país (ou CEP).
2. **Website**  
   Se não houver `website`: `find-prospect-website(razao_social, cnpj, tenant_id)` → depois `scan-prospect-website(tenant_id, company_id, website_url, razao_social, cnpj)`.
3. **LinkedIn**  
   Opcional: Phantom/LinkedIn com nome normalizado + cidade + país (evitar só razão social).
4. **Apollo**  
   `enrich-apollo-decisores` com `company_id`, `company_name`, `domain`, `city`, `state`, `industry`, `cep`, `fantasia`.
5. **Callback**  
   Não sobrescrever: só preencher campos vazios ou reforçar com outras fontes (já é prática em DecisorsContactsTab e em `scan-prospect-website`).

---

## 5. Onde o Discovery se conecta hoje

| Componente | Contexto |
|------------|----------|
| `DealDetailsDialog` | Quando `deal.stage === 'discovery'`: Bloco A (contexto), Bloco B (Fit/Intenção/Risco/Comentário), Bloco C (CTA “Abrir Dossiê” + aviso de enriquecimento), GO |
| `QuarantineReportModal` | Aberto pelo CTA do Bloco C com `companyId`, `companyName`, `discoveryOnly`; exibe `TOTVSCheckCard` e CTA “Executar Enriquecimento nesta etapa (Discovery)” quando não há `full_report` |
| `TOTVSCheckCard` | Dentro do Dossiê; usa `useProductFit`, abas (Decisores, Digital, etc.); “Verificar Agora” e salvamento em `stc_verification_history.full_report` |

---

## 6. Lacunas a cobrir na Fase 3

1. **Botão “Executar Enriquecimento Estratégico (Discovery)”**  
   Hoje só há texto de aviso. Deve disparar um fluxo que chame, em ordem: normalização (RF se necessário) → find-website → scan-website → enrich-apollo-decisores, usando `company_id` e dados de `companies`.
2. **Bloco B — pré-sugestões**  
   Usar `full_report.product_fit_report` (e, se disponíveis, decisors_report, digital_report) para pré-preencher Fit; regras ou função leve para Intenção e Risco; Comentário Executivo gerado por regras/IA (até 200 caracteres), editável.
3. **GO/NO-GO com base real**  
   Exigir Fit + Intenção + Comentário + “pelo menos 1 fonte enriquecida” (ex.: existe `full_report` com pelo menos uma aba preenchida ou `companies` com website/linkedin/decision_makers).
4. **IA — produto, abordagem, roteiro SDR**  
   Após enriquecimento, exibir sugestões (produto recomendado, abordagem, roteiro de primeiro contato). Pode ser uma Edge Function nova “discovery-suggestions” que lê `full_report` e retorna textos, ou regras no front; sem nova tabela.

---

## 7. Governança

- Nenhuma alteração em tabelas, RLS ou migrations.
- Reutilizar Edge Functions e serviços existentes; eventual nova função somente para agregação/sugestões (ex.: “discovery-suggestions”).
- Leads Aprovados, Quarentena e Pipeline fora do Discovery permanecem intactos.
- Discovery não executa enriquecimento automático sem ação explícita do usuário (botão “Executar Enriquecimento Estratégico”).
