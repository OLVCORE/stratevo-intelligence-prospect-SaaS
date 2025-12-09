# 📋 Como Usar o Script de Verificação de Dados

## ⚠️ PROBLEMA IDENTIFICADO

Você está vendo:
- `Error: invalid input syntax for type uuid: "SEU_TENANT_ID_AQUI"` → Você não substituiu o UUID
- `Tabela não existe` → A migration não foi executada

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Listar Tenants Disponíveis

1. Abra o Supabase SQL Editor
2. Execute o arquivo: `scripts/1_PRIMEIRO_LISTAR_TENANTS.sql`
3. Copie o UUID do tenant que você quer verificar (ex: `8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71`)

### PASSO 2: Executar Migration (CRÍTICO - Criar Tabelas Faltantes)

1. No Supabase SQL Editor, execute a migration:
   - Arquivo: `supabase/migrations/20250206000002_create_missing_report_tables.sql`
2. Isso criará as tabelas faltantes:
   - `competitive_analysis`
   - `icp_competitive_swot`
   - `icp_bcg_matrix`
   - `icp_market_insights`

### PASSO 3: Substituir UUID no Script de Verificação

1. Abra o arquivo: `scripts/verificar_dados_completos_PRONTO.sql`
2. Use Ctrl+H (Find & Replace) para substituir **TODAS** as ocorrências de:
   ```
   SUBSTITUA_AQUI_PELO_SEU_TENANT_ID
   ```
   pelo UUID que você copiou (ex: `8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71`)

### PASSO 4: Executar Script de Verificação

1. Cole o script completo (já com o UUID substituído) no Supabase SQL Editor
2. Execute
3. Verifique os resultados

## 🔍 O QUE O SCRIPT VERIFICA

- ✅ Dados das 6 etapas do onboarding (step1 a step5)
- ✅ Produtos do tenant e concorrentes
- ✅ Análises competitivas (SWOT, BCG, Market Insights)
- ✅ Relatórios gerados
- ✅ Estrutura das tabelas

## ❌ SE AINDA MOSTRAR "Tabela não existe"

Execute novamente a migration:
```sql
-- Execute este arquivo completo:
supabase/migrations/20250206000002_create_missing_report_tables.sql
```

## 📊 INTERPRETAÇÃO DOS RESULTADOS

- **0** = Não há dados cadastrados para esse tenant
- **Tabela não existe** = A migration não foi executada
- **Números > 0** = Dados disponíveis ✅

## 🚀 PRÓXIMOS PASSOS

Depois de verificar os dados:
1. Se faltar dados, complete o onboarding nas etapas correspondentes
2. Se faltar tabelas, execute a migration
3. Gere um novo relatório para testar

