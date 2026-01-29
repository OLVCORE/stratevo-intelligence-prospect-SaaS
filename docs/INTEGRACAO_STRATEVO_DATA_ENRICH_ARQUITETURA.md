# Integração STRATEVO One ↔ Data Enrich (Lovable) — Arquitetura

## Visão geral

- **STRATEVO** (Vite/React, Vercel): Motor de Qualificação → Estoque Qualificado → Enviar para Banco de Empresas → **sync automático** para Data Enrich.
- **Data Enrich** (Lovable Cloud): recebe empresas via `enrich-batch`, processa (Apollo/Lusha), armazena em Supabase (Lovable).

## Fluxo implementado (Cursor)

1. **Estoque Qualificado** (`QualifiedProspectsStock.tsx`): ao clicar em **"Enviar para Banco de Empresas"**:
   - Cria/atualiza registros em `companies`.
   - Se `VITE_DATAENRICH_API_KEY` estiver configurada, chama `enrichBatch(toSyncToDataEnrich)` com as empresas promovidas.
2. **Serviço** (`src/services/dataEnrichApi.ts`): `enrichBatch(companies)` → POST para o API Gateway com `action: 'enrich-batch'`, `data: { companies }`.
3. **API Gateway** (Lovable): `https://trsybhuzfmxidieyfpzo.supabase.co/functions/v1/api-gateway` — header `x-stratevo-api-key`.

## Mapeamento de campos (enrich-batch)

| STRATEVO (qualified_prospects / companies) | enrich-batch |
|-------------------------------------------|--------------|
| razao_social / company_name                | name         |
| website (normalizado para domínio)        | domain       |
| cnpj                                      | cnpj         |
| nome_fantasia / fantasia                  | trade_name   |
| cidade / municipio                        | city         |
| estado / uf                               | state        |
| setor                                     | industry     |

## Configuração

### STRATEVO (.env ou Vercel)

```env
VITE_DATAENRICH_API_KEY=Stratevo_One#sua_chave_segura
```

### Data Enrich (Lovable Cloud Secrets)

- `STRATEVO_API_KEY` = mesma chave
- `APOLLO_API_KEY`, `LUSHA_API_KEY` conforme necessário

## API Gateway — Ações

- **enrich-single** — uma empresa
- **enrich-batch** — múltiplas empresas (usado no sync após Enviar para Banco)
- **get-status**, **get-company**, **get-contacts** — consultas

Base: `https://trsybhuzfmxidieyfpzo.supabase.co/functions/v1/api-gateway`  
Header: `x-stratevo-api-key`

## Normalização (Data Enrich)

O `process-csv` no Lovable já normaliza colunas (razao_social → name, fantasia → trade_name, municipio → city, uf → state, etc.). O payload enviado pelo STRATEVO já usa esses nomes.

## Créditos Apollo / Boas práticas

- Enriquecer apenas empresas qualificadas (já filtradas no Estoque).
- Dados em cache no Data Enrich não consomem créditos novamente.
- Ver indicador (verde/vermelho) antes de revelar email/telefone.
