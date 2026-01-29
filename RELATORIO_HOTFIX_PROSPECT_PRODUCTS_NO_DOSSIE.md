# RELATÓRIO HOTFIX — “PROSPECT PRODUCTS NÃO APARECEM NO DOSSIÊ”

## Arquivos alterados

1. **`src/hooks/useDiscoveryEnrichmentPipeline.ts`**
   - Re-fetch de `companies` (id, website, domain, linkedin_url, raw_data) imediatamente após o passo `scan-prospect-website`.
   - Extração canônica de produtos do prospect: prioridade `raw_data.produtos_extracted` → `raw_data.prospect_products` → `raw_data.website_products`.
   - Normalização para array com `name`/`nome`, `category`/`categoria`, `source_url` (opcional).
   - Persistência obrigatória em `stc_verification_history.full_report`: `tenant_products`, `prospect_products` (array, vazio quando não houver itens), `extraction_sources` incluindo `'prospect_website'` quando o scan tiver rodado.
   - Invalidação de queries após persistência: `['stc-latest', companyId]`, `['stc-history', companyId]`, `['product-fit', companyId, tenantId]`, `['company-data', companyId]`.

2. **`src/components/totvs/TOTVSCheckCard.tsx`**
   - Estado `discoverWebsiteLoading` e `extractProductsLoading` (somente por clique).
   - Handlers `handleDiscoverWebsite` (Edge `find-prospect-website`) e `handleExtractProspectProducts` (Edge `scan-prospect-website`).
   - Bloco **“Produtos do prospect (extraídos do website)”** na aba Fit Produtos, com:
     - Fonte: `latestReport.full_report.prospect_products` → `companyData.raw_data.produtos_extracted` → `prospect_products` → `website_products`.
     - Lista com nome, categoria e badge “Website” quando houver `source_url`.
     - Mensagem quando vazio: “Nenhum produto do prospect foi extraído ainda. Execute 'Extrair Produtos do Prospect'.”
     - Botões “Descobrir Website” e “Extrair Produtos do Prospect” (sem execução automática).
   - **Diagnóstico Fit**: linha com quantidade de produtos do tenant, quantidade de produtos do prospect e última data de extração (quando houver dados).

---

## O que foi corrigido

### Persistência

- **Antes:** Os produtos extraídos do prospect pelo `scan-prospect-website` ficavam em `companies.raw_data.produtos_extracted`, mas não eram garantidos em `stc_verification_history.full_report.prospect_products`, e o Dossiê não lia essa fonte de forma canônica.
- **Depois:** Após o scan, o pipeline recarrega a empresa, lê `produtos_extracted` (ou `prospect_products` / `website_products`), normaliza e grava em `full_report.prospect_products`. `extraction_sources` registra `'prospect_website'` quando o scan rodou. Em seguida, as queries do relatório e da empresa são invalidadas para o Dossiê refletir os novos dados.

### UI

- **Antes:** Na aba Fit Produtos havia apenas “Produtos do tenant (catálogo)”. Não havia bloco para produtos do prospect nem ação para descobrir website ou rodar a extração.
- **Depois:** Há um bloco “Produtos do prospect (extraídos do website)” na mesma aba, com lista (nome, categoria, “Website” quando aplicável), mensagem quando vazio, botões “Descobrir Website” e “Extrair Produtos do Prospect”, e linha de “Diagnóstico Fit” (qt tenant, qt prospect, última extração).

---

## Onde os produtos do prospect são armazenados

| Camada | Campo / origem |
|--------|-----------------|
| **Edge `scan-prospect-website`** | Grava em `companies.raw_data.produtos_extracted` (array de objetos com `nome`/`name`, `categoria`/`category`, etc.). |
| **Pipeline (após scan)** | Lê de `companies.raw_data` (prioridade: `produtos_extracted` → `prospect_products` → `website_products`), normaliza e persiste em `stc_verification_history.full_report.prospect_products`. |
| **Leitura no Dossiê (Fit Produtos)** | `latestReport.full_report.prospect_products`; fallback: `companyData.raw_data.produtos_extracted` → `prospect_products` → `website_products`. |

Campos exatos no `full_report`:

- `full_report.prospect_products`: array de `{ nome, categoria?, source_url? }`.
- `full_report.extraction_sources`: array que inclui `'tenant_catalog'` e `'prospect_website'` quando o scan rodou.

---

## Como validar em 2 minutos

1. Escolher um lead com website conhecido (ex.: Uni Luvas).
2. Abrir o **Dossiê Estratégico** do lead e ir na aba **“Fit Produtos”**.
3. Se o website ainda estiver vazio:
   - Clicar em **“Descobrir Website”** e aguardar o fim da busca (Serper).
   - Confirmar que o website foi gravado (e que a lista de prospect pode ser preenchida na próxima etapa).
4. Clicar em **“Extrair Produtos do Prospect”** e aguardar o fim do `scan-prospect-website`.
5. Verificar:
   - O bloco **“Produtos do prospect (extraídos do website)”** mostra itens reais (nome/categoria).
   - A linha **“Diagnóstico Fit”** exibe quantidades de produtos do tenant e do prospect e a última extração.
6. Para conferir persistência:
   - Reabrir o Dossiê (ou navegar e voltar) e confirmar que a lista de prospect continua igual e que `full_report.prospect_products` está preenchido (ex.: via ferramentas do navegador ou query em `stc_verification_history`).

---

Após este relatório, aguarde auditoria executiva para liberação do próximo ciclo.
