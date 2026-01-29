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

## Teste no servidor local

1. Subir o app: `npm run dev` (ex.: `http://localhost:5174`).  
2. Ir em **Prospecção → Data Enrich** (`/leads/data-enrich`).  
3. Deve aparecer o iframe com o Lovable (lista de empresas). Se ficar em branco ou mensagem de bloqueio, clicar em **"Abrir Data Enrich em nova aba"** — o sistema Lovable abre na mesma URL e funciona igual.  
4. Para testar com empresa específica: abrir um lead aprovado → Dossiê → **Data Enrich**; ou acessar manualmente `http://localhost:5174/leads/data-enrich?companyId=<id_da_empresa_no_lovable>`.

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

## Motor de Qualificação × Data Enrich (upload de planilha)

- **Upload de planilha no STRATEVO** (Motor de Qualificação / Estoque Qualificado / Base de Empresas): a planilha vai para **prospecting_candidates** e, após qualificação, para **qualified_prospects** e **companies**. Esse fluxo **não envia automaticamente** os dados para o sistema Lovable (Data Enrich).
- **Data Enrich (Lovable)** tem seu próprio **"Upload CSV"** dentro do app (sidebar do iframe). Para usar enriquecimento em massa no Lovable, use o Upload CSV **dentro** da página Data Enrich (iframe ou nova aba).
- **Integração futura:** é possível conectar o fluxo STRATEVO (empresas qualificadas) ao Lovable via API `enrich-batch` ou envio em lote, para que empresas aprovadas sejam enviadas ao Data Enrich automaticamente; hoje o uso é manual (acessar Data Enrich e usar a lista/Upload CSV do Lovable).

---

## Sincronização dossiê estratégico ↔ Lovable

- **Do Dossiê para o Data Enrich:** ao clicar em **"Data Enrich"** no Dossiê, o STRATEVO navega para `/leads/data-enrich?companyId=xxx`. O `companyId` é o ID da empresa no STRATEVO; o Lovable pode usar outro ID internamente. Se o Lovable não tiver essa empresa pelo mesmo ID, abra a **lista de empresas** no Data Enrich e localize a empresa lá (ou use o Upload CSV do Lovable para incluir).
- **Do Lovable para os cards do Dossiê:** os dados enriquecidos (decisores, emails, telefones) que aparecem **nos cards do Dossiê** vêm hoje do **enriquecimento interno do STRATEVO** (Apollo/Lusha via Edge Functions e aba Decisores). Para que os dados **do Lovable** apareçam nos cards do dossiê, é preciso chamar a API Gateway (`get-company`, `get-contacts`) e exibir/gravar esses dados nos componentes do Dossiê (ex.: aba Decisores do TOTVSCheckCard usando `onDecisorsLoaded` do DataEnrichModal). Ou seja: a **sincronização de exibição** (Lovable → cards do dossiê) é feita via API e componentes STRATEVO; o iframe apenas mostra o app Lovable na mesma tela.
