# 📊 Como Verificar Logs da Edge Function `generate-icp-report`

## 🎯 Onde Encontrar os Logs

### 1. **Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"Edge Functions"**
4. Clique em **"generate-icp-report"**
5. Clique na aba **"Logs"**

### 2. **Filtrar Logs**
- Use o filtro de tempo (últimas 1h, 24h, etc.)
- Procure por logs que começam com:
  - `[COMPETITIVE-ANALYSIS]`
  - `[PRODUCT-HEATMAP]`
  - `[CLIENT-BCG]`
  - `[GENERATE-ICP-REPORT]`

## 🔍 Logs Importantes para Verificar

### 1. **Concorrentes (Competitive Analysis)**
Procure por:
```
[COMPETITIVE-ANALYSIS] 🔍 Buscando concorrentes:
  - step1_count: [número]
  - step4_count: [número]
  - total: [número]
  - concorrentes: [lista de concorrentes]

[COMPETITIVE-ANALYSIS] ✅ Dados retornados:
  - competitorsCount: [número]
  - competitors: [lista de nomes]
```

**Se `competitorsCount: 0` ou `total: 0`**: Os concorrentes não estão sendo encontrados no onboarding.

### 2. **Produtos (Product Heatmap)**
Procure por:
```
[PRODUCT-HEATMAP] 🔍 Produtos encontrados:
  - tenantProducts: [número]
  - competitorProducts: [número]

[PRODUCT-HEATMAP] ✅ Dados retornados:
  - tenantProductsCount: [número]
  - competitorProductsCount: [número]
```

**Se `tenantProductsCount: 0` e `competitorProductsCount: 0`**: Os produtos não estão sendo encontrados.

### 3. **Clientes e Benchmarking (Client BCG Data)**
Procure por:
```
[CLIENT-BCG] ✅ Dados retornados:
  - clientesCount: [número]
  - benchmarkingCount: [número]
```

**Se `clientesCount: 0` e `benchmarkingCount: 0`**: Os clientes e benchmarking não estão sendo encontrados.

### 4. **Report Model Final**
Procure por:
```
[GENERATE-ICP-REPORT] ✅ Report Model construído:
  - hasCompetitiveAnalysis: true/false
  - competitorsCount: [número]
  - hasProductHeatmap: true/false
  - tenantProductsCount: [número]
  - competitorProductsCount: [número]
  - hasClientBCGData: true/false
  - clientesCount: [número]
  - benchmarkingCount: [número]

[GENERATE-ICP-REPORT] ✅ CONCORRENTES DISPONÍVEIS: [número]
  Concorrente 1: [nome] ([setor], [cidade]/[estado])
  Concorrente 2: [nome] ([setor], [cidade]/[estado])
  ...

[GENERATE-ICP-REPORT] ✅ DIFERENCIAIS DISPONÍVEIS: [lista]
```

### 5. **Salvamento no Banco**
Procure por:
```
[GENERATE-ICP-REPORT] 💾 Salvando relatório no banco:
  - fullReportLength: [número]
  - executiveSummaryLength: [número]

[GENERATE-ICP-REPORT] ✅ UPDATE executado com sucesso:
  - hasFullReportColumn: true/false
  - hasExecutiveSummaryColumn: true/false

[GENERATE-ICP-REPORT] ✅ Relatório salvo. Verificando campos:
  - COLUNAS_NOVAS.hasFullReportMarkdown_COLUMN: true/false
  - COLUNAS_NOVAS.fullReportMarkdown_COLUMN_Length: [número]
```

## 🚨 Problemas Comuns

### Problema 1: `competitorsCount: 0`
**Causa**: Concorrentes não estão no onboarding ou estão em um step diferente.

**Solução**: Verificar se os concorrentes estão em:
- `onboarding_sessions.step1_data.concorrentesDiretos`
- `onboarding_sessions.step4_data.concorrentesDiretos`

### Problema 2: `tenantProductsCount: 0`
**Causa**: Produtos não estão cadastrados na tabela `tenant_products`.

**Solução**: Verificar se há produtos em:
```sql
SELECT COUNT(*) FROM tenant_products WHERE tenant_id = '[seu_tenant_id]';
```

### Problema 3: `competitorProductsCount: 0`
**Causa**: Produtos dos concorrentes não estão cadastrados.

**Solução**: Verificar se há produtos em:
```sql
SELECT COUNT(*) FROM tenant_competitor_products WHERE tenant_id = '[seu_tenant_id]';
```

### Problema 4: `clientesCount: 0` e `benchmarkingCount: 0`
**Causa**: Clientes e benchmarking não estão no onboarding.

**Solução**: Verificar se estão em:
- `onboarding_sessions.step1_data.clientesAtuais`
- `onboarding_sessions.step5_data.clientesAtuais`
- `onboarding_sessions.step5_data.empresasBenchmarking`

### Problema 5: Dados estão sendo buscados mas não aparecem no relatório
**Causa**: A LLM pode estar ignorando os dados ou o prompt não está sendo específico o suficiente.

**Solução**: Verificar se o relatório gerado contém:
- Nomes reais dos concorrentes (não genéricos)
- Produtos reais (não genéricos)
- Clientes reais (não genéricos)

## 📝 Checklist de Verificação

Ao gerar um novo relatório, verifique nos logs:

- [ ] `[COMPETITIVE-ANALYSIS] ✅ Dados retornados` mostra `competitorsCount > 0`
- [ ] `[PRODUCT-HEATMAP] ✅ Dados retornados` mostra `tenantProductsCount > 0` ou `competitorProductsCount > 0`
- [ ] `[CLIENT-BCG] ✅ Dados retornados` mostra `clientesCount > 0` ou `benchmarkingCount > 0`
- [ ] `[GENERATE-ICP-REPORT] ✅ CONCORRENTES DISPONÍVEIS` lista os nomes reais
- [ ] `[GENERATE-ICP-REPORT] ✅ DIFERENCIAIS DISPONÍVEIS` lista os diferenciais reais
- [ ] `[GENERATE-ICP-REPORT] ✅ UPDATE executado com sucesso` mostra `hasFullReportColumn: true`
- [ ] `[GENERATE-ICP-REPORT] ✅ Relatório salvo` mostra `fullReportMarkdown_COLUMN_Length > 0`

## 🔧 Como Copiar os Logs

1. No Supabase Dashboard, vá para **Edge Functions > generate-icp-report > Logs**
2. Selecione o período de tempo (últimas 1h)
3. Copie os logs relevantes (use Ctrl+F para buscar por `[COMPETITIVE-ANALYSIS]`, `[PRODUCT-HEATMAP]`, etc.)
4. Cole aqui para análise

