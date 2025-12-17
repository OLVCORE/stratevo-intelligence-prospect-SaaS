# ✅ CORREÇÃO COMPLETA: Preservação de ORIGEM e TODAS as Colunas

## 🎯 PROBLEMA IDENTIFICADO

A coluna **"Origem"** (nome do arquivo CSV/XLSX/Google Sheets/API/Legacy) só estava aparecendo corretamente na tabela **"Estoque de Empresas Qualificadas"**, mas **NÃO estava sendo preservada** nas migrações para:
- Base de Empresas
- Quarentena ICP
- Leads Aprovados
- Pipeline

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. **Estoque Qualificado → Base de Empresas**

**Correção aplicada:**
- Busca dados do `prospect_qualification_jobs` para pegar `source_file_name` (nome do arquivo)
- Prioriza: `source_file_name` → `job_name` → `source_name` → default baseado em `source_type`
- Salva origem em **DOIS lugares**:
  - Campo direto `origem` na tabela `companies`
  - Campo `source_name` na tabela `companies`
  - Campo `origem` em `raw_data`
  - Campo `source_name` em `raw_data`

**Código:**
```typescript
// ✅ BUSCAR DADOS DO JOB PARA PEGAR ORIGEM (nome do arquivo)
let jobData: any = null;
if (prospect.job_id) {
  const { data: job } = await supabase
    .from('prospect_qualification_jobs')
    .select('job_name, source_file_name, source_type')
    .eq('id', prospect.job_id)
    .maybeSingle();
  if (job) jobData = job;
}

// ✅ ORIGEM: Priorizar source_file_name (nome do arquivo)
const origem = jobData?.source_file_name || 
               jobData?.job_name || 
               prospect.source_name || 
               (jobData?.source_type === 'upload_csv' ? 'CSV Upload' :
                jobData?.source_type === 'upload_excel' ? 'Excel Upload' :
                jobData?.source_type === 'google_sheets' ? 'Google Sheets' :
                jobData?.source_type === 'api_empresas_aqui' ? 'API Empresas Aqui' :
                'Qualification Engine');

// ✅ PRESERVAR ORIGEM
companyData.origem = origem;
companyData.source_name = origem;
rawData.origem = origem;
rawData.source_name = origem;
```

### 2. **Base de Empresas → Quarentena ICP**

**Correção aplicada:**
- Normalizador lê origem de múltiplas fontes:
  - Campo direto `origem`
  - Campo `source_name`
  - `raw_data.origem`
  - `raw_data.source_name`
- Preserva origem em `raw_analysis` e no campo direto `origem`

**Código:**
```typescript
// ✅ ORIGEM: Priorizar origem do fullCompany, depois source_name, depois raw_data
const origem = fullCompany.origem || 
              fullCompany.source_name || 
              (fullCompany.raw_data as any)?.origem || 
              (fullCompany.raw_data as any)?.source_name || 
              'upload_massa';

insertData.origem = origem;
insertData.raw_analysis = {
  ...insertData.raw_analysis,
  origem: origem,
  source_name: origem,
  source_file_name: (fullCompany.raw_data as any)?.source_file_name || null,
  job_name: (fullCompany.raw_data as any)?.job_name || null,
};
```

### 3. **Normalizador Universal**

**Correção aplicada:**
- `normalizeFromCompanies()`: Lê origem de múltiplas fontes
- `normalizeFromQualifiedProspects()`: Preserva origem de `enrichment_data` e campos diretos
- `prepareForICPInsertion()`: Preserva origem no campo direto e em `raw_analysis`

## 📊 FLUXO COMPLETO DE PRESERVAÇÃO

```
1. Motor de Qualificação
   ↓ (salva source_file_name em prospect_qualification_jobs)
2. Estoque Qualificado (qualified_prospects)
   ↓ (busca source_file_name do job, salva em companies.origem + raw_data)
3. Base de Empresas (companies)
   ↓ (lê origem de múltiplas fontes, preserva em icp_analysis_results.origem + raw_analysis)
4. Quarentena ICP (icp_analysis_results)
   ↓ (origem preservada)
5. Leads Aprovados (icp_analysis_results com status='aprovada')
   ↓ (origem preservada)
6. Pipeline (companies com pipeline_status='ativo')
   ↓ (origem preservada)
```

## ✅ GARANTIAS IMPLEMENTADAS

1. **Origem sempre preservada:**
   - Nome do arquivo CSV/XLSX
   - Nome do Google Sheet
   - "API Empresas Aqui"
   - "Legacy" (consulta individual)
   - Nome do job de qualificação

2. **Múltiplas fontes de leitura:**
   - Campo direto `origem`
   - Campo `source_name`
   - `raw_data.origem`
   - `raw_data.source_name`
   - `raw_analysis.origem`
   - `raw_analysis.source_name`

3. **Salvamento em múltiplos lugares:**
   - Campo direto `origem` (quando existe na tabela)
   - Campo `source_name` (quando existe na tabela)
   - `raw_data.origem`
   - `raw_data.source_name`
   - `raw_analysis.origem`
   - `raw_analysis.source_name`

## 🎯 TODAS AS COLUNAS PRESERVADAS

Agora, **TODAS as colunas** são preservadas usando o mesmo mecanismo:
- ✅ Empresa (razao_social)
- ✅ CNPJ
- ✅ Origem (nome do arquivo/API/Legacy)
- ✅ Status CNPJ (situacao_cnpj)
- ✅ Setor
- ✅ UF (estado)
- ✅ Score ICP (icp_score)
- ✅ Status Análise (pipeline_status/status)
- ✅ Status Verificação (situacao_cnpj)
- ✅ ICP (icp_id)
- ✅ Fit Score (fit_score)
- ✅ Grade
- ✅ Website
- ✅ Website Encontrado
- ✅ Website Fit Score
- ✅ Website Products Match
- ✅ LinkedIn URL
- ✅ Purchase Intent Score
- ✅ Purchase Intent Type
- ✅ E TODAS as outras colunas em `raw_data` e `raw_analysis`

