# Data Enrich – Confirmação de conexões (Leads Aprovados, Cards, Dossiê Estratégico)

## O que a tela Data Enrich mostra

Na página **Data Enrich** (`/leads/data-enrich`):

- A lista de empresas (nome, indústria, domínio, localização, status Completo/Parcial, fontes Apollo/LinkedIn/Lusha/Hunter) é exibida **dentro do iframe** do app **Lovable (olv-dataenrich)**.
- Ou seja: esses dados ficam no backend do Lovable; o STRATEVO **não** lê essa tabela do próprio banco. A página STRATEVO apenas embute o iframe.

**Resposta:** Sim, é possível “ver” essas empresas e enriquecimentos na tela; eles existem no sistema Data Enrich (Lovable). O STRATEVO não tem cópia nativa dessa lista no Supabase.

---

## Conexões que já existem

### 1. STRATEVO → Data Enrich (Lovable)

| Origem | Ação | Destino |
|--------|------|---------|
| Estoque Qualificado | "Enviar para Banco de Empresas" | `enrich-batch` → empresas enviadas ao Lovable |
| Dossiê Estratégico | Botão "Data Enrich" | Navega para `/leads/data-enrich?companyId=xxx` (abre a empresa no iframe) |

### 2. Data Enrich (API) → STRATEVO – **só decisores, e só via modal**

| Ação no STRATEVO | API / código | Onde cai no STRATEVO |
|------------------|--------------|----------------------|
| No **Dossiê**, abrir modal e clicar **"Extrair Decisores"** | `enrich-single` → polling `get-status` → `get-contacts` → `persistDataEnrichContactsToDecisionMakers(company_id, contacts)` | Tabela **`decision_makers`** |

Ou seja: os **decisores** do Data Enrich só entram no STRATEVO quando alguém usa o **modal** “Extrair Decisores” no Dossiê (ou outro fluxo que chame `get-contacts` + persistência). Não há sync automático a partir do que é feito **dentro do iframe** (Lovable).

### 3. Tabela `decision_makers` → Cards, Dossiê e CRM

| Superfície | Fonte | O que mostra |
|------------|--------|--------------|
| **Dossiê Estratégico – aba Decisores** | `decision_makers` por `company_id` (`loadDecisorsData`) | Lista de decisores (nome, cargo, email, LinkedIn, etc.) |
| **Leads Aprovados / cards (badge “X decisores”)** | `icp_analysis_results.decision_makers_count` (atualizado por trigger ao alterar `decision_makers`) | Contagem de decisores no card |
| **CRM** | `decision_makers` por `company_id` (ex.: `CRMEnrichmentIntegration.syncDecisionMakersToLead`) | Contagem / uso de decisores nos leads |

Conclusão: **todos os dados de decisores que já estão em `decision_makers`** (por exemplo, os gravados via modal) **já estão “conectados”** aos cards, ao Dossiê e ao CRM.

---

## Lacunas (fios que ainda não estão 100% conectados)

### 1. Enriquecimento feito **dentro do iframe** (página Data Enrich)

Quando o usuário:

- clica em **"Enriquecer"** ou **"Extrair Decisores"** **dentro do app Lovable** (iframe ou nova aba),

os resultados (decisores, status Completo/Parcial, fontes) ficam **apenas no Lovable**. Não há hoje:

- webhook Lovable → STRATEVO, nem  
- job no STRATEVO que chame `get-contacts` (e opcionalmente `get-company`) e persista no STRATEVO.

Por isso:

- **Decisores:** Para aparecerem no Dossiê, nos cards e no CRM, é necessário **abrir o Dossiê da empresa no STRATEVO** e usar **"Extrair Decisores"** no **modal** (que chama a API e grava em `decision_makers`). Alternativa futura: um botão ou job “Sincronizar do Data Enrich” que, para cada empresa, chame `get-contacts` e `persistDataEnrichContactsToDecisionMakers`.
- **Dados de empresa** (indústria, domínio, localização, status “Completo/Parcial”): hoje a API `get-company` é usada só para exibição no modal. **Não há** persistência de volta na tabela **`companies`** (nem no dossiê). Para o dossiê e os cards ficarem “100% enriquecidos” com esses campos do Data Enrich, seria preciso mapear `get-company` → `companies` (e/ou snapshot do dossiê) e implementar essa escrita.

### 2. Tabela de leads aprovados

- **Leads Aprovados** vêm de **`icp_analysis_results`** (status aprovada) + dados de empresa do STRATEVO (`companies`, etc.).
- A **contagem de decisores** nos cards vem de **`icp_analysis_results.decision_makers_count`**, alimentada pelo trigger a partir de **`decision_makers`**.
- Ou seja: **acesso aos dados** para montar a lista de Leads Aprovados e o badge de decisores **existe**. O que não está automático é: **trazer para o STRATEVO** os decisores (e opcionalmente os dados de empresa) que foram enriquecidos **somente no iframe/Lovable**, sem passar pelo modal.

### 3. Cards do pipeline / arquivos (dossiê)

- Os **cards** onde se “abrem arquivos” (dossiê) leem empresa e decisores do STRATEVO: **`companies`** + **`decision_makers`** (e dados salvos no próprio dossiê).
- Portanto: **tudo o que já estiver em `companies` e em `decision_makers`** já está disponível para os cards e para o dossiê estratégico. O que falta é garantir que os dados enriquecidos **no Data Enrich (Lovable)** sejam trazidos para essas tabelas (decisores via `get-contacts` + persistência; dados de empresa via `get-company` → `companies`, se desejado).

---

## Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| Dá para “ver” as empresas e enriquecimentos na tela Data Enrich? | Sim – no app Lovable (iframe). Os dados estão no Lovable, não numa tabela STRATEVO da lista Data Enrich. |
| O enrichment do Data Enrich já alimenta os cards e o dossiê? | **Decisores:** sim, **desde que** tenham sido trazidos para o STRATEVO (hoje apenas via modal “Extrair Decisores” no Dossiê). **Dados de empresa (indústria, domínio, etc.):** não; não há persistência de `get-company` em `companies`. |
| As “conexões” para Leads Aprovados e para os cards estão criadas? | **Sim** para o que já está em `decision_makers` e em `companies`: Leads Aprovados e cards usam `icp_analysis_results`, `companies` e `decision_makers`. **Falta** o “fio” que **puxe** do Data Enrich (Lovable) para o STRATEVO o que foi enriquecido **no iframe** (decisores + opcionalmente dados de empresa). |
| Os dados podem estar “100% enriquecidos” no dossiê/cards? | Só se: (1) os decisores forem persistidos no STRATEVO (modal ou sync futura com `get-contacts`); (2) e, se quiser campos de empresa do Data Enrich, implementar persistência de `get-company` em `companies`/dossiê. |

---

## Próximos passos sugeridos (alinhamento dos fios)

1. **Sync decisores Data Enrich → STRATEVO**  
   - Opção A: na abertura do Dossiê (ou ao clicar “Atualizar decisores”), chamar `get-contacts(company_id_lovable)` e `persistDataEnrichContactsToDecisionMakers(company_id_stratevo, contacts)` quando o Lovable usar o mesmo `company_id` que o STRATEVO (ou houver mapeamento).  
   - Opção B: botão “Sincronizar do Data Enrich” (na lista Data Enrich nativa ou no Dossiê) que faça o mesmo para uma ou várias empresas.

2. **Persistência de dados de empresa (get-company)**  
   - Chamar `get-company` (por exemplo ao abrir Dossiê ou ao sincronizar) e mapear campos (indústria, domínio, localização, etc.) para **`companies`** (e/ou para o snapshot do dossiê), para os cards e o dossiê refletirem “100%” o que está no Data Enrich.

3. **Documentar mapeamento company_id STRATEVO ↔ Lovable**  
   - Garantir que, ao passar `companyId` na URL do Data Enrich, o Lovable use o mesmo ID ou que exista um mapeamento estável para `get-contacts` / `get-company` e persistência no STRATEVO.

Após essas confirmações e alinhamento, podemos detalhar a implementação (telas, serviços e migrations) passo a passo.
