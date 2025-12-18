# 🔧 APLICAR MIGRATION: Colunas de Website em Todas as Tabelas

## ⚠️ PROBLEMA CRÍTICO
As transferências estão falhando com erro `PGRST204` porque as colunas `website_fit_score`, `website_encontrado`, `website_products_match` e `linkedin_url` não existem em todas as tabelas.

## ✅ SOLUÇÃO
Aplicar a migration `20250225000004_ensure_website_columns_all_tables.sql` que garante que TODAS as tabelas tenham as mesmas colunas.

## 📋 TABELAS QUE SERÃO ATUALIZADAS
1. ✅ `qualified_prospects` (Estoque Qualificado)
2. ✅ `companies` (Base de Empresas) 
3. ✅ `icp_analysis_results` (Quarentena ICP e Leads Aprovados)

## 🔨 COMO APLICAR

### Opção 1: Via Supabase Dashboard (Recomendado)
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo:
   `supabase/migrations/20250225000004_ensure_website_columns_all_tables.sql`
4. Execute o script
5. Verifique se não há erros

### Opção 2: Via CLI do Supabase
```bash
supabase db push
```

### Opção 3: Via Migration Manual
Se você tem acesso direto ao banco:
```sql
-- Execute o arquivo completo:
-- supabase/migrations/20250225000004_ensure_website_columns_all_tables.sql
```

## ✅ VERIFICAÇÃO
Após aplicar a migration, verifique se as colunas existem:

```sql
-- Verificar colunas em companies
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'companies'
  AND column_name IN ('website_encontrado', 'website_fit_score', 'website_products_match', 'linkedin_url');

-- Verificar colunas em icp_analysis_results
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'icp_analysis_results'
  AND column_name IN ('website_encontrado', 'website_fit_score', 'website_products_match', 'linkedin_url');

-- Verificar colunas em qualified_prospects
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'qualified_prospects'
  AND column_name IN ('website_encontrado', 'website_fit_score', 'website_products_match', 'linkedin_url');
```

Todas as 3 tabelas devem retornar 4 linhas (uma para cada coluna).

## 🎯 RESULTADO ESPERADO
Após aplicar a migration:
- ✅ Todas as tabelas terão as mesmas colunas de website
- ✅ Transferências entre tabelas funcionarão corretamente
- ✅ Dados enriquecidos serão preservados durante migrações
- ✅ Erro PGRST204 não ocorrerá mais

## ⚠️ IMPORTANTE
Esta migration é **idempotente** (pode ser executada múltiplas vezes sem problemas). Ela verifica se as colunas existem antes de adicioná-las.
