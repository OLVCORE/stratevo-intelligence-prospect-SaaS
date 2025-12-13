# 🔄 Sistema de Persistência de Dados de Enriquecimento

## 🎯 Objetivo

Garantir que **TODOS os dados enriquecidos** sejam preservados e migrados automaticamente quando uma empresa avança entre as etapas do pipeline:

```
Motor de Qualificação → Estoque Qualificado → Gerenciar Empresas → Quarentena ICP → Leads Aprovados → Pipeline de Vendas
```

## ✅ Implementações Realizadas

### 1. **Persistência em `qualified_prospects` → `companies`**

**Arquivo**: `src/pages/QualifiedProspectsStock.tsx`

**Funções atualizadas**:
- `handlePromoteToCompanies`: Migração em massa
- `handlePromoteIndividualToCompanies`: Migração individual

**Dados preservados**:
- ✅ `website_encontrado` → `companies.website_encontrado`
- ✅ `website_fit_score` → `companies.website_fit_score`
- ✅ `website_products_match` → `companies.website_products_match`
- ✅ `linkedin_url` → `companies.linkedin_url`
- ✅ `fit_score` → `companies.raw_data.fit_score`
- ✅ `grade` → `companies.raw_data.grade`
- ✅ `icp_id` → `companies.raw_data.icp_id`
- ✅ `source_name` → `companies.raw_data.source_name`
- ✅ `enrichment.raw` (Receita Federal) → `companies.raw_data.receita_federal`
- ✅ `enrichment.fantasia` → `companies.raw_data.nome_fantasia`
- ✅ `enrichment.apollo` → `companies.raw_data.apollo`

### 2. **Enriquecimento de Website em `companies`**

**Arquivo**: `src/pages/CompaniesManagementPage.tsx`

**Função**: `handleEnrichWebsite`

**Melhorias**:
- ✅ Busca `qualified_prospect_id` correspondente ao `company_id` (ou cria temporário)
- ✅ Chama Edge Function `scan-prospect-website` corretamente
- ✅ Atualiza tanto `companies` quanto `qualified_prospects` (se existir)
- ✅ Preserva dados existentes em `raw_data`

### 3. **Ações Individuais no Dropdown**

**Arquivo**: `src/pages/QualifiedProspectsStock.tsx`

**Ações adicionadas ao dropdown individual**:
- ✅ "Enviar para Banco de Empresas" (já existia)
- ✅ "Exportar" (NOVO)
- ✅ "Deletar" (já existia)

## ⚠️ Pendências Críticas

### 1. **Sincronização `companies` → `icp_analysis_results`**

**Problema**: Quando uma empresa é enviada de "Gerenciar Empresas" para "Quarentena ICP", os dados enriquecidos não são copiados.

**Solução necessária**:
- Verificar função que cria `icp_analysis_results` a partir de `companies`
- Garantir que todos os dados enriquecidos sejam copiados:
  - `website_encontrado`
  - `website_fit_score`
  - `website_products_match`
  - `linkedin_url`
  - `raw_data.receita_federal`
  - `raw_data.apollo`
  - `raw_data.fit_score`
  - `raw_data.grade`

### 2. **Sincronização `icp_analysis_results` → `leads_pool`**

**Problema**: Quando uma empresa é aprovada da "Quarentena ICP" para "Leads Aprovados", os dados enriquecidos não são copiados.

**Solução necessária**:
- Verificar função que cria `leads_pool` a partir de `icp_analysis_results`
- Garantir que todos os dados enriquecidos sejam copiados

### 3. **Sincronização Bidirecional**

**Problema**: Se uma empresa é enriquecida em uma etapa posterior (ex: "Gerenciar Empresas"), os dados não são sincronizados de volta para etapas anteriores.

**Solução necessária**:
- Criar função de sincronização bidirecional
- Quando enriquecer em `companies`, atualizar também `qualified_prospects` (se existir)
- Quando enriquecer em `icp_analysis_results`, atualizar também `companies` e `qualified_prospects` (se existirem)

## 🔧 Próximos Passos

1. **Identificar funções de migração**:
   - Buscar onde `companies` → `icp_analysis_results`
   - Buscar onde `icp_analysis_results` → `leads_pool`
   - Buscar onde `leads_pool` → `sdr_deals` (Pipeline de Vendas)

2. **Atualizar funções de migração**:
   - Adicionar lógica para copiar todos os dados enriquecidos
   - Preservar dados existentes (merge, não sobrescrever)

3. **Criar função de sincronização**:
   - Função RPC no Supabase para sincronizar dados entre tabelas
   - Chamar automaticamente após cada enriquecimento

4. **Testar fluxo completo**:
   - Enriquecer em "Motor de Qualificação"
   - Verificar se dados aparecem em "Estoque Qualificado"
   - Enviar para "Gerenciar Empresas"
   - Verificar se dados aparecem em "Gerenciar Empresas"
   - Enviar para "Quarentena ICP"
   - Verificar se dados aparecem em "Quarentena ICP"
   - Aprovar para "Leads Aprovados"
   - Verificar se dados aparecem em "Leads Aprovados"

## 📋 Checklist de Verificação

- [x] Dados enriquecidos são copiados de `qualified_prospects` → `companies`
- [x] Enriquecimento de website funciona em `companies`
- [x] Todas as ações em massa estão no dropdown individual
- [ ] Dados enriquecidos são copiados de `companies` → `icp_analysis_results`
- [ ] Dados enriquecidos são copiados de `icp_analysis_results` → `leads_pool`
- [ ] Sincronização bidirecional entre tabelas
- [ ] Teste de fluxo completo end-to-end

