# 🚨 MIGRATION CRÍTICA: Garantir todas as colunas em icp_analysis_results

## Problema
A tabela `icp_analysis_results` está faltando colunas necessárias para receber dados de `companies`, causando erro 400 ao tentar migrar empresas para Quarentena ICP.

## Erro Observado
```
Failed to load resource: the server responded with a status of 400 ()
⚠️⚠️⚠️ ERRO DE SCHEMA: Coluna não encontrada na tabela icp_analysis_results!
```

## Colunas Faltantes Identificadas
As seguintes colunas estão sendo enviadas no payload mas podem não existir na tabela:
- `fit_score` - Score de compatibilidade com ICP
- `purchase_intent_score` - Score de intenção de compra
- `purchase_intent_type` - Tipo de intenção de compra
- `tenant_id` - ID do tenant (CRÍTICO para multi-tenancy)
- `totvs_status` - Status da verificação TOTVS
- `website_encontrado`, `website_fit_score`, `website_products_match`, `linkedin_url` - Dados de website

## Solução
A migration `20250225000006_ensure_all_columns_icp_analysis_results.sql` garante que TODAS essas colunas existam na tabela `icp_analysis_results`.

## Como Aplicar

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/20250225000006_ensure_all_columns_icp_analysis_results.sql`
4. Execute o script

### Opção 2: Via CLI
```bash
supabase migration up
```

## Verificação
Após aplicar, verifique se todas as colunas foram criadas:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'icp_analysis_results' 
AND column_name IN (
  'website_encontrado', 'website_fit_score', 'website_products_match', 'linkedin_url',
  'fit_score', 'purchase_intent_score', 'purchase_intent_type',
  'tenant_id', 'totvs_status', 'company_id', 'raw_analysis'
)
ORDER BY column_name;
```

**Resultado esperado:** Todas as 11 colunas devem aparecer na lista.

## Impacto
- ✅ Migração de empresas de `companies` para `icp_analysis_results` funcionará sem erros
- ✅ Todas as colunas de website e LinkedIn serão preservadas
- ✅ Dados de fit_score e purchase_intent serão preservados
- ✅ Multi-tenancy funcionará corretamente com `tenant_id`
- ✅ Constraint de `origem` será removido para permitir nomes de arquivo

## Próximos Passos
1. Aplicar esta migration
2. Testar migração de uma empresa para Quarentena ICP
3. Verificar se todos os dados foram preservados corretamente




