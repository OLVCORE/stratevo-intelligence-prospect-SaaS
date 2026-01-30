# Integração olv-dataenrich (Data Enrich)

Sistema Lovable **olv-dataenrich** (Empresas, Decisores Apollo/LinkedIn/Lusha) integrado ao STRATEVO de duas formas: **iframe** (app completo) e **API Gateway** (chamadas programáticas).

## O que foi implementado

1. **Sidebar**  
   - Item **"Data Enrich"** no grupo **Prospecção**, logo após **"4. Leads Aprovados"**.  
   - Rota: `/leads/data-enrich`.

2. **Página Data Enrich** (`/leads/data-enrich`) — **app Lovable incorporado via iframe**  
   - **Sem `companyId`:** o iframe carrega `https://olv-dataenrich.lovable.app/companies` — **lista de empresas** (cards/tabela, 326 empresas, Ver detalhes, Enriquecer). É onde você acessa empresas **uma a uma**.  
   - **Com `?companyId=xxx`:** o iframe carrega `/companies/{companyId}` — **detalhe da empresa** no Lovable (Visão Geral, Decisores por fonte, Extrair Decisores, Apollo/LinkedIn/Lusha).  
   - Se o iframe não carregar (ex.: app bloqueia incorporação), aparece mensagem e botão **"Abrir Data Enrich em nova aba"** para usar o sistema Lovable direto no navegador.
   - **Layout nativo:** a rota `/leads/data-enrich` usa área full-bleed (sem padding lateral), barra mínima (título + "Abrir em nova aba") e iframe em 100% da largura/altura para parecer uma página nativa do STRATEVO.

3. **Dossiê (TOTVSCheckCard)**  
   - Botão **"Data Enrich"** no dossiê da empresa que navega para `/leads/data-enrich?companyId=xxx`, abrindo a **mesma empresa** já no Lovable (detalhe + Decisores).

4. **Modal Data Enrich** (`DataEnrichModal`) — uso opcional via API  
   - Chama a API Gateway: `enrich-single` → polling `get-status` → `get-company` e `get-contacts`.  
   - Abas por fonte: Decisores Apollo / LinkedIn / Lusha. Usado quando se quer enriquecer **sem sair da tela** (ex.: dentro de um fluxo específico).

5. **Serviço de API** (`src/services/dataEnrichApi.ts`)  
   - Base URL: `https://trsybhuzfmxidieyfpzo.supabase.co/functions/v1/api-gateway`.  
   - Header: `x-stratevo-api-key` (ou equivalente).  
   - Ações: `enrich-single`, `get-status`, `get-company`, `get-contacts`, `enrich-batch`.

## Configuração necessária

**Variável de ambiente (Vite):**

- `VITE_DATAENRICH_API_KEY` ou `VITE_STRATEVO_API_KEY` = chave da API (ex.: `stv_live_sua_chave_aqui`).

No `.env` ou no painel do Vercel:

```env
VITE_DATAENRICH_API_KEY=stv_live_sua_chave_aqui
```

Sem essa variável, o modal exibe erro "API Key não configurada" ao clicar em "Extrair Decisores".

## Fluxo de uso

1. **Acessar empresas uma a uma (lista)**  
   Prospecção → **Data Enrich** → a página abre com o **sistema Lovable em iframe**: lista de empresas (cards ou tabela). Use **Ver detalhes** ou **Enriquecer** em cada empresa. Se o iframe não carregar, use **"Abrir em nova aba"**.

2. **Abrir uma empresa específica (pelo Dossiê)**  
   Abrir o **Dossiê Estratégico** de uma empresa (Leads Aprovados) → clicar em **"Data Enrich"** → vai para `/leads/data-enrich?companyId=xxx` e o iframe abre **diretamente a página daquela empresa** no Lovable (Decisores, Extrair Decisores, etc.).

3. **No app Lovable (dentro do iframe ou em nova aba)**  
   Lista de empresas → Ver detalhes / Enriquecer; na empresa → **Extrair Decisores**; abas Apollo / LinkedIn / Lusha; exportar CSV.

## Ver a última publicação do Lovable (cache)

O iframe usa **cache-bust** (`?v=timestamp`) para reduzir o uso de versão em cache do Data Enrich:

- **Cada vez que você abre a página** (Prospecção → Data Enrich ou F5 na página), a URL do iframe inclui um novo `?v=...`, e o navegador tende a buscar a versão mais recente publicada no Lovable.
- **Botão "Atualizar"** (ícone de refresh ao lado de "Abrir em nova aba"): clique para **forçar o recarregamento** do conteúdo do Data Enrich e ver a última publicação do Lovable sem sair da página.
- Se mesmo assim aparecer versão antiga (local ou Vercel), use **hard refresh** (Ctrl+Shift+R) ou abra em **nova aba** e faça F5 lá.
- **Sidebar do Lovable (Configurações no fim):** na página Data Enrich ficam visíveis o **sidebar do STRATEVO** (plataforma) e o **conteúdo do Data Enrich** (iframe). O sidebar do Data Enrich (Dashboard, Empresas, Contatos, Upload CSV, Enriquecimento, Logs de API, **Configurações**) fica **dentro** do iframe. Se a opção "Configurações" não aparecer (por exemplo por altura da tela), use **"Atualizar"** para carregar a última publicação do Lovable, ou **role a barra lateral dentro do iframe**; ou abra em **nova aba** para ver o app completo.

## Teste no servidor local

1. Subir o app: `npm run dev` (ex.: `http://localhost:5174`).  
2. Ir em **Prospecção → Data Enrich** (`/leads/data-enrich`).  
3. Deve aparecer o iframe com o Lovable (lista de empresas). Se ficar em branco ou mensagem de bloqueio, clicar em **"Abrir Data Enrich em nova aba"**.  
4. Após publicar no Lovable, use **"Atualizar"** na página Data Enrich ou recarregue a página (F5) para ver a nova versão.  
5. Para testar com empresa específica: abrir um lead aprovado → Dossiê → **Data Enrich**; ou acessar `http://localhost:5174/leads/data-enrich?companyId=<id>`.

## Mapeamento de campos (entrada)

| STRATEVO (companies / dossiê) | API enrich-single |
|-------------------------------|-------------------|
| company.id                    | company_id        |
| name / company_name           | name              |
| domain / website              | domain            |
| cnpj                          | cnpj              |
| raw_data.nome_fantasia        | trade_name        |
| raw_data.municipio / cidade   | city              |
| raw_data.uf / state          | state             |
| industry / setor              | industry          |

Saída (contatos) é usada nas abas do modal; o callback `onDecisorsLoaded` pode ser usado para popular a aba Decisores do Dossiê com os dados retornados pela API.

---

## Motor de Qualificação × Data Enrich (upload de planilha) — Sync automático

- **Upload de planilha no STRATEVO** (Motor de Qualificação / Estoque Qualificado): a planilha vai para **prospecting_candidates** e, após qualificação, para **qualified_prospects**.
- **Enviar para Banco de Empresas (Estoque Qualificado):** ao clicar em **"Enviar para Banco de Empresas"**, as empresas selecionadas são criadas/atualizadas na tabela **companies** e **enviadas automaticamente** para o Data Enrich (Lovable) via **enrich-batch**.
- **Mecanismos de sucesso:** o envio para o Data Enrich usa **retry automático** (até 3 tentativas com intervalo de 2s). Em seguida são exibidos **avisos inteligentes**:
  - **Sucesso:** toast "Data Enrich: envio com sucesso" + descrição com quantidade de empresas enviadas para enriquecimento (decisores Apollo/Lusha).
  - **Falha:** toast "Data Enrich: envio falhou" (variant destructive) + descrição do erro; as empresas já estão no Banco e podem ser sincronizadas depois em Prospecção → Data Enrich.
- **Requisito:** `VITE_DATAENRICH_API_KEY` (ou `VITE_STRATEVO_API_KEY`) configurada no `.env` / Vercel. Sem a chave, o fluxo de Banco de Empresas funciona normalmente, mas o sync com o Data Enrich é omitido.
- **Data Enrich (Lovable)** também tem **"Upload CSV"** dentro do app (sidebar do iframe) para upload direto no Lovable.

---

## Sincronização dossiê estratégico ↔ Lovable

- **Do Dossiê para o Data Enrich:** ao clicar em **"Data Enrich"** no Dossiê, o STRATEVO navega para `/leads/data-enrich?companyId=xxx`. O `companyId` é o ID da empresa no STRATEVO; o Lovable pode usar outro ID internamente. Se o Lovable não tiver essa empresa pelo mesmo ID, abra a **lista de empresas** no Data Enrich e localize a empresa lá (ou use o Upload CSV do Lovable para incluir).
- **Do Lovable para os cards do Dossiê e CRM:** quando você usa o **DataEnrichModal** (Extrair Decisores no Dossiê) ou quando empresas são enviadas ao Data Enrich via **Enviar para Banco de Empresas**, os contatos retornados pelo Data Enrich são **persistidos automaticamente** na tabela **`decision_makers`** do STRATEVO (serviço `dataEnrichToDecisionMakers`). Assim:
  - **Dossiê Estratégico (aba Decisores):** a aba Decisores (`DecisorsContactsTab`) carrega decisores de `decision_makers` via `loadDecisorsData()`. Os decisores salvos pelo Data Enrich aparecem ali após "Extrair Decisores" no modal ou após recarregar a aba.
  - **CRM:** o módulo CRM usa `decision_makers` (por exemplo `CRMEnrichmentIntegration.syncDecisionMakersToLead` atualiza contagem de decisores nos leads). Os decisores do Data Enrich passam a alimentar o CRM porque estão na mesma tabela `decision_makers` vinculada a `company_id`.
- **Resumo do fluxo:** Data Enrich (Lovable) → API Gateway (`get-contacts`) → DataEnrichModal ou sync em lote → `persistDataEnrichContactsToDecisionMakers(company_id, contacts)` → tabela `decision_makers` → Dossiê (aba Decisores) + CRM.

---

## Como os dados do Data Enrich alimentam os cards e o Dossiê Estratégico

Todos os **contatos/decisores** retornados pelo Data Enrich (Apollo, LinkedIn, Lusha) são persistidos na tabela **`decision_makers`** do STRATEVO. A partir dessa tabela única, os dados alimentam **cards**, **Dossiê Estratégico** e **CRM**.

### Fluxo único (contatos → uma tabela → várias telas)

```
Data Enrich (Lovable)
  → get-contacts / Extrair Decisores
  → persistDataEnrichContactsToDecisionMakers(company_id, contacts)
  → tabela decision_makers (STRATEVO)
       │
       ├─→ Trigger (MC3): atualiza icp_analysis_results.decision_makers_count
       │       │
       │       └─→ Cards de leads (Leads Aprovados, Quarentena, Banco de Empresas)
       │             usam decision_makers_count para badge "X decisores" e filtros
       │
       ├─→ Dossiê Estratégico (aba Decisores)
       │       DecisorsContactsTab carrega decision_makers por company_id
       │       (nome, cargo, email, LinkedIn, seniority, departamento, etc.)
       │
       └─→ CRM (crm_leads)
             CRMEnrichmentIntegration.syncDecisionMakersToLead atualiza
             total_interactions com a contagem de decision_makers da empresa
```

### Onde cada superfície busca os dados

| Superfície | Fonte dos dados | O que mostra |
|------------|-----------------|--------------|
| **Dossiê Estratégico – aba Decisores** | `decision_makers` (por `company_id`) | Lista de decisores com nome, cargo, email, LinkedIn, seniority; classificação (decision-maker / influencer / user). |
| **Cards – Leads Aprovados, Quarentena, Banco de Empresas** | `icp_analysis_results.decision_makers_count` (atualizado por trigger ao inserir/alterar `decision_makers`) | Badge “X decisores”, indicador de “tem decisores” e filtros. |
| **Card expandido / Company Detail** | `companies` com join em `decision_makers` ou `company.decision_makers` | Contagem e prévia de decisores no card da empresa. |
| **CRM – leads** | `decision_makers` (contagem por `company_id`) → `crm_leads.total_interactions` | Contagem de decisores/interações por lead. |
| **Motor de Busca, Playbooks, outros** | `decision_makers` (por `company_id`) | Listas e filtros por “empresas com decisores”. |

### Pontos de entrada que gravam em `decision_makers`

1. **Modal Data Enrich (Dossiê)**  
   Ao clicar em “Extrair Decisores” no Dossiê, o modal chama a API, recebe os contatos e chama `persistDataEnrichContactsToDecisionMakers(company.id, contacts)`. Os decisores passam a aparecer na aba Decisores e nos cards/CRM.

2. **Enviar para Banco de Empresas (Estoque Qualificado)**  
   As empresas são enviadas ao Data Enrich via `enrich-batch`. O enriquecimento (e a extração de decisores) ocorre no Lovable; quando os contatos forem obtidos (por exemplo via Data Enrich no Dossiê ou no iframe) e persistidos com `company_id` do STRATEVO, entram em `decision_makers` e alimentam o mesmo fluxo acima.

3. **Uso direto no iframe Data Enrich**  
   Se o usuário enriquecer e exportar no Lovable sem usar o modal STRATEVO, os dados só entram no STRATEVO quando houver uma ação que chame a API (get-contacts) e `persistDataEnrichContactsToDecisionMakers` (por exemplo ao abrir o Dossiê da empresa e clicar em “Extrair Decisores” no modal).

### Contagem nos cards (trigger MC3)

Sempre que um registro é inserido, atualizado ou removido em **`decision_makers`**, o trigger **`update_decision_makers_count_trigger`** recalcula a contagem por empresa e atualiza **`icp_analysis_results.decision_makers_count`** para esse `company_id`. Por isso:

- Os cards que leem `icp_analysis_results` (por exemplo Leads Aprovados) passam a refletir automaticamente quantos decisores a empresa tem após qualquer persistência em `decision_makers` (incluindo a que vem do Data Enrich).

### Dados de empresa (get-company)

Os dados retornados por **`get-company`** são **persistidos** na tabela **`companies`** do STRATEVO via **`persistDataEnrichCompany`** (`src/services/dataEnrichToCompanies.ts`). O modal Data Enrich, após extrair decisores, chama `getCompany(companyId)` e `persistDataEnrichCompany(company.id, company)` para atualizar: industry, domain, employees, founding_year, logo_url, linkedin_url, description, city, state, country e **data_enrich_raw** (JSONB com apollo/linkedin/lusha e metadados de enrichment).

---

## Mapeamento de company_id (STRATEVO ↔ Data Enrich / Lovable)

**Abordagem em uso: mesmo UUID (Opção A).**

- No STRATEVO, a tabela **`companies`** usa `id` (UUID) como chave primária.
- Ao chamar **`enrich-single`**, o payload pode incluir **`company_id`** = `company.id` do STRATEVO.
- O Data Enrich (Lovable) usa esse **mesmo UUID** como identificador da empresa. Assim, **`get-company`** e **`get-contacts`** recebem `company_id` = UUID da empresa no STRATEVO.
- **Fluxo:** Dossiê abre modal → `enrichSingle({ ...company, company_id: company.id })` → Data Enrich armazena/atualiza empresa com esse ID → `getCompany(company.id)` e `getContacts(company.id)` retornam dados → `persistDataEnrichCompany(company.id, company)` e `persistDataEnrichContactsToDecisionMakers(company.id, contacts)` gravam no STRATEVO.
- **Sync na aba Decisores:** o botão **"Atualizar do Data Enrich"** (visível quando `VITE_DATAENRICH_API_KEY` está configurada) chama `getContacts(companyId)` e `getCompany(companyId)` com o `companyId` do Dossiê (mesmo UUID) e persiste em `decision_makers` e `companies`, em seguida recarrega os dados da aba.

**Alternativa (não implementada):** tabela de mapeamento `company_id_mapping (stratevo_id, data_enrich_id)` para quando o Lovable usar IDs internos diferentes; nesse caso seria necessário criar/atualizar o mapeamento ao enviar empresas via `enrich-batch` ou `enrich-single`.
