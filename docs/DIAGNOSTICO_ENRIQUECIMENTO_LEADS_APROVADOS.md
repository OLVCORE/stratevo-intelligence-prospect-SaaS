# Diagnóstico: Enriquecimento Receita Federal e Inteligência em Leads Aprovados

**Objetivo:** Verificar se as correções recentes (useApprovedCompanies, DecisorsContactsTab, tipos) quebraram o mecanismo de enriquecimento da Receita Federal, CNAEs completos, badges de setor/segmento e status CNPJ ativo na tela de Leads Aprovados.  
**Não foram aplicadas nem executadas alterações neste diagnóstico.**

---

## 1. Onde a inteligência aparece (Leads Aprovados)

Na página **Leads Aprovados** (`ApprovedLeads.tsx`), cada linha da tabela usa o objeto `company` que vem **diretamente** do hook `useApprovedCompanies()`. Toda a inteligência exibida depende desse objeto:

| O que aparece na tela | De onde vem no `company` |
|-----------------------|---------------------------|
| **CNAE principal + secundários** (completo, com descrição) | `resolveCompanyCNAE(company)` → usa `company.raw_data`, `company.raw_analysis`, `company.cnae_principal` |
| **Badges Setor / Segmento (categoria)** | `getCNAEClassificationForCompany(company)` → usa CNAE resolvido + `cnaeClassifications` |
| **CNPJ ativo / inativo / inexistente** | `QuarantineCNPJStatusBadge` → usa `rawData?.receita_federal`, `rawData.situacao`, `company.cnpj_status` |
| **Status de enriquecimento (Receita / Apollo / 360°)** | `QuarantineEnrichmentStatusBadge` → usa `rawAnalysis` = `company.raw_data` (receita_federal, apollo, enrichment_360) |
| **UF, cidade** | `getCompanyUF(company)`, `getCompanyCity(company)` → usam `company.raw_data.receita_federal`, `company.uf`, etc. |
| **ICP, Fit Score, Grade** | `company.raw_data`, `company.raw_analysis` |

Ou seja: **tudo** depende de o hook devolver linhas com `raw_data` (e, onde for usado, `raw_analysis`) preenchidos e, quando existir, `cnae_principal` / setor no nível da linha.

---

## 2. O que o `useApprovedCompanies` devolve hoje

### Caminho A – Existem aprovadas (`icp_analysis_results.status = 'aprovada'`)

- Query: `supabase.from('icp_analysis_results').select('*').eq('status', 'aprovada')...`
- Retorno: **a linha inteira** de `icp_analysis_results`, sem remoção de colunas.
- Inclui, entre outras:
  - `raw_data` (Receita Federal, Apollo, 360°, situacao, etc.)
  - `raw_analysis`
  - `cnae_principal`, `cnae_descricao`, `cnaes_secundarios` (se existirem na tabela)
  - `setor`, `sector_name` (se existirem)
  - Demais campos da análise (icp_score, temperatura, company_id, cnpj, razao_social, etc.)

**Conclusão:** Nesse fluxo, **nada do mecanismo de enriquecimento foi removido**. CNAEs completos, badges de setor/segmento, CNPJ ativo e status de enriquecimento continuam alimentados pelos mesmos campos.

### Caminho B – Fallback (zero aprovadas → lista da tabela `companies`)

- Quando não há nenhuma linha com `status = 'aprovada'`, o hook busca até 100 empresas em `companies` e **monta manualmente** um objeto por empresa.
- O mapeamento atual **só** preenche:
  - `id`, `company_id`, `cnpj` (de `raw_data` da company), `razao_social` (name/company_name)
  - `icp_score: 0`, `temperatura: 'cold'`, `status: 'aprovada'`, `decision_makers_count: 0`
  - **`raw_data`** = `c.raw_data` da company (se existir)
  - `website`, `industry`, `_from_fallback: true`

O que **não** é copiado no fallback:

- `raw_analysis`
- `cnae_principal`, `cnae_descricao`, `cnaes_secundarios`
- `setor`, `sector_name`
- `cnpj_status`, `porte`, `uf`, etc.

Efeito prático:

- Se a company tiver **Receita Federal em `companies.raw_data`** (ex.: `raw_data.receita_federal`, `raw_data.receita`), o `resolveCompanyCNAE` ainda consegue CNAE pela **prioridade 2** do `cnaeResolver` (raw_data), e o badge de CNPJ ativo continua usando `rawData.situacao` / `receita_federal`.
- Se a company **não** tiver `raw_data` enriquecido (ex.: nunca foi enriquecida na base), a linha em fallback tende a mostrar “Sem CNAE”, setor/segmento vazios e status de CNPJ “Pendente” ou N/A.

Ou seja: no fallback a inteligência **pode** parecer “quebrada” só porque o objeto é mínimo e não repassa `raw_analysis` nem campos de setor/cnae de nível superior; o desenho do fallback já era esse (evitar tela vazia), não foi alterado pela última leva de correções.

---

## 3. O que foi alterado nas correções (e o que não foi)

### 3.1 `useApprovedCompanies.ts`

- **Query de aprovadas:** continua `select('*')` (sem reduzir colunas). Nenhuma coluna de enriquecimento foi removida.
- **Fallback:** apenas ajustes de tipo (`website`/`industry` como `string | null`) e garantia de que `raw_data` da company é repassado. Nenhuma lógica nova que **apague** receita_federal, CNAE ou setor.
- **useSendToPipeline:** apenas tipagem e payload do insert em `sdr_deals`. Não mexe em leitura de `icp_analysis_results` nem em exibição na tabela.

**Conclusão:** para o **caminho A** (dados vindos de `icp_analysis_results`), o mecanismo de enriquecimento da Receita Federal (CNAEs, setor/segmento, CNPJ ativo) **não foi quebrado** pelas correções.

### 3.2 `DecisorsContactsTab.tsx`

- Ajustes foram apenas:
  - Query de **companies** no `onSuccess` da análise LinkedIn (recarregar Apollo Organization): de `select('raw_data, industry, name')` para `select('*')` + type assertion.
  - Tipos dos filtros (uniqueBuyingPowers, etc.) e uso de `sonnerToast.success` em vez de `toast.success`.

Isso **não** afeta a tela de Leads Aprovados nem a fonte de dados dela (`useApprovedCompanies`).

### 3.3 `ApprovedLeads.tsx`

- Nenhuma alteração foi feita nessa última rodada de correções. A página continua usando os mesmos helpers e a mesma definição de `rawData` a partir de `company.raw_data`.

---

## 4. Fluxo de dados (resumo)

```
useApprovedCompanies()
  ├─ [A] Há aprovadas → icp_analysis_results com select('*')
  │     → company = linha completa (raw_data, raw_analysis, cnae_*, setor, etc.)
  │     → CNAE, setor/segmento, CNPJ ativo, badges = OK
  │
  └─ [B] Zero aprovadas → fallback companies
        → company = objeto montado (id, cnpj, razao_social, raw_data da company, website, industry, _from_fallback)
        → CNAE/setor/CNPJ ativo só aparecem se companies.raw_data tiver receita_federal/situacao
        → raw_analysis e setor/sector_name de nível superior não existem no objeto
```

Os componentes que **consumem** essa inteligência não foram alterados:

- `resolveCompanyCNAE(company)` em `cnaeResolver.ts` – inalterado.
- `getCNAEClassificationForCompany(company)` em `ApprovedLeads` – inalterado.
- `QuarantineCNPJStatusBadge` / `QuarantineEnrichmentStatusBadge` – inalterados.
- Serviço de Receita Federal e persistência de enriquecimento – não tocados.

---

## 5. Quando algo pode “parecer quebrado”

1. **Só está vendo fallback (caminho B)**  
   - Ex.: não há nenhuma linha em `icp_analysis_results` com `status = 'aprovada'`.  
   - Aí a lista vem de `companies` e muitas linhas podem não ter `raw_data` enriquecido → “Sem CNAE”, setor vazio, CNPJ “Pendente”. Isso é limitação do **desenho do fallback**, não da última correção.

2. **Dados nunca foram persistidos**  
   - Enriquecimento de Receita Federal pode estar sendo feito em outro fluxo (ex.: QualifiedProspectsStock, CompaniesManagement) e não estar sendo gravado em `icp_analysis_results.raw_data` / `raw_analysis` para as aprovadas. Aí a tabela continuaria “vazia” de inteligência mesmo com select('*').

3. **RLS ou filtro por tenant**  
   - Se a query de `icp_analysis_results` ou `companies` estiver filtrando/limitando linhas por tenant ou permissão, o usuário pode estar vendo menos linhas ou só fallback, e achar que “sumiu” a inteligência.

4. **Outra tela**  
   - Este diagnóstico cobre apenas **Leads Aprovados** e a fonte `useApprovedCompanies`. Quebras em outras telas (ex.: estoque de qualificados, gestão de empresas) precisam de análise separada.

---

## 6. Conclusão do diagnóstico

- **Caminho principal (aprovadas em `icp_analysis_results`):** o mecanismo de enriquecimento da Receita Federal (CNAEs completos, badges de setor/segmento, CNPJ ativo, status de enriquecimento) **não foi quebrado** pelas correções. A query segue com `select('*')` e a página continua usando `company.raw_data` e `company.raw_analysis` da mesma forma.
- **Caminho fallback (companies):** a inteligência pode parecer incompleta porque o objeto retornado é mínimo e não repassa `raw_analysis` nem setor/cnae de nível superior; isso já era o desenho do fallback.
- **DecisorsContactsTab e useSendToPipeline:** alterações não impactam a tela de Leads Aprovados nem a lógica de CNAE/Receita Federal nela.

Se na sua base há aprovadas com `raw_data`/`raw_analysis` preenchidos e mesmo assim a tela não mostra CNAE/setor/CNPJ ativo, o próximo passo é checar: (1) se a lista que está sendo exibida é realmente do caminho A (aprovadas) ou do B (fallback); (2) se os dados estão de fato em `icp_analysis_results` para essas linhas; (3) se não há outro bug (ex.: RLS, filtro, outra página).

Nenhuma alteração de código foi aplicada ou executada neste diagnóstico.
