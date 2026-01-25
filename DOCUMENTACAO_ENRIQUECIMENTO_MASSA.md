# 📋 Documentação Completa: Enriquecimento em Massa - Leads Aprovados

## 🎯 Visão Geral

Este documento detalha todas as funções de enriquecimento em massa disponíveis na página de **Leads Aprovados** (`ApprovedLeads.tsx`), explicando o que cada uma faz, quais dados atualiza e onde salva.

---

## 1️⃣ **Enriquecimento Receita Federal** (`handleBulkEnrichReceita`)

### 📍 **O que faz:**
- Enriquece empresas selecionadas com dados da **Receita Federal** via BrasilAPI
- Atualiza informações cadastrais básicas da empresa

### 🔄 **Dados atualizados em `icp_analysis_results`:**
- `uf` - Unidade Federativa (estado)
- `municipio` - Município da empresa
- `porte` - Porte da empresa (ex: "ME", "EPP", "DEMAIS")
- `cnae_principal` - Código CNAE formatado (ex: "28.33-0/00")
- `raw_data.receita_federal` - Dados completos da Receita Federal
- `raw_data.receita_source` - Fonte dos dados (ex: "brasilapi")
- `raw_analysis.cnae_descricao` - Descrição do CNAE principal
- `raw_analysis.enriched_receita_at` - Timestamp do enriquecimento

### 🔄 **Dados atualizados em `companies` (se `company_id` existir):**
- `cnpj_status` - Status do CNPJ (ativa/inativo/pendente) baseado em `situacao`

### ⚙️ **Função utilizada:**
- `enrichReceitaMutation` → `consultarReceitaFederal()`

### 💾 **Onde salva:**
- Tabela: `icp_analysis_results`
- Tabela: `companies` (apenas se `company_id` existir)

---

## 2️⃣ **Enriquecimento Apollo - Decisores** (`handleBulkEnrichApollo`)

### 📍 **O que faz:**
- Busca **decisores** (decision makers) no Apollo.io para empresas selecionadas
- Identifica pessoas-chave (executivos, gerentes, diretores) da empresa
- Mostra modal de progresso em tempo real
- Processa empresas **sequencialmente** com delay de 1 segundo entre cada uma

### 🔄 **Dados atualizados em `icp_analysis_results`:**
- `raw_data.apollo_organization` - Dados da organização no Apollo
- `raw_data.apollo_decisores` - Lista de decisores encontrados
- `raw_data.apollo_enriched_at` - Timestamp do enriquecimento
- `decision_makers_count` - Quantidade de decisores identificados

### ⚙️ **Função utilizada:**
- `enrichApolloMutation` → Edge Function `enrich-apollo-decisores`
- **Parâmetros enviados:**
  - `company_id` - ID da empresa (obrigatório)
  - `company_name` - Nome da empresa
  - `domain` - Domínio/website
  - `modes: ['people', 'company']` - Busca pessoas e dados da empresa
  - `city`, `state`, `industry`, `cep`, `fantasia` - Dados adicionais para melhor matching

### 💾 **Onde salva:**
- Tabela: `icp_analysis_results` (via Edge Function que atualiza internamente)

### 🎨 **Interface:**
- Modal de progresso (`EnrichmentProgressModal`) com:
  - Barra de progresso (percentual)
  - Cards individuais por empresa com status visual
  - Status: pending → processing → success/error
  - Botão de cancelamento (interrompe processamento)
  - Mensagens: "Buscando decisores no Apollo..." / "Decisores identificados!" / "Falha ao buscar decisores"

### ⏱️ **Tempo:**
- ~5-10 segundos por empresa
- Delay de 1 segundo entre empresas

---

## 3️⃣ **Enriquecimento Website & LinkedIn** (`handleBulkEnrichWebsite`)

### 📍 **O que faz:**
- Busca e escaneia **website oficial** da empresa
- Calcula **Website Fit Score** (compatibilidade com produtos do tenant)
- Identifica **produtos compatíveis** no website
- Busca **URL do LinkedIn** da empresa
- Processa empresas **sequencialmente** (sem delay explícito)

### 🔄 **Dados atualizados em `icp_analysis_results`:**
- `website_encontrado` - URL do website oficial encontrado
- `website_fit_score` - Score de compatibilidade (0-20)
- `website_products_match` - Array de produtos compatíveis encontrados
- `linkedin_url` - URL do LinkedIn da empresa

### ⚙️ **Funções utilizadas:**
- `handleEnrichWebsite()` → Edge Functions:
  1. `find-prospect-website` - Busca website via `fetch()` direto
     - **Parâmetros:** `razao_social`, `cnpj`, `tenant_id`
  2. `scan-prospect-website` - Escaneia e calcula fit score via `supabase.functions.invoke()`
     - **Parâmetros:** `tenant_id`, `company_id`, `cnpj`, `website_url`, `razao_social`

### 💾 **Onde salva:**
- Tabela: `icp_analysis_results`

### ⚠️ **Erros conhecidos:**
- **CORS error** ao chamar `scan-prospect-website` via `fetch()` direto
- **Solução:** Já corrigido no código (linha 1265 usa `supabase.functions.invoke()`)
- Se ainda ocorrer, verificar configuração CORS na Edge Function

### ⏱️ **Tempo:**
- ~10-15 segundos por empresa (busca + escaneamento)

---

## 4️⃣ **Enriquecimento 360°** (`handleBulkEnrich360`)

### 📍 **O que faz:**
- Calcula **scores 360°** de análise completa da empresa:
  - **Presença Digital** - Website, redes sociais, SEO
  - **Maturidade** - Tempo de mercado, estrutura
  - **Saúde Financeira** - Indicadores financeiros
- Processa empresas **sequencialmente** (sem delay explícito)

### 🔄 **Dados atualizados em `icp_analysis_results`:**
- `raw_data.enrichment_360.scores` - Objeto com todos os scores calculados
- `raw_data.enrichment_360.analysis` - Análise detalhada
- `raw_data.enrichment_360.calculated_at` - Timestamp

### ⚙️ **Função utilizada:**
- `enrich360Mutation` → `enrichment360Simplificado()`
- **Parâmetros:**
  - `razao_social` - Nome da empresa
  - `website`, `domain` - Website/domínio
  - `uf`, `municipio`, `porte` - Localização e porte
  - `cnae` - Código CNAE
  - `raw_data` - Dados brutos existentes

### 💾 **Onde salva:**
- Tabela: `icp_analysis_results`

### 📊 **Scores calculados:**
- **Presença Digital Score** - Baseado em website, redes sociais, SEO
- **Maturidade Score** - Baseado em tempo de mercado, estrutura
- **Saúde Financeira Score** - Baseado em indicadores financeiros disponíveis

### ⏱️ **Tempo:**
- ~2-5 segundos por empresa (cálculo local, sem API externa)

---

## 5️⃣ **Verificação em Massa** (`handleBulkVerification`)

### 📍 **O que faz:**
- **Processamento completo em lote** que executa 4 etapas automaticamente:
  1. ✅ **Verificação de Uso (GO/NO-GO)** - Detecta se empresa usa TOTVS
     - Busca evidências em múltiplas fontes
     - Calcula score de confiança
     - Classifica como "go" ou "no-go"
  2. ✅ **Decisores Apollo** - Busca decisores (sempre, GO ou NO-GO)
     - Usa dados da Receita Federal para melhor matching
     - Busca pessoas-chave da empresa
  3. ✅ **Digital Intelligence** - Descobre website/LinkedIn (se disponível)
     - Extrai website e LinkedIn dos dados dos decisores
  4. ✅ **Salva Relatório Completo** - Persiste tudo em `stc_verification_history`
     - Relatório completo com todas as etapas
     - Metadados de processamento

### 🔄 **Dados atualizados em `stc_verification_history`:**
- `company_id` - ID da empresa
- `company_name` - Nome da empresa
- `cnpj` - CNPJ
- `status` - "go" ou "no-go"
- `confidence` - Nível de confiança (low/medium/high)
- `triple_matches` - Matches triplos encontrados
- `double_matches` - Matches duplos encontrados
- `single_matches` - Matches únicos encontrados
- `total_score` - Score total de verificação
- `evidences` - Array de evidências encontradas
- `sources_consulted` - Número de fontes consultadas
- `queries_executed` - Número de queries executadas
- `full_report` - Relatório completo JSONB com:
  - `detection_report` - Resultado da verificação
  - `decisors_report` - Dados dos decisores
  - `keywords_seo_report` - Dados de presença digital
  - `__status` - Status de cada etapa
  - `__meta` - Metadados do processamento

### ⚙️ **Edge Functions utilizadas:**
1. `usage-verification` - Verifica uso de TOTVS
   - **Parâmetros:** `company_name`, `cnpj`, `domain`, `company_id`
   - **Retorna:** `status` (go/no-go), `confidence`, `evidences`, `methodology`
2. `enrich-apollo-decisores` - Busca decisores
   - **Parâmetros:** `companyName`, `company_id`, `linkedinUrl`, `modes`, `domain`, `city`, `state`, `cep`, `fantasia`
   - **Retorna:** `decisores` (array), `companyData` (website, linkedinUrl)

### 💾 **Onde salva:**
- Tabela: `stc_verification_history` (novo registro para cada empresa)
- **Estrutura do `full_report`:**
  ```json
  {
    "detection_report": { /* resultado verificação */ },
    "decisors_report": { /* dados decisores */ },
    "keywords_seo_report": { /* presença digital */ },
    "__status": {
      "detection": { "status": "completed" },
      "decisors": { "status": "completed" },
      "keywords": { "status": "completed" }
    },
    "__meta": {
      "saved_at": "timestamp",
      "batch_processing": true,
      "version": "2.0",
      "company": "nome empresa"
    }
  }
  ```

### ⏱️ **Tempo estimado:**
- ~35 segundos por empresa (verificação + decisores + digital)
- Delay de 2 segundos entre empresas (evita rate limit)

### 💰 **Custo estimado:**
- ~150 créditos por empresa
- ~R$ 1,00 por empresa

### 📊 **Resultados:**
- Contabiliza GO/NO-GO (mas **não auto-descarta** empresas NO-GO)
- Empresas NO-GO ficam na quarentena para **revisão manual**
- Usuário decide se descarta ou não (pode haver falsos positivos)

---

## 6️⃣ **Enriquecimento LinkedIn** (se existir)

### 📍 **Status:**
- Não encontrada função específica `handleBulkEnrichLinkedIn`
- LinkedIn é buscado automaticamente durante:
  - Enriquecimento Website (`handleBulkEnrichWebsite`)
  - Verificação em Massa (`handleBulkVerification`)

---

## 🎨 **Modal de Progresso - Correções Aplicadas**

### ✅ **Problema corrigido:**
- Cards internos vazando para fora do modal

### 🔧 **Soluções implementadas:**
1. **Layout flexbox com altura controlada:**
   - `max-h-[85vh]` no DialogContent
   - `flex flex-col` para estrutura vertical
   - `flex-1 min-h-0` no container do ScrollArea

2. **ScrollArea com overflow controlado:**
   - Container com `border rounded-md overflow-hidden`
   - ScrollArea com `h-full` (ocupa espaço disponível)
   - Padding interno nos cards (`p-4`)

3. **Botões fixos no rodapé:**
   - `flex-shrink-0` para não encolher
   - `border-t` para separação visual

4. **Truncamento de texto:**
   - `truncate` nos nomes de empresas longos
   - `max-w-[300px]` no texto "Processando"

---

## 📊 **Resumo das Funções**

| Função | O que faz | Tabela atualizada | Edge Function |
|--------|-----------|-------------------|---------------|
| `handleBulkEnrichReceita` | Dados Receita Federal | `icp_analysis_results`, `companies` | `consultarReceitaFederal()` |
| `handleBulkEnrichApollo` | Decisores Apollo | `icp_analysis_results` | `enrich-apollo-decisores` |
| `handleBulkEnrichWebsite` | Website + Fit Score | `icp_analysis_results` | `find-prospect-website`, `scan-prospect-website` |
| `handleBulkEnrich360` | Scores 360° | `icp_analysis_results` | `enrichment360Simplificado()` |
| `handleBulkVerification` | Verificação completa (GO/NO-GO + Decisores + Digital) | `stc_verification_history` | `usage-verification`, `enrich-apollo-decisores` |

---

## ⚠️ **Erros Conhecidos e Soluções**

### 1. **CORS Error no scan-prospect-website**
- **Erro:** `Access to fetch blocked by CORS policy`
- **Causa:** Chamada direta via `fetch()` em vez de `supabase.functions.invoke()`
- **Solução:** Já corrigido no código (linha 1265 usa `supabase.functions.invoke()`)

### 2. **Logs excessivos no console**
- **Problema:** Muitos logs `[APPROVED] Total do banco: 12`
- **Causa:** Re-renders frequentes do componente
- **Solução:** Considerar usar `useMemo` ou `useCallback` para reduzir logs

### 3. **Modal com cards vazando**
- **Problema:** Cards ultrapassando limites do modal
- **Solução:** ✅ **CORRIGIDO** - Layout flexbox com altura controlada

---

## 🔄 **Fluxo Recomendado de Enriquecimento**

1. **Receita Federal** → Dados básicos (UF, município, porte, CNAE)
2. **Website** → Website oficial + Fit Score
3. **Apollo Decisores** → Pessoas-chave da empresa
4. **360°** → Scores de análise completa
5. **Verificação** → Processamento completo (GO/NO-GO + tudo acima)

---

## 📝 **Notas Importantes**

- Todas as funções processam empresas **sequencialmente** (não em paralelo)
- Delays entre empresas para evitar rate limits (1-2 segundos)
- Modal de progresso apenas para **Apollo Decisores**
- Erros não interrompem o processamento (continua para próxima empresa)
- Dados são salvos **incrementalmente** (não sobrescreve dados existentes)
