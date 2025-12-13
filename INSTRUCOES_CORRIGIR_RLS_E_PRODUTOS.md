# 🔧 INSTRUÇÕES: Corrigir RLS e Extrator de Produtos

## 📋 PROBLEMAS IDENTIFICADOS

1. **Erro 500 na tabela `users`**: Recursão infinita nas políticas RLS
2. **Extrator de produtos não funciona**: Botão "Extrair Produtos" não está funcionando
3. **Tenant não assume nome do CNPJ**: Nome não é atualizado quando CNPJ é buscado

## ✅ SOLUÇÕES APLICADAS

### 1. Nova Migration para Corrigir RLS

Foi criada a migration `20250218000001_fix_users_rls_recursion_final.sql` que:
- Remove todas as políticas antigas de `users` que podem causar recursão
- Cria políticas simples que usam APENAS `auth.uid()` diretamente
- Garante que `get_user_tenant_ids()` não causa recursão usando `SECURITY DEFINER`

### 2. Correção no Extrator de Produtos

O código foi atualizado para:
- Verificar se o tenant é UUID válido antes de chamar a Edge Function
- Mostrar mensagem apropriada se o tenant ainda é local
- Melhorar tratamento de erros CORS/rede

### 3. Melhoria na Atualização do Nome do Tenant

O código foi melhorado para:
- Disparar eventos mesmo quando há erro 500 (para atualizar UI)
- Garantir que o nome seja atualizado no localStorage mesmo se falhar no banco

## 📝 PASSOS PARA APLICAR

### PASSO 1: Aplicar a Nova Migration

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo: `supabase/migrations/20250218000001_fix_users_rls_recursion_final.sql`
4. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Cole no SQL Editor (Ctrl+V)
6. Clique em **Run** ou pressione **Ctrl+Enter**
7. Verifique se não há erros

### PASSO 2: Verificar se as Políticas Foram Criadas

Execute no SQL Editor:

```sql
-- Verificar políticas de users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

Você deve ver 4 políticas:
- `users_select_own_by_auth`
- `users_insert_own_by_auth`
- `users_update_own_by_auth`
- `users_delete_own_by_auth`

### PASSO 3: Testar a Aplicação

1. **Recarregue a página** (Ctrl+F5 para limpar cache)
2. **Crie um novo tenant** ou use um existente
3. **Busque o CNPJ** - o nome deve ser atualizado automaticamente
4. **Clique em "Extrair Produtos"** - deve funcionar se o tenant for UUID válido

## ⚠️ OBSERVAÇÕES IMPORTANTES

- **Se o tenant ainda for local** (ID começa com "local-tenant-"), o extrator de produtos NÃO funcionará até que o tenant seja criado no banco
- **Se ainda houver erro 500**, pode ser necessário aguardar alguns segundos para o Supabase processar as mudanças
- **O nome do tenant** será atualizado na UI mesmo se houver erro 500 temporário (via eventos)

## 🔍 VERIFICAÇÃO

Após aplicar a migration, verifique no console do navegador:
- ✅ Não deve mais aparecer erro 500 na tabela `users`
- ✅ O botão "Extrair Produtos" deve funcionar para tenants UUID
- ✅ O nome do tenant deve ser atualizado quando o CNPJ é buscado

## 📞 SE AINDA HOUVER PROBLEMAS

1. Verifique se a migration foi aplicada corretamente
2. Verifique se não há outras políticas RLS conflitantes
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Recarregue a página (Ctrl+F5)

