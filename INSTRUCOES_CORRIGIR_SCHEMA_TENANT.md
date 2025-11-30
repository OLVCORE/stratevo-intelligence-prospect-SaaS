# 🔧 INSTRUÇÕES: Corrigir Schema do Tenant

## ❌ Problema

Erro: `schema "tenant_olv-internacional-comercio-importacao-e-exportacao-ltda-" does not exist`

O schema do tenant não foi criado automaticamente quando o tenant foi criado.

## ✅ Solução Rápida (Imediata)

Execute o script `CORRIGIR_SCHEMA_TENANT_EXISTENTE.sql` no Supabase SQL Editor:

1. Abra o arquivo: `CORRIGIR_SCHEMA_TENANT_EXISTENTE.sql`
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute (Run)
5. Deve aparecer: "✅ Schema criado com sucesso!"

Este script:
- ✅ Verifica se o tenant existe
- ✅ Cria o schema se não existir
- ✅ Cria todas as tabelas necessárias no schema

## ✅ Solução Definitiva (Atualizar Função)

Execute o script atualizado `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql` que já tem a correção para criar o schema automaticamente:

1. Abra: `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql`
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute (Run)

Agora a função `create_icp_profile` vai:
- ✅ Verificar se o schema existe
- ✅ Criar o schema automaticamente se não existir
- ✅ Criar todas as tabelas necessárias
- ✅ Criar o ICP normalmente

## 🔍 Verificar se Funcionou

Execute este query para verificar:

```sql
-- Verificar se o schema existe
SELECT 
  schema_name,
  '✅ Schema existe' as status
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%'
ORDER BY schema_name;

-- Verificar se as tabelas foram criadas
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_schema = 'tenant_olv-internacional-comercio-importacao-e-exportacao-ltda-'
ORDER BY table_name;
```

## 📝 Próximos Passos

Após executar o script:
1. ✅ Recarregue a página do onboarding
2. ✅ Tente gerar o ICP novamente
3. ✅ O erro deve desaparecer

