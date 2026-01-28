# Correção das rotas de extração de produtos

## Objetivo

Garantir que os dados extraídos de websites sejam salvos no destino correto, sem mistura entre tenant, concorrentes e prospects.

## Mapeamento correto

| Fluxo | Interface | URL origem | Destino | Parâmetros |
|-------|-----------|------------|---------|------------|
| **Tenant** | Onboarding Aba 1 | `formData.website` (tenant) | `tenant_products` | `tenant_id` + `website_url` + `mode: 'tenant'` |
| **Concorrentes** | Onboarding Aba 1 (massa + scan individual) | `concorrente.urlParaScan` ou `concorrente.website` | `tenant_competitor_products` | `scan-competitor-url`: tenant_id, competitor_cnpj, source_url |
| **Prospects** | Dossiê → Fit Produtos / Discovery | `company.website` (prospect) | `companies.raw_data.produtos_extracted` | `company_id` + `website_url` + `mode: 'prospect'` |

## Alterações realizadas

### 1. Edge Function `scan-website-products`

- **Parâmetro explícito `mode`:** aceita `mode: 'prospect'` ou `mode: 'tenant'`. Quando enviado, tem prioridade sobre inferência por IDs.
- **Validação:** em modo prospect exige `company_id` válido; em modo tenant exige `tenant_id` válido.
- **Respostas:** inclui `saved_to` (`companies.raw_data.produtos_extracted` ou `tenant_products`) para validação no frontend.
- **Logs:** logs claros por modo (PROSPECT vs TENANT) e destino de gravação.
- **Insert em tenant_products:** uso das colunas do schema real (`nome`, `descricao`, `categoria`, `ativo`, `imagem_url`).

### 2. Onboarding Step1 (extração em massa)

- **Concorrentes:** uso de `conc.urlParaScan || conc.website` como URL do concorrente; nunca URL do tenant.
- **Validação:** se a URL do concorrente for igual à do tenant (`formData.website`), o item é ignorado (e log de aviso).
- **Tenant:** chamada a `scan-website-products` com `mode: 'tenant'` explícito.
- **Concorrentes (loop):** antes de chamar `scan-competitor-url`, verificação de que `task.url !== formData.website`; se for igual, erro e skip.
- **Resposta tenant:** uso de `data?.count` e checagem de `data?.mode === 'tenant'` e `data?.saved_to === 'tenant_products'`.

### 3. Onboarding Step1 (scan individual do concorrente)

- **handleScanConcorrenteURL:** uso de `concorrente.urlParaScan || concorrente.website`; validação de que essa URL não é igual à do tenant (`formData.website`); envio de `source_url: competitorUrl` para `scan-competitor-url`.

### 4. TOTVSCheckCard (extração do prospect)

- **Request:** envio de `mode: 'prospect'` junto com `company_id` e `website_url`.
- **Validação pós-resposta:** se `result.saved_to !== 'companies.raw_data.produtos_extracted'`, exibe erro e não atualiza a UI (evita tratar como sucesso quando o backend gravar no lugar errado).

### 5. useDiscoveryEnrichmentPipeline

- **Chamada a scan-website-products:** removido `tenant_id` do body; enviados apenas `company_id`, `website_url` e `mode: 'prospect'` para evitar que o backend interprete como modo tenant.

## Concorrentes: função usada

A extração de concorrentes continua usando a Edge **`scan-competitor-url`**, que grava em **`tenant_competitor_products`** (por `tenant_id` + `competitor_cnpj` + `source_url`). Não foi alterada; apenas o frontend garante que `source_url` é sempre a URL do concorrente e nunca a do tenant.

## Como validar

1. **Tenant:** Onboarding Aba 1 → extrair produtos do tenant → conferir em `tenant_products` (e que não há novos registros em `companies.raw_data` para outras empresas).
2. **Concorrentes:** Onboarding Aba 1 → extrair em massa (ou scan por concorrente) → conferir que cada concorrente usa sua própria URL e que os produtos aparecem em `tenant_competitor_products` com o `competitor_cnpj` correto.
3. **Prospect:** Dossiê → Fit Produtos → extrair produtos do prospect → conferir que `companies.raw_data->'produtos_extracted'` da empresa (prospect) é preenchido e que **não** há novos registros em `tenant_products` para o tenant.

## Deploy da Edge Function

```bash
supabase functions deploy scan-website-products
```

Depois do deploy, refaça os três fluxos acima para validar em ambiente real.
