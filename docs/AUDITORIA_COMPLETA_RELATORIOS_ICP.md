# 🔍 AUDITORIA COMPLETA - Relatórios ICP e Dados Reais

## 📊 RESUMO EXECUTIVO

Esta auditoria verifica **TODAS** as tabelas, campos e funções necessárias para que os relatórios ICP usem dados reais da plataforma.

## 🎯 FUNÇÃO PRINCIPAL

**Edge Function**: `generate-icp-report`

**Localização dos Logs**: Supabase Dashboard > Edge Functions > generate-icp-report > Logs

## 📋 TABELAS NECESSÁRIAS

### Tabelas Obrigatórias (já devem existir)

1. ✅ `icp_reports` - Relatórios gerados
2. ✅ `icp_profiles_metadata` - Metadados do ICP
3. ✅ `tenants` - Dados do tenant
4. ✅ `onboarding_sessions` - Dados do onboarding
5. ✅ `competitive_analysis` - Análise competitiva
6. ✅ `tenant_products` - Produtos do tenant
7. ✅ `tenant_competitor_products` - Produtos dos concorrentes
8. ✅ `companies` - Dados de empresas (MC8)
9. ✅ `icp_analysis_criteria` - Critérios de análise

### Tabelas Opcionais (podem não existir)

10. ⚠️ `icp_competitive_swot` - SWOT baseada em produtos
11. ⚠️ `icp_bcg_matrix` - Matriz BCG
12. ⚠️ `icp_market_insights` - Insights de mercado

## 🔧 COMANDOS SQL

### 1. Criar Tabelas Faltantes

**Arquivo**: `supabase/migrations/20250206000002_create_missing_report_tables.sql`

Execute este arquivo no Supabase SQL Editor para criar as tabelas faltantes.

### 2. Verificar Dados Reais

**Arquivo**: `scripts/verificar_dados_relatorios.sql`

Execute este script substituindo `:'tenant_id'` pelo seu tenant_id real.

## 🚀 COMANDOS POWERSHELL

**Arquivo**: `scripts/testar_edge_function.ps1`

Execute este script no PowerShell após configurar:
- `$supabaseUrl` - URL do seu projeto Supabase
- `$supabaseAnonKey` - Chave anônima do Supabase
- `$tenantId` - ID do seu tenant
- `$icpMetadataId` - ID do ICP

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de Gerar Relatório:

- [ ] Execute `scripts/verificar_dados_relatorios.sql` no Supabase
- [ ] Verifique se todas as tabelas existem
- [ ] Verifique se há concorrentes no onboarding (Step1 ou Step4)
- [ ] Verifique se há produtos em `tenant_products`
- [ ] Verifique se há clientes no onboarding (Step1 ou Step5)
- [ ] Verifique se há benchmarking no Step5
- [ ] Verifique se há diferenciais no Step4

### Após Gerar Relatório:

- [ ] Verifique logs da Edge Function
- [ ] Procure por `[COMPETITIVE-ANALYSIS] ✅ Dados retornados`
- [ ] Procure por `[PRODUCT-HEATMAP] ✅ Dados retornados`
- [ ] Procure por `[CLIENT-BCG] ✅ Dados retornados`
- [ ] Procure por `[GENERATE-ICP-REPORT] ✅ CONCORRENTES DISPONÍVEIS`
- [ ] Verifique se o relatório salvo tem `full_report_markdown` preenchido

## 📝 PRÓXIMOS PASSOS

1. **Execute a migration** `20250206000002_create_missing_report_tables.sql`
2. **Execute o script de verificação** `verificar_dados_relatorios.sql`
3. **Execute o script PowerShell** `testar_edge_function.ps1`
4. **Gere um novo relatório** e verifique os logs
5. **Compartilhe os resultados** para análise final
