# Leads Aprovados × Pipeline – Diagnóstico e Correções

## Problema relatado

- **11 empresas** apareciam na página "Leads Aprovados" mesmo após envio ao pipeline.
- Ao enviar ao pipeline de novo, mensagem de "já aprovado" / bloqueio.
- Na página deveria ficar **0** após envio; as 11 deveriam aparecer no **SDR Workspace** (coluna Lead).
- No SDR Workspace apareciam apenas **7** deals (3 Lead + 4 Discovery), não 11.
- Enriquecimento (Receita, 360°, Website, LinkedIn) falhava: "CNPJ não disponível", "Empresa não encontrada", 406 Not Acceptable.

## Causa raiz

### 1. Fallback na lista de aprovados

O hook `useApprovedCompanies` buscava:

1. **Fonte principal:** `icp_analysis_results` com `status = 'aprovada'`.
2. **Fallback:** Se retornasse **0** aprovadas, preenchia a lista com até 100 empresas da tabela **`companies`**.

Quando todas as aprovadas eram enviadas ao pipeline, o status passava para `'pipeline'`, então a consulta principal retornava **0**. O fallback entrava e exibia **11 empresas** (da base `companies`), dando a impressão de que “as 11 voltaram” para a aprovação.

- Essas 11 **não** são linhas de `icp_analysis_results`; são empresas da base.
- O `id` exibido na tabela era o **`companies.id`**, não o `icp_analysis_results.id`.

### 2. Enriquecimento e 406

As ações de enriquecimento (Receita, 360°, Website) usam o **`id` da linha** para buscar em `icp_analysis_results`:

- Com fallback, o `id` era **company_id**.
- A query `icp_analysis_results.eq('id', company_id)` não encontrava linha (ou RLS/PostgREST retornava 406).
- Resultado: "CNPJ não disponível", "Empresa não encontrada", 406.

### 3. Pipeline com 7 em vez de 11

- As **7** que aparecem no pipeline (3 Lead + 4 Discovery) são os deals que de fato foram criados em `sdr_deals`.
- As outras **4** nunca foram linhas de `icp_analysis_results` com status `'aprovada'`; eram só empresas do fallback. Por isso não havia “11 aprovadas” para enviar ao pipeline — só 7 tinham sido aprovadas e enviadas.

## Correções aplicadas

### 1. Remoção do fallback em `useApprovedCompanies`

- Quando a consulta a `icp_analysis_results` com `status = 'aprovada'` retorna **0**, o hook agora retorna **lista vazia**.
- Não há mais preenchimento com empresas da tabela `companies`.
- Efeito: após enviar todas ao pipeline, a página "Leads Aprovados" fica com **0** linhas, como esperado.

### 2. Envio ao pipeline (já corrigido antes)

- Inserção em `sdr_deals` usa as colunas reais: `title`, `stage`, `value`, `assigned_to` (não `deal_title`, `deal_stage`, `deal_value`, `assigned_sdr`).
- Novos envios ao pipeline passam a criar os deals corretamente.

### 3. CORS da Edge Function `scan-prospect-website`

- OPTIONS retorna 204 com headers CORS; erros retornam 500 com CORS.
- É necessário **redeploy** da função para o CORS valer em produção.

## Comportamento esperado após as correções

1. **Leads Aprovados:** Mostra apenas linhas de `icp_analysis_results` com `status = 'aprovada'`. Quando não houver nenhuma, a tabela fica vazia (0 empresas).
2. **Enviar ao pipeline:** Cria deals em `sdr_deals` e atualiza o status para `'pipeline'`; essas linhas somem da lista de aprovados.
3. **SDR Workspace:** Exibe todos os deals (Lead, Qualificação, Discovery, etc.). O número de deals ativos (ex.: 7) reflete apenas os que existem em `sdr_deals`.
4. **Enriquecimento:** Só é oferecido/executado para linhas reais de `icp_analysis_results` (lista principal), evitando 406 e "Empresa não encontrada".

## Se quiser “11” no pipeline

As 11 empresas que apareciam antes vinham do fallback (base `companies`). Para que **11** deals existam no pipeline:

1. É preciso ter **11** linhas em `icp_analysis_results` com `status = 'aprovada'` (fluxo de quarentena/approve).
2. Depois usar "Enviar ao pipeline" para essas 11; a correção do insert em `sdr_deals` garante que os 11 sejam criados.

Não há “devolução” automática de empresas já enviadas ao pipeline para a lista de aprovados; a lista de aprovados mostra só os que ainda estão pendentes de envio.
