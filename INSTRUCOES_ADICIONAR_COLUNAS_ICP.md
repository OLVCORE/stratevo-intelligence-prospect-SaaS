# 🔧 INSTRUÇÕES: Adicionar Colunas Faltantes na Tabela icp_profile

## ❌ Problema Atual

Erro: `column "nome" of relation "icp_profile" does not exist`

A tabela `icp_profile` no schema do tenant foi criada com a estrutura antiga (sem as colunas `nome`, `descricao`, `tipo`, etc.).

## ✅ Solução Imediata

Execute o script `ADICIONAR_COLUNAS_ICP_PROFILE.sql` para adicionar as colunas faltantes:

1. **Abra o arquivo:** `ADICIONAR_COLUNAS_ICP_PROFILE.sql`
2. **Copie TODO o conteúdo**
3. **Cole no Supabase SQL Editor**
4. **Execute (Run)**
5. **Deve aparecer:** "✅ Atualização concluída!"

Este script:
- ✅ Verifica todos os tenants existentes
- ✅ Adiciona as colunas faltantes na tabela `icp_profile` de cada tenant
- ✅ Atualiza valores padrão para registros existentes

## ✅ Solução Definitiva

Depois, execute o script atualizado `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql`:

1. **Abra:** `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql`
2. **Copie TODO o conteúdo**
3. **Cole no Supabase SQL Editor**
4. **Execute (Run)**

A função agora adiciona automaticamente as colunas faltantes se a tabela já existir.

## 🔍 Verificar se Funcionou

Execute esta query para verificar:

```sql
-- Verificar se as colunas existem
SELECT 
  t.nome as tenant_name,
  t.schema_name,
  c.column_name,
  c.data_type
FROM public.tenants t
CROSS JOIN LATERAL (
  SELECT column_name, data_type
  FROM information_schema.columns 
  WHERE table_schema = t.schema_name 
    AND table_name = 'icp_profile'
    AND column_name IN ('nome', 'descricao', 'tipo', 'setor_foco', 'nicho_foco', 'ativo', 'icp_principal')
) c
WHERE EXISTS (
  SELECT 1 FROM information_schema.schemata 
  WHERE schema_name = t.schema_name
)
ORDER BY t.nome, c.column_name;
```

## 📝 Próximos Passos

Após executar o script:
1. ✅ Recarregue a página do onboarding
2. ✅ Tente gerar o ICP novamente
3. ✅ O erro deve desaparecer
4. ✅ O ICP será criado com sucesso

