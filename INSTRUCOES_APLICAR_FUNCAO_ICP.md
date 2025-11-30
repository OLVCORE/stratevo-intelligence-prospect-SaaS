# 🔧 INSTRUÇÕES: Aplicar Função create_icp_profile

## ❌ Problema Atual

A função RPC `create_icp_profile` não está disponível no banco de dados, causando erro 404 ao tentar criar ICPs.

## ✅ Solução

Execute o script SQL `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql` no Supabase SQL Editor.

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New Query"

3. **Cole o conteúdo do arquivo**
   - Abra o arquivo: `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor

4. **Execute o script**
   - Clique em "Run" ou pressione Ctrl+Enter
   - Aguarde a execução (pode levar alguns segundos)

5. **Verificar sucesso**
   - Deve aparecer a mensagem: "✅ Função create_icp_profile criada/atualizada com sucesso!"
   - Se houver erros, verifique os logs

## 🔍 Verificar se a função existe

Execute esta query no SQL Editor para verificar:

```sql
SELECT 
  proname as function_name,
  pronargs as num_args,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_icp_profile' 
  AND pronamespace = 'public'::regnamespace;
```

Se retornar resultados, a função existe!

## 📝 Notas

- O script é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- A função cria automaticamente as tabelas necessárias se não existirem
- A função é `SECURITY DEFINER` (executa com privilégios elevados)

## 🚨 Se ainda houver erro

1. Verifique se a migration `20250120000000_create_multiple_icp_profiles.sql` foi aplicada
2. Verifique se há erros nos logs do Supabase
3. Verifique se a tabela `public.tenants` existe

